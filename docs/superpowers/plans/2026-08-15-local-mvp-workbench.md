# Local MVP Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the author use one local novel for real: edit outline/world/characters, run chapter/act/volume recipes through hermes, and accept drafts onto disk.

**Architecture:** `services/api` is the file kernel (project tree, `relations.md` projection, task JSON, draft accept). Hermes only generates prose over `/v1/chat/completions`; the api assembles context from markdown (never raw `characters.json`) and writes `drafts/`. The React cockpit gains seven Chinese nav views. Electron starts the api process; hermes stays an external process for this plan.

**Tech Stack:** Fastify 5 + tsx + node:test (`services/api`), React 19 + Vite + Vitest (`apps/web`), Electron (`apps/desktop`).

**Spec:** `docs/superpowers/specs/2026-08-15-local-mvp-workbench-design.md`

## Global Constraints

- UI copy is Chinese (笔心). Code identifiers stay English.
- Visible UI strings must not contain `—` or `–`.
- Backend listens on `127.0.0.1` only. All file writes are tmp + rename.
- Project id remains `default-project`. Data root is `<repo>/.novelora-data/`.
- Hermes in recipes: `process.env.HERMES_URL ?? 'http://127.0.0.1:8642'`, bearer `novelora-dev-key`.
- Do not send `characters.json` (or pixel `x`/`y`) to hermes. Only `relations.md` plus other markdown.
- Agent tools/recipes must not overwrite `world.md` or `characters.json`.
- Do not build a node-canvas workflow editor, foreshadowing module, RAG, or cloud sync.
- Existing tests must keep passing. After each task run the commands listed in that task.
- Do not commit unless the user explicitly asks. If they do, use `feat:` / `fix:` messages.

## File map

| File | Responsibility |
|---|---|
| `services/api/src/projectTypes.ts` | Shared types for tree, characters, tasks |
| `services/api/src/projectStore.ts` | Files: chapters, documents, characters, projection |
| `services/api/src/taskStore.ts` | `tasks/*.json` and `drafts/` |
| `services/api/src/recipeRunner.ts` | Five steps; calls hermes; never writes world/characters |
| `services/api/src/index.ts` | HTTP routes |
| `services/api/scripts/seed.ts` | Seed tree + characters + md |
| `apps/web/src/features/novelora-cockpit/lib/noveloraApi.ts` | Frontend client |
| `apps/web/src/features/novelora-cockpit/nav.ts` | Seven nav ids |
| `apps/web/src/features/novelora-cockpit/components/pages/*` | Outline, world, characters, relations, tasks |
| `apps/web/src/features/novelora-cockpit/components/writing/EchoComposer.tsx` | Skill/expert catalogs |
| `apps/desktop/src/main.ts` | Spawn api child process |

---

### Task 1: Project types, documents, and `relations.md` projection

**Files:**
- Create: `services/api/src/projectTypes.ts`
- Modify: `services/api/src/projectStore.ts`
- Test: `services/api/src/projectStore.test.ts`

**Interfaces:**
- Produces:
  - `export type RecipeId = 'chapter' | 'act' | 'volume'`
  - `export type DocumentName = 'outline' | 'world' | 'canon' | 'relations'`
  - `CharacterRecord = { id: string; name: string; role: string; goal?: string; knows?: string; x?: number; y?: number }`
  - `RelationshipRecord = { id: string; fromCharacterId: string; toCharacterId: string; label: string; tension: string; kind: string }`
  - `CharacterFile = { characters: CharacterRecord[]; relationships: RelationshipRecord[] }`
  - `projectRelations(file: CharacterFile): string`
  - `readDocument(root: string, name: DocumentName): Promise<string>`
  - `writeDocument(root: string, name: DocumentName, content: string): Promise<void>`
  - `readCharacters(root: string): Promise<CharacterFile>`
  - `writeCharacters(root: string, file: CharacterFile): Promise<void>` (atomic json write, then atomic `relations.md` from `projectRelations`)
- `writeDocument` for `'relations'` must throw; relations only come from projection.
- `projectRelations` output must not contain `x:` or `y:`.

- [ ] **Step 1: Write the failing test**

Append to `projectStore.test.ts`:

```ts
import { projectRelations, readCharacters, readDocument, writeCharacters, writeDocument } from './projectStore.ts';

it('projects relations.md without layout fields', async () => {
  await writeCharacters(root, {
    characters: [{ id: 'liora', name: '莉奥拉', role: '档案员', goal: '守镜', knows: '潮图', x: 12, y: 40 }],
    relationships: [{ id: 'r1', fromCharacterId: 'liora', toCharacterId: 'kael', label: '同盟', tension: '潮图秘密', kind: 'ally' }],
  });
  const md = await readDocument(root, 'relations');
  assert.match(md, /id: liora/);
  assert.match(md, /from: liora/);
  assert.doesNotMatch(md, /\bx:/);
  assert.doesNotMatch(md, /\by:/);
  const file = await readCharacters(root);
  assert.equal(file.characters[0].x, 12);
});

it('refuses to write relations.md directly', async () => {
  await assert.rejects(writeDocument(root, 'relations', 'nope'), /relations/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd services/api && npx tsx --test src/projectStore.test.ts`

Expected: FAIL (export not found or function missing).

- [ ] **Step 3: Write minimal implementation**

`projectTypes.ts` holds the types above.

`projectRelations`:

```ts
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
```

`writeCharacters` writes `characters.json` via tmp+rename, then writes `relations.md` the same way. `readCharacters` returns `{ characters: [], relationships: [] }` if the file is missing. Documents live at `outline.md` / `world.md` / `canon.md` / `relations.md`. Keep existing `readProject` / `readChapter` / `writeChapter`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd services/api && npx tsx --test src/projectStore.test.ts`

Expected: PASS (old cases still pass).

- [ ] **Step 5: Commit only if the user asked**

---

### Task 2: HTTP routes for documents, characters, tasks, and draft accept

**Files:**
- Create: `services/api/src/taskStore.ts`
- Modify: `services/api/src/index.ts`
- Test: `services/api/src/index.test.ts`, `services/api/src/taskStore.test.ts`

**Interfaces:**
- `TaskStatus = 'queued' | 'running' | 'awaiting_accept' | 'blocked' | 'done'`
- `TaskStepId = 'read_context' | 'draft' | 'self_check' | 'park_draft' | 'await_accept'`
- `RecipeTask = { id: string; recipe: RecipeId; status: TaskStatus; step: TaskStepId; model: string; chapterNums: number[]; currentIndex: number; log: string[]; createdAt: string }`
- `createTask(root, input: { recipe: RecipeId; chapterNums: number[]; model?: string }): Promise<RecipeTask>`
- `listTasks(root): Promise<RecipeTask[]>`
- `readTask(root, id): Promise<RecipeTask>`
- `writeTask(root, task): Promise<void>`
- `writeDraft(root, taskId, chapterNum, content): Promise<void>` (path `drafts/<taskId>/ch_NN.md`)
- `acceptDraft(root, taskId, chapterNum): Promise<void>` copies draft onto `chapters/ch_NN.md` then may delete that draft file
- `discardDraft(root, taskId, chapterNum): Promise<void>` deletes the draft file only

Routes:

- `GET /projects/:id/documents/:name`
- `PUT /projects/:id/documents/:name` body `{ content: string }`
- `GET /projects/:id/characters`
- `PUT /projects/:id/characters` body `CharacterFile`
- `GET /projects/:id/tasks`
- `POST /projects/:id/tasks` body `{ recipe, chapterNums, model? }`
- `GET /projects/:id/tasks/:taskId`
- `GET /projects/:id/drafts/:taskId/:num`
- `POST /projects/:id/tasks/:taskId/accept` body `{ chapterNum: number }`
- `POST /projects/:id/tasks/:taskId/discard` body `{ chapterNum: number }`

PUT documents with `name === 'relations'` returns 400.

- [ ] **Step 1: Write the failing tests**

`taskStore.test.ts`: create a temp root with one chapter; `writeDraft` then `acceptDraft`; assert `chapters/ch_01.md` matches draft and does not change `world.md`.

`index.test.ts` add inject cases for GET/PUT world.md, PUT characters (response includes projected relations via GET documents/relations), POST task, accept 404 when no draft.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd services/api && npx tsx --test src/taskStore.test.ts src/index.test.ts`

Expected: FAIL (missing modules/routes).

- [ ] **Step 3: Write minimal implementation**

Wire `buildServer` to `projectRoot(id)` as today. Reuse atomic write helper. Task id: `crypto.randomUUID()`. Default model `hermes-agent`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd services/api && npx tsx --test src/projectStore.test.ts src/taskStore.test.ts src/index.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit only if the user asked**

