export interface ChapterMeta { num: number; title: string; status: string; words: number }
export interface ProjectMeta { id: string; title: string; currentChapter: number; chapters: ChapterMeta[] }
export interface ChapterContent { num: number; title: string; content: string }

const BASE = '/api/projects';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = init === undefined ? await fetch(path) : await fetch(path, init);
  if (!response.ok) throw new Error(`API ${response.status}`);
  return (await response.json()) as T;
}

export function fetchProject(projectId = 'default-project'): Promise<ProjectMeta> {
  return request(`${BASE}/${projectId}`);
}

export function fetchChapter(num: number, projectId = 'default-project'): Promise<ChapterContent> {
  return request(`${BASE}/${projectId}/chapters/${num}`);
}

export function saveChapter(num: number, content: string, projectId = 'default-project'): Promise<{ words: number }> {
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

export function fetchDocument(name: DocumentName, projectId = 'default-project'): Promise<{ content: string }> {
  return request(`${BASE}/${projectId}/documents/${name}`);
}

export function saveDocument(
  name: DocumentName,
  content: string,
  projectId = 'default-project',
): Promise<{ content: string }> {
  return request(`${BASE}/${projectId}/documents/${name}`, jsonInit('PUT', { content }));
}

export function fetchCharacters(projectId = 'default-project'): Promise<CharacterFile> {
  return request(`${BASE}/${projectId}/characters`);
}

export function saveCharacters(file: CharacterFile, projectId = 'default-project'): Promise<CharacterFile> {
  return request(`${BASE}/${projectId}/characters`, jsonInit('PUT', file));
}

export function fetchTasks(projectId = 'default-project'): Promise<RecipeTask[]> {
  return request(`${BASE}/${projectId}/tasks`);
}

export function createTask(
  input: { recipe: RecipeId; chapterNums: number[]; model?: string },
  projectId = 'default-project',
): Promise<RecipeTask> {
  return request(`${BASE}/${projectId}/tasks`, jsonInit('POST', input));
}

export function fetchTask(taskId: string, projectId = 'default-project'): Promise<RecipeTask> {
  return request(`${BASE}/${projectId}/tasks/${taskId}`);
}

export function fetchDraft(
  taskId: string,
  num: number,
  projectId = 'default-project',
): Promise<{ content: string }> {
  return request(`${BASE}/${projectId}/drafts/${taskId}/${num}`);
}

export function acceptTaskDraft(
  taskId: string,
  chapterNum: number,
  projectId = 'default-project',
): Promise<{ ok: boolean }> {
  return request(`${BASE}/${projectId}/tasks/${taskId}/accept`, jsonInit('POST', { chapterNum }));
}

export function discardTaskDraft(
  taskId: string,
  chapterNum: number,
  projectId = 'default-project',
): Promise<{ ok: boolean }> {
  return request(`${BASE}/${projectId}/tasks/${taskId}/discard`, jsonInit('POST', { chapterNum }));
}

export function runTask(taskId: string, projectId = 'default-project'): Promise<RecipeTask> {
  return request(`${BASE}/${projectId}/tasks/${taskId}/run`, jsonInit('POST', {}));
}

export function stopTask(taskId: string, projectId = 'default-project'): Promise<RecipeTask> {
  return request(`${BASE}/${projectId}/tasks/${taskId}/stop`, jsonInit('POST', {}));
}
