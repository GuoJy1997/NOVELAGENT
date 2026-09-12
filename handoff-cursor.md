# 笔心 UI 优化交接（给 Codex）

交接日期：2026-08-21。作者：Cursor。  
你的任务：**只做视觉 / 空间 / 控件质感**，把直播 UI 拉回 Codex 笔心标准。不要开新功能，不要改 Hermes / API / 导入逻辑。

旧文件 `handoff.md`、`handoff-work.md` **不要当当前真相**。功能接线以 git 工作区 + 本文第 6 节为准。

---

## 0. 一句话

直播壳已经是 `BixinHomePage`（场景 → 界面 → 书），但作者认为 **现在的画面还不是笔心标准**：工作台页尤其像功能面板贴在框里，首页卡片也还没长成「故事世界橱窗」。请按视觉宪章把同一套笔心语言铺满首页和工作台，不要发明第二套皮。

---

## 1. 你要做的 / 不要做的

### 做

- 对照视觉宪章，优化 **首页三层空间**、卡片、导航、按钮、字体、遮挡、云层延伸。
- 把 **写作 / 大纲 / 人物 / 关系 / 世界观 / 任务** 画进 `.bixin-home` 里，看起来仍是笔心，而不是白底编辑器。
- 令牌只用 `--bixin-*`。新样式写 `apps/web/src/styles/bixin-home.css` 或页面旁路 CSS（如已有的 `WritingView.css`），继续引用 `--bixin-*`。
- 改几何 / 层级 / 令牌后，同步改 `apps/web/src/styles/bixin-home.test.ts` 里锁死的契约。

### 不要做

- 不要引入 Tailwind。宪章里写 Tailwind 是历史目标方案；仓库是 **纯 CSS**，有独立决策前禁止为对齐本文上 Tailwind。
- 不要复活 Echo：`AppShell`、`ProjectSidebar`、`EchoHeroCopy`、mint 液态玻璃、`--color-mint-*` / `--echo-*` 当直播铬。
- 不要把 StructureMap / ChapterSwimlane / InspirationVault 挂回产品。
- 不要开第二个 Vite 首页，也不要把 `localhost:5173` 和 `127.0.0.1:4173` 当成两套产品。一个笔心框。
- 不要改对话路由、模型列表、workspace `cwd`、导入会话、文件核 API。
- 不要做 `home-showcase.json` LLM 二次快照（已拍板未实现，那是功能，不是这次 UI）。
- 不要提交、不要 push，除非作者明确说。

---

## 2. 权威视觉

| 项 | 值 |
|---|---|
| 宪章 | `docs/superpowers/specs/2026-08-14-bixin-desktop-home-visual-design-system.md` |
| 规则 | `.cursor/rules/bixin-ui-only.mdc` |
| 直播壳 | `apps/web/src/features/novelora-cockpit/components/home/BixinHomePage.tsx` |
| 令牌 | `apps/web/src/styles/tokens.css` 的 `--bixin-*` |
| 样式 | `apps/web/src/styles/bixin-home.css` |
| 资产 | `assetRegistry.ts` → `bixinAssets`（`apps/web/src/assets/bixin/`） |
| 契约测试 | `apps/web/src/styles/bixin-home.test.ts` |

宪章要点（不要凭记忆发明）：

- 三层：Scene `z-index: 10` / Interface `20` / Book `30`。书可轻压人物关系网非功能区。
- 叙事：地图被观察、被放大、变成身后世界。禁止「书 + 插画 Banner + SaaS Dashboard」。
- 场景必须延伸到卡片后方，底部不能突然变纯白后台。
- 品牌：**笔心** / 「AI写作工作室」。首页不出现 NovelAgent。
- 基准画布约 1728×972；现码用 fit-scale 把 1416×786 舞台铺进框。
- 可见文案中文。禁止可见 `—` / `–`。

历史参考预览曾是 `http://127.0.0.1:4173/`。那是旧树，**不要回去那棵 worktree 改**。当前改 `apps/web`，本地看 `http://localhost:5173/`。

---

## 3. 先看哪些文件

首页：

```
apps/web/src/features/novelora-cockpit/components/home/
  BixinHomePage.tsx
  SceneLayer.tsx
  BookForeground.tsx
  BrandHeader.tsx
  NavigationRail.tsx
  HomeTopbar.tsx
  HeroSection.tsx
  HomeDashboard.tsx
  cards/*
```

工作台（都已经是 `BixinHomePage` 的 `children`，壳不要拆掉）：

