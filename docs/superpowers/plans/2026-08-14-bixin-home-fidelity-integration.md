# Bixin Home Fidelity Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current scaled Echo-style home screen with a faithful, responsive Bixin home page that matches the approved 1672 × 941 reference while preserving the existing writing entry points, mock-data boundaries, and accessibility behavior.

**Architecture:** Add an isolated `BixinHomePage` composition for the dashboard route and leave the legacy `AppShell` available only for the existing writing route. Runtime images are copied from the approved handoff into `apps/web/src/assets/bixin/` and exposed through `assetRegistry.ts`; all interface content remains React DOM styled by a new `bixin-home.css` and Bixin semantic tokens. The implementation proceeds from test-locked assets and structure to card semantics, geometry, and three-viewport visual QA.

**Tech Stack:** React 19, TypeScript ~6.0, Vite 8, Vitest 4, Testing Library, jsdom, plain CSS, Lucide React 0.441.x, local fixture data, Codex in-app Browser for visual QA.

## Global Constraints

- The approved visual reference is `assets/extracted-handoff/bixin-electron-home/pack/public/assets/reference/current_ui_reference.png`, 1672 × 941, SHA-256 `75E149D2E055B3E72B073DE0FAA300D0BB873DDD69D1094439BC25A1352DF92C`.
- User-visible product identity is `笔心 / AI写作工作室`; the home route must not show Echo, Novelora, or an English product heading.
- Keep the existing React 19 and plain-CSS stack; do not migrate to Tailwind.
- Do not render the approved reference, a card screenshot, or a flattened UI screenshot as application UI.
- Do not regenerate, recolor, sharpen, or merge the canonical scene and book assets.
- The home route must not use page-level `transform: scale()`, `--echo-scale`, or letterbox offsets.
- First visual target: 1672 × 941. Also verify 1728 × 972 and 1440 × 810.
- Navigation rail target: approximately 112px. Dashboard top target: approximately y=473 at 1672 × 941.
- Scene imagery must continue behind the dashboard; there must be no white Hero/Dashboard seam.
- The book layer is non-interactive and may overlap only the non-functional upper whitespace of the character card.
- New home components use `bixin-*` classes and must not depend on `--echo-glass-*` or Echo gradient tokens.
- Preserve the existing `WritingView`, mock-only behavior, `role="status"` live region, and navigation/CTA accessibility semantics.
- Preserve unrelated dirty-worktree changes. Before every commit, inspect `git status --short`, stage only the exact files listed by that task, and never use reset or checkout to discard user work.
- Tests must run from `apps/web` through the root scripts or an explicit `npm --prefix apps/web` command because CSS tests depend on `process.cwd()`.

---

## File Structure

### New runtime files

- `apps/web/src/assets/bixin/bixin-app-icon.png` — Bixin application mark used inside the React UI.
- `apps/web/src/assets/bixin/scene-robot-background.png` — canonical full-stage scene and robot.
- `apps/web/src/assets/bixin/book-foreground.svg` — canonical transparent book, map, bookmark, and tassel.
- `apps/web/src/assets/bixin/project-cover.png` — project card cover.
- `apps/web/public/bixin-app-icon.png` — browser favicon copy of the canonical app icon.
- `apps/web/src/features/novelora-cockpit/components/home/BixinHomePage.tsx` — home-route composition and layer order.
- `apps/web/src/features/novelora-cockpit/components/home/BixinHomePage.test.tsx` — home structure, copy, and layer tests.
- `apps/web/src/features/novelora-cockpit/components/home/NavigationRail.tsx` — Bixin navigation and user footer.
- `apps/web/src/features/novelora-cockpit/components/home/BrandHeader.tsx` — Bixin wordmark block.
- `apps/web/src/features/novelora-cockpit/components/home/HomeTopbar.tsx` — search, notification, and help controls.
- `apps/web/src/features/novelora-cockpit/components/home/HomeTopbar.test.tsx` — search shortcut and action semantics.
- `apps/web/src/features/novelora-cockpit/components/home/HeroSection.tsx` — Chinese Hero copy and primary actions.
- `apps/web/src/features/novelora-cockpit/components/home/SceneLayer.tsx` — decorative canonical scene.
- `apps/web/src/features/novelora-cockpit/components/home/BookForeground.tsx` — decorative canonical book foreground.
- `apps/web/src/features/novelora-cockpit/components/home/cards/ProjectOverviewCard.tsx` — dominant two-row project card.
- `apps/web/src/features/novelora-cockpit/components/home/cards/ChapterProgressCard.tsx` — chapter stages and overall progress.
- `apps/web/src/features/novelora-cockpit/components/home/cards/CharacterNetworkCard.tsx` — portraits, relationship lines, and legend.
- `apps/web/src/features/novelora-cockpit/components/home/cards/WritingGoalsCard.tsx` — monthly goal ring and progress bars.
- `apps/web/src/features/novelora-cockpit/components/home/cards/SceneScheduleCard.tsx` — scene schedule list.
- `apps/web/src/features/novelora-cockpit/components/home/cards/CalendarCard.tsx` — May 2024 calendar.
- `apps/web/src/features/novelora-cockpit/components/home/ui/BixinProgressRing.tsx` — home-scoped accessible progress-ring primitive.
- `apps/web/src/features/novelora-cockpit/data/bixinHome.ts` — typed Chinese navigation and dashboard fixture.
- `apps/web/src/features/novelora-cockpit/data/bixinHome.test.ts` — fixture integrity and portrait-key tests.
- `apps/web/src/styles/bixin-home.css` — all Bixin home geometry, component styling, motion, and desktop adaptation.
- `apps/web/src/styles/bixin-home.test.ts` — source-level home CSS contracts.
- `qa-screenshots/bixin-home/reference-1672x941.png` — stable approved reference used only for QA.

### Existing files modified

