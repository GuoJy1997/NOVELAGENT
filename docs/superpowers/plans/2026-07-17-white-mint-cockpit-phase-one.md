# White Mint Cockpit Phase One Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the existing Novelora cockpit into the approved white–mint liquid-glass visual language, with a visible left-bottom book/mascot brand stage and no business-behavior changes.

**Architecture:** Keep the current React feature components and mock data intact. Centralize the visual language in `tokens.css`, restore transparent reading planes in `cockpit.css`, keep generated assets isolated in `CockpitVisualStage`, and derive the Agent portrait from the existing 3D mascot WebP rather than adding another asset.

**Tech Stack:** React 19, TypeScript 6, CSS, SVG, Vite 8, Vitest 4, Testing Library, Playwright browser QA

---

## File map

- Modify `apps/web/src/styles/tokens.css` — white–mint palette, green shadows, sans typography, visual-stage sizing.
- Modify `apps/web/src/styles/global.css` — remove the old paper/background-image language from the page canvas.
- Modify `apps/web/src/styles/global.test.ts` — semantic contracts for palette, transparent surfaces, layers, breakpoints, and reduced motion.
- Modify `apps/web/src/styles/cockpit.css` — transparent surface system, green component states, left-bottom brand stage, responsive behavior.
- Modify `apps/web/src/assets/novelora/novelora_ui_asset_pack/01_logo/novelora_logo_horizontal.svg` — green brand variant using the existing geometry.
- Modify `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.tsx` — desktop hero composition and narrow-screen resource suppression.
- Modify `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx` — stage structure and breakpoint source contracts.
- Modify `apps/web/src/features/novelora-cockpit/components/AgentPanel.tsx` — crop the 3D mascot WebP into the Lead Agent portrait.
- Modify `apps/web/src/features/novelora-cockpit/components/AgentPanel.test.tsx` — reject the retired 2D avatar and require the 3D WebP.

### Task 1: Establish the white–mint design tokens and green logo

**Files:**
- Modify: `apps/web/src/styles/tokens.css`
- Modify: `apps/web/src/styles/global.test.ts`
- Modify: `apps/web/src/assets/novelora/novelora_ui_asset_pack/01_logo/novelora_logo_horizontal.svg`
- Test: `apps/web/src/styles/global.test.ts`

- [ ] **Step 1: Write the failing palette contract test**

Add this test to `global.test.ts`:

```ts
it('defines one white-mint visual language without the retired decorative palette', () => {
  expect(tokensCss).toMatch(/--color-canvas:\s*#f7fbf9;/i);
  expect(tokensCss).toMatch(/--color-mint-primary:\s*#0aa85b;/i);
  expect(tokensCss).toMatch(/--color-mint-support:\s*#6fddb1;/i);
  expect(tokensCss).toMatch(/--color-mint-soft:\s*#ddf6ea;/i);
  expect(tokensCss).toMatch(/--color-ink:\s*#14261f;/i);
  expect(tokensCss).toMatch(/--color-text-muted:\s*#6c7d75;/i);
  expect(tokensCss).not.toMatch(/#ff6b57|#3a86ff|#8f67ff|Georgia|Times New Roman/i);
  expect(tokensCss).toMatch(/--font-display:\s*var\(--font-ui\);/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm --prefix apps/web run test -- --run src/styles/global.test.ts
```

Expected: FAIL because the old canvas, coral/blue/lilac palette, and serif display font are still present.

- [ ] **Step 3: Replace the visual tokens**

Update the relevant `:root` declarations in `tokens.css` to this contract:

```css
  --color-canvas: #f7fbf9;
  --color-surface: #ffffff;
  --color-mint-primary: #0aa85b;
  --color-mint-support: #6fddb1;
  --color-mint-soft: #ddf6ea;
  --color-mint-line: #cfe8dd;
  --color-ink: #14261f;
  --color-text-muted: #6c7d75;
  --color-state-info: #3d9d79;
  --color-state-warning: #c58b2c;
  --color-state-danger: #d95c55;

  /* Compatibility aliases while component selectors migrate. */
  --color-coral: var(--color-mint-primary);
  --color-mint: var(--color-mint-support);
  --color-sky: #42c98d;
  --color-amber: var(--color-state-warning);
  --color-lilac: #96d8b8;
  --color-line: var(--color-mint-line);
  --color-bg-base: var(--color-canvas);
  --color-bg-panel: rgba(255, 255, 255, 0.66);
  --color-bg-card: rgba(255, 255, 255, 0.82);
  --color-paper: var(--color-canvas);
  --color-accent-primary: var(--color-mint-primary);
  --color-accent-brass: var(--color-mint-support);
  --color-accent-support: var(--color-mint-support);
  --color-text-primary: var(--color-ink);
  --color-text-secondary: var(--color-text-muted);
  --color-state-done: var(--color-mint-primary);
  --color-border-soft: rgba(20, 38, 31, 0.12);

  --shadow-deep: 0 24px 80px rgba(31, 112, 79, 0.14);
  --shadow-card: 0 14px 40px rgba(31, 112, 79, 0.09);
  --shadow-float: 0 8px 24px rgba(31, 112, 79, 0.07);
  --font-ui: Inter, "Microsoft YaHei", "PingFang SC", system-ui, sans-serif;
  --font-display: var(--font-ui);
  --visual-stage-flow-opacity: 0.82;
  --visual-stage-book-width: clamp(340px, 27vw, 430px);
  --visual-stage-enter: 560ms cubic-bezier(0.22, 1, 0.36, 1);
  --visual-stage-breathe: 12s ease-in-out infinite alternate;
```

Remove the superseded duplicate warning/danger declarations later in the same root block.

- [ ] **Step 4: Recolor the existing logo SVG without changing its geometry**

In `novelora_logo_horizontal.svg`:

```xml
<linearGradient id="g" x1="0" y1="0" x2="64" y2="64">
  <stop stop-color="#0AA85B"/>
  <stop offset=".58" stop-color="#6FDDB1"/>
  <stop offset="1" stop-color="#C7F2DE"/>
</linearGradient>
```

Also change:

```xml
<rect ... fill="#F7FBF9" stroke="#CFE8DD" .../>
<circle ... fill="#F7FBF9" .../>
<text ... font-family="Inter,Arial,sans-serif" ... fill="#14261F" ...>NOVELORA</text>
<text ... fill="#0AA85B" ...>AI WRITING STUDIO</text>
```

- [ ] **Step 5: Run focused tests, asset-registry tests, lint, and build**

Run:

```powershell
npm --prefix apps/web run test -- --run src/styles/global.test.ts src/features/novelora-cockpit/assetRegistry.test.ts
npm run lint:web
npm run build:web
```

Expected: all commands pass and the production build emits the updated logo SVG URL.

- [ ] **Step 6: Commit Task 1**

```powershell
git add apps/web/src/styles/tokens.css apps/web/src/styles/global.test.ts apps/web/src/assets/novelora/novelora_ui_asset_pack/01_logo/novelora_logo_horizontal.svg
git commit -m "feat: establish white mint cockpit language"
```

### Task 2: Remove the global mask and create transparent reading planes

**Files:**
- Modify: `apps/web/src/styles/global.css`
- Modify: `apps/web/src/styles/cockpit.css`
- Modify: `apps/web/src/styles/global.test.ts`
- Test: `apps/web/src/styles/global.test.ts`

- [ ] **Step 1: Replace the old opaque-fallback test with a transparency hierarchy test**

Add a test that extracts the final rules and asserts:

```ts
it('lets the mint atmosphere pass through the shell while preserving readable cards', () => {
  expect(globalCss).not.toContain('bright_cockpit_background.png');
  expect(cockpitCss).toMatch(/\.cockpit-shell\s*\{[^}]*background:\s*transparent;/s);
  expect(cockpitCss).toMatch(/\.cockpit-workspace\s*\{[^}]*background:\s*transparent;/s);
  expect(cockpitCss).toMatch(
    /@supports[\s\S]*?\.cockpit-sidebar,\s*\.cockpit-right-panel\s*\{[^}]*rgba\(255,\s*255,\s*255,\s*0\.5[246]\)[^}]*blur\((?:18|20|22|24)px\)/s,
  );
  expect(cockpitCss).toMatch(
    /\.structure-map,\s*\.chapter-swimlane\s*\{[^}]*rgba\(255,\s*255,\s*255,\s*0\.6[0246]\)/s,
  );
});
```

Delete the prior contract that requires a `0.94/0.96` full workspace fallback; the workspace must no longer be a full-viewport reading plane.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm --prefix apps/web run test -- --run src/styles/global.test.ts
```

Expected: FAIL because `body`, `.cockpit-shell`, and `.cockpit-workspace` still render the old visual planes.

- [ ] **Step 3: Restore the page canvas in `global.css`**

Replace the body background with:

```css
body {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  background:
    radial-gradient(circle at 18% 84%, rgba(111, 221, 177, 0.26), transparent 30%),
    radial-gradient(circle at 72% 12%, rgba(221, 246, 234, 0.72), transparent 38%),
    var(--color-canvas);
  color: var(--color-text-primary);
  font-family: var(--font-ui);
}
```

Reduce `body::after` opacity to `0.018` and use green-gray texture channels instead of brown.

- [ ] **Step 4: Make shell-level surfaces transparent in `cockpit.css`**

Merge existing declarations so the final cascade contains:

```css
.cockpit-shell {
  background: transparent;
}

