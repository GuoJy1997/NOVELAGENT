import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { callHermes, HermesFailure } from './hermesClient.ts';
import { readCandidateContent, writeCandidate } from './candidateStore.ts';
import { readAttachment, readGraph, readRun, writeAttachment, writeRun } from './workflowStore.ts';
import { CANDIDATE_NODE_TYPES, nodesToReset, reachableFrom, topoOrder, validateGraph } from './workflowGraph.ts';
import type {
  RunStatus, WorkflowEdge, WorkflowGraph, WorkflowNode, WorkflowRun,
} from './workflowTypes.ts';

const GENE_COPYRIGHT_RULES = [
  '版权红线：产物只能包含抽象后的叙事模型、语言指纹、技法规则与风格边界。',
  '禁止输出原句、原段或可替代原文阅读的情节复述。',
  '规则入选标准：复现性（同书出现不止一次）、生成力（能指导新场景）、排他性（不是所有小说通用的废话）。',
].join('\n');

const REVIEW_RULES = [
  '审查要求：每条意见必须定位到具体句段并给出改法，禁止「整体感觉不错」式空评。',
  '在报告最后单独输出一行，格式严格为：SCORES: {"overall": <0 到 100 的整数>}',
  '可以在该 JSON 里附加其他维度分数字段。',
].join('\n');

class MissingUpstream extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingUpstream';
  }
}

interface UpstreamPart { edge: WorkflowEdge; content: string }

export async function startRun(root: string, graphName: string): Promise<WorkflowRun> {
  const graph = await readGraph(root, graphName);
  const errors = validateGraph(graph);
  if (errors.length > 0) throw new Error(`Invalid graph ${graphName}: ${errors.join('; ')}`);
  const run: WorkflowRun = {
    id: crypto.randomUUID(),
    graphName,
    status: 'running',
    nodes: Object.fromEntries(graph.nodes.map((node) => [
      node.id, { nodeId: node.id, status: 'pending' as const, retriesUsed: 0 },
    ])),
    createdAt: new Date().toISOString(),
  };
  await writeRun(root, run);
  return run;
}

function pickNextNode(graph: WorkflowGraph, run: WorkflowRun): WorkflowNode | undefined {
  for (const id of topoOrder(graph)) {
    const state = run.nodes[id];
    if (!state || state.status !== 'pending') continue;
    const inEdges = graph.edges.filter((edge) => !edge.loop && edge.to === id);
    if (inEdges.every((edge) => run.nodes[edge.from]?.status === 'done')) {
      return graph.nodes.find((node) => node.id === id);
    }
  }
  return undefined;
}

function recomputeRunStatus(run: WorkflowRun): RunStatus {
  const states = Object.values(run.nodes);
  if (states.some((state) => state.status === 'failed')) return 'offline';
  if (states.some((state) => state.status === 'waiting_author')) return 'waiting_author';
  if (states.some((state) => state.status === 'blocked')) return 'blocked';
  if (states.every((state) => state.status === 'done')) return 'done';
  return 'running';
}

async function readSourceFile(root: string, path: string): Promise<string> {
  try {
    return await readFile(join(root, path), 'utf8');
  } catch {
    throw new MissingUpstream(`missing source file ${path}`);
  }
}

async function gatherUpstream(
  root: string, graph: WorkflowGraph, run: WorkflowRun, nodeId: string,
): Promise<UpstreamPart[]> {
  const parts: UpstreamPart[] = [];
  for (const edge of graph.edges) {
    if (edge.loop || edge.to !== nodeId || edge.attachmentType === 'pass') continue;
    const upstream = run.nodes[edge.from];
    if (edge.attachmentType === 'candidate_ref') {
      if (!upstream?.candidateId) throw new MissingUpstream(`missing candidate from node ${edge.from}`);
      try {
        parts.push({ edge, content: await readCandidateContent(root, upstream.candidateId) });
      } catch {
        throw new MissingUpstream(`candidate from node ${edge.from} was discarded`);
      }
    } else {
      if (!upstream?.attachmentPath) throw new MissingUpstream(`missing attachment from node ${edge.from}`);
      try {
        parts.push({ edge, content: await readAttachment(root, upstream.attachmentPath) });
      } catch {
        throw new MissingUpstream(`attachment from node ${edge.from} is gone`);
      }
    }
  }
  return parts;
}

