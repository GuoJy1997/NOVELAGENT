# Immersive Cockpit Visual Stage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved C-style immersive visual stage to the Novelora cockpit using independent book, mint-flow, and mascot assets without changing existing business behavior.

**Architecture:** A new presentational `CockpitVisualStage` component renders the three decorative assets independently inside `AppShell`. CSS tokens and layer-specific styles place the flow and book beneath readable cockpit surfaces while the mascot occupies the foreground; responsive and reduced-motion rules constrain the stage without coupling it to feature components.

**Tech Stack:** React 19, TypeScript 6, CSS, Vite 8, Vitest 4, Testing Library

---

## File map

- Create `apps/web/src/assets/novelora/visual-stage/cockpit-book-hero.png` — transparent book hero asset.
- Create `apps/web/src/assets/novelora/visual-stage/cockpit-mint-flow.png` — transparent mint fluid asset.
- Create `apps/web/src/assets/novelora/visual-stage/cockpit-mascot.png` — transparent 3D mascot asset.
- Create `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.tsx` — decorative layer renderer only.
- Create `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx` — component semantics and asset separation tests.
- Modify `apps/web/src/features/novelora-cockpit/components/AppShell.tsx` — mount the stage once at shell level.
- Modify `apps/web/src/features/novelora-cockpit/components/AppShell.test.tsx` — verify shell integration without changing landmarks.
- Modify `apps/web/src/styles/tokens.css` — add visual-stage opacity, scale, offset, and timing tokens.
- Modify `apps/web/src/styles/cockpit.css` — implement layer map, surface treatment, motion, and breakpoints.
- Modify `apps/web/src/styles/global.test.ts` — lock pointer safety, responsive behavior, and reduced-motion behavior.

### Task 1: Import and validate the transparent assets

**Files:**
- Create: `apps/web/src/assets/novelora/visual-stage/cockpit-book-hero.png`
- Create: `apps/web/src/assets/novelora/visual-stage/cockpit-mint-flow.png`
- Create: `apps/web/src/assets/novelora/visual-stage/cockpit-mascot.png`

- [ ] **Step 1: Create the asset destination**

Run:

```powershell
New-Item -ItemType Directory -Force 'apps/web/src/assets/novelora/visual-stage'
```

Expected: the directory exists and no existing asset is removed.

- [ ] **Step 2: Copy the approved alpha assets under stable production names**

Run:

```powershell
Copy-Item 'D:/novelAgent/assets/generated/book-hero-alpha-v1.png' 'apps/web/src/assets/novelora/visual-stage/cockpit-book-hero.png'
Copy-Item 'D:/novelAgent/assets/generated/green-fluid-alpha-v1.png' 'apps/web/src/assets/novelora/visual-stage/cockpit-mint-flow.png'
Copy-Item 'D:/novelAgent/assets/generated/mascot-alpha-v1.png' 'apps/web/src/assets/novelora/visual-stage/cockpit-mascot.png'
```

Expected: all three files are present under `apps/web/src/assets/novelora/visual-stage`.

- [ ] **Step 3: Verify dimensions and real alpha channels**

Run:

```powershell
Add-Type -AssemblyName System.Drawing
Get-ChildItem 'apps/web/src/assets/novelora/visual-stage/*.png' | ForEach-Object {
  $image = [System.Drawing.Bitmap]::FromFile($_.FullName)
  [PSCustomObject]@{
    Name = $_.Name
    Width = $image.Width
    Height = $image.Height
    PixelFormat = $image.PixelFormat
    CornerAlpha = $image.GetPixel(0, 0).A
  }
  $image.Dispose()
}
```

Expected:

```text
cockpit-book-hero.png  1672 941  Format32bppArgb 0
cockpit-mint-flow.png  1672 941  Format32bppArgb 0
cockpit-mascot.png     1086 1448 Format32bppArgb 0
```

- [ ] **Step 4: Commit the production assets**

```powershell
git add apps/web/src/assets/novelora/visual-stage
git commit -m "assets: add immersive cockpit visual layers"
```

### Task 2: Build the isolated visual-stage component with TDD

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.tsx`

- [ ] **Step 1: Write the failing component test**

Create `CockpitVisualStage.test.tsx` with:

```tsx
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CockpitVisualStage } from './CockpitVisualStage';

