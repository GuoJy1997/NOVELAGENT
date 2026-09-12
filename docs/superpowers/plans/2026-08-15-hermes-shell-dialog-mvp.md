# Hermes Shell Dialog MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 笔心 writing dialog a thin Hermes shell: `/` `@` list Hermes's own skills and experts, chapter edits land as candidates, the author accepts or discards.

**Architecture:** `services/api` gains a path-based candidate store (separate from recipe `drafts/<taskId>/ch_NN.md`). The web app fetches `GET /hermes/v1/skills` (and capabilities-advertised command/expert lists if present) through the existing Vite proxy. `EchoComposer` drops hardcoded `ECHO_SKILLS` / `ECHO_EXPERTS`. Workflow graph storage, canvas, and Multi-Subagents are out of this plan.

**Tech Stack:** Fastify 5 + tsx + node:test (`services/api`), React 19 + Vite + Vitest (`apps/web`). Hermes gateway `127.0.0.1:8642`.

**Spec:** `docs/superpowers/specs/2026-08-15-hermes-shell-kernel-design.md`

## Global Constraints

- Work in `D:\NOVELAGENT` on `feature/toy-writer-cockpit-ui`. Do not edit `.worktrees/bixin-home-fidelity` except to read.
- Live UI is Codex 笔心 only (`BixinHomePage`). Do not revive Echo `AppShell` chrome or a second visual system.
- UI copy is Chinese (笔心). Code identifiers stay English.
- Visible UI strings must not contain `—` or `–`.
- Do not introduce Tailwind.
- Do not send `characters.json` (or pixel `x`/`y`) to Hermes. Only `relations.md` plus other markdown.
- `/` `@` lists come from Hermes. If a list is missing or the request fails, show empty. Never fall back to `ECHO_SKILLS` / `ECHO_EXPERTS` or any frontend novel catalog.
- Do not build a workflow canvas, Multi-Subagents planner, RAG, or accept-after history rollback.
- Do not change `recipeRunner.ts` five-step recipes in this plan (they stay the temporary workflow stand-in).
- Do not `git add -A`. Do not commit unless the user explicitly asks.
- After every task, run the commands listed in that task from the stated cwd.
- CSS-source tests must run under `apps/web` (root `npm run test:web` already does).

## Out of this plan (next specs)

- Workflow graph JSON + per-node Hermes runner
- 笔心 node canvas
- Replacing Hermes's skill/expert pack with novel-writing ones
- Switching chat from `/v1/chat/completions` to `/v1/runs` event streams

## File map

| File | Responsibility |
|---|---|
| `services/api/src/candidateStore.ts` | Path-based candidates under `drafts/candidates/<id>/` |
| `services/api/src/index.ts` | Candidate HTTP routes |
| `apps/web/src/features/novelora-cockpit/lib/noveloraApi.ts` | Candidate client |
| `apps/web/src/features/novelora-cockpit/lib/hermesCatalog.ts` | Fetch Hermes `/v1/skills` (+ optional command/expert endpoints) |
| `apps/web/src/features/novelora-cockpit/components/writing/EchoComposer.tsx` | `/` `@` pickers bound to catalog props |
| `apps/web/src/features/novelora-cockpit/components/writing/EchoChat.tsx` | Hermes dialog + Chinese offline copy |
| `apps/web/src/features/novelora-cockpit/components/writing/CandidateReview.tsx` | Pending chapter candidates: accept / discard |

---

### Task 1: Candidate store

**Files:**
- Create: `services/api/src/candidateStore.ts`
- Test: `services/api/src/candidateStore.test.ts`

**Interfaces:**
- Produces:
  - `export type CandidateSource = 'dialog' | 'workflow'`
  - `export type CandidateStatus = 'pending'`
  - `export interface FileCandidate { id: string; runId: string; targetPath: string; source: CandidateSource; status: CandidateStatus; createdAt: string }`
  - `export function isAllowedTargetPath(path: string): boolean`
  - `export function writeCandidate(root: string, input: { runId: string; targetPath: string; source: CandidateSource; content: string }): Promise<FileCandidate>`
  - `export function readCandidateContent(root: string, id: string): Promise<string>`
  - `export function listPendingCandidates(root: string): Promise<FileCandidate[]>`
  - `export function acceptCandidate(root: string, id: string): Promise<void>`
  - `export function discardCandidate(root: string, id: string): Promise<void>`
