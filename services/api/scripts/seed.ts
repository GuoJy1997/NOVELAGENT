import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { writeCharacters } from '../src/projectStore.ts';
import type { CharacterFile, RecipeId } from '../src/projectTypes.ts';

const CHAPTERS = [
  { num: 1, title: 'Ash on the Morning Tide', status: 'complete' },
  { num: 2, title: 'The Vow Beneath Glass', status: 'review' },
  { num: 3, title: 'Salt Map, Ember Mark', status: 'drafting' },
  { num: 4, title: 'The Queen of Broken Buoys', status: 'planned' },
  { num: 5, title: 'Voren Lights the False Star', status: 'planned' },
  { num: 6, title: 'Embers Under Black Water', status: 'planned' },
] as const;

const ACTS = [
  { id: 'act-1', title: 'Act I: The Ash Tide', chapterNums: [1, 2, 3] },
  { id: 'act-2', title: 'Act II: The Drowned Forge', chapterNums: [4, 5, 6] },
] as const;

const VOLUMES = [
  { id: 'vol-1', title: 'Volume I: Tides of Embers', actIds: ['act-1', 'act-2'] },
] as const;

const RECIPES: RecipeId[] = ['chapter', 'act', 'volume'];
const DEFAULT_MODEL = 'hermes-agent';

const SEED_CHARACTERS: CharacterFile = {
  characters: [
    { id: 'kael', name: 'Kael', role: 'Exiled tide-runner', goal: 'Find the drowned route', knows: 'Salt map fragments', x: 24, y: 58 },
    { id: 'liora', name: 'Liora', role: 'Lighthouse archivist', goal: 'Preserve the harbor history', knows: 'Archive cache locations', x: 72, y: 42 },
  ],
  relationships: [
    {
      id: 'kael-liora',
      fromCharacterId: 'kael',
      toCharacterId: 'liora',
      label: 'uneasy allies',
      tension: 'Liora trusts Kael with the map but not its final destination.',
      kind: 'ally',
    },
  ],
};

const actIdForChapter = (num: number): string => {
  const act = ACTS.find(({ chapterNums }) => chapterNums.includes(num));
  if (!act) throw new Error(`No act for chapter ${num}`);
  return act.id;
};

const placeholder = (title: string) => `# ${title}\n\nThe tide came in before dawn, carrying ash from the far shore.\n\nSelene read the salt map twice before she believed it.\n\nBy the third bell, the harbor had forgotten its own name.\n`;

export async function seedProject(dataRoot: string): Promise<void> {
  const root = join(dataRoot, 'default-project');
  await mkdir(join(root, 'chapters'), { recursive: true });
  const meta = {
    id: 'default-project',
    title: 'Tides of Embers',
    currentChapter: 3,
    volumes: VOLUMES,
    acts: ACTS,
    recipes: RECIPES,
    defaultModel: DEFAULT_MODEL,
    chapters: CHAPTERS.map(({ num, title, status }) => ({
      num,
      title,
      status,
      actId: actIdForChapter(num),
    })),
  };
  await writeProjectMeta(join(root, 'project.json'), meta);
  await writeIfAbsent(join(root, 'outline.md'), '# Tides of Embers Outline\n');
  await writeIfAbsent(join(root, 'world.md'), '# World\n');
  await writeIfAbsent(join(root, 'canon.md'), '# Canon\n');
  await seedCharactersIfAbsent(root);
  for (const chapter of CHAPTERS) {
    await writeIfAbsent(
      join(root, 'chapters', `ch_${String(chapter.num).padStart(2, '0')}.md`),
      placeholder(chapter.title),
    );
  }
}

async function seedCharactersIfAbsent(root: string): Promise<void> {
  try {
    await readFile(join(root, 'characters.json'), 'utf8');
  } catch {
    await writeCharacters(root, SEED_CHARACTERS);
  }
}

interface ProjectMeta {
  id: string;
  title: string;
  currentChapter: number;
  volumes: typeof VOLUMES;
  acts: typeof ACTS;
  recipes: RecipeId[];
  defaultModel: string;
  chapters: { num: number; title: string; status: string; actId: string }[];
}

type StoredChapter = { num: number; title: string; status: string; actId?: string };
type StoredProjectMeta = Partial<Omit<ProjectMeta, 'chapters'>> & { chapters: StoredChapter[] };

async function writeProjectMeta(path: string, meta: ProjectMeta): Promise<void> {
  try {
    const existing = JSON.parse(await readFile(path, 'utf8')) as StoredProjectMeta;
    let changed = false;

    if (!Array.isArray(existing.volumes) || existing.volumes.length === 0) {
      existing.volumes = meta.volumes;
      changed = true;
    }
    if (!Array.isArray(existing.acts) || existing.acts.length === 0) {
      existing.acts = meta.acts;
      changed = true;
    }
    if (!Array.isArray(existing.recipes) || existing.recipes.length === 0) {
      existing.recipes = meta.recipes;
      changed = true;
    }
    if (typeof existing.defaultModel !== 'string' || existing.defaultModel.length === 0) {
      existing.defaultModel = meta.defaultModel;
      changed = true;
    }

    const present = new Set(existing.chapters.map((chapter) => chapter.num));
    const missing = meta.chapters.filter((chapter) => !present.has(chapter.num));
    if (missing.length > 0) {
      existing.chapters = [...existing.chapters, ...missing].sort((a, b) => a.num - b.num);
      changed = true;
    }

    for (const chapter of existing.chapters) {
      if (!chapter.actId) {
        chapter.actId = actIdForChapter(chapter.num);
        changed = true;
      }
    }

    if (changed) {
      await writeFile(path, JSON.stringify(existing, null, 2), 'utf8');
    }
  } catch {
    await writeFile(path, JSON.stringify(meta, null, 2), 'utf8');
  }
}

async function writeIfAbsent(path: string, content: string): Promise<void> {
  try {
    await readFile(path, 'utf8');
  } catch {
    await writeFile(path, content, 'utf8');
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
  await seedProject(join(repoRoot, '.novelora-data'));
  console.log('Seeded .novelora-data/default-project');
}
