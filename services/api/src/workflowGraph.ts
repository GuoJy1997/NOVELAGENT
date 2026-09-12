import { isAbsolute } from 'node:path';
import { isAllowedTargetPath } from './candidateStore.ts';
import { NODE_ID_PATTERN } from './workflowTypes.ts';
import type { AttachmentType, WorkflowGraph, WorkflowNodeType } from './workflowTypes.ts';

export const NODE_PRODUCES: Record<WorkflowNodeType, AttachmentType> = {
  explore: 'fact',
  gene: 'gene',
  outline: 'candidate_ref',
  write: 'candidate_ref',
  deai: 'candidate_ref',
  review: 'report',
  memory: 'candidate_ref',
  gate: 'pass',
  manual: 'author_decision',
};

export const NODE_ACCEPTS: Record<WorkflowNodeType, AttachmentType[]> = {
  explore: ['pass'],
  gene: ['pass'],
  outline: ['fact', 'gene', 'author_decision', 'pass'],
  write: ['fact', 'gene', 'candidate_ref', 'report', 'author_decision', 'pass'],
  deai: ['candidate_ref', 'author_decision', 'pass'],
  review: ['candidate_ref', 'fact', 'pass'],
  memory: ['author_decision', 'pass'],
  gate: ['report', 'pass'],
  manual: ['fact', 'report', 'gene', 'candidate_ref', 'author_decision', 'pass'],
};

export const CANDIDATE_NODE_TYPES: WorkflowNodeType[] = ['outline', 'write', 'deai', 'memory'];

/** 这些类型必须有对应类型的非 loop 入边，否则摆图就报错 */
const REQUIRED_IN: Partial<Record<WorkflowNodeType, AttachmentType>> = {
  deai: 'candidate_ref',
  review: 'candidate_ref',
  gate: 'report',
};

/** 需要 config.sourcePaths 非空的类型 */
const NEEDS_SOURCES: WorkflowNodeType[] = ['explore', 'gene', 'memory'];

const GRAPH_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

function badPath(path: string): boolean {
  return path.length === 0 || path.includes('..') || isAbsolute(path) || path.includes('\\');
}

export function validateGraph(graph: WorkflowGraph): string[] {
  const errors: string[] = [];
  if (!GRAPH_NAME_PATTERN.test(graph.name)) errors.push(`invalid graph name ${graph.name}`);
  if (typeof graph.model !== 'string' || graph.model.trim() === '') errors.push('graph model must be a non-empty string');

  const ids = new Set<string>();
  for (const node of graph.nodes) {
    if (!NODE_ID_PATTERN.test(node.id)) errors.push(`invalid node id ${node.id}`);
    if (ids.has(node.id)) errors.push(`duplicate node id ${node.id}`);
    ids.add(node.id);
    if (!(node.type in NODE_PRODUCES)) {
      errors.push(`unknown node type ${String(node.type)} on ${node.id}`);
      continue;
    }
    if (CANDIDATE_NODE_TYPES.includes(node.type)) {
      const target = node.config?.targetPath;
      if (!target || !isAllowedTargetPath(target)) errors.push(`node ${node.id} needs an allowed targetPath`);
    }
    if (node.type === 'gene') {
      const target = node.config?.targetPath;
      if (!target || !target.startsWith('genes/') || !isAllowedTargetPath(target)) {
        errors.push(`gene node ${node.id} needs a targetPath under genes/`);
      }
    }
    if (NEEDS_SOURCES.includes(node.type) && !(node.config?.sourcePaths?.length)) {
      errors.push(`node ${node.id} needs non-empty sourcePaths`);
    }
    for (const path of node.config?.sourcePaths ?? []) {
      if (badPath(path)) errors.push(`node ${node.id} has an unsafe source path ${path}`);
    }
    const voice = node.config?.voiceSamplePath;
    if (voice && badPath(voice)) errors.push(`node ${node.id} has an unsafe voiceSamplePath ${voice}`);
  }

  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const loopCount = new Map<string, number>();
  for (const edge of graph.edges) {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) {
      errors.push(`edge ${edge.from}->${edge.to} references an unknown node`);
      continue;
    }
    if (edge.loop) {
      if (from.type !== 'gate') errors.push(`loop edge must start at a gate node, not ${edge.from}`);
      if (!Number.isInteger(edge.maxRetries) || (edge.maxRetries ?? 0) < 1) {
        errors.push(`loop edge ${edge.from}->${edge.to} needs integer maxRetries >= 1`);
      }
      loopCount.set(edge.from, (loopCount.get(edge.from) ?? 0) + 1);
      continue;
    }
    if (NODE_PRODUCES[from.type] !== edge.attachmentType) {
      errors.push(`edge ${edge.from}->${edge.to}: node ${edge.from} produces ${NODE_PRODUCES[from.type]}, not ${edge.attachmentType}`);
    }
    if (!NODE_ACCEPTS[to.type].includes(edge.attachmentType)) {
      errors.push(`edge ${edge.from}->${edge.to}: node ${edge.to} does not accept ${edge.attachmentType}`);
    }
  }
  for (const [gateId, count] of loopCount) {
    if (count > 1) errors.push(`gate ${gateId} may have at most one loop edge`);
  }

  for (const node of graph.nodes) {
    const required = REQUIRED_IN[node.type];
    if (!required) continue;
    const has = graph.edges.some((edge) => !edge.loop && edge.to === node.id && edge.attachmentType === required);
    if (!has) errors.push(`node ${node.id} requires an upstream ${required} edge`);
  }

  if (errors.length === 0 && topoOrder(graph).length !== graph.nodes.length) {
    errors.push('graph has a cycle outside loop edges');
  }
  return errors;
}

/** Kahn 拓扑排序，忽略 loop 边；有环时返回长度不足的数组 */
export function topoOrder(graph: WorkflowGraph): string[] {
  const indegree = new Map<string, number>(graph.nodes.map((node) => [node.id, 0]));
  for (const edge of graph.edges) {
    if (edge.loop || !indegree.has(edge.to) || !indegree.has(edge.from)) continue;
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
  }
  const queue = graph.nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const edge of graph.edges) {
      if (edge.loop || edge.from !== id || !indegree.has(edge.to)) continue;
      const next = (indegree.get(edge.to) ?? 0) - 1;
      indegree.set(edge.to, next);
      if (next === 0) queue.push(edge.to);
    }
  }
  return order;
}

/** 从 startId 沿非 loop 边可达的所有节点（含自身） */
export function reachableFrom(graph: WorkflowGraph, startId: string): Set<string> {
  const seen = new Set<string>([startId]);
  const queue = [startId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of graph.edges) {
      if (edge.loop || edge.from !== current || seen.has(edge.to)) continue;
      seen.add(edge.to);
      queue.push(edge.to);
    }
  }
  return seen;
}

/** 门禁打回时要重置的节点：loopTarget 可达、且能到达 gate 的节点（不含 gate 本身） */
export function nodesToReset(graph: WorkflowGraph, loopTargetId: string, gateId: string): string[] {
  const forward = reachableFrom(graph, loopTargetId);
  const result: string[] = [];
  for (const id of forward) {
    if (id === gateId) continue;
    if (reachableFrom(graph, id).has(gateId)) result.push(id);
  }
  return result;
}