- `apps/web/package.json` and `apps/web/package-lock.json` — add `lucide-react@^0.441.0` only if absent.
- `apps/web/src/features/novelora-cockpit/assetRegistry.ts` — add typed `bixinAssets` exports.
- `apps/web/src/features/novelora-cockpit/assetRegistry.test.ts` — lock asset readability and canonical hashes.
- `apps/web/src/features/novelora-cockpit/components/home/HomeDashboard.tsx` — become the Bixin grid composition.
- `apps/web/src/features/novelora-cockpit/components/home/HomeDashboard.test.tsx` — Chinese card semantics and callbacks.
- `apps/web/src/App.tsx` — select the isolated home route or the preserved writing route.
- `apps/web/src/App.test.tsx` — update home copy, interaction, and route assertions.
- `apps/web/src/styles/tokens.css` — add Bixin semantic design tokens without removing legacy Echo tokens.
- `apps/web/src/styles/global.css` — import `bixin-home.css` and use a neutral desktop canvas.
- `apps/web/src/styles/echo.test.ts` — update the browser-title assertion only; retain legacy writing-shell contracts.
- `apps/web/index.html` — set `lang="zh-CN"`, Bixin favicon, and Bixin title.

---

### Task 1: Lock the canonical Bixin assets

**Files:**
- Create: `apps/web/src/assets/bixin/bixin-app-icon.png`
- Create: `apps/web/src/assets/bixin/scene-robot-background.png`
- Create: `apps/web/src/assets/bixin/book-foreground.svg`
- Create: `apps/web/src/assets/bixin/project-cover.png`
- Create: `apps/web/public/bixin-app-icon.png`
- Create: `qa-screenshots/bixin-home/reference-1672x941.png`
- Modify: `apps/web/src/features/novelora-cockpit/assetRegistry.ts:25-50`
- Modify: `apps/web/src/features/novelora-cockpit/assetRegistry.test.ts:1-250`

**Interfaces:**
- Consumes: canonical files under `assets/extracted-handoff/bixin-electron-home/pack/public/assets/`.
- Produces: `bixinAssets: { appIcon: string; scene: string; book: string; projectCover: string }` and a stable non-runtime QA reference.

- [ ] **Step 1: Add the failing registry and hash test**

Extend the registry imports and add this contract to `assetRegistry.test.ts`:

```ts
import { bixinAssets } from './assetRegistry';

it('registers the canonical Bixin home assets without modifying their bytes', () => {
  const expected = [
    [bixinAssets.appIcon, '0354e7b870a8e0f235260e6bf51f81269d00767590bb2c057f4191af1e637c3c'],
    [bixinAssets.scene, '26104c9990470a7a8c8b9a3453526cbe8318505134d3a56ae97615b763a9d4d4'],
    [bixinAssets.book, '459f00a4dc1ec3c3bcaad0ceb535464d5889a7e6a120ae6a55466c072687fb9f'],
    [bixinAssets.projectCover, '71ae243bf47e766703787c5c88bc6c2082c30dfb3e50aff37bfc8303afa5d09d'],
  ] as const;

  expected.forEach(([asset, hash]) => {
    const contents = readResolvedAsset(asset);
    expect(contents.byteLength).toBeGreaterThan(0);
    expect(createHash('sha256').update(contents).digest('hex')).toBe(hash);
  });

  const reference = readFileSync(
    resolve(process.cwd(), '../../qa-screenshots/bixin-home/reference-1672x941.png'),
  );
  expect(createHash('sha256').update(reference).digest('hex')).toBe(
    '75e149d2e055b3e72b073de0faa300d0bb873ddd69d1094439bc25a1352df92c',
  );
});
```

- [ ] **Step 2: Run the focused test and confirm the contract fails**

Run:

```powershell
npm --prefix apps/web run test -- --run src/features/novelora-cockpit/assetRegistry.test.ts
```

Expected: FAIL because `bixinAssets` and the copied files do not exist.

- [ ] **Step 3: Copy the canonical files without editing them**

Run from the repository root:

```powershell
New-Item -ItemType Directory -Force 'apps/web/src/assets/bixin' | Out-Null
New-Item -ItemType Directory -Force 'qa-screenshots/bixin-home' | Out-Null
Copy-Item -LiteralPath 'assets/extracted-handoff/bixin-electron-home/pack/public/assets/brand/bixin_app_icon.png' -Destination 'apps/web/src/assets/bixin/bixin-app-icon.png'
Copy-Item -LiteralPath 'assets/extracted-handoff/bixin-electron-home/pack/public/assets/brand/bixin_app_icon.png' -Destination 'apps/web/public/bixin-app-icon.png'
Copy-Item -LiteralPath 'assets/extracted-handoff/bixin-electron-home/pack/public/assets/layers/scene_robot_background.png' -Destination 'apps/web/src/assets/bixin/scene-robot-background.png'
Copy-Item -LiteralPath 'assets/extracted-handoff/bixin-electron-home/pack/public/assets/layers/book_foreground.svg' -Destination 'apps/web/src/assets/bixin/book-foreground.svg'
Copy-Item -LiteralPath 'assets/extracted-handoff/bixin-electron-home/pack/public/assets/covers/project-cover.png' -Destination 'apps/web/src/assets/bixin/project-cover.png'
Copy-Item -LiteralPath 'assets/extracted-handoff/bixin-electron-home/pack/public/assets/reference/current_ui_reference.png' -Destination 'qa-screenshots/bixin-home/reference-1672x941.png'
```

- [ ] **Step 4: Export the new typed asset group**

Add to `assetRegistry.ts` without removing legacy exports:

```ts
export const bixinAssets = {
  appIcon: new URL('../../assets/bixin/bixin-app-icon.png', import.meta.url).href,
  scene: new URL('../../assets/bixin/scene-robot-background.png', import.meta.url).href,
  book: new URL('../../assets/bixin/book-foreground.svg', import.meta.url).href,
  projectCover: new URL('../../assets/bixin/project-cover.png', import.meta.url).href,
} as const;
```

- [ ] **Step 5: Run the focused asset test**

Run the command from Step 2.

Expected: PASS, including all four runtime hashes and the approved reference hash.

- [ ] **Step 6: Commit only the asset task**

```powershell
git status --short
git add -- apps/web/src/assets/bixin apps/web/public/bixin-app-icon.png qa-screenshots/bixin-home/reference-1672x941.png apps/web/src/features/novelora-cockpit/assetRegistry.ts apps/web/src/features/novelora-cockpit/assetRegistry.test.ts
git commit -m "feat: register canonical bixin home assets"
```

---

### Task 2: Create the isolated Bixin home composition

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/components/home/BixinHomePage.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/home/BixinHomePage.test.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/home/NavigationRail.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/home/BrandHeader.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/home/HomeTopbar.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/home/HeroSection.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/home/SceneLayer.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/home/BookForeground.tsx`
- Modify: `apps/web/package.json`
- Modify: `apps/web/package-lock.json`

**Interfaces:**
- Consumes: `bixinAssets`, existing `HomeDashboard`, and callback props from `App`.
- Produces: `BixinNavigationId`, `BixinHomePageProps`, and the complete semantic layer order for the home route.

```ts
export type BixinNavigationId =
  | 'home'
  | 'projects'
  | 'outline'
  | 'characters'
  | 'statistics'
  | 'worldbuilding';

