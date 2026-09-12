# Writing Workspace Implementation Plan (Plan A: Functional Core)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Novelora cockpit from a mock demo into a real writing tool: local-file chapter persistence via services/api, a Writing view (chapter list + Markdown editor + Echo chat), with Echo backed by the local hermes API server.

**Architecture:** Fastify backend reads/writes a local project directory (`chapters/ch_NN.md` + `project.json`, atomic writes). React frontend gains a view switch (dashboard/writing), a debounced-autosave Markdown editor, and an SSE-streaming chat panel pointing at hermes `8642` through a Vite dev proxy.

**Tech Stack:** Fastify 5 + tsx (services/api), React 19 + Vite (apps/web), marked (preview), node:test (api tests), Vitest + Testing Library (web tests).

**Spec:** `docs/superpowers/specs/2026-08-12-writing-workspace-design.md`

## Global Constraints

- UI copy and code identifiers in English. No code comments unless asked.
- Visible UI strings must not contain `—` or `–` (enforced by test in Task 10).
- Backend listens on `127.0.0.1` only. Chapter writes are atomic (tmp file + rename).
- Hermes base URL is reached only through the `/hermes` Vite proxy in dev; the dev bearer key `novelora-dev-key` is local-only, never a real secret.
- Existing web tests must keep passing: run `npm run test:web` and `npm run lint:web` from repo root after every task.
- Project id is `default-project`; data root is `<repo>/.novelora-data/`.
- Do not commit without asking the user first; commit messages follow `feat: ...` style when approved.

---

### Task 1: Chapter file store (services/api)

**Files:**
- Create: `services/api/src/projectStore.ts`
- Test: `services/api/src/projectStore.test.ts`

**Interfaces:**
- Produces (used by Tasks 2, 3):
  - `countWords(text: string): number`
  - `readProject(root: string): Promise<ProjectMeta>`
  - `readChapter(root: string, num: number): Promise<ChapterContent>`
  - `writeChapter(root: string, num: number, content: string): Promise<{ words: number }>`
  - `ProjectMeta = { id: string; title: string; currentChapter: number; chapters: ChapterMeta[] }`
  - `ChapterMeta = { num: number; title: string; status: string; words: number }`
  - `ChapterContent = { num: number; title: string; content: string }`
  - Chapter file name: `chapters/ch_${String(num).padStart(2, '0')}.md`

- [ ] **Step 1: Write the failing test**

```ts
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { countWords, readChapter, readProject, writeChapter } from './projectStore.ts';

describe('projectStore', () => {
  let root: string;
  before(async () => {
    root = await mkdtemp(join(tmpdir(), 'novelora-'));
    await mkdir(join(root, 'chapters'), { recursive: true });
    await writeFile(join(root, 'project.json'), JSON.stringify({
      id: 'default-project', title: 'Tides of Embers', currentChapter: 1,
      chapters: [{ num: 1, title: 'Ash on the Morning Tide', status: 'drafting' }],
    }));
    await writeFile(join(root, 'chapters/ch_01.md'), '# Ash on the Morning Tide\n\n潮汐涌来。\n');
  });
  after(() => rm(root, { recursive: true, force: true }));

  it('counts CJK chars plus latin words', () => {
    assert.equal(countWords('潮汐 hello world 涌'), 5);
  });

  it('reads project meta with computed word counts', async () => {
    const meta = await readProject(root);
    assert.equal(meta.title, 'Tides of Embers');
    assert.equal(meta.chapters[0].words, 3);
  });

  it('round-trips a chapter through atomic write', async () => {
    const { words } = await writeChapter(root, 1, '# New\\n\n两个 words\n');
    assert.equal(words, 4);
    const chapter = await readChapter(root, 1);
    assert.equal(chapter.title, 'Ash on the Morning Tide');
    assert.match(chapter.content, /两个 words/);
    assert.match(await readFile(join(root, 'chapters/ch_01.md'), 'utf8'), /两个 words/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd services/api && npx tsx --test src/projectStore.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement the store**

```ts
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

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

