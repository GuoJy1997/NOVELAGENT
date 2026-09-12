import { describe, expect, it } from 'vitest';
import {
  addCanvasNode,
  connectCanvasNodes,
  defaultNodeFor,
  layoutAcceptanceGraph,
  nextNodeId,
  novelSkillChoices,
} from './workflowCanvas';
import type { WorkflowGraph } from './workflowTypes';

describe('workflowCanvas', () => {
  it('allocates ids that stay within the engine pattern', () => {
    expect(nextNodeId([], 'explore')).toBe('explore');
    expect(nextNodeId([{ id: 'explore' }], 'explore')).toBe('explore-2');
    expect(nextNodeId([{ id: 'write' }, { id: 'write-2' }], 'write')).toBe('write-3');
  });

  it('gives new nodes the slots the engine requires to save', () => {
    expect(defaultNodeFor('explore', 'explore').config?.sourcePaths).toEqual(['state/facts.md']);
    expect(defaultNodeFor('write', 'write').config?.targetPath).toBe('chapters/ch_01.md');
    expect(defaultNodeFor('gene', 'gene').config).toEqual({
      sourcePaths: ['outline.md'],
      targetPath: 'genes/sample.md',
    });
    expect(defaultNodeFor('memory', 'memory').config).toEqual({
      sourcePaths: ['chapters/ch_01.md'],
      targetPath: 'state/facts.md',
    });
  });

  it('adds a positioned node and types the edge from what the source produces', () => {
    const withExplore = addCanvasNode({ name: 'daily', model: 'hermes-agent', nodes: [], edges: [] }, 'explore');
    const withWrite = addCanvasNode(withExplore, 'write');
    const connected = connectCanvasNodes(withWrite, 'explore', 'write');

    expect(connected.edges).toEqual([{ from: 'explore', to: 'write', attachmentType: 'fact' }]);
  });

  it('turns a cycle out of a gate into a loop edge', () => {
    let graph: WorkflowGraph = { name: 'daily', model: 'hermes-agent', nodes: [], edges: [] };
    graph = addCanvasNode(graph, 'write');
    graph = addCanvasNode(graph, 'review');
    graph = addCanvasNode(graph, 'gate');
    graph = connectCanvasNodes(graph, 'write', 'review');
    graph = connectCanvasNodes(graph, 'review', 'gate');
    graph = connectCanvasNodes(graph, 'gate', 'write');

    expect(graph.edges).toContainEqual({
      from: 'gate',
      to: 'write',
      attachmentType: 'pass',
      loop: true,
      maxRetries: 2,
    });
  });

  it('refuses an illegal attachment even before the server says no', () => {
    let graph: WorkflowGraph = { name: 'daily', model: 'hermes-agent', nodes: [], edges: [] };
    graph = addCanvasNode(graph, 'explore');
    graph = addCanvasNode(graph, 'gate');
    expect(() => connectCanvasNodes(graph, 'explore', 'gate')).toThrow(/does not accept/);
  });

  it('lays out the acceptance sample so every node has a board position', () => {
    const graph = layoutAcceptanceGraph();
    expect(graph.nodes.map((node) => node.id)).toEqual([
      'scan',
      'dna',
      'draft',
      'wash',
      'judge',
      'door',
      'check',
    ]);
    expect(graph.nodes.find((node) => node.id === 'draft')?.skills).toEqual(['novel-writing']);
    expect(graph.nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y))).toBe(true);
    expect(graph.edges.some((edge) => edge.loop)).toBe(true);
  });

  it('keeps writing skills and drops unrelated Hermes catalog noise', () => {
    const choices = novelSkillChoices(
      [
        { id: 'novel-writing', label: 'novel-writing', hint: '章节规划' },
        { id: 'github-pr-workflow', label: 'github-pr-workflow', hint: 'GitHub' },
        { id: 'kept-by-selection', label: 'kept-by-selection', hint: 'devops' },
      ],
      ['kept-by-selection'],
    );
    expect(choices.map((item) => item.id)).toEqual(['novel-writing', 'kept-by-selection']);
  });
});
