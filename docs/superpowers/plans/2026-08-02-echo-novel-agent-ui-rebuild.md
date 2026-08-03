# Echo Novel-native AI Agent UI Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the current mock-data novel cockpit as the approved Echo desktop experience, using the supplied scenic background once, real interactive components, and panel surfaces that are not drawn where the book occludes them.

**Architecture:** Keep the existing React domain data and selection behavior, but replace the current three-column cockpit composition with an Echo sidebar, topbar, hero, and dashboard dock. Isolate the new visual system in `echo.css`, render the scenic PNG once, split occluded panel surfaces from their functional content, and move extended Agent information behind a drawer so the 1672 × 941 first viewport matches the handoff.

**Tech Stack:** React 19, TypeScript 6, Vite 8, plain CSS, SVG, Vitest, Testing Library, Playwright.

---

## Execution Safety

The repository already has uncommitted changes in many target files. Preserve all unrelated changes and inspect each diff before editing. Do not use `git reset`, `git checkout --`, or whole-file restoration. Do not create commits that mix pre-existing work with this rebuild; use verification checkpoints instead unless the user explicitly authorizes a scoped commit strategy.

Binary asset copying is a mechanical operation. Source-code edits must use patch-based editing. Run focused tests from `apps/web` or use the root forwarding scripts because CSS contract tests depend on the application working directory.

## File Responsibility Map

### Assets and registry

- Create `apps/web/src/assets/echo/hero-background-clean.png`: byte-identical copy of the approved scenic source.
- Modify `apps/web/src/features/novelora-cockpit/assetRegistry.ts`: register `echoHeroBackground`; retain reusable local portraits, icons, thumbnails, and assistant art.
- Modify `apps/web/src/features/novelora-cockpit/assetRegistry.test.ts`: prove the Echo asset resolves and the old full-stage background is no longer the active visual source.

### Page composition

- Create `apps/web/src/features/novelora-cockpit/components/EchoHeroBackground.tsx`: the single decorative scenic image.
- Create `apps/web/src/features/novelora-cockpit/components/EchoHeroBackground.test.tsx`: image-count, source, decoding, and accessibility contract.
- Modify `apps/web/src/features/novelora-cockpit/components/AppShell.tsx`: sidebar plus main-stage shell; no permanent right rail.
- Modify `apps/web/src/features/novelora-cockpit/components/AppShell.test.tsx`: Echo brand and semantic-region contract.
- Create `apps/web/src/features/novelora-cockpit/components/EchoHeroCopy.tsx`: hero headline, actions, and callbacks.
- Create `apps/web/src/features/novelora-cockpit/components/EchoHeroCopy.test.tsx`: hero copy and button behavior.
- Modify `apps/web/src/App.tsx`: assemble the Echo page and retain chapter/Act selection and drawer state.
- Modify `apps/web/src/App.test.tsx`: end-to-end composition and interaction contracts.

### Navigation and project controls

- Modify `apps/web/src/features/novelora-cockpit/components/ProjectSidebar.tsx`: Echo wordmark, new-project action, navigation selection, utilities, and progress.
- Modify `apps/web/src/features/novelora-cockpit/components/ProjectSidebar.test.tsx`: visible branding and selected-navigation behavior.
- Modify `apps/web/src/features/novelora-cockpit/components/WorkspaceTopbar.tsx`: project switcher, status, target, search, notification, and user menu.
- Modify `apps/web/src/features/novelora-cockpit/components/WorkspaceTopbar.test.tsx`: dropdown and keyboard semantics.

### Occluded first row

- Create `apps/web/src/features/novelora-cockpit/components/OccludedPanel.tsx`: structural surface/cap/content separation.
- Create `apps/web/src/features/novelora-cockpit/components/OccludedPanel.test.tsx`: DOM ordering and accessibility contract.
- Modify `apps/web/src/features/novelora-cockpit/components/StructureMap.tsx`: compact reference-scale Act map inside `OccludedPanel`.
- Modify `apps/web/src/features/novelora-cockpit/components/StructureMap.test.tsx`: selection, solid cards, and panel structure.
- Modify `apps/web/src/features/novelora-cockpit/components/ChapterSwimlane.tsx`: Chapter Timeline, reorder state, chapter cards, and progress rail.
- Modify `apps/web/src/features/novelora-cockpit/components/ChapterSwimlane.test.tsx`: selection, reorder, and structural progress placement.

### Agent and memory

