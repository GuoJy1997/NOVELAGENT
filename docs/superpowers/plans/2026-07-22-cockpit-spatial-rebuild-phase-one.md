# Novelora Cockpit Spatial Rebuild Phase One Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recompose the Novelora cockpit into a reference-aligned, high-density white-mint workspace whose structure map, chapter lane, visual stage, and assistant panel fit coherently within a 1440×900 first viewport.

**Architecture:** Preserve the existing React component tree, fixture-driven data flow, and accessibility contracts. Implement the redesign through focused markup additions in the visual stage, structure map, and chapter lane, plus token-led CSS changes in the existing stylesheet. Validate each visual contract with Vitest before browser screenshot review.

**Tech Stack:** React 19, TypeScript, Vite 8, Vitest 4, Testing Library, CSS, SVG, Playwright-based local QA.

---

## File Map

- Modify `apps/web/src/styles/tokens.css`: add first-viewport sizing and spatial-stage tokens.
- Modify `apps/web/src/styles/cockpit.css`: implement the three-column geometry, glass hierarchy, stage composition, compact graphs, and responsive fallbacks.
- Modify `apps/web/src/styles/global.test.ts`: lock the layout, transparency, layering, and responsive contracts.
- Modify `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.tsx`: expose separate atmosphere, filament, book, and mascot layers.
- Modify `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx`: verify decorative-layer semantics.
- Modify `apps/web/src/features/novelora-cockpit/components/StructureMap.tsx`: render narrative markers and relationship-oriented SVG connectors.
- Modify `apps/web/src/features/novelora-cockpit/components/StructureMap.test.tsx`: verify selection and narrative-marker rendering.
- Modify `apps/web/src/features/novelora-cockpit/components/ChapterSwimlane.tsx`: render a compact continuous chapter chain.
- Modify `apps/web/src/features/novelora-cockpit/components/ChapterSwimlane.test.tsx`: verify chapter sequence and selection remain accessible.
- Modify `apps/web/src/features/novelora-cockpit/components/AgentPanel.tsx`: expose determinate task progress without changing fixture ownership.
- Modify `apps/web/src/features/novelora-cockpit/components/AgentPanel.test.tsx`: verify progress semantics.
- Produce `qa-screenshots/spatial-rebuild-phase-one/`: desktop, medium, and mobile visual evidence.

### Task 1: Lock the first-viewport design tokens

**Files:**
- Modify: `apps/web/src/styles/global.test.ts`
- Modify: `apps/web/src/styles/tokens.css`

- [ ] **Step 1: Write the failing token contract**

Add this test beside the existing visual-stage token test:

```ts
it('defines the compact cockpit geometry used by the first viewport', () => {
  expect(tokensCss).toMatch(/--cockpit-sidebar-width:\s*232px;/);
  expect(tokensCss).toMatch(/--cockpit-assistant-width:\s*296px;/);
  expect(tokensCss).toMatch(/--cockpit-topbar-height:\s*76px;/);
  expect(tokensCss).toMatch(/--cockpit-section-gap:\s*14px;/);
  expect(tokensCss).toMatch(/--visual-stage-flow-opacity:\s*0\.9;/);
  expect(tokensCss).toMatch(/--visual-stage-book-width:\s*clamp\(300px,\s*23vw,\s*380px\);/);
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `cd apps/web && npm run test -- --run src/styles/global.test.ts`

Expected: FAIL because the new cockpit geometry tokens do not exist or retain the old values.

- [ ] **Step 3: Add the design tokens**

Add these declarations in `:root` and replace the two existing stage values:

```css
--cockpit-sidebar-width: 232px;
--cockpit-assistant-width: 296px;
--cockpit-topbar-height: 76px;
--cockpit-section-gap: 14px;
--visual-stage-flow-opacity: 0.9;
--visual-stage-book-width: clamp(300px, 23vw, 380px);
```

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `cd apps/web && npm run test -- --run src/styles/global.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit checkpoint when explicitly authorized**

```bash
git add apps/web/src/styles/tokens.css apps/web/src/styles/global.test.ts
git commit -m "test: lock compact cockpit geometry"
```