export interface BixinHomePageProps {
  activeNavigation: BixinNavigationId;
  onSelectNavigation: (item: BixinNavigationId) => void;
  onContinueWriting: () => void;
  onNewProject: () => void;
  onOpenProject: () => void;
  onAddSchedule: () => void;
  onShowMessage: (message: string) => void;
}
```

- [ ] **Step 1: Write failing structural tests**

Create `BixinHomePage.test.tsx` with the following core assertions:

```tsx
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BixinHomePage } from './BixinHomePage';

const handlers = {
  activeNavigation: 'home' as const,
  onSelectNavigation: vi.fn(),
  onContinueWriting: vi.fn(),
  onNewProject: vi.fn(),
  onOpenProject: vi.fn(),
  onAddSchedule: vi.fn(),
  onShowMessage: vi.fn(),
};

it('renders the canonical scene, semantic interface, and book in that order', () => {
  const { container } = render(<BixinHomePage {...handlers} />);
  const page = container.querySelector('.bixin-home__frame');

  expect(page?.children[0]).toHaveClass('bixin-scene-layer');
  expect(page?.children[1]).toHaveClass('bixin-home__interface');
  expect(page?.children[2]).toHaveClass('bixin-book-layer');
  expect(container.querySelectorAll('img[src*="scene-robot-background"]')).toHaveLength(1);
  expect(container.querySelectorAll('img[src*="book-foreground"]')).toHaveLength(1);
});