async function readProjectFile(root: string): Promise<ProjectFile> {
  return JSON.parse(await readFile(join(root, 'project.json'), 'utf8')) as ProjectFile;
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
  await writeFile(`${target}.tmp`, content, 'utf8');
  await rename(`${target}.tmp`, target);
  return { words: countWords(content) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd services/api && npx tsx --test src/projectStore.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Commit (ask user first)**

`feat(api): add local chapter file store with atomic writes`

---

### Task 2: Project/chapter HTTP endpoints (services/api)

**Files:**
- Modify: `services/api/src/index.ts`
- Test: `services/api/src/index.test.ts`

**Interfaces:**
- Consumes: Task 1 store functions.
- Produces (used by Task 4 web client):
  - `GET /health` → `{ ok: true, service: 'novelora-api' }`
  - `GET /projects/:id` → `ProjectMeta` (404 `{ error }` if missing)
  - `GET /projects/:id/chapters/:num` → `ChapterContent` (404 if missing)
  - `PUT /projects/:id/chapters/:num` body `{ content: string }` → `{ words: number }` (400 without string content)
  - Data root: `NOVELORA_DATA_DIR` env, else `<repo>/.novelora-data`.

- [ ] **Step 1: Write the failing test**

```ts
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

process.env.NOVELORA_DATA_DIR = await mkdtemp(join(tmpdir(), 'novelora-api-'));
const { buildServer } = await import('./index.ts');

describe('api routes', () => {
  let app: Awaited<ReturnType<typeof buildServer>>;
  before(async () => {
    const root = join(process.env.NOVELORA_DATA_DIR!, 'default-project');
    await mkdir(join(root, 'chapters'), { recursive: true });
    await writeFile(join(root, 'project.json'), JSON.stringify({
      id: 'default-project', title: 'Tides of Embers', currentChapter: 1,
      chapters: [{ num: 1, title: 'Ash on the Morning Tide', status: 'drafting' }],
    }));
    await writeFile(join(root, 'chapters/ch_01.md'), '# Ash\n\n三个中文字\n');
    app = await buildServer();
  });
  after(async () => {
    await app.close();
    await rm(process.env.NOVELORA_DATA_DIR!, { recursive: true, force: true });
  });

  it('serves health, project meta, chapter round-trip, and 404s', async () => {
    const health = await app.inject({ url: '/health' });
    assert.equal(health.statusCode, 200);

    const project = await app.inject({ url: '/projects/default-project' });
    assert.equal(project.statusCode, 200);
    assert.equal(project.json().chapters[0].title, 'Ash on the Morning Tide');

    const saved = await app.inject({
      method: 'PUT', url: '/projects/default-project/chapters/1',
      payload: { content: '# Ash\n\n重写 four words\n' },
    });
    assert.equal(saved.statusCode, 200);
    assert.equal(saved.json().words, 5);

    const chapter = await app.inject({ url: '/projects/default-project/chapters/1' });
    assert.match(chapter.json().content, /four words/);

    const missing = await app.inject({ url: '/projects/default-project/chapters/9' });
    assert.equal(missing.statusCode, 404);

    const badBody = await app.inject({
      method: 'PUT', url: '/projects/default-project/chapters/1', payload: {},
    });
    assert.equal(badBody.statusCode, 400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd services/api && npx tsx --test src/index.test.ts`
Expected: FAIL, `buildServer` not exported.

- [ ] **Step 3: Rewrite index.ts with routes**

```ts
import Fastify from 'fastify';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readChapter, readProject, writeChapter } from './projectStore.ts';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const DATA_ROOT = process.env.NOVELORA_DATA_DIR ?? join(REPO_ROOT, '.novelora-data');
const PORT = Number(process.env.NOVELORA_API_PORT ?? 8787);
const HOST = process.env.NOVELORA_API_HOST ?? '127.0.0.1';

export async function buildServer() {
  const app = Fastify({ logger: true });
  const projectRoot = (id: string) => join(DATA_ROOT, id);

  app.get('/health', async () => ({ ok: true, service: 'novelora-api' }));

  app.get('/projects/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return await readProject(projectRoot(id));
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
  });

  app.get('/projects/:id/chapters/:num', async (request, reply) => {
    const { id, num } = request.params as { id: string; num: string };
    try {
      return await readChapter(projectRoot(id), Number(num));
    } catch {
      return reply.code(404).send({ error: `Unknown chapter ${num}` });
    }
  });

  app.put('/projects/:id/chapters/:num', async (request, reply) => {
    const { id, num } = request.params as { id: string; num: string };
    const body = request.body as { content?: unknown };
    if (typeof body?.content !== 'string') {
      return reply.code(400).send({ error: 'content must be a string' });
    }
    try {
      return await writeChapter(projectRoot(id), Number(num), body.content);
    } catch {
      return reply.code(404).send({ error: `Unknown chapter ${num}` });
    }
  });

  return app;
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  buildServer()
    .then((app) => app.listen({ port: PORT, host: HOST }))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd services/api && npx tsx --test src/index.test.ts src/projectStore.test.ts`
Expected: all passing. Also verify the running dev api (port 8787) still answers `GET /health` after restarting it.

- [ ] **Step 5: Commit (ask user first)**

`feat(api): serve project and chapter endpoints from local files`

---

### Task 3: Seed the default project

**Files:**
- Create: `services/api/scripts/seed.ts`
- Modify: `services/api/package.json` (add script), root `package.json` (add script)
- Test: `services/api/scripts/seed.test.ts`

**Interfaces:**
- Consumes: Task 1 store layout.
- Produces: `<repo>/.novelora-data/default-project/` with `project.json` + 5 chapter files. Chapters: 1 `Ash on the Morning Tide` (complete), 2 `The Vow Beneath Glass` (complete), 3 `Salt Map, Ember Mark` (drafting, current), 4 `The Queen of Broken Buoys` (planned), 5 `Voren Lights the False Star` (planned). Idempotent: does not overwrite existing files.

- [ ] **Step 1: Write the failing test**

```ts
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { seedProject } from './seed.ts';

describe('seedProject', () => {
  it('creates the default project and never overwrites edits', async () => {
    const root = await mkdtemp(join(tmpdir(), 'novelora-seed-'));
    try {
      await seedProject(root);
      const meta = JSON.parse(await readFile(join(root, 'default-project/project.json'), 'utf8'));
      assert.equal(meta.chapters.length, 5);
      assert.equal(meta.currentChapter, 3);
      await writeFile(join(root, 'default-project/chapters/ch_03.md'), 'user edits', 'utf8');
      await seedProject(root);
      assert.equal(await readFile(join(root, 'default-project/chapters/ch_03.md'), 'utf8'), 'user edits');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd services/api && npx tsx --test scripts/seed.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement the seed**

```ts
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const CHAPTERS = [
  { num: 1, title: 'Ash on the Morning Tide', status: 'complete' },
  { num: 2, title: 'The Vow Beneath Glass', status: 'complete' },
  { num: 3, title: 'Salt Map, Ember Mark', status: 'drafting' },
  { num: 4, title: 'The Queen of Broken Buoys', status: 'planned' },
  { num: 5, title: 'Voren Lights the False Star', status: 'planned' },
] as const;

const placeholder = (title: string) => `# ${title}\n\nThe tide came in before dawn, carrying ash from the far shore.\n\nSelene read the salt map twice before she believed it.\n\nBy the third bell, the harbor had forgotten its own name.\n`;

export async function seedProject(dataRoot: string): Promise<void> {
  const root = join(dataRoot, 'default-project');
  await mkdir(join(root, 'chapters'), { recursive: true });
  const meta = {
    id: 'default-project', title: 'Tides of Embers', currentChapter: 3,
    chapters: CHAPTERS.map(({ num, title, status }) => ({ num, title, status })),
  };
  await writeIfAbsent(join(root, 'project.json'), JSON.stringify(meta, null, 2));
  await writeIfAbsent(join(root, 'outline.md'), '# Tides of Embers Outline\n');
  await writeIfAbsent(join(root, 'world.md'), '# World\n');
  await writeIfAbsent(join(root, 'characters.md'), '# Characters\n');
  await writeIfAbsent(join(root, 'canon.md'), '# Canon\n');
  for (const chapter of CHAPTERS) {
    await writeIfAbsent(
      join(root, 'chapters', `ch_${String(chapter.num).padStart(2, '0')}.md`),
      placeholder(chapter.title),
    );
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
  const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));
  await seedProject(join(repoRoot, '.novelora-data'));
  console.log('Seeded .novelora-data/default-project');
}
```

Add to `services/api/package.json` scripts: `"seed": "tsx scripts/seed.ts"`.
Add to root `package.json` scripts: `"seed:api": "npm --prefix services/api run seed"`.

- [ ] **Step 4: Run test + real seed**

Run: `cd services/api && npx tsx --test scripts/seed.test.ts` → PASS.
Run from repo root: `npm run seed:api` → creates `.novelora-data/default-project`.
Verify: `curl http://127.0.0.1:8787/projects/default-project` (api already running) returns 5 chapters.

- [ ] **Step 5: Commit (ask user first)**

`feat(api): add idempotent default-project seed`

---

### Task 4: Web API client + Vite proxies

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/lib/noveloraApi.ts`
- Test: `apps/web/src/features/novelora-cockpit/lib/noveloraApi.test.ts`
- Modify: `apps/web/vite.config.ts` (add `server.proxy`, keep existing `test` config untouched)

**Interfaces:**
- Consumes: Task 2 endpoints.
- Produces (used by Tasks 6, 7):
  - `fetchProject(projectId = 'default-project'): Promise<ProjectMeta>`
  - `fetchChapter(num: number, projectId = 'default-project'): Promise<ChapterContent>`
  - `saveChapter(num: number, content: string, projectId = 'default-project'): Promise<{ words: number }>`
  - Types `ProjectMeta`/`ChapterMeta`/`ChapterContent` mirror Task 1.

- [ ] **Step 1: Write the failing test**

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchChapter, fetchProject, saveChapter } from './noveloraApi';

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('noveloraApi', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('fetches project meta through the /api proxy path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ id: 'default-project', chapters: [] }));
    vi.stubGlobal('fetch', fetchMock);
    await fetchProject();
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/default-project');
  });

  it('fetches and saves a chapter', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okJson({ num: 3, title: 'Salt Map, Ember Mark', content: '# x' }))
      .mockResolvedValueOnce(okJson({ words: 42 }));
    vi.stubGlobal('fetch', fetchMock);
    const chapter = await fetchChapter(3);
    expect(chapter.title).toBe('Salt Map, Ember Mark');
    const saved = await saveChapter(3, 'body');
    expect(saved.words).toBe(42);
    expect(fetchMock).toHaveBeenLastCalledWith('/api/projects/default-project/chapters/3', expect.objectContaining({ method: 'PUT' }));
  });

  it('throws on non-ok responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 404 })));
    await expect(fetchProject()).rejects.toThrow('404');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/lib/noveloraApi.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement the client and proxy**

```ts
export interface ChapterMeta { num: number; title: string; status: string; words: number }
export interface ProjectMeta { id: string; title: string; currentChapter: number; chapters: ChapterMeta[] }
export interface ChapterContent { num: number; title: string; content: string }

const BASE = '/api/projects';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
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
```

In `apps/web/vite.config.ts`, inside the existing `defineConfig({...})`, add a top-level `server` key (keep the existing `plugins` and `test` blocks exactly as they are):

```ts
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/hermes': {
        target: 'http://127.0.0.1:8642',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hermes/, ''),
      },
    },
  },