- Create `apps/web/src/features/novelora-cockpit/components/AIWritingPartner.tsx`: compact first-viewport assistant card.
- Create `apps/web/src/features/novelora-cockpit/components/AIWritingPartner.test.tsx`: task progress and View All behavior.
- Create `apps/web/src/features/novelora-cockpit/components/MemoryLayer.tsx`: reference-style memory tags and Manage behavior.
- Create `apps/web/src/features/novelora-cockpit/components/MemoryLayer.test.tsx`: tag selection and Manage callback.
- Create `apps/web/src/features/novelora-cockpit/components/AgentDetailsDrawer.tsx`: preserve Subagents, Skills, Review, and Focus Mode outside the first viewport.
- Create `apps/web/src/features/novelora-cockpit/components/AgentDetailsDrawer.test.tsx`: dialog close paths and focus restoration.
- Retire the active use of `apps/web/src/features/novelora-cockpit/components/AgentPanel.tsx`; do not delete its behavior until the drawer replacement is green.

### Lower dashboard modules

- Modify `apps/web/src/features/novelora-cockpit/components/InspirationVault.tsx`: compact three-row archive with View All.
- Modify `apps/web/src/features/novelora-cockpit/components/InspirationVault.test.tsx`: filters, selection, and callback.
- Modify `apps/web/src/features/novelora-cockpit/components/CharacterGraph.tsx`: reference-scale SVG node layout.
- Modify `apps/web/src/features/novelora-cockpit/components/CharacterGraph.test.tsx`: SVG relationships and semantic labels.
- Modify `apps/web/src/features/novelora-cockpit/components/ClueAttributionFlow.tsx`: compact source/target columns with SVG Bézier paths.
- Modify `apps/web/src/features/novelora-cockpit/components/ClueAttributionFlow.test.tsx`: selected-chapter filtering and SVG path contract.

### Visual system and QA

- Create `apps/web/src/styles/echo.css`: the active Echo page, component, layer, occlusion, and responsive styles.
- Create `apps/web/src/styles/echo.test.ts`: source-level visual contracts for the single background, pure-white page, layers, solid cards, breakpoints, and reduced motion.
- Modify `apps/web/src/styles/tokens.css`: add stable `--echo-*` tokens without breaking legacy test fixtures.
- Modify `apps/web/src/styles/global.css`: remove the body texture overlay and enforce a pure-white page.
- Modify `apps/web/index.html`: set the document title to Echo.
- Produce `qa-screenshots/echo-handoff-v1/`: browser screenshots and visual overlays.

---

### Task 1: Register the Approved Echo Background

**Files:**
- Create: `apps/web/src/assets/echo/hero-background-clean.png`
- Modify: `apps/web/src/features/novelora-cockpit/assetRegistry.ts`
- Modify: `apps/web/src/features/novelora-cockpit/assetRegistry.test.ts`

- [x] **Step 1: Add a failing registry contract**

Add an import and assertion that the registry exports a Vite URL for the exact Echo source name:

```ts
import { echoHeroBackground } from './assetRegistry';

it('registers the approved Echo hero background', () => {
  expect(echoHeroBackground).toContain('hero-background-clean');
  expect(echoHeroBackground).toMatch(/\.png(?:\?|$)/);
});
```

- [x] **Step 2: Run the focused test and confirm red**

Run:

```powershell
npm.cmd --prefix apps/web run test -- --run src/features/novelora-cockpit/assetRegistry.test.ts
```

Expected: FAIL because `echoHeroBackground` is not exported.

- [x] **Step 3: Copy and verify the binary asset**

Resolve both paths inside `D:\novelAgent`, create `apps/web/src/assets/echo`, copy the source PNG, then verify both hashes equal:

```powershell
Copy-Item -LiteralPath 'assets\echo-novel-agent-ui-handoff-v1\assets\hero-background-clean.png' -Destination 'apps\web\src\assets\echo\hero-background-clean.png'
Get-FileHash -Algorithm SHA256 -LiteralPath 'assets\echo-novel-agent-ui-handoff-v1\assets\hero-background-clean.png','apps\web\src\assets\echo\hero-background-clean.png'
```

Expected hash for both files: `ABE1DD54DC4F5C587C406C8E567593F5B63FDA0672568621E2320B9F2D3BE9DF`.

- [x] **Step 4: Register the asset**

Add:

```ts
export const echoHeroBackground = new URL(
  '../../assets/echo/hero-background-clean.png',
  import.meta.url,
).href;
```

Retain `writingCompanion`, portraits, thumbnails, and icons because later cards reuse them. Do not use `bookOriginBackground` in new page code.

- [x] **Step 5: Run the registry test and inspect the diff**

