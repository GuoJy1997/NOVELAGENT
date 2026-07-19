# Echo Reference Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Novelora cockpit UI with the `assets/参考图/image.png` reference at high fidelity — connected structure map, five-layer agent rail, bottom status bar, curved clue flow, typed character relationships, sidebar CTA and floating Nova — while keeping every piece of content fixture-backed and every existing test contract intact.

**Architecture:** Component-by-component in-place modification (approved spec: `docs/superpowers/specs/2026-07-19-echo-reference-alignment-design.md`). One data-model task first, then six UI units, then end-to-end verification. No new dependencies, no routing, no state library; everything stays mock and presentational.

**Tech Stack:** React 19 + TypeScript (~6.0, `verbatimModuleSyntax`, `erasableSyntaxOnly`), Vite 8, Vitest 4 + Testing Library, plain CSS with tokens in `src/styles/tokens.css`, oxlint.

---

## Read first: hard constraints discovered in the codebase

These are locked by existing tests. Every task must respect them:

1. `src/styles/global.test.ts` parses CSS **source text** (variables `globalCss`, `cockpitCss`, `tokensCss` read via `readFileSync(resolve(process.cwd(), ...))`). It exactly locks: core token values, the glass surface hierarchy (`.structure-map/.chapter-swimlane/.inspiration-vault/.character-graph/.clue-attribution-flow` and `.nova-lead-card/.agent-panel__section/.focus-mode-toggle` border/background/box-shadow strings), the active-state four-piece rule, z-index ladder (backdrop 0 → columns 3 → book 4 → foreground 5 → drawer backdrop 10), and visual-stage tokens. **Do not modify those rules; add new standalone rules instead.**
2. `AgentPanel.test.tsx` locks: `img` named `Nova` with `cockpit-mascot*.webp` src; every task title/focus/owner; progressbar named `/Scan harbor continuity/i`; `78%`; **every memory source label visible on default render**; every subagent/skill/review-check; Focus Mode toggle `aria-pressed` flipping. Memory tabs must therefore default to a view that shows all sources.
3. `App.test.tsx` locks: clue-flow texts (`Provided by …`, `Triggered by …`, `Received by …`, `Paid off by …`), `Evidence connected to Chapter N.` note, `role="article"` per clue card, Focus Mode button name `/Focus Mode/i` with `aria-pressed` and `On` text after click, chapter drawer focus restore.
4. `CharacterGraph.test.tsx` locks: zero buttons in the graph, legend item text `Kael — Liora · uneasy allies`, the 620×255 stage and `viewBox="0 0 620 255"`.
5. `AppShell.test.tsx` locks: exactly one `.cockpit-visual-stage`, three landmarks, 7 buttons inside the `Workspace navigation` nav (a New Project CTA must live **outside** `<nav>`).
6. `ProjectSidebar.test.tsx` locks: retired 2D Nova (`.nova-scene`, `mascot_nova_front.svg`) must NOT reappear.
7. TypeScript strictness: use `import type` for type-only imports, no enums, no unused locals/params. Tests must run from `apps/web` (CSS contract tests resolve `process.cwd()`).
8. z-index has no tokens; new layers must slot between foreground (5) and drawer backdrop (10).
9. `cockpit.css` stays a single file. Prefix each task's CSS additions with a banner comment like `/* ===== BottomStatusBar ===== */` (the contract tests strip comments before parsing, so banners are safe).

Commands (from repo root unless noted):

```bash
npm run test:web     # full Vitest suite (runs in apps/web)
npm run lint:web     # oxlint
npm run build:web    # tsc -b && vite build
cd apps/web && npx vitest run src/path/to/file.test.tsx   # single test file
```

---

### Task 0: Data model and fixture extension

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/types.ts`
- Modify: `apps/web/src/features/novelora-cockpit/data/noveloraMockProject.ts`
- Test: `apps/web/src/features/novelora-cockpit/data/noveloraMockProject.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `data/noveloraMockProject.test.ts` inside the existing `describe`:

```ts
it('supplies narrative markers, save state, focus modes, quote, and greeting for the reference chrome', () => {
  const tones = new Set(['conflict', 'climax', 'resolution']);
  for (const act of noveloraMockProject.acts) {
    for (const marker of act.narrativeMarkers) {
      expect(marker.label).toMatch(/\S/);
      expect(tones.has(marker.tone)).toBe(true);
    }
  }
  expect(
    noveloraMockProject.acts.flatMap((act) => act.narrativeMarkers).length,
  ).toBeGreaterThanOrEqual(2);

  expect(noveloraMockProject.lastSavedLabel).toMatch(/\S/);
  expect(noveloraMockProject.writingQuote.text).toMatch(/\S/);
  expect(noveloraMockProject.agentGreeting.headline).toMatch(/\S/);
  expect(noveloraMockProject.agentGreeting.body).toMatch(/\S/);

  const focusModeIds = noveloraMockProject.focusModes.map((mode) => mode.id);
  expect(focusModeIds.length).toBeGreaterThanOrEqual(1);
  expect(focusModeIds).toContain(noveloraMockProject.activeFocusModeId);
});

it('tracks agent task progress and typed relationships', () => {
  for (const task of noveloraMockProject.agentTasks) {
    expect(task.progressPercent).toBeGreaterThanOrEqual(0);
    expect(task.progressPercent).toBeLessThanOrEqual(100);
  }

  const kinds = new Set(['ally', 'neutral', 'rival', 'unknown']);
  for (const relationship of noveloraMockProject.characterRelationships) {
    expect(kinds.has(relationship.kind)).toBe(true);
  }
  expect(
    new Set(noveloraMockProject.characterRelationships.map((relationship) => relationship.kind))
      .size,
  ).toBe(4);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/data/noveloraMockProject.test.ts`
Expected: FAIL — `narrativeMarkers`, `progressPercent`, `kind`, `lastSavedLabel` etc. are not defined on the fixture (type errors surface as test failures).

- [ ] **Step 3: Extend the types**

In `types.ts`, after the `SkillCategory` line add:

```ts
export type NarrativeMarkerTone = 'conflict' | 'climax' | 'resolution';
export type RelationshipKind = 'ally' | 'neutral' | 'rival' | 'unknown';

export interface NarrativeMarker {
  label: string;
  tone: NarrativeMarkerTone;
}

export interface FocusModeOption {
  id: string;
  label: string;
  hint: string;
}
```

Add `narrativeMarkers: NarrativeMarker[];` to `Act`, `kind: RelationshipKind;` to `CharacterRelationship`, `progressPercent: number;` to `AgentTask`, and to `NoveloraProject` add:

```ts
  lastSavedLabel: string;
  focusModes: FocusModeOption[];
  activeFocusModeId: string;
  writingQuote: { text: string };
  agentGreeting: { headline: string; body: string };
```

