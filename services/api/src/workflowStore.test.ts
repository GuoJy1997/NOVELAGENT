import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidGraphName, listGraphs, listRuns, readAttachment, readGraph, readRun,
  writeAttachment, writeGraph, writeRun,
} from './workflowStore.ts';
import type { WorkflowGraph, WorkflowRun } from './workflowTypes.ts';

const graph: WorkflowGraph = {
  name: 'daily',
  model: 'hermes-agent',
  nodes: [{ id: 'scan', type: 'explore', title: '盘点', goal: '盘点', skills: [], config: { sourcePaths: ['outline.md'] } }],
  edges: [],
};

describe('workflowStore', () => {
  let root: string;
  before(async () => { root = await mkdtemp(join(tmpdir(), 'novelora-wfstore-')); });
  after(() => rm(root, { recursive: true, force: true }));

  it('round-trips graphs and lists them by name', async () => {
    await writeGraph(root, graph);
    assert.deepEqual(await readGraph(root, 'daily'), graph);
    assert.deepEqual(await listGraphs(root), ['daily']);
    assert.deepEqual(await listGraphs(await mkdtemp(join(tmpdir(), 'novelora-empty-'))), []);
  });

  it('rejects unsafe graph names and unknown graphs', async () => {
    assert.equal(isValidGraphName('../evil'), false);
    await assert.rejects(readGraph(root, '../evil'), /Invalid graph name/);
    await assert.rejects(readGraph(root, 'missing'), /Unknown graph missing/);
  });

  it('round-trips runs', async () => {
    const run: WorkflowRun = {
      id: crypto.randomUUID(),
      graphName: 'daily',
      status: 'running',
      nodes: { scan: { nodeId: 'scan', status: 'pending', retriesUsed: 0 } },
      createdAt: new Date().toISOString(),
    };
    await writeRun(root, run);
    assert.deepEqual(await readRun(root, run.id), run);
    assert.equal((await listRuns(root)).length, 1);
    await assert.rejects(readRun(root, 'not-a-uuid'), /Invalid run id/);
    await assert.rejects(readRun(root, crypto.randomUUID()), /Unknown run/);
  });

  it('writes attachments under workflow/attachments and reads them back', async () => {
    const runId = crypto.randomUUID();
    const relPath = await writeAttachment(root, runId, 'scan', '盘点结果');
    assert.equal(relPath, `workflow/attachments/${runId}/scan.md`);
    assert.equal(await readAttachment(root, relPath), '盘点结果');
    await assert.rejects(readAttachment(root, '../outside.md'), /Unknown attachment/);
    await assert.rejects(readAttachment(root, 'chapters/ch_01.md'), /Unknown attachment/);
  });
});
