# UIZip Visual Conformance Repair Implementation Plan

> **Required execution skill:** `superpowers:subagent-driven-development`

**Goal:** Make the live Bixin shell and its seven primary routes visually conform to the selected UIZip references in `assets/refs/uizip/`, starting with the homepage layering regression shown by the user, while preserving the existing local API, Hermes, persistence, navigation, and editing behavior.

**Architecture:** Keep one mounted `BixinHomePage` shell with one continuous scene layer and route workbenches inside that shell. Use a 1672 x 941 canonical desktop canvas for the shared references, with a compact responsive adaptation for the 1536 x 1024 writing reference. Route pages retain their current data and action handlers; this pass changes composition, hierarchy, sizing, and styling rather than replacing integration logic.

**Tech stack:** React 19, TypeScript, plain CSS using `--bixin-*` tokens, Vitest + Testing Library, local Fastify API, browser screenshot QA.

## Sources of truth

- `D:/NOVELAGENT/assets/refs/uizip/首页.png`
- `D:/NOVELAGENT/assets/refs/uizip/写作.png`
- `D:/NOVELAGENT/assets/refs/uizip/工作流.png`
- `D:/NOVELAGENT/assets/refs/uizip/大纲.png`
- `D:/NOVELAGENT/assets/refs/uizip/人物.png`
- `D:/NOVELAGENT/assets/refs/uizip/关系.png`
- `D:/NOVELAGENT/assets/refs/uizip/世界观.png`
- `D:/NOVELAGENT/docs/redesign/2026-08-28-uizip-implementation-spec.md`
- User correction dated 2026-08-31: the homepage must not mount a new opaque image over the upper scene.

## Global constraints

- The seven reference PNGs are the visual authority. Older geometry or hero-layer assertions must change when they conflict with those images.
- Keep exactly one live Bixin shell. Do not remount `BookForeground`, `AppShell`, or any Echo/mint parallel shell.
- The homepage must have one continuous scene source and one visible main robot. Do not render `homeBackdrop`, `heroRobot`, or a duplicate masked scene subject in the live homepage. Asset files and registry keys may remain for provenance, but are not mounted.
- Do not generate any new images for this repair. Reuse the completed Image2 assets already in the repository.
- Preserve API/Hermes calls, persistence, editing flows, imported workspace data, navigation labels, and accessible interaction semantics.
- Shared desktop reference viewport is 1672 x 941 with an approximately 272 px navigation rail. Verify writing at 1536 x 1024 as well.
- New CSS uses `--bixin-*` tokens. Do not add raw product colors, dependencies, or a second token system.
- Use TDD for behavior and layout contracts: write a focused failing test, observe RED, implement, then observe GREEN. Tests must name a user-visible regression rather than merely grep implementation text.
- The worktree already contains the user's large uncommitted retrofit. Do not commit, reset, delete, or rewrite unrelated changes. Each task records its changed-file list and test evidence in `.superpowers/sdd/2026-08-31-uizip-visual-conformance-repair/` for independent review.

## Task 1: Repair shared canvas and homepage layering

**Files:**

- Modify: `apps/web/src/features/novelora-cockpit/components/home/useFitScale.ts`
- Modify: `apps/web/src/features/novelora-cockpit/components/home/useFitScale.test.ts`
- Modify: `apps/web/src/features/novelora-cockpit/components/home/BixinHomePage.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/home/BixinHomePage.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/home/SceneLayer.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/home/HeroSection.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/home/NavigationRail.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/home/HomeTopbar.tsx`
- Modify: `apps/web/src/styles/bixin-home.css`
- Modify: `apps/web/src/styles/bixin-home.test.ts`

**Acceptance criteria:**

1. Add focused tests that fail while the live homepage still mounts the independent backdrop/robot, duplicate brand, or 1416 x 786 geometry. Capture the RED command and expected failures.
2. Change the canonical shared canvas to 1672 x 941 and align the rail/stage grid to the reference proportions.
3. Render the continuous scene only once as homepage visual content. Ambient letterboxing may reuse the scene only outside the design canvas, but must not create a second in-canvas robot.
4. Make `HeroSection` a transparent text/action overlay; remove the backdrop and standalone hero robot from its DOM.
5. Remove the duplicate `BrandHeader` mount. Keep the rail brand, reposition/resize the top search and status controls to the reference header.
6. Remove the visible rail scrollbar at the reference viewport while keeping all navigation, Pro, statistics, and account controls reachable.
7. Recompose hero and dashboard heights so the three first-row cards and lower recent-project/suggestion content are visible within 1672 x 941.
8. Run focused tests, then the relevant home/style tests. Save report with RED/GREEN evidence.

## Task 2: Match the writing route

**Files:**

