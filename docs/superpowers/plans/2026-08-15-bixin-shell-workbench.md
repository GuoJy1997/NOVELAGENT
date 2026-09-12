# Bixin Shell + Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `http://localhost:5173/` render the 4173 笔心 home chrome, and open the existing seven workbench pages inside that same frame.

**Architecture:** Copy the running 4173 home module (worktree working copy, not only `e87cd42`) into `D:\NOVELAGENT`. `BixinHomePage` becomes the only live shell. `NavigationRail` uses `NavId` from `nav.ts` (seven Chinese items). `App.tsx` stops wrapping the product in Echo `AppShell`. Do not merge git branches. Do not change `services/api`.

**Tech Stack:** React 19, Vite 8, Vitest 4, Testing Library, plain CSS, `lucide-react@^0.441.0`.

**Spec:** `docs/superpowers/specs/2026-08-15-bixin-shell-workbench-design.md`

## Global Constraints

- Work in `D:\NOVELAGENT` on `feature/toy-writer-cockpit-ui`. Do not edit `.worktrees/bixin-home-fidelity` except to read/copy.
- Copy from the 4173 **working tree** at `D:\NOVELAGENT\.worktrees\bixin-home-fidelity` (includes uncommitted SceneLayer / book / CSS).
- UI copy is Chinese (笔心). Code identifiers stay English.
- Visible UI strings must not contain `—` or `–`.
- Do not introduce Tailwind.
- Do not change `services/api`, recipes, hermes, or Electron spawn.
- Do not hang StructureMap / ChapterSwimlane / AIWritingPartner / InspirationVault / MemoryLayer / ClueAttributionFlow on the product.
- Do not stop the 4173 Vite process. Do not delete the worktree.
- Do not `git add -A`. Do not commit unless the user explicitly asks.
- After every task, run the commands listed in that task from the stated cwd.
- `src/styles/global.test.ts` and `bixin-home.test.ts` read CSS via `process.cwd()`; test commands must run in `apps/web` (root `npm run test:web` already does).

## File map

| File | Responsibility |
|---|---|
| `apps/web/src/assets/bixin/*` | Scene, book, icon, cover from 4173 |
| `apps/web/src/features/novelora-cockpit/assetRegistry.ts` | `bixinAssets` URLs |
| `apps/web/src/styles/tokens.css` | `--bixin-*` tokens |
| `apps/web/src/styles/bixin-home.css` | Home chrome CSS |
| `apps/web/src/styles/global.css` | Import bixin CSS |
| `apps/web/src/features/novelora-cockpit/data/bixinHome.ts` | 4173 card fixture |
| `apps/web/src/features/novelora-cockpit/components/home/*` | BixinHomePage and cards |
| `apps/web/src/features/novelora-cockpit/nav.ts` | Unchanged `NavId` + `NAV_ITEMS` |
| `apps/web/src/App.tsx` | Shell + seven-view switch |
| `apps/web/src/App.test.tsx` | Live-tree chrome and nav contracts |
| `apps/web/src/styles/echo.test.ts` | Drop dead Echo home-grid contract |