### Task 2: Rebuild the visual stage as spatial layers

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.tsx`
- Modify: `apps/web/src/styles/cockpit.css`
- Modify: `apps/web/src/styles/global.test.ts`

- [ ] **Step 1: Write the failing component test**

Add the following assertion to the visual-stage test suite:

```tsx
it('renders independent spatial atmosphere layers without accessible noise', () => {
  const { container } = render(<CockpitVisualStage />);

  expect(container.querySelector('.cockpit-visual-stage__wash')).toBeInTheDocument();
  expect(container.querySelector('.cockpit-visual-stage__filaments')).toBeInTheDocument();
  expect(container.querySelector('.cockpit-visual-stage__book-layer')).toBeInTheDocument();
  expect(container.querySelector('.cockpit-visual-stage__foreground')).toBeInTheDocument();
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
});
```

- [ ] **Step 2: Run the component test and confirm RED**

Run: `cd apps/web && npm run test -- --run src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx`

Expected: FAIL because the wash and filament layers are absent.

- [ ] **Step 3: Add the two decorative layers**

Insert them inside `.cockpit-visual-stage__backdrop`, before the flow image:

```tsx
<div className="cockpit-visual-stage__wash" />
<div className="cockpit-visual-stage__filaments" />
```

- [ ] **Step 4: Implement the spatial composition**

Add explicit CSS rules that keep atmosphere behind content and anchor the branded scene to the lower-left:

```css
.cockpit-visual-stage__wash {
  position: absolute;
  inset: 6% 12% 8% 8%;
  background: radial-gradient(ellipse at 34% 64%, rgba(80, 224, 159, 0.26), transparent 48%);
  filter: blur(24px);
}

.cockpit-visual-stage__filaments {
  position: absolute;
  inset: 8% -8% 4% 4%;
  opacity: 0.48;
  background: repeating-radial-gradient(ellipse at 34% 72%, rgba(10, 168, 91, 0.24) 0 1px, transparent 2px 14px);
  transform: rotate(-9deg);
}
```

Reposition `.cockpit-visual-stage__flow`, `.cockpit-visual-stage__book`, and `.cockpit-visual-stage__mascot` so the book and Nova share an overlap and glow rather than occupying separate empty corners.

- [ ] **Step 5: Extend the CSS layer contract**

Add assertions in `global.test.ts` for `.cockpit-visual-stage__wash`, `.cockpit-visual-stage__filaments`, and the lower-left anchoring of book and mascot. Assert that all decorative layers keep `pointer-events: none` through their shared parent rules.

- [ ] **Step 6: Run focused tests and confirm GREEN**

Run: `cd apps/web && npm run test -- --run src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx src/styles/global.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit checkpoint when explicitly authorized**

```bash
git add apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.tsx apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx apps/web/src/styles/cockpit.css apps/web/src/styles/global.test.ts
git commit -m "feat: compose the cockpit spatial stage"
```

### Task 3: Compress the shell and first-viewport rhythm

**Files:**
- Modify: `apps/web/src/styles/global.test.ts`
- Modify: `apps/web/src/styles/cockpit.css`

- [ ] **Step 1: Write the failing geometry contract**

```ts
it('fits the desktop cockpit into a compact reference-aligned grid', () => {
  expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-shell', 'grid-template-columns')).toBe(
    'var(--cockpit-sidebar-width) minmax(0, 1fr) var(--cockpit-assistant-width)',
  );
  expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-topbar', 'min-height')).toBe(
    'var(--cockpit-topbar-height)',
  );
  expect(finalTopLevelDeclaration(cockpitCss, '.story-workspace', 'gap')).toBe(
    'var(--cockpit-section-gap)',
  );
  expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-main', 'padding')).toBe('18px 20px 22px');
});
```

- [ ] **Step 2: Run the style test and confirm RED**

Run: `cd apps/web && npm run test -- --run src/styles/global.test.ts`

Expected: FAIL on the old three-column widths, topbar height, workspace gap, or main padding.

- [ ] **Step 3: Implement the compact shell**

