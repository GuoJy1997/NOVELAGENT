import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import type { CharacterFile, DocumentName } from './projectTypes.ts';

export type { CharacterFile, CharacterRecord, DocumentName, RecipeId, RelationshipRecord } from './projectTypes.ts';

export interface ChapterMeta { num: number; title: string; status: string; words: number; file?: string }
export interface ProjectMeta {
  id: string; title: string; currentChapter: number; chapters: ChapterMeta[];
  cover?: string; chaptersDir?: string; rootPath?: string;
}
export interface ChapterContent { num: number; title: string; content: string }

interface ProjectFile {
  id: string; title: string; currentChapter: number;
  chapters: Array<{ num: number; title: string; status: string; file?: string }>;
  cover?: string; chaptersDir?: string;
}

export function countWords(text: string): number {
  const cjk = (text.match(/[一-鿿]/g) ?? []).length;
  const latin = (text.replace(/[一-鿿]/g, ' ').match(/[A-Za-z0-9']+/g) ?? []).length;
  return cjk + latin;
}

const chapterFile = (num: number) => `ch_${String(num).padStart(2, '0')}.md`;
const documentFile = (name: DocumentName) => `${name}.md`;

function chapterPath(root: string, chapter: { num: number; file?: string }): string {
  if (chapter.file) {
    const resolved = resolve(root, chapter.file);
    const rel = relative(resolve(root), resolved);
    if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) {
      throw new Error(`Chapter file escapes project root: ${chapter.file}`);
    }
    return resolved;
  }
  return join(root, 'chapters', chapterFile(chapter.num));
}

function uniqueTmp(target: string): string {
  return `${target}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`;
}

function isReplaceError(err: unknown): boolean {
  return Boolean(err && typeof err === 'object' && 'code' in err && (err.code === 'EPERM' || err.code === 'EEXIST'));
}

export async function atomicWrite(target: string, content: string): Promise<void> {
  const tmp = uniqueTmp(target);
  await writeFile(tmp, content, 'utf8');
  try {
    await rename(tmp, target);
    return;
  } catch (err) {
    if (!isReplaceError(err)) {
      await rm(tmp, { force: true }).catch(() => undefined);
      throw err;
    }
  }

  const retryTmp = uniqueTmp(target);
  await writeFile(retryTmp, content, 'utf8');
  await rm(tmp, { force: true }).catch(() => undefined);
  try {
    await rename(retryTmp, target);
    return;
  } catch (err) {
    if (!isReplaceError(err)) {
      await rm(retryTmp, { force: true }).catch(() => undefined);
      throw err;
    }
  }

  await rm(target, { force: true });
  try {
    await rename(retryTmp, target);
  } catch {
    try {
      await writeFile(target, content, 'utf8');
    } catch (writeErr) {
      await rm(retryTmp, { force: true }).catch(() => undefined);
      throw writeErr;
    }
    await rm(retryTmp, { force: true }).catch(() => undefined);
  }
}

async function readProjectFile(root: string): Promise<ProjectFile> {
  return JSON.parse(await readFile(join(root, 'project.json'), 'utf8')) as ProjectFile;
}

export function projectRelations(file: CharacterFile): string {
  const people = file.characters.map((c) => [
    `- id: ${c.id}`,
    `  name: ${c.name}`,
    `  role: ${c.role}`,
    `  goal: ${c.goal ?? ''}`,
    `  knows: ${c.knows ?? ''}`,
  ].join('\n')).join('\n');
  const rels = file.relationships.map((r) => [
    `- from: ${r.fromCharacterId}`,
    `  to: ${r.toCharacterId}`,
    `  kind: ${r.kind}`,
    `  label: ${r.label}`,
    `  tension: ${r.tension}`,
  ].join('\n')).join('\n');
  return `# Characters\n${people}\n\n# Relations\n${rels}\n`;
}

export async function readDocument(root: string, name: DocumentName): Promise<string> {
  return readFile(join(root, documentFile(name)), 'utf8');
}

export async function writeDocument(root: string, name: DocumentName, content: string): Promise<void> {
  if (name === 'relations') throw new Error('relations document is projected from characters.json');
  await atomicWrite(join(root, documentFile(name)), content);
}

export async function readCharacters(root: string): Promise<CharacterFile> {
  try {
    return JSON.parse(await readFile(join(root, 'characters.json'), 'utf8')) as CharacterFile;
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      return { characters: [], relationships: [] };
    }
    throw err;
  }
}

export async function writeCharacters(root: string, file: CharacterFile): Promise<void> {
  await atomicWrite(join(root, 'characters.json'), JSON.stringify(file, null, 2));
  await atomicWrite(join(root, documentFile('relations')), projectRelations(file));
}

export async function readProject(root: string): Promise<ProjectMeta> {
  const file = await readProjectFile(root);
  const chapters: ChapterMeta[] = [];
  for (const chapter of file.chapters) {
    let words = 0;
    try {
      words = countWords(await readFile(chapterPath(root, chapter), 'utf8'));
    } catch { words = 0; }
    chapters.push({ ...chapter, words });
  }
  return { ...file, chapters };
}

export async function readChapter(root: string, num: number): Promise<ChapterContent> {
  const file = await readProjectFile(root);
  const meta = file.chapters.find((chapter) => chapter.num === num);
  if (!meta) throw new Error(`Unknown chapter ${num}`);
  const content = await readFile(chapterPath(root, meta), 'utf8');
  return { num, title: meta.title, content };
}

export async function writeChapter(root: string, num: number, content: string): Promise<{ words: number }> {
  const file = await readProjectFile(root);
  const meta = file.chapters.find((chapter) => chapter.num === num);
  if (!meta) throw new Error(`Unknown chapter ${num}`);
  const target = chapterPath(root, meta);
  await mkdir(dirname(target), { recursive: true });
  await atomicWrite(target, content);
  return { words: countWords(content) };
}