Source root for copies: `D:\NOVELAGENT\.worktrees\bixin-home-fidelity\`.

---

### Task 1: Assets, tokens, lucide, `bixinAssets`

**Files:**
- Create: `apps/web/src/assets/bixin/bixin-app-icon.png`
- Create: `apps/web/src/assets/bixin/scene-robot-background.png`
- Create: `apps/web/src/assets/bixin/book-foreground.svg`
- Create: `apps/web/src/assets/bixin/project-cover.png`
- Modify: `apps/web/package.json` (add `lucide-react`)
- Modify: `apps/web/src/features/novelora-cockpit/assetRegistry.ts`
- Modify: `apps/web/src/features/novelora-cockpit/assetRegistry.test.ts`
- Modify: `apps/web/src/styles/tokens.css`

**Interfaces:**
- Consumes: 4173 files under `apps/web/src/assets/bixin/` and the `--bixin-*` block in 4173 `tokens.css`
- Produces: `export const bixinAssets: { appIcon: string; scene: string; book: string; projectCover: string }`

- [ ] **Step 1: Write the failing registry assertions**

In `assetRegistry.test.ts`, add `bixinAssets` to the named import. Inside `resolves every cockpit asset URL to a valid, non-empty image file`, insert these four pairs after the `echoHeroBackground` row, and change `toHaveLength(32)` to `toHaveLength(36)`:

```ts
      [bixinAssets.appIcon, '../../assets/bixin/bixin-app-icon.png'],
      [bixinAssets.scene, '../../assets/bixin/scene-robot-background.png'],
      [bixinAssets.book, '../../assets/bixin/book-foreground.svg'],
      [bixinAssets.projectCover, '../../assets/bixin/project-cover.png'],
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/assetRegistry.test.ts`
Expected: FAIL (`bixinAssets` is not exported).

- [ ] **Step 3: Copy assets, add the export, add tokens, install lucide**

From `D:\NOVELAGENT` in PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path apps/web/src/assets/bixin | Out-Null
Copy-Item -Force D:\NOVELAGENT\.worktrees\bixin-home-fidelity\apps\web\src\assets\bixin\* apps/web/src/assets/bixin\
```

In `apps/web`:

```powershell
npm install lucide-react@0.441.0
```

Append to `assetRegistry.ts` immediately after the `echoMemoryCrystal` export:

```ts
export const bixinAssets = {
  appIcon: new URL('../../assets/bixin/bixin-app-icon.png', import.meta.url).href,
  scene: new URL('../../assets/bixin/scene-robot-background.png', import.meta.url).href,
  book: new URL('../../assets/bixin/book-foreground.svg', import.meta.url).href,
  projectCover: new URL('../../assets/bixin/project-cover.png', import.meta.url).href,
} as const;
```

In `tokens.css`, insert this block inside `:root` immediately before the closing `}` of `:root` (before the `@media (prefers-reduced-transparency)` block):

```css
  /* Bixin home visual-system tokens. */
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
  --bixin-surface-solid: #fff;
  --bixin-surface-94: rgb(255 255 255 / 94%);
  --bixin-surface-84: rgb(255 255 255 / 84%);
  --bixin-surface-74: rgb(255 255 255 / 74%);
  --bixin-surface-58: rgb(255 255 255 / 58%);
  --bixin-surface-48: rgb(255 255 255 / 48%);
  --bixin-ink-04: rgb(16 20 19 / 4%);
  --bixin-ink-05: rgb(16 20 19 / 5%);
  --bixin-ink-06: rgb(16 20 19 / 6%);
  --bixin-ink-07: rgb(16 20 19 / 7%);
  --bixin-ink-08: rgb(16 20 19 / 8%);
  --bixin-shadow-frame: 0 18px 55px rgb(24 63 40 / 10%);
  --bixin-shadow-card: 0 18px 42px rgb(24 63 40 / 6%);
  --bixin-shadow-nav-active: inset 3px 0 0 var(--bixin-green-600);
  --bixin-shadow-account: 0 6px 16px rgb(24 63 40 / 12%);
  --bixin-shadow-brand: 0 10px 24px rgb(30 164 79 / 18%);
  --bixin-shadow-topbar: 0 8px 24px rgb(24 63 40 / 5%);
  --bixin-shadow-action-soft: 0 8px 20px rgb(24 63 40 / 5%);
  --bixin-shadow-action-primary: 0 12px 28px rgb(30 164 79 / 22%);
  --bixin-shadow-action-hover: 0 10px 24px rgb(30 164 79 / 18%);
  --bixin-shadow-cover: 0 12px 28px rgb(24 63 40 / 10%);
  --bixin-shadow-portrait: 0 5px 12px rgb(24 63 40 / 12%);
  --bixin-shadow-portrait-active: 0 0 0 1px var(--bixin-green-600), 0 7px 16px rgb(24 63 40 / 14%);
  --bixin-radius-frame: 28px;
  --bixin-radius-card: 24px;
  --bixin-radius-card-compact: 20px;
  --bixin-radius-schedule: 19px;
  --bixin-radius-input: 16px;
  --bixin-radius-brand: 15px;
  --bixin-radius-medium: 14px;
  --bixin-radius-action: 12px;
  --bixin-radius-stage: 7px;
  --bixin-radius-badge: 4px;
  --bixin-radius-pill: 999px;
  --bixin-radius-circle: 50%;
  --bixin-radius-nav-item: 0 14px 14px 0;
  --bixin-motion-fast: 160ms ease-out;
  --bixin-font-display: "Noto Serif SC", "Songti SC", "Source Han Serif SC", serif;
  --bixin-font-ui: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
```

