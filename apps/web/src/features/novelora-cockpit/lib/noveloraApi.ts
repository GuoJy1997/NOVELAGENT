import type { WorkflowGraph, WorkflowRun } from './workflowTypes';

export interface ChapterMeta { num: number; title: string; status: string; words: number }
export interface ProjectMeta { id: string; title: string; currentChapter: number; chapters: ChapterMeta[]; rootPath?: string }
export interface ChapterContent { num: number; title: string; content: string }

export interface WorkspaceRecord { id: string; title: string; rootPath: string; addedAt: string }
export interface ProjectFiles { dirs: string[]; files: string[]; images: string[] }

const BASE = '/api/projects';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = init === undefined ? await fetch(path) : await fetch(path, init);
  if (!response.ok) throw new Error(`API ${response.status}`);
  return (await response.json()) as T;
}

export function fetchProject(projectId: string): Promise<ProjectMeta> {
  return request(`${BASE}/${projectId}`);
}

export function fetchChapter(num: number, projectId: string): Promise<ChapterContent> {
  return request(`${BASE}/${projectId}/chapters/${num}`);
}

export function saveChapter(num: number, content: string, projectId: string): Promise<{ words: number }> {
  return request(`${BASE}/${projectId}/chapters/${num}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

export type DocumentName = 'outline' | 'world' | 'canon' | 'relations';
export type RecipeId = 'chapter' | 'act' | 'volume';

export interface CharacterRecord {
  id: string;
  name: string;
  role: string;
  goal?: string;
  knows?: string;
  x?: number;
  y?: number;
}

export interface RelationshipRecord {
  id: string;
  fromCharacterId: string;
  toCharacterId: string;
  label: string;
  tension: string;
  kind: string;
}

export interface CharacterFile {
  characters: CharacterRecord[];
  relationships: RelationshipRecord[];
}

export interface RecipeTask {
  id: string;
  recipe: RecipeId;
  status: string;
  step: string;
  model: string;
  chapterNums: number[];
  currentIndex: number;
  log: string[];
  createdAt: string;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function listWorkspaces(): Promise<WorkspaceRecord[]> {
  return request('/api/workspaces');
}

export function registerWorkspace(path: string): Promise<ProjectMeta> {
  return request('/api/workspaces', jsonInit('POST', { path }));
}

export async function pickWorkspaceFolder(title = '选择文件夹'): Promise<string | null> {
  const selectDirectory = window.noveloraDesktop?.selectDirectory;
  if (selectDirectory) return selectDirectory(title);
  const result = await request<{ path: string | null }>('/api/workspaces/browse', jsonInit('POST', { title }));
  return result.path;
}

export async function pickWorkspaceFile(title = '选择文件'): Promise<string | null> {
  const selectFile = window.noveloraDesktop?.selectFile;
  if (selectFile) return selectFile(title);
  const result = await request<{ path: string | null }>('/api/workspaces/browse-file', jsonInit('POST', { title }));
  return result.path;
}

function isFsAbsolute(path: string): boolean {
  return path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path);
}

export function fetchTextFile(path: string, projectId: string): Promise<{ content: string }> {
  if (isFsAbsolute(path)) {
    return request(`/api/local-text?path=${encodeURIComponent(path)}`);
  }
  return fetchFileContent(path, projectId);
}

export function setChaptersDir(dir: string, projectId: string): Promise<ProjectMeta> {
  return request(`${BASE}/${projectId}/chapters-dir`, jsonInit('PUT', { dir }));
}

export function listProjectFiles(projectId: string): Promise<ProjectFiles> {
  return request(`${BASE}/${projectId}/files`);
}

export function fetchFileContent(path: string, projectId: string): Promise<{ content: string }> {
  return request(`${BASE}/${projectId}/file-content?path=${encodeURIComponent(path)}`);
}

export function coverUrl(projectId: string): string {
  return `${BASE}/${projectId}/cover`;
}

export function setCover(file: string, projectId: string): Promise<ProjectMeta> {
  return request(`${BASE}/${projectId}/cover`, jsonInit('PUT', { file }));
}

export function generateCover(projectId: string): Promise<ProjectMeta> {
  return request(`${BASE}/${projectId}/cover/generate`, jsonInit('POST', {}));
}

export function fetchDocument(name: DocumentName, projectId: string): Promise<{ content: string }> {
  return request(`${BASE}/${projectId}/documents/${name}`);
}

export function saveDocument(
  name: DocumentName,
  content: string,
  projectId: string,
): Promise<{ content: string }> {
  return request(`${BASE}/${projectId}/documents/${name}`, jsonInit('PUT', { content }));
}

export function fetchCharacters(projectId: string): Promise<CharacterFile> {
  return request(`${BASE}/${projectId}/characters`);
}

export function saveCharacters(file: CharacterFile, projectId: string): Promise<CharacterFile> {
  return request(`${BASE}/${projectId}/characters`, jsonInit('PUT', file));
}

export function fetchTasks(projectId: string): Promise<RecipeTask[]> {
  return request(`${BASE}/${projectId}/tasks`);
}

export function createTask(
  input: { recipe: RecipeId; chapterNums: number[]; model?: string },
  projectId: string,
): Promise<RecipeTask> {
  return request(`${BASE}/${projectId}/tasks`, jsonInit('POST', input));
}

export function fetchTask(taskId: string, projectId: string): Promise<RecipeTask> {
  return request(`${BASE}/${projectId}/tasks/${taskId}`);
}

export function fetchDraft(
  taskId: string,
  num: number,
  projectId: string,
): Promise<{ content: string }> {
  return request(`${BASE}/${projectId}/drafts/${taskId}/${num}`);
}

export function acceptTaskDraft(
  taskId: string,
  chapterNum: number,
  projectId: string,
): Promise<{ ok: boolean }> {
  return request(`${BASE}/${projectId}/tasks/${taskId}/accept`, jsonInit('POST', { chapterNum }));
}

export function discardTaskDraft(
  taskId: string,
  chapterNum: number,
  projectId: string,
): Promise<{ ok: boolean }> {
  return request(`${BASE}/${projectId}/tasks/${taskId}/discard`, jsonInit('POST', { chapterNum }));
}

export function runTask(taskId: string, projectId: string): Promise<RecipeTask> {
  return request(`${BASE}/${projectId}/tasks/${taskId}/run`, jsonInit('POST', {}));
}

export function stopTask(taskId: string, projectId: string): Promise<RecipeTask> {
  return request(`${BASE}/${projectId}/tasks/${taskId}/stop`, jsonInit('POST', {}));
}

export type CandidateSource = 'dialog' | 'workflow';

export interface FileCandidate {
  id: string;
  runId: string;
  targetPath: string;
  source: CandidateSource;
  status: 'pending';
  createdAt: string;
}

export function fetchCandidates(projectId: string): Promise<FileCandidate[]> {
  return request(`${BASE}/${projectId}/candidates`);
}

export function fetchCandidate(
  id: string,
  projectId: string,
): Promise<FileCandidate & { content: string }> {
  return request(`${BASE}/${projectId}/candidates/${id}`);
}

export function createCandidate(
  input: { runId: string; targetPath: string; source: CandidateSource; content: string },
  projectId: string,
): Promise<FileCandidate> {
  return request(`${BASE}/${projectId}/candidates`, jsonInit('POST', input));
}

export function acceptCandidate(id: string, projectId: string): Promise<{ ok: boolean }> {
  return request(`${BASE}/${projectId}/candidates/${id}/accept`, jsonInit('POST', {}));
}

export function discardCandidate(id: string, projectId: string): Promise<{ ok: boolean }> {
  return request(`${BASE}/${projectId}/candidates/${id}/discard`, jsonInit('POST', {}));
}

export interface LlmModelRow {
  id: string;
  object?: string;
  owned_by?: string;
}

export interface LlmModelList {
  object: 'list';
  data: LlmModelRow[];
}

export async function fetchLlmModels(): Promise<LlmModelList> {
  const body = await request<{ object?: string; data?: LlmModelRow[] }>('/api/llm/models');
  return {
    object: 'list',
    data: Array.isArray(body.data) ? body.data.filter((row) => typeof row?.id === 'string') : [],
  };
}

async function readError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as
    | { error?: string; details?: string[] }
    | null;
  const details = Array.isArray(body?.details) ? body.details.join('；') : '';
  return details || body?.error || `API ${response.status}`;
}

export function fetchWorkflowGraphs(projectId: string): Promise<string[]> {
  return request(`${BASE}/${projectId}/workflow/graphs`);
}

export async function fetchWorkflowGraph(
  name: string,
  projectId: string,
): Promise<WorkflowGraph | null> {
  const response = await fetch(`${BASE}/${projectId}/workflow/graphs/${name}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as WorkflowGraph;
}

export async function saveWorkflowGraph(
  graph: WorkflowGraph,
  projectId: string,
): Promise<{ ok: boolean; name: string }> {
  const response = await fetch(
    `${BASE}/${projectId}/workflow/graphs/${graph.name}`,
    jsonInit('PUT', { model: graph.model, nodes: graph.nodes, edges: graph.edges }),
  );
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as { ok: boolean; name: string };
}

export async function startWorkflowRun(
  graphName: string,
  projectId: string,
): Promise<WorkflowRun> {
  const response = await fetch(
    `${BASE}/${projectId}/workflow/runs`,
    jsonInit('POST', { graphName }),
  );
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as WorkflowRun;
}

export function fetchWorkflowRun(runId: string, projectId: string): Promise<WorkflowRun> {
  return request(`${BASE}/${projectId}/workflow/runs/${runId}`);
}

export function stepWorkflowRun(runId: string, projectId: string): Promise<WorkflowRun> {
  return request(`${BASE}/${projectId}/workflow/runs/${runId}/step`, jsonInit('POST', {}));
}

export function resolveWorkflowManual(
  runId: string,
  nodeId: string,
  projectId: string,
  note?: string,
): Promise<WorkflowRun> {
  return request(
    `${BASE}/${projectId}/workflow/runs/${runId}/manual`,
    jsonInit('POST', { nodeId, note }),
  );
}

export function rerunWorkflowNode(
  runId: string,
  nodeId: string,
  projectId: string,
): Promise<WorkflowRun> {
  return request(
    `${BASE}/${projectId}/workflow/runs/${runId}/rerun`,
    jsonInit('POST', { nodeId }),
  );
}
