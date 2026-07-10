# Novelora Bright Cockpit UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or an equivalent task-by-task execution workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder Vite page with a functional, asset-led Novelora desktop writing cockpit that faithfully establishes the new bright premium collectible-toy visual system.

**Architecture:** Keep the existing Vite + React + TypeScript application and its mock project as the first vertical slice. Extract the supplied asset pack into a stable source-asset directory, expose it through one asset registry, and compose the screen from small product-area components. The first release is intentionally mock-data-driven: it proves layout, visual language, selection, filters, drawers and accessibility before API, RAG, and real Agent execution are connected.

**Tech Stack:** Vite, React 19, TypeScript, CSS, Vitest, Testing Library, supplied SVG/PNG assets. No graph, state-management, or drag-and-drop dependency is introduced in this slice.

---

## Scope and decisions

- This is the new **bright Novelora** design, not a recolour of the former dark brass cockpit.
- The target is the desktop 1920 × 1080 reference composition; responsive rules retain usable content down to 1024px, then allow the central workspace to scroll horizontally rather than compressing cards into illegibility.
- `apps/web/src/assets/uiModel/novelora_ui_asset_pack (1).zip` is the supplied source package. Its contents are copied into `apps/web/src/assets/novelora/`; the original zip and the user-authored plan remain untouched.
- The existing Vite app remains Vite. Next.js in the asset-plan document is optional, not a migration requirement.
- Real persistence, model calls, RAG, drag-and-drop mutation, graph physics, and publishing workflows are excluded. Their existing product specs remain the contracts for later vertical slices.

## File structure

```text
apps/web/src/
├─ App.tsx                                  # Screen state and composition only
├─ App.test.tsx                             # Screen-level interaction coverage
├─ assets/novelora/                         # Extracted, versioned visual assets
├─ features/novelora-cockpit/
│  ├─ assetRegistry.ts                       # Every UI asset path in one place
│  ├─ types.ts                               # View types; extends existing project domain safely
│  ├─ data/noveloraMockProject.ts            # Bright-cockpit presentation data
│  └─ components/
│     ├─ AppShell.tsx                        # 3-column desktop shell
│     ├─ ProjectSidebar.tsx                  # Logo, navigation, projects, Nova stage
│     ├─ WorkspaceTopbar.tsx                 # Project identity, actions and search
│     ├─ StructureMap.tsx                    # Acts and connected macro structure
│     ├─ ChapterSwimlane.tsx                 # Chapter selection and act filtering
│     ├─ InspirationVault.tsx                # Filterable inspiration cards
│     ├─ CharacterGraph.tsx                  # Static SVG relationship preview
│     ├─ ClueAttributionFlow.tsx             # Provider → trigger → receiver → payoff
│     ├─ AgentPanel.tsx                      # Agent status, tasks, skills and memory
│     └─ ChapterDetailDrawer.tsx             # Selected chapter details
└─ styles/
   ├─ tokens.css                             # New bright system tokens and motion tokens
   ├─ global.css                             # Reset, canvas, accessibility and responsive rules
   └─ cockpit.css                            # Component layout and visual treatment
```

## Implementation tasks

### Task 1: Prepare the asset pipeline and bright design tokens

**Files:**

- Create: `apps/web/src/assets/novelora/**` by extracting the supplied zip
- Create: `apps/web/src/features/novelora-cockpit/assetRegistry.ts`
- Modify: `apps/web/src/styles/tokens.css`
- Modify: `apps/web/src/styles/global.css`

- [ ] Extract `novelora_ui_asset_pack (1).zip` into `apps/web/src/assets/novelora/novelora_ui_asset_pack/`, preserving its directory hierarchy. Do not rename or delete the original source zip.
- [ ] Add an asset registry with exported paths for `logo`, `appIcon`, `novaFront`, `novaAvatar`, project covers, five named portraits, four inspiration thumbnails, the bright background, paper grain, and all five clue nodes. Components must consume this registry rather than hard-coded relative paths.
- [ ] Replace the dark tokens with the supplied canonical palette: `#FFFDF8` canvas, `#FFFFFF` surface, `#FF6B57` coral, `#36C7B4` mint, `#3A86FF` sky, `#FFB547` amber, `#8F67FF` lilac, and `#141414` ink. Retain tokens for muted text, borders, radii, shadows, and reduced-motion-safe durations.
- [ ] Make the document background use the bright cockpit background and a low-opacity paper-grain overlay. The texture must be decorative only (`pointer-events: none`) and text must retain contrast on every surface.
- [ ] Verify the package has no broken references by rendering the logo and Nova front asset in a temporary smoke test, then remove the temporary test after component coverage exists.
- [ ] Commit: `feat: add novelora asset pipeline and design tokens`.