- Modify: `apps/web/src/features/novelora-cockpit/components/writing/WritingView.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/WritingView.css`
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/WritingView.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/writing/WritingView.css.test.ts`
- Modify only if needed for reference composition: `ChapterList.tsx`, `ChapterEditor.tsx`, `EchoChat.tsx`

**Acceptance criteria:**

1. Preserve chapter selection, saving, delegation, candidate review, and Hermes chat behavior.
2. Add the reference information hierarchy: work title/current chapter/save state and the existing actions in a compact route header.
3. At 1536 x 1024, approximate the reference three-column proportions (chapter directory about 280 px, dominant editor about 605 px, Hermes about 372 px within the available shell stage) without horizontal clipping.
4. Style the editor as the dominant paper surface and keep focus/ARIA behavior intact.
5. TDD focused behavior/layout tests and record evidence.

## Task 3: Match outline and world-document routes

**Files:**

- Modify: `apps/web/src/features/novelora-cockpit/components/pages/MarkdownDocumentPage.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/pages/MarkdownDocumentPage.css`
- Modify: `apps/web/src/features/novelora-cockpit/components/pages/MarkdownDocumentPage.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/pages/MarkdownDocumentPage.css.test.ts`
- Modify only if needed: `MarkdownOutlineTree.tsx`

**Acceptance criteria:**

1. Preserve fetch, import, editing, auto-save, and error behavior.
2. Use the reference dense three-column document workbench: wider tree, dominant paper/editor with toolbar, dense overview cards.
3. Add a presentation configuration for `document === 'world'` so the world route has its own header, tree labels, progress/overview, and structure tabs instead of being a title-only clone of outline.
4. At 1672 x 941, show all three columns without right clipping.
5. TDD focused behavior/layout tests and record evidence.

## Task 4: Match the characters route

**Files:**

- Modify: `apps/web/src/features/novelora-cockpit/components/pages/CharactersPage.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/pages/CharactersPage.css`
- Modify: `apps/web/src/features/novelora-cockpit/components/pages/CharactersPage.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/pages/CharactersPage.css.test.ts`

**Acceptance criteria:**

1. Preserve character selection, editing, importing, saving, and relationship navigation.
2. Match the reference composition: approximately 325 px searchable character rail; split portrait/text banner; tabs; asymmetric three-column detail area.
3. Keep the selected portrait and data readable without stretching/cropping generated assets incorrectly.
4. At 1672 x 941, eliminate right clipping and keep primary controls visible.
5. TDD focused behavior/layout tests and record evidence.

## Task 5: Match the relations route

**Files:**

- Modify: `apps/web/src/features/novelora-cockpit/components/pages/RelationsPage.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/pages/RelationsPage.css`
- Modify: `apps/web/src/features/novelora-cockpit/components/pages/RelationsPage.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/pages/RelationsPage.css.test.ts`
- Modify only if needed: `apps/web/src/features/novelora-cockpit/components/CharacterGraph.tsx`, `CharacterGraph.css`

**Acceptance criteria:**

1. Preserve relationship graph selection, editing, save, and zoom controls.
2. Make the graph the dominant canvas, with an anchored legend/tools layer and an approximately 380 px detail panel.
3. Add reference-like relationship category summaries and key relationships using existing data; do not invent persistence fields.
4. Keep nodes, edges, legend, zoom controls, and details legible at 1672 x 941 without clipping.
5. TDD focused behavior/layout tests and record evidence.

## Task 6: Match the workflow route

**Files:**

- Modify: `apps/web/src/features/novelora-cockpit/components/pages/WorkflowCanvasPage.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/pages/WorkflowCanvasPage.css`
- Modify: `apps/web/src/features/novelora-cockpit/components/pages/WorkflowCanvasPage.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/pages/WorkflowCanvasPage.css.test.ts`
- Modify only if needed: `apps/web/src/features/novelora-cockpit/lib/workflowCanvas.ts`

**Acceptance criteria:**

1. Preserve graph loading, node selection/dragging, inspector editing, workflow saving, execution, and status behavior.
2. Match the reference hierarchy: route title/subtitle and action group; approximately 188 px palette; dominant canvas; approximately 300 px inspector.
3. Add the reference-style bottom canvas toolbar/overview treatment without implementing unrelated workflow features.
4. Keep populated user-workspace nodes and inspector visible at 1672 x 941 without right clipping.
5. TDD focused behavior/layout tests and record evidence.

## Task 7: Cross-route browser design QA and final verification

**Files:**

- Create/modify: `D:/NOVELAGENT/design-qa.md`
- Create: `D:/NOVELAGENT/qa-screenshots/uizip-conformance/` screenshots
- Modify only files implicated by verified P0/P1/P2 comparison defects.

**Acceptance criteria:**

1. With the local API running and existing registered workspace selected, capture homepage, workflow, outline, characters, relations, and world at 1672 x 941; capture writing at 1536 x 1024.
2. Compare each capture directly with the corresponding reference. Fix every P0/P1/P2 visual issue found; re-capture after each affected fix.
3. Confirm homepage has no opaque banner overlay, no duplicate robot, no duplicate brand, and no rail scrollbar.
4. Confirm every populated route is usable, unclipped, and free of new console errors.
5. Run `npm run test:web`, `npm run lint:web`, and `npm run build:web` from repository root. Record exact results and distinguish pre-existing warnings.
6. Write `design-qa.md` with evidence paths and `final result: passed` only if all required captures and checks pass.

