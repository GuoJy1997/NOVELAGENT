# uizip 路由页面改造 · 代码实施规格（可直接执行版）

> 执行者：AI 编码代理（如 cursor grok4.6）。本文档假设你只读过 `AGENTS.md`，没有其他上下文。
> 目标稿：`d:\ui包\uizip\` 下 7 张 PNG（首页/写作/人物/关系/大纲/世界观/工作流）。执行每个任务前先看对应的图。
> 配套方案文档：`docs/redesign/2026-08-28-uizip-route-pages-retrofit-plan.md`（背景与资产清单）。
>
> 任务必须**按编号顺序执行**（Task 0 → Task 8），每个任务结束时跑一遍验收命令，全绿才能进入下一个任务。

---

## 0. 全局铁律（每个任务都适用，违反即返工）

1. **不许删这些文件**（有契约测试直接读取它们的源码）：
   - `apps/web/src/styles/cockpit.css`（虽然没被 `global.css` import，但 `global.test.ts` 读它）
   - `apps/web/src/styles/tokens.css` 中现有的所有 token（包括 `--color-mint-*`、`--book-origin-*`、`--cockpit-*`、legacy aliases 及其上方的 migration 注释）
   - `apps/web/src/assets/novelora/novelora_ui_asset_pack/01_logo/novelora_logo_horizontal.svg`
2. **tokens.css 里禁止出现**这些字符串（`global.test.ts` 断言）：`#ff6b57`、`#3a86ff`、`#8f67ff`、`Georgia`、`Times New Roman`。新增紫色/橙色 token 时换用其他 hex（本规格已指定具体值，照抄即可）。
3. TypeScript 约束：`verbatimModuleSyntax`（类型导入必须 `import type`）、禁 enum、`noUnusedLocals`/`noUnusedParameters`。代码、标识符、测试断言、UI 文案为中文的部分照抄本规格给出的字符串，标识符一律英文。
4. 每个新组件 `X.tsx` 必须配 `X.test.tsx` 放同目录；测试用 Testing Library 按角色/可访问名查询（`getByRole('button', { name: ... })`），显式 `import { describe, expect, it } from 'vitest'`。
5. 颜色/阴影/圆角只用 CSS 变量。新样式写进对应页面的 CSS 文件（如 `CharactersPage.css`）或 `bixin-home.css`，不新建全局样式表。
6. 不改 `useFitScale.ts`、`.bixin-home__frame` 的 1416×786 画布机制。所有新 UI 都在这个画布内。
7. 现有交互逻辑（自动保存、导入、onboarding、任务委派、候选审阅）**只换皮不换逻辑**。凡本规格标注「展示态」的控件：点击时调用 toast（写作台内没有 toast 的地方用 `role="status"` 文本），文案统一为 `「功能名」暂未在演示版开放。`。
8. 验收命令（在仓库根目录）：`npm run test:web`、`npm run lint:web`、`npm run build:web`。三个全部通过 = 任务完成。
9. 不要 git commit。

## 0.1 资产占位策略

ChatGPT 新资产尚未生成。本次改造**全部用现有文件占位**，注册表键名按最终命名定死，之后美术资产到位只替换图片文件、不改代码。占位映射表（Task 0 落地）：

| 新注册表键 | 最终文件（未来放置路径） | 现在占位用 |
|---|---|---|
| `bixinAssets.heroRobot` | `assets/bixin/hero-robot.png` | `assets/bixin/scene-robot-background.png` |
| `bixinAssets.homeBackdrop` | `assets/bixin/home-sky-backdrop.png` | `assets/bixin/scene-robot-background.png` |
| `bixinAssets.skyBand` | `assets/bixin/scene-sky-band.png` | `assets/bixin/scene-robot-background.png` |
| `bixinAssets.mascotChallenge` | `assets/bixin/mascot-challenge.png` | `novelora_ui_asset_pack/02_mascot/mascot_nova_front.svg` |
| `bixinAssets.mascotCopilot` | `assets/bixin/mascot-copilot.png` | `novelora_ui_asset_pack/02_mascot/mascot_nova_avatar.svg` |
| `bixinAssets.mascotQuickgen` | `assets/bixin/mascot-quickgen.png` | `novelora_ui_asset_pack/02_mascot/mascot_nova_front.svg` |
| `bixinAssets.mascotPro` | `assets/bixin/mascot-pro.png` | `novelora_ui_asset_pack/02_mascot/mascot_nova_avatar.svg` |
| `bixinAssets.promoRocket` | `assets/bixin/promo-rocket.png` | `novelora_ui_asset_pack/02_mascot/mascot_nova_front.svg` |
| `bixinAssets.quill` | `assets/bixin/bixin-quill.png` | `assets/bixin/bixin-app-icon.png` |
| `bixinAssets.avatarWriter` | `assets/bixin/avatar-writer.png` | `novelora_ui_asset_pack/06_character_portraits/portrait_liora.svg` |

人物立绘继续用现有 `characterPortraits`（liora/arden/kael/selene/vex/theOrder 六键），新增横幅键见 Task 0。

---

## Task 0：assetRegistry 扩展

**文件**：`apps/web/src/features/novelora-cockpit/assetRegistry.ts`

1. 把 `bixinAssets` 常量扩成（保留现有 4 键，新增 10 键，占位路径按上表；全部 `new URL('...', import.meta.url).href`）：