---

### Task 3: Seed volume/act tree and character file

**Files:**
- Modify: `services/api/scripts/seed.ts`
- Test: `services/api/scripts/seed.test.ts`

**Interfaces:**
- Extends `project.json` with:
  - `volumes: [{ id: 'vol-1', title: string, actIds: string[] }]`
  - `acts: [{ id: string, title: string, chapterNums: number[] }]`
  - `chapters[].actId`
  - `recipes: RecipeId[]` default `['chapter','act','volume']`
  - `defaultModel: 'hermes-agent'`
- Seed `characters.json` from a small cast (at least two people, one relationship). Seed must call `writeCharacters` so `relations.md` exists.
- Keep writing `outline.md`, `world.md`, `canon.md` if absent. Stop seeding `characters.md`.

- [ ] **Step 1: Write the failing test**

In `seed.test.ts` after `seedProject(root)`:

```ts
const meta = JSON.parse(await readFile(join(root, 'default-project/project.json'), 'utf8'));
assert.ok(Array.isArray(meta.volumes));
assert.ok(Array.isArray(meta.acts));
assert.equal(meta.recipes[0], 'chapter');
const relations = await readFile(join(root, 'default-project/relations.md'), 'utf8');
assert.match(relations, /# Characters/);
assert.doesNotMatch(relations, /\bx:/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd services/api && npx tsx --test scripts/seed.test.ts`

Expected: FAIL on missing `volumes` or `relations.md`.

- [ ] **Step 3: Write minimal seed**

One volume, two acts. Put existing six chapters into those acts (e.g. 1-3 and 4-6). Characters can stay English names from the mock project if that is already in seed fixtures; labels in markdown can be Chinese later. Projection still English-safe.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd services/api && npx tsx --test scripts/seed.test.ts src/projectStore.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit only if the user asked**

---

### Task 4: Frontend API client and seven-item navigation

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/lib/noveloraApi.ts`
- Test: `apps/web/src/features/novelora-cockpit/lib/noveloraApi.test.ts`
- Create: `apps/web/src/features/novelora-cockpit/nav.ts`
- Modify: `apps/web/src/features/novelora-cockpit/components/ProjectSidebar.tsx` (and the 笔心 `NavigationRail` if that file exists in this tree)
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/features/novelora-cockpit/components/AppShell.test.tsx` or `App.test.tsx`

**Interfaces:**
- `NavId = 'home' | 'writing' | 'outline' | 'characters' | 'relations' | 'world' | 'tasks'`
- `NAV_ITEMS: { id: NavId; label: string }[]` labels: `首页` `写作` `大纲` `人物` `关系` `世界观` `任务`
- Client functions: `fetchDocument`, `saveDocument`, `fetchCharacters`, `saveCharacters`, `fetchTasks`, `createTask`, `fetchTask`, `fetchDraft`, `acceptTaskDraft`, `discardTaskDraft` against `/api/projects/${id}/...`

- [ ] **Step 1: Write the failing tests**

`noveloraApi.test.ts`: `fetchDocument('world')` hits `/api/projects/default-project/documents/world`; `saveCharacters` PUTs `/characters`.

Sidebar/App test: `getByRole('button', { name: '世界观' })` and `getByRole('button', { name: '任务' })` exist. No `—` in those labels.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/lib/noveloraApi.test.ts src/App.test.tsx`

Expected: FAIL (missing client functions / missing nav labels).

- [ ] **Step 3: Write minimal implementation**

Replace sidebar items with `NAV_ITEMS`. `App.tsx` view union: `'dashboard' | 'writing' | 'outline' | 'characters' | 'relations' | 'world' | 'tasks'`. Home stays dashboard. `写作` calls existing `openWriting`. Other ids set the view. Placeholder `<p>…</p>` is OK for pages not built until later tasks, but each view must render a landmark with `aria-label` matching the Chinese name.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/lib/noveloraApi.test.ts src/App.test.tsx src/features/novelora-cockpit/components/AppShell.test.tsx`

Expected: PASS. Then `npm run lint:web` from repo root.

- [ ] **Step 5: Commit only if the user asked**

---