Run the focused test again and `git diff --check`. Expected: registry tests PASS and both PNG hashes remain identical.

---

### Task 2: Replace the Double Visual Stage with One Scenic Image

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/components/EchoHeroBackground.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/EchoHeroBackground.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/AppShell.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/AppShell.test.tsx`

- [x] **Step 1: Write the failing background component test**

```tsx
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EchoHeroBackground } from './EchoHeroBackground';

describe('EchoHeroBackground', () => {
  it('renders one inert high-priority scenic image', () => {
    const { container } = render(<EchoHeroBackground />);
    const images = container.querySelectorAll('img');

    expect(images).toHaveLength(1);
    expect(images[0]).toHaveClass('echo-hero-background__image');
    expect(images[0]).toHaveAttribute('alt', '');
    expect(images[0]).toHaveAttribute('decoding', 'async');
    expect(images[0]).toHaveAttribute('fetchpriority', 'high');
    expect(images[0]).toHaveAttribute('draggable', 'false');
  });
});
```

- [x] **Step 2: Run the test and confirm red**

Expected: module resolution failure because `EchoHeroBackground.tsx` does not exist.

- [x] **Step 3: Implement the single-image component**

```tsx
import { echoHeroBackground } from '../assetRegistry';

export function EchoHeroBackground() {
  return (
    <div className="echo-hero-background" aria-hidden="true">
      <img
        className="echo-hero-background__image"
        src={echoHeroBackground}
        alt=""
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />
    </div>
  );
}
```

- [x] **Step 4: Switch the live shell to the single Echo background**

Replace the `CockpitVisualStage` import and render with `EchoHeroBackground`. Preserve the current `sidebar`, `topbar`, `children`, and `rightPanel` props temporarily so the existing App and interaction suite remain green until Task 10 performs the atomic page integration. The live shell order for this stage is:

```tsx
<div className="cockpit-scroll">
  <EchoHeroBackground />
  <div className="cockpit-shell">
    <aside className="cockpit-sidebar" aria-label="Project navigation">{sidebar}</aside>
    <section className="cockpit-workspace" aria-label="Novel workspace">
      <header className="cockpit-topbar" aria-label="Project controls">{topbar}</header>
      <main className="cockpit-main" aria-label="Story workspace">{children}</main>
    </section>
    <aside className="cockpit-right-panel" aria-label="Workspace assistant">{rightPanel}</aside>
  </div>
</div>
```

Task 10 removes the permanent right rail and introduces the final Echo shell API in the same change that updates `App.tsx`.

- [x] **Step 5: Update the shell test**

Assert exactly one scenic image and no rendered `.cockpit-visual-stage__midground` or `.cockpit-visual-stage__mascot`. Preserve the current semantic-region expectations until Task 10 updates App and AppShell together.

- [x] **Step 6: Run both focused tests**

Expected: background, shell, and existing App tests PASS, with no `cockpit-visual-stage__midground` in rendered markup.

---

### Task 3: Establish Echo Tokens and the Pure-White Visual Base

**Files:**
- Modify: `apps/web/src/styles/tokens.css`
- Modify: `apps/web/src/styles/global.css`
- Create: `apps/web/src/styles/echo.css`
- Create: `apps/web/src/styles/echo.test.ts`
- Modify: `apps/web/index.html`

- [x] **Step 1: Write failing source-level visual contracts**

In `echo.test.ts`, read the three CSS files from `process.cwd()` and assert:

```ts
expect(tokensCss).toContain('--echo-page: #ffffff;');
expect(tokensCss).toContain('--echo-mint-500: #09c779;');
expect(globalCss).not.toContain('body::after');
expect(echoCss).toMatch(/\.echo-hero-background__image\s*\{[^}]*opacity:\s*1;[^}]*filter:\s*none;/s);
expect(echoCss).not.toContain('mix-blend-mode');
expect(echoCss).not.toContain('backdrop-filter');
```

- [x] **Step 2: Run the CSS test and confirm red**

Expected: FAIL because Echo tokens and `echo.css` do not exist and the body texture remains.

- [x] **Step 3: Add the approved token set**

Append the exact `--echo-*` token block from the approved design Spec. Keep legacy tokens for existing fixtures until the active page is fully migrated.

- [x] **Step 4: Simplify the global page base**

Set body background to `var(--echo-page)` and remove the complete `body::after` texture rule. Keep box sizing, root sizing, screen-reader utilities, and focus-visible behavior.

- [x] **Step 5: Add the initial Echo layer CSS**

```css
.echo-page {
  position: relative;
  isolation: isolate;
  min-width: 0;
  min-height: 100svh;
  overflow-x: hidden;
  color: var(--echo-ink);
  background: var(--echo-page);
}