- [ ] **Step 4: Re-run the registry test**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/assetRegistry.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit only if the user asked**

```bash
git add apps/web/package.json apps/web/package-lock.json apps/web/src/assets/bixin apps/web/src/features/novelora-cockpit/assetRegistry.ts apps/web/src/features/novelora-cockpit/assetRegistry.test.ts apps/web/src/styles/tokens.css
git commit -m "feat(web): register bixin home assets and tokens"
```

---

### Task 2: Bixin CSS and home fixture

**Files:**
- Create: `apps/web/src/styles/bixin-home.css`
- Create: `apps/web/src/styles/bixin-home.test.ts`
- Create: `apps/web/src/features/novelora-cockpit/data/bixinHome.ts`
- Create: `apps/web/src/features/novelora-cockpit/data/bixinHome.test.ts`
- Modify: `apps/web/src/styles/global.css`

**Interfaces:**
- Consumes: `--bixin-*` from Task 1
- Produces: `bixinHomeData` object imported by 4173 cards (copy the 4173 file verbatim)

- [ ] **Step 1: Copy the CSS contract test first**

```powershell
Copy-Item -Force D:\NOVELAGENT\.worktrees\bixin-home-fidelity\apps\web\src\styles\bixin-home.test.ts apps/web/src/styles/bixin-home.test.ts
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd apps/web && npx vitest run src/styles/bixin-home.test.ts`
Expected: FAIL (cannot read `src/styles/bixin-home.css`, and `global.css` lacks the import).

- [ ] **Step 3: Copy CSS, fixture, and import**

```powershell
Copy-Item -Force D:\NOVELAGENT\.worktrees\bixin-home-fidelity\apps\web\src\styles\bixin-home.css apps/web/src/styles/bixin-home.css
Copy-Item -Force D:\NOVELAGENT\.worktrees\bixin-home-fidelity\apps\web\src\features\novelora-cockpit\data\bixinHome.ts apps/web/src/features/novelora-cockpit/data/bixinHome.ts
Copy-Item -Force D:\NOVELAGENT\.worktrees\bixin-home-fidelity\apps\web\src\features\novelora-cockpit\data\bixinHome.test.ts apps/web/src/features/novelora-cockpit/data/bixinHome.test.ts
```

In `apps/web/src/styles/global.css`, add this line immediately after `@import './echo.css';`:

```css
@import './bixin-home.css';
```

- [ ] **Step 4: Re-run CSS and fixture tests**

