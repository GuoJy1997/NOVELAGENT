import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CharacterFile, DocumentName } from './projectTypes.ts';

export type { CharacterFile, CharacterRecord, DocumentName, RecipeId, RelationshipRecord } from './projectTypes.ts';

export interface ChapterMeta { num: number; title: string; status: string; words: number }
export interface ProjectMeta { id: string; title: string; currentChapter: number; chapters: ChapterMeta[] }
export interface ChapterContent { num: number; title: string; content: string }

interface ProjectFile {
  id: string; title: string; currentChapter: number;
  chapters: Array<{ num: number; title: string; status: string }>;
}

export function countWords(text: string): number {
  const cjk = (text.match(/[一-鿿]/g) ?? []).length;
  const latin = (text.replace(/[一-鿿]/g, ' ').match(/[A-Za-z0-9']+/g) ?? []).length;
  return cjk + latin;
}

const chapterFile = (num: number) => `ch_${String(num).padStart(2, '0')}.md`;
const documentFile = (name: DocumentName) => `${name}.md`;

export async function atomicWrite(target: string, content: string): Promise<void> {
  const tmp = `${target}.tmp`;
  await writeFile(tmp, content, 'utf8');
  await rm(target, { force: true });
  await rename(tmp, target);
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
      words = countWords(await readFile(join(root, 'chapters', chapterFile(chapter.num)), 'utf8'));
    } catch { words = 0; }
    chapters.push({ ...chapter, words });
  }
  return { ...file, chapters };
}

export async function readChapter(root: string, num: number): Promise<ChapterContent> {
  const file = await readProjectFile(root);
  const meta = file.chapters.find((chapter) => chapter.num === num);
  if (!meta) throw new Error(`Unknown chapter ${num}`);
  const content = await readFile(join(root, 'chapters', chapterFile(num)), 'utf8');
  return { num, title: meta.title, content };
}

export async function writeChapter(root: string, num: number, content: string): Promise<{ words: number }> {
  const file = await readProjectFile(root);
  if (!file.chapters.some((chapter) => chapter.num === num)) throw new Error(`Unknown chapter ${num}`);
  await mkdir(join(root, 'chapters'), { recursive: true });
  const target = join(root, 'chapters', chapterFile(num));
  await atomicWrite(target, content);
  return { words: countWords(content) };
}