```ts
export const bixinAssets = {
  appIcon: ..., scene: ..., book: ..., projectCover: ...,   // 现有，不动
  heroRobot: ..., homeBackdrop: ..., skyBand: ...,
  mascotChallenge: ..., mascotCopilot: ..., mascotQuickgen: ..., mascotPro: ...,
  promoRocket: ..., quill: ..., avatarWriter: ...,
} as const;
```

2. 新增横幅立绘注册表（占位：每键都先指向 `characterPortraits` 同名的现有 SVG 文件路径）：

```ts
export const characterBanners = {
  liora: ..., arden: ..., kael: ..., selene: ..., vex: ..., theOrder: ...,
} as const;
```

3. 新增导出 `export type CharacterPortraitKey = keyof typeof characterPortraits;`（`types.ts` 里现在用局部 type，不动它，这个导出给新组件用）。

**测试**：更新/新建 `assetRegistry.test.ts`：断言 `Object.keys(bixinAssets)` 恰好等于上面 14 个键、`Object.keys(characterBanners)` 等于 6 个键、每个值都是非空字符串。

---

## Task 1：设计 token 扩展

**文件**：`apps/web/src/styles/tokens.css`。在 `--bixin-font-ui` 声明之后、`:root` 闭括号之前，追加（原样照抄，不要改 hex）：

```css
  /* Bixin pop accents (home operational cards). */
  --bixin-pop-purple: #7c5bd6;
  --bixin-pop-purple-soft: #efeafc;
  --bixin-pop-blue: #4f7df9;
  --bixin-pop-blue-soft: #eaf0fe;
  --bixin-pop-pink: #f2789f;
  --bixin-pop-pink-soft: #fdeef3;
  --bixin-pop-orange: #f08c3a;
  --bixin-pop-orange-soft: #fdf3e7;
  --bixin-pop-yellow: #f5c542;
  --bixin-pop-yellow-soft: #fdf8e3;
  --bixin-pop-cyan: #2fb7a5;
  --bixin-pop-cyan-soft: #e6f7f4;
  --bixin-gradient-cta: linear-gradient(135deg, #34c46b, #1ea44f);
  --bixin-gradient-challenge: linear-gradient(135deg, #8f6ae0, #6d4fd0);
  --bixin-gradient-copilot: linear-gradient(135deg, #eef2ff, #dfe9ff);
  --bixin-shadow-pop: 0 14px 32px rgb(16 20 19 / 10%);
```

**测试**：在 `apps/web/src/styles/` 下新建 `bixinPopTokens.test.ts`（模式仿照 `global.test.ts` 头部：`readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')`）：

- 断言上述 16 个 token 各存在一次（正则逐个 match）。
- 断言 tokens.css 不含 `#8f67ff`、`#ff6b57`、`#3a86ff`（与旧契约相同的保险）。

---

## Task 2：外壳升级（NavigationRail + HomeTopbar）

### 2a. NavigationRail

**文件**：`apps/web/src/features/novelora-cockpit/components/home/NavigationRail.tsx`（重写渲染，保留 props 接口 `{ activeItem, onSelectItem }` 不变）。

新 DOM 结构（自上而下；类名照抄）：

```
nav.bixin-navigation-rail  (aria-label="工作区导航" 不变)
├─ div.bixin-navigation-rail__brand
│   ├─ img (src=bixinAssets.quill, alt="", width=34, height=34)
│   └─ div > span "笔心" + small "AI 小说 Agent"
├─ button.bixin-navigation-rail__cta (type=button)
│   文案 "新建作品"，前置 lucide Plus 图标 (aria-hidden)
│   onClick → 新 prop（见下）
├─ (导航按钮列表：现有 map 逻辑与 aria-pressed 不变，类名不变)
├─ div.bixin-navigation-rail__promo
│   ├─ img (src=bixinAssets.mascotPro, alt="")
│   ├─ strong "笔心 Pro 限时特惠"
│   ├─ small "解锁无限灵感与高级功能"
│   └─ button "立即开通" (type=button) → 展示态 toast
├─ div.bixin-navigation-rail__stats  (aria-label="创作统计")
│   ├─ strong "创作统计"
│   ├─ dl：dt "累计字数" dd "892,301"；dt "累计创作天数" dd "68 天"
│   │   （数值来自 Task 3 的 fixture，不许写死在组件里）
│   └─ 迷你柱状图：div.bixin-navigation-rail__bars > 7 个 span，
│       高度用内联 style height: `${value}%`，数据来自 fixture
└─ div.bixin-navigation-rail__footer （现有 设置 + 账号卡结构保留；
    账号卡 img 换成 bixinAssets.avatarWriter，名字改 "笔心小作家"，small 改 "Lv.12"）
```

props 扩展：新增 `onNewProject: () => void` 与 `onShowMessage: (message: string) => void`。`BixinHomePage.tsx` 透传已有的 `props.onNewProject` / `props.onShowMessage`。「立即开通」→ `onShowMessage('笔心 Pro 暂未在演示版开放。')`。

**CSS**（`bixin-home.css`，追加到 navigation-rail 段落后）：`__brand` 横排 10px 间距；`__cta` 背景 `var(--bixin-gradient-cta)`、白字、圆角 `var(--bixin-radius-medium)`、阴影 `var(--bixin-shadow-action-primary)`；`__promo` 背景 `var(--bixin-pop-purple-soft)`、圆角 `var(--bixin-radius-card-compact)`；`__stats` 背景 `var(--bixin-surface-94)`；`__bars` 高 36px、7 列 flex、span 背景 `var(--bixin-green-600)`、圆角 2px。