```

- [ ] **Step 4: Run tests**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/lib/noveloraApi.test.ts` → PASS.
Manual: with dev server running, `curl http://localhost:5173/api/health` returns api health JSON.

- [ ] **Step 5: Commit (ask user first)**

`feat(web): add novelora api client and dev proxies`

---

### Task 5: View switching + writing entries

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/EchoHeroCopy.tsx` (wire Continue Writing)
- Test: `apps/web/src/App.test.tsx`

**Interfaces:**
- Produces (used by Task 6):
  - App state `view: 'dashboard' | 'writing'`, `writingChapterNum: number`
  - Writing view rendered as `<WritingView projectId="default-project" chapterNum={writingChapterNum} onSelectChapter={setWritingChapterNum} onBack={() => setView('dashboard')} />` (component built in Task 6; in this task render a placeholder `<div className="writing-view" aria-label="Writing workspace">` so tests pass)
  - Chapter num = index of chapter in `timelineChapters` + 1.
- Behavior: Continue Writing → writing view at mock current chapter index; clicking a Chapter Timeline card keeps existing selection behavior AND opens the writing view on that chapter.

- [ ] **Step 1: Write the failing tests**

Add to `App.test.tsx` (imports already present in that file):

```ts
  it('opens the writing workspace from Continue Writing and returns', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /continue writing/i }));
    expect(screen.getByLabelText('Writing workspace')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /back to dashboard/i }));
    expect(screen.getByRole('main', { name: 'Story workspace' })).toBeInTheDocument();
  });

  it('opens the writing workspace when a chapter card is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Salt Map, Ember Mark/i }));
    expect(screen.getByLabelText('Writing workspace')).toBeInTheDocument();
  });