async function buildNodeMessages(
  root: string, node: WorkflowNode, upstream: UpstreamPart[],
): Promise<Array<{ role: string; content: string }>> {
  const system = [
    'You are executing one node of an author-defined workflow. Run this node only.',
    'Do not change the route, add steps, or ask questions.',
    node.expert ? `Expert persona: ${node.expert}` : '',
    node.skills.length > 0 ? `Apply these Hermes skills: ${node.skills.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  const sections: string[] = [`Node goal:\n${node.goal}`];
  for (const part of upstream) {
    sections.push(`Upstream ${part.edge.attachmentType} from node ${part.edge.from}:\n${part.content}`);
  }
  for (const path of node.config?.sourcePaths ?? []) {
    sections.push(`Source file ${path}:\n${await readSourceFile(root, path)}`);
  }
  if (node.type === 'deai' && node.config?.voiceSamplePath) {
    sections.push(`Author voice sample:\n${await readSourceFile(root, node.config.voiceSamplePath)}`);
  }
  if (node.type === 'gene') sections.push(GENE_COPYRIGHT_RULES);
  if (node.type === 'review') sections.push(REVIEW_RULES);
  if (CANDIDATE_NODE_TYPES.includes(node.type)) {
    sections.push(`Return only the full new content for ${node.config?.targetPath}. No commentary.`);
  }
  return [
    { role: 'system', content: system },
    { role: 'user', content: sections.join('\n\n') },
  ];
}

async function executeModelNode(
  root: string, graph: WorkflowGraph, run: WorkflowRun, node: WorkflowNode, hermesFetch: typeof fetch,
): Promise<void> {
  const state = run.nodes[node.id];
  const upstream = await gatherUpstream(root, graph, run, node.id);
  const messages = await buildNodeMessages(root, node, upstream);
  const content = await callHermes(hermesFetch, node.model ?? graph.model, messages);

  if (node.type === 'gene') {
    const targetPath = node.config?.targetPath;
    if (!targetPath) throw new Error(`gene node ${node.id} is missing targetPath`);
    state.attachmentPath = await writeAttachment(root, run.id, node.id, content);
    const candidate = await writeCandidate(root, { runId: run.id, targetPath, source: 'workflow', content });
    state.candidateId = candidate.id;
  } else if (CANDIDATE_NODE_TYPES.includes(node.type)) {
    const targetPath = node.config?.targetPath;
    if (!targetPath) throw new Error(`node ${node.id} is missing targetPath`);
    const candidate = await writeCandidate(root, { runId: run.id, targetPath, source: 'workflow', content });
    state.candidateId = candidate.id;
  } else {
    state.attachmentPath = await writeAttachment(root, run.id, node.id, content);
  }
  state.status = 'done';
}

export function parseReportScores(content: string): Record<string, number> | undefined {
  const lines = content.split('\n');
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i].trim();
    if (!line.startsWith('SCORES:')) continue;
    try {
      const parsed = JSON.parse(line.slice('SCORES:'.length).trim()) as Record<string, unknown>;
      const scores: Record<string, number> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'number') scores[key] = value;
      }
      return scores;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

async function executeGate(
  root: string, graph: WorkflowGraph, run: WorkflowRun, node: WorkflowNode,
): Promise<void> {
  const state = run.nodes[node.id];
  const upstream = await gatherUpstream(root, graph, run, node.id);
  const report = upstream.find((part) => part.edge.attachmentType === 'report');
  const scores = report ? parseReportScores(report.content) : undefined;
  const field = node.config?.scoreField ?? 'overall';
  const threshold = node.config?.threshold;

  if (!scores || typeof scores[field] !== 'number' || typeof threshold !== 'number') {
    state.status = 'waiting_author';
    state.error = 'no usable score; author decision required';
    return;
  }

  state.score = scores[field];
  if (scores[field] >= threshold) {
    state.status = 'done';
    return;
  }

  const loopEdge = graph.edges.find((edge) => edge.loop && edge.from === node.id);
  if (!loopEdge) {
    state.status = 'blocked';
    state.error = `score ${scores[field]} < ${threshold} and no loop edge`;
    return;
  }
  if (state.retriesUsed >= (loopEdge.maxRetries ?? 0)) {
    state.status = 'blocked';
    state.error = `score ${scores[field]} < ${threshold}, retries exhausted`;
    return;
  }
  state.retriesUsed += 1;
  for (const id of nodesToReset(graph, loopEdge.to, node.id)) {
    run.nodes[id] = { nodeId: id, status: 'pending', retriesUsed: run.nodes[id].retriesUsed };
  }
  state.status = 'pending';
}

export async function runNextNode(
  root: string, runId: string, hermesFetch: typeof fetch = fetch,
): Promise<WorkflowRun> {
  const run = await readRun(root, runId);
  if (run.status === 'done' || run.status === 'offline') return run;
  const graph = await readGraph(root, run.graphName);
  const node = pickNextNode(graph, run);
  if (!node) {
    run.status = recomputeRunStatus(run);
    await writeRun(root, run);
    return run;
  }

  const state = run.nodes[node.id];
  state.status = 'running';
  state.startedAt = new Date().toISOString();
  await writeRun(root, run);

  try {
    if (node.type === 'manual') {
      state.status = 'waiting_author';
    } else if (node.type === 'gate') {
      await executeGate(root, graph, run, node);
    } else {
      await executeModelNode(root, graph, run, node, hermesFetch);
    }
  } catch (err) {
    if (err instanceof MissingUpstream) {
      state.status = 'blocked';
      state.error = err.message;
    } else if (err instanceof HermesFailure) {
      state.status = 'failed';
      state.error = err.message;
    } else {
      throw err;
    }
  }
  state.finishedAt = new Date().toISOString();
  delete state.forceRerun;
  run.status = recomputeRunStatus(run);
  await writeRun(root, run);
  return run;
}

export async function resolveManual(
  root: string, runId: string, nodeId: string, decision: { note?: string },
): Promise<WorkflowRun> {
  const run = await readRun(root, runId);
  const state = run.nodes[nodeId];
  if (!state || state.status !== 'waiting_author') {
    throw new Error(`Node ${nodeId} is not waiting for the author`);
  }
  const graph = await readGraph(root, run.graphName);
  const node = graph.nodes.find((candidate) => candidate.id === nodeId);
  if (node?.type === 'manual') {
    state.attachmentPath = await writeAttachment(root, run.id, nodeId, decision.note ?? 'pass');
  }
  state.status = 'done';
  delete state.error;
  state.finishedAt = new Date().toISOString();
  run.status = recomputeRunStatus(run);
  await writeRun(root, run);
  return run;
}

export async function forceRerun(root: string, runId: string, nodeId: string): Promise<WorkflowRun> {
  const run = await readRun(root, runId);
  if (!run.nodes[nodeId]) throw new Error(`Unknown node ${nodeId}`);
  const graph = await readGraph(root, run.graphName);
  for (const id of reachableFrom(graph, nodeId)) {
    run.nodes[id] = { nodeId: id, status: 'pending', retriesUsed: 0 };
  }
  run.nodes[nodeId].forceRerun = true;
  run.status = 'running';
  await writeRun(root, run);
  return run;
}