.cockpit-sidebar,
.cockpit-right-panel {
  background: rgba(255, 255, 255, 0.9);
}

.cockpit-workspace {
  background: transparent;
}

.cockpit-topbar {
  background: rgba(255, 255, 255, 0.54);
  backdrop-filter: blur(20px);
}

@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .cockpit-sidebar,
  .cockpit-right-panel {
    background: rgba(255, 255, 255, 0.52);
    -webkit-backdrop-filter: blur(22px);
    backdrop-filter: blur(22px);
  }
}
```

Do not add backdrop blur to `.cockpit-workspace`; it would blur the flow before individual cards render.

- [ ] **Step 5: Convert primary panels to glass and nested cards to milky white**

Use this shared surface recipe:

```css
.structure-map,
.chapter-swimlane,
.inspiration-vault,
.character-graph,
.clue-attribution-flow,
.nova-lead-card,
.agent-panel__section,
.focus-mode-toggle {
  border-color: rgba(180, 224, 205, 0.72);
  background: rgba(255, 255, 255, 0.64);
  box-shadow: 0 16px 44px rgba(31, 112, 79, 0.07);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
}

.act-card,
.chapter-card,
.chapter-add-card,
.clue-flow-card,
.character-graph__node,
.project-mini-card,
.writing-streak {
  border-color: var(--color-mint-line);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 8px 24px rgba(31, 112, 79, 0.05);
}
```

Merge these declarations with existing selectors rather than leaving later opaque overrides.

- [ ] **Step 6: Run focused and full verification**

Run:

```powershell
npm --prefix apps/web run test -- --run src/styles/global.test.ts
npm run test:web
npm run lint:web
npm run build:web
git diff --check
```

Expected: all commands pass.

- [ ] **Step 7: Commit Task 2**

```powershell
git add apps/web/src/styles/global.css apps/web/src/styles/cockpit.css apps/web/src/styles/global.test.ts
git commit -m "feat: reveal mint atmosphere through cockpit surfaces"
```

### Task 3: Migrate component states from multicolor decoration to green

**Files:**
- Modify: `apps/web/src/styles/cockpit.css`
- Modify: `apps/web/src/styles/global.test.ts`
- Test: `apps/web/src/styles/global.test.ts`

- [ ] **Step 1: Add a failing semantic-color test**

```ts
it('uses green for product interaction and reserves warm colors for semantic states', () => {
  expect(cockpitCss).toMatch(/\.project-navigation__item\.is-active\s*\{[^}]*var\(--color-mint-primary\)/s);
  expect(cockpitCss).toMatch(/\.act-card\.is-selected\s*\{[^}]*var\(--color-mint-primary\)/s);
  expect(cockpitCss).toMatch(/\.chapter-details-button\s*\{[^}]*var\(--color-mint-primary\)/s);
  expect(cockpitCss).toMatch(/\.focus-mode-toggle\.is-active\s*\{[^}]*var\(--color-mint-primary\)/s);
  expect(cockpitCss).toMatch(/\.agent-status-chip--blocked\s*\{[^}]*var\(--color-state-danger\)/s);
  expect(cockpitCss).toMatch(/\.agent-status-chip--queued\s*\{[^}]*var\(--color-state-warning\)/s);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
npm --prefix apps/web run test -- --run src/styles/global.test.ts
```

Expected: FAIL on selectors that still use coral/blue direct colors.

- [ ] **Step 3: Migrate interactive selectors**

Update the final declarations for these selectors:

```css
.project-navigation__item.is-active,
.act-card.is-selected,
.chapter-card.is-selected,
.focus-mode-toggle.is-active,
.chapter-details-button {
  border-color: var(--color-mint-primary);
  color: #087a44;
  background: color-mix(in srgb, var(--color-mint-soft) 78%, white);
  box-shadow: 0 10px 26px rgba(10, 168, 91, 0.12);
}

.memory-health-meter span,
.agent-task-progress {
  accent-color: var(--color-mint-primary);
}

.agent-status-chip--queued {
  color: #875f19;
  background: #fff3d9;
}

.agent-status-chip--running {
  color: #28765b;
  background: #def4e9;
}

.agent-status-chip--done {
  color: #087a44;
  background: var(--color-mint-soft);
}

.agent-status-chip--blocked {
  color: #a6413b;
  background: color-mix(in srgb, var(--color-state-danger) 14%, white);
}
```

Use four related greens for character graph edges and legends: `#0aa85b`, `#50bf8b`, `#86d4ad`, `#b7e7d0`. Remove direct decorative use of old blue/lilac/coral hex values.

- [ ] **Step 4: Run focused and full verification**

Run:

```powershell
npm --prefix apps/web run test -- --run src/styles/global.test.ts
npm run test:web
npm run lint:web
npm run build:web
```

Expected: all commands pass; semantic warning and danger states remain visually distinct.

- [ ] **Step 5: Commit Task 3**

```powershell
git add apps/web/src/styles/cockpit.css apps/web/src/styles/global.test.ts
git commit -m "feat: unify cockpit interaction colors in green"
```

### Task 4: Recompose the book, flow, mascot, and Agent portrait

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/AgentPanel.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/AgentPanel.test.tsx`
- Modify: `apps/web/src/styles/cockpit.css`
- Modify: `apps/web/src/styles/global.test.ts`

- [ ] **Step 1: Write failing component tests for the approved asset usage**

Add to `AgentPanel.test.tsx`:

```tsx
it('uses the three-dimensional mascot asset for the lead Agent portrait', () => {
  render(<AgentPanel project={noveloraMockProject} />);

  const portrait = screen.getByRole('img', { name: 'Nova' });
  expect(portrait.getAttribute('src')).toMatch(/cockpit-mascot.*\.webp$/);
  expect(portrait.getAttribute('src')).not.toMatch(/mascot_nova_avatar\.svg$/);
});
```

Update the mascot source test in `CockpitVisualStage.test.tsx` to expect two transparent `<source>` rules:

```tsx
expect(sources.map((source) => source.getAttribute('media'))).toEqual([
  '(max-width: 900px)',
  '(min-width: 901px) and (max-width: 1179px)',
]);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
npm --prefix apps/web run test -- --run src/features/novelora-cockpit/components/AgentPanel.test.tsx src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx
```

Expected: FAIL because the Agent card still uses the 2D avatar and the stage has only one mascot suppression source.

- [ ] **Step 3: Render the 3D Agent portrait**

Replace the `novaAvatar` import in `AgentPanel.tsx` with:

```tsx
import mascot from '../../../assets/novelora/visual-stage/cockpit-mascot.webp';
```

Replace the lead image with:

```tsx
<span className="nova-lead-card__portrait">
  <img src={mascot} alt="Nova" />
</span>
```

Style it as a deliberate crop:

```css
.nova-lead-card__portrait {
  display: grid;
  width: 76px;
  height: 76px;
  overflow: hidden;
  place-items: start center;
  border: 1px solid rgba(111, 221, 177, 0.55);
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(221, 246, 234, 0.9), rgba(255, 255, 255, 0.72));
}

.nova-lead-card__portrait img {
  width: 118px;
  height: auto;
  max-width: none;
  transform: translateY(-4px);
}
```

Update `.nova-lead-card` to use `grid-template-columns: 76px minmax(0, 1fr)`.

- [ ] **Step 4: Add both narrow-screen mascot sources**

In the mascot `<picture>` render:

```tsx
<source media="(max-width: 900px)" srcSet={transparentPixel} />
<source
  media="(min-width: 901px) and (max-width: 1179px)"
  srcSet={transparentPixel}
/>
```

- [ ] **Step 5: Recompose the desktop brand stage in CSS**

Use the following final layer geometry:

```css
.cockpit-visual-stage__book-layer {
  z-index: 2;
}

.cockpit-visual-stage__flow {
  left: -4vw;
  bottom: -4vh;
  width: clamp(1180px, 94vw, 1780px);
  opacity: var(--visual-stage-flow-opacity);
  filter: saturate(1.7) brightness(1.06) contrast(1.02);
}

.cockpit-visual-stage__book {
  left: -54px;
  bottom: -24px;
  width: var(--visual-stage-book-width);
  filter: saturate(1.25) drop-shadow(0 24px 30px rgba(20, 118, 74, 0.18));
}

.cockpit-visual-stage__mascot {
  display: block;
  left: 72px;
  right: auto;
  bottom: 18px;
  width: clamp(180px, 13vw, 220px);
  filter: drop-shadow(0 22px 28px rgba(20, 118, 74, 0.2));
}

.project-sidebar-content {
  padding-bottom: 310px;
}
```

Add a CSS-only grounding ellipse behind the mascot using `.cockpit-visual-stage__foreground::before`; keep it inside the foreground layer and `pointer-events: none`.

For `1180–1439px`, reduce book to `330px`, mascot to `150px`, left to `48px`, and sidebar bottom padding to `230px`. For `901–1179px`, hide the full mascot. For `<=900px`, hide both full book and full mascot.

- [ ] **Step 6: Update the semantic layer/breakpoint CSS tests**

Assert the book layer is `z-index: 2`, the mascot desktop rule uses `left` rather than `right`, the `901–1179px` range hides it, and the `<=900px` range keeps it hidden. Do not lock every decorative pixel value.

- [ ] **Step 7: Run component, CSS, full tests, lint, and build**

Run:

```powershell
npm --prefix apps/web run test -- --run src/features/novelora-cockpit/components/AgentPanel.test.tsx src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx src/styles/global.test.ts
npm run test:web
npm run lint:web
npm run build:web
git diff --check
```

Expected: all commands pass and the build emits only one shared mascot WebP file.

- [ ] **Step 8: Commit Task 4**

```powershell
git add apps/web/src/features/novelora-cockpit/components/AgentPanel.tsx apps/web/src/features/novelora-cockpit/components/AgentPanel.test.tsx apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.tsx apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx apps/web/src/styles/cockpit.css apps/web/src/styles/global.test.ts
git commit -m "feat: compose left brand stage with 3d mascot"
```

### Task 5: Production browser QA and evidence-based refinement

**Files:**
- Modify only if a screenshot exposes a concrete defect: `apps/web/src/styles/cockpit.css`
- Modify only if asset structure is wrong: `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.tsx`
- Modify only if portrait crop is wrong: `apps/web/src/features/novelora-cockpit/components/AgentPanel.tsx`

- [ ] **Step 1: Run fresh automated verification**

Run:

```powershell
npm run test:web
npm run lint:web
npm run build:web
git diff --check
```

Expected: 0 failures and a successful Vite production build.

- [ ] **Step 2: Start a production preview**

Run:

```powershell
npm --prefix apps/web run preview -- --host 127.0.0.1 --port 4177
```

Expected: `http://127.0.0.1:4177/` responds with HTTP 200.

- [ ] **Step 3: Capture the primary visual acceptance views**

Capture and inspect:

```text
1728 × 1117 — full desktop composition
1440 × 900  — reference-proportion desktop
1180 × 900  — compact desktop
1024 × 900  — horizontal-workspace transition
390 × 844   — mobile fallback
```

The 1728 and 1440 screenshots must prove:

```text
- the page reads as white–mint before individual text is read;
- the mint flow remains visibly present through the workspace;
- no full-screen white mask suppresses the background;
- the book and 3D mascot form one left-bottom composition;
- the mascot is approximately 180–220px on wide desktop, not a tiny corner icon;
- the Agent card uses a recognizable 3D mascot head crop;
- primary selection, progress, buttons, and relationship lines are green;
- coral, blue, lilac, and amber no longer dominate product interaction;
- text, connectors, and controls remain readable.
```

- [ ] **Step 4: Verify behavior and responsive resource use**

Using fresh browser contexts, confirm:

```text
- 1024px: full mascot hidden and not requested by the visual-stage picture; internal workspace scroll remains usable.
- 390px: full book and stage mascot hidden; the Agent portrait remains available from the shared mascot WebP.
- Drawer portal remains above all visual assets.
- Tab/Shift+Tab focus trap, Escape close, and focus return pass.
- Act/chapter selection and Focus Mode still work.
- prefers-reduced-motion sets decorative animation-name to none.
- page/console/request errors are zero.
- document root has no new horizontal overflow.
```

- [ ] **Step 5: Make only screenshot-backed corrections**

If a defect is visible, add or strengthen the nearest semantic test, make the smallest CSS/component correction, then rerun Step 1 and recapture the affected view. Do not accept a screenshot merely because bounding boxes do not overlap.

- [ ] **Step 6: Commit QA corrections only when files changed**

```powershell
git add apps/web/src/styles/cockpit.css apps/web/src/styles/global.test.ts apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.tsx apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx apps/web/src/features/novelora-cockpit/components/AgentPanel.tsx apps/web/src/features/novelora-cockpit/components/AgentPanel.test.tsx
git commit -m "fix: refine white mint cockpit composition"
```

If no source file changed, do not create an empty commit; report the fresh command output and screenshot paths in the handoff.