.echo-hero-background {
  position: absolute;
  inset: 0 auto auto 0;
  z-index: 1;
  width: 100%;
  pointer-events: none;
}

.echo-hero-background__image {
  display: block;
  width: 100%;
  height: auto;
  opacity: 1;
  filter: none;
  object-fit: contain;
  object-position: center top;
  user-select: none;
}

.echo-sidebar,
.echo-main-stage {
  position: relative;
  z-index: 20;
}
```

- [x] **Step 6: Set the document title**

Change the HTML title to `Echo — AI Writing Studio`.

- [x] **Step 7: Run CSS tests and build**

Expected: the new CSS contract passes and TypeScript/build remain green before page components import `echo.css`.

---

### Task 4: Build the Echo Sidebar, Topbar, and Hero

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/ProjectSidebar.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/ProjectSidebar.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/WorkspaceTopbar.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/WorkspaceTopbar.test.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/EchoHeroCopy.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/EchoHeroCopy.test.tsx`
- Modify: `apps/web/src/styles/echo.css`

- [x] **Step 1: Write failing user-facing tests**

Require:

```ts
expect(screen.getByRole('img', { name: 'Echo' })).toBeTruthy();
expect(screen.getByRole('button', { name: 'New Project' })).toBeTruthy();
expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-pressed', 'true');
expect(screen.getByRole('button', { name: /Eclipse of Echoes/ })).toHaveAttribute('aria-expanded', 'false');
expect(screen.getByRole('heading', { name: /Bring your story to life with AI/i })).toBeTruthy();
```

Test Project Switcher opening with click and Escape, and test both hero action callbacks.

- [x] **Step 2: Run the three component test files and confirm red**

Expected: failures for Echo branding, missing Hero component, and missing project-switcher semantics.

- [x] **Step 3: Rebuild `ProjectSidebar` with controlled navigation**

Use props:

```ts
interface ProjectSidebarProps {
  activeItem: string;
  onSelectItem: (label: string) => void;
  onNewProject: () => void;
}
```

Render an accessible Echo brand using the existing local app mark plus visible text `echo` and `AI Writing Studio`. Render reference navigation labels in this order: Home, Structure, Characters, Worldbuilding, Inspiration, AI Review, Projects. Add Settings and Theme icon buttons with accessible labels, followed by a 72% Today’s Progress card.

- [x] **Step 4: Rebuild `WorkspaceTopbar`**

Keep project data as a prop. Add local `isProjectMenuOpen` state, a button with `aria-haspopup="menu"`, `aria-expanded`, and an Escape handler. Render In Progress, target word count, search, notifications, and a local portrait-backed user menu button.

- [x] **Step 5: Implement `EchoHeroCopy`**

```tsx
interface EchoHeroCopyProps {
  onContinueWriting: () => void;
  onAIAssist: () => void;
}

export function EchoHeroCopy({ onContinueWriting, onAIAssist }: EchoHeroCopyProps) {
  return (
    <div className="echo-hero-copy">
      <h1>Bring your story<br />to life with <span>AI</span></h1>
      <p>Your intelligent writing partner that helps you craft compelling stories, one chapter at a time.</p>
      <div className="echo-hero-actions">
        <button type="button" onClick={onContinueWriting}>Continue Writing <span aria-hidden="true">→</span></button>
        <button type="button" onClick={onAIAssist}>AI Assist <span aria-hidden="true">›</span></button>
      </div>
    </div>
  );
}
```

- [x] **Step 6: Add reference-anchor styling**

At 1672px, use an approximately 230px sidebar, topbar at y 20–96, and hero copy at x 308–600/y 166–375. Use CSS grid and margins rather than scaling the entire page. The sidebar has no dark or glass surface; the active navigation item uses a mint fill and narrow status line.

- [x] **Step 7: Run component tests and keyboard checks**

Expected: all three component suites PASS; Project Switcher closes with Escape and focus remains on its trigger.

---

### Task 5: Introduce the Occluded Panel Primitive

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/components/OccludedPanel.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/OccludedPanel.test.tsx`
- Modify: `apps/web/src/styles/echo.css`
- Modify: `apps/web/src/styles/echo.test.ts`

- [x] **Step 1: Write the failing DOM-separation test**

```tsx
const { container } = render(
  <OccludedPanel className="test-panel" labelledBy="panel-title">
    <h2 id="panel-title">Panel title</h2>
    <button type="button">Action</button>
  </OccludedPanel>,
);

