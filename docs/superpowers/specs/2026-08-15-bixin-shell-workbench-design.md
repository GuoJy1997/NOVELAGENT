# 笔心壳 + 本地工作台设计规格

日期：2026-08-15
状态：已评审

权威视觉：本机 `http://127.0.0.1:4173/`（git worktree `.worktrees/bixin-home-fidelity`，分支 `codex/bixin-home-fidelity`，含该树工作区未提交微调）。
权威工作台：`D:\NOVELAGENT` 分支 `feature/toy-writer-cockpit-ui` 上已评审的本地 MVP（写作 / 大纲 / 人物 / 关系 / 世界观 / 任务 + `services/api`）。

本规格只做一件事：把 4173 的笔心首页壳接到主仓库，工作台七页都在这套壳里打开。5173 上另一套 Echo 首页壳退出直播树。

相关文档：

- 工作台能力：`docs/superpowers/specs/2026-08-15-local-mvp-workbench-design.md`（本规格不改配方、文件内核、hermes）
- 首页视觉宪章：`docs/superpowers/specs/2026-08-14-bixin-desktop-home-visual-design-system.md`（品牌与三层空间；实现仍是纯 CSS，不引入 Tailwind）

## 1. 目标

作者在 `http://localhost:5173/` 看到的首页，必须是 4173 那套笔心框（场景、书、侧栏、顶栏、英雄区、六张卡片），而不是 Echo `AppShell` + 5173 `HomeDashboard`。

侧栏七项都能打开已有工作台页，且不离开笔心框。

证明三件事：

1. 5173 首页图层顺序与 4173 一致：场景 → 界面 → 书。
2. 侧栏文案为工作台七项，点了进对应真页面。
3. 写作 / 大纲 / 人物 / 关系 / 世界观 / 任务不再套 Echo `AppShell`。

## 2. 不做

- 不合并 `codex/bixin-home-fidelity` 进 feature 分支（拷文件，不 merge 历史）。
- 不把工作台搬进 worktree。
- 不停 4173、不删 worktree，直到 5173 首页对照通过。
- 不改 `services/api`、配方、hermes、Electron spawn。
- 不做伏笔台账、关系图拖节点、节点画布、RAG、云同步。
- 不把旧 StructureMap / ChapterSwimlane / AIWritingPartner / InspirationVault / MemoryLayer / ClueAttributionFlow 挂回产品。
- 不为对齐本规格引入 Tailwind。

## 3. 信息架构

侧栏外观用 4173 `NavigationRail`（lucide 图标、笔心轨道样式）。文案与行为用工作台七项：

| 侧栏 | 主区 |
|---|---|
| 首页 | 4173 `HomeDashboard`（六张卡片；打开项目 / 继续写作进写作页） |
| 写作 | 现有 `WritingView` |
| 大纲 | 现有 `MarkdownDocumentPage`（`outline`） |
| 人物 | 现有 `CharactersPage` |
| 关系 | 现有 `RelationsPage` |
| 世界观 | 现有 `MarkdownDocumentPage`（`world`，提示：这是设定编辑，不会召唤 Agent。） |
| 任务 | 现有 `TaskBoardPage` |

`nav.ts` 的 `NavId` 保持：`home | writing | outline | characters | relations | world | tasks`。

4173 原六项里的「项目」「统计」不再出现。「设置」仍是侧栏底装饰，本轮不接页面。

英雄区按钮沿用 4173 文案：继续写作、新建项目。新建项目仍只提示演示不可用，不建项目。

## 4. 壳

所有七个视图都画在同一套笔心框里：

```text
.bixin-home
  .bixin-home__frame
    SceneLayer
    .bixin-home__interface
      NavigationRail
      .bixin-home__stage
        BrandHeader
        HomeTopbar
        HeroSection          // 仅首页
        main                 // 首页=卡片；其它=工作台页
    BookForeground
```

约束：

- 进写作不再切换到 Echo `AppShell`（4173 当前行为作废）。
- `ProjectSidebar`、`EchoHeroCopy`、`EchoHeroBackground` 退出直播 `App.tsx`。
- `AppShell` 本轮不再被 `App.tsx` 引用；文件可留着，但不挂产品。
- 图层顺序锁死：场景、界面、书。装饰图 `aria-hidden`，`alt=""`，`draggable={false}`。
- 可见中文；禁止 `—` / `–`。
- 颜色 / 阴影 / 圆角走 `tokens.css` 的 `--bixin-*` 与现有 `--echo-*`。工作台页已有旁路 CSS（如 `TaskBoardPage.css`）继续用，不重写整份 `echo.css`。

