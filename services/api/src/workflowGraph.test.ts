import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nodesToReset, topoOrder, validateGraph } from './workflowGraph.ts';
import type { WorkflowGraph } from './workflowTypes.ts';

function acceptanceGraph(): WorkflowGraph {
  return {
    name: 'acceptance',
    model: 'hermes-agent',
    nodes: [
      { id: 'scan', type: 'explore', title: '盘点', goal: '盘点全书', skills: [], config: { sourcePaths: ['outline.md'] } },
      { id: 'dna', type: 'gene', title: '拆书', goal: '提取基因', skills: [], config: { sourcePaths: ['import/book.txt'], targetPath: 'genes/book.md' } },
      { id: 'draft', type: 'write', title: '写作', goal: '写第 1 章', skills: ['opening-hook'], config: { targetPath: 'chapters/ch_01.md' } },
      { id: 'wash', type: 'deai', title: '去 AI 味', goal: '洗稿', skills: [], config: { targetPath: 'chapters/ch_01.md' } },
      { id: 'judge', type: 'review', title: '审查', goal: '审稿', skills: [] },
      { id: 'door', type: 'gate', title: '门禁', goal: '低分打回', skills: [], config: { threshold: 80 } },
      { id: 'check', type: 'manual', title: '作者检查', goal: '过目', skills: [] },
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
}

describe('validateGraph', () => {
  it('accepts the acceptance graph from the spec', () => {
    assert.deepEqual(validateGraph(acceptanceGraph()), []);
  });

  it('rejects edges to unknown nodes', () => {
    const graph = acceptanceGraph();
    graph.edges.push({ from: 'scan', to: 'ghost', attachmentType: 'fact' });
    assert.ok(validateGraph(graph).some((e) => e.includes('unknown node')));
  });

  it('rejects a candidate node without an allowed targetPath', () => {
    const graph = acceptanceGraph();
    delete graph.nodes[2].config;
    assert.ok(validateGraph(graph).some((e) => e.includes('targetPath')));
  });

  it('rejects an edge whose type does not match what the source produces', () => {
    const graph = acceptanceGraph();
    graph.edges[0] = { from: 'scan', to: 'draft', attachmentType: 'candidate_ref' };
    assert.ok(validateGraph(graph).some((e) => e.includes('produces fact')));
  });

  it('rejects a review node with no candidate_ref in-edge', () => {
    const graph = acceptanceGraph();
    graph.edges = graph.edges.filter((e) => !(e.to === 'judge' && e.attachmentType === 'candidate_ref'));
    assert.ok(validateGraph(graph).some((e) => e.includes('requires an upstream candidate_ref')));
  });

  it('rejects loop edges from non-gate nodes and loop edges without maxRetries', () => {
    const graph = acceptanceGraph();
    graph.edges.push({ from: 'draft', to: 'scan', attachmentType: 'pass', loop: true, maxRetries: 1 });
    assert.ok(validateGraph(graph).some((e) => e.includes('loop edge must start at a gate')));

    const graph2 = acceptanceGraph();
    const loop = graph2.edges.find((e) => e.loop);
    delete loop?.maxRetries;
    assert.ok(validateGraph(graph2).some((e) => e.includes('maxRetries')));
  });

  it('rejects cycles built from non-loop edges', () => {
    const graph = acceptanceGraph();
    graph.edges.push({ from: 'judge', to: 'wash', attachmentType: 'report' });
    // review 产 report，deai 不吃 report → 先撞类型错；改成合法类型也要撞环检测
    graph.edges[graph.edges.length - 1] = { from: 'check', to: 'scan', attachmentType: 'author_decision' };
    const errors = validateGraph(graph);
    assert.ok(errors.some((e) => e.includes('cycle')) || errors.some((e) => e.includes('does not accept')));
  });
});

describe('topoOrder / nodesToReset', () => {
  it('orders upstream before downstream, ignoring loop edges', () => {
    const order = topoOrder(acceptanceGraph());
    assert.ok(order.indexOf('scan') < order.indexOf('draft'));
    assert.ok(order.indexOf('draft') < order.indexOf('wash'));
    assert.ok(order.indexOf('judge') < order.indexOf('door'));
    assert.ok(order.indexOf('door') < order.indexOf('check'));
    assert.equal(order.length, 7);
  });

  it('resets exactly the nodes between the loop target and the gate', () => {
    const ids = nodesToReset(acceptanceGraph(), 'draft', 'door').sort();
    assert.deepEqual(ids, ['draft', 'judge', 'wash']);
  });
});