it('uses the Bixin identity and exact Chinese navigation order', () => {
  render(<BixinHomePage {...handlers} />);
  expect(screen.getByText('笔心')).toBeVisible();
  expect(screen.getByText('AI写作工作室')).toBeVisible();
  expect(screen.getByRole('heading', { name: '写出让世界铭记的故事' })).toBeVisible();

  const navigation = screen.getByRole('navigation', { name: '工作区导航' });
  expect(within(navigation).getAllByRole('button').map((button) => button.textContent)).toEqual([
    '首页', '项目', '大纲', '人物', '统计', '世界观',
  ]);
  expect(screen.queryByText(/Echo|Novelora|Bring your story/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the new test and verify it fails**

```powershell
npm --prefix apps/web run test -- --run src/features/novelora-cockpit/components/home/BixinHomePage.test.tsx
```

Expected: FAIL because `BixinHomePage` and its leaf components are missing.

- [ ] **Step 3: Add the single icon dependency**

First inspect the existing manifest diff, then install only the approved dependency:

```powershell
git diff -- apps/web/package.json apps/web/package-lock.json
npm --prefix apps/web install lucide-react@^0.441.0
```

Expected: `lucide-react` is present in `dependencies`; existing unrelated manifest edits remain intact.

- [ ] **Step 4: Implement the scene and book leaf components**

```tsx
import { bixinAssets } from '../../assetRegistry';

export function SceneLayer() {
  return (
    <div className="bixin-scene-layer" aria-hidden="true">
      <img src={bixinAssets.scene} alt="" draggable={false} fetchPriority="high" />
    </div>
  );
}

export function BookForeground() {
  return (
    <div className="bixin-book-layer" aria-hidden="true">
      <img src={bixinAssets.book} alt="" draggable={false} />
    </div>
  );
}
```

- [ ] **Step 5: Implement the navigation, brand, topbar, and Hero components**

Use only Lucide icons and these exact visible labels:

```tsx
const navigationItems = [
  { id: 'home', label: '首页', icon: House },
  { id: 'projects', label: '项目', icon: FileText },
  { id: 'outline', label: '大纲', icon: Columns2 },
  { id: 'characters', label: '人物', icon: UserRound },
  { id: 'statistics', label: '统计', icon: ChartNoAxesCombined },
  { id: 'worldbuilding', label: '世界观', icon: Globe2 },
] as const;
```

`BrandHeader` renders the canonical icon, `笔心`, and `AI写作工作室`. `HomeTopbar` renders a search input labelled `搜索项目`, a `查看通知` button, and a `打开帮助` button. `HeroSection` renders badge `AI 更懂你的创作`, the accessible heading `写出让世界铭记的故事`, description `构思想迷宫，毫不遗漏的\n与笔心AI一起开启你的创作之旅。`, and buttons `继续写作` and `新建项目`.

- [ ] **Step 6: Compose `BixinHomePage`**

```tsx
export function BixinHomePage(props: BixinHomePageProps) {
  return (
    <div className="bixin-home">
      <div className="bixin-home__frame">
        <SceneLayer />
        <div className="bixin-home__interface">
          <NavigationRail
            activeItem={props.activeNavigation}
            onSelectItem={props.onSelectNavigation}
          />
          <div className="bixin-home__stage">
            <BrandHeader />
            <HomeTopbar onShowMessage={props.onShowMessage} />
            <HeroSection
              onContinueWriting={props.onContinueWriting}
              onNewProject={props.onNewProject}
            />
            <main className="bixin-home__dashboard" aria-label="创作首页">
              <HomeDashboard
                onOpenProject={props.onOpenProject}
                onAddSchedule={props.onAddSchedule}
              />
            </main>
          </div>
        </div>
        <BookForeground />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Run the structural tests**

Run the command from Step 2.

Expected: PASS. Styling is intentionally deferred; semantic structure and layer order are now locked.

- [ ] **Step 8: Commit the isolated page composition**

```powershell
git status --short
git add -- apps/web/package.json apps/web/package-lock.json apps/web/src/features/novelora-cockpit/components/home/BixinHomePage.tsx apps/web/src/features/novelora-cockpit/components/home/BixinHomePage.test.tsx apps/web/src/features/novelora-cockpit/components/home/NavigationRail.tsx apps/web/src/features/novelora-cockpit/components/home/BrandHeader.tsx apps/web/src/features/novelora-cockpit/components/home/HomeTopbar.tsx apps/web/src/features/novelora-cockpit/components/home/HeroSection.tsx apps/web/src/features/novelora-cockpit/components/home/SceneLayer.tsx apps/web/src/features/novelora-cockpit/components/home/BookForeground.tsx
git commit -m "feat: add isolated bixin home composition"
```

---

### Task 3: Route the application through the Bixin home page

**Files:**
- Modify: `apps/web/src/App.tsx:1-95`
- Modify: `apps/web/src/App.test.tsx:1-130`
- Modify: `apps/web/index.html:2-8`
- Modify: `apps/web/src/styles/echo.test.ts:1207-1209`

**Interfaces:**
- Consumes: `BixinHomePageProps`, existing `WritingView`, existing `AppShell` only for the writing route.
- Produces: home/writing route selection, Chinese demo feedback, and Bixin browser metadata.

- [ ] **Step 1: Replace the old App expectations with failing Bixin route tests**

Update the first App tests to assert the new route:

```tsx
it('renders Bixin home without the scaled Echo shell', () => {
  const { container } = render(<App />);
  expect(container.querySelector('.bixin-home')).toBeInTheDocument();
  expect(container.querySelector('.echo-scale-viewport')).not.toBeInTheDocument();
  expect(screen.getByText('笔心')).toBeVisible();
  expect(screen.getByRole('main', { name: '创作首页' })).toBeVisible();
  expect(screen.queryByText(/Echo|Bring your story/i)).not.toBeInTheDocument();
});

it('keeps Chinese navigation controlled by aria-pressed', async () => {
  const user = userEvent.setup();
  render(<App />);
  const navigation = screen.getByRole('navigation', { name: '工作区导航' });
  const home = within(navigation).getByRole('button', { name: '首页' });
  const outline = within(navigation).getByRole('button', { name: '大纲' });
  expect(home).toHaveAttribute('aria-pressed', 'true');
  await user.click(outline);
  expect(home).toHaveAttribute('aria-pressed', 'false');
  expect(outline).toHaveAttribute('aria-pressed', 'true');
});
```

Update action assertions to the exact Chinese messages:

```ts
'新建项目功能暂未在演示版开放。'
'演示版暂不支持编辑场景日程。'
'通知中心暂未在演示版开放。'
'帮助中心暂未在演示版开放。'
```

Retain the existing 3200ms dismissal test and the two writing-entry tests, changing only button labels to `继续写作`, `打开项目`, and `返回首页` where needed.

- [ ] **Step 2: Run App tests and verify they fail against the Echo route**

```powershell
npm --prefix apps/web run test -- --run src/App.test.tsx
```

Expected: FAIL because App still renders `AppShell` on the dashboard route and exposes English copy.

- [ ] **Step 3: Make `App` choose the isolated home or preserved writing route**

Implement the route boundary without deleting legacy writing-shell imports:

```tsx
const [activeNavigation, setActiveNavigation] = useState<BixinNavigationId>('home');

const feedback = (
  <div
    className={`echo-action-feedback${actionMessage ? ' is-visible' : ''}`}
    role="status"
    aria-live="polite"
  >
    {actionMessage}
  </div>
);

if (view === 'writing') {
  return (
    <>
      <AppShell
        sidebar={<ProjectSidebar />}
        topbar={<WorkspaceTopbar project={noveloraMockProject} />}
        hero={null}
      >
        <WritingView
          projectId="default-project"
          chapterNum={writingChapterNum}
          onSelectChapter={setWritingChapterNum}
          onBack={() => setView('dashboard')}
        />
      </AppShell>
      {feedback}
    </>
  );
}

return (
  <>
    <BixinHomePage
      activeNavigation={activeNavigation}
      onSelectNavigation={setActiveNavigation}
      onContinueWriting={() => openWriting(currentChapterIndex + 1)}
      onOpenProject={() => openWriting(currentChapterIndex + 1)}
      onNewProject={() => setActionMessage('新建项目功能暂未在演示版开放。')}
      onAddSchedule={() => setActionMessage('演示版暂不支持编辑场景日程。')}
      onShowMessage={setActionMessage}
    />
    {feedback}
  </>
);
```

If the current `WritingView` back button still says `Back to dashboard`, preserve that accessible name for the writing-route test; changing writing-workspace copy is outside this plan.

- [ ] **Step 4: Update browser metadata and its test**

Set:

```html
<html lang="zh-CN">
<link rel="icon" type="image/png" href="/bixin-app-icon.png" />
<title>笔心 — AI写作工作室</title>
```

Change only the title assertion in `echo.test.ts`:

```ts
it('uses the Bixin product title', () => {
  expect(indexHtml).toContain('<title>笔心 — AI写作工作室</title>');
});
```

- [ ] **Step 5: Run the route and metadata tests**

```powershell
npm --prefix apps/web run test -- --run src/App.test.tsx src/styles/echo.test.ts
```

Expected: PASS. The home route no longer mounts `.echo-scale-viewport`; the writing route still opens and returns.

- [ ] **Step 6: Commit the route integration**

```powershell
git status --short
git add -- apps/web/src/App.tsx apps/web/src/App.test.tsx apps/web/index.html apps/web/src/styles/echo.test.ts
git commit -m "feat: route dashboard through bixin home"
```

---

### Task 4: Replace the dashboard with typed Chinese Bixin cards

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/data/bixinHome.ts`
- Create: `apps/web/src/features/novelora-cockpit/data/bixinHome.test.ts`
- Create: `apps/web/src/features/novelora-cockpit/components/home/cards/ProjectOverviewCard.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/home/cards/ChapterProgressCard.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/home/cards/CharacterNetworkCard.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/home/cards/WritingGoalsCard.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/home/cards/SceneScheduleCard.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/home/cards/CalendarCard.tsx`
- Create: `apps/web/src/features/novelora-cockpit/components/home/ui/BixinProgressRing.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/home/HomeDashboard.tsx:1-180`
- Modify: `apps/web/src/features/novelora-cockpit/components/home/HomeDashboard.test.tsx:1-70`

**Interfaces:**
- Consumes: `bixinAssets.projectCover`, `characterPortraits`, Lucide icons, `onOpenProject`, and `onAddSchedule`.
- Produces: `bixinHomeData` and six independent `section` components with Chinese accessible names.

- [ ] **Step 1: Write the failing fixture-integrity test**

```ts
import { describe, expect, it } from 'vitest';
import { characterPortraits } from '../assetRegistry';
import { bixinHomeData } from './bixinHome';

describe('bixinHomeData', () => {
  it('keeps the approved dashboard count and valid portrait keys', () => {
    expect(bixinHomeData.chapterStages).toHaveLength(5);
    expect(bixinHomeData.project.metrics).toHaveLength(4);
    expect(bixinHomeData.characters.nodes).toHaveLength(5);
    expect(bixinHomeData.schedule).toHaveLength(3);

    const portraitKeys = new Set(Object.keys(characterPortraits));
    const characters = [bixinHomeData.characters.center, ...bixinHomeData.characters.nodes];
    expect(characters.every((character) => portraitKeys.has(character.portraitAssetKey))).toBe(true);
  });
});
```

- [ ] **Step 2: Rewrite the dashboard test to the approved Chinese card contract**

```tsx
it('renders six Bixin cards in the approved grid slots', () => {
  const { container } = render(
    <HomeDashboard onOpenProject={() => undefined} onAddSchedule={() => undefined} />,
  );

  const grid = container.querySelector('.bixin-dashboard');
  expect(grid?.children).toHaveLength(5);
  expect(grid?.children[0]).toHaveAttribute('data-grid-slot', 'project');
  expect(grid?.children[1]).toHaveAttribute('data-grid-slot', 'chapters');
  expect(grid?.children[2]).toHaveAttribute('data-grid-slot', 'characters');
  expect(grid?.children[3]).toHaveAttribute('data-grid-slot', 'goals');
  expect(grid?.children[4]).toHaveAttribute('data-grid-slot', 'schedule-calendar');

  for (const name of ['我的项目', '章节奋斗', '人物关系网', '写作目标', '世界观与场景日程', '2024年5月']) {
    expect(screen.getByRole('region', { name })).toBeVisible();
  }
  expect(screen.getByText('天空之冠')).toBeVisible();
});
```

Retain callback and `aria-current="date"` tests, changing button labels to `打开项目` and `添加条目`.

- [ ] **Step 3: Run both focused tests and verify they fail**

```powershell
npm --prefix apps/web run test -- --run src/features/novelora-cockpit/data/bixinHome.test.ts src/features/novelora-cockpit/components/home/HomeDashboard.test.tsx
```

Expected: FAIL because the fixture, Chinese card components, and `bixin-*` grid classes are missing.

- [ ] **Step 4: Create the typed fixture**

Use type imports and valid registry keys:

```ts
import type { characterPortraits } from '../assetRegistry';

type PortraitAssetKey = keyof typeof characterPortraits;

interface HomeCharacter {
  name: string;
  role: string;
  portraitAssetKey: PortraitAssetKey;
  relation: 'ally' | 'conflict' | 'mentor' | 'love' | 'unknown';
  x: number;
  y: number;
}

export const bixinHomeData = {
  project: {
    title: '天空之冠',
    status: '进行中',
    description: '天空岛上浮现远古王国的版图，面对尘封的秘密与命运的抉择。',
    metrics: [
      { label: '字数', value: '278K' },
      { label: '章节', value: '42' },
      { label: '世界观', value: '12' },
      { label: '完成度', value: '96%' },
    ],
  },
  chapterStages: [
    { label: '灵感', value: 24 },
    { label: '大纲', value: 18 },
    { label: '草稿', value: 12 },
    { label: '修订', value: 6 },
    { label: '已发布', value: 3, active: true },
  ],
  writingGoals: {
    progress: 72,
    items: [
      { label: '本月字数目标', current: '60,200', total: '90,000', percent: 67 },
      { label: '章节目标', current: '20', total: '30', percent: 67 },
      { label: '修订目标', current: '15', total: '20', percent: 75 },
    ],
  },
  characters: {
    center: { name: '艾琳', role: '女王', portraitAssetKey: 'liora' as const },
    nodes: [
      { name: '霍欧', role: '战士', portraitAssetKey: 'arden', relation: 'ally', x: 18, y: 24 },
      { name: '达洪', role: '学者', portraitAssetKey: 'kael', relation: 'mentor', x: 18, y: 68 },
      { name: '盟友', role: '部德', portraitAssetKey: 'selene', relation: 'love', x: 48, y: 84 },
      { name: '影树', role: '导师', portraitAssetKey: 'vex', relation: 'ally', x: 82, y: 24 },
      { name: '格雷司', role: '帝国', portraitAssetKey: 'theOrder', relation: 'conflict', x: 82, y: 68 },
    ] satisfies HomeCharacter[],
  },
  schedule: [
    { title: '次元洞窟', subtitle: '黑暗回廊', badge: '场景已完成' },
    { title: '永恒森林', subtitle: '猩红映照', badge: '场景进行中' },
    { title: '破碎群岛', subtitle: '秘密居所', badge: '场景进行中' },
  ],
  calendar: {
    label: '2024年5月',
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    days: [27, 28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7],
    active: 17,
  },
} as const;
```

Confirm the actual registry key for the group portrait before using `theOrder`; if the key is not exported, add it to `characterPortraits` and its asset test in this task.

- [ ] **Step 5: Implement the progress ring and six focused card components**

The progress primitive must expose a text alternative:

```tsx
interface BixinProgressRingProps {
  value: number;
  label: string;
}

export function BixinProgressRing({ value, label }: BixinProgressRingProps) {
  return (
    <div
      className="bixin-progress-ring"
      role="img"
      aria-label={`${label} ${value}%`}
      style={{ '--bixin-progress': `${value * 3.6}deg` } as React.CSSProperties}
    >
      <span><strong>{value}%</strong><small>{label}</small></span>
    </div>
  );
}
```

Each card must be a named `<section>` with a `bixin-card` base class and a dedicated modifier. `CharacterNetworkCard` resolves every portrait through `characterPortraits[key]`, assigns relationship-specific line classes, and gives informative portraits `alt={character.name}`. Decorative module icons use `aria-hidden="true"`.

- [ ] **Step 6: Rewrite `HomeDashboard` as a pure grid composition**

```tsx
export function HomeDashboard({ onOpenProject, onAddSchedule }: HomeDashboardProps) {
  return (
    <div className="bixin-dashboard">
      <ProjectOverviewCard data-grid-slot="project" onOpenProject={onOpenProject} />
      <ChapterProgressCard data-grid-slot="chapters" />
      <CharacterNetworkCard data-grid-slot="characters" />
      <WritingGoalsCard data-grid-slot="goals" />
      <div className="bixin-dashboard__pair" data-grid-slot="schedule-calendar">
        <SceneScheduleCard onAddSchedule={onAddSchedule} />
        <CalendarCard />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Run the data and dashboard tests**

Run the command from Step 3.

Expected: PASS. No home component renders an `.echo-home-*` class or a letter avatar.

- [ ] **Step 8: Commit the dashboard refactor**

```powershell
git status --short
git add -- apps/web/src/features/novelora-cockpit/data/bixinHome.ts apps/web/src/features/novelora-cockpit/data/bixinHome.test.ts apps/web/src/features/novelora-cockpit/components/home/HomeDashboard.tsx apps/web/src/features/novelora-cockpit/components/home/HomeDashboard.test.tsx apps/web/src/features/novelora-cockpit/components/home/cards apps/web/src/features/novelora-cockpit/components/home/ui/BixinProgressRing.tsx apps/web/src/features/novelora-cockpit/assetRegistry.ts apps/web/src/features/novelora-cockpit/assetRegistry.test.ts
git commit -m "feat: build bixin home dashboard cards"
```

---

### Task 5: Establish Bixin tokens, geometry, and CSS contracts

**Files:**
- Create: `apps/web/src/styles/bixin-home.css`
- Create: `apps/web/src/styles/bixin-home.test.ts`
- Modify: `apps/web/src/styles/tokens.css:70-110`
- Modify: `apps/web/src/styles/global.css:1-25`

**Interfaces:**
- Consumes: all `bixin-*` classes created in Tasks 2 and 4.
- Produces: reference-aligned 1672 × 941 geometry, semantic material tokens, 1440 × 810 adaptation, and reduced-motion behavior.

- [ ] **Step 1: Write the failing CSS source contract**

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const homeCss = readFileSync(resolve(process.cwd(), 'src/styles/bixin-home.css'), 'utf8');
const globalCss = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');
const tokensCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');

describe('Bixin home CSS contract', () => {
  it('uses an unscaled full-window desktop frame', () => {
    expect(homeCss).toMatch(/\.bixin-home\s*\{[^}]*min-height:\s*100dvh;/s);
    expect(homeCss).toMatch(/\.bixin-home__frame\s*\{[^}]*border-radius:\s*var\(--bixin-radius-frame\);/s);
    expect(homeCss).not.toMatch(/transform:\s*scale\(/);
    expect(homeCss).not.toContain('--echo-scale');
  });

  it('locks the scene, interface, and book layers', () => {
    expect(homeCss).toMatch(/\.bixin-scene-layer\s*\{[^}]*inset:\s*0;[^}]*z-index:\s*10;/s);
    expect(homeCss).toMatch(/\.bixin-home__interface\s*\{[^}]*z-index:\s*20;/s);
    expect(homeCss).toMatch(/\.bixin-book-layer\s*\{[^}]*z-index:\s*30;[^}]*pointer-events:\s*none;/s);
  });

  it('defines the approved grid and desktop adaptations', () => {
    expect(homeCss).toMatch(/grid-template-columns:\s*1\.12fr\s+1\.02fr\s+1\.05fr/);
    expect(homeCss).toMatch(/@media\s*\(max-width:\s*1440px\),\s*\(max-height:\s*810px\)/);
    expect(homeCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  it('imports Bixin styles and avoids Echo glass dependencies', () => {
    expect(globalCss).toContain("@import './bixin-home.css';");
    expect(homeCss).not.toMatch(/--echo-glass-|--echo-gradient-/);
    expect(tokensCss).toContain('--bixin-green-600: #1ea44f;');
  });
});
```

- [ ] **Step 2: Run the CSS test and verify it fails**

```powershell
npm --prefix apps/web run test -- --run src/styles/bixin-home.test.ts
```

Expected: FAIL because `bixin-home.css` and Bixin tokens do not exist.

- [ ] **Step 3: Add semantic Bixin tokens**

Append a separate token group to `:root`; do not remove Echo tokens used by the writing route:

```css
--bixin-canvas: #f7faf7;
--bixin-green-50: #f5fcf6;
--bixin-green-100: #eaf7ed;
--bixin-green-600: #1ea44f;
--bixin-green-700: #11843c;
--bixin-ink: #101413;
--bixin-muted: #5e6662;
--bixin-subtle: #929a96;
--bixin-card: rgb(255 255 255 / 88%);
--bixin-card-border: rgb(255 255 255 / 70%);
--bixin-shadow-frame: 0 18px 55px rgb(24 63 40 / 10%);
--bixin-shadow-card: 0 18px 42px rgb(24 63 40 / 6%);
--bixin-radius-frame: 28px;
--bixin-radius-card: 24px;
--bixin-font-display: "Noto Serif SC", "Songti SC", "Source Han Serif SC", serif;
--bixin-font-ui: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
```

- [ ] **Step 4: Implement the reference geometry before decorative polish**

Start `bixin-home.css` with these exact structural anchors:

```css
.bixin-home {
  min-width: 1440px;
  min-height: 100dvh;
  padding: 16px;
  overflow: hidden;
  color: var(--bixin-ink);
  background: var(--bixin-canvas);
  font-family: var(--bixin-font-ui);
}

.bixin-home__frame {
  position: relative;
  width: 100%;
  height: calc(100dvh - 32px);
  min-height: 778px;
  overflow: hidden;
  border-radius: var(--bixin-radius-frame);
  background: white;
  box-shadow: var(--bixin-shadow-frame);
  isolation: isolate;
}

.bixin-scene-layer,
.bixin-book-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bixin-scene-layer { z-index: 10; }
.bixin-home__interface { position: relative; z-index: 20; display: grid; grid-template-columns: 112px minmax(0, 1fr); height: 100%; }
.bixin-book-layer { z-index: 30; }

.bixin-scene-layer img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.bixin-home__stage {
  position: relative;
  display: grid;
  grid-template-rows: 457px minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  padding: 0 28px 18px;
}

.bixin-home__dashboard { grid-row: 2; min-height: 0; }

.bixin-dashboard {
  display: grid;
  grid-template-columns: 1.12fr 1.02fr 1.05fr;
  grid-template-rows: minmax(0, 1fr) minmax(0, 0.74fr);
  width: 100%;
  height: 100%;
  gap: 14px;
}
```

Place the book at approximately `left: 49.5%`, `top: 250px`, `width: 430px`; these values are calibration seeds, not permission to cover functional content.

- [ ] **Step 5: Add card material, type scale, and responsive rules**

```css
.bixin-card {
  min-width: 0;
  min-height: 0;
  padding: 20px 22px;
  border: 1px solid var(--bixin-card-border);
  border-radius: var(--bixin-radius-card);
  background: var(--bixin-card);
  box-shadow: var(--bixin-shadow-card);
  backdrop-filter: blur(8px);
}

.bixin-hero__title {
  margin: 0;
  font-family: var(--bixin-font-display);
  font-size: clamp(64px, 4.3vw, 76px);
  font-weight: 600;
  letter-spacing: -.03em;
  line-height: 1.04;
}

@media (max-width: 1440px), (max-height: 810px) {
  .bixin-home { padding: 12px; }
  .bixin-home__frame { height: calc(100dvh - 24px); min-height: 786px; }
  .bixin-home__stage { grid-template-rows: 404px minmax(0, 1fr); padding-inline: 20px; }
  .bixin-dashboard { gap: 10px; }
  .bixin-card { padding: 14px 16px; }
  .bixin-hero__title { font-size: 60px; }
}

@media (max-width: 1439px), (max-height: 809px) {
  .bixin-home { overflow: auto; }
  .bixin-home__frame { width: 1416px; min-height: 786px; }
}

@media (prefers-reduced-motion: reduce) {
  .bixin-home,
  .bixin-home * { animation: none; transition: none; scroll-behavior: auto; }
}
```

Import `bixin-home.css` after `echo.css` in `global.css`. Set the body canvas to `var(--bixin-canvas)` without deleting global focus-visible rules.

- [ ] **Step 6: Run CSS and component tests**

```powershell
npm --prefix apps/web run test -- --run src/styles/bixin-home.test.ts src/features/novelora-cockpit/components/home/BixinHomePage.test.tsx src/features/novelora-cockpit/components/home/HomeDashboard.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit the CSS foundation**

```powershell
git status --short
git add -- apps/web/src/styles/bixin-home.css apps/web/src/styles/bixin-home.test.ts apps/web/src/styles/tokens.css apps/web/src/styles/global.css
git commit -m "style: establish bixin home visual system"
```

---

### Task 6: Complete keyboard, status, and reduced-motion behavior

**Files:**
- Create: `apps/web/src/features/novelora-cockpit/components/home/HomeTopbar.test.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/home/HomeTopbar.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/home/NavigationRail.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/home/BixinHomePage.test.tsx`
- Modify: `apps/web/src/styles/bixin-home.css`

**Interfaces:**
- Consumes: `onShowMessage(message: string)` from `BixinHomePage`.
- Produces: Meta/Ctrl+K search focus, explicit action feedback, visible focus, 44px targets, and motion opt-out.

- [ ] **Step 1: Add failing interaction tests**

```tsx
it('focuses search with Meta+K and prevents browser handling', () => {
  const onShowMessage = vi.fn();
  render(<HomeTopbar onShowMessage={onShowMessage} />);
  const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, cancelable: true });
  window.dispatchEvent(event);
  expect(screen.getByRole('searchbox', { name: '搜索项目' })).toHaveFocus();
  expect(event.defaultPrevented).toBe(true);
});

it('reports unavailable notification, help, and search actions', async () => {
  const user = userEvent.setup();
  const onShowMessage = vi.fn();
  render(<HomeTopbar onShowMessage={onShowMessage} />);
  await user.click(screen.getByRole('button', { name: '查看通知' }));
  await user.click(screen.getByRole('button', { name: '打开帮助' }));
  await user.type(screen.getByRole('searchbox', { name: '搜索项目' }), '天空之冠');
  await user.keyboard('{Enter}');
  expect(onShowMessage.mock.calls).toEqual([
    ['通知中心暂未在演示版开放。'],
    ['帮助中心暂未在演示版开放。'],
    ['搜索功能暂未在演示版开放。'],
  ]);
});
```

Add a page test confirming decorative scene and book images are not exposed by role and informative character portraits are exposed by name.

- [ ] **Step 2: Run the interaction tests and verify they fail**

```powershell
npm --prefix apps/web run test -- --run src/features/novelora-cockpit/components/home/HomeTopbar.test.tsx src/features/novelora-cockpit/components/home/BixinHomePage.test.tsx
```

Expected: FAIL until the shortcut listener, submit handling, and exact feedback are implemented.

- [ ] **Step 3: Implement the search keyboard and feedback contract**

```tsx
const searchRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  const focusSearch = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      searchRef.current?.focus();
    }
  };
  window.addEventListener('keydown', focusSearch);
  return () => window.removeEventListener('keydown', focusSearch);
}, []);