```

If the chapter card is not a `button`, query by its existing role from the current tests (they already click cards; reuse the same query).

- [ ] **Step 2: Run to verify failure**

Run: `cd apps/web && npx vitest run src/App.test.tsx`
Expected: FAIL, no writing workspace.

- [ ] **Step 3: Implement view switching**

In `App.tsx`:

```tsx
const [view, setView] = useState<'dashboard' | 'writing'>('dashboard');
const [writingChapterNum, setWritingChapterNum] = useState(1);

const openWriting = (num: number) => {
  setWritingChapterNum(num);
  setView('writing');
};
```

- Change the ChapterSwimlane `onSelectChapter` handler to also call `openWriting(index + 1)` where `index` is the chapter's position in `timelineChapters` (keep `setSelectedChapterId` call intact).
- Wrap the existing dashboard children in `{view === 'dashboard' && (...)}`; add `{view === 'writing' && (<div className="writing-view" aria-label="Writing workspace"><button type="button" onClick={() => setView('dashboard')}>Back to Dashboard</button></div>)}` (replaced by the real WritingView in Task 6).
- In `EchoHeroCopy.tsx`, accept `onContinueWriting?: () => void` and attach it to the existing Continue Writing button's `onClick`; pass it from App: `onContinueWriting={() => openWriting(currentChapterIndex + 1)}` where `currentChapterIndex` comes from the mock selected chapter position.

- [ ] **Step 4: Run tests**

Run: `cd apps/web && npx vitest run src/App.test.tsx` → new tests PASS.
Then full suite: `npm run test:web` from repo root → all PASS (update any older test that assumed the dashboard stays visible after a chapter-card click).

- [ ] **Step 5: Commit (ask user first)**

`feat(web): switch between dashboard and writing views`

---

### Task 6: WritingView shell + chapter list

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/components/writing/WritingView.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/writing/ChapterList.tsx`
- Test: `apps/web/src/features/novelora-cockpit/components/writing/WritingView.test.tsx`
- Modify: `apps/web/src/App.tsx` (replace placeholder with real WritingView)

**Interfaces:**
- Consumes: Task 4 client; App state from Task 5.
- Produces:
  - `WritingView({ projectId, chapterNum, onSelectChapter, onBack }: { projectId: string; chapterNum: number; onSelectChapter: (num: number) => void; onBack: () => void })`
  - `ChapterList({ chapters, selectedNum, onSelect }: { chapters: ChapterMeta[]; selectedNum: number; onSelect: (num: number) => void })`
  - Region labels: `aria-label="Writing workspace"` on root, `Chapter list` nav, `Back to Dashboard` button.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WritingView } from './WritingView';

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

const project = {
  id: 'default-project', title: 'Tides of Embers', currentChapter: 3,
  chapters: [
    { num: 1, title: 'Ash on the Morning Tide', status: 'complete', words: 2275 },
    { num: 3, title: 'Salt Map, Ember Mark', status: 'drafting', words: 3614 },
  ],
};