Run: `cd apps/web && npx vitest run src/styles/bixin-home.test.ts src/features/novelora-cockpit/data/bixinHome.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit only if the user asked**

```bash
git add apps/web/src/styles/bixin-home.css apps/web/src/styles/bixin-home.test.ts apps/web/src/styles/global.css apps/web/src/features/novelora-cockpit/data/bixinHome.ts apps/web/src/features/novelora-cockpit/data/bixinHome.test.ts
git commit -m "feat(web): add bixin home CSS and card fixture"
```

---

### Task 3: Home module, seven-item rail, main slot

**Files:**
- Replace directory: `apps/web/src/features/novelora-cockpit/components/home/`
- Modify after copy: `.../home/NavigationRail.tsx`
- Modify after copy: `.../home/BixinHomePage.tsx`
- Modify after copy: `.../home/BixinHomePage.test.tsx`

**Interfaces:**
- Consumes: `bixinAssets` (Task 1), `bixinHomeData` (Task 2), `NavId` from `nav.ts`
- Produces:

```ts
export interface BixinHomePageProps {
  activeNavigation: NavId;
  onSelectNavigation: (item: NavId) => void;
  onContinueWriting: () => void;
  onNewProject: () => void;
  onOpenProject: () => void;
  onAddSchedule: () => void;
  onShowMessage: (message: string) => void;
  children?: ReactNode;
}
```

`NavigationRail` uses the same `NavId`. It no longer exports `BixinNavigationId`.

- [ ] **Step 1: Copy the 4173 home tree over the 5173 home folder**

```powershell
Remove-Item -Recurse -Force apps/web/src/features/novelora-cockpit/components/home
Copy-Item -Recurse -Force D:\NOVELAGENT\.worktrees\bixin-home-fidelity\apps\web\src\features\novelora-cockpit\components\home apps/web/src/features/novelora-cockpit/components/home
```

- [ ] **Step 2: Rewrite `BixinHomePage.test.tsx` for seven nav items and the workbench slot**

Replace the file with:

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

describe('BixinHomePage', () => {
  it('renders the canonical scene, semantic interface, and book in that order', () => {
    const { container } = render(<BixinHomePage {...handlers} />);
    const page = container.querySelector('.bixin-home__frame');

    expect(page?.children[0]).toHaveClass('bixin-scene-layer');
    expect(page?.children[1]).toHaveClass('bixin-home__interface');
    expect(page?.children[2]).toHaveClass('bixin-book-layer');
    const sceneImages = container.querySelectorAll<HTMLImageElement>(
      'img[src*="scene-robot-background"]',
    );
    expect(sceneImages).toHaveLength(2);
    expect(sceneImages[0]).toHaveClass('bixin-scene-layer__base');
    expect(sceneImages[1]).toHaveClass('bixin-scene-layer__subject-image');
    expect(container.querySelectorAll('img[src*="book-foreground"]')).toHaveLength(1);
  });

  it('uses the Bixin identity and the seven workbench nav labels', () => {
    render(<BixinHomePage {...handlers} />);

    expect(screen.getByText('笔心')).toBeVisible();
    expect(screen.getByRole('heading', { name: '写出让世界铭记的故事' })).toBeVisible();

    const navigation = screen.getByRole('navigation', { name: '工作区导航' });
    expect(within(navigation).getAllByRole('button').map((button) => button.textContent)).toEqual([
      '首页',
      '写作',
      '大纲',
      '人物',
      '关系',
      '世界观',
      '任务',
    ]);
    expect(screen.queryByText('项目')).not.toBeInTheDocument();
    expect(screen.queryByText('统计')).not.toBeInTheDocument();
    expect(screen.queryByText(/Echo|Novelora|Bring your story/i)).not.toBeInTheDocument();
  });

  it('keeps the hero on home and renders workbench children in the same frame', () => {
    const { rerender, container } = render(
      <BixinHomePage {...handlers}>
        <p>工作台内容</p>
      </BixinHomePage>,
    );
    expect(screen.getByRole('heading', { name: '写出让世界铭记的故事' })).toBeInTheDocument();
    expect(screen.getByRole('main', { name: '创作首页' })).toBeInTheDocument();
    expect(screen.queryByText('工作台内容')).not.toBeInTheDocument();

    rerender(
      <BixinHomePage {...handlers} activeNavigation="writing">
        <p>工作台内容</p>
      </BixinHomePage>,
    );
    expect(screen.queryByRole('heading', { name: '写出让世界铭记的故事' })).not.toBeInTheDocument();
    expect(screen.getByRole('main', { name: '工作台' })).toHaveTextContent('工作台内容');
    expect(container.querySelector('.bixin-home')).toBeInTheDocument();
    expect(container.querySelector('.bixin-scene-layer')).toBeInTheDocument();
    expect(container.querySelector('.bixin-book-layer')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the page test and confirm the nav assertion fails**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/home/BixinHomePage.test.tsx`