function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (searchRef.current?.value.trim()) onShowMessage('搜索功能暂未在演示版开放。');
}
```

Notification and help buttons call the exact messages from the test. Do not fake search results.

- [ ] **Step 4: Enforce focus and target-size styling**

Add explicit rules:

```css
.bixin-nav__item,
.bixin-topbar__icon-button,
.bixin-hero__action,
.bixin-card button { min-height: 44px; }

.bixin-home :focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 3px;
}
```

Hover motion may use at most `translateY(-2px)` and must already be disabled by the reduced-motion block.

- [ ] **Step 5: Run interaction and CSS tests**

```powershell
npm --prefix apps/web run test -- --run src/features/novelora-cockpit/components/home/HomeTopbar.test.tsx src/features/novelora-cockpit/components/home/BixinHomePage.test.tsx src/styles/bixin-home.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the interaction polish**

```powershell
git status --short
git add -- apps/web/src/features/novelora-cockpit/components/home/HomeTopbar.tsx apps/web/src/features/novelora-cockpit/components/home/HomeTopbar.test.tsx apps/web/src/features/novelora-cockpit/components/home/NavigationRail.tsx apps/web/src/features/novelora-cockpit/components/home/BixinHomePage.test.tsx apps/web/src/styles/bixin-home.css
git commit -m "feat: polish bixin home interactions"
```