### Task 5: Outline and world markdown editors

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/components/pages/MarkdownDocumentPage.tsx`
- Test: `apps/web/src/features/novelora-cockpit/components/pages/MarkdownDocumentPage.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles/echo.css` (page shell only; reuse editor paper styles)

**Interfaces:**
- `MarkdownDocumentPage({ projectId, document: 'outline' | 'world', title: string, hint: string })`
- Loads via `fetchDocument`, saves via `saveDocument` with the same 1500ms debounce pattern as `ChapterEditor`.
- World hint (visible): `这是设定编辑，不会召唤 Agent。`
- Outline title: `大纲`. World title: `世界观`.

- [ ] **Step 1: Write the failing test**

```tsx
it('loads and saves world.md without calling hermes', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(okTextJson('规则：潮不可直呼其名'))
    .mockResolvedValueOnce(okJson({ ok: true }));
  vi.stubGlobal('fetch', fetchMock);
  render(<MarkdownDocumentPage projectId="default-project" document="world" title="世界观" hint="这是设定编辑，不会召唤 Agent。" />);
  expect(await screen.findByDisplayValue(/潮不可直呼其名/)).toBeInTheDocument();
  await userEvent.clear(screen.getByRole('textbox'));
  await userEvent.type(screen.getByRole('textbox'), '新规则');
  await act(() => vi.advanceTimersByTimeAsync(1600));
  expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('/hermes'))).toBe(false);
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/projects/default-project/documents/world',
    expect.objectContaining({ method: 'PUT' }),
  );
});
```

Use fake timers like `ChapterEditor` tests. `okTextJson` here means `new Response(JSON.stringify('规则：…'))` if the GET returns a JSON string, or `{ content: string }` if you choose that shape. **Lock the GET body to `{ content: string }` in Task 2 if not already.** Align this test with that: GET returns `{ content }` and the textarea shows `content`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/pages/MarkdownDocumentPage.test.tsx`

Expected: FAIL (module missing).

- [ ] **Step 3: Write minimal implementation**

Textarea + status `已保存` / `保存中` / `保存失败`. Wire App views `outline` and `world`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/pages/MarkdownDocumentPage.test.tsx src/App.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit only if the user asked**

---