Expected: FAIL (copied rail still says 项目 / 统计; no workbench slot).

- [ ] **Step 4: Point the rail at `NavId` and add the slot**

Replace `NavigationRail.tsx` with:

```tsx
import {
  ChartNoAxesCombined,
  Columns2,
  FileText,
  Globe2,
  House,
  Settings,
  Share2,
  UserRound,
} from 'lucide-react';
import { characterPortraits } from '../../assetRegistry';
import type { NavId } from '../../nav';

interface NavigationRailProps {
  activeItem: NavId;
  onSelectItem: (item: NavId) => void;
}

const navigationItems: { id: NavId; label: string; icon: typeof House }[] = [
  { id: 'home', label: '首页', icon: House },
  { id: 'writing', label: '写作', icon: FileText },
  { id: 'outline', label: '大纲', icon: Columns2 },
  { id: 'characters', label: '人物', icon: UserRound },
  { id: 'relations', label: '关系', icon: Share2 },
  { id: 'world', label: '世界观', icon: Globe2 },
  { id: 'tasks', label: '任务', icon: ChartNoAxesCombined },
];

export function NavigationRail({ activeItem, onSelectItem }: NavigationRailProps) {
  return (
    <nav className="bixin-navigation-rail" aria-label="工作区导航">
      {navigationItems.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            className="bixin-navigation-rail__item"
            aria-pressed={activeItem === item.id}
            onClick={() => onSelectItem(item.id)}
          >
            <Icon aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
      <div className="bixin-navigation-rail__footer">
        <div className="bixin-navigation-rail__utility">
          <Settings aria-hidden="true" />
          <span>设置</span>
        </div>
        <div className="bixin-navigation-rail__account">
          <img src={characterPortraits.liora} alt="陆瑶" width={40} height={40} />
          <div>
            <span>陆瑶</span>
            <small>专业版</small>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

Replace `BixinHomePage.tsx` with:

```tsx
import type { ReactNode } from 'react';
import type { NavId } from '../../nav';
import { BookForeground } from './BookForeground';
import { BrandHeader } from './BrandHeader';
import { HeroSection } from './HeroSection';
import { HomeDashboard } from './HomeDashboard';
import { HomeTopbar } from './HomeTopbar';
import { NavigationRail } from './NavigationRail';
import { SceneLayer } from './SceneLayer';

export interface BixinHomePageProps {
  activeNavigation: NavId;
  onSelectNavigation: (item: NavId) => void;
  onContinueWriting: () => void;
  onNewProject: () => void;
  onOpenProject: () => void;
  onAddSchedule: () => void;
  onShowMessage: (message: string) => void;
  children?: ReactNode;
}

