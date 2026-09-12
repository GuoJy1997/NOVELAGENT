# Visual Component System Refresh Implementation Plan (Plan B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the Novelora cockpit's visual components into an illustration-matched white-mint liquid-glass system, per the approved spec §3, without changing layout or behavior.

**Architecture:** Token-first: extend `tokens.css` with glass levels, mint environmental shadows, and illustration-derived teal/aqua accents; then restyle topbar, sidebar nav, panel cards, ACT/chapter cards, the AI Writing Partner (task-flow presentation), and the writing view. Every change is locked by the CSS contract suite in `echo.test.ts`.

**Tech Stack:** React 19, plain CSS, Vitest contract tests. No new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-08-12-writing-workspace-design.md` (§3 + taste-skill constraints in §1)

## Global Constraints

- Layout and behavior stay identical: no grid/track/positioning changes on Dashboard; only surfaces, borders, shadows, color, typography, micro-feedback.
- Design tokens only: no hardcoded hex/rgb in echo.css outside tokens.css definitions; new colors go in tokens.css.
- Radius lock: only `--echo-radius-card` (13px), `--echo-radius-panel` (18px), and pill `999px`. No new radius values.
- Shadow lock: no pure-black/gray shadows; all shadows use the mint environmental tokens from Task 1.
- Glass is a backdrop-filter approximation and MUST have a `@media (prefers-reduced-transparency: reduce)` solid fallback (Task 1).
- `prefers-reduced-motion: reduce` already kills transitions; new hover transitions must be `transform`/`opacity` only, 150-250ms.
- Visible UI strings: no `—`/`–`; no new visible copy at all in this plan except Task 6 status labels.
- Icons: existing `<img>`-based icons stay; no new hand-rolled SVG icons. The one allowed inline SVG addition is the gradient `<defs>` for progress strokes in Task 5.
- No git commits without asking the user (currently disabled phase).
- After every task: `cd apps/web && npx vitest run src/styles/echo.test.ts` must pass, and before each task review `npm run test:web` + `npm run lint:web` from repo root must pass.
- Contract-test discipline: when a task changes a declaration that `echo.test.ts` already asserts, update the assertion in the same task; never delete an assertion to make it pass without replacing it with the new expected value.

---

### Task 1: Glass + accent token foundation

**Files:**
- Modify: `apps/web/src/styles/tokens.css`
- Test: `apps/web/src/styles/echo.test.ts`

**Interfaces:**
- Produces (used by every later task):
  - `--echo-glass-pill`, `--echo-glass-panel`, `--echo-glass-card` (surface fills, most-to-least transparent)
  - `--echo-glass-border` (1px semi-white border), `--echo-glass-highlight` (inset top highlight shadow)
  - `--echo-shadow-mint-sm/md/lg` (environmental mint shadows)
  - `--echo-teal-500`, `--echo-aqua-400` (illustration accents), `--echo-gradient-accent` (mint→teal 135deg)

- [ ] **Step 1: Write the failing contract test**

Add to `echo.test.ts` (uses the existing `ruleBody`/`expectDeclaration` helpers; tokens live in `tokensCss` — check how the file reads tokens.css; if only echo.css is parsed, extend the same pattern to read tokens.css as `tokensCss` via the same `readFileSync` approach used for echo.css):

```ts
  it('defines the illustration-matched glass token system with a solid fallback', () => {
    const root = ruleBody(tokensCss, ':root');
    for (const token of [
      '--echo-glass-pill',
      '--echo-glass-panel',
      '--echo-glass-card',
      '--echo-glass-border',
      '--echo-glass-highlight',
      '--echo-shadow-mint-sm',
      '--echo-shadow-mint-md',
      '--echo-shadow-mint-lg',
      '--echo-teal-500',
      '--echo-aqua-400',
      '--echo-gradient-accent',
    ]) {
      expect(root).toContain(token);
    }
    const fallback = mediaBlock(tokensCss, 'prefers-reduced-transparency: reduce');
    expect(fallback).toContain('--echo-glass-panel');
    expect(fallback).toMatch(/--echo-glass-panel\s*:\s*var\(--echo-surface\)/);
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `cd apps/web && npx vitest run src/styles/echo.test.ts`
Expected: FAIL (tokens missing).

- [ ] **Step 3: Add the tokens**

Append inside `:root` in `tokens.css` (after the echo block):

```css
  --echo-glass-pill: rgb(255 255 255 / 55%);
  --echo-glass-panel: rgb(255 255 255 / 72%);
  --echo-glass-card: rgb(255 255 255 / 88%);
  --echo-glass-border: rgb(255 255 255 / 65%);
  --echo-glass-highlight: inset 0 1px 0 rgb(255 255 255 / 60%);
  --echo-shadow-mint-sm: 0 2px 8px rgb(9 160 110 / 6%);
  --echo-shadow-mint-md: 0 10px 28px rgb(9 160 110 / 10%);
  --echo-shadow-mint-lg: 0 18px 48px rgb(9 160 110 / 14%);
  --echo-teal-500: #14c2c0;
  --echo-aqua-400: #4fd8e8;
  --echo-gradient-accent: linear-gradient(135deg, var(--echo-mint-500), var(--echo-teal-500));
```

Append at the end of `tokens.css`:

```css
@media (prefers-reduced-transparency: reduce) {
  :root {
    --echo-glass-pill: var(--echo-surface);
    --echo-glass-panel: var(--echo-surface);
    --echo-glass-card: var(--echo-surface);
  }
}
```

- [ ] **Step 4: Run tests**

Run: `cd apps/web && npx vitest run src/styles/echo.test.ts` → PASS. Then `npm run test:web` from repo root → all PASS.

- [ ] **Step 5: Commit (ask user first)**

`feat(web): add illustration-matched glass token foundation`

---

### Task 2: Topbar glass pills

**Files:**
- Modify: `apps/web/src/styles/echo.css` (`.workspace-topbar-content .workspace-search`, `.topbar-icon-button`, `.user-avatar`, plus the project switcher / status pill / word count selectors already in echo.css — locate them by reading the topbar section, roughly lines 354-570)
- Test: `apps/web/src/styles/echo.test.ts`

**Interfaces:**
- Consumes: Task 1 tokens.
- Produces: all topbar controls share one "glass pill" treatment: `background: var(--echo-glass-pill)`, `backdrop-filter: blur(18px) saturate(160%)`, `border: 1px solid var(--echo-glass-border)`, `box-shadow: var(--echo-glass-highlight), var(--echo-shadow-mint-sm)`, `border-radius: 999px`.

- [ ] **Step 1: Write the failing contract test**

```ts
  it('unifies topbar controls as glass pills', () => {
    const search = ruleBody(echoCss, '.workspace-topbar-content .workspace-search');
    expectDeclaration(search, 'background', 'var(--echo-glass-pill)');
    expectDeclaration(search, 'border', '1px solid var(--echo-glass-border)');
    expectDeclaration(search, 'border-radius', '999px');
    expect(search).toMatch(/backdrop-filter\s*:\s*blur\(18px\) saturate\(160%\)/);
    expect(search).toContain('var(--echo-shadow-mint-sm)');
    const iconButton = ruleBody(echoCss, '.workspace-topbar-content .topbar-icon-button');
    expectDeclaration(iconButton, 'background', 'var(--echo-glass-pill)');
    expectDeclaration(iconButton, 'border-radius', '999px');
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `cd apps/web && npx vitest run src/styles/echo.test.ts` → FAIL.

- [ ] **Step 3: Restyle the topbar controls**

In echo.css, for each topbar control selector (search, `.topbar-icon-button`, `.user-avatar`, the project switcher button, the status/word-count pills):
- set `background: var(--echo-glass-pill)` (replacing `var(--echo-surface)` or transparent)
- add `backdrop-filter: blur(18px) saturate(160%);` and `-webkit-backdrop-filter` variant
- set `border: 1px solid var(--echo-glass-border)` (replacing transparent/existing)
- set `box-shadow: var(--echo-glass-highlight), var(--echo-shadow-mint-sm)`
- keep existing border-radius if already 999px, else set `border-radius: 999px` (these are pills per Global Constraints)
- update any existing contract assertions in echo.test.ts that pinned the old `background`/`border`/`box-shadow` values for these selectors (search echo.test.ts for `workspace-search`, `topbar-icon-button`, `user-avatar` and update the expected values to the new ones)

- [ ] **Step 4: Run tests**

Run: `cd apps/web && npx vitest run src/styles/echo.test.ts` → PASS; repo root `npm run test:web` → all PASS.

- [ ] **Step 5: Visual check + commit (ask user first)**

Screenshot `http://localhost:5173/` (Playwright) and confirm the topbar reads as glass pills over the hero art.
`feat(web): restyle topbar controls as glass pills`

---

### Task 3: Sidebar navigation liquid states

**Files:**
- Modify: `apps/web/src/styles/echo.css` (`.project-sidebar-content .project-navigation__item` block, lines ~204-260; the `echo-progress-card` Today progress card; `.echo-new-project` button)
- Test: `apps/web/src/styles/echo.test.ts`

**Interfaces:**
- Consumes: Task 1 tokens.
- Produces: nav active state = glass fill + gradient indicator bar; hover = faint mint glass.

- [ ] **Step 1: Write the failing contract test**

```ts
  it('gives sidebar navigation a liquid mint active state', () => {
    const active = ruleBody(echoCss, '.project-sidebar-content .project-navigation__item.is-active');
    expectDeclaration(active, 'background', 'var(--echo-glass-pill)');
    expect(active).toContain('var(--echo-shadow-mint-sm)');
    const indicator = ruleBody(echoCss, '.project-sidebar-content .project-navigation__item.is-active::before');
    expectDeclaration(indicator, 'background', 'var(--echo-gradient-accent)');
    const hover = ruleBody(echoCss, '.project-sidebar-content .project-navigation__item:hover');
    expectDeclaration(hover, 'background', 'var(--echo-mint-50)');
  });
```

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Restyle**

- `.project-navigation__item.is-active`: `background: var(--echo-glass-pill)`, add `box-shadow: var(--echo-glass-highlight), var(--echo-shadow-mint-sm)`, add `backdrop-filter: blur(14px)`.
- `.is-active::before`: `background: var(--echo-gradient-accent)` (keep size/position).
- `.project-navigation__item:hover`: keep `background: var(--echo-mint-50)` and add `transition: background-color 160ms ease-out, box-shadow 160ms ease-out` on the base item.
- `.echo-new-project`: `background: var(--echo-gradient-accent)` replacing the flat mint; keep text contrast (white text on gradient passes if mint-500/teal-500 — verify contrast, if weak use `color: #ffffff` with `text-shadow: none`).
- Today progress card (`.echo-progress-card` or the actual selector — locate it): `background: var(--echo-glass-panel)`, `backdrop-filter: blur(16px)`, `border: 1px solid var(--echo-glass-border)`, `box-shadow: var(--echo-glass-highlight), var(--echo-shadow-mint-md)`.
- Update echo.test.ts assertions that pinned old values for these selectors.

- [ ] **Step 4: Run tests** → echo.test.ts PASS; `npm run test:web` PASS.

- [ ] **Step 5: Commit (ask user first)**

`feat(web): liquid mint sidebar states and gradient primary action`

---

### Task 4: Panel cards become glass

**Files:**
- Modify: `apps/web/src/styles/echo.css` (`.occluded-panel__surface`, panel heading rules `.echo-panel-heading`, plus `.ai-writing-partner`, `.memory-layer` and the lower-row panel surfaces if they do not use OccludedPanel)
- Test: `apps/web/src/styles/echo.test.ts`

**Interfaces:**
- Consumes: Task 1 tokens.
- Produces: panel surface = `background: var(--echo-glass-panel)` + `backdrop-filter: blur(18px) saturate(150%)` + `border: 1px solid var(--echo-glass-border)` + `box-shadow: var(--echo-glass-highlight), var(--echo-shadow-mint-md)`; `border-radius: var(--echo-radius-panel)` unchanged.

- [ ] **Step 1: Write the failing contract test**

```ts
  it('renders panel surfaces as liquid glass over the hero art', () => {
    const surface = ruleBody(echoCss, '.occluded-panel__surface');
    expectDeclaration(surface, 'background', 'var(--echo-glass-panel)');
    expectDeclaration(surface, 'border', '1px solid var(--echo-glass-border)');
    expect(surface).toMatch(/backdrop-filter\s*:\s*blur\(18px\) saturate\(150%\)/);
    expect(surface).toContain('var(--echo-shadow-mint-md)');
    expectDeclaration(surface, 'border-radius', 'var(--echo-radius-panel)');
  });
```

- [ ] **Step 2: Run to verify failure** → FAIL (the existing contract asserts `background: var(--echo-surface)` and `border: 1px solid var(--echo-line)` — update those assertions).

- [ ] **Step 3: Restyle**

- `.occluded-panel__surface`: apply the Produces block exactly.
- Any panel not built on OccludedPanel (check `.ai-writing-partner`, `.memory-layer`, `.inspiration-vault`, `.character-graph`, `.clue-flow` rules): apply the same surface treatment to their outer container.
- Panel headings (`.echo-panel-heading`): bump title weight to 750 and add `letter-spacing: 0.01em`; keep sizes.
- Update all echo.test.ts assertions pinning the old surface values (search for `occluded-panel__surface`, `--echo-surface` on panel selectors, `--echo-shadow-card` usages).

- [ ] **Step 4: Run tests** → PASS; `npm run test:web` PASS.

- [ ] **Step 5: Commit (ask user first)**

`feat(web): liquid glass panel surfaces`

---

### Task 5: ACT + chapter card selected states, gradient progress strokes

**Files:**
- Modify: `apps/web/src/styles/echo.css` (`.echo-act-card`, `.echo-act-card.is-selected`, `.chapter-timeline__card`, its selected variant, hover rules)
- Modify: `apps/web/src/features/novelora-cockpit/components/StructureMap.tsx` and `ChapterSwimlane.tsx` (SVG gradient defs only)
- Test: `apps/web/src/styles/echo.test.ts`, component tests for the two modified components

**Interfaces:**
- Produces: selected card = gradient 1px border via `border: 1px solid transparent; background: var(--echo-glass-card) padding-box, var(--echo-gradient-accent) border-box;` + `box-shadow: var(--echo-shadow-mint-md)`; hover = `transform: translateY(-2px)` with `transition: transform 160ms ease-out, box-shadow 160ms ease-out`.

- [ ] **Step 1: Write the failing contract tests**

```ts
  it('marks selected act and chapter cards with a gradient border and lift', () => {
    const act = ruleBody(echoCss, '.echo-act-card.is-selected');
    expect(act).toContain('var(--echo-gradient-accent) border-box');
    expect(act).toContain('var(--echo-shadow-mint-md)');
    const chapter = ruleBody(echoCss, '.chapter-timeline__card.is-selected, .chapter-timeline__card[aria-selected="true"]');
    expect(chapter).toContain('var(--echo-gradient-accent) border-box');
    const hover = ruleBody(echoCss, '.echo-act-card:hover');
    expect(hover).toMatch(/transform\s*:\s*translateY\(-2px\)/);
  });
```

(Adjust the chapter selected selector to the real one in echo.css — read the `.chapter-timeline__card` rules first and use the actual selected-state selector in both CSS and test.)

Component test additions: in `StructureMap.test.tsx` and `ChapterSwimlane.test.tsx`, assert the progress SVG contains a `linearGradient` def with id referenced by the progress path stroke:

```ts
expect(container.querySelector('linearGradient')).not.toBeNull();
expect(container.innerHTML).toMatch(/stroke="url\(#/);
```

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Implement**

- CSS: apply the Produces treatments to `.echo-act-card.is-selected` and the chapter card selected state; base cards get `background: var(--echo-glass-card)`; hover gets the lift (both card types); ensure `prefers-reduced-motion` block already neutralizes transitions (it does globally).
- Components: in each component's progress SVG add

```tsx
<defs>
  <linearGradient id="echoProgressGradient" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stopColor="var(--echo-mint-500)" />
    <stop offset="1" stopColor="var(--echo-teal-500)" />
  </linearGradient>
</defs>
```

and set the progress path/line `stroke="url(#echoProgressGradient)"` (use a unique id per component, e.g. `echoProgressGradientStructure` / `echoProgressGradientTimeline`, to avoid duplicate ids on one page).

- [ ] **Step 4: Run tests** → PASS; `npm run test:web` PASS.

- [ ] **Step 5: Commit (ask user first)**

`feat(web): gradient selected states and progress strokes`

---

### Task 6: AI Writing Partner becomes a task flow

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/AIWritingPartner.tsx`
- Modify: `apps/web/src/styles/echo.css`
- Test: `apps/web/src/features/novelora-cockpit/components/AIWritingPartner.test.tsx`, `apps/web/src/styles/echo.test.ts`

**Interfaces:**
- Consumes: existing `project.agentTasks` data (read the component and data types first; keep the data model unchanged).
- Produces: task list rendered as a vertical flow: each task row = status glyph (complete: mint check circle `✓`; active: pulsing dot; pending: hollow circle) + title + progress; rows connected by a 1px vertical line via `.agent-task-flow li::before`. Accessible: list `aria-label="Active tasks"`, each item text includes its status (`Complete`/`Active`/`Pending`).

- [ ] **Step 1: Write the failing tests**

Component test (adapt queries to the real task data):

```tsx
  it('renders tasks as a connected flow with status labels', () => {
    render(<AIWritingPartner project={noveloraMockProject} onViewAll={() => undefined} />);
    const list = screen.getByRole('list', { name: 'Active tasks' });
    const items = within(list).getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(1);
    expect(items[0]).toHaveTextContent(/Complete|Active|Pending/);
    expect(list.querySelectorAll('.agent-task-flow__connector, li[class*="flow"]').length).toBeGreaterThan(0);
  });
```

Contract test:

```ts
  it('connects agent tasks with a vertical flow line', () => {
    const flow = ruleBody(echoCss, '.agent-task-flow');
    expectDeclaration(flow, 'list-style', 'none');
    const connector = ruleBody(echoCss, '.agent-task-flow li::before');
    expect(connector).toMatch(/border-left|background/);
    expect(connector).toContain("content: ''");
  });
```

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Implement**

- AIWritingPartner.tsx: wrap tasks in `<ul className="agent-task-flow" aria-label="Active tasks">`; each `<li>` renders a status glyph span (aria-hidden) + a visually-hidden-or-inline status text + title + existing progress bar; map task status: `complete` → `✓ Complete`, `active`/`in-progress` → `Active`, else `Pending`. Keep the existing View All button and greeting intact.
- CSS: `.agent-task-flow { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; position: relative; }`, `li { position: relative; padding-left: 26px; }`, `li::before { content: ''; position: absolute; left: 7px; top: 18px; bottom: -12px; border-left: 1px solid var(--echo-mint-100); }`, `li:last-child::before { display: none; }`, glyph spans `.agent-task-flow__glyph` 16px circle with mint border; complete glyph `background: var(--echo-gradient-accent); color: #fff;` active glyph gets a `transition`-safe opacity pulse via `@keyframes` gated behind `@media (prefers-reduced-motion: no-preference)`.
- Update existing AIWritingPartner tests that asserted the old task markup (keep accessible names stable where possible).

- [ ] **Step 4: Run tests** → PASS; `npm run test:web` PASS.

- [ ] **Step 5: Commit (ask user first)**

`feat(web): present agent tasks as a connected flow`

---

### Task 7: Writing view glass + editor paper

**Files:**
- Modify: `apps/web/src/styles/echo.css` (the `.writing-view*` / `.chapter-list` / `.chapter-editor` / `.echo-chat` rules appended in Plan A)
- Test: `apps/web/src/styles/echo.test.ts`

**Interfaces:**
- Consumes: Task 1 tokens.
- Produces: chapter-list buttons + chat panel = `var(--echo-glass-panel)` glass; editor surface = near-solid paper `var(--echo-glass-card)` (readability); selected chapter button = gradient border treatment from Task 5.

- [ ] **Step 1: Write the failing contract test**

```ts
  it('styles the writing workspace with the glass system and a paper editor', () => {
    const editor = ruleBody(echoCss, '.writing-view__editor');
    expectDeclaration(editor, 'background', 'var(--echo-glass-card)');
    const chat = ruleBody(echoCss, '.writing-view__chat');
    expectDeclaration(chat, 'background', 'var(--echo-glass-panel)');
    expect(chat).toContain('var(--echo-shadow-mint-md)');
    const selected = ruleBody(echoCss, ".chapter-list button[aria-pressed='true']");
    expect(selected).toContain('var(--echo-gradient-accent) border-box');
  });
```

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Implement**

- `.writing-view__editor`: `background: var(--echo-glass-card)` + `box-shadow: var(--echo-glass-highlight), var(--echo-shadow-mint-md)`.
- `.writing-view__chat` and `.chapter-list button`: glass panel treatment (`background: var(--echo-glass-panel)`, `backdrop-filter: blur(16px)`, `border: 1px solid var(--echo-glass-border)`).
- `.chapter-list button[aria-pressed='true']`: replace the flat mint border with the gradient-border treatment (`border: 1px solid transparent; background: var(--echo-glass-panel) padding-box, var(--echo-gradient-accent) border-box;`).
- Chat composer textarea: `background: var(--echo-surface)` (solid input), radius 12px already fine.
- Update the Plan A contract block (`.writing-view` three-column assertions) only if declarations conflict (they should not).

- [ ] **Step 4: Run tests** → PASS; `npm run test:web` PASS.

- [ ] **Step 5: Commit (ask user first)**

`feat(web): glass writing workspace with paper editor`

---

### Task 8: Echo offline auto-recovery

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/EchoChat.tsx`
- Test: `apps/web/src/features/novelora-cockpit/components/writing/EchoChat.test.tsx`

**Interfaces:**
- Produces: when a send fails with a network error, EchoChat shows the error AND starts polling `GET /hermes/health` every 15s; on success it clears the error and shows a transient `Echo is back online` status (`role="status"`). Polling stops on unmount and when online.

- [ ] **Step 1: Write the failing test**

```tsx
  it('recovers automatically when hermes comes back', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValue(new Response('{"status":"ok"}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    render(<EchoChat context="Chapter 3" />);
    await user.type(screen.getByRole('textbox', { name: 'Message Echo' }), 'hi');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByRole('alert');
    await act(async () => { vi.advanceTimersByTime(16000); });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/back online/i));
    vi.useRealTimers();
  });
```

(Adapt timer utilities to the file's existing conventions.)

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Implement**

In EchoChat: add `offline` state; on send catch (non-abort), set offline true; an effect polls `/hermes/health` every 15s while offline (setInterval, cleared on unmount/online); on ok response set offline false and show the transient status. Keep the existing error text in the alert until recovery.

- [ ] **Step 4: Run tests** → PASS; `npm run test:web` PASS.

- [ ] **Step 5: Commit (ask user first)**

`feat(web): auto-recover Echo chat when hermes returns`

---

### Task 9: Full visual QA

**Files:**
- Modify: any CSS/test fixes discovered
- Test: whole suite

- [ ] **Step 1: Full verification**

Run from repo root: `npm run test:web`, `npm run lint:web`, `npm run build:web`, and `cd services/api && npx tsx --test src/index.test.ts src/projectStore.test.ts scripts/seed.test.ts`.

- [ ] **Step 2: Screenshot matrix**

Playwright screenshots of dashboard + writing view at 1920x1080 and 1280x720 into `qa-screenshots/plan-b/`; verify: glass pills over hero, panel glass, gradient selected states, task flow connectors, writing view paper editor + glass chat; no rectangular white cuts; reduced-transparency fallback sanity (emulate via Playwright `reducedTransparency: 'reduce'` context and screenshot).

- [ ] **Step 3: UI approval review**

Dispatch the ui-approval reviewer with the screenshots vs `design.md` spec §3 requirements; address findings.

- [ ] **Step 4: Commit (ask user first)**

`feat(web): complete visual component system refresh`

---

## Self-Review Notes

- Spec §3 coverage: 3.1 principles → B1; 3.2 topbar → B2, sidebar → B3, panel cards → B4, ACT/chapter cards → B5, AI Partner task flow → B6, scrollbar/divider refinement folded into B4/B7 surface work; 3.3 motion → hover transitions in B3/B5 with reduced-motion already global.
- Plan A deferred spec deviations addressed here: §4.3 offline auto-recovery → B8; api-down full-screen error styling → accepted as-is (simple, clear); §7 readonly-editor variant stays deferred (not in scope).
- Type consistency: token names identical across tasks; gradient-border idiom (`padding-box`/`border-box`) identical in B5/B7; test helper names (`ruleBody`, `expectDeclaration`, `mediaBlock`) match the existing echo.test.ts API — B1 includes a note to extend reading for tokens.css.
