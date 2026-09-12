import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { acceptCandidate, discardCandidate, listPendingCandidates } from './candidateStore.ts';
import { writeGraph } from './workflowStore.ts';
import { resolveManual, runNextNode, startRun } from './workflowRunner.ts';
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

const acceptanceGraph: WorkflowGraph = {
  name: 'acceptance',
  model: 'hermes-agent',
  nodes: [
    { id: 'scan', type: 'explore', title: '盘点', goal: '盘点全书进度与伏笔', skills: [], config: { sourcePaths: ['outline.md', 'world.md'] } },
    { id: 'dna', type: 'gene', title: '拆书', goal: '提取骨架与文笔基因', skills: [], config: { sourcePaths: ['import/source-book.txt'], targetPath: 'genes/source-book.md' } },
    { id: 'draft', type: 'write', title: '写第一章', goal: '写第 1 章', skills: ['opening-hook'], config: { targetPath: 'chapters/ch_01.md' } },
    { id: 'wash', type: 'deai', title: '去 AI 味', goal: '消除 AI 痕迹', skills: [], config: { targetPath: 'chapters/ch_01.md', voiceSamplePath: 'import/voice-sample.md' } },
    { id: 'judge', type: 'review', title: '审查', goal: '审 OOC、逻辑、文笔', skills: [] },
    { id: 'door', type: 'gate', title: '门禁', goal: '低于 80 分打回', skills: [], config: { threshold: 80 } },
    { id: 'check', type: 'manual', title: '作者检查', goal: '作者过目后放行', skills: [] },
  ],
  edges: [
    { from: 'scan', to: 'draft', attachmentType: 'fact' },
    { from: 'dna', to: 'draft', attachmentType: 'gene' },
    { from: 'draft', to: 'wash', attachmentType: 'candidate_ref' },
    { from: 'wash', to: 'judge', attachmentType: 'candidate_ref' },
    { from: 'judge', to: 'door', attachmentType: 'report' },
    { from: 'door', to: 'draft', attachmentType: 'pass', loop: true, maxRetries: 2 },
    { from: 'door', to: 'check', attachmentType: 'pass' },
  ],
};

describe('workflow acceptance (spec section 11)', () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'novelora-wfe2e-'));
    await mkdir(join(root, 'chapters'), { recursive: true });
    await mkdir(join(root, 'import'), { recursive: true });
    await writeFile(join(root, 'outline.md'), '# 大纲\n第一卷：出海\n');
    await writeFile(join(root, 'world.md'), '规则：禁直呼潮名\n');
    await writeFile(join(root, 'import/source-book.txt'), '外部小说全文……\n');
    await writeFile(join(root, 'import/voice-sample.md'), '短句。爱用句号。\n');
    await writeFile(join(root, 'chapters/ch_01.md'), '');
    await writeGraph(root, acceptanceGraph);
  });
  afterEach(() => rm(root, { recursive: true, force: true }));

  it('runs 探索→基因→写作→去AI味→审查→门禁(打回一次)→人工 end to end', async () => {
    const bodies: Array<{ messages: Array<{ role: string; content: string }> }> = [];
    const replies = [
      '进度盘点：无已完成章',
      '基因：三幕骨架，短句风格',
      '初稿一版',
      '洗稿一版',
      '第 3 段节奏拖沓，建议改为短句收尾。\nSCORES: {"overall": 60}',
      '初稿二版',
      '洗稿二版',
      '节奏问题已修复。\nSCORES: {"overall": 95}',
    ];
    const hermesFetch = scriptedFetch(replies, bodies as unknown[]);

    let run = await startRun(root, 'acceptance');
    for (let i = 0; i < 20 && run.status === 'running'; i += 1) {
      run = await runNextNode(root, run.id, hermesFetch);
    }

    assert.equal(run.status, 'waiting_author');
    assert.equal(run.nodes.door.retriesUsed, 1);
    assert.equal(run.nodes.door.score, 95);
    assert.equal(replies.length, 0); // 8 次 Hermes 调用全部按序发生

    // 写作节点请求：skill 引用在 system，上游事实与基因在 user
    assert.match(bodies[2].messages[0].content, /opening-hook/);
    assert.match(bodies[2].messages[1].content, /进度盘点/);
    assert.match(bodies[2].messages[1].content, /三幕骨架/);
    // 基因节点请求带版权红线
    assert.match(bodies[1].messages[1].content, /复现性/);
    // 去 AI 味请求带作者样本
    assert.match(bodies[3].messages[1].content, /短句。爱用句号。/);

    // 真文件未动；产物只在候选区（基因 1 + 写作 2 + 洗稿 2）
    assert.equal(await readFile(join(root, 'chapters/ch_01.md'), 'utf8'), '');
    assert.equal((await listPendingCandidates(root)).length, 5);

    run = await resolveManual(root, run.id, 'check', { note: '放行' });
    assert.equal(run.status, 'done');

    // 作者接受最终洗稿候选后才落真文件
    await acceptCandidate(root, run.nodes.wash.candidateId!);
    assert.equal(await readFile(join(root, 'chapters/ch_01.md'), 'utf8'), '洗稿二版');
  });

  it('goes offline when Hermes dies and keeps finished attachments', async () => {
    let run = await startRun(root, 'acceptance');
    run = await runNextNode(root, run.id, scriptedFetch(['盘点结果']));
    assert.equal(run.nodes.scan.status, 'done');
    const deadFetch = (async () => { throw new Error('ECONNREFUSED'); }) as typeof fetch;
    run = await runNextNode(root, run.id, deadFetch);
    assert.equal(run.nodes.dna.status, 'failed');
    assert.equal(run.status, 'offline');
    assert.equal(run.nodes.scan.status, 'done'); // 已有产物完好
  });

  it('blocks the downstream node when its upstream candidate is discarded', async () => {
    const twoStep: WorkflowGraph = {
      name: 'two-step',
      model: 'hermes-agent',
      nodes: [
        { id: 'draft', type: 'write', title: '写', goal: '写第 2 章', skills: [], config: { targetPath: 'chapters/ch_02.md' } },
        { id: 'judge', type: 'review', title: '审', goal: '审第 2 章', skills: [] },
      ],
      edges: [{ from: 'draft', to: 'judge', attachmentType: 'candidate_ref' }],
    };
    await writeGraph(root, twoStep);
    const hermesFetch = scriptedFetch(['初稿']);
    let run = await startRun(root, 'two-step');
    run = await runNextNode(root, run.id, hermesFetch);
    await discardCandidate(root, run.nodes.draft.candidateId!);
    run = await runNextNode(root, run.id, hermesFetch);
    assert.equal(run.nodes.judge.status, 'blocked');
    assert.equal(run.status, 'blocked');
  });
});