describe('WritingView', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads chapters, selects from the list, and goes back', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/chapters/')) return Promise.resolve(okJson({ num: 3, title: 'Salt Map, Ember Mark', content: '# Draft' }));
      return Promise.resolve(okJson(project));
    }));
    const onSelect = vi.fn();
    const onBack = vi.fn();
    render(<WritingView projectId="default-project" chapterNum={3} onSelectChapter={onSelect} onBack={onBack} />);

    expect(screen.getByLabelText('Writing workspace')).toBeInTheDocument();
    const list = await screen.findByRole('navigation', { name: 'Chapter list' });
    expect(list).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Ash on the Morning Tide/ }));
    expect(onSelect).toHaveBeenCalledWith(1);
    await user.click(screen.getByRole('button', { name: /back to dashboard/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows an error state when the api is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<WritingView projectId="default-project" chapterNum={3} onSelectChapter={() => undefined} onBack={() => undefined} />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/unavailable/i));
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/writing/WritingView.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`ChapterList.tsx`:

```tsx
import type { ChapterMeta } from '../../lib/noveloraApi';

interface ChapterListProps {
  chapters: ChapterMeta[];
  selectedNum: number;
  onSelect: (num: number) => void;
}

export function ChapterList({ chapters, selectedNum, onSelect }: ChapterListProps) {
  return (
    <nav className="chapter-list" aria-label="Chapter list">
      <ul>
        {chapters.map((chapter) => (
          <li key={chapter.num}>
            <button
              type="button"
              aria-pressed={chapter.num === selectedNum}
              onClick={() => onSelect(chapter.num)}
            >
              <span>Chapter {chapter.num}</span>
              <strong>{chapter.title}</strong>
              <span>{chapter.status} · {chapter.words} words</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

`WritingView.tsx` (editor placeholder filled in Task 7; chat in Task 9):

```tsx
import { useEffect, useState } from 'react';
import { fetchChapter, fetchProject, type ChapterContent, type ProjectMeta } from '../../lib/noveloraApi';
import { ChapterList } from './ChapterList';

interface WritingViewProps {
  projectId: string;
  chapterNum: number;
  onSelectChapter: (num: number) => void;
  onBack: () => void;
}

export function WritingView({ projectId, chapterNum, onSelectChapter, onBack }: WritingViewProps) {
  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [chapter, setChapter] = useState<ChapterContent | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    fetchProject(projectId)
      .then((meta) => { if (!cancelled) setProject(meta); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    fetchChapter(chapterNum, projectId)
      .then((content) => { if (!cancelled) setChapter(content); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [projectId, chapterNum]);

  if (error) {
    return (
      <div className="writing-view" aria-label="Writing workspace">
        <p role="status">Writing data is unavailable. Check the local api server.</p>
        <button type="button" onClick={onBack}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="writing-view" aria-label="Writing workspace">
      <header className="writing-view__bar">
        <button type="button" onClick={onBack}>Back to Dashboard</button>
      </header>
      {project ? (
        <ChapterList chapters={project.chapters} selectedNum={chapterNum} onSelect={onSelectChapter} />
      ) : null}
      <section className="writing-view__editor" aria-label="Chapter editor">
        {chapter ? <pre>{chapter.content}</pre> : null}
      </section>
      <aside className="writing-view__chat" aria-label="Echo chat" />
    </div>
  );
}
```

In `App.tsx`, replace the placeholder writing div with:

```tsx
<WritingView
  projectId="default-project"
  chapterNum={writingChapterNum}
  onSelectChapter={setWritingChapterNum}
  onBack={() => setView('dashboard')}
/>
```

- [ ] **Step 4: Run tests**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/writing src/App.test.tsx` → PASS.

- [ ] **Step 5: Commit (ask user first)**

`feat(web): add writing view shell with chapter list`

---

### Task 7: Chapter editor with debounced autosave

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/components/writing/ChapterEditor.tsx`
- Test: `apps/web/src/features/novelora-cockpit/components/writing/ChapterEditor.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/WritingView.tsx` (use ChapterEditor)

**Interfaces:**
- Produces:
  - `ChapterEditor({ chapterKey, initialContent, onSave }: { chapterKey: string; initialContent: string; onSave: (content: string) => Promise<{ words: number }> })`
  - `chapterKey` = `${projectId}:${num}`; changing it reloads initialContent (use `key` from parent).
  - Aria: textarea `aria-label="Chapter content"`, status `role="status"` showing `Saved` / `Saving...` / `Save failed`, word count text `Words: N`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChapterEditor } from './ChapterEditor';

describe('ChapterEditor', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => { vi.runOnlyPendingTimers(); vi.useRealTimers(); });

  it('autosaves 1.5s after typing stops and reports status', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSave = vi.fn().mockResolvedValue({ words: 10 });
    render(<ChapterEditor chapterKey="p:3" initialContent="# Draft" onSave={onSave} />);

    const textarea = screen.getByRole('textbox', { name: 'Chapter content' });
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    await user.type(textarea, 'abc');
    expect(onSave).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1600));
    expect(onSave).toHaveBeenCalledWith('# Draftabc');
    expect(await screen.findByRole('status')).toHaveTextContent('Saved');
  });

  it('shows Save failed when the save rejects', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSave = vi.fn().mockRejectedValue(new Error('down'));
    render(<ChapterEditor chapterKey="p:3" initialContent="x" onSave={onSave} />);
    await user.type(screen.getByRole('textbox', { name: 'Chapter content' }), 'y');
    await act(() => vi.advanceTimersByTimeAsync(1600));
    expect(await screen.findByRole('status')).toHaveTextContent('Save failed');
  });

  it('counts words live', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChapterEditor chapterKey="p:3" initialContent="两个 words" onSave={vi.fn()} />);
    expect(screen.getByText('Words: 4')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/writing/ChapterEditor.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```tsx
import { useEffect, useRef, useState } from 'react';
import { countWordsLocal } from './wordCount';

type SaveStatus = 'saved' | 'saving' | 'error';

interface ChapterEditorProps {
  chapterKey: string;
  initialContent: string;
  onSave: (content: string) => Promise<{ words: number }>;
}

export function ChapterEditor({ chapterKey, initialContent, onSave }: ChapterEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const dirty = useRef(false);
  const keyRef = useRef(chapterKey);

  useEffect(() => {
    if (keyRef.current !== chapterKey) {
      keyRef.current = chapterKey;
      dirty.current = false;
      setContent(initialContent);
      setStatus('saved');
    }
  }, [chapterKey, initialContent]);

  useEffect(() => {
    if (!dirty.current) return undefined;
    setStatus('saving');
    const timer = setTimeout(() => {
      onSave(content)
        .then(() => setStatus('saved'))
        .catch(() => setStatus('error'));
    }, 1500);
    return () => clearTimeout(timer);
  }, [content, onSave]);

  return (
    <div className="chapter-editor">
      <div className="chapter-editor__meta">
        <span role="status">{status === 'saved' ? 'Saved' : status === 'saving' ? 'Saving...' : 'Save failed'}</span>
        <span>Words: {countWordsLocal(content)}</span>
      </div>
      <textarea
        aria-label="Chapter content"
        value={content}
        onChange={(event) => {
          dirty.current = true;
          setContent(event.target.value);
        }}
      />
    </div>
  );
}
```

Create `wordCount.ts` next to it:

```ts
export function countWordsLocal(text: string): number {
  const cjk = (text.match(/[一-鿿]/g) ?? []).length;
  const latin = (text.replace(/[一-鿿]/g, ' ').match(/[A-Za-z0-9']+/g) ?? []).length;
  return cjk + latin;
}
```

In `WritingView.tsx`, replace the `<pre>` editor placeholder with:

```tsx
{chapter ? (
  <ChapterEditor
    key={`${projectId}:${chapter.num}`}
    chapterKey={`${projectId}:${chapter.num}`}
    initialContent={chapter.content}
    onSave={(content) => saveChapter(chapter.num, content, projectId)}
  />
) : null}
```

(add `saveChapter` to the import from `../../lib/noveloraApi`.)

- [ ] **Step 4: Run tests**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/writing` → PASS.

- [ ] **Step 5: Commit (ask user first)**

`feat(web): add chapter editor with debounced autosave`

---

### Task 8: Markdown preview

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/ChapterEditor.tsx`
- Modify: `apps/web/package.json` (add `marked`)
- Test: extend `ChapterEditor.test.tsx`

**Interfaces:**
- Produces: toggle button `aria-label="Preview"` with `aria-pressed`; preview region `aria-label="Chapter preview"` rendering parsed markdown.

- [ ] **Step 1: Install + failing test**

Run: `cd apps/web && npm install marked`

Add to `ChapterEditor.test.tsx`:

```tsx
  it('toggles a rendered markdown preview', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChapterEditor chapterKey="p:3" initialContent="# Title\n\nsome text" onSave={vi.fn()} />);
    const toggle = screen.getByRole('button', { name: 'Preview' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    const preview = screen.getByLabelText('Chapter preview');
    expect(preview.querySelector('h1')).toHaveTextContent('Title');
    expect(screen.queryByRole('textbox', { name: 'Chapter content' })).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run to verify failure**

Expected: FAIL, no Preview button.

- [ ] **Step 3: Implement**

In `ChapterEditor.tsx`:

```tsx
import { marked } from 'marked';
```

Add state `const [preview, setPreview] = useState(false);`, a toggle button before the textarea:

```tsx
<button type="button" aria-label="Preview" aria-pressed={preview} onClick={() => setPreview((value) => !value)}>
  Preview
</button>
```

Replace the `<textarea>` render with:

```tsx
{preview ? (
  <div
    className="chapter-editor__preview"
    aria-label="Chapter preview"
    dangerouslySetInnerHTML={{ __html: marked.parse(content, { async: false }) }}
  />
) : (
  <textarea ...existing props />
)}
```

- [ ] **Step 4: Run tests**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/writing/ChapterEditor.test.tsx` → PASS.

- [ ] **Step 5: Commit (ask user first)**

`feat(web): add markdown preview to chapter editor`

---

### Task 9: Echo chat with SSE streaming

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/lib/hermesChat.ts`
- Create: `apps/web/src/features/novelora-cockpit/components/writing/EchoChat.tsx`
- Tests: `apps/web/src/features/novelora-cockpit/lib/hermesChat.test.ts`, `apps/web/src/features/novelora-cockpit/components/writing/EchoChat.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/WritingView.tsx` (mount EchoChat in the chat aside)

**Interfaces:**
- Produces:
  - `ChatMessage = { role: 'user' | 'assistant'; content: string }`
  - `streamChat(messages: ChatMessage[], signal: AbortSignal): AsyncGenerator<string>` (posts to `/hermes/v1/chat/completions`, yields delta content strings)
  - `EchoChat({ context }: { context: string })` — `context` is `Chapter {num} "{title}"` plus excerpt; sent as a prefixed system-style note on the first user message of the session.
  - Aria: region `Echo chat`, textbox `Message Echo`, list `role="log"`, button `Send`, button `Stop generating` while streaming.
  - Session id: localStorage key `novelora.hermes.session`, sent as `X-Hermes-Session-Id`.

- [ ] **Step 1: Write the failing streaming test**

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { streamChat } from './hermesChat';

const sse = (chunks: string[]) => {
  const encoder = new TextEncoder();
  return new Response(new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  }), { status: 200 });
};

describe('streamChat', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('yields delta content from SSE frames', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sse([
      'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"lo"}}]}\n\ndata: [DONE]\n\n',
    ])));
    const parts: string[] = [];
    for await (const part of streamChat([{ role: 'user', content: 'hi' }], new AbortController().signal)) {
      parts.push(part);
    }
    expect(parts).toEqual(['Hel', 'lo']);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/hermes/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/lib/hermesChat.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement the streaming client**

```ts
export interface ChatMessage { role: 'user' | 'assistant'; content: string }

const HERMES_URL = '/hermes/v1/chat/completions';
const DEV_KEY = 'novelora-dev-key';
const SESSION_KEY = 'novelora.hermes.session';

function sessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function* streamChat(messages: ChatMessage[], signal: AbortSignal): AsyncGenerator<string> {
  const response = await fetch(HERMES_URL, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${DEV_KEY}`,
      'Content-Type': 'application/json',
      'X-Hermes-Session-Id': sessionId(),
    },
    body: JSON.stringify({ model: 'hermes-agent', stream: true, messages }),
  });
  if (!response.ok || !response.body) throw new Error(`Hermes ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';
    for (const frame of frames) {
      const data = frame.replace(/^data: /m, '').trim();
      if (!data || data === '[DONE]') continue;
      const payload = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
      const delta = payload.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
```

- [ ] **Step 4: EchoChat component test**

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EchoChat } from './EchoChat';

const sse = (chunks: string[]) => {
  const encoder = new TextEncoder();
  return new Response(new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  }), { status: 200 });
};

describe('EchoChat', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends a message with chapter context and streams the reply', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(sse([
      'data: {"choices":[{"delta":{"content":"Sure"}}]}\n\ndata: [DONE]\n\n',
    ]));
    vi.stubGlobal('fetch', fetchMock);
    render(<EchoChat context='Chapter 3 "Salt Map, Ember Mark"' />);

    await user.type(screen.getByRole('textbox', { name: 'Message Echo' }), 'Review this chapter');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    const log = screen.getByRole('log');
    await waitFor(() => expect(log).toHaveTextContent('Sure'));
    expect(log).toHaveTextContent('Review this chapter');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.messages[0].content).toContain('Chapter 3 "Salt Map, Ember Mark"');
    expect(body.messages[0].content).toContain('Review this chapter');
  });

  it('shows an error when hermes is unreachable', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    render(<EchoChat context="Chapter 3" />);
    await user.type(screen.getByRole('textbox', { name: 'Message Echo' }), 'hi');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(screen.getByRole('log')).toHaveTextContent(/unreachable/i));
  });
});
```

- [ ] **Step 5: Implement EchoChat**

```tsx
import { useRef, useState } from 'react';
import { streamChat, type ChatMessage } from '../../lib/hermesChat';