- [ ] **Step 4: Extend the fixture**

In `data/noveloraMockProject.ts`:

Add to each act — `act-i`: `narrativeMarkers: [],`; `act-ii`: `narrativeMarkers: [{ label: 'Core conflict', tone: 'conflict' }],`; `act-iii`: `narrativeMarkers: [{ label: 'Climax', tone: 'climax' }],`; `epilogue`: `narrativeMarkers: [],`.

Add to each agent task — `chapter-shape` (done): `progressPercent: 100,`; `scan-harbor` (running): `progressPercent: 60,`; the queued task: `progressPercent: 18,`; the blocked task: `progressPercent: 36,`. (Match on the existing `state` values; keep one task per state.)

Add `kind` to each existing relationship — `kael-liora`: `'ally'`; `liora-arden`: `'rival'`; `kael-vex`: `'neutral'`; `selene-arden`: `'neutral'` — and append a fifth relationship:

```ts
{
  id: 'vex-selene',
  fromCharacterId: 'vex',
  toCharacterId: 'selene',
  label: 'unspoken debt',
  tension: 'Selene knows what Vex traded to the reef, and Vex knows she knows.',
  kind: 'unknown',
},
```

Add to the project root object:

```ts
lastSavedLabel: '2 min ago',
focusModes: [
  { id: 'deep-work', label: 'Deep Work', hint: 'Minimize distractions. Maximize creativity.' },
  { id: 'sprint-25', label: 'Sprint 25', hint: 'Short timed bursts with stretch breaks.' },
],
activeFocusModeId: 'deep-work',
writingQuote: { text: 'Every great story begins with a single brave sentence.' },
agentGreeting: {
  headline: "Hello, I'm Nova.",
  body: 'Your writing partner and story architect.',
},
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/data/noveloraMockProject.test.ts`
Expected: PASS (all its, including the pre-existing consistency checks — the new `vex-selene` relationship references existing character ids, so reference integrity holds).

- [ ] **Step 6: Run the full suite**

Run: `npm run test:web`
Expected: PASS. (No component consumes the new fields yet; nothing else changes.)

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/features/novelora-cockpit/types.ts apps/web/src/features/novelora-cockpit/data/noveloraMockProject.ts apps/web/src/features/novelora-cockpit/data/noveloraMockProject.test.ts
git commit -m "feat: extend cockpit fixture for reference alignment"
```

---

### Task 1: StructureMap narrative markers and act icons

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/StructureMap.tsx`
- Modify: `apps/web/src/styles/cockpit.css` (after the `.structure-map__cards` rule, ~line 267)
- Test: `apps/web/src/features/novelora-cockpit/components/StructureMap.test.tsx`
- Test: `apps/web/src/styles/global.test.ts`

Note: the SVG wave connectors already exist (`.structure-map__connectors`). This task adds the missing reference elements: beat markers above the acts and an icon inside each act card. Do not touch the existing connector SVG or its CSS.

- [ ] **Step 1: Write the failing tests**

Append to `StructureMap.test.tsx`:

```tsx
it('shows narrative markers above the mapped acts', () => {
  render(
    <StructureMap
      acts={noveloraMockProject.acts}
      selectedActId="act-ii"
      onSelectAct={() => undefined}
    />,
  );

  expect(screen.getByText('Core conflict')).toBeTruthy();
  expect(screen.getByText('Climax')).toBeTruthy();
});

it('renders a decorative icon inside each act card', () => {
  const { container } = render(
    <StructureMap
      acts={noveloraMockProject.acts}
      selectedActId="act-ii"
      onSelectAct={() => undefined}
    />,
  );

  const icons = container.querySelectorAll('.act-card__icon svg');
  expect(icons).toHaveLength(noveloraMockProject.acts.length);
  for (const icon of icons) {
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  }
});
```

Append a new `it` inside the `describe` in `src/styles/global.test.ts` (variable `cockpitCss` already exists in that file):

```ts
it('styles narrative markers and act icons inside the structure map', () => {
  expect(cockpitCss).toMatch(/\.structure-map__marker\s*\{[^}]*text-transform:\s*uppercase;/s);
  expect(cockpitCss).toMatch(/\.act-card__icon\s+svg\s*\{[^}]*width:\s*18px;/s);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/StructureMap.test.tsx src/styles/global.test.ts`
Expected: FAIL — marker text and `.act-card__icon` do not exist; CSS regexes do not match.

- [ ] **Step 3: Implement markers and icons**

In `StructureMap.tsx`, replace the `actColors` line with:

```tsx
const actIconPaths = [
  'M12 20v-6m0 0c-4 0-7-3-7-7 4 0 7 3 7 7zm0 0c0-4 3-7 7-7 0 4-3 7-7 7z',
  'M3 18l6-9 4 6 3-4 5 7H3z',
  'M12 3l7 8h-4v6h-6v-6H5l7-8z',
  'M12 21c-5 0-8-3-8-8 5 0 8 3 8 8zm0 0c0-5 3-8 8-8 0 5-3 8-8 8z',
] as const;

function ActIcon({ index }: { index: number }) {
  return (
    <span className="act-card__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path
          d={actIconPaths[index % actIconPaths.length]}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
```

(Delete the now-unused `actColors` and the `act-card--${color}` modifier from the card className — the contract tests already forbid selected-state styling for those modifiers, and `noUnusedLocals` would flag `actColors`. New card className: `` `act-card${isSelected ? ' is-selected' : ''}` ``.)

Inside `.structure-map__rail`, immediately before the `<svg className="structure-map__connectors" …>`, insert:

```tsx
<div className="structure-map__markers">
  {acts.map((act) => (
    <div key={act.id} className="structure-map__marker-slot">
      {act.narrativeMarkers.map((marker) => (
        <span
          key={marker.label}
          className={`structure-map__marker structure-map__marker--${marker.tone}`}
        >
          {marker.label}
        </span>
      ))}
    </div>
  ))}
</div>
```

Inside the act card button, immediately after the `<span className="act-card__summary">{act.summary}</span>` line, insert `<ActIcon index={index} />`.

- [ ] **Step 4: Add the CSS**

In `cockpit.css`, immediately after the `.structure-map__cards { position: relative; z-index: 1; }` rule, add:

```css
.structure-map__markers {
  display: flex;
  gap: 14px;
  margin-bottom: 10px;
  padding-right: 2px;
}

.structure-map__marker-slot {
  flex: 1 1 0;
  display: flex;
  justify-content: center;
  min-width: 0;
}

.structure-map__marker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-mint-primary);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.structure-map__marker::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-mint-primary);
}

.structure-map__marker--climax {
  color: var(--color-state-warning);
}

.structure-map__marker--climax::before {
  background: var(--color-state-warning);
}

.act-card__icon {
  margin-top: 4px;
  color: var(--color-mint-primary);
}

.act-card__icon svg {
  display: block;
  width: 18px;
  height: 18px;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/StructureMap.test.tsx src/styles/global.test.ts`