- Allowed `targetPath` values only: `chapters/ch_NN.md` (NN is two digits), `outline.md`, `world.md`, `canon.md`. Reject `..`, absolute paths, `characters.json`, `relations.md`.
- Disk: `drafts/candidates/<id>/meta.json` and `drafts/candidates/<id>/content.md`. Accept writes content onto `join(root, targetPath)` via tmp+rename (`atomicWrite` from `projectStore.ts`), then deletes that candidate directory. Discard deletes the directory only. Accept must not touch `world.md` unless `targetPath` is `world.md`.

- [ ] **Step 1: Write the failing test**

Create `services/api/src/candidateStore.test.ts`:

```ts
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptCandidate,
  discardCandidate,
  isAllowedTargetPath,
  listPendingCandidates,
  writeCandidate,
} from './candidateStore.ts';

describe('candidateStore', () => {
  let root: string;
  before(async () => {
    root = await mkdtemp(join(tmpdir(), 'novelora-cand-'));
    await mkdir(join(root, 'chapters'), { recursive: true });
    await writeFile(join(root, 'chapters/ch_03.md'), '# original\n');
    await writeFile(join(root, 'world.md'), '# World\nkeep\n');
  });
  after(() => rm(root, { recursive: true, force: true }));

  it('rejects unsafe target paths', () => {
    assert.equal(isAllowedTargetPath('chapters/ch_03.md'), true);
    assert.equal(isAllowedTargetPath('../secret'), false);
    assert.equal(isAllowedTargetPath('characters.json'), false);
    assert.equal(isAllowedTargetPath('relations.md'), false);
  });

  it('accepts a chapter candidate without touching world.md', async () => {
    const candidate = await writeCandidate(root, {
      runId: 'run-1',
      targetPath: 'chapters/ch_03.md',
      source: 'dialog',
      content: '# candidate chapter\n',
    });
    assert.equal(candidate.status, 'pending');
    assert.equal((await listPendingCandidates(root)).length, 1);
    await acceptCandidate(root, candidate.id);
    assert.equal(await readFile(join(root, 'chapters/ch_03.md'), 'utf8'), '# candidate chapter\n');
    assert.equal(await readFile(join(root, 'world.md'), 'utf8'), '# World\nkeep\n');
    assert.equal((await listPendingCandidates(root)).length, 0);
  });

  it('discard deletes only the candidate', async () => {
    const candidate = await writeCandidate(root, {
      runId: 'run-2',
      targetPath: 'chapters/ch_03.md',
      source: 'dialog',
      content: '# throw away\n',
    });
    await discardCandidate(root, candidate.id);
    assert.equal(await readFile(join(root, 'chapters/ch_03.md'), 'utf8'), '# candidate chapter\n');
    assert.equal((await listPendingCandidates(root)).some((item) => item.id === candidate.id), false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd services/api && npx tsx --test src/candidateStore.test.ts`

Expected: FAIL (module not found).

- [ ] **Step 3: Write minimal implementation**

Implement `candidateStore.ts` with the interfaces above. Use `crypto.randomUUID()` for `id`. Use `atomicWrite` from `./projectStore.ts`. `acceptCandidate` of a missing id throws `/unknown candidate/i`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd services/api && npx tsx --test src/candidateStore.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit only if the user asked**

Do not commit unless asked.

---

### Task 2: Candidate HTTP routes

**Files:**
- Modify: `services/api/src/index.ts`
- Test: `services/api/src/index.test.ts`

**Interfaces:**
- Consumes: Task 1 store functions
- Produces:
  - `GET /projects/:id/candidates` → `FileCandidate[]` (pending only)
  - `GET /projects/:id/candidates/:candidateId` → `{ ...FileCandidate, content: string }`
  - `POST /projects/:id/candidates` body `{ runId: string; targetPath: string; source: 'dialog' | 'workflow'; content: string }` → `FileCandidate` (201)
  - `POST /projects/:id/candidates/:candidateId/accept` → `{ ok: true }`
  - `POST /projects/:id/candidates/:candidateId/discard` → `{ ok: true }`
- Unknown project: 404 `{ error: "Unknown project ..." }`. Unknown candidate: 404 `{ error: "Unknown candidate ..." }`. Bad path/source: 400.

- [ ] **Step 1: Write the failing test**

Append to `index.test.ts` (same temp-project setup the file already uses):