**测试**（更新 `BixinHomePage.test.tsx` 或新建 `NavigationRail.test.tsx`）：

- `getByRole('button', { name: '新建作品' })` 存在，点击触发 `onNewProject`。
- `getByRole('button', { name: '立即开通' })` 点击后 `onShowMessage` 收到 `'笔心 Pro 暂未在演示版开放。'`。
- 现有 8 个导航按钮与 aria-pressed 行为的断言保持通过。

### 2b. HomeTopbar

**文件**：`home/HomeTopbar.tsx`。保留：⌘K 聚焦逻辑、搜索 submit → toast、铃铛。删除 CircleHelp 帮助按钮。新增（插在 form 与铃铛之间）：

- `button.bixin-home-topbar__energy`：lucide `Zap` 图标 + 文案 "创作能量 999+"，点击 → `onShowMessage('创作能量暂未在演示版开放。')`。
- `button.bixin-home-topbar__pro`：lucide `Crown` 图标 + 文案 "开通笔心Pro"，点击 → `onShowMessage('笔心 Pro 暂未在演示版开放。')`。
- 铃铛后追加 `div.bixin-home-topbar__avatar`：img（`bixinAssets.avatarWriter`，alt="笔心小作家"）+ span "Lv.12"。

CSS：`__energy` 背景 `var(--bixin-green-100)`、文字 `var(--bixin-green-700)`；`__pro` 背景 `var(--bixin-pop-yellow-soft)`、文字 `#8a6a1f`、边框 `1px solid var(--bixin-pop-yellow)`；两者圆角 `var(--bixin-radius-pill)`。

**测试**：`HomeTopbar.test.tsx` 追加两条：按名字点击「创作能量 999+」「开通笔心Pro」各收到对应 toast 文案；原有搜索/铃铛断言保持。

---

## Task 3：首页重构（对照 首页.png）

### 3a. 内容 fixture

**新建** `apps/web/src/features/novelora-cockpit/data/bixinHomeContent.ts`。原样定义并导出：

```ts
export interface HomeChallenge {
  topic: string; description: string; reward: string; participants: string;
}
export interface HomeQuickAction { id: string; label: string; nav: 'writing' | 'outline' | 'characters' | 'world'; }
export interface HomeRecentProject {
  id: string; genre: string; title: string; latestChapter: string;
  words: string; progressPercent: number;
}
export interface HomeSuggestion { id: string; text: string; }
export interface HomeStats { totalWords: string; totalDays: string; weeklyBars: number[]; }

export const bixinHomeContent = {
  heroTitleLines: ['笔心在手', '故事无界！'] as const,
  heroSubtitle: '你的 AI 小说创作搭档，灵感无限，笔下生花',
  heroBubble: '脑洞成文，一秒入戏！',
  featureChips: ['智能构思', '角色鲜活', '剧情联动', '世界沉浸', '一键成稿'] as const,
  challenge: {
    topic: '命运的转折点',
    description: '在故事中设置一个重要而不经的抉择，让主角的命运发生改变。',
    reward: '创作能量 +80',
    participants: '1234 人正在参与挑战',
  } satisfies HomeChallenge,
  copilotActions: ['续写下一章', '优化剧情', '描写场景', '对话润色'] as const,
  quickActions: [
    { id: 'outline-doc', label: '小说大纲', nav: 'outline' },
    { id: 'chapter-brief', label: '章节提纲', nav: 'writing' },
    { id: 'character-sheet', label: '角色设定', nav: 'characters' },
    { id: 'world-setting', label: '世界设定', nav: 'world' },
  ] satisfies HomeQuickAction[],
  recentProjects: [
    { id: 'p1', genre: '奇幻', title: '云上王座', latestChapter: '更新至 第三十五章', words: '12.8万字', progressPercent: 68 },
    { id: 'p2', genre: '科幻', title: '星海旅人', latestChapter: '更新至 第十八章', words: '8.7万字', progressPercent: 42 },
    { id: 'p3', genre: '古风', title: '长安夜话录', latestChapter: '更新至 第二十章', words: '9.3万字', progressPercent: 55 },
  ] satisfies HomeRecentProject[],
  suggestions: [
    { id: 's1', text: '让主角在困境中做出艰难抉择，增强戏剧张力' },
    { id: 's2', text: '增加反派的背景故事，丰富人物层次' },
    { id: 's3', text: '在下一章埋下伏笔，为后续高潮做铺垫' },
  ] satisfies HomeSuggestion[],
  stats: { totalWords: '892,301', totalDays: '68 天', weeklyBars: [30, 45, 38, 62, 55, 78, 90] } satisfies HomeStats,
} as const;
```

配套 `bixinHomeContent.test.ts`：断言 quickActions 的 nav 都是合法 NavId、weeklyBars 长度 7 且值在 0-100、recentProjects 长度 3。

### 3b. Hero 区

**文件**：重写 `home/HeroSection.tsx`（props 改为 `{ onContinueWriting: () => void; onNewProject: () => void }`，保持不变即可——现签名就是这个）。

DOM：