const panel = container.querySelector('.occluded-panel');
const surface = panel?.querySelector('.occluded-panel__surface');
const content = panel?.querySelector('.occluded-panel__content');

expect(surface).not.toContainElement(screen.getByRole('button', { name: 'Action' }));
expect(content).toContainElement(screen.getByRole('button', { name: 'Action' }));
expect(Array.from(panel?.children ?? []).map((node) => node.className)).toEqual([
  'occluded-panel__surface',
  'occluded-panel__top-cap occluded-panel__top-cap--left',
  'occluded-panel__top-cap occluded-panel__top-cap--right',
  'occluded-panel__content',
]);
```

- [x] **Step 2: Run the component test and confirm red**

Expected: module does not exist.

- [x] **Step 3: Implement the primitive**

Use a semantic `<section aria-labelledby={labelledBy}>`, render the three decorative elements with `aria-hidden="true"`, and render children only inside `.occluded-panel__content`.

- [x] **Step 4: Add the surface/cap layer CSS**

```css
.occluded-panel {
  position: relative;
  isolation: isolate;
  min-width: 0;
  background: transparent;
}

.occluded-panel__surface {
  position: absolute;
  inset: var(--occlusion-depth, 58px) 0 0;
  z-index: 10;
  border: 1px solid var(--echo-line);
  border-top: 0;
  border-radius: 0 0 var(--echo-radius-panel) var(--echo-radius-panel);
  background: var(--echo-surface);
  box-shadow: var(--echo-shadow-card);
  pointer-events: none;
}

.occluded-panel__top-cap {
  position: absolute;
  top: 0;
  z-index: 10;
  display: var(--cap-display, block);
  height: var(--occlusion-depth, 58px);
  border-top: 1px solid var(--echo-line);
  background: var(--echo-surface);
  pointer-events: none;
}

.occluded-panel__content {
  position: relative;
  z-index: 20;
}
```

Panel-specific rules control left/right cap width. Never put a mask, opacity, or filter on `.occluded-panel__content`.

- [x] **Step 5: Expand CSS contracts**

Assert the section itself has a transparent background, the surface uses a solid token and starts at `var(--occlusion-depth, 58px)`, and content is z20. Assert `opacity` is absent from panel, surface, and content rules.

- [x] **Step 6: Run the component and CSS tests**

Expected: PASS with content structurally independent from the occluded surface.

---

### Task 6: Rebuild Novel Structure Map for the Dashboard Dock

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/StructureMap.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/StructureMap.test.tsx`
- Modify: `apps/web/src/styles/echo.css`

- [x] **Step 1: Change tests to the compact reference contract**

Require the region name `Novel Structure Map`, an `OccludedPanel`, four selectable Act buttons, a `Core Conflict` marker, and SVG connector paths. Continue asserting `aria-pressed` and `onSelectAct` behavior.

- [x] **Step 2: Run the focused test and confirm red**

Expected: old `Whole novel / Structure map` markup does not satisfy the new contract.

- [x] **Step 3: Recompose the component**

Wrap content in:

```tsx
<OccludedPanel className="echo-structure-map" labelledBy="echo-structure-title">
  <header className="echo-panel-heading">
    <h2 id="echo-structure-title">Novel Structure Map</h2>
    <span className="echo-structure-marker">Core Conflict</span>
  </header>
  <div className="echo-structure-map__rail" role="region" aria-label="Novel structure acts">
    <svg className="echo-structure-map__connectors" viewBox="0 0 1000 80" aria-hidden="true">
      {acts.slice(0, -1).map((act, index) => {
        const start = ((index + 0.5) / acts.length) * 1000;
        const end = ((index + 1.5) / acts.length) * 1000;
        return <path key={act.id} d={`M ${start} 40 C ${start + 45} 20, ${end - 45} 60, ${end} 40`} />;
      })}
    </svg>
    <div className="echo-structure-map__cards">
      {acts.map((act, index) => (
        <button
          key={act.id}
          type="button"
          aria-pressed={act.id === selectedActId}
          onClick={() => onSelectAct(act.id)}
        >
          <span>{`ACT ${index + 1}`}</span>
          <strong>{act.title}</strong>
        </button>
      ))}
    </div>
  </div>
</OccludedPanel>
```

Each Act button shows reference-scale Act label, phase, percentage range, one existing local icon, and a compact metric. Preserve Act selection callbacks and scroll-into-view on keyboard focus.

- [x] **Step 4: Add panel-specific occlusion geometry**