```ts
it('writes, lists, accepts, and discards dialog candidates', async () => {
  const created = await app.inject({
    method: 'POST',
    url: '/projects/default-project/candidates',
    payload: {
      runId: 'sess-1',
      targetPath: 'chapters/ch_01.md',
      source: 'dialog',
      content: '# from dialog\n',
    },
  });
  assert.equal(created.statusCode, 201);
  const id = created.json().id as string;
  const listed = await app.inject({ url: '/projects/default-project/candidates' });
  assert.equal(listed.statusCode, 200);
  assert.equal(listed.json().some((row: { id: string }) => row.id === id), true);
  const accepted = await app.inject({
    method: 'POST',
    url: `/projects/default-project/candidates/${id}/accept`,
  });
  assert.equal(accepted.statusCode, 200);
  const chapter = await app.inject({ url: '/projects/default-project/chapters/1' });
  assert.match(chapter.json().content, /from dialog/);
});

it('rejects characters.json as a candidate target', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/projects/default-project/candidates',
    payload: { runId: 'x', targetPath: 'characters.json', source: 'dialog', content: '{}' },
  });
  assert.equal(res.statusCode, 400);
});
```

- [ ] **Step 2: Run the new tests**

Run: `cd services/api && npx tsx --test src/index.test.ts`

Expected: FAIL (404 on `/candidates`).

- [ ] **Step 3: Wire routes in `buildServer`**

Import store functions. Resolve `projectRoot(id)` as existing routes do. Validate body fields as strings. Do not alter recipe draft routes.

- [ ] **Step 4: Re-run**

Run: `cd services/api && npx tsx --test src/index.test.ts src/candidateStore.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit only if asked**

---

### Task 3: Frontend candidate client

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/lib/noveloraApi.ts`
- Test: `apps/web/src/features/novelora-cockpit/lib/noveloraApi.test.ts`

**Interfaces:**
- Consumes: Task 2 routes via `/api` proxy
- Produces:
  - `export type CandidateSource = 'dialog' | 'workflow'`
  - `export interface FileCandidate { id: string; runId: string; targetPath: string; source: CandidateSource; status: 'pending'; createdAt: string }`
  - `export function fetchCandidates(projectId?: string): Promise<FileCandidate[]>`
  - `export function fetchCandidate(id: string, projectId?: string): Promise<FileCandidate & { content: string }>`
  - `export function createCandidate(input: { runId: string; targetPath: string; source: CandidateSource; content: string }, projectId?: string): Promise<FileCandidate>`
  - `export function acceptCandidate(id: string, projectId?: string): Promise<{ ok: boolean }>`
  - `export function discardCandidate(id: string, projectId?: string): Promise<{ ok: boolean }>`
- Default `projectId` is `default-project`. Paths: `/api/projects/${projectId}/candidates`.

- [ ] **Step 1: Write the failing test**

Append to `noveloraApi.test.ts`:

```ts
it('lists and accepts candidates through the /api proxy path', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(okJson([{ id: 'c1', targetPath: 'chapters/ch_03.md' }]))
    .mockResolvedValueOnce(okJson({ ok: true }))
    .mockResolvedValueOnce(okJson({ ok: true }));
  vi.stubGlobal('fetch', fetchMock);
  await fetchCandidates();
  expect(fetchMock).toHaveBeenCalledWith('/api/projects/default-project/candidates');
  await acceptCandidate('c1');
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/api/projects/default-project/candidates/c1/accept',
    expect.objectContaining({ method: 'POST' }),
  );
  await discardCandidate('c1');
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/api/projects/default-project/candidates/c1/discard',
    expect.objectContaining({ method: 'POST' }),
  );
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npm --prefix apps/web run test -- --run src/features/novelora-cockpit/lib/noveloraApi.test.ts`

Expected: FAIL (exports missing).

- [ ] **Step 3: Add the functions**

Follow existing `request` / `jsonInit` helpers. `createCandidate` uses POST with JSON body.

- [ ] **Step 4: Re-run**

Same command. Expected: PASS.

- [ ] **Step 5: Commit only if asked**

---