```
section.bixin-hero-section (aria-labelledby="bixin-hero-heading")
├─ img.bixin-hero__backdrop (src=bixinAssets.homeBackdrop, alt="", aria-hidden)
├─ div.bixin-hero__copy
│   ├─ span.bixin-hero__bubble  文案 = heroBubble
│   ├─ h1#bixin-hero-heading  两行 span，文案 = heroTitleLines（第二行含 .bixin-hero__accent 绿色强调）
│   ├─ p.bixin-hero__subtitle  文案 = heroSubtitle
│   ├─ div.bixin-hero__actions：button "继续写作"（onContinueWriting）+ button "新建作品"（onNewProject）
│   └─ ul.bixin-hero__chips  5 个 li，文案 = featureChips，每个前置 lucide 图标
│       （依次 Lightbulb, UserRound, GitBranch, Globe2, FileCheck，全部 aria-hidden）
└─ img.bixin-hero__robot (src=bixinAssets.heroRobot, alt="", aria-hidden)
```

CSS 关键值（`bixin-home.css`）：hero 高 300px、`position: relative`、圆角 `var(--bixin-radius-card)`、overflow hidden；backdrop 绝对定位铺满 `object-fit: cover`；robot 绝对定位 right: 24px、bottom: 0、高 280px、`object-fit: contain`；标题字号 56px/行高 1.1、font-weight 900、第一行色 `var(--bixin-ink)`、`.bixin-hero__accent` 色 `var(--bixin-green-600)`；chips 为白底胶囊。

### 3c. 仪表盘卡片

**新建目录文件**（全部在 `home/cards/`，每个配同名 test）：

1. `ChallengeCard.tsx`——props `{ challenge: HomeChallenge; onStart: () => void }`。`section` aria-label="今日创作挑战"。含：标题行（Trophy 图标 + "今日创作挑战" + span.bixin-status-pill "挑战中"）、`strong` 主题行 `主题：命运的转折点`（`主题：${challenge.topic}`）、描述 p、奖励行 `奖励：创作能量 +80`、img mascotChallenge（alt=""）、`button "立即挑战"` → onStart、底部 participants 文案。背景 `var(--bixin-gradient-challenge)`、白字。
2. `CopilotCard.tsx`——props `{ actions: readonly string[]; onPick: (action: string) => void }`。aria-label="AI 陪写"。img mascotCopilot、"需要我帮你：" 标签 + N 个按钮（文案 = actions 元素）、`button "开始陪写"` → `onPick('续写下一章')`。每个动作按钮点击 → `onPick(该文案)`。背景 `var(--bixin-gradient-copilot)`。
3. `QuickGenCard.tsx`——props `{ actions: HomeQuickAction[]; onNavigate: (nav: NavId) => void }`。aria-label="快速生成"。img mascotQuickgen、每项渲染 `button`（文案 = label，右侧 ArrowRight 图标），点击 → `onNavigate(item.nav)`。背景 `var(--bixin-pop-orange-soft)`。
4. `RecentProjectsRow.tsx`——props `{ projects: HomeRecentProject[]; onOpen: (id: string) => void; onNew: () => void; coverSrc?: string }`。aria-label="最近项目"。每个项目渲染 `button.bixin-recent-card`：封面 img（第一个项目用传入 `coverSrc ?? bixinAssets.projectCover`，其余用 `bixinAssets.projectCover`）、genre 徽章、标题、latestChapter、words + 进度条（div.bixin-recent-card__track > span 宽 `${progressPercent}%`）。末尾 `button.bixin-recent-card--new` 文案 "新建作品" → onNew。onOpen 点击项目时调用（App 层接 toast，见 3d）。
5. `AiSuggestionsCard.tsx`——props `{ suggestions: HomeSuggestion[] }`（无回调）。aria-label="AI 建议"。标题 "AI 建议" + `button "换一换"`。列表 ul>li 渲染 text。「换一换」为纯内部行为：组件内 `useState` 持有起始下标，点击后下标 +1 对 `suggestions.length` 取模，列表从该下标起循环排列显示。

每个卡片的测试至少：标题可访问名存在、主按钮点击回调被调、（RecentProjectsRow）渲染 3 个项目标题。

### 3d. 组装

**文件**：`home/HomeDashboard.tsx` 重写（原四卡组件文件 `ProjectOverviewCard/ChapterProgressCard/CalendarCard/WritingGoalsCard/SceneScheduleCard/CharacterNetworkCard/BixinProgressRing` 保留在磁盘上不 import——它们成为死代码，不删除，不修改）。

新 `HomeDashboard` props：

```ts
interface HomeDashboardProps {
  onOpenProject: () => void;      // 保留（RecentProjectsRow 第一个项目点击时调用）
  coverSrc?: string;
  projectId?: string;
  onNavigate: (nav: NavId) => void;      // 新增
  onStartWriting: () => void;            // 新增：跳写作页
  onShowMessage: (message: string) => void; // 新增
}
```

（明确：旧 prop `onAddSchedule` 从 `HomeDashboard`、`BixinHomePage`、`App.tsx` 三处删除；`App.tsx` 里对应的 `onAddSchedule={() => setActiveNavigation('world')}` 一并删除。）

布局（类名）：

```
div.bixin-dashboard
├─ div.bixin-dashboard__cards-row   → ChallengeCard + CopilotCard + QuickGenCard（三列 grid：1.2fr 1fr 1fr）
├─ RecentProjectsRow
└─ AiSuggestionsCard
```

接线：

- ChallengeCard.onStart → `onShowMessage('创作挑战暂未在演示版开放。')`
- CopilotCard.onPick(action) → `onStartWriting()`（跳写作页；action 参数丢弃，本版不透传）
- QuickGenCard.onNavigate → `onNavigate`
- RecentProjectsRow.onOpen(第一个项目)= `onOpenProject`，其余项目 → `onShowMessage('该演示项目暂未开放。')`；onNew → `onShowMessage('新建项目功能暂未在演示版开放。')`