### Task 6: Character cards and relations graph persistence

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/components/pages/CharactersPage.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/pages/RelationsPage.tsx`
- Test: `CharactersPage.test.tsx`, `RelationsPage.test.tsx`
- Modify: `CharacterGraph.tsx` only if needed to accept `onChange` for labels; prefer keeping layout local and saving the `CharacterFile` from page state
- Modify: `App.tsx`

**Interfaces:**
- Characters page: list from `fetchCharacters`; editing `name`/`role`/`goal`/`knows` calls `saveCharacters` with the full file (including `x`/`y` if present).
- Relations page: renders `CharacterGraph` from the same file; changing a relationship label updates state and `saveCharacters`.
- After save, do not fetch or display `relations.md` in the graph UI.

- [ ] **Step 1: Write the failing tests**

Characters: change role, assert PUT `/characters` body JSON has new role and still has `x` if provided.

Relations: render two nodes; `relations.md` is not requested (`fetch` paths never include `/documents/relations`).

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/pages/CharactersPage.test.tsx src/features/novelora-cockpit/components/pages/RelationsPage.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Reuse existing graph visuals. No new graph library.

- [ ] **Step 4: Run tests to verify they pass**

Run the same vitest command plus `src/features/novelora-cockpit/components/CharacterGraph.test.tsx`.

Expected: PASS.

- [ ] **Step 5: Commit only if the user asked**

---

### Task 7: Recipe runner (five steps, hermes generate, no world writes)

**Files:**
- Create: `services/api/src/recipeRunner.ts`
- Test: `services/api/src/recipeRunner.test.ts`
- Modify: `services/api/src/index.ts` add `POST /projects/:id/tasks/:taskId/run`
- Create: `packages/skills/draft-chapter/SKILL.md`, `packages/skills/draft-act/SKILL.md`, `packages/skills/draft-volume/SKILL.md` (prompt text only; runner inlines the same instructions)

**Interfaces:**
- `assembleContext(root: string, chapterNum: number): Promise<string>` concatenates outline, world, canon, relations, and a 500-char excerpt of neighboring chapters. Must not include `{` from `characters.json`.
- `runTaskStep(root: string, taskId: string, hermesFetch?: typeof fetch): Promise<RecipeTask>`
  - `read_context` → store assembled string in `task.log[0]`, step → `draft`
  - `draft` → POST hermes chat completions with `model: task.model`, messages `[{ role: 'user', content: context + chapter brief }]`, write `writeDraft` for `chapterNums[currentIndex]`, step → `self_check`
  - `self_check` → one more hermes call asking for conflicts vs world/relations only; append to log; do not write world/characters; step → `park_draft`
  - `park_draft` → status `awaiting_accept` (single chapter) OR if recipe is `act`/`volume` and more chapters remain, increment `currentIndex` and set step `read_context` but **volume recipe after finishing an act sets status `awaiting_accept` and log `pause:act`**
  - On hermes failure: status `blocked`, do not delete drafts

`POST .../run` calls `runTaskStep` once (one step per click/poll). GUI may call it in a loop.

- [ ] **Step 1: Write the failing test**

Use a temp root with world.md `禁直呼潮名`, relations.md containing `莉奥拉`, empty chapter 1.

Mock `hermesFetch` to return SSE or JSON `{ choices: [{ message: { content: '候选正文莉奥拉' } }] }`. Prefer non-stream JSON for the runner (`stream: false`) to keep tests simple.

```ts
it('assembleContext never includes character coordinates', async () => {
  const ctx = await assembleContext(root, 1);
  assert.match(ctx, /莉奥拉/);
  assert.doesNotMatch(ctx, /\bx:/);
  assert.doesNotMatch(ctx, /characters\.json/);
});

it('draft step writes drafts/ and never touches world.md', async () => {
  const worldBefore = await readFile(join(root, 'world.md'), 'utf8');
  const task = await createTask(root, { recipe: 'chapter', chapterNums: [1] });
  await runTaskStep(root, task.id, mockFetch);
  await runTaskStep(root, task.id, mockFetch); // draft
  const draft = await readFile(join(root, 'drafts', task.id, 'ch_01.md'), 'utf8');
  assert.match(draft, /候选正文/);
  assert.equal(await readFile(join(root, 'world.md'), 'utf8'), worldBefore);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd services/api && npx tsx --test src/recipeRunner.test.ts`

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Hermes URL join: `${HERMES_URL}/v1/chat/completions`. Header `Authorization: Bearer novelora-dev-key`. Body `{ model, stream: false, messages }`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd services/api && npx tsx --test src/recipeRunner.test.ts src/index.test.ts src/taskStore.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit only if the user asked**

---

### Task 8: Task board GUI and writing-page delegate

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/components/pages/TaskBoardPage.tsx`
- Test: `TaskBoardPage.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/WritingView.tsx`
- Test: `WritingView.test.tsx`
- Modify: `apps/web/src/styles/echo.css` (board columns + step timeline; mint tokens only; radius 12/16/20/999)

**Interfaces:**
- Board columns by `status`: `排队` queued, `进行中` running, `待接受` awaiting_accept, `完成` done. `blocked` cards sit in 进行中 with a `已阻塞` badge.
- Card shows recipe label `单章` / `一幕` / `一卷`, chapter range, current `step`.
- Detail: log list, `接受` / `丢弃` / `继续` (POST `/run`) / `停止` (set status queued is enough; do not delete drafts).
- Writing view: button `委派本章` → `createTask({ recipe: 'chapter', chapterNums: [chapterNum] })` then one `/run` or navigate to tasks.

- [ ] **Step 1: Write the failing tests**

TaskBoard: given tasks fixture in fetch mock, `getByRole('button', { name: '接受' })` on awaiting_accept card; click calls POST `.../accept`.

WritingView: `getByRole('button', { name: '委派本章' })` POSTs `/tasks` with `recipe: 'chapter'`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/pages/TaskBoardPage.test.tsx src/features/novelora-cockpit/components/writing/WritingView.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

No drag-and-drop. CSS: four columns, connected vertical line on the open card’s step list (Mirroric-style list, mint tokens).

- [ ] **Step 4: Run tests to verify they pass**

Run the vitest command above plus `src/styles/echo.test.ts` if you add contract assertions for `.task-board` `display: grid`.

Expected: PASS. Root `npm run lint:web`.

- [ ] **Step 5: Commit only if the user asked**

---

### Task 9: Composer Skill and expert catalogs

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/EchoComposer.tsx`
- Test: `EchoComposer.test.tsx`

**Interfaces:**
- Replace mock-project skills with:

```ts
const ECHO_SKILLS = [
  { id: 'scene-drafting', label: '单章起草', hint: 'writing' },
  { id: 'draft-act', label: '一幕起草', hint: 'writing' },
  { id: 'draft-volume', label: '一卷起草', hint: 'writing' },
  { id: 'expand', label: '扩写', hint: 'writing' },
  { id: 'polish', label: '润色', hint: 'writing' },
  { id: 'continue', label: '续写', hint: 'writing' },
];
const ECHO_EXPERTS = [
  { id: 'plot-architect', label: '情节顾问', hint: '结构与转折' },
  { id: 'character-voice', label: '人物声音', hint: '对白是否人设' },
  { id: 'worldbuilding-check', label: '世界观考据', hint: '只查不改设定' },
  { id: 'story-architect', label: '结构', hint: '幕与卷拆章' },
];
```

Keep listbox names `Skills` and `Experts` (tests and a11y). Visible option names are the Chinese `label`s.

Optional: choosing `/draft-act` in the composer may only insert the token for MVP; board creation stays on Task 8 buttons. Do not auto-start a recipe from chat in this task (YAGNI).

- [ ] **Step 1: Update failing assertions in EchoComposer.test.tsx**

Change `Story structure` → `单章起草`, insert `/scene-drafting `. Change `Story Architect` → `情节顾问`, insert `@plot-architect `.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/writing/EchoComposer.test.tsx`

Expected: FAIL on old English labels still in the component.

- [ ] **Step 3: Write minimal implementation**

Stop importing `noveloraMockProject` in EchoComposer.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/writing/EchoComposer.test.tsx src/features/novelora-cockpit/components/writing/EchoChat.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit only if the user asked**

---

### Task 10: Electron starts the api process

**Files:**
- Modify: `apps/desktop/src/main.ts`
- Test: `apps/desktop/src/main.test.ts` if a test runner exists there; otherwise a small Node test that extracts `resolveApiSpawn()` into `apps/desktop/src/apiProcess.ts`

**Interfaces:**
- `resolveApiSpawn(): { command: string; args: string[]; cwd: string; env: NodeJS.ProcessEnv }`
  - `cwd` = repo `services/api`
  - `command` = `process.execPath` or `npx`
  - `args` = `['tsx', 'src/index.ts']` (or the local `node_modules/tsx` bin)
  - `env.NOVELORA_API_HOST = '127.0.0.1'`
- On `app.whenReady`, `spawn` that process, `unref` false, kill on `will-quit`.
- Do not spawn hermes.

- [ ] **Step 1: Write the failing test**

```ts
it('points the api child at 127.0.0.1 and services/api', () => {
  const spec = resolveApiSpawn();
  assert.match(spec.cwd, /services[\\/]api$/);
  assert.equal(spec.env.NOVELORA_API_HOST, '127.0.0.1');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `apps/desktop` with whatever the package uses; if none, add `"test": "tsx --test src/apiProcess.test.ts"` to `apps/desktop/package.json`.

Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

Ignore spawn errors in tests by keeping spawn behind `if (process.env.VITEST) return` only if needed; prefer not spawning in the unit test at all.

- [ ] **Step 4: Run tests to verify they pass**

Run the desktop test plus `cd services/api && npx tsx --test src/index.test.ts`.

Expected: PASS.

Manual smoke (do not claim done without this when executing): `npm run seed:api`, `npm run dev:api`, `npm run dev:web`, open 写作, 委派本章, with hermes on 8642.

- [ ] **Step 5: Commit only if the user asked**

---

## Spec coverage

| Spec section | Task |
|---|---|
| File contract, `relations.md` format | 1, 3 |
| API documents/characters/tasks/accept | 2 |
| Nav IA, Chinese labels | 4 |
| Outline/world editors, world does not call Agent | 5 |
| Character cards + graph GUI vs projection | 1, 6 |
| Recipes, five steps, volume pauses per act | 7 |
| Task board, writing delegate | 8 |
| `/` Skills and `@` experts | 9 |
| Desktop starts api, hermes external | 10 |
| No node canvas / RAG / foreshadowing | (omitted on purpose) |

## Placeholder scan

No TBD. `GET` document JSON shape is `{ content: string }` (Task 2 + Task 5). Recipe runner uses `stream: false`. Commits stay gated on the user.