Expected: PASS.

- [ ] **Step 6: Run full verification and commit**

Run: `npm run test:web && npm run lint:web && npm run build:web`
Expected: all green (watch for `actColors` unused-var errors if Step 3's cleanup was skipped).

```bash
git add apps/web/src/features/novelora-cockpit/components/StructureMap.tsx apps/web/src/features/novelora-cockpit/components/StructureMap.test.tsx apps/web/src/styles/cockpit.css apps/web/src/styles/global.test.ts
git commit -m "feat: add narrative markers and act icons to structure map"
```

---

### Task 2: ChapterSwimlane connector chevrons

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/ChapterSwimlane.tsx`
- Modify: `apps/web/src/styles/cockpit.css` (after the `.chapter-swimlane__rail` rule, ~line 375)
- Test: `apps/web/src/features/novelora-cockpit/components/ChapterSwimlane.test.tsx`

- [ ] **Step 1: Write the failing test**

Append to `ChapterSwimlane.test.tsx`:

```tsx
it('links adjacent chapter cards and the add card with decorative chevrons', () => {
  const { container } = render(
    <ChapterSwimlane
      chapters={actTwoChapters}
      selectedChapterId="chapter-3"
      onSelectChapter={() => undefined}
    />,
  );

  expect(container.querySelectorAll('.chapter-swimlane__link')).toHaveLength(
    actTwoChapters.length,
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/ChapterSwimlane.test.tsx`
Expected: FAIL — no `.chapter-swimlane__link` elements.

- [ ] **Step 3: Implement the chevrons**

In `ChapterSwimlane.tsx`, add above the component:

```tsx
function SwimlaneLink() {
  return (
    <span className="chapter-swimlane__link" aria-hidden="true">
      <svg viewBox="0 0 16 16" focusable="false">
        <path
          d="M5 2l6 6-6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
```

Change the chapters map callback signature to `(chapter, index)` and wrap the returned button in a fragment that emits a link first:

```tsx
{chapters.map((chapter, index) => {
  const isSelected = chapter.id === selectedChapterId;

  return (
    <Fragment key={chapter.id}>
      {index > 0 ? <SwimlaneLink /> : null}
      <button …existing chapter card…</button>
    </Fragment>
  );
})}

<SwimlaneLink />
<button className="chapter-add-card" type="button" disabled>
```

Add `import { Fragment } from 'react';` at the top. (One link between every pair of cards plus one before the add card ⇒ count equals `chapters.length`.)

- [ ] **Step 4: Add the CSS**

In `cockpit.css`, immediately after the `.chapter-swimlane__rail { min-width: max-content; }` rule, add:

```css
.chapter-swimlane__link {
  flex: none;
  align-self: center;
  color: var(--color-mint-primary);
}

.chapter-swimlane__link svg {
  display: block;
  width: 14px;
  height: 14px;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/ChapterSwimlane.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run full verification and commit**

Run: `npm run test:web && npm run lint:web && npm run build:web`
Expected: all green.

```bash
git add apps/web/src/features/novelora-cockpit/components/ChapterSwimlane.tsx apps/web/src/features/novelora-cockpit/components/ChapterSwimlane.test.tsx apps/web/src/styles/cockpit.css
git commit -m "feat: link chapter swimlane cards with chevrons"
```

---

### Task 3: AgentPanel greeting card and task progress bars

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/AgentPanel.tsx`
- Modify: `apps/web/src/styles/cockpit.css` (agent panel area, after the `.agent-task-progress` rule ~line 1225)
- Test: `apps/web/src/features/novelora-cockpit/components/AgentPanel.test.tsx`

Locks to preserve: the `img` named `Nova`, every task title/focus/`Owner: …`, status chip labels, and the `.nova-lead-card` / `.agent-panel__section` glass chrome.

- [ ] **Step 1: Write the failing tests**

Append to `AgentPanel.test.tsx`:

```tsx
it('greets through the fixture-backed lead card with an active status', () => {
  const { container } = render(<AgentPanel project={noveloraMockProject} />);

  expect(screen.getByText("Hello, I'm Nova.")).toBeTruthy();
  expect(screen.getByText('Your writing partner and story architect.')).toBeTruthy();
  // 'Active' also appears in the subagent roster, so scope this assertion to the lead card.
  expect(container.querySelector('.nova-lead-card__status')?.textContent).toContain('Active');
});

it('shows a valued progress bar for every agent task', () => {
  render(<AgentPanel project={noveloraMockProject} />);

  for (const task of noveloraMockProject.agentTasks) {
    const bar = screen.getByRole('progressbar', { name: `${task.title} progress` });
    expect(bar.getAttribute('value')).toBe(String(task.progressPercent));
    expect(bar.getAttribute('max')).toBe('100');
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/AgentPanel.test.tsx`
Expected: FAIL — greeting text absent; progress bars only exist for the running task and carry no `value`.

- [ ] **Step 3: Rework the lead card**

In `AgentPanel.tsx`, replace the `<section className="nova-lead-card" …>` block with:

```tsx
<section className="nova-lead-card" aria-labelledby="nova-lead-title">
  <span className="nova-lead-card__portrait">
    <img src={mascot} alt="Nova" />
  </span>
  <div>
    <h2 id="nova-lead-title">{project.agentGreeting.headline}</h2>
    <p>{project.agentGreeting.body}</p>
    <span className="nova-lead-card__status">
      <span aria-hidden="true" />
      Active
    </span>
  </div>
</section>
```

- [ ] **Step 4: Give every task a valued progress bar**

In the task `<li>`, replace the conditional progress block:

```tsx
{task.state === 'running' ? (
  <progress className="agent-task-progress" aria-label={`${task.title} progress`} />
) : null}
```

with:

```tsx
<div className="agent-task-row__progress">
  <progress
    className="agent-task-progress"
    aria-label={`${task.title} progress`}
    value={task.progressPercent}
    max={100}
  />
  <span>{task.progressPercent}%</span>
</div>
```

- [ ] **Step 5: Add the CSS**

In `cockpit.css`, immediately after the `.agent-task-progress { … }` rule, add:

```css
.agent-task-row__progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 9px;
}

.agent-task-row__progress .agent-task-progress {
  flex: 1;
  margin-top: 0;
}

.agent-task-row__progress > span {
  color: var(--color-text-subtle);
  font-size: 10px;
  font-weight: 650;
}
```

Immediately after the `.nova-lead-card__portrait img { … }` rule, add:

```css
.nova-lead-card__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: var(--color-mint-primary);
  font-size: 11px;
  font-weight: 600;
}

.nova-lead-card__status > span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-mint-primary);
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/AgentPanel.test.tsx`
Expected: PASS — including the pre-existing four its.

- [ ] **Step 7: Run full verification and commit**

Run: `npm run test:web && npm run lint:web && npm run build:web`
Expected: all green.

```bash
git add apps/web/src/features/novelora-cockpit/components/AgentPanel.tsx apps/web/src/features/novelora-cockpit/components/AgentPanel.test.tsx apps/web/src/styles/cockpit.css
git commit -m "feat: rework agent lead card and task progress"
```

---

### Task 4: AgentPanel memory layer tabs and focus mode hint

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/AgentPanel.tsx`
- Modify: `apps/web/src/styles/cockpit.css` (after the `.memory-source-list …` rules ~line 1231)
- Test: `apps/web/src/features/novelora-cockpit/components/AgentPanel.test.tsx`

Default render must still show every memory source label (locked by the existing test). The default group is `Core Memory` (all kinds) with no sub-view selected.

- [ ] **Step 1: Write the failing test**

Append to `AgentPanel.test.tsx`:

```tsx
it('filters memory sources through group tabs and view toggles', async () => {
  const user = userEvent.setup();
  render(<AgentPanel project={noveloraMockProject} />);

  for (const source of noveloraMockProject.memorySources) {
    expect(screen.getByText(source.label)).toBeTruthy();
  }

  const worldLore = screen.getByRole('tab', { name: 'World Lore' });
  await user.click(worldLore);
  expect(worldLore.getAttribute('aria-selected')).toBe('true');
  for (const source of noveloraMockProject.memorySources) {
    if (source.kind === 'inspiration') {
      expect(screen.getByText(source.label)).toBeTruthy();
    } else {
      expect(screen.queryByText(source.label)).toBeNull();
    }
  }

  await user.click(screen.getByRole('tab', { name: 'Core Memory' }));
  const clues = screen.getByRole('button', { name: 'Clues' });
  await user.click(clues);
  expect(clues.getAttribute('aria-pressed')).toBe('true');
  for (const source of noveloraMockProject.memorySources) {
    if (source.kind === 'clue') {
      expect(screen.getByText(source.label)).toBeTruthy();
    } else {
      expect(screen.queryByText(source.label)).toBeNull();
    }
  }
});

it('shows the active focus mode hint inside the toggle', () => {
  render(<AgentPanel project={noveloraMockProject} />);

  expect(screen.getByText('Minimize distractions. Maximize creativity.')).toBeTruthy();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/AgentPanel.test.tsx`
Expected: FAIL — no tabs, no hint text.

- [ ] **Step 3: Implement the memory tabs**

In `AgentPanel.tsx`, next to `statusLabels` add:

```tsx
const memoryGroups = [
  { id: 'core', label: 'Core Memory', kinds: null },
  { id: 'world', label: 'World Lore', kinds: ['inspiration'] },
  { id: 'characters', label: 'Characters', kinds: ['character'] },
] as const;

const memoryViews = [
  { id: 'timeline', label: 'Timeline', kind: 'chapter' },
  { id: 'locations', label: 'Locations', kind: 'inspiration' },
  { id: 'clues', label: 'Clues', kind: 'clue' },
] as const;
```

Inside the component, next to the existing `focusMode` state add:

```tsx
const [memoryGroup, setMemoryGroup] =
  useState<(typeof memoryGroups)[number]['id']>('core');
const [memoryView, setMemoryView] = useState<
  (typeof memoryViews)[number]['id'] | null
>(null);
```

Still inside the component, before the `return`, add:

```tsx
const activeGroup = memoryGroups.find((group) => group.id === memoryGroup);
const activeView = memoryViews.find((view) => view.id === memoryView);
const visibleMemorySources = project.memorySources.filter((source) => {
  if (
    activeGroup &&
    activeGroup.kinds !== null &&
    !(activeGroup.kinds as readonly string[]).includes(source.kind)
  ) {
    return false;
  }
  if (activeView && source.kind !== activeView.kind) {
    return false;
  }
  return true;
});
const activeFocusMode = project.focusModes.find(
  (mode) => mode.id === project.activeFocusModeId,
);
```

In the Memory layer section, between the `.memory-health-meter` div and the `.memory-source-list` `<ul>`, insert:

```tsx
<div className="memory-layer-tabs" role="tablist" aria-label="Memory groups">
  {memoryGroups.map((group) => (
    <button
      key={group.id}
      className={`memory-layer-tab${memoryGroup === group.id ? ' is-active' : ''}`}
      type="button"
      role="tab"
      aria-selected={memoryGroup === group.id}
      onClick={() => setMemoryGroup(group.id)}
    >
      {group.label}
    </button>
  ))}
</div>
<div className="memory-layer-views" aria-label="Memory views">
  {memoryViews.map((view) => (
    <button
      key={view.id}
      className={`memory-layer-view${memoryView === view.id ? ' is-active' : ''}`}
      type="button"
      aria-pressed={memoryView === view.id}
      onClick={() =>
        setMemoryView((current) => (current === view.id ? null : view.id))
      }
    >
      {view.label}
    </button>
  ))}
</div>
```

Replace the bare `<ul className="memory-source-list">…</ul>` with:

```tsx
{visibleMemorySources.length === 0 ? (
  <p className="memory-source-empty" role="status">
    No memory sources in this view yet.
  </p>
) : (
  <ul className="memory-source-list">
    {visibleMemorySources.map((source) => (
      <li key={source.id}>
        <strong>{source.label}</strong>
        <span>{source.kind}</span>
      </li>
    ))}
  </ul>
)}
```

In the Focus Mode button, insert between `<span>Focus Mode</span>` and `<small>…</small>`:

```tsx
<span className="focus-mode-toggle__desc">{activeFocusMode?.hint}</span>
```

(The accessible name becomes `Focus Mode Minimize distractions. Maximize creativity. Off` — the `/Focus Mode/i` name queries in existing tests still match.)

- [ ] **Step 4: Add the CSS**

In `cockpit.css`, immediately after the `.memory-source-list span { … }` rule, add:

```css
.memory-layer-tabs {
  display: flex;
  gap: 6px;
  margin-top: 13px;
}

.memory-layer-tab {
  flex: 1;
  padding: 7px 4px;
  border: 1px solid var(--color-mint-line);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text-subtle);
  font-size: 10px;
  font-weight: 650;
  cursor: pointer;
}

.memory-layer-tab.is-active {
  border-color: var(--color-mint-primary);
  color: #087a44;
  background: color-mix(in srgb, var(--color-mint-soft) 78%, white);
}

.memory-layer-views {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.memory-layer-view {
  padding: 4px 10px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text-subtle);
  font-size: 10px;
  cursor: pointer;
}

.memory-layer-view.is-active {
  background: var(--color-mint-soft);
  color: #087a44;
}

.memory-source-empty {
  margin: 13px 0 0;
  padding: 14px;
  border: 1px dashed var(--color-mint-line);
  border-radius: var(--radius-card);
  color: var(--color-text-subtle);
  font-size: 12px;
}

.focus-mode-toggle__desc {
  display: block;
  color: var(--color-text-subtle);
  font-size: 10px;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/AgentPanel.test.tsx`
Expected: PASS — all seven its (four pre-existing + greeting/progress from Task 3 + two new).

- [ ] **Step 6: Run full verification and commit**

Run: `npm run test:web && npm run lint:web && npm run build:web`
Expected: all green.

```bash
git add apps/web/src/features/novelora-cockpit/components/AgentPanel.tsx apps/web/src/features/novelora-cockpit/components/AgentPanel.test.tsx apps/web/src/styles/cockpit.css
git commit -m "feat: add memory layer tabs and focus mode hint"
```

---

### Task 5: BottomStatusBar and AppShell status slot

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/components/BottomStatusBar.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/BottomStatusBar.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/AppShell.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles/cockpit.css` (`.cockpit-workspace` grid rows ~line 149; new rules after `.cockpit-main`)
- Test: `apps/web/src/App.test.tsx`
- Test: `apps/web/src/styles/global.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `BottomStatusBar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import { BottomStatusBar } from './BottomStatusBar';

describe('BottomStatusBar', () => {
  it('surfaces word progress, save state, focus mode, and the writing quote', () => {
    render(<BottomStatusBar project={noveloraMockProject} />);

    expect(screen.getByRole('contentinfo', { name: 'Workspace status' })).toBeTruthy();
    expect(screen.getByText(/16,148/)).toBeTruthy();
    expect(screen.getByText(/80,000/)).toBeTruthy();
    expect(screen.getByText('2 min ago')).toBeTruthy();
    expect(screen.getByText('Deep Work')).toBeTruthy();
    expect(
      screen.getByText('Every great story begins with a single brave sentence.'),
    ).toBeTruthy();

    const meter = screen.getByRole('progressbar', { name: 'Word goal progress' });
    expect(meter.getAttribute('aria-valuenow')).toBe('20');
  });
});
```

Append to `App.test.tsx`:

```tsx
it('keeps workspace status visible below the story workspace', () => {
  render(<App />);

  const statusbar = screen.getByRole('contentinfo', { name: 'Workspace status' });
  expect(within(statusbar).getByText(/16,148/)).toBeTruthy();
  expect(within(statusbar).getByText('Deep Work')).toBeTruthy();
});
```

Append a new `it` inside the `describe` in `src/styles/global.test.ts`:

```ts
it('pins the status bar as a glass strip below the workspace main', () => {
  expect(cockpitCss).toMatch(
    /\.cockpit-workspace\s*\{[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\) auto;/s,
  );
  expect(cockpitCss).toMatch(/\.cockpit-statusbar\s*\{[^}]*background:\s*rgba\(255, 255, 255, 0\.64\);/s);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/BottomStatusBar.test.tsx src/App.test.tsx src/styles/global.test.ts`
Expected: FAIL — module `./BottomStatusBar` does not exist; no `contentinfo` landmark; CSS regexes do not match.

- [ ] **Step 3: Create the component**

Create `BottomStatusBar.tsx`:

```tsx
import type { NoveloraProject } from '../types';

interface BottomStatusBarProps {
  project: NoveloraProject;
}

export function BottomStatusBar({ project }: BottomStatusBarProps) {
  const wordPercent = Math.round((project.currentWords / project.wordGoal) * 100);
  const activeFocusMode = project.focusModes.find(
    (mode) => mode.id === project.activeFocusModeId,
  );

  return (
    <footer className="cockpit-statusbar" role="contentinfo" aria-label="Workspace status">
      <div className="cockpit-statusbar__metric">
        <span className="workspace-eyebrow">Words</span>
        <strong>
          {project.currentWords.toLocaleString()}
          <small> / {project.wordGoal.toLocaleString()}</small>
        </strong>
        <span
          className="cockpit-statusbar__meter"
          role="progressbar"
          aria-label="Word goal progress"
          aria-valuenow={wordPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${wordPercent}%` }} />
        </span>
      </div>
      <div className="cockpit-statusbar__metric">
        <span className="workspace-eyebrow">Last saved</span>
        <strong>{project.lastSavedLabel}</strong>
      </div>
      <div className="cockpit-statusbar__metric">
        <span className="workspace-eyebrow">Focus</span>
        <strong>{activeFocusMode?.label ?? 'Off'}</strong>
      </div>
      <p className="cockpit-statusbar__quote">{project.writingQuote.text}</p>
    </footer>
  );
}
```

- [ ] **Step 4: Wire the slot through AppShell and App**

In `AppShell.tsx`, add `statusBar: ReactNode;` to `AppShellProps`, and inside `.cockpit-workspace`, immediately after the `</main>`, render `{statusBar}`. The section becomes:

```tsx
<section className="cockpit-workspace" aria-label="Novel workspace">
  <header className="cockpit-topbar" aria-label="Project controls">
    {topbar}
  </header>
  <main className="cockpit-main" aria-label="Story workspace">
    {children}
  </main>
  {statusBar}
</section>
```

In `App.tsx`, add the import:

```tsx
import { BottomStatusBar } from './features/novelora-cockpit/components/BottomStatusBar';
```

and pass the prop to `<AppShell>`:

```tsx
statusBar={<BottomStatusBar project={noveloraMockProject} />}
```

- [ ] **Step 5: Update the CSS**

In `cockpit.css`, find the `.cockpit-workspace` rule and change `grid-template-rows: auto minmax(0, 1fr);` to `grid-template-rows: auto minmax(0, 1fr) auto;` (leave every other declaration untouched — its transparent background is contract-locked).

Immediately after the `.cockpit-main { … }` rule, add:

```css
.cockpit-statusbar {
  position: sticky;
  bottom: 12px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 28px;
  margin: 0 30px 22px;
  padding: 14px 22px;
  border: 1px solid rgba(180, 224, 205, 0.72);
  border-radius: var(--radius-panel);
  background: rgba(255, 255, 255, 0.64);
  box-shadow: 0 16px 44px rgba(31, 112, 79, 0.07);
}

.cockpit-statusbar__metric {
  display: grid;
  gap: 4px;
}

.cockpit-statusbar__metric strong {
  font-size: 14px;
}

.cockpit-statusbar__metric strong small {
  color: var(--color-text-subtle);
  font-size: 11px;
  font-weight: 500;
}

.cockpit-statusbar__meter {
  display: block;
  width: 120px;
  height: 4px;
  border-radius: var(--radius-pill);
  background: var(--color-mint-soft);
  overflow: hidden;
}

.cockpit-statusbar__meter > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-mint-primary);
}

.cockpit-statusbar__quote {
  margin: 0 0 0 auto;
  color: var(--color-text-subtle);
  font-size: 12px;
  font-style: italic;
}
```

Inside the existing `@media (max-width: 900px)` block, add:

```css
.cockpit-statusbar {
  flex-wrap: wrap;
  gap: 14px;
}

.cockpit-statusbar__quote {
  margin-left: 0;
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/BottomStatusBar.test.tsx src/App.test.tsx src/styles/global.test.ts src/features/novelora-cockpit/components/AppShell.test.tsx`
Expected: PASS.

- [ ] **Step 7: Run full verification and commit**

Run: `npm run test:web && npm run lint:web && npm run build:web`
Expected: all green.

```bash
git add apps/web/src/features/novelora-cockpit/components/BottomStatusBar.tsx apps/web/src/features/novelora-cockpit/components/BottomStatusBar.test.tsx apps/web/src/features/novelora-cockpit/components/AppShell.tsx apps/web/src/App.tsx apps/web/src/App.test.tsx apps/web/src/styles/cockpit.css apps/web/src/styles/global.test.ts
git commit -m "feat: add bottom workspace status bar"
```

---

### Task 6: ClueAttributionFlow curved stage graph

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/ClueAttributionFlow.tsx`
- Modify: `apps/web/src/styles/cockpit.css` (clue flow area, lines ~738–816)
- Test: `apps/web/src/features/novelora-cockpit/components/ClueAttributionFlow.test.tsx`
- Test: `apps/web/src/styles/global.test.ts`

Locks to preserve: `role="article"` cards with `aria-label={flow.title}`, the `Provided by / Triggered by / Received by / Paid off by` responsibility texts, stage labels, detail texts, chapter labels, and the `clueNodes` stage images. Only the connector presentation changes: text arrows (`→`) become SVG curves.

- [ ] **Step 1: Write the failing tests**

Append to `ClueAttributionFlow.test.tsx`:

```tsx
it('connects clue stages with decorative curves instead of text arrows', () => {
  const { container } = render(
    <ClueAttributionFlow
      clueFlows={noveloraMockProject.clueFlows}
      chapters={noveloraMockProject.chapters}
      selectedChapterId="chapter-6"
    />,
  );

  // Chapter 6 is the payoff chapter of both fixture flows, so scope the curve
  // assertions to the first card instead of counting across the whole list.
  const firstCard = container.querySelector('.clue-flow-card');
  const curves = firstCard?.querySelector('.clue-flow-card__curves');
  expect(curves).toBeTruthy();
  expect(curves?.getAttribute('aria-hidden')).toBe('true');
  expect(firstCard?.querySelectorAll('.clue-flow-card__curves path')).toHaveLength(3);
  expect(container.querySelector('.clue-stage__arrow')).toBeNull();
});
```

Append a new `it` inside the `describe` in `src/styles/global.test.ts`:

```ts
it('draws clue stage curves behind the stage content', () => {
  expect(cockpitCss).toMatch(/\.clue-flow-card__curves\s*\{[^}]*position:\s*absolute;/s);
  expect(cockpitCss).toMatch(
    /\.clue-flow-card__curves\s+path\s*\{[^}]*stroke:\s*var\(--color-mint-primary\);/s,
  );
  expect(cockpitCss).not.toMatch(/\.clue-stage__arrow/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/ClueAttributionFlow.test.tsx src/styles/global.test.ts`
Expected: FAIL — no `.clue-flow-card__curves`; `.clue-stage__arrow` still present.

- [ ] **Step 3: Rework the stages markup**

In `ClueAttributionFlow.tsx`, replace the whole `<div className="clue-flow-card__stages">…</div>` block with:

```tsx
<div className="clue-flow-card__stages">
  <svg
    className="clue-flow-card__curves"
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 1000 60"
    preserveAspectRatio="none"
  >
    <path d="M 125 34 C 208 56, 292 56, 375 34" />
    <path d="M 375 34 C 458 56, 542 56, 625 34" />
    <path d="M 625 34 C 708 56, 792 56, 875 34" />
  </svg>
  {stages.map(({ key, label, image }) => {
    const stage = stageContent(flow, key);

    return (
      <div key={key} className="clue-stage">
        <img src={clueNodes[image]} alt="" />
        <div>
          <span className="clue-stage__label">{label}</span>
          <p className="clue-stage__responsibility">{stage.responsibility}</p>
          <p className="clue-stage__detail">{stage.detail}</p>
          <span className="clue-stage__chapter">
            {chapterLabel(chapters, stage.chapterId)}
          </span>
        </div>
      </div>
    );
  })}
</div>
```

(The `index` parameter and the `clue-stage__arrow` span disappear from the map callback.)

- [ ] **Step 4: Update the CSS**

In `cockpit.css`:

1. Delete the entire `.clue-stage__arrow { … }` rule (the one with `top: 8px; left: -17px;`).
2. Replace the `.clue-flow-card__stages { … }` rule with:

```css
.clue-flow-card__stages {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  gap: 22px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.clue-flow-card__curves {
  position: absolute;
  inset: 0 0 auto;
  width: 100%;
  height: 60px;
  overflow: visible;
  pointer-events: none;
}

.clue-flow-card__curves path {
  fill: none;
  stroke: var(--color-mint-primary);
  stroke-dasharray: 2 6;
  stroke-linecap: round;
  stroke-width: 2;
}
```

3. Add `z-index: 1;` to the existing `.clue-stage` rule (it already has `position: relative;`), so stage content sits above the curves.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/ClueAttributionFlow.test.tsx src/styles/global.test.ts src/App.test.tsx`
Expected: PASS — including the pre-existing stage-content assertions in `App.test.tsx`.

- [ ] **Step 6: Run full verification and commit**

Run: `npm run test:web && npm run lint:web && npm run build:web`
Expected: all green.

```bash
git add apps/web/src/features/novelora-cockpit/components/ClueAttributionFlow.tsx apps/web/src/features/novelora-cockpit/components/ClueAttributionFlow.test.tsx apps/web/src/styles/cockpit.css apps/web/src/styles/global.test.ts
git commit -m "feat: draw clue attribution stages as a curved graph"
```

---

### Task 7: CharacterGraph typed relationship encoding

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/CharacterGraph.tsx`
- Modify: `apps/web/src/styles/cockpit.css` (character graph area, lines ~603–736)
- Test: `apps/web/src/features/novelora-cockpit/components/CharacterGraph.test.tsx`
- Test: `apps/web/src/styles/global.test.ts`

This task re-keys the existing index-based edge/legend color coding (`--0`…`--3`) to relationship kinds (`--ally/--neutral/--rival/--unknown`), adds a compact kind legend, and adds the `vex-selene` edge from Task 0. The 620×255 stage, legend item texts, and the no-buttons rule are locked — keep them.

Color mapping (values already locked by the contrast contract; only the selector names change): `ally → --color-relation-1`, `neutral → --color-relation-2`, `rival → --color-relation-3`, `unknown → --color-relation-4`. Dash patterns keep their current values under the new names: `ally: none`, `neutral: 10 5`, `rival: 3 5`, `unknown: 12 4 3 4`.

- [ ] **Step 1: Write the failing tests**

Append to `CharacterGraph.test.tsx`:

```tsx
it('color-codes edges and legend items by relationship kind', () => {
  const { container } = render(
    <CharacterGraph
      characters={noveloraMockProject.characters}
      relationships={noveloraMockProject.characterRelationships}
    />,
  );

  expect(container.querySelectorAll('.character-graph__edge--ally')).toHaveLength(1);
  expect(container.querySelectorAll('.character-graph__edge--rival')).toHaveLength(1);
  expect(container.querySelectorAll('.character-graph__edge--neutral')).toHaveLength(2);
  expect(container.querySelectorAll('.character-graph__edge--unknown')).toHaveLength(1);

  const kindLegend = screen.getByRole('list', { name: 'Relationship types' });
  for (const kind of ['ally', 'neutral', 'rival', 'unknown']) {
    expect(within(kindLegend).getByText(kind)).toBeTruthy();
  }
});
```

Add `within` to the `@testing-library/react` import at the top of the file.

In `src/styles/global.test.ts`, find the existing `it('double-encodes graph relationships …')` and replace every `--0` / `--1` / `--2` / `--3` selector reference with the kind names (`--0`→`--ally`, `--1`→`--neutral`, `--2`→`--rival`, `--3`→`--unknown`). The assertions themselves (stroke equals `var(--color-relation-N)` per slot, legend swatch background, four distinct `stroke-dasharray` values including `'none'`, four distinct marker `border-radius` values, no `opacity` on `.character-graph__edge`) stay exactly as they are — only the selectors being queried change. Also extend that `it` with:

```ts
expect(cockpitCss).toMatch(/\.character-graph__kind-item--ally\s*>\s*span\s*\{[^}]*background:\s*var\(--color-relation-1\);/s);
expect(cockpitCss).toMatch(/\.character-graph__kind-item--unknown\s*>\s*span\s*\{[^}]*background:\s*var\(--color-relation-4\);/s);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/CharacterGraph.test.tsx src/styles/global.test.ts`
Expected: FAIL — component still emits `--0`…`--3` classes and has no kind legend; the contract test queries selectors that do not exist yet.

- [ ] **Step 3: Rework the component**

In `CharacterGraph.tsx`:

1. Add the new edge coordinates to `edgeCoordinates`:

```ts
  'vex-selene': { x1: 252, y1: 152, x2: 492, y2: 124 },
```

2. In the edges map, change the className to:

```tsx
className={`character-graph__edge character-graph__edge--${relationship.kind}`}
```

(`coordinates` lookup, `key`, and the spread stay as they are. The `index` parameter is no longer used — drop it from the callback to satisfy `noUnusedParameters`.)

3. Immediately before the existing `<ul className="character-graph__legend" …>`, insert:

```tsx
<ul className="character-graph__kind-legend" aria-label="Relationship types">
  {(['ally', 'neutral', 'rival', 'unknown'] as const).map((kind) => (
    <li
      key={kind}
      className={`character-graph__kind-item character-graph__kind-item--${kind}`}
    >
      <span aria-hidden="true" />
      {kind}
    </li>
  ))}
</ul>
```

4. In the per-relationship legend map, change the className to:

```tsx
className={`character-graph__legend-item character-graph__legend-item--${relationship.kind}`}
```

(Drop the now-unused `index` parameter there too. The legend item text — `Kael — Liora · uneasy allies` etc. — must not change.)

- [ ] **Step 4: Update the CSS**

In `cockpit.css`:

1. Rename the four edge rules, keeping every value byte-identical:

```css
.character-graph__edge--ally { stroke: var(--color-relation-1); stroke-dasharray: none; }
.character-graph__edge--neutral { stroke: var(--color-relation-2); stroke-dasharray: 10 5; }
.character-graph__edge--rival { stroke: var(--color-relation-3); stroke-dasharray: 3 5; }
.character-graph__edge--unknown { stroke: var(--color-relation-4); stroke-dasharray: 12 4 3 4; }
```

2. Rename the four `.character-graph__legend-item--{0,1,2,3} > span` rules the same way (`--0`→`--ally`, `--1`→`--neutral`, `--2`→`--rival`, `--3`→`--unknown`), keeping each `background: var(--color-relation-N);` and each distinct `border-radius` value unchanged.

3. Add after the legend-item rules:

```css
.character-graph__kind-legend {
  display: flex;
  gap: 16px;
  margin: 0 0 10px;
  padding: 0;
  list-style: none;
}

.character-graph__kind-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-subtle);
  font-size: 10px;
  text-transform: capitalize;
}

.character-graph__kind-item > span {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.character-graph__kind-item--ally > span { background: var(--color-relation-1); }
.character-graph__kind-item--neutral > span { background: var(--color-relation-2); }
.character-graph__kind-item--rival > span { background: var(--color-relation-3); }
.character-graph__kind-item--unknown > span { background: var(--color-relation-4); }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/CharacterGraph.test.tsx src/styles/global.test.ts`
Expected: PASS — including the reworked `double-encodes graph relationships` contract and the pre-existing stage/legend locks.

- [ ] **Step 6: Run full verification and commit**

Run: `npm run test:web && npm run lint:web && npm run build:web`
Expected: all green.

```bash
git add apps/web/src/features/novelora-cockpit/components/CharacterGraph.tsx apps/web/src/features/novelora-cockpit/components/CharacterGraph.test.tsx apps/web/src/styles/cockpit.css apps/web/src/styles/global.test.ts
git commit -m "feat: encode character relationships by kind"
```

---

### Task 8: Sidebar New Project CTA, larger mascot, floating Nova button

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/ProjectSidebar.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/FloatingMascotButton.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/FloatingMascotButton.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/AppShell.tsx`
- Modify: `apps/web/src/styles/cockpit.css` (sidebar area + visual-stage mascot rule ~line 95)
- Test: `apps/web/src/features/novelora-cockpit/components/ProjectSidebar.test.tsx`
- Test: `apps/web/src/styles/global.test.ts`

Locks to respect: the CTA must live **outside** `<nav>` (the nav must keep exactly 7 buttons); the retired 2D Nova assets must not reappear; the mascot CSS contract only requires `display: block`, a `left` value, and `right: auto` — width is free to change; the floating button's z-index must stay below the drawer backdrop (10).

- [ ] **Step 1: Write the failing tests**

Append to `ProjectSidebar.test.tsx`:

```tsx
it('offers a primary new-project action outside the navigation', () => {
  render(<ProjectSidebar project={noveloraMockProject} />);

  const cta = screen.getByRole('button', { name: 'New Project' });
  expect(cta.closest('nav')).toBeNull();
});
```

Create `FloatingMascotButton.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FloatingMascotButton } from './FloatingMascotButton';

describe('FloatingMascotButton', () => {
  it('renders a labelled floating entry with decorative 3D artwork', () => {
    render(<FloatingMascotButton />);

    const button = screen.getByRole('button', { name: 'Open Nova assistant' });
    const image = button.querySelector('img');
    expect(image?.getAttribute('src')).toMatch(/cockpit-mascot.*\.webp$/);
    expect(image?.getAttribute('aria-hidden')).toBe('true');
  });
});
```

Append a new `it` inside the `describe` in `src/styles/global.test.ts`:

```ts
it('floats the Nova entry above the panels and below the chapter drawer', () => {
  expect(cockpitCss).toMatch(/\.floating-nova\s*\{[^}]*position:\s*fixed;/s);
  expect(cockpitCss).toMatch(/\.floating-nova\s*\{[^}]*z-index:\s*6;/s);
  expect(cockpitCss).toMatch(
    /\.cockpit-visual-stage__mascot\s*\{[^}]*width:\s*clamp\(220px, 16vw, 270px\);/s,
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/ProjectSidebar.test.tsx src/features/novelora-cockpit/components/FloatingMascotButton.test.tsx src/styles/global.test.ts`
Expected: FAIL — no CTA, no component, CSS regexes unmatched.

- [ ] **Step 3: Add the sidebar CTA**

In `ProjectSidebar.tsx`, immediately after the `<img className="novelora-logo" … />` line and before the `<nav …>`, insert:

```tsx
<button className="sidebar-new-project" type="button">
  <span aria-hidden="true">+</span>
  New Project
</button>
```

- [ ] **Step 4: Create the floating button and mount it**

Create `FloatingMascotButton.tsx`:

```tsx
import mascot from '../../../assets/novelora/visual-stage/cockpit-mascot.webp';

export function FloatingMascotButton() {
  return (
    <button className="floating-nova" type="button" aria-label="Open Nova assistant">
      <img src={mascot} alt="" aria-hidden="true" />
    </button>
  );
}
```

In `AppShell.tsx`, add the import:

```tsx
import { FloatingMascotButton } from './FloatingMascotButton';
```

and render it inside `.cockpit-scroll`, after the closing `</div>` of `.cockpit-shell`:

```tsx
<div className="cockpit-scroll">
  <div className="cockpit-shell">
    …unchanged…
  </div>
  <FloatingMascotButton />
</div>
```

- [ ] **Step 5: Update the CSS**

In `cockpit.css`:

1. In the `.cockpit-visual-stage__mascot` rule (~line 95), change `width: clamp(180px, 13vw, 220px);` to `width: clamp(220px, 16vw, 270px);` and `left: 72px;` to `left: 60px;`. Touch nothing else in that rule.

2. After the `.writing-streak …` rules in the sidebar area, add:

```css
.sidebar-new-project {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px 14px;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--color-mint-primary);
  color: #ffffff;
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
  box-shadow: 0 10px 26px rgba(10, 168, 91, 0.12);
}

.sidebar-new-project:hover {
  background: color-mix(in srgb, var(--color-mint-primary) 88%, black);
}

.sidebar-new-project > span {
  font-size: 16px;
  line-height: 1;
}
```

3. After the `.chapter-drawer-backdrop` rules (~line 1353), add:

```css
.floating-nova {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 6;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  padding: 6px;
  border: 1px solid rgba(180, 224, 205, 0.72);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-card);
  cursor: pointer;
}

.floating-nova img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

4. Inside the existing `@media (max-width: 900px)` block, add:

```css
.floating-nova {
  display: none;
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/ProjectSidebar.test.tsx src/features/novelora-cockpit/components/FloatingMascotButton.test.tsx src/features/novelora-cockpit/components/AppShell.test.tsx src/styles/global.test.ts`
Expected: PASS — including the nav-still-has-7-buttons and retired-Nova locks.

- [ ] **Step 7: Run full verification and commit**

Run: `npm run test:web && npm run lint:web && npm run build:web`
Expected: all green.

```bash
git add apps/web/src/features/novelora-cockpit/components/ProjectSidebar.tsx apps/web/src/features/novelora-cockpit/components/ProjectSidebar.test.tsx apps/web/src/features/novelora-cockpit/components/FloatingMascotButton.tsx apps/web/src/features/novelora-cockpit/components/FloatingMascotButton.test.tsx apps/web/src/features/novelora-cockpit/components/AppShell.tsx apps/web/src/styles/cockpit.css apps/web/src/styles/global.test.ts
git commit -m "feat: add sidebar project cta and floating nova entry"
```

---

### Task 9: End-to-end verification and QA screenshots

**Files:**
- Create: `qa-screenshots/reference-alignment/` (screenshot output only, no code)

- [ ] **Step 1: Full local gate**

Run: `npm run test:web && npm run lint:web && npm run build:web`
Expected: all green, no warnings that were not present before Task 0.

- [ ] **Step 2: Capture runtime screenshots**

Run: `npm run dev:web` (background), wait for the Vite URL, then use the webapp-testing skill (Playwright) to capture into `qa-screenshots/reference-alignment/`:

- `full-1440x900.png` — the default view (Act II focused), full page
- `structure-markers-1440x900.png` — scrolled to the structure map
- `agent-rail-1440x900.png` — right rail in view (greeting card, task bars, memory tabs, checklist, focus card)
- `clue-curves-1440x900.png` — clue flow section in view
- `character-kinds-1440x900.png` — character graph section in view
- `mobile-390x844.png` — stacked layout sanity check (floating button hidden)

- [ ] **Step 3: Compare against the reference**

Open `assets/参考图/image.png` next to `full-1440x900.png` and walk the six gap items from the spec: ① structure connectors + beat markers, ② five-layer agent rail, ③ bottom status bar, ④ clue curve graph, ⑤ typed relationship coding + legend, ⑥ sidebar CTA + mascot presence. Read each screenshot back (ReadMediaFile) and confirm every item renders as designed; if any item is off, fix and re-run the relevant task tests before continuing.

- [ ] **Step 4: Commit**

```bash
git add qa-screenshots/reference-alignment
git commit -m "test: capture reference alignment qa screenshots"
```