### Task 4: Hermes catalog client

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/lib/hermesCatalog.ts`
- Test: `apps/web/src/features/novelora-cockpit/lib/hermesCatalog.test.ts`

**Interfaces:**
- Produces:
  - `export type CatalogKind = 'skill' | 'command' | 'expert'`
  - `export interface HermesCatalogItem { id: string; label: string; hint: string; kind: CatalogKind }`
  - `export interface HermesCatalog { skills: HermesCatalogItem[]; commands: HermesCatalogItem[]; experts: HermesCatalogItem[] }`
  - `export function emptyCatalog(): HermesCatalog` returns three empty arrays
  - `export async function fetchHermesCatalog(signal?: AbortSignal): Promise<HermesCatalog>`
- `fetchHermesCatalog` always `GET /hermes/v1/skills` with `Authorization: Bearer novelora-dev-key` (same key as `hermesChat.ts`).
- Hermes 0.20 envelope: `{ object: "list", data: Array<{ name: string; description?: string; category?: string }> }`. Map each row to `{ id: name, label: name, hint: description ?? category ?? '', kind: 'skill' }`.
- Also `GET /hermes/v1/capabilities` with the same bearer. If `endpoints.commands` or `endpoints.experts` exist, GET those paths prefixed with `/hermes` and map `data` the same way (`kind: 'command'` / `'expert'`). If those keys are absent, leave those arrays empty.
- Any non-OK or network error: return `emptyCatalog()`. Never throw. Never import or return `scene-drafting`, `plot-architect`, or other frontend fiction.

- [ ] **Step 1: Write the failing test**

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyCatalog, fetchHermesCatalog } from './hermesCatalog';

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('fetchHermesCatalog', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('maps GET /hermes/v1/skills and leaves experts empty without an experts endpoint', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === '/hermes/v1/skills') {
        return okJson({
          object: 'list',
          data: [{ name: 'github-pr-workflow', description: 'GitHub workflow skill', category: 'github' }],
        });
      }
      if (url === '/hermes/v1/capabilities') {
        return okJson({ endpoints: { skills: { path: '/v1/skills' } } });
      }
      return new Response('no', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const catalog = await fetchHermesCatalog();
    expect(fetchMock).toHaveBeenCalledWith(
      '/hermes/v1/skills',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer novelora-dev-key' }) }),
    );
    expect(catalog.skills).toEqual([
      { id: 'github-pr-workflow', label: 'github-pr-workflow', hint: 'GitHub workflow skill', kind: 'skill' },
    ]);
    expect(catalog.commands).toEqual([]);
    expect(catalog.experts).toEqual([]);
    expect(catalog.skills.some((item) => item.id === 'scene-drafting')).toBe(false);
  });

  it('returns empty lists when Hermes is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down'); }));
    expect(await fetchHermesCatalog()).toEqual(emptyCatalog());
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npm --prefix apps/web run test -- --run src/features/novelora-cockpit/lib/hermesCatalog.test.ts`

Expected: FAIL (module not found).

- [ ] **Step 3: Implement `hermesCatalog.ts`**

- [ ] **Step 4: Re-run**

Same command. Expected: PASS.

- [ ] **Step 5: Commit only if asked**

---

### Task 5: Bind `/` `@` to the Hermes catalog

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/EchoComposer.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/EchoComposer.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/EchoChat.tsx`
- Test: both composer tests and a thin EchoChat test if needed

**Interfaces:**
- Consumes: `HermesCatalog` from Task 4
- Produces: `EchoComposer` props add `catalog: HermesCatalog`
- `/` listbox `aria-label="技能"` shows `catalog.skills` then `catalog.commands`
- `@` listbox `aria-label="专家"` shows `catalog.experts`
- Insert `/${id} ` or `@${id} ` (unchanged token rule)
- Delete `ECHO_SKILLS` and `ECHO_EXPERTS` constants entirely
- `EchoChat` loads `fetchHermesCatalog()` on mount and passes it in
- Composer placeholder: `问 Hermes 关于本章`
- Textbox accessible name: `给 Hermes 的消息`

- [ ] **Step 1: Rewrite composer tests first**

Replace the `/` and `@` cases in `EchoComposer.test.tsx` so they pass a catalog fixture (Hermes-shaped ids, not 单章起草):

```ts
const catalog = {
  skills: [{ id: 'github-pr-workflow', label: 'github-pr-workflow', hint: 'GitHub', kind: 'skill' as const }],
  commands: [],
  experts: [{ id: 'delegate_task', label: 'delegate_task', hint: 'subagent', kind: 'expert' as const }],
};