**文件**：`home/BixinHomePage.tsx` 修改：

- `{isHome ? <BookForeground /> : null}` 整行删除（`BookForeground.tsx` 文件保留成为死代码）。
- `HomeDashboard` 传新 props：`onNavigate={props.onSelectNavigation}`、`onStartWriting={props.onContinueWriting}`、`onShowMessage={props.onShowMessage}`。
- `NavigationRail` 传 `onNewProject={props.onNewProject}`、`onShowMessage={props.onShowMessage}`。
- 其余（SceneLayer、HeroSection、workbench 分支）不动。

**测试更新**：`BixinHomePage.test.tsx`、`App.test.tsx`、`HomeDashboard.test.tsx` 中所有引用旧四卡（项目总览/章节进度/日历/写作目标/场景安排/人物网络）的断言删除，替换为：首页渲染 "今日创作挑战"、"AI 陪写"、"快速生成"、"最近项目"、"AI 建议" 五个区块的可访问名；点击 QuickGen 的「小说大纲」后 outline 导航被激活（`aria-pressed`）；点击「开始陪写」后写作页出现。旧卡组件自身的 `*.test.tsx`（组件单测独立于页面）保留不动。**判定规则：组件文件保留，其单测保留；只有页面级测试（HomeDashboard/BixinHomePage/App）改写。**

---

## Task 4：写作页三栏重构（对照 写作.png）

**文件**：`writing/WritingView.tsx`、`writing/WritingView.css`、`writing/ChapterList.tsx`、`writing/ChapterEditor.tsx`、`writing/EchoChat.tsx`。

### 4a. 布局

`.bixin-writing` 改为三列 grid：`264px minmax(0, 1fr) 320px`，列间距 14px，高度 100%。顶部现有 header `.bixin-writing__bar` 保留（返回首页/委派本章/状态），追加两个展示态按钮 "预览"（若中栏已有预览开关则不加——见 4c，编辑器已有预览按钮，故顶栏**不加**预览）和 "更多" → toast `'更多操作暂未在演示版开放。'`。

### 4b. ChapterList → 章节目录

props 不变（`chapters, selectedNum, onSelect`）。新 DOM：

```
nav.bixin-chapter-list (aria-label="章节列表" 不变)
├─ div.bixin-chapter-list__head：strong "章节目录" + span 计数 `${chapters.length} 章`
├─ input[type=search] (aria-label="搜索章节", placeholder="搜索章节…")
│   过滤逻辑：本地 useState，按 title 包含匹配（大小写不敏感）过滤列表
├─ ul（现有按钮列表结构与 aria-pressed 保留；每行右侧加状态徽章
│   span.bixin-chapter-list__badge[data-status=<status>]，文案沿用现有 STATUS_LABEL）
└─ div.bixin-chapter-list__progress
    ├─ strong "本章进度"
    ├─ span `${selectedNum} / ${chapters.length} 章`
    ├─ div.bixin-chapter-list__track > span（宽 = `selectedNum/chapters.length*100`%）
    └─ span 总字数 `${chapters 里 words 求和} / 150,000 字`（150000 为固定展示目标）
```

徽章配色（`WritingView.css`）：complete → 绿（`--bixin-green-100`/`--bixin-green-700`）、drafting → 黄（pop-yellow-soft/#8a6a1f）、revision → 蓝（pop-blue-soft/pop-blue）、published → 青（pop-cyan-soft/pop-cyan）、其他 → 灰。

**测试**（`ChapterList.test.tsx` 若无则新建）：搜索框输入过滤后列表条目减少；徽章文案渲染；aria-pressed 保持。

### 4c. ChapterEditor → 纸面编辑器

props 不变。改动：

1. 顶部加工具栏 `div.bixin-editor__toolbar (role="toolbar", aria-label="编辑工具")`，按钮从左到右：撤销、重做、加粗、斜体、下划线、引用、无序列表。行为：
   - 加粗/斜体/下划线/引用/无序列表：对 textarea 当前选区做 markdown 包裹/前缀。实现函数 `applyMarkdown(kind)`：读取 `textareaRef.current.selectionStart/End`，加粗包 `**`、斜体包 `*`、下划线包 `<u></u>`、引用行前加 `> `、列表行前加 `- `；无选区时在光标处插入包裹符并把光标置于中间。修改后 `dirty.current = true` 并 setContent。
   - 撤销/重做：`aria-disabled="true"`，点击无操作（原生 Ctrl+Z 已可用；不实现自定义栈）。
2. 底部加 AI 操作条 `div.bixin-editor__ai-bar`，按钮："润色"、"扩写"、"改写"、"对话"、"Ask Hermes"。全部为**展示态**：点击调用新 prop `onAiAction: (label: string) => void`（WritingView 传入 → toast `'「${label}」请在右侧 Hermes 面板使用。'`）。
3. 页脚 `div.bixin-editor__stats`：`本章 ${countWordsLocal(content)} 字`、`预计阅读 ${Math.max(1, Math.round(countWordsLocal(content)/400))} 分钟`、现有保存状态 span 挪到这里（`role="status"` 保留）。
4. 现有预览开关、自动保存、chapterKey 重置逻辑全部保留。