```
App.tsx                              # 导航切换
components/writing/WritingView.tsx   # 三栏：目录 / 编辑器 / Hermes 对话
components/writing/WritingView.css
components/pages/MarkdownDocumentPage.tsx   # 大纲、世界观
components/pages/CharactersPage.tsx
components/pages/RelationsPage.tsx
components/pages/TaskBoardPage.tsx
```

死代码：不要扩展 `components/` 里未挂到 `App.tsx` 的 Echo 驾驶舱件。

---

## 4. 建议优化顺序

1. **首页空间**：场景是否铺到卡片后；书层遮挡是否自然（8–18px 书、16–30px 书签）；卡片是否「长在云里」而不是贴白底。
2. **首页卡片质感**：圆角、玻璃、描边、主按钮（`--bixin-green-600`）。人物关系网、世界观日程、项目封面。
3. **工作台**：写作三栏、Markdown 页、人物表、关系图、任务看板。用同一套 `--bixin-*` 卡面 / 按钮 / 输入，不要另起灰白编辑器。
4. **控件**：`.bixin-btn`、搜索、导航选中态，对照宪章第 12–13 节。

作者没有给像素级新稿。以宪章为验收，不要凭空换配色或换吉祥物叙事。

---

## 5. 硬约束（测试会咬）

- 组件测试按 **role / 可访问名** 查（中文：`工作区导航`、`Hermes 对话`、`给 Hermes 的消息`、`发送` 等）。改结构必须保住 ARIA。
- `bixin-home.test.ts` 锁了 scene 坐标、z-index、fit-scale、`--bixin-green-600: #1ea44f`、按钮 44px 高、禁止 `.bixin-btn` 用 `--echo-*`。改 CSS 先读这个文件。
- CSS 契约测试用 `process.cwd()` 读源文件，必须在 `apps/web` 下跑（根目录 `npm run test:web` 已保证）。
- 标识符英文，UI 文案中文。

验证：

```bash
npm run test:web
npm run lint:web
npm run build:web
```

上次 Cursor 侧：web **432** 测试绿；oxlint 仅既有 optional-chaining warning。你改完必须再跑，不要凭这份数字宣称仍绿。

---

## 6. 功能接线（只读，别拆）

Cursor 刚把对话接回 **本机 Hermes**。UI 可以变，这些行为不能变：

| 行为 | 现状 |
|---|---|
| 对话 | `POST /hermes/v1/chat/completions` → Vite 代理 `127.0.0.1:8642`，Bearer `novelora-dev-key` |
| 模型下拉 | `GET /hermes/v1/models`（DeepSeek / GLM 是 Hermes 上的模型名，不是直连 DeepSeek） |
| 书目录 | `GET /api/projects/:id` 的 `rootPath` 作为 `cwd` 并写进首轮说明 |
| Hermes 挂了 | 文案「Hermes 离线。请确认本机网关已启动。」禁止静默退回 `/api/llm/chat` |
| `/` `@` | 仍走 `/hermes/v1/skills` 等目录 |
| 导入 | 也走 `streamChat`（Hermes），不要改回 DeepSeek |

相关文件：`lib/hermesChat.ts`、`lib/hermesCatalog.ts`、`lib/chatSession.ts`、`components/writing/EchoChat.tsx`。改 className / 布局可以；改 URL、header、body 字段不行。

本地三个进程：`npm run dev:api`（8787）+ `npm run dev:web`（5173）+ 本机 Hermes（8642）。

---

## 7. 不是这次的事

- `home-showcase.json`：人物网 / 场景日程 / 项目气质句用 LLM 二次挑选。已设计，未写 spec，未实现。首页卡片现在是规则投影（世界观卡取 `##` 段）。
- 章节列表重复 React key（`桃园密码-270405:1`）。
- 世界观页仍可能有「这是设定编辑，不会召唤 Agent.」类旧提示。
- `AGENTS.md` 仍写「纯 mock、无后端」——**过时**。已有 `services/api` 和选文件夹。视觉规则仍对；数据层描述不要当真。

---

## 8. 给作者看的验收

改完后作者应能在 `http://localhost:5173/` 看出：

1. 打开首页仍是「故事世界被打开」，不是后台表格。
2. 点写作 / 大纲等，仍在同一笔心框里，没有第二套皮。
3. Hermes 对话还能发、还能流式回；离线文案还在。
4. 没有 Tailwind，没有 mint Echo 玻璃回潮。