### Task 2: Define the bright cockpit view model and fixture

**Files:**

- Create: `apps/web/src/features/novelora-cockpit/types.ts`
- Create: `apps/web/src/features/novelora-cockpit/data/noveloraMockProject.ts`
- Create: `apps/web/src/features/novelora-cockpit/data/noveloraMockProject.test.ts`

- [ ] Write data tests asserting that the fixture contains four acts, six chapters, a selected chapter in Act II, five character nodes, at least two clue chains with all four attribution roles, and four Agent tasks with `queued | running | done | blocked` states.
- [ ] Define narrow view types: `Act`, `CockpitChapter`, `InspirationType`, `InspirationItem`, `CharacterRelationship`, `ClueFlow`, `AgentTaskState`, `AgentTask`, `MemorySource`, and `NoveloraProject`.
- [ ] Populate `noveloraMockProject` with `Tides of Embers`, the supplied covers/portraits/thumbnails, Act I–III plus Epilogue, the six chapter cards, two linked clue flows, and a 78% memory health value. It must stay isolated by `novelId: 'tides-of-embers'`.
- [ ] Run `npm --prefix apps/web run test -- src/features/novelora-cockpit/data/noveloraMockProject.test.ts --run`; expect PASS.
- [ ] Commit: `feat: add novelora cockpit fixture`.

### Task 3: Establish the application shell, navigation and top bar

**Files:**

- Create: `apps/web/src/features/novelora-cockpit/components/AppShell.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/ProjectSidebar.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/WorkspaceTopbar.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/AppShell.test.tsx`
- Modify: `apps/web/src/styles/cockpit.css`
- Modify: `apps/web/src/App.tsx`

- [ ] Write a render test that locates the Novelora logo by alt text, all seven navigation buttons, the current project name, a labelled search control, and a complementary right panel landmark.
- [ ] Implement the 296px left rail, fluid center workspace, and 360px right rail using CSS grid. The app must have one `main` landmark and visible keyboard focus states.
- [ ] Implement the sidebar using supplied SVG navigation icons, the active Story Map state in coral, a project mini-list, a writing-streak card, and Nova’s supplied mascot SVG as an anchored scene asset—not as a floating decorative emoji.
- [ ] Implement the top bar with project identity, genre, word-progress text, search, notification button, and user avatar. Buttons need descriptive `aria-label` values even if their action is mock-only.
- [ ] Import `cockpit.css` from `App.tsx`; retain `global.css` as the only global reset entry point.
- [ ] Run the shell test and `npm --prefix apps/web run build`; expect PASS and a Vite build.
- [ ] Commit: `feat: build novelora cockpit shell`.

### Task 4: Build the structure map and act-aware chapter swimlane

**Files:**

- Create: `apps/web/src/features/novelora-cockpit/components/StructureMap.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/ChapterSwimlane.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/StructureMap.test.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/ChapterSwimlane.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles/cockpit.css`

- [ ] Write a StructureMap test that clicks Act II and asserts it becomes selected and emits its id. Write a ChapterSwimlane test that clicks Chapter 3 and asserts the selected card has `aria-pressed="true"`.
- [ ] Render four act cards with title, subtitle, chapter range, progress, and a semantic button. Use an SVG connector layer behind cards; it must never intercept input.
- [ ] Render the selected act’s chapters as a horizontally scrollable rail. Each card exposes chapter number, beat, word count, character avatars, clue count, lock status, and a clear selected border. Include an Add Chapter card that is visually disabled and labelled as a future action.
- [ ] In `App.tsx`, keep `selectedActId` and `selectedChapterId` in React state. Selecting an act sets its first available chapter; selecting a chapter updates the selection without mutating fixture data.
- [ ] Run both component tests and build; expect PASS.
- [ ] Commit: `feat: add structure map and chapter swimlane`.

### Task 5: Restore the lower knowledge workspace

**Files:**

- Create: `apps/web/src/features/novelora-cockpit/components/InspirationVault.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/CharacterGraph.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/ClueAttributionFlow.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/InspirationVault.test.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/ClueAttributionFlow.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles/cockpit.css`

- [ ] Write an InspirationVault test that switches from `All` to `Ideas` and verifies image-only inspiration cards are excluded. Write a ClueAttributionFlow test that selects Chapter 6 and displays the connected payoff.
- [ ] Implement the vault with All, Quotes, Images, Ideas and Refs filter buttons. Use supplied thumbnails; cards include title, small provenance/type tag, and a button that marks the item as selected locally.
- [ ] Implement a static, readable character relationship graph: character portraits as nodes, SVG edges behind nodes, line color by relation, a compact legend, and buttons that expose each character’s name/role via accessible text. Do not introduce a graph library yet.
- [ ] Implement one active clue flow with the required `Provider → Trigger → Receiver → Payoff` roles. Each node uses the supplied role asset and displays the actor or source responsible for the clue event. When the selected chapter has no linked flow, display an explicit empty state.
- [ ] Run the lower-workspace tests and build; expect PASS.
- [ ] Commit: `feat: add novelora knowledge workspace`.