**测试**（`ChapterEditor.test.tsx` 追加）：选中文本点「加粗」后 textarea value 含 `**选中文本**`；AI 操作条按钮触发 `onAiAction`；保存状态断言保持。

### 4d. EchoChat → Hermes 面板

保留全部现有逻辑（session、模型、offline 轮询、composer）。在 `.bixin-chat__header` 与 `.bixin-chat__log` 之间插入两个纯展示区块：

1. `div.bixin-chat__context (aria-label="当前上下文")`：标题 "当前上下文" + 5 个 chip（lucide `Check` 图标 + 文案）："当前章节"、"前一章节"、"大纲"、"人物关系"、"世界观"。静态渲染，无交互。
2. `div.bixin-chat__quick (aria-label="快捷能力")`：2×2 按钮，**不新增 prop**，行为完全在 EchoChat 组件内部：点击按钮直接调用组件内已有的 `send({ text: <预设文案>, model: models[0].id, attachments: [] })`。预设文案：
   - "续写下一段" → `'请基于当前章节续写下一段。'`
   - "润色选中内容" → `'请润色我当前选中的段落。'`
   - "检查人物OOC" → `'请检查本章人物是否有 OOC。'`
   - "检查世界观冲突" → `'请检查本章是否与世界观设定冲突。'`

**测试**（`EchoChat.test.tsx` 追加）：渲染后 "当前上下文" 与 4 个快捷按钮可访问名存在。（send 走网络的部分沿用现有测试的 mock 方式；若现有测试未 mock sendChatTurn，则仅断言按钮存在，不断言点击。）

---

## Task 5：人物页（对照 人物.png）

**文件**：`pages/CharactersPage.tsx`、`pages/CharactersPage.css`。逻辑（fetch/保存/导入/onboarding/updateSelected）全部保留，只改渲染层。

### 5a. 数据适配

`CharacterRecord`（API 类型，在 `noveloraApi.ts`）**不改**。展示所需的额外字段一律推导或用固定展示值：

- 头像：复用 `RelationsPage.tsx` 里的 `portraitKey` 逻辑——把该函数与 `FALLBACK_PORTRAIT` 提取到**新文件** `apps/web/src/features/novelora-cockpit/lib/portraitKey.ts` 并从两处 import（RelationsPage 改为 import，删除本地副本）。
- 角色定位徽章：`character.role` 原文显示。
- 弧光图数据：固定数组 `[{label:'起点',v:30},{label:'成长',v:45},{label:'转折',v:60},{label:'低谷',v:35},{label:'顿悟',v:70},{label:'高峰',v:90}]`，写在组件文件顶部常量 `ARC_POINTS`。

### 5b. 渲染结构

```
section.characters-page
├─ header.characters-page__header（现有 h2/状态/操作按钮保留；
│   新增布局：h2 "人物档案" + p 副标题 "管理你的角色，构建生动立体的人物群像"；
│   按钮区：现有「从文件导入」改文案为「批量导入」（onClick 不变），
│   新增 button "新建角色" class=bixin-btn--primary → 现有添加逻辑
│   （若当前页面没有添加角色逻辑，则新建：往 file.characters push
│     { id: `char-${Date.now()}`, name: '新角色', role: '配角' }，选中它，dirty=true））
├─ div.characters-page__body（两列 grid：280px 1fr）
│   ├─ aside.characters-page__list (aria-label="角色列表")
│   │   每项 button[aria-pressed]：img 头像(characterPortraits[portraitKey(id)]) + strong 名 + span 徽章(role)
│   └─ div.characters-page__detail（selected 存在时渲染）
│       ├─ div.characters-page__banner
│       │   ├─ img (characterBanners[portraitKey(selected.id)], alt="")
│       │   ├─ h3 = selected.name（内联可编辑保留：现有 name input 移到这里，样式透明大字）
│       │   └─ span 徽章 = selected.role
│       ├─ div.characters-page__tabs (role="tablist", aria-label="角色资料")
│       │   7 个 tab："档案"(选中, aria-selected=true) + "关系/经历/笔记/语音/设定历史"(disabled, aria-disabled)
│       │   仅装饰性 tablist：不实现切换，点击 disabled 项无操作
│       └─ div.characters-page__grid（2 列）
│           ├─ 卡「基础信息」：现有 role/goal/knows 等编辑字段（label+input/textarea 原封搬入）
│           ├─ 卡「人物弧光」：内联 SVG 折线图组件（见 5c）
│           ├─ 卡「目标与动机」：显示 selected.goal（无则 "尚未填写"），图标 Target
│           ├─ 卡「已知信息」：显示 selected.knows（无则 "尚未填写"），图标 Eye
│           └─ 卡「人物关系」：该角色关联的 relationships 里对方头像行（img 列表，
│               点击 → 新 prop onOpenRelations?: () => void；App.tsx 传
│               () => setActiveNavigation('relations')）
```

### 5c. 弧光折线图

**新建** `pages/CharacterArcChart.tsx` + test。props `{ points: { label: string; v: number }[] }`。渲染 `svg (role="img", aria-label="人物弧光")`，viewBox `0 0 300 120`：x 均分、y = `110 - v`，`<polyline fill="none" stroke="var(--bixin-green-600)" stroke-width="2">` + 每点 `<circle r=3>` + 底部 `<text>` 标签。测试：渲染后 `getByRole('img', { name: '人物弧光' })` 存在、circle 数 = points 数。