At 1672px set Structure Map to approximately x 260–782/y 512–713. Draw only the unobstructed left cap; make the book-crossed top span empty. Keep Act cards solid white at z20.

- [x] **Step 5: Run tests**

Expected: StructureMap suite PASS and clicking ACT II changes `aria-pressed` and calls its callback.

---

### Task 7: Convert Chapter Swimlane into Chapter Timeline

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/ChapterSwimlane.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/ChapterSwimlane.test.tsx`
- Modify: `apps/web/src/styles/echo.css`

- [x] **Step 1: Write the new failing timeline tests**

Require:

- region name `Chapter Timeline`;
- a `Reorder chapters` toggle with `aria-pressed`;
- chapter buttons with preserved `aria-pressed` selection;
- a `.chapter-timeline__progress` element after `.chapter-timeline__cards` in DOM order;
- selected chapter progress node using `.is-current`;
- the add-chapter control after real chapters.

- [x] **Step 2: Run the focused test and confirm red**

Expected: old Chapter swimlane heading and missing Reorder/progress structure fail.

- [x] **Step 3: Add local reorder state and compact card markup**

Use:

```ts
const [isReordering, setIsReordering] = useState(false);
```

The Reorder button toggles `aria-pressed`. Keep actual chapter order unchanged because drag-and-drop persistence is outside this mock iteration. While active, expose a polite status message: `Reorder mode active. Drag persistence is not available in this demo.`

- [x] **Step 4: Add the progress rail after cards**

Render one node per chapter plus a connecting line. Completed/current nodes use mint; later nodes use the line token. Set `aria-label` on the progress group and keep it at least 12px below the cards.

- [x] **Step 5: Wrap in `OccludedPanel` and style geometry**

At 1672px target x 783–1330/y 512–713. Do not draw a continuous top cap through the book span. Keep the panel surface below the occlusion band, cards at z20, and progress fully above the lower solid surface.

- [x] **Step 6: Run tests**

Expected: timeline selection and reorder tests PASS; existing chapter detail selection data remains compatible.

---

### Task 8: Split the Agent Rail into AI Partner, Memory, and Details Drawer

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/components/AIWritingPartner.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/AIWritingPartner.test.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/MemoryLayer.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/MemoryLayer.test.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/AgentDetailsDrawer.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/AgentDetailsDrawer.test.tsx`
- Modify: `apps/web/src/styles/echo.css`

- [x] **Step 1: Write failing card and drawer tests**

Require `AI Writing Partner`, `Hello, I'm Echo.`, active status, task progress, and a `View All agent details` button. Require Memory Layer tags with Core Memory initially selected and a Manage button. Require the details dialog to contain Subagents, Skills, Review Checklist, and Focus Mode, close on button and Escape, and restore focus to View All.

- [x] **Step 2: Run the three test files and confirm red**

Expected: missing modules.

- [x] **Step 3: Implement the compact AI card**

Use this public interface:

```ts
interface AIWritingPartnerProps {
  project: NoveloraProject;
  onViewAll: () => void;
  viewAllButtonRef: RefObject<HTMLButtonElement | null>;
}
```

Show no more than four tasks in the first viewport. Use native `<progress>` elements and a dedicated local assistant asset; never crop the scenic page background.

- [x] **Step 4: Implement Memory Layer**

Use this public interface:

```ts
interface MemoryLayerProps {
  sources: MemorySource[];
  onManage: () => void;
}
```

Use local selected-memory state across Core Memory, World Lore, Timeline, Locations, Characters, and Clues. `Manage` invokes the callback rather than pretending to persist.

- [x] **Step 5: Implement the details drawer**

Use this public interface:

```ts
interface AgentDetailsDrawerProps {
  project: NoveloraProject;
  isOpen: boolean;
  onClose: () => void;
  invokerRef: RefObject<HTMLButtonElement | null>;
}
```

Move the existing AgentPanel sections into a dialog-backed drawer. Preserve Focus Mode local state. Use the same focus-restore pattern as `ChapterDetailDrawer`: store the invoker ref, close on Escape, and refocus after unmount.

- [x] **Step 6: Add complete solid card styling**

AI Partner and Memory are normal solid panels at z20 with full borders and radii. They do not use `OccludedPanel` and are not masked by the book.

- [x] **Step 7: Run tests**

Expected: all card and drawer tests PASS, including both close paths and focus restoration.

---

