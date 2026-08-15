import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DocumentName, RecipeId } from './projectTypes.ts';
import { readDocument } from './projectStore.ts';
import { readDraft, readTask, writeDraft, writeTask, type RecipeTask } from './taskStore.ts';

const HERMES_URL = process.env.HERMES_URL ?? 'http://127.0.0.1:8642';
const HERMES_KEY = 'novelora-dev-key';
const DOC_NAMES: DocumentName[] = ['outline', 'world', 'canon', 'relations'];

const SKILL_CHAPTER = [
  'Draft one chapter of prose from the provided context.',
  'Honor world rules and relations. Do not invent or overwrite world facts.',
  'Do not write world.md or characters.json. Return only the chapter prose.',
].join('\n');

const SKILL_ACT = [
  'Draft the next chapter in this act from the provided context.',
  'Keep continuity with neighboring chapters. Honor world rules and relations.',
  'Do not write world.md or characters.json. Return only the chapter prose.',
].join('\n');

const SKILL_VOLUME = [
  'Draft the next chapter in this volume from the provided context.',
  'Keep continuity across acts. Honor world rules and relations.',
  'Do not write world.md or characters.json. Return only the chapter prose.',
].join('\n');

class HermesFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HermesFailure';
  }
}

const chapterFile = (num: number) => `ch_${String(num).padStart(2, '0')}.md`;

function skillFor(recipe: RecipeId): string {
  if (recipe === 'act') return SKILL_ACT;
  if (recipe === 'volume') return SKILL_VOLUME;
  return SKILL_CHAPTER;
}

async function excerptChapter(root: string, num: number): Promise<string | undefined> {
  if (num < 1) return undefined;
  try {
    const text = await readFile(join(root, 'chapters', chapterFile(num)), 'utf8');
    return text.slice(0, 500);
  } catch {
    return undefined;
  }
}

async function readProjectJson(root: string): Promise<{
  acts?: Array<{ chapterNums?: number[] }>;
  chapters?: Array<{ num: number; title: string }>;
}> {
  try {
    return JSON.parse(await readFile(join(root, 'project.json'), 'utf8')) as {
      acts?: Array<{ chapterNums?: number[] }>;
      chapters?: Array<{ num: number; title: string }>;
    };
  } catch {
    return {};
  }
}

function isActEnd(acts: Array<{ chapterNums?: number[] }> | undefined, chapterNum: number): boolean {
  return (acts ?? []).some((act) => {
    const nums = act.chapterNums ?? [];
    return nums.includes(chapterNum) && nums[nums.length - 1] === chapterNum;
  });
}

async function canResume(root: string, task: RecipeTask): Promise<boolean> {
  if (task.status !== 'awaiting_accept') return false;
  if (task.currentIndex >= task.chapterNums.length) return false;
  try {
    await readDraft(root, task.id, task.chapterNums[task.currentIndex]);
    return false;
  } catch {
    return true;
  }
}