export function BixinHomePage(props: BixinHomePageProps) {
  const isHome = props.activeNavigation === 'home';

  return (
    <div className="bixin-home">
      <div className="bixin-home__frame">
        <SceneLayer />
        <div className="bixin-home__interface">
          <NavigationRail activeItem={props.activeNavigation} onSelectItem={props.onSelectNavigation} />
          <div className="bixin-home__stage">
            <BrandHeader />
            <HomeTopbar onShowMessage={props.onShowMessage} />
            {isHome ? (
              <HeroSection
                onContinueWriting={props.onContinueWriting}
                onNewProject={props.onNewProject}
              />
            ) : null}
            <main
              className={isHome ? 'bixin-home__dashboard' : 'bixin-home__workbench'}
              aria-label={isHome ? '创作首页' : '工作台'}
            >
              {isHome ? (
                <HomeDashboard
                  onOpenProject={props.onOpenProject}
                  onAddSchedule={props.onAddSchedule}
                />
              ) : (
                props.children
              )}
            </main>
          </div>
        </div>
        <BookForeground />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run home-module tests**

Run: `cd apps/web && npx vitest run src/features/novelora-cockpit/components/home`
Expected: PASS (including copied `HomeDashboard.test.tsx` and `HomeTopbar.test.tsx`).

- [ ] **Step 6: Commit only if the user asked**

```bash
git add apps/web/src/features/novelora-cockpit/components/home
git commit -m "feat(web): port bixin home chrome with seven-item rail"
```

---

### Task 4: Wire `App.tsx` and rewrite `App.test.tsx`

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/App.test.tsx`

**Interfaces:**
- Consumes: `BixinHomePage` from Task 3; existing `WritingView`, `MarkdownDocumentPage`, `CharactersPage`, `RelationsPage`, `TaskBoardPage`
- Produces: live tree with no `AppShell` / `ProjectSidebar` / `EchoHeroCopy`

- [ ] **Step 1: Rewrite `App.test.tsx` to the spec contracts**

Replace the first test and the nav / action / writing tests as follows. Keep `afterEach` and the em-dash test. Do not keep Echo / English button names.

```tsx
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

afterEach(() => {
  vi.useRealTimers();
});

describe('App', () => {
  it('composes the Bixin home chrome with the seven-item workbench rail', () => {
    const { container } = render(<App />);
    const frame = container.querySelector('.bixin-home__frame');
    const navigation = screen.getByRole('navigation', { name: '工作区导航' });

    expect(container.querySelector('.bixin-home')).toBeInTheDocument();
    expect(frame?.children[0]).toHaveClass('bixin-scene-layer');
    expect(frame?.children[1]).toHaveClass('bixin-home__interface');
    expect(frame?.children[2]).toHaveClass('bixin-book-layer');
    expect(container.querySelector('.echo-page')).not.toBeInTheDocument();
    expect(container.querySelector('.echo-hero-background')).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Project navigation' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Bring your story to life with AI/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '写出让世界铭记的故事' })).toBeInTheDocument();
    expect(within(navigation).getAllByRole('button').map((button) => button.textContent)).toEqual([
      '首页',
      '写作',
      '大纲',
      '人物',
      '关系',
      '世界观',
      '任务',
    ]);
    expect(screen.getByRole('button', { name: '继续写作' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '新建项目' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '打开项目' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '我的项目' })).toBeInTheDocument();
  });

  it('opens outline from the rail and writing from 继续写作 without leaving the Bixin frame', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const navigation = screen.getByRole('navigation', { name: '工作区导航' });

    await user.click(within(navigation).getByRole('button', { name: '大纲' }));
    expect(screen.getByRole('region', { name: '大纲' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '大纲' })).toBeInTheDocument();
    expect(container.querySelector('.bixin-home')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '写出让世界铭记的故事' })).not.toBeInTheDocument();

    await user.click(within(navigation).getByRole('button', { name: '首页' }));
    await user.click(screen.getByRole('button', { name: '继续写作' }));
    expect(screen.getByLabelText('Writing workspace')).toBeInTheDocument();
    expect(container.querySelector('.bixin-home')).toBeInTheDocument();
    expect(screen.queryByRole('main', { name: 'Story workspace' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '返回首页' }));
    expect(screen.getByRole('region', { name: '我的项目' })).toBeInTheDocument();
  });

  it('announces new-project and schedule actions in Chinese', async () => {
    const user = userEvent.setup();
    render(<App />);
    const status = screen.getByRole('status');

    await user.click(screen.getByRole('button', { name: '新建项目' }));
    expect(status).toHaveTextContent('新建项目功能暂未在演示版开放。');

    await user.click(screen.getByRole('button', { name: '添加条目' }));
    expect(status).toHaveTextContent('演示版暂不支持编辑场景日程。');
  });

  it('dismisses action feedback after 3200ms while keeping the live region mounted', () => {
    vi.useFakeTimers();
    render(<App />);
    const status = screen.getByRole('status');
    fireEvent.click(screen.getByRole('button', { name: '新建项目' }));
    expect(status).toHaveClass('is-visible');
    act(() => vi.advanceTimersByTime(3199));
    expect(status).toHaveClass('is-visible');
    act(() => vi.advanceTimersByTime(1));
    expect(status).toBeInTheDocument();
    expect(status).toBeEmptyDOMElement();
    expect(status).not.toHaveClass('is-visible');
  });

  it('opens writing from 写作 and the world editor from 世界观', async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByRole('navigation', { name: '工作区导航' });
    await user.click(within(navigation).getByRole('button', { name: '写作' }));
    expect(screen.getByLabelText('Writing workspace')).toBeInTheDocument();
    await user.click(within(navigation).getByRole('button', { name: '世界观' }));
    expect(screen.getByRole('region', { name: '世界观' })).toBeInTheDocument();
    expect(screen.getByText('这是设定编辑，不会召唤 Agent。')).toBeInTheDocument();
  });

  it('keeps visible copy free of em-dashes', () => {
    render(<App />);
    expect(document.body.textContent ?? '').not.toMatch(/[—–]/);
  });
});
```

- [ ] **Step 2: Run App tests and confirm they fail**

Run: `cd apps/web && npx vitest run src/App.test.tsx`
Expected: FAIL (still Echo `AppShell`, English nav name, no 继续写作).

- [ ] **Step 3: Replace `App.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { BixinHomePage } from './features/novelora-cockpit/components/home/BixinHomePage';
import { CharactersPage } from './features/novelora-cockpit/components/pages/CharactersPage';
import { MarkdownDocumentPage } from './features/novelora-cockpit/components/pages/MarkdownDocumentPage';
import { RelationsPage } from './features/novelora-cockpit/components/pages/RelationsPage';
import { TaskBoardPage } from './features/novelora-cockpit/components/pages/TaskBoardPage';
import { WritingView } from './features/novelora-cockpit/components/writing/WritingView';
import { noveloraMockProject } from './features/novelora-cockpit/data/noveloraMockProject';
import type { NavId } from './features/novelora-cockpit/nav';