### Task 9: Recompose the Lower Functional Row

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/InspirationVault.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/InspirationVault.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/CharacterGraph.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/CharacterGraph.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/ClueAttributionFlow.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/ClueAttributionFlow.test.tsx`
- Modify: `apps/web/src/styles/echo.css`

- [x] **Step 1: Add failing lower-row contracts**

Require Inspiration Vault to show three compact entries and `View All inspiration`; Character Relationship Graph to render an SVG path per known relationship and named character nodes; Clue Attribution Flow to render source and receiver columns plus SVG paths with `data-flow-id`.

- [x] **Step 2: Run the three suites and confirm red**

Expected: old headings/layout and line-based clue stages fail new assertions.

- [x] **Step 3: Compact Inspiration Vault without losing filters**

Extend the component interface explicitly:

```ts
interface InspirationVaultProps {
  inspirations: InspirationItem[];
  onViewAll: () => void;
}
```

Keep filter and selected-item state. Show the first three filtered entries in the first viewport and expose View All through `onViewAll`. Preserve thumbnail alt behavior and `aria-pressed` selection.

- [x] **Step 4: Replace fixed line edges with reference-scale SVG paths**

For CharacterGraph, retain typed relationships and semantic list nodes. Use `<path>` with deterministic coordinates and style by relationship kind. Do not use Canvas.

- [x] **Step 5: Recompose clue flow as two columns plus Bézier SVG**

Continue filtering flows by selected chapter. Render clue sources on the left and revealed-to recipients on the right. For each visible relation render a `<path data-flow-id={flow.id}>` with low-saturation mint/cyan strokes.

- [x] **Step 6: Add lower-grid styling**

At desktop, place the three modules in the nested lower grid below y720. Use solid white panels, restrained borders, 13–18px radii, and no backdrop filter.

- [x] **Step 7: Run tests**

Expected: all three lower-module suites PASS and selected-chapter clue filtering remains intact.

---

### Task 10: Assemble Echo in `App` and Preserve Cross-Component Behavior

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/App.test.tsx`
- Modify: `apps/web/src/styles/echo.css`

- [x] **Step 1: Rewrite the App-level tests before integration**

Assert one Echo sidebar, one Hero heading, one dashboard with first-row and lower-row modules, no permanent workspace assistant rail, and no `Novelora` visible text. Retain tests for Act selection changing active chapters, chapter selection changing clue flow, inspiration filtering, and chapter drawer focus restoration. Add tests for Hero feedback and Agent drawer opening.

- [x] **Step 2: Run `App.test.tsx` and confirm red**

Expected: old composition and branding fail.

- [x] **Step 3: Assemble the new shell**

Import `./styles/echo.css` instead of `./styles/cockpit.css`. Add state for active navigation, action feedback, Agent drawer, and existing chapter drawer. Create `agentDetailsButtonRef` with `useRef<HTMLButtonElement>(null)` for drawer focus restoration. Compose:

```tsx
<AppShell
  sidebar={
    <ProjectSidebar
      activeItem={activeNavigation}
      onSelectItem={setActiveNavigation}
      onNewProject={() => setActionMessage('New project creation is not available in this demo.')}
    />
  }
  topbar={<WorkspaceTopbar project={noveloraMockProject} />}
  hero={
    <EchoHeroCopy
      onContinueWriting={() => setActionMessage('Opening the selected chapter draft.')}
      onAIAssist={() => setActionMessage('AI Assist is ready for the selected chapter.')}
    />
  }
>
  <div className="echo-dashboard__primary-row">
    <StructureMap
      acts={noveloraMockProject.acts}
      selectedActId={selectedActId}
      onSelectAct={selectAct}
    />
    <ChapterSwimlane
      chapters={activeChapters}
      selectedChapterId={selectedChapterId}
      onSelectChapter={setSelectedChapterId}
    />
    <AIWritingPartner
      project={noveloraMockProject}
      onViewAll={() => setIsAgentDrawerOpen(true)}
      viewAllButtonRef={agentDetailsButtonRef}
    />
  </div>
  <div className="echo-dashboard__lower-row">
    <InspirationVault
      inspirations={noveloraMockProject.inspirations}
      onViewAll={() => setActionMessage('The full inspiration archive is available from Inspiration.')}
    />
    <CharacterGraph
      characters={noveloraMockProject.characters}
      relationships={noveloraMockProject.characterRelationships}
    />
    <ClueAttributionFlow
      clueFlows={noveloraMockProject.clueFlows}
      chapters={noveloraMockProject.chapters}
      selectedChapterId={selectedChapterId}
    />
    <MemoryLayer
      sources={noveloraMockProject.memorySources}
      onManage={() => setIsAgentDrawerOpen(true)}
    />
  </div>
</AppShell>
```

