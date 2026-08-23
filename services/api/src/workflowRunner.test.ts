import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { listPendingCandidates } from './candidateStore.ts';
import { readAttachment, writeGraph } from './workflowStore.ts';
import { runNextNode, startRun } from './workflowRunner.ts';
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