**测试更新**（`CharactersPage.test.tsx`）：现有交互断言（选择角色、编辑保存、导入、onboarding）保持；新增：banner 内 heading 显示选中角色名、tablist 存在且 "档案" aria-selected。

---

## Task 6：关系页（对照 关系.png）

**文件**：`types.ts`、`CharacterGraph.tsx`、`CharacterGraph.css`、`pages/RelationsPage.tsx`、`pages/RelationsPage.css`。

### 6a. 类型扩展

`types.ts`：`RelationshipKind` 扩为

```ts
export type RelationshipKind =
  | 'ally' | 'neutral' | 'rival' | 'unknown'      // 现有，勿删（fixture 与死组件引用）
  | 'friend' | 'deal' | 'kin' | 'mentor';          // 新增
```

`RelationsPage.tsx` 的 `RELATIONSHIP_KINDS` 数组加入新四种。

### 6b. CharacterGraph 升级

1. 图例改中文映射，组件顶部常量：

```ts
const KIND_META: Record<RelationshipKind, { label: string }> = {
  ally: { label: '亲密 / 信任' }, friend: { label: '友好 / 合作' },
  rival: { label: '竞争 / 敌对' }, deal: { label: '利用 / 交易' },
  kin: { label: '亲属 / 血缘' }, mentor: { label: '师徒 / 指导' },
  neutral: { label: '中立' }, unknown: { label: '其他' },
};
```

图例列表由 `KIND_META` 全量渲染（8 项），`aria-label="关系图例"`。

2. 边样式（`CharacterGraph.css`，全部新增/覆盖，`.character-graph__edge--<kind>`）：
   - ally: stroke `var(--bixin-green-600)`；friend: `var(--bixin-pop-blue)`；rival: `var(--bixin-pop-pink)`（加 `stroke-dasharray: 6 3`）；deal: `var(--bixin-pop-orange)`；kin: `var(--bixin-pop-cyan)`；mentor: `var(--bixin-pop-purple)`；neutral: `var(--bixin-muted)`；unknown: `var(--bixin-subtle)` + `stroke-dasharray: 2 4`。
   - 保留现有 `fill: none` 规则（黑块回归的修复，不许动）。
3. 边中点标签：在 SVG 内为每条边加 `<text class="character-graph__edge-label">`，坐标取 from/to 中点，内容 = `relationship.label`，`font-size: 8`，`fill: var(--bixin-muted)`。
4. 节点：现有 img+名字结构保留；CSS 把 img 改为 44px 圆形（`border-radius: 50%`、2px 白边框 + `--bixin-shadow-portrait`）。
5. 新 prop `onSelectCharacter?: (id: string) => void`；节点 li 内套 `button`（aria-label 保持 `${name}, ${role}`），点击回调。

### 6c. RelationsPage 布局

```
section.relations-page
├─ header（现有保留，h2 文案改 "人物关系网"，加 p 副标题 "可视化角色关系，洞察故事脉络"）
├─ div.relations-page__body（两列 grid：1fr 300px）
│   ├─ div.relations-page__canvas
│   │   ├─ CharacterGraph（传 onSelectCharacter=setFocusId）
│   │   └─ div.relations-page__controls：button "放大" / "缩小" / "居中"
│   │       实现：useState scale (0.6–2, 步长 0.2, 初始 1)；
│   │       canvas 内层 div style transform: `scale(${scale})`；「居中」重置为 1
│   └─ aside.relations-page__detail (aria-label="关系详情")
│       focusId 为空 → p "点击图中角色查看关系详情"
│       否则：
│       ├─ img 头像 + strong 名 + span role
│       ├─ dl 关系概览：按 kind 统计该角色的关系数（KIND_META label + count，只列 count>0 的）
│       └─ ul.relations-page__key-list：该角色每条关系一行：
│           对方名 + kind label + label 编辑 input（沿用现有 updateLabel 逻辑）
└─ （删除旧的底部 relations-page__labels 平铺列表；updateLabel 函数保留复用）
```

`focusId` 初始值：`file.characters[0]?.id ?? null`。

**测试更新**（`RelationsPage.test.tsx`、`CharacterGraph.test.tsx`）：图例 8 项中文文案；点击节点后详情栏出现该角色名；label input 修改仍触发保存（现有断言改到新位置）；放大/缩小按钮存在。

---

## Task 7：大纲/世界观（对照 大纲.png、世界观.png，一次改造）

**文件**：`pages/MarkdownDocumentPage.tsx`、`pages/MarkdownDocumentPage.css`。新建 `pages/MarkdownOutlineTree.tsx`（+test）与 `lib/markdownOutline.ts`（+test）。

### 7a. lib/markdownOutline.ts

```ts
export interface OutlineNode { level: number; text: string; line: number; }
export function parseOutline(markdown: string): OutlineNode[]
```

逐行扫描 `/^(#{1,3})\s+(.+)$/`，返回 level(1-3)/text/行号。忽略代码块围栏内的行（跟踪 ``` 开关状态）。测试：三级标题解析、代码块内 `# not a heading` 被忽略、空文档返回 []。

### 7b. 页面布局

保留：header（含导入/完成/状态）、DomainOnboarding、DocumentImportPreview、自动保存。编辑主体改为：