---

### Task 7: Calibrate visual fidelity at all three desktop viewports

**Files:**
- Modify: `apps/web/src/styles/bixin-home.css`
- Modify only when evidence requires it: `apps/web/src/features/novelora-cockpit/components/home/*.tsx`
- Modify only when evidence requires it: `apps/web/src/features/novelora-cockpit/components/home/cards/*.tsx`
- Create: `qa-screenshots/bixin-home/implemented-1672x941.png`
- Create: `qa-screenshots/bixin-home/implemented-1728x972.png`
- Create: `qa-screenshots/bixin-home/implemented-1440x810.png`

**Interfaces:**
- Consumes: approved reference, running Vite page, and all component/CSS contracts.
- Produces: accepted screenshots for macro geometry, component proportion, and responsive verification.

- [ ] **Step 1: Start the local web app and capture the uncalibrated 1672 × 941 state**

Run:

```powershell
npm run dev:web
```

Use the Codex in-app Browser, open the local Vite page, set the viewport to 1672 × 941, wait for images and fonts to stabilize, and save the exact visible page as `qa-screenshots/bixin-home/implemented-1672x941.png`.

Expected initial result: the structure is complete but at least one macro anchor differs from the approved reference.

- [ ] **Step 2: Compare the reference and implementation in one visual inspection input**

