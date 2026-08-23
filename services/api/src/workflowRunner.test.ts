import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { listPendingCandidates } from './candidateStore.ts';
import { readAttachment, readCache, writeCache, writeGraph } from './workflowStore.ts';
import { forceRerun, parseReportScores, resolveManual, runNextNode, startRun } from './workflowRunner.ts';
import type { WorkflowGraph } from './workflowTypes.ts';

function scriptedFetch(replies: string[], bodies: unknown[] = []): typeof fetch {
  return (async (_url: unknown, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body ?? '{}')));
    const content = replies.shift();
    if (content === undefined) throw new Error('scriptedFetch ran out of replies');
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

function chainGraph(): WorkflowGraph {
  return {
    name: 'chain',
    model: 'hermes-agent',
    nodes: [
      { id: 'scan', type: 'explore', title: '盘点', goal: '盘点世界观', skills: [], config: { sourcePaths: ['world.md'] } },
      { id: 'draft', type: 'write', title: '写作', goal: '写第 1 章', skills: ['opening-hook'], model: 'strong-model', config: { targetPath: 'chapters/ch_01.md' } },
      { id: 'wash', type: 'deai', title: '洗稿', goal: '去 AI 味', skills: [], config: { targetPath: 'chapters/ch_01.md', voiceSamplePath: 'voice.md' } },
      { id: 'judge', type: 'review', title: '审查', goal: '审第 1 章', skills: [] },
    ],
    edges: [
      { from: 'scan', to: 'draft', attachmentType: 'fact' },
      { from: 'draft', to: 'wash', attachmentType: 'candidate_ref' },
      { from: 'wash', to: 'judge', attachmentType: 'candidate_ref' },
    ],
  };
}

describe('workflowRunner core', () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'novelora-wfrun-'));
    await mkdir(join(root, 'chapters'), { recursive: true });
    await writeFile(join(root, 'world.md'), '规则：禁直呼潮名');
    await writeFile(join(root, 'voice.md'), '短句。爱用句号。');
    await writeFile(join(root, 'chapters/ch_01.md'), '');
  });

  it('startRun rejects graphs that fail validation', async () => {
    const bad = chainGraph();
    delete bad.nodes[2].config;
    await writeGraph(root, bad);
    await assert.rejects(startRun(root, 'chain'), /Invalid graph chain/);
  });

  it('walks the chain: attachment, candidates, and prompts are wired correctly', async () => {
    await writeGraph(root, chainGraph());
    const bodies: Array<{ model: string; messages: Array<{ role: string; content: string }> }> = [];
    const hermesFetch = scriptedFetch(['盘点：尚无完成章', '初稿正文', '洗稿正文', '审查意见'], bodies as unknown[]);
    let run = await startRun(root, 'chain');

    run = await runNextNode(root, run.id, hermesFetch); // scan
    assert.equal(run.nodes.scan.status, 'done');
    assert.equal(await readAttachment(root, run.nodes.scan.attachmentPath!), '盘点：尚无完成章');
    assert.equal(bodies[0].model, 'hermes-agent');
    assert.match(bodies[0].messages[1].content, /禁直呼潮名/); // sourcePaths 内容进了提示词

    run = await runNextNode(root, run.id, hermesFetch); // draft
    assert.equal(run.nodes.draft.status, 'done');
    assert.ok(run.nodes.draft.candidateId);
    assert.equal(bodies[1].model, 'strong-model'); // 单节点模型覆盖
    assert.match(bodies[1].messages[0].content, /opening-hook/); // skill 引用在 system
    assert.match(bodies[1].messages[1].content, /盘点：尚无完成章/); // 上游附件进提示词

    run = await runNextNode(root, run.id, hermesFetch); // wash
    assert.match(bodies[2].messages[1].content, /初稿正文/); // 上游候选内容
    assert.match(bodies[2].messages[1].content, /短句。爱用句号。/); // 作者样本

    run = await runNextNode(root, run.id, hermesFetch); // judge
    assert.equal(run.nodes.judge.status, 'done');
    assert.match(bodies[3].messages[1].content, /SCORES/); // 审查节点被要求输出分数行
    assert.equal(run.status, 'done');

    // 真文件没被碰，产物全在候选区
    assert.equal(await readFile(join(root, 'chapters/ch_01.md'), 'utf8'), '');
    assert.equal((await listPendingCandidates(root)).length, 2); // draft + wash
  });

  it('marks the node failed and the run offline when hermes dies', async () => {
    await writeGraph(root, chainGraph());
    const deadFetch = (async () => { throw new Error('ECONNREFUSED'); }) as typeof fetch;
    let run = await startRun(root, 'chain');
    run = await runNextNode(root, run.id, deadFetch);
    assert.equal(run.nodes.scan.status, 'failed');
    assert.equal(run.status, 'offline');
    run = await runNextNode(root, run.id, deadFetch); // offline 后不再执行
    assert.equal(run.status, 'offline');
  });

  it('blocks a node whose source file is missing', async () => {
    const graph = chainGraph();
    graph.nodes[0].config = { sourcePaths: ['ghost.md'] };
    await writeGraph(root, graph);
    let run = await startRun(root, 'chain');
    run = await runNextNode(root, run.id, scriptedFetch([]));
    assert.equal(run.nodes.scan.status, 'blocked');
    assert.equal(run.status, 'blocked');
  });

  it('pauses at a manual node with waiting_author', async () => {
    const graph: WorkflowGraph = {
      name: 'pause',
      model: 'hermes-agent',
      nodes: [
        { id: 'scan', type: 'explore', title: '盘点', goal: '盘点', skills: [], config: { sourcePaths: ['world.md'] } },
        { id: 'check', type: 'manual', title: '检查', goal: '作者过目', skills: [] },
      ],
      edges: [{ from: 'scan', to: 'check', attachmentType: 'fact' }],
    };
    await writeGraph(root, graph);
    let run = await startRun(root, 'pause');
    run = await runNextNode(root, run.id, scriptedFetch(['盘点']));
    run = await runNextNode(root, run.id, scriptedFetch([]));
    assert.equal(run.nodes.check.status, 'waiting_author');
    assert.equal(run.status, 'waiting_author');
  });
});