interface EchoChatProps { context: string }

export function EchoChat({ context }: EchoChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const contextSent = useRef(false);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    setError('');
    const prefixed = contextSent.current ? text : `${context}\n\n${text}`;
    contextSent.current = true;
    const next: ChatMessage[] = [...messages, { role: 'user', content: prefixed }, { role: 'assistant', content: '' }];
    setMessages(next);
    setStreaming(true);
    abortRef.current = new AbortController();
    try {
      const wireMessages = next.slice(0, -1);
      for await (const delta of streamChat(wireMessages, abortRef.current.signal)) {
        setMessages((current) => {
          const copy = [...current];
          copy[copy.length - 1] = { role: 'assistant', content: copy[copy.length - 1].content + delta };
          return copy;
        });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError('Echo is unreachable. Is the hermes gateway running?');
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <section className="echo-chat" aria-label="Echo chat">
      <div className="echo-chat__log" role="log" aria-live="polite">
        {messages.map((message, index) => (
          <p key={index} data-role={message.role}>{message.content}</p>
        ))}
        {error ? <p role="alert">{error}</p> : null}
      </div>
      <div className="echo-chat__composer">
        <textarea
          aria-label="Message Echo"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        {streaming ? (
          <button type="button" onClick={() => abortRef.current?.abort()}>Stop generating</button>
        ) : (
          <button type="button" onClick={() => void send()}>Send</button>
        )}
      </div>
    </section>
  );
}
```

In `WritingView.tsx`, fill the chat aside:

```tsx
<aside className="writing-view__chat">
  <EchoChat context={chapter ? `Chapter ${chapter.num} "${chapter.title}"\nExcerpt: ${chapter.content.slice(0, 500)}` : 'No chapter selected'} />
</aside>
```

- [ ] **Step 6: Run tests + live check**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/lib/hermesChat.test.ts src/features/novelora-cockpit/components/writing/EchoChat.test.tsx` → PASS.
Manual: with hermes gateway on 8642 and dev server on 5173, open the writing view and send "hello" to Echo; a streamed reply should appear.

- [ ] **Step 7: Commit (ask user first)**

`feat(web): add Echo chat with hermes SSE streaming`

---

### Task 10: Writing view styling + copy lint

**Files:**
- Modify: `apps/web/src/styles/echo.css` (append writing-view rules)
- Modify: `apps/web/src/styles/echo.test.ts` (add contract block)
- Modify: `apps/web/src/App.test.tsx` (add em-dash contract)

**Interfaces:**
- Consumes: classes from Tasks 6-9: `.writing-view`, `.writing-view__bar`, `.chapter-list`, `.writing-view__editor`, `.chapter-editor`, `.chapter-editor__meta`, `.chapter-editor__preview`, `.writing-view__chat`, `.echo-chat`, `.echo-chat__log`, `.echo-chat__composer`.

- [ ] **Step 1: Write the failing contract tests**

Add to `echo.test.ts`:

```ts
  it('lays out the writing workspace as a three-column workbench', () => {
    const view = ruleBody(echoCss, '.writing-view');
    expectDeclaration(view, 'display', 'grid');
    expectDeclaration(view, 'grid-template-columns', '240px minmax(0, 1fr) 320px');
    expectDeclaration(ruleBody(echoCss, '.writing-view__editor'), 'min-width', '0');
    expectDeclaration(ruleBody(echoCss, '.echo-chat'), 'display', 'flex');
    expectDeclaration(ruleBody(echoCss, '.echo-chat'), 'flex-direction', 'column');
    expectDeclaration(ruleBody(echoCss, '.echo-chat__log'), 'overflow-y', 'auto');
  });
```

Add to `App.test.tsx`:

```ts
  it('keeps visible copy free of em-dashes', () => {
    render(<App />);
    expect(document.body.textContent ?? '').not.toMatch(/[—–]/);
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `cd apps/web && npx vitest run src/styles/echo.test.ts src/App.test.tsx`
Expected: FAIL on missing `.writing-view` rules.

- [ ] **Step 3: Add the CSS**

Append to `echo.css`:

```css
.writing-view {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) 320px;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.writing-view__bar {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.chapter-list {
  overflow-y: auto;
  min-height: 0;
}

.chapter-list ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chapter-list button {
  display: grid;
  gap: 4px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--echo-line);
  border-radius: var(--echo-radius-panel);
  background: var(--echo-surface);
  text-align: left;
  cursor: pointer;
}

.chapter-list button[aria-pressed='true'] {
  border-color: var(--echo-mint-600);
}

.writing-view__editor {
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid var(--echo-line);
  border-radius: var(--echo-radius-panel);
  background: var(--echo-surface);
  padding: 20px 24px;
}

.chapter-editor {
  display: grid;
  gap: 12px;
  height: 100%;
}

.chapter-editor__meta {
  display: flex;
  justify-content: space-between;
  color: var(--echo-muted);
  font-size: 12px;
}

.chapter-editor textarea {
  width: 100%;
  min-height: 60svh;
  border: 0;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--echo-ink);
  font-family: 'EB Garamond', Georgia, 'Times New Roman', serif;
  font-size: 17px;
  line-height: 1.75;
}