Open these two images together with original detail:

```text
qa-screenshots/bixin-home/reference-1672x941.png
qa-screenshots/bixin-home/implemented-1672x941.png
```

Record visible deltas in this order: outer frame, 112px rail, Hero title, robot, book, Dashboard top edge, three column boundaries, and bottom baseline. Do not adjust shadows or motion while any macro delta remains.

- [ ] **Step 3: Correct macro geometry and recapture 1672 × 941**

Limit edits to structural properties in `bixin-home.css`: frame inset/radius, stage row height, rail width, Hero offsets, dashboard grid fractions/gaps, and book position/size. Recapture the same state and replace `implemented-1672x941.png` only after confirming the screenshot is not blank, cropped, loading, or showing the writing route.

Acceptance:

- frame inset differs by no more than 4px per edge;
- dashboard top differs by no more than 6px;
- each column boundary differs by no more than 8px;
- book overlap remains outside interactive content;
- no white seam appears behind the dashboard.

- [ ] **Step 4: Correct component proportion and material**

Compare again, then adjust only: Hero font size/line height, 160px project cover, card padding, card radius, portrait size, progress rings, icon stroke, button height, border opacity, and shadow softness. Use the approved Green 600 solid CTA; do not introduce gradients or blue accents.

- [ ] **Step 5: Capture and inspect 1728 × 972 and 1440 × 810**