### Task 6: Build the Agent orchestration rail and chapter detail drawer

**Files:**

- Create: `apps/web/src/features/novelora-cockpit/components/AgentPanel.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/ChapterDetailDrawer.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/AgentPanel.test.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/ChapterDetailDrawer.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles/cockpit.css`

- [ ] Write an AgentPanel test that finds one running task, its progress bar, all memory sources, and the review checklist. Write a drawer test that opens from a selected chapter and closes on its labelled close button.
- [ ] Implement the Agent panel with the Nova lead card, task rows, state chips, task progress, subagent avatars, skill chips, 78% memory health, the review checklist, and a Focus Mode switch. Toggle state is local and must be announced with `aria-pressed`.
- [ ] Implement a right-side drawer that opens when a selected chapter is activated. It shows chapter title, act, beat, word count, associated characters, and linked clues. Focus moves to the close button on opening and returns to the invoker on close.
- [ ] Run component tests and build; expect PASS.
- [ ] Commit: `feat: add agent rail and chapter drawer`.

### Task 7: Integrate interactions and harden responsive/accessibility behavior

**Files:**

- Create: `apps/web/src/App.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles/global.css`
- Modify: `apps/web/src/styles/cockpit.css`

- [ ] Write an integration test that selects Act III, then its first chapter, opens its detail drawer, and verifies the clue panel changes to the corresponding clue or explicit empty state. Add a test for Inspiration tab filtering and Focus Mode toggling.
- [ ] Add desktop-first breakpoints: at ≤1440px reduce side rails; at ≤1180px preserve a minimum-width workspace with horizontal scrolling; at ≤900px stack panels and retain the chapter rail. Do not hide navigation without providing a usable alternative.
- [ ] Add `prefers-reduced-motion: reduce` rules that suppress connector flow, breathing selected states, shimmer, and mascot idle transitions.
- [ ] Verify color contrast for primary text, muted text, coral-on-white controls, and selected chapters; adjust tokens rather than adding local one-off colors.
- [ ] Run `npm --prefix apps/web run test -- --run` and `npm --prefix apps/web run build`; expect PASS.
- [ ] Commit: `test: cover novelora cockpit interactions`.

### Task 8: Complete visual QA and documentation

**Files:**

- Modify: `apps/web/README.md`
- Create: `docs/superpowers/specs/2026-07-10-novelora-bright-cockpit-ui-design.md`

- [ ] Record the design-language contract: core phrase `明亮收藏级创作驾驶舱`; motherform `map desk + collectible companion`; materials `warm paper, enamel, soft glass`; strict palette; editorial display font plus clean UI sans; and the prohibition on large dark panels, generic glass cards, emoji icons, and unmotivated glow.
- [ ] Add the run, test, build commands and MVP boundary to the web README. State explicitly that mock data does not represent real Agent execution or persistent novel data.
- [ ] Capture desktop screenshots at 1920×1080 and 1280×900. Verify that the first viewport remains a whole visual poster, the Nova asset is present but subordinate to writing data, and all assets retain their intended crop.
- [ ] Run final verification: `npm --prefix apps/web run test -- --run`, `npm --prefix apps/web run build`, `npm --prefix apps/web run lint`, and `git status --short`. Resolve all failures before completion.
- [ ] Commit: `docs: document novelora bright cockpit UI`.

## Verification matrix

| Concern | Evidence |
| --- | --- |
| Supplied assets are actually used | Asset registry and rendered image alt text in component tests |
| Bright direction replaced legacy dark direction | Token inspection and desktop screenshot |
| Story structure is navigable | Act and chapter selection tests |
| Per-chapter clue attribution is visible | Clue-flow interaction test |
| Agent state is comprehensible | Agent-panel render test |
| Keyboard and motion safety | Drawer focus test, focus styles, reduced-motion CSS |
| Build integrity | Full Vitest, lint, and Vite build runs |

## Subsequent product slices

After this cockpit is accepted visually, implement the actual product capabilities in dependency order:

1. Project, character, worldbuilding, inspiration, clue and arc persistence.
2. Swimlane editor with drag/drop and event/foreshadowing lanes.
3. RAG context engine plus long-term memory retrieval and provenance.
4. Model router, skills, and orchestrated Agent task execution.
5. Chapter writing/review and publication review workflows.