async function callHermes(
  hermesFetch: typeof fetch,
  model: string,
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  try {
    const res = await hermesFetch(`${HERMES_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HERMES_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, stream: false, messages }),
    });
    if (!res.ok) throw new Error(`hermes ${res.status}`);
    const data = await res.json() as { choices?: Array<{ message?: { content?: unknown } }> };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('hermes empty');
    return content;
  } catch (err) {
    if (err instanceof HermesFailure) throw err;
    throw new HermesFailure(err instanceof Error ? err.message : 'hermes failed');
  }
}

export async function assembleContext(root: string, chapterNum: number): Promise<string> {
  const docs: string[] = [];
  for (const name of DOC_NAMES) {
    try {
      docs.push(await readDocument(root, name));
    } catch {
      // optional documents may be missing
    }
  }
  const neighbors: string[] = [];
  for (const num of [chapterNum - 1, chapterNum + 1]) {
    const excerpt = await excerptChapter(root, num);
    if (excerpt) neighbors.push(excerpt);
  }
  return [...docs, ...neighbors].filter((part) => part.length > 0).join('\n\n');
}

async function stepReadContext(root: string, task: RecipeTask): Promise<RecipeTask> {
  const chapterNum = task.chapterNums[task.currentIndex];
  const context = await assembleContext(root, chapterNum);
  const log = task.log.slice();
  log[0] = context;
  const next: RecipeTask = { ...task, status: 'running', step: 'draft', log };
  await writeTask(root, next);
  return next;
}

async function stepDraft(root: string, task: RecipeTask, hermesFetch: typeof fetch): Promise<RecipeTask> {
  const chapterNum = task.chapterNums[task.currentIndex];
  const context = task.log[0] ?? await assembleContext(root, chapterNum);
  const project = await readProjectJson(root);
  const title = project.chapters?.find((chapter) => chapter.num === chapterNum)?.title;
  const brief = title ? `Chapter ${chapterNum}: ${title}` : `Chapter ${chapterNum}`;
  const content = await callHermes(hermesFetch, task.model, [
    { role: 'user', content: `${skillFor(task.recipe)}\n\n${context}\n\n${brief}` },
  ]);
  await writeDraft(root, task.id, chapterNum, content);
  const next: RecipeTask = { ...task, status: 'running', step: 'self_check' };
  await writeTask(root, next);
  return next;
}

async function stepSelfCheck(root: string, task: RecipeTask, hermesFetch: typeof fetch): Promise<RecipeTask> {
  const chapterNum = task.chapterNums[task.currentIndex];
  let world = '';
  let relations = '';
  try { world = await readDocument(root, 'world'); } catch { /* optional */ }
  try { relations = await readDocument(root, 'relations'); } catch { /* optional */ }
  const draft = await readDraft(root, task.id, chapterNum);
  const reply = await callHermes(hermesFetch, task.model, [
    {
      role: 'user',
      content: [
        'Check the draft for conflicts against world and relations only.',
        'Do not write or update world.md or characters.json.',
        `World:\n${world}`,
        `Relations:\n${relations}`,
        `Draft:\n${draft}`,
      ].join('\n\n'),
    },
  ]);
  const next: RecipeTask = { ...task, status: 'running', step: 'park_draft', log: [...task.log, reply] };
  await writeTask(root, next);
  return next;
}

async function stepParkDraft(root: string, task: RecipeTask): Promise<RecipeTask> {
  const chapterNum = task.chapterNums[task.currentIndex];
  const lastInRecipe = task.currentIndex >= task.chapterNums.length - 1;
  let next: RecipeTask;
  if (lastInRecipe) {
    next = { ...task, status: 'awaiting_accept', step: 'await_accept' };
  } else if (task.recipe === 'volume' && isActEnd((await readProjectJson(root)).acts, chapterNum)) {
    next = {
      ...task,
      currentIndex: task.currentIndex + 1,
      status: 'awaiting_accept',
      step: 'await_accept',
      log: [...task.log, 'pause:act'],
    };
  } else {
    next = {
      ...task,
      currentIndex: task.currentIndex + 1,
      status: 'running',
      step: 'read_context',
    };
  }
  await writeTask(root, next);
  return next;
}

export async function runTaskStep(
  root: string,
  taskId: string,
  hermesFetch: typeof fetch = fetch,
): Promise<RecipeTask> {
  let task = await readTask(root, taskId);

  if (await canResume(root, task)) {
    task = { ...task, status: 'running', step: 'read_context' };
    await writeTask(root, task);
  } else if (task.status === 'queued') {
    task = { ...task, status: 'running' };
    await writeTask(root, task);
  }

  if (task.status === 'blocked' || task.status === 'done' || task.step === 'await_accept') {
    return task;
  }

  try {
    if (task.step === 'read_context') return await stepReadContext(root, task);
    if (task.step === 'draft') return await stepDraft(root, task, hermesFetch);
    if (task.step === 'self_check') return await stepSelfCheck(root, task, hermesFetch);
    if (task.step === 'park_draft') return await stepParkDraft(root, task);
    return task;
  } catch (err) {
    if (err instanceof HermesFailure) {
      const blocked: RecipeTask = { ...task, status: 'blocked' };
      await writeTask(root, blocked);
      return blocked;
    }
    throw err;
  }
}