`BixinHomePage` 增加主区插槽（或等价的 `view` + `children`）。首页自己渲染 4173 卡片；其它 `NavId` 由 `App.tsx` 把现有页面塞进 `main`。

## 5. 文件

从 4173 **正在跑的工作副本**拷进 `D:\NOVELAGENT`（含该树未提交的 `SceneLayer` / 书前景 / `bixin-home.css` 微调），不是只拷 `e87cd42`。

拷入：

- `apps/web/src/features/novelora-cockpit/components/home/` 整树（覆盖 5173 现有 `HomeDashboard.tsx` / `ProgressRing.tsx`）
- `apps/web/src/styles/bixin-home.css`
- `apps/web/src/styles/bixin-home.test.ts`
- `apps/web/src/assets/bixin/`
- `assetRegistry.ts` 增加 `bixinAssets`（`appIcon` / `scene` / `book` / `projectCover`）及对应测试键
- `tokens.css` 增加 4173 的 `--bixin-*` 块
- `apps/web/package.json` 增加 `lucide-react`（与 4173 同为 `^0.441.0`）

改接线：

- `apps/web/src/styles/global.css`：`@import './bixin-home.css'`
- `apps/web/src/App.tsx`：笔心框 + 七项切主区
- `NavigationRail.tsx`：七项文案改为工作台顺序，样式与 lucide 用法保持 4173
- `BixinHomePage.tsx`：主区插槽；仅首页渲染英雄区 + 4173 卡片

停引用（本轮不强制删文件）：

- `EchoHeroCopy`、`EchoHeroBackground`、5173 旧 `home/HomeDashboard`（已被覆盖）、`ProjectSidebar` 在 `App.tsx` 中的使用

不动：`services/api/**`、`components/pages/**`、`components/writing/**`（除测试里对 Echo 壳的断言）、配方、hermes 客户端。

## 6. 测试

按 role / 可访问名查询。改交互必须改断言。

`App.test.tsx`：

- 根是 `.bixin-home`，不是 `.echo-page.cockpit-scroll`
- 无 `.echo-hero-background`、无 `Project navigation`、无 “Bring your story to life with AI”
- 导航 `role="navigation"` 名为「工作区导航」；按钮顺序：首页、写作、大纲、人物、关系、世界观、任务
- 标题「写出让世界铭记的故事」；按钮「继续写作」「新建项目」「打开项目」
- 点「大纲」出现大纲编辑区；点「继续写作」出现写作区且仍在 `.bixin-home` 内；「返回首页」回到「我的项目」卡片
- 新建项目 / 添加日程仍走演示提示（文案跟 4173 / 现工作台已有中文，测哪个按钮用哪个文案，禁止英文 New Project / AI Assist / Continue Writing）

组件测试：

- 带上 4173 的 `BixinHomePage.test.tsx`、`HomeDashboard.test.tsx`、`HomeTopbar.test.tsx`
- `BixinHomePage` 导航期望从六项改成七项
- `assetRegistry.test.ts` 增加 `bixinAssets` 四键
- `bixin-home.test.ts` 原样迁入
- `echo.test.ts` 里只服务旧 Echo 首页网格（`.echo-home-dashboard` / `.echo-home-card--*`）的契约：改成不再要求直播树使用它们，或删这些断言。禁止为了过测试而把废弃网格画回去

验证命令（cwd 注意）：

```bash
npm run test:web
npm run lint:web
npm run build:web
```

对照：5173 首页与 4173 并排看场景、书、侧栏、卡片；再点七项确认工作台页仍在笔心框内。

## 7. 验收

1. `http://localhost:5173/` 首页不是 Echo 白壳；场景图与书前景来自 `bixinAssets`。
2. 侧栏七项中文，无「项目」「统计」产品项。
3. 七项都能打开对应工作台页，URL 仍是 Vite 5173，api 仍是 8787。
4. 世界观保存与配方不写 `world.md` 的既有契约不因换壳而坏（本规格不改 api；回归用已有页面测试 + 既有冒烟路径）。
5. 4173 保持可开，作为视觉对照，直到作者说可以停。
