import { mkdir, readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { RecipeId } from './projectTypes.ts';
import { atomicWrite, writeChapter } from './projectStore.ts';

export type TaskStatus = 'queued' | 'running' | 'awaiting_accept' | 'blocked' | 'done';
export type TaskStepId = 'read_context' | 'draft' | 'self_check' | 'park_draft' | 'await_accept';

export interface RecipeTask {
  id: string;
  recipe: RecipeId;
  status: TaskStatus;
  step: TaskStepId;
  model: string;
  chapterNums: number[];
  currentIndex: number;
  log: string[];
  createdAt: string;
}

const chapterFile = (num: number) => `ch_${String(num).padStart(2, '0')}.md`;
const taskFile = (root: string, id: string) => join(root, 'tasks', `${id}.json`);
const draftFile = (root: string, taskId: string, chapterNum: number) =>
  join(root, 'drafts', taskId, chapterFile(chapterNum));

function notFound(err: unknown): boolean {
  return err instanceof Error && 'code' in err && err.code === 'ENOENT';
}

export async function writeTask(root: string, task: RecipeTask): Promise<void> {
  await mkdir(join(root, 'tasks'), { recursive: true });
  await atomicWrite(taskFile(root, task.id), JSON.stringify(task, null, 2));
}

export async function createTask(
  root: string,
  input: { recipe: RecipeId; chapterNums: number[]; model?: string },
): Promise<RecipeTask> {
  const task: RecipeTask = {
    id: crypto.randomUUID(),
    recipe: input.recipe,
    status: 'queued',
    step: 'read_context',
    model: input.model ?? 'hermes-agent',
    chapterNums: input.chapterNums,
    currentIndex: 0,
    log: [],
    createdAt: new Date().toISOString(),
  };
  await writeTask(root, task);
  return task;
}

export async function readTask(root: string, id: string): Promise<RecipeTask> {
  try {
    return JSON.parse(await readFile(taskFile(root, id), 'utf8')) as RecipeTask;
  } catch (err) {
    if (notFound(err)) throw new Error(`Unknown task ${id}`);
    throw err;
  }
}

export async function listTasks(root: string): Promise<RecipeTask[]> {
  try {
    const names = await readdir(join(root, 'tasks'));
    const tasks: RecipeTask[] = [];
    for (const name of names) {
      if (!name.endsWith('.json')) continue;
      tasks.push(JSON.parse(await readFile(join(root, 'tasks', name), 'utf8')) as RecipeTask);
    }
    return tasks;
  } catch (err) {
    if (notFound(err)) return [];
    throw err;
  }
}

export async function writeDraft(root: string, taskId: string, chapterNum: number, content: string): Promise<void> {
  const dir = join(root, 'drafts', taskId);
  await mkdir(dir, { recursive: true });
  await atomicWrite(join(dir, chapterFile(chapterNum)), content);
}

export async function readDraft(root: string, taskId: string, chapterNum: number): Promise<string> {
  try {
    return await readFile(draftFile(root, taskId, chapterNum), 'utf8');
  } catch (err) {
    if (notFound(err)) throw new Error(`Unknown draft ${taskId} chapter ${chapterNum}`);
    throw err;
  }
}

export async function acceptDraft(root: string, taskId: string, chapterNum: number): Promise<void> {
  const content = await readDraft(root, taskId, chapterNum);
  await writeChapter(root, chapterNum, content);
  await rm(draftFile(root, taskId, chapterNum), { force: true });
  try {
    const task = await readTask(root, taskId);
    const lastChapter = task.chapterNums[task.chapterNums.length - 1];
    if (chapterNum === lastChapter) {
      await writeTask(root, { ...task, status: 'done' });
    }
  } catch {
    // Draft files can exist without a matching task record (store-level accept).
  }
}

export async function discardDraft(root: string, taskId: string, chapterNum: number): Promise<void> {
  try {
    await rm(draftFile(root, taskId, chapterNum));
  } catch (err) {
    if (notFound(err)) throw new Error(`Unknown draft ${taskId} chapter ${chapterNum}`);
    throw err;
  }
}