.chapter-editor__preview {
  font-family: 'EB Garamond', Georgia, 'Times New Roman', serif;
  font-size: 17px;
  line-height: 1.75;
}

.writing-view__chat {
  min-height: 0;
  border: 1px solid var(--echo-line);
  border-radius: var(--echo-radius-panel);
  background: var(--echo-surface);
}

.echo-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.echo-chat__log {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: grid;
  gap: 8px;
  align-content: start;
}

.echo-chat__composer {
  display: grid;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--echo-line);
}

.echo-chat__composer textarea {
  min-height: 64px;
  resize: vertical;
  border: 1px solid var(--echo-line);
  border-radius: 12px;
  padding: 8px 10px;
  font: inherit;
}
```

If a referenced token name does not exist in `tokens.css` (`--echo-radius-panel`, `--echo-line`, `--echo-surface`, `--echo-muted`, `--echo-ink`, `--echo-mint-600`), substitute the nearest existing token and update the contract test to match.

- [ ] **Step 4: Run full verification**

Run from repo root: `npm run test:web && npm run lint:web && npm run build:web` → all PASS.

- [ ] **Step 5: Commit (ask user first)**

`feat(web): style writing workspace and enforce dash-free copy`

---

## Self-Review Notes

- Spec coverage: persistence (Tasks 1-3), view switch + entries (5), chapter list (6), editor + autosave + preview (7-8), Echo chat + context + offline error (9), styling + copy rule (10). Visual component refresh is **Plan B** (deliberately split, covers dashboard polish + writing view glass styling).
- Offline health-poll auto-recovery from the spec was simplified to an inline error message in v1 (retry = send again); flag for Plan B if unwanted.