Set the shell grid to the tokenized widths. Reduce topbar, main padding, workspace gaps, section heading margins, card radii, and repeated outer shadows. Keep the existing stacking order and transparent workspace background.

Use this base declaration:

```css
.cockpit-shell {
  grid-template-columns: var(--cockpit-sidebar-width) minmax(0, 1fr) var(--cockpit-assistant-width);
}

.cockpit-main { padding: 18px 20px 22px; }
.story-workspace { gap: var(--cockpit-section-gap); }
.cockpit-topbar { min-height: var(--cockpit-topbar-height); }
```

- [ ] **Step 4: Preserve responsive behavior**

Update the existing 1440px and 1180px media rules to reduce side widths before horizontal overflow. Keep the established mobile single-column rule below 900px and continue hiding heavy book and mascot assets where the existing tests require it.

- [ ] **Step 5: Run the style test and confirm GREEN**

Run: `cd apps/web && npm run test -- --run src/styles/global.test.ts`

Expected: PASS.

### Task 4: Convert Structure Map into a narrative relationship graph

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/StructureMap.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/StructureMap.tsx`
- Modify: `apps/web/src/styles/cockpit.css`

- [ ] **Step 1: Write the failing narrative-marker test**

```tsx
it('renders narrative markers while preserving act selection', async () => {
  const user = userEvent.setup();
  const onSelectAct = vi.fn();
  render(<StructureMapHarness onSelectAct={onSelectAct} />);

  expect(screen.getByText('Core conflict')).toBeInTheDocument();
  expect(screen.getByText('Climax')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Act III/i }));
  expect(onSelectAct).toHaveBeenCalledWith('act-iii');
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `cd apps/web && npm run test -- --run src/features/novelora-cockpit/components/StructureMap.test.tsx`

Expected: FAIL because `narrativeMarkers` are not rendered.

- [ ] **Step 3: Render marker nodes and refined connectors**

Inside `.structure-map__rail`, render marker labels from each act before the card grid:

```tsx
<div className="structure-map__markers" aria-label="Narrative markers">
  {acts.flatMap((act) =>
    act.narrativeMarkers.map((marker) => (
      <span key={`${act.id}-${marker.label}`} className={`structure-marker structure-marker--${marker.tone}`}>
        {marker.label}
      </span>
    )),
  )}
</div>
```

Replace the single decorative wave with a small set of SVG paths that visibly enter and leave every Act node. Keep the SVG `aria-hidden="true"` and all Act cards as real buttons with `aria-pressed`.

- [ ] **Step 4: Remove bulky dashboard styling**

Reduce Act card height and padding, remove the filled progress track, and use an inline percentage plus a short accent stroke. Selected state uses mint outline and localized glow instead of a full mint card fill.

- [ ] **Step 5: Run the test and confirm GREEN**

Run: `cd apps/web && npm run test -- --run src/features/novelora-cockpit/components/StructureMap.test.tsx`

Expected: PASS.