const ACTION_FEEDBACK_DURATION_MS = 3200;

export default function App() {
  const [activeNavigation, setActiveNavigation] = useState<NavId>('home');
  const [actionMessage, setActionMessage] = useState('');
  const [writingChapterNum, setWritingChapterNum] = useState(1);
  const timelineChapters = [...noveloraMockProject.chapters].sort(
    (first, second) => first.order - second.order,
  );
  const currentChapterIndex = timelineChapters.findIndex(
    (chapter) => chapter.id === noveloraMockProject.selectedChapterId,
  );

  useEffect(() => {
    if (!actionMessage) return undefined;
    const dismissalTimer = window.setTimeout(
      () => setActionMessage(''),
      ACTION_FEEDBACK_DURATION_MS,
    );
    return () => window.clearTimeout(dismissalTimer);
  }, [actionMessage]);

  function openWriting(chapterNum: number) {
    setWritingChapterNum(chapterNum);
    setActiveNavigation('writing');
  }

  function workbench() {
    if (activeNavigation === 'writing') {
      return (
        <WritingView
          projectId="default-project"
          chapterNum={writingChapterNum}
          onSelectChapter={setWritingChapterNum}
          onBack={() => setActiveNavigation('home')}
        />
      );
    }
    if (activeNavigation === 'outline') {
      return (
        <MarkdownDocumentPage
          projectId="default-project"
          document="outline"
          title="大纲"
          hint=""
        />
      );
    }
    if (activeNavigation === 'world') {
      return (
        <MarkdownDocumentPage
          projectId="default-project"
          document="world"
          title="世界观"
          hint="这是设定编辑，不会召唤 Agent。"
        />
      );
    }
    if (activeNavigation === 'characters') {
      return <CharactersPage projectId="default-project" />;
    }
    if (activeNavigation === 'relations') {
      return <RelationsPage projectId="default-project" />;
    }
    if (activeNavigation === 'tasks') {
      return <TaskBoardPage projectId="default-project" />;
    }
    return null;
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
      >
        {workbench()}
      </BixinHomePage>
      <div
        className={`echo-action-feedback${actionMessage ? ' is-visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        {actionMessage}
      </div>
    </>
  );
}
```

Do not delete `AppShell.tsx`, `ProjectSidebar.tsx`, or `EchoHeroCopy.tsx`. Stop importing them from `App.tsx`.

- [ ] **Step 4: Re-run App tests**

Run: `cd apps/web && npx vitest run src/App.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit only if the user asked**

```bash
git add apps/web/src/App.tsx apps/web/src/App.test.tsx
git commit -m "feat(web): mount workbench pages inside the bixin shell"
```

---

### Task 5: Drop the dead Echo home-grid contract and verify

**Files:**
- Modify: `apps/web/src/styles/echo.test.ts` (delete the Echo home-grid test only)

**Interfaces:**
- Consumes: live tree from Task 4
- Produces: green `test:web` / `lint:web` / `build:web`

- [ ] **Step 1: Delete the Echo home-grid contract**

In `apps/web/src/styles/echo.test.ts`, delete the entire `it('places home cards in the three-column desktop grid from the reference', ...)` block (the one that asserts `.echo-home-dashboard` and `.echo-home-card--*`). Leave the writing-workspace and sidebar-footer contracts in place.

Do not put `.echo-home-dashboard` back into the live JSX to make this test pass.

- [ ] **Step 2: Run the CSS contract file**

Run: `cd apps/web && npx vitest run src/styles/echo.test.ts`
Expected: PASS.

- [ ] **Step 3: Full web verification**

From repo root:

```bash
npm run test:web
npm run lint:web
npm run build:web
```

Expected: all green. If `HomeDashboard.test.tsx` or `ProjectSidebar.test.tsx` fail because they still import overwritten files, fix only the broken import/assertion; do not restore Echo home JSX.

- [ ] **Step 4: Visual check (do not claim done without this)**

Open `http://localhost:5173/` and `http://127.0.0.1:4173/` side by side. Confirm 5173 has the robot scene, book, 笔心 wordmark, and six cards. Click 写作 / 大纲 / 人物 / 关系 / 世界观 / 任务 and confirm each page stays inside the bixin frame. Leave 4173 running.

- [ ] **Step 5: Commit only if the user asked**

```bash
git add apps/web/src/styles/echo.test.ts
git commit -m "test(web): drop unused echo home grid contract"
```

---

## Spec coverage

| Spec section | Task |
|---|---|
| 4173 chrome on 5173, scene → interface → book | 3, 4 |
| Seven-item rail, no 项目 / 统计 | 3, 4 |
| Workbench pages inside bixin frame, no Echo AppShell | 3, 4 |
| Copy from 4173 working copy | 1, 2, 3 |
| `bixinAssets`, tokens, lucide, CSS import | 1, 2 |
| App.test + home tests + drop echo-home-grid | 3, 4, 5 |
| Do not merge branches / do not touch api / leave 4173 up | Global constraints |

## Type consistency

- `NavId` stays `home | writing | outline | characters | relations | world | tasks`.
- `BixinHomePageProps.activeNavigation` and `NavigationRail.activeItem` are `NavId`.
- `bixinAssets` keys are `appIcon`, `scene`, `book`, `projectCover`.
- Demo strings: `新建项目功能暂未在演示版开放。` and `演示版暂不支持编辑场景日程。`
- Schedule button accessible name is `添加条目` (4173 card), not `添加日程`.
