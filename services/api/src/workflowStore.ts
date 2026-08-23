import { mkdir, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { atomicWrite } from './projectStore.ts';
import { NODE_ID_PATTERN } from './workflowTypes.ts';
import type { WorkflowGraph, WorkflowRun } from './workflowTypes.ts';

const GRAPH_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidGraphName(name: string): boolean {
  return GRAPH_NAME_PATTERN.test(name);
}

function notFound(err: unknown): boolean {
  return err instanceof Error && 'code' in err && err.code === 'ENOENT';
}

function graphFile(root: string, name: string): string {
  if (!isValidGraphName(name)) throw new Error(`Invalid graph name ${name}`);
  return join(root, 'workflow', 'graphs', `${name}.json`);
}

function runFile(root: string, runId: string): string {
  if (!UUID_SHAPE.test(runId)) throw new Error(`Invalid run id ${runId}`);
  return join(root, 'workflow', 'runs', runId, 'run.json');
}

export async function writeGraph(root: string, graph: WorkflowGraph): Promise<void> {
  const target = graphFile(root, graph.name);
  await mkdir(join(root, 'workflow', 'graphs'), { recursive: true });
  await atomicWrite(target, JSON.stringify(graph, null, 2));
}

export async function readGraph(root: string, name: string): Promise<WorkflowGraph> {
  try {
    return JSON.parse(await readFile(graphFile(root, name), 'utf8')) as WorkflowGraph;
  } catch (err) {
    if (notFound(err)) throw new Error(`Unknown graph ${name}`);
    throw err;
  }
}

export async function listGraphs(root: string): Promise<string[]> {
  try {
    const names = await readdir(join(root, 'workflow', 'graphs'));
    return names.filter((name) => name.endsWith('.json')).map((name) => name.slice(0, -5)).sort();
  } catch (err) {
    if (notFound(err)) return [];
    throw err;
  }
}

export async function writeRun(root: string, run: WorkflowRun): Promise<void> {
  const target = runFile(root, run.id);
  await mkdir(join(root, 'workflow', 'runs', run.id), { recursive: true });
  await atomicWrite(target, JSON.stringify(run, null, 2));
}

export async function readRun(root: string, runId: string): Promise<WorkflowRun> {
  try {
    return JSON.parse(await readFile(runFile(root, runId), 'utf8')) as WorkflowRun;
  } catch (err) {
    if (notFound(err)) throw new Error(`Unknown run ${runId}`);
    throw err;
  }
}

export async function listRuns(root: string): Promise<WorkflowRun[]> {
  try {
    const ids = await readdir(join(root, 'workflow', 'runs'));
    const runs: WorkflowRun[] = [];
    for (const id of ids) {
      if (!UUID_SHAPE.test(id)) continue;
      try {
        runs.push(await readRun(root, id));
      } catch (err) {
        if (!(err instanceof Error && err.message.startsWith('Unknown run'))) throw err;
      }
    }
    return runs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch (err) {
    if (notFound(err)) return [];
    throw err;
  }
}

export async function writeAttachment(root: string, runId: string, nodeId: string, content: string): Promise<string> {
  if (!UUID_SHAPE.test(runId)) throw new Error(`Invalid run id ${runId}`);
  if (!NODE_ID_PATTERN.test(nodeId)) throw new Error(`Invalid node id ${nodeId}`);
  await mkdir(join(root, 'workflow', 'attachments', runId), { recursive: true });
  await atomicWrite(join(root, 'workflow', 'attachments', runId, `${nodeId}.md`), content);
  return `workflow/attachments/${runId}/${nodeId}.md`;
}

export async function readAttachment(root: string, relPath: string): Promise<string> {
  if (!relPath.startsWith('workflow/attachments/') || relPath.includes('..')) {
    throw new Error(`Unknown attachment ${relPath}`);
  }
  try {
    return await readFile(join(root, relPath), 'utf8');
  } catch (err) {
    if (notFound(err)) throw new Error(`Unknown attachment ${relPath}`);
    throw err;
  }
}