Mount `ChapterDetailDrawer`, `AgentDetailsDrawer`, and a polite status region after the shell content so overlays are not trapped by panel isolation.

- [x] **Step 4: Add grid placement and reference anchors**

Set the dashboard start near y512 at 1672px, with the first row columns approximately 522px/547px/295px and 16px gaps after accounting for shell margins. Place Memory Layer in the right column beneath AI Partner; nest the other lower modules across the first two columns.

- [x] **Step 5: Run App and all component tests**

Expected: cross-component selection, filtering, drawers, and new Echo actions PASS.

---

### Task 11: Add Responsive and Accessibility Contracts

**Files:**
- Modify: `apps/web/src/styles/echo.css`
- Modify: `apps/web/src/styles/echo.test.ts`
- Modify component tests where focus or labels require regression coverage.

- [x] **Step 1: Add failing breakpoint and accessibility CSS tests**

Require media rules for `max-width: 1439px`, `max-width: 1279px`, `max-width: 760px`, and `prefers-reduced-motion: reduce`. Assert no page-level fixed `min-width: 1280px`, no global horizontal scroll, and internal overflow for Timeline/graphs.

- [x] **Step 2: Run CSS tests and confirm red**

Expected: missing breakpoints.

- [x] **Step 3: Implement wide and compressed desktop rules**

At 1440px and above retain three columns. At 1280–1439px reduce sidebar, gaps, hero type, and AI column width; keep the background width-proportional and do not crop the book.

- [x] **Step 4: Implement sub-1280 and mobile rules**

Below 1280px, collapse navigation to an icon rail or menu, move AI and Memory into normal grid flow, and begin panel surfaces below the scenic book instead of maintaining the full desktop cap geometry. Below 760px, stack modules and treat the scenic asset as a normal top hero image.

- [x] **Step 5: Add reduced-motion and focus safeguards**

Disable decorative transitions/animations under reduced motion. Ensure masks never clip focus rings; overlays remain z30; all internal scroll regions have keyboard focus styling.

- [x] **Step 6: Run CSS and component suites**

Expected: responsive contracts PASS without changing desktop accessibility semantics.

---

### Task 12: Perform Browser Fidelity QA and Final Verification

**Files:**
- Produce: `qa-screenshots/echo-handoff-v1/echo-1672x941.png`
- Produce: `qa-screenshots/echo-handoff-v1/echo-1440x900.png`
- Produce: `qa-screenshots/echo-handoff-v1/echo-1280x900.png`
- Produce: `qa-screenshots/echo-handoff-v1/echo-390x844.png`
- Produce: `qa-screenshots/echo-handoff-v1/echo-reference-overlay.png`
- Modify: `README.md` only if startup instructions are missing or inaccurate.

- [x] **Step 1: Start a strict local preview**

Build first, then launch Vite on a known port with `--strictPort`. Verify HTTP 200 before browser automation.

- [x] **Step 2: Capture the four required viewports**

For each viewport, record console errors, page errors, failed requests, document scroll width, client width, background image count, computed background opacity/filter, and computed panel/card opacity.

Expected desktop values:

```text
background images: 1
background opacity: 1
background filter: none
page horizontal overflow: false
functional card opacity: 1
console/page/request errors: []
```

- [x] **Step 3: Produce and inspect the 1672 × 941 overlay**

Overlay the implementation screenshot against `assets/echo-novel-agent-ui-handoff-v1/reference/final-ui-reference.png` at 50% opacity. Inspect sidebar, topbar, hero copy, dashboard y512 edge, three first-row columns, book occlusion gaps, progress rail, and lower-row start.

- [x] **Step 4: Tune only layout and component geometry**

Correct anchor offsets, cap widths, occlusion depth, spacing, radii, and shadows in `echo.css`. Do not alter, filter, duplicate, or regenerate the scenic image. Repeat screenshot comparison until the major anchors align.

- [x] **Step 5: Run complete verification**

Run in parallel where safe:

```powershell
npm.cmd run test:web
npm.cmd run lint:web
npm.cmd run build:web
git diff --check
```

Expected: all test files pass, oxlint exits 0, TypeScript/Vite build exits 0, and diff check reports no whitespace errors. Line-ending warnings may be reported but are not failures.

- [x] **Step 6: Deliver the implementation evidence**

Report the changed-file groups, preview URL, four screenshot links, automated test counts, browser error/overflow results, and only the documented asset substitutions for logo, top-right portrait, or mini assistant if they remain visibly different.