it('opens Hermes skills when / is typed and inserts the chosen skill', async () => {
  const user = userEvent.setup();
  render(
    <EchoComposer
      catalog={catalog}
      streaming={false}
      onSend={() => undefined}
      onStop={() => undefined}
    />,
  );
  await user.type(screen.getByRole('textbox', { name: '给 Hermes 的消息' }), '/');
  const skills = await screen.findByRole('listbox', { name: '技能' });
  expect(skills).toBeVisible();
  await user.click(screen.getByRole('option', { name: /github-pr-workflow/i }));
  expect(screen.getByRole('textbox', { name: '给 Hermes 的消息' })).toHaveValue('/github-pr-workflow ');
});

it('opens Hermes experts when @ is typed', async () => {
  const user = userEvent.setup();
  render(
    <EchoComposer
      catalog={catalog}
      streaming={false}
      onSend={() => undefined}
      onStop={() => undefined}
    />,
  );
  await user.type(screen.getByRole('textbox', { name: '给 Hermes 的消息' }), '@');
  expect(await screen.findByRole('listbox', { name: '专家' })).toBeVisible();
  await user.click(screen.getByRole('option', { name: /delegate_task/i }));
  expect(screen.getByRole('textbox', { name: '给 Hermes 的消息' })).toHaveValue('@delegate_task ');
});

it('shows an empty skill menu when Hermes returned no skills', async () => {
  const user = userEvent.setup();
  render(
    <EchoComposer
      catalog={{ skills: [], commands: [], experts: [] }}
      streaming={false}
      onSend={() => undefined}
      onStop={() => undefined}
    />,
  );
  await user.type(screen.getByRole('textbox', { name: '给 Hermes 的消息' }), '/');
  expect(screen.getByRole('listbox', { name: '技能' })).toBeVisible();
  expect(screen.queryByRole('option')).not.toBeInTheDocument();
});
```

Keep attach + model tests, but update the textbox name. Model button stays `模型`.

- [ ] **Step 2: Run composer tests (expect FAIL)**

Run: `npm --prefix apps/web run test -- --run src/features/novelora-cockpit/components/writing/EchoComposer.test.tsx`

Expected: FAIL (old props / old names / old constants).

- [ ] **Step 3: Implement composer + EchoChat catalog load**

`EchoChat` title/eyebrow may stay until Task 6; this task only needs catalog plumbing so composer compiles. If `EchoChat.tsx` does not yet pass `catalog`, pass `emptyCatalog()` temporarily only if Task 6 is next in the same session; prefer loading `fetchHermesCatalog` here.

Grep the repo for `ECHO_SKILLS`, `单章起草`, `plot-architect` and update any broken test. Do not reintroduce those strings as product catalog data.

- [ ] **Step 4: Re-run composer tests**

Same command. Expected: PASS.

- [ ] **Step 5: Commit only if asked**

---

### Task 6: Dialog copy, book context, candidate ingest after a turn

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/EchoChat.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/EchoChat.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/WritingView.tsx` only if needed to pass `projectId` / `chapterNum` / `onCandidatesChanged`

**Interfaces:**
- Offline alert text: `Hermes 离线。请确认本机网关在运行。`
- Back-online status: `Hermes 已重新连上`
- Header eyebrow: `写作伙伴` ; heading: `Hermes`
- Section `aria-label`: `Hermes 对话`
- First user turn still prefixes `context` (existing). Prefix also includes this exact Chinese instruction block:

```
你是本机 Hermes。规划、todo、工具按你自己的方式进行。
改这本书的文件时，不要直接覆盖真文件。把正文候选交给文件核。
不要把 characters.json 写进回复。
```

- After a successful `streamChat` (not abort, not offline), `EchoChat` calls `createCandidate` only when the implementer also adds a helper `extractChapterCandidate(text: string, chapterNum: number): string | null` in `apps/web/src/features/novelora-cockpit/lib/chapterCandidate.ts`:
  - If the assistant message contains a fenced ` ```markdown ` or ` ```md ` block, return that inner text
  - Else return `null` (no candidate)
  - This is a fallback ingest so tests can prove 候选 without Hermes file tools. Prefer later replacing it with disk sync; do not parse `characters.json`
- `runId` is `window.localStorage` key `novelora.hermes.session` (same as `hermesChat.ts`). If you need to export `sessionId`, move it to `hermesChat.ts` as `export function hermesSessionId(): string` and use it from both files.
- `targetPath` is `chapters/ch_${String(chapterNum).padStart(2, '0')}.md`
- `source` is `'dialog'`
- Add `chapterNum: number` and `projectId: string` and optional `onCandidatesChanged?: () => void` to `EchoChat`

- [ ] **Step 1: Tests**

`chapterCandidate.ts` test:

```ts
import { describe, expect, it } from 'vitest';
import { extractChapterCandidate } from './chapterCandidate';

it('returns the markdown fence and ignores unfenced chat', () => {
  expect(extractChapterCandidate('just talk', 3)).toBeNull();
  expect(extractChapterCandidate('intro\n```markdown\n# 第三章\n```\n', 3)).toBe('# 第三章\n');
});
```

`EchoChat.test.tsx`: change unreachable copy assertion to `Hermes 离线。请确认本机网关在运行。` Add a case: mock `streamChat` to yield a fenced chapter, mock `createCandidate`, send a message, expect `createCandidate` with `targetPath: 'chapters/ch_03.md'` and `source: 'dialog'`.

- [ ] **Step 2: Run (expect FAIL)**

Run: `npm --prefix apps/web run test -- --run src/features/novelora-cockpit/lib/chapterCandidate.test.ts src/features/novelora-cockpit/components/writing/EchoChat.test.tsx`

- [ ] **Step 3: Implement**

Update `WritingView` to pass `projectId` and `chapterNum` into `EchoChat`.

- [ ] **Step 4: Re-run those tests plus `MarkdownDocumentPage.test.tsx`**

Confirm world save still does not call `/hermes`.

- [ ] **Step 5: Commit only if asked**

---

### Task 7: Candidate review in the writing page

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/components/writing/CandidateReview.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/writing/CandidateReview.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/WritingView.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/WritingView.test.tsx` if it exists

**Interfaces:**
- `CandidateReview` props: `{ projectId: string; chapterNum: number; refreshKey: number; onAccepted: () => void }`
- Loads `fetchCandidates(projectId)`, keeps rows whose `targetPath` equals `chapters/ch_${pad(chapterNum)}.md`
- Region `aria-label="待审候选"`
- Each row: show `targetPath`; buttons `接受` and `丢弃`
- Accept calls `acceptCandidate` then `onAccepted` (WritingView refetches the chapter)
- Discard calls `discardCandidate` then refreshes the list
- Empty: no region, or region with `现在没有待审候选`

- [ ] **Step 1: Write the failing test**

```tsx
it('accepts a pending chapter candidate', async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/candidates') && !init) {
      return okJson([{
        id: 'c1',
        runId: 's',
        targetPath: 'chapters/ch_03.md',
        source: 'dialog',
        status: 'pending',
        createdAt: '2026-08-15T00:00:00.000Z',
      }]);
    }
    if (String(url).includes('/accept')) return okJson({ ok: true });
    return okJson([]);
  });
  vi.stubGlobal('fetch', fetchMock);
  const onAccepted = vi.fn();
  render(<CandidateReview projectId="default-project" chapterNum={3} refreshKey={0} onAccepted={onAccepted} />);
  expect(await screen.findByRole('region', { name: '待审候选' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '接受' }));
  expect(onAccepted).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run to fail**

Run: `npm --prefix apps/web run test -- --run src/features/novelora-cockpit/components/writing/CandidateReview.test.tsx`

- [ ] **Step 3: Implement and mount in WritingView** under the editor, still inside `.bixin-home` (do not wrap with `AppShell`)

- [ ] **Step 4: Re-run CandidateReview + WritingView tests**

- [ ] **Step 5: Commit only if asked**

---

### Task 8: Verify the dialog MVP slice

**Files:** none new. Run the suites.

- [ ] **Step 1: API tests**

Run: `cd services/api && npx tsx --test src/candidateStore.test.ts src/index.test.ts`

Expected: PASS.

- [ ] **Step 2: Web tests**

Run: `npm run test:web`

Expected: PASS. Confirm no test still queries `单章起草` or `情节顾问` as a live catalog option.

- [ ] **Step 3: Lint and build**

Run: `npm run lint:web` and `npm run build:web`

Expected: lint exit 0 (pre-existing RelationsPage optional-chaining warning is allowed). Build exit 0.

- [ ] **Step 4: Manual check (do not claim done without this)**

With api `8787` and Hermes `8642` up, open the 笔心 writing view from this repo's `BixinHomePage`. Type `/` and confirm the menu is Hermes skill names (for example `github-pr-workflow` or whatever `/v1/skills` returns), not 单章起草. Type `@`; empty is OK if Hermes has no experts endpoint. Send a message; if Hermes is down, see `Hermes 离线。请确认本机网关在运行。` Do not start a second product UI.

- [ ] **Step 5: Commit only if asked**