### Task 5: Convert Chapter Swimlane into a continuous chapter chain

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/ChapterSwimlane.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/ChapterSwimlane.tsx`
- Modify: `apps/web/src/styles/cockpit.css`

- [ ] **Step 1: Write the failing connector test**

```tsx
it('renders a continuous chapter chain without changing button semantics', () => {
  const { container } = render(
    <ChapterSwimlaneHarness onSelectChapter={vi.fn()} />,
  );

  expect(container.querySelectorAll('.chapter-chain-link')).toHaveLength(1);
  expect(screen.getAllByRole('button', { name: /Chapter/i }).length).toBeGreaterThan(1);
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `cd apps/web && npm run test -- --run src/features/novelora-cockpit/components/ChapterSwimlane.test.tsx`

Expected: FAIL because the chain link element is absent.

- [ ] **Step 3: Add the continuous rail element**

Add one decorative rail before the mapped chapter buttons:

```tsx
<span className="chapter-chain-link" aria-hidden="true" />
```

Keep every chapter as a button and the disabled Add Chapter control as the final node.

- [ ] **Step 4: Implement compact chapter nodes**

Use a one-row desktop rail, compact metadata, and an absolute connector behind the cards. The selected chapter should use border and node emphasis. Keep overflow scrolling on smaller widths without clipping focus outlines.

- [ ] **Step 5: Run the component test and confirm GREEN**

Run: `cd apps/web && npm run test -- --run src/features/novelora-cockpit/components/ChapterSwimlane.test.tsx`

Expected: PASS.

### Task 6: Densify the assistant panel with real progress semantics

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/AgentPanel.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/AgentPanel.tsx`
- Modify: `apps/web/src/styles/cockpit.css`

- [ ] **Step 1: Write the failing progress test**

```tsx
it('exposes determinate progress for every agent task', () => {
  render(<AgentPanel project={noveloraMockProject} />);

  for (const task of noveloraMockProject.agentTasks) {
    expect(screen.getByRole('progressbar', { name: `${task.title} progress` })).toHaveAttribute(
      'value',
      String(task.progressPercent),
    );
  }
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `cd apps/web && npm run test -- --run src/features/novelora-cockpit/components/AgentPanel.test.tsx`

Expected: FAIL because only the running task renders an indeterminate progress element.

- [ ] **Step 3: Render determinate progress for every task**

Replace the conditional progress element with:

```tsx
<progress
  className="agent-task-progress"
  aria-label={`${task.title} progress`}
  max={100}
  value={task.progressPercent}
/>
```

- [ ] **Step 4: Compress the right panel**

Reduce repeated section padding, task row height, heading margins, and status-chip size. Keep each section visually grouped through spacing and subtle dividers instead of equally heavy card containers.

- [ ] **Step 5: Run the component test and confirm GREEN**

Run: `cd apps/web && npm run test -- --run src/features/novelora-cockpit/components/AgentPanel.test.tsx`

Expected: PASS.

### Task 7: Verify the complete cockpit and capture evidence

**Files:**
- Verify: `apps/web/src/App.test.tsx`
- Verify: `apps/web/src/styles/global.test.ts`
- Produce: `qa-screenshots/spatial-rebuild-phase-one/viewport-1440x900.png`
- Produce: `qa-screenshots/spatial-rebuild-phase-one/viewport-1180x900.png`
- Produce: `qa-screenshots/spatial-rebuild-phase-one/viewport-390x844.png`

- [ ] **Step 1: Run the complete test suite**

Run: `npm run test:web`

Expected: all Vitest suites pass with zero failures.

- [ ] **Step 2: Run lint**

Run: `npm run lint:web`

Expected: oxlint exits with code 0.

- [ ] **Step 3: Run the production build**

Run: `npm run build:web`

Expected: TypeScript and Vite complete successfully.

- [ ] **Step 4: Start a production preview**

Run from `apps/web`: `npm run preview -- --host 127.0.0.1 --port 4177`

Expected: the preview serves the app at `http://127.0.0.1:4177/`.

- [ ] **Step 5: Capture the three viewport screenshots**

Use the local browser QA workflow to capture 1440×900, 1180×900, and 390×844 screenshots into `qa-screenshots/spatial-rebuild-phase-one/`.

- [ ] **Step 6: Perform the reference checklist**

At 1440×900 confirm all four Acts are fully visible, the chapter lane reads as one continuous sequence, lower creative modules enter the first viewport, the mint flow remains visible across panel gaps, the book and Nova are not cropped, and the assistant panel reads as a compact console.

- [ ] **Step 7: Commit final checkpoint when explicitly authorized**

```bash
git add apps/web/src qa-screenshots/spatial-rebuild-phase-one
git commit -m "feat: rebuild the reference-aligned cockpit stage"
```

## Self-Review

- Spec coverage: layout, spatial stage, structure graph, chapter chain, assistant density, responsive behavior, and screenshot acceptance are each mapped to a task.
- Placeholder scan: no deferred implementation language or unnamed test work remains.
- Type consistency: the plan uses the existing `Act.narrativeMarkers` and `AgentTask.progressPercent` fields already present in the working tree.
- Scope control: no backend, persistence, routing, model integration, or unrelated fixture rewrite is included.