describe('CockpitVisualStage', () => {
  it('renders three independent decorative assets outside the accessibility tree', () => {
    const { container } = render(<CockpitVisualStage />);
    const stage = container.querySelector('.cockpit-visual-stage');
    const images = stage?.querySelectorAll('img');

    expect(stage?.getAttribute('aria-hidden')).toBe('true');
    expect(images).toHaveLength(3);
    expect(Array.from(images ?? []).map((image) => image.getAttribute('alt'))).toEqual([
      '',
      '',
      '',
    ]);
    expect(container.querySelector('.cockpit-visual-stage__book')).toBeTruthy();
    expect(container.querySelector('.cockpit-visual-stage__flow')).toBeTruthy();
    expect(container.querySelector('.cockpit-visual-stage__mascot')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test and confirm the expected failure**

Run:

```powershell
npm --prefix apps/web run test -- --run src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx
```

Expected: FAIL because `./CockpitVisualStage` does not exist.

- [ ] **Step 3: Implement the minimal component**

Create `CockpitVisualStage.tsx` with:

```tsx
import bookHero from '../../../assets/novelora/visual-stage/cockpit-book-hero.png';
import mascot from '../../../assets/novelora/visual-stage/cockpit-mascot.png';
import mintFlow from '../../../assets/novelora/visual-stage/cockpit-mint-flow.png';

export function CockpitVisualStage() {
  return (
    <div className="cockpit-visual-stage" aria-hidden="true">
      <div className="cockpit-visual-stage__ambient" />
      <img
        className="cockpit-visual-stage__flow"
        src={mintFlow}
        alt=""
        draggable={false}
      />
      <img
        className="cockpit-visual-stage__book"
        src={bookHero}
        alt=""
        draggable={false}
      />
      <img
        className="cockpit-visual-stage__mascot"
        src={mascot}
        alt=""
        draggable={false}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the focused test**

Run:

```powershell
npm --prefix apps/web run test -- --run src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx
```

Expected: PASS with 1 test.

- [ ] **Step 5: Commit the component**

```powershell
git add apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.tsx apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx
git commit -m "feat: add cockpit visual stage component"
```

### Task 3: Mount the stage at the shell boundary with TDD

**Files:**
- Modify: `apps/web/src/features/novelora-cockpit/components/AppShell.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/AppShell.tsx`

- [ ] **Step 1: Add a failing shell integration test**

Append this test inside the existing `describe` block in `AppShell.test.tsx`:

```tsx
it('mounts one decorative visual stage without changing workspace landmarks', () => {
  const { container } = render(<App />);

  expect(container.querySelectorAll('.cockpit-visual-stage')).toHaveLength(1);
  expect(screen.getByRole('complementary', { name: 'Workspace assistant' })).toBeTruthy();
  expect(screen.getByRole('main', { name: 'Story workspace' })).toBeTruthy();
});
```

- [ ] **Step 2: Run the shell test and confirm it fails**

Run:

```powershell
npm --prefix apps/web run test -- --run src/features/novelora-cockpit/components/AppShell.test.tsx
```

Expected: FAIL because `.cockpit-visual-stage` is absent.

- [ ] **Step 3: Mount the stage in `AppShell`**

Update `AppShell.tsx` to:

```tsx
import type { ReactNode } from 'react';
import { CockpitVisualStage } from './CockpitVisualStage';

interface AppShellProps {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
  rightPanel: ReactNode;
}

export function AppShell({ sidebar, topbar, children, rightPanel }: AppShellProps) {
  return (
    <div className="cockpit-scroll">
      <div className="cockpit-shell">
        <CockpitVisualStage />
        <aside className="cockpit-sidebar" aria-label="Project navigation">
          {sidebar}
        </aside>
        <section className="cockpit-workspace" aria-label="Novel workspace">
          <header className="cockpit-topbar" aria-label="Project controls">
            {topbar}
          </header>
          <main className="cockpit-main" aria-label="Story workspace">
            {children}
          </main>
        </section>
        <aside className="cockpit-right-panel" aria-label="Workspace assistant">
          {rightPanel}
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run component and shell tests together**

Run:

```powershell
npm --prefix apps/web run test -- --run src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx src/features/novelora-cockpit/components/AppShell.test.tsx
```

Expected: PASS with all tests in both files.

- [ ] **Step 5: Commit shell integration**

```powershell
git add apps/web/src/features/novelora-cockpit/components/AppShell.tsx apps/web/src/features/novelora-cockpit/components/AppShell.test.tsx
git commit -m "feat: mount visual stage in cockpit shell"
```

### Task 4: Implement the approved C-style layer map and surface system

**Files:**
- Modify: `apps/web/src/styles/tokens.css`
- Modify: `apps/web/src/styles/global.test.ts`
- Modify: `apps/web/src/styles/cockpit.css`

- [ ] **Step 1: Add failing CSS contract tests**

Add this test inside `describe('global cockpit texture', ...)` in `global.test.ts`:

```ts
it('keeps visual-stage layers decorative, responsive, and reduced-motion safe', () => {
  expect(cockpitCss).toMatch(
    /\.cockpit-visual-stage\s*\{[^}]*pointer-events:\s*none;[^}]*overflow:\s*hidden;/s,
  );
  expect(cockpitCss).toMatch(
    /\.cockpit-visual-stage__flow\s*\{[^}]*z-index:\s*1;/s,
  );
  expect(cockpitCss).toMatch(
    /\.cockpit-visual-stage__book\s*\{[^}]*z-index:\s*2;/s,
  );
  expect(cockpitCss).toMatch(
    /\.cockpit-visual-stage__mascot\s*\{[^}]*z-index:\s*5;/s,
  );
  expect(cockpitCss).toMatch(
    /@media\s*\(max-width:\s*900px\)[\s\S]*?\.cockpit-visual-stage__book\s*\{[^}]*display:\s*none;/s,
  );
  expect(cockpitCss).toMatch(
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.cockpit-visual-stage__flow,[\s\S]*?animation:\s*none;/s,
  );
});
```

- [ ] **Step 2: Run the CSS test and confirm it fails**

Run:

```powershell
npm --prefix apps/web run test -- --run src/styles/global.test.ts
```

Expected: FAIL because the visual-stage selectors are missing.

- [ ] **Step 3: Add visual-stage tokens**

Add before the closing brace of `:root` in `tokens.css`:

```css
  --visual-stage-flow-opacity: 0.62;
  --visual-stage-book-width: clamp(430px, 34vw, 650px);
  --visual-stage-mascot-width: clamp(250px, 20vw, 380px);
  --visual-stage-enter: 620ms cubic-bezier(0.22, 1, 0.36, 1);
  --visual-stage-breathe: 10s ease-in-out infinite alternate;
```

- [ ] **Step 4: Add the visual layer styles near the shell rules in `cockpit.css`**

Add:

```css
.cockpit-shell {
  position: relative;
  isolation: isolate;
  background:
    radial-gradient(circle at 30% 88%, rgba(88, 224, 169, 0.2), transparent 30%),
    linear-gradient(135deg, rgba(255, 253, 248, 0.9), rgba(235, 248, 242, 0.82));
}

.cockpit-visual-stage {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.cockpit-visual-stage__ambient,
.cockpit-visual-stage__flow,
.cockpit-visual-stage__book,
.cockpit-visual-stage__mascot {
  position: absolute;
  user-select: none;
}

.cockpit-visual-stage__ambient {
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(circle at 22% 86%, rgba(103, 235, 181, 0.2), transparent 26%),
    radial-gradient(circle at 88% 30%, rgba(255, 255, 255, 0.86), transparent 28%);
}

.cockpit-visual-stage__flow {
  left: -7vw;
  bottom: -6vh;
  z-index: 1;
  width: clamp(1120px, 92vw, 1760px);
  max-width: none;
  opacity: var(--visual-stage-flow-opacity);
  filter: saturate(0.88);
  animation: cockpit-flow-enter var(--visual-stage-enter) both,
    cockpit-flow-breathe var(--visual-stage-breathe) 700ms;
}

.cockpit-visual-stage__book {
  left: clamp(-118px, -6vw, -62px);
  bottom: clamp(-116px, -8vh, -62px);
  z-index: 2;
  width: var(--visual-stage-book-width);
  filter: drop-shadow(0 30px 32px rgba(39, 104, 78, 0.18));
  animation: cockpit-book-enter var(--visual-stage-enter) 90ms both;
}

.cockpit-visual-stage__mascot {
  right: clamp(-52px, -2.5vw, -22px);
  bottom: clamp(-110px, -9vh, -58px);
  z-index: 5;
  width: var(--visual-stage-mascot-width);
  filter: drop-shadow(0 28px 32px rgba(38, 97, 76, 0.2));
  animation: cockpit-mascot-enter var(--visual-stage-enter) 150ms both;
}

.cockpit-sidebar,
.cockpit-workspace,
.cockpit-right-panel {
  position: relative;
  z-index: 3;
}

.cockpit-sidebar,
.cockpit-right-panel {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
}

.cockpit-workspace {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(247, 252, 249, 0.52));
  backdrop-filter: blur(6px);
}

@keyframes cockpit-flow-enter {
  from { opacity: 0; transform: translate3d(-24px, 16px, 0); }
}

@keyframes cockpit-flow-breathe {
  to { opacity: calc(var(--visual-stage-flow-opacity) - 0.08); transform: translate3d(10px, -5px, 0); }
}

@keyframes cockpit-book-enter {
  from { opacity: 0; transform: translate3d(0, 26px, 0); }
}

@keyframes cockpit-mascot-enter {
  from { opacity: 0; transform: translate3d(18px, 20px, 0) scale(0.96); }
}
```

When editing, merge the new `.cockpit-shell`, `.cockpit-sidebar`, `.cockpit-workspace`, and `.cockpit-right-panel` declarations into existing selectors instead of leaving contradictory duplicate properties.

- [ ] **Step 5: Add responsive rules inside the existing media blocks**

Inside `@media (max-width: 1180px)` add:

```css
  .cockpit-visual-stage__flow {
    left: -160px;
    width: 1280px;
    opacity: 0.48;
  }

  .cockpit-visual-stage__book {
    left: -130px;
    width: 480px;
  }

  .cockpit-visual-stage__mascot {
    right: -64px;
    width: 270px;
  }
```

Inside `@media (max-width: 900px)` add:

```css
  .cockpit-visual-stage__book {
    display: none;
  }

  .cockpit-visual-stage__flow {
    left: -380px;
    bottom: -40px;
    width: 1080px;
    opacity: 0.2;
  }

  .cockpit-visual-stage__mascot {
    right: -34px;
    bottom: -54px;
    width: 164px;
    opacity: 0.9;
  }
```

Inside the existing `@media (prefers-reduced-motion: reduce)` add before the universal rule:

```css
  .cockpit-visual-stage__flow,
  .cockpit-visual-stage__book,
  .cockpit-visual-stage__mascot {
    animation: none;
  }
```

- [ ] **Step 6: Run CSS and component tests**

Run:

```powershell
npm --prefix apps/web run test -- --run src/styles/global.test.ts src/features/novelora-cockpit/components/CockpitVisualStage.test.tsx src/features/novelora-cockpit/components/AppShell.test.tsx
```

Expected: PASS. If the CSS contract test fails because declarations were correctly merged into an existing selector, adjust only the regex to match the final valid selector; do not weaken the required property assertions.

- [ ] **Step 7: Commit the C-style visual system**

```powershell
git add apps/web/src/styles/tokens.css apps/web/src/styles/cockpit.css apps/web/src/styles/global.test.ts
git commit -m "feat: style immersive cockpit visual stage"
```

### Task 5: Visual QA, accessibility regression, and production verification

**Files:**
- Modify only if QA exposes a concrete defect: `apps/web/src/styles/cockpit.css`
- Modify only if QA exposes a concrete semantic defect: `apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.tsx`

- [ ] **Step 1: Run the complete automated verification suite**

Run:

```powershell
npm run test:web
npm run lint:web
npm run build:web
```

Expected: all Vitest tests pass, oxlint reports no errors, and Vite completes a production build.

- [ ] **Step 2: Start the app on a deterministic QA port**

Run:

```powershell
npm --prefix apps/web run dev -- --host 127.0.0.1 --port 4175
```

Expected: Vite reports `http://127.0.0.1:4175/`.

- [ ] **Step 3: Capture and inspect three viewport states**

Open `http://127.0.0.1:4175/` and capture:

```text
Desktop wide: 1728 × 1117
Desktop narrow: 1180 × 900
Mobile: 390 × 844
```

For every screenshot confirm:

```text
- no checkerboard or magenta background is visible;
- the book does not cover navigation labels;
- the mascot does not cover Agent controls;
- the flow remains behind readable surfaces;
- no new horizontal overflow is introduced beyond the existing desktop workspace policy;
- chapter selection, details drawer, focus mode, and navigation buttons still respond;
- the mobile view hides the book and keeps content usable.
```

- [ ] **Step 4: Verify reduced motion**

Emulate `prefers-reduced-motion: reduce`, reload the page, and confirm the three assets render in their final positions without looping or entrance animation.

- [ ] **Step 5: Apply only evidence-backed QA corrections**

If a screenshot exposes overlap, change the relevant custom property or breakpoint value in `cockpit.css`, then rerun:

```powershell
npm run test:web
npm run lint:web
npm run build:web
```

Expected: all three commands pass after the correction.

- [ ] **Step 6: Commit QA corrections or record a clean verification**

If files changed:

```powershell
git add apps/web/src/styles/cockpit.css apps/web/src/features/novelora-cockpit/components/CockpitVisualStage.tsx
git commit -m "fix: refine cockpit visual stage placement"
```

If no files changed, do not create an empty commit; record the passing commands and screenshot results in the implementation handoff.