function gateGraph(threshold?: number): WorkflowGraph {
  return {
    name: 'gated',
    model: 'hermes-agent',
    nodes: [
      { id: 'draft', type: 'write', title: '写', goal: '写第 3 章', skills: [], config: { targetPath: 'chapters/ch_03.md' } },
      { id: 'judge', type: 'review', title: '审', goal: '审第 3 章', skills: [] },
      { id: 'door', type: 'gate', title: '门禁', goal: '低分打回', skills: [], config: threshold === undefined ? {} : { threshold } },
    ],
    edges: [
      { from: 'draft', to: 'judge', attachmentType: 'candidate_ref' },
      { from: 'judge', to: 'door', attachmentType: 'report' },
      { from: 'door', to: 'draft', attachmentType: 'pass', loop: true, maxRetries: 1 },
    ],
  };
}

describe('gate node', () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'novelora-wfgate-'));
    await mkdir(join(root, 'chapters'), { recursive: true });
    await writeFile(join(root, 'chapters/ch_03.md'), '');
  });

  it('parses the trailing SCORES line', () => {
    assert.deepEqual(parseReportScores('意见\nSCORES: {"overall": 72, "logic": 88}'), { overall: 72, logic: 88 });
    assert.equal(parseReportScores('没有分数行'), undefined);
    assert.equal(parseReportScores('SCORES: 不是JSON'), undefined);
  });

  it('passes when the score clears the threshold', async () => {
    await writeGraph(root, gateGraph(80));
    const hermesFetch = scriptedFetch(['稿', '好评\nSCORES: {"overall": 88}']);
    let run = await startRun(root, 'gated');
    run = await runNextNode(root, run.id, hermesFetch); // draft
    run = await runNextNode(root, run.id, hermesFetch); // judge
    run = await runNextNode(root, run.id, hermesFetch); // door
    assert.equal(run.nodes.door.status, 'done');
    assert.equal(run.nodes.door.score, 88);
    assert.equal(run.status, 'done');
  });

  it('retries once along the loop edge, then blocks when retries run out', async () => {
    await writeGraph(root, gateGraph(80));
    const hermesFetch = scriptedFetch([
      '稿1', '差\nSCORES: {"overall": 50}',
      '稿2', '还差\nSCORES: {"overall": 60}',
    ]);
    let run = await startRun(root, 'gated');
    for (let i = 0; i < 3; i += 1) run = await runNextNode(root, run.id, hermesFetch); // draft judge door
    assert.equal(run.nodes.door.retriesUsed, 1);
    assert.equal(run.nodes.draft.status, 'pending'); // 被打回
    assert.equal(run.nodes.judge.status, 'pending');
    assert.equal(run.status, 'running');
    for (let i = 0; i < 3; i += 1) run = await runNextNode(root, run.id, hermesFetch); // 第二轮
    assert.equal(run.nodes.door.status, 'blocked');
    assert.equal(run.status, 'blocked');
    assert.match(run.nodes.door.error ?? '', /retries exhausted/);
  });

  it('waits for the author when the report has no scores or the gate has no threshold', async () => {
    await writeGraph(root, gateGraph(80));
    const hermesFetch = scriptedFetch(['稿', '光有意见没有分数行']);
    let run = await startRun(root, 'gated');
    for (let i = 0; i < 3; i += 1) run = await runNextNode(root, run.id, hermesFetch);
    assert.equal(run.nodes.door.status, 'waiting_author');
    assert.equal(run.status, 'waiting_author');
  });
});