Save:

```text
qa-screenshots/bixin-home/implemented-1728x972.png
qa-screenshots/bixin-home/implemented-1440x810.png
```

At both sizes verify: readable 13px-or-larger body copy, at least 44px primary targets, no unintended horizontal scrollbar, no clipped card title or portrait, no book interception, and no page-level scale transform. At 1440 × 810, reduce spacing through the existing media rule; do not reorder the six cards.

- [ ] **Step 6: Exercise the visible home interactions in the in-app Browser**

Check, in order:

1. `继续写作` opens the writing route.
2. The existing writing back button returns to the Bixin home.
3. `打开项目` opens the writing route.
4. `新建项目` produces the Chinese live-region feedback.
5. `大纲` changes the pressed navigation item.
6. Meta/Ctrl+K focuses search.
7. Notification, help, and search submission produce the expected Demo messages.
8. Keyboard Tab shows visible focus on every primary control.
9. Reduced-motion emulation removes idle and hover animation.

- [ ] **Step 7: Run the complete web verification after visual edits**

```powershell
npm run test:web
npm run lint:web
npm run build:web
```

Expected: all commands exit 0. Do not claim visual completion from these commands alone; the accepted screenshots and comparison are separate evidence.

- [ ] **Step 8: Commit the calibrated visual result**

Stage only files actually changed in this task plus the three accepted screenshots:

```powershell
git status --short
git diff --name-only -- apps/web/src/features/novelora-cockpit/components/home
git add -- apps/web/src/styles/bixin-home.css qa-screenshots/bixin-home/implemented-1672x941.png qa-screenshots/bixin-home/implemented-1728x972.png qa-screenshots/bixin-home/implemented-1440x810.png
git commit -m "style: calibrate bixin home fidelity"
```

If visual evidence required a TSX edit, add each confirmed file by its exact path after the `git diff --name-only` review; never stage the whole `components/home` directory. Before committing, inspect `git diff --cached --name-only`; remove any unrelated pre-existing file from the index without modifying its working-tree contents.

---

### Task 8: Final regression and handoff audit

**Files:**
- Modify only if a verified failure requires it: files already listed in Tasks 1–7.
- Verify: `docs/superpowers/specs/2026-08-14-bixin-home-fidelity-integration-design.md`
- Verify: `qa-screenshots/bixin-home/reference-1672x941.png`
- Verify: three accepted implementation screenshots.

**Interfaces:**
- Consumes: complete implementation and all test/visual evidence.
- Produces: a clean, evidence-backed completion report without modifying unrelated user work.

- [ ] **Step 1: Run focused home tests**

```powershell
npm --prefix apps/web run test -- --run src/App.test.tsx src/features/novelora-cockpit/assetRegistry.test.ts src/features/novelora-cockpit/data/bixinHome.test.ts src/features/novelora-cockpit/components/home/BixinHomePage.test.tsx src/features/novelora-cockpit/components/home/HomeDashboard.test.tsx src/features/novelora-cockpit/components/home/HomeTopbar.test.tsx src/styles/bixin-home.test.ts
```

Expected: PASS with zero failures.

- [ ] **Step 2: Run the complete repository web checks again**

```powershell
npm run test:web
npm run lint:web
npm run build:web
```

Expected: all three commands exit 0 in the final working tree.

- [ ] **Step 3: Audit the final DOM and visible copy**

Using Testing Library output or the running browser, verify the home route contains none of:

```text
Echo
Novelora
Bring your story
New Project
AI Assist
Tides of Embers
```

Legacy writing-route copy may remain after navigating away from the home page.

- [ ] **Step 4: Audit scope and source integrity**

Run:

```powershell
git status --short
git log --oneline -8
Get-FileHash -Algorithm SHA256 'qa-screenshots/bixin-home/reference-1672x941.png'
```

Expected reference hash: `75E149D2E055B3E72B073DE0FAA300D0BB873DDD69D1094439BC25A1352DF92C`. Confirm every implementation commit contains only its declared files and unrelated user changes remain present and untouched.

- [ ] **Step 5: Produce the final handoff**

Report:

- the Bixin home route and exact reference used;
- the three verified viewport screenshots;
- test, lint, and build results with counts or exit status;
- the preserved writing-route boundary;
- any remaining visible mismatch that exceeds the acceptance tolerances;
- the exact list of commits created during execution.

Do not mark the work complete if a required command failed, a screenshot is stale, or the book covers interactive content.