```
div.markdown-document-page__body（三列 grid：220px 1fr 260px）
├─ aside.markdown-document-page__toc (aria-label="文档目录")
│   MarkdownOutlineTree：props { nodes: OutlineNode[]; onJump: (line: number) => void }
│   渲染按 level 缩进的 button 列表；onJump 实现：计算该行前的字符偏移，
│   设置 textarea.selectionStart/End = 偏移并 focus + scroll（textarea ref 提到页面层）
├─ div.markdown-document-page__paper（现有 textarea 保留，ref 上提）
└─ aside.markdown-document-page__info (aria-label="文档概览")
    ├─ 卡「文档统计」：dl —— 总字数 = content.replace(/\s/g,'').length；
    │   预计阅读 = Math.max(1, Math.round(字数/400)) 分钟；
    │   章节数 = parseOutline(content).filter(n => n.level <= 2).length
    ├─ 卡「AI 建议」：静态 ul，两条文案：
    │   "建议在当前幕强化主角的内心冲突，提升转折张力。"
    │   "可以为次要角色补充动机线索，避免工具人化。"
    └─ 卡「导入说明」：p "使用大纲模板可快速构建完整结构，也可以从本地文档导入。"
```

「专注模式」开关（世界观稿右下）：不实现。

**测试更新**（`MarkdownDocumentPage.test.tsx`）：现有断言保持；新增：输入含 `# 第一卷\n## 第一幕` 的内容后目录出现两个按钮；文档统计显示的字数随输入变化。

---

## Task 8：工作流换皮（对照 工作流.png）

**文件**：`pages/WorkflowCanvasPage.tsx`、`pages/WorkflowCanvasPage.css`。**不改** `workflowTypes.ts`、graph 操作函数、运行逻辑。

1. 节点类型着色：组件顶部常量

```ts
const NODE_TYPE_META: Record<WorkflowNodeType, { label: string; tone: string }> = {
  explore: { label: 'AI 任务', tone: 'blue' },  gene: { label: 'AI 任务', tone: 'blue' },
  outline: { label: 'AI 任务', tone: 'blue' },  write: { label: 'AI 生成', tone: 'purple' },
  deai: { label: '润色', tone: 'purple' },       review: { label: '一致性检查', tone: 'cyan' },
  memory: { label: '记忆', tone: 'cyan' },       gate: { label: '条件判断', tone: 'yellow' },
  manual: { label: '人工审核', tone: 'orange' },
};
```

节点卡 root 加 `data-tone={NODE_TYPE_META[node.type].tone}`，CSS 按 `[data-tone=blue]` 等给左边框 4px 色条 + 对应 `--bixin-pop-*-soft` 背景：blue→pop-blue、purple→pop-purple、cyan→pop-cyan、yellow→pop-yellow、orange→pop-orange。选中节点：`box-shadow: 0 0 0 2px var(--bixin-green-600)`。
2. manual 节点卡内加徽章 span "待审核"（orange-soft 底）。
3. 边渲染：若当前为直线/简单连线，改为 SVG path 三次贝塞尔（控制点 x 取两端中点）；`edge.loop === true` 的边 stroke `var(--color-state-danger)` 并在中点加 `<text>` "未通过"，普通边 stroke `var(--bixin-green-600)`，从 gate 节点出发的非 loop 边加 `<text>` "通过"。（若现有实现已用 SVG，只改颜色与标签。）
4. 左侧节点库：按 `NODE_TYPE_META` 的 label 分组渲染现有按钮（分组标题 strong：AI 任务 / 条件判断 / 人工审核 / 其他），按钮行为不变。
5. 右侧检查器：现有表单外层套卡片 div 加标题 "节点设置"；「模型」select 下方加温度滑杆：`input[type=range] min=0 max=1 step=0.05 aria-label="温度"`，值存 `useState`（**不写入 graph**，纯展示态），旁边 span 显示当前值。
6. 顶部操作行：现有按钮保留，新增展示态 button "发布" class 主按钮 → toast/status `'发布功能暂未在演示版开放。'`。

**测试更新**（`WorkflowCanvasPage.test.tsx`）：现有断言全部保持通过；新增：任一 manual 节点渲染 "待审核" 徽章；温度滑杆存在且可调（fireEvent.change 后显示值变化）；「发布」按钮点击后出现状态文案。

---

## Task 9：收尾验收

1. 全量跑：`npm run test:web && npm run lint:web && npm run build:web`（Windows PowerShell 下分三条依次跑）。
2. 手工冒烟（`npm run dev:web` 后浏览器打开，从首页依次点 8 个导航项）确认：
   - 首页：hero + 三卡 + 最近项目 + AI 建议渲染，无旧四卡。
   - 写作：三栏，左侧搜索可过滤，编辑器加粗可用，右侧 Hermes 面板有上下文与快捷能力。
   - 人物：列表-横幅-网格；关系：图例中文、右栏详情。
   - 大纲/世界观：目录树 + 统计栏。工作流：彩色节点 + 温度滑杆。
   - 窗口任意拉伸，界面整体等比缩放、无卡片溢出遮挡场景。
3. 检查未使用 import（`noUnusedLocals` 会在 build 卡住，逐个清理）。
4. 不 commit，报告改动文件清单与测试计数。

## 附：明确不做的事

- 不接真实 AI 能力：快捷能力按钮只发预设 prompt 文本或 toast。
- 不实现 tab 切换（人物页 6 个灰 tab）、专注模式、画布小地图、全屏/锁定。
- 不删除任何现有组件文件（死代码保留），不动 `toy-writer-cockpit/`、`cockpit.css`、`noveloraMockProject.ts`。
- 不引入新依赖（`marked` 与 `lucide-react` 已在依赖里；markdown 目录解析自己写正则，不装库）。