describe('manual node and force rerun', () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'novelora-wfmanual-'));
    await writeFile(join(root, 'world.md'), '设定');
  });

  const pauseGraph: WorkflowGraph = {
    name: 'pause',
    model: 'hermes-agent',
    nodes: [
      { id: 'scan', type: 'explore', title: '盘点', goal: '盘点', skills: [], config: { sourcePaths: ['world.md'] } },
      { id: 'check', type: 'manual', title: '检查', goal: '作者过目', skills: [] },
    ],
    edges: [{ from: 'scan', to: 'check', attachmentType: 'fact' }],
  };

  it('resolveManual writes the author decision as an attachment and finishes the run', async () => {
    await writeGraph(root, pauseGraph);
    let run = await startRun(root, 'pause');
    run = await runNextNode(root, run.id, scriptedFetch(['盘点']));
    run = await runNextNode(root, run.id, scriptedFetch([]));
    assert.equal(run.status, 'waiting_author');
    run = await resolveManual(root, run.id, 'check', { note: '走方向 B' });
    assert.equal(run.nodes.check.status, 'done');
    assert.equal(run.status, 'done');
    assert.equal(await readAttachment(root, run.nodes.check.attachmentPath!), '走方向 B');
  });

  it('rejects resolving a node that is not waiting', async () => {
    await writeGraph(root, pauseGraph);
    const run = await startRun(root, 'pause');
    await assert.rejects(resolveManual(root, run.id, 'scan', {}), /not waiting for the author/);
  });

  it('forceRerun resets the node and its downstream to pending with the rerun flag', async () => {
    await writeGraph(root, pauseGraph);
    let run = await startRun(root, 'pause');
    run = await runNextNode(root, run.id, scriptedFetch(['盘点']));
    run = await runNextNode(root, run.id, scriptedFetch([]));
    run = await resolveManual(root, run.id, 'check', {});
    assert.equal(run.status, 'done');
    run = await forceRerun(root, run.id, 'scan');
    assert.equal(run.nodes.scan.status, 'pending');
    assert.equal(run.nodes.scan.forceRerun, true);
    assert.equal(run.nodes.check.status, 'pending');
    assert.equal(run.status, 'running');
    await assert.rejects(forceRerun(root, run.id, 'ghost'), /Unknown node ghost/);
  });
});

describe('explore/gene attachment cache', () => {
  let root: string;
  const cacheGraph: WorkflowGraph = {
    name: 'cached',
    model: 'hermes-agent',
    nodes: [
      { id: 'scan', type: 'explore', title: '盘点', goal: '盘点', skills: [], config: { sourcePaths: ['world.md'] } },
      { id: 'check', type: 'manual', title: '检查', goal: '过目', skills: [] },
    ],
    edges: [{ from: 'scan', to: 'check', attachmentType: 'fact' }],
  };

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'novelora-wfcache-'));
    await writeFile(join(root, 'world.md'), '设定 v1');
    await writeGraph(root, cacheGraph);
  });

  it('store round-trips cache entries by fingerprint', async () => {
    await writeCache(root, 'scan', 'fp-1', '缓存内容');
    assert.equal(await readCache(root, 'scan', 'fp-1'), '缓存内容');
    assert.equal(await readCache(root, 'scan', 'fp-2'), undefined);
    assert.equal(await readCache(root, 'other', 'fp-1'), undefined);
  });

  it('reuses the cached attachment when sources are unchanged, recomputes when they change', async () => {
    let calls = 0;
    const countingFetch = (async () => {
      calls += 1;
      return new Response(JSON.stringify({ choices: [{ message: { content: `盘点第${calls}次` } }] }), { status: 200 });
    }) as typeof fetch;

    let run1 = await startRun(root, 'cached');
    run1 = await runNextNode(root, run1.id, countingFetch);
    assert.equal(calls, 1);
    assert.ok(!run1.nodes.scan.cached);

    let run2 = await startRun(root, 'cached');
    run2 = await runNextNode(root, run2.id, countingFetch);
    assert.equal(calls, 1); // 命中缓存，没调 Hermes
    assert.equal(run2.nodes.scan.cached, true);
    assert.equal(await readAttachment(root, run2.nodes.scan.attachmentPath!), '盘点第1次');

    await writeFile(join(root, 'world.md'), '设定 v2'); // 源变了
    let run3 = await startRun(root, 'cached');
    run3 = await runNextNode(root, run3.id, countingFetch);
    assert.equal(calls, 2);

    let run4 = await startRun(root, 'cached');
    run4 = await forceRerun(root, run4.id, 'scan'); // 作者强制重跑
    run4 = await runNextNode(root, run4.id, countingFetch);
    assert.equal(calls, 3);
  });
});
