# 笔心 (Bixin) 视觉整改系统方案

> 生成日期：2026-08-26
> 适用范围：`apps/web`（React 19 + Vite + 纯 CSS）与 `apps/desktop`（Electron 壳）
> 权威视觉基准：用户提供的 ChatGPT 初版首页参考图 + `docs/superpowers/specs/2026-08-14-bixin-desktop-home-visual-design-system.md`
> 唯一直播 UI 是 **笔心**。禁止引入第二套壳/风格/调色板，禁止为对齐引入 Tailwind，工作台页面必须画进 `.bixin-home` 框内。

---

## 0. 背景：四个现象，三个系统性根因

用户在 Electron 桌面壳（1728×972）里观察到 4 个问题，经代码核对，收敛为 3 个系统性根因：

| 用户问题 | 现象 | 系统性根因 |
|---|---|---|
| ③ 应用没铺满桌面，四周空白 | 界面是居中圆角悬浮卡片，窗口一大就露死白边 | **根因 1：外壳几何** —— `.bixin-home__frame` 被 `max-width:1696px + margin auto + border-radius + shadow` 做成悬浮卡；且 fit-scale 把界面锁进 1416×786 固定画布再居中缩放 |
| ④ 风景背景从中下部断层变白 | 背景图只覆盖中上部，下面露出近白底色 | **根因 2：场景子系统** —— `.bixin-scene-layer__base` 是 `width:100%;height:auto;top:-159px` 的顶对齐单图，按比例到中部就没了，下方是 `background: var(--bixin-canvas)` |
| ② 书/背景/卡片分层和参考图对不上 | 书本偏高偏右偏小；机器人烘焙在背景图里用椭圆 mask 抠出 | **根因 2：场景子系统** —— 书本 `top:238px;left:53%;width:520px` 定死；机器人非独立层，无法与书/卡片正确咬合 |
| ① 子路由页面原始丑陋、拉低质感 | 子页面卡片扁平、透明面板透出机器人鬼影；关系图整屏大黑块 | **根因 2 + 根因 3** —— (a) 工作台仍渲染场景层，机器人从透明子页面后穿透；(b) 子页面用 Echo 令牌（`--echo-*`）不是笔心玻璃卡；(c) 关系图缺样式导致 SVG 默认黑填充 |

**本方案分两部分：**
- **Part A（代码整改实现方案）** —— 交给 Grok 4.6 直接执行的详细工程方案。**不依赖新视觉资产也能先落地大部分**（外壳、子页面令牌迁移、穿透修复、关系图修复、品牌）。
- **Part B（ChatGPT 视觉资产生图提示词）** —— 重新生成分层视觉资产（铺底背景 / 独立吉祥物 / 独立书本等），并附一段指令让 ChatGPT 出图后产出「资产接入方案」，与 Part A 的 A7 挂载点对接。

---

# Part A — 代码整改实现方案（交给 Grok 4.6）

## A0. 执行须知（务必先读）

**仓库结构与命令**（Windows + PowerShell，`&&` 不可用，命令分开写）：
- 活跃前端：`apps/web`；桌面壳：`apps/desktop`；后端：`services/api`。
- 开发：仓库根 `npm run dev:web`（Vite，端口占用会自动 +1，如 5174）。桌面：`apps/desktop` 内 `$env:ELECTRON_RENDERER_URL="http://localhost:5174/"; npm run dev`。
- 验收三连（提交前必跑，在 `apps/web` 内或用根脚本）：`npm run test:web`、`npm run lint:web`、`npm run build:web`。

**关键约束：**
1. **契约测试会因本次改动而红，必须同步更新，不能删测试蒙混。** 直接受影响：`apps/web/src/styles/global.test.ts`（解析 CSS 源码断言调色板/透明表面/断点/reduced-motion）、`apps/web/src/features/novelora-cockpit/data/bixinHome.test.ts`、`components/home/BixinHomePage.test.tsx`（锁 scene→interface→book DOM 顺序）、`components/home/useFitScale.test.ts`、以及可能存在的锁 scene mask 坐标 / book 定位的 `bixin-home.test.ts`。改 CSS/DOM 时逐一更新其断言，保持语义（可访问性 role/aria 断言不许降级）。
2. 设计令牌先行：颜色/圆角/阴影/动效一律用 `tokens.css` 里的 `--bixin-*`，不写死色值；**不得使用 `--echo-*` / `--color-mint-*` 作为新代码的直播样式**（它们是迁移遗留）。
3. 保持 `scene → interface → book` 的 DOM 顺序与 z-index 语义（10/20/30）。
4. TypeScript 严格项：类型导入用 `import type`；无未用变量/参数。Lint 用 oxlint（`react/rules-of-hooks` 为 error）。
5. 组件与测试并置：改哪个 `X.tsx` 就同步维护 `X.test.tsx`。

**建议提交顺序**（每步跑一次验收三连，便于二分定位回归）：A5 → A6 → A4 → A3 → A2 → A1 → A7 → A8。（先做低风险、独立的修复，最后做高风险的外壳几何与资产接入。）

---

## A1. 外壳几何：让界面真正铺满桌面窗口（对应问题 ③）

**决策（已定）**：采用 **full-bleed 全窗铺满**，去掉「居中圆角悬浮卡 + 1416×786 固定画布锁定」。理由：用户明确要求填满桌面；固定画布 letterbox 与该目标直接冲突。
> 备选（未采用）：保留卡片外壳但放大到接近满窗、仅保留少量外边距。若后续用户改主意，只需保留 `.bixin-home__frame` 的 `border-radius`/`margin`，其余同此方案。

**改动文件**：`apps/web/src/styles/bixin-home.css`、`components/home/useFitScale.ts`、`components/home/BixinHomePage.tsx`、及上述契约/单元测试。

### A1.1 外壳容器改为满窗
```css
.bixin-home {
  min-width: 1024px;          /* 从 1440 放宽，避免桌面缩小即溢出；按需保留 1440 */
  min-height: 100dvh;
  padding: 0;                  /* 去掉 16px 四周留白 */
  overflow: hidden;
  color: var(--bixin-ink);
  background: var(--bixin-canvas);
  font-family: var(--bixin-font-ui);
}

.bixin-home__frame {
  position: relative;
  width: 100%;
  max-width: none;             /* 去掉 1696 上限 */
  height: 100dvh;              /* 满高 */
  min-height: 640px;
  margin: 0;                   /* 去掉居中 */
  overflow: hidden;
  border-radius: 0;            /* 满窗不要圆角 */
  background: var(--bixin-canvas);
  box-shadow: none;            /* 满窗不要悬浮投影 */
  isolation: isolate;          /* 保留：维持 10/20/30 层叠上下文 */
}
```

### A1.2 退役固定画布 fit-scale（1416×786 锁定 + 居中缩放）
- `bixin-home.css` 第 `1314` 行的 `@media (max-width: 1439px), (max-height: 809px)` 块里，把 `.bixin-scene-layer__canvas, .bixin-home__interface, .bixin-book-layer` 的 `width:1416px; height:786px; transform: scale(...) translate(...)` 整体删除，改为**流式满框**：这三层用 `position:absolute; inset:0; width:100%; height:100%`（或让 interface 保持 in-flow 满高），不再缩放。
- `bixin-home.css` 第 `1260` 行的 `@media (max-width: 1440px), (max-height: 810px)` 块：审查其内规则（frame 尺寸/圆角/transform），凡是为 letterbox 服务的一并移除，保留纯视觉降级（如缩间距）。
- `useFitScale.ts`：**移除** `--bixin-fit-scale/x/y` 的发布逻辑。两种做法二选一：
  - (推荐) 删除 `useFitScale` hook 及其在 `BixinHomePage.tsx` 的 `fitScaleRef` 使用；`.bixin-home` 不再需要该 ref。
  - (保守) 保留 hook 但让它恒发布 `scale=1, x=0, y=0`，仅作未来极小窗的安全阀。
- 同步更新 `useFitScale.test.ts`（若删 hook 则删测试文件并移除引用）与 `bixin-home.test.ts` 里断言 transform/1416 的用例。

### A1.3 内部栅格适配满宽
- `.bixin-home__interface { grid-template-columns: 112px minmax(0,1fr); height:100% }` 已是流式，满宽下自动拉伸，无需改。
- `.bixin-home__stage`：`padding` 保留但可随宽度用 `clamp()` 放大留白；`grid-template-rows: 457px minmax(0,1fr)` 的 hero 行高在大屏可改为 `clamp(420px, 46vh, 520px)`，让 hero 随高度呼吸。
- `.bixin-dashboard` 网格保持三列两行；在超宽屏（>1920）给 `.bixin-home__stage` 一个 `max-width` + 居中，避免卡片被拉过宽（spec 5.2：1920 时内容整体居中、不横向拉宽）。示例：`.bixin-home__stage { max-width: 1880px; margin-inline: auto; }`。

**验收**：窗口任意放大/最大化，界面 edge-to-edge 无死白边；无横向滚动条；卡片不被拉伸变形。

---

## A2. 让风景成为真正的全窗底层（对应问题 ④）

**改动文件**：`bixin-home.css`（scene 层）、必要时 `SceneLayer.tsx`。

### A2.1 场景层铺满整框（含导航后方）
```css
.bixin-scene-layer {
  position: absolute;
  inset: 0;                    /* 从 left:112px 改为 left:0：场景延伸到导航后方 */
  z-index: 10;
  overflow: hidden;
  background: var(--bixin-canvas);
  pointer-events: none;
}
```
> 依据 spec 7.1「左侧导航不使用整块白色外层矩形，每个路由控件直接浮在场景背景上」——所以场景要铺到导航后面。导航项自身已是浮起控件（见 `.bixin-navigation-rail__item`），无需白底。

### A2.2 背景图改为 cover 铺满、锚定顶部
```css
.bixin-scene-layer__base {
  position: absolute;
  inset: 0;                    /* 取代 top:-159px;left:0;width:100% + height:auto */
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center; /* 顶部对齐，保留城堡/浮岛，向下裁切延伸云海 */
}
```
> 现有 PNG 高度不足以优雅铺满 → 用 `cover` 先保证铺满（会牺牲两侧构图）。**最终应替换为 Part B 生成的更高、可铺底的背景资产**，届时可回退到按比例定位。

### A2.3 底部融合：卡片长在云里，不落在硬白上
在场景层上叠一层极轻的自下而上渐隐，让 dashboard 底部与云海过渡（spec 18）：
```css
.bixin-scene-layer::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0 52%,
    rgba(247, 250, 247, 0.35) 78%,
    rgba(247, 250, 247, 0.55) 100%
  );
  pointer-events: none;
}
```
（数值按实测微调，目标是「底部有云、不是纯白」。）

**验收**：首页从上到下都是幻想风景，卡片之间/下方可见云层，无中下部断层白块。

---

## A3. 修复子页面的场景/机器人穿透（对应问题 ①-a）

**问题**：`BixinHomePage` 在工作台模式仍渲染 `SceneLayer`（含烘焙机器人），子页面内容透明 → 机器人鬼影穿透（大纲/世界观露半身、人物/任务露整只、写作/工作流露皇冠尖）。

**改动文件**：`SceneLayer.tsx`、`BixinHomePage.tsx`、`bixin-home.css`。

**方案**：给场景层区分 `home` / `workbench` 两种呈现。
1. `SceneLayer` 增加 `variant?: 'home' | 'workbench'`（默认 `home`）。
2. `BixinHomePage.tsx`：`<SceneLayer variant={isHome ? 'home' : 'workbench'} />`。
3. workbench 变体下：
   - **隐藏 `__subject`（机器人）** —— 机器人只属于首页 hero 叙事，不该出现在工作台。
   - 背景保留但**加重雾化下沉**成安静背景，避免仍读成「场景」抢内容：在 `.bixin-scene-layer--workbench` 上叠 `background: rgba(247,250,247,.72)` 遮罩 + `.bixin-scene-layer__base` 追加 `filter: blur(10px) saturate(0.9); opacity:.6;`。
```css
.bixin-scene-layer--workbench .bixin-scene-layer__subject { display: none; }
.bixin-scene-layer--workbench .bixin-scene-layer__base {
  filter: blur(10px) saturate(0.92);
  opacity: 0.55;
}
.bixin-scene-layer--workbench::after {
  content: "";
  position: absolute; inset: 0;
  background: rgba(247, 250, 247, 0.72);
  pointer-events: none;
}
```
4. 同时给每个工作台页面一个**不透明/磨砂的内容承载面**（见 A4 的 `.bixin-workbench` 容器），确保内容不再直接透出背景。

> 保持 `SceneLayer` 在两种模式都渲染（维持 DOM 顺序契约），仅改其视觉，不改 DOM 结构顺序。更新 `BixinHomePage.test.tsx` 若它断言 subject 存在性。

**验收**：切到任意子页面，背景是安静的浅雾云景，**看不到机器人**；内容面板不透出鬼影。

---

## A4. 子页面统一到笔心卡片系统（对应问题 ①-b）

**问题**：`CharactersPage.css`、`RelationsPage.css`、`MarkdownDocumentPage.css`、`TaskBoardPage.css` 全用 `--echo-*`；`WritingView`/`WorkflowCanvasPage` 虽用 `--bixin-*` 但仍是白盒子。目标：全部长进笔心玻璃卡体系。

### A4.1 新增共享工作台布局容器
在 `bixin-home.css`（或新建 `apps/web/src/styles/bixin-workbench.css` 并在 `global.css` `@import`）加入统一容器，供所有子页面复用：
```css
.bixin-workbench-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 1200px;      /* 内容不至于拉满超宽 */
  margin-inline: auto;
  min-height: 0;
}
.bixin-workbench-page__header {
  display: flex; align-items: baseline; flex-wrap: wrap;
  gap: 8px 16px;
}
.bixin-workbench-page__header h2 {
  margin: 0;
  font-family: var(--bixin-font-display);
  font-size: 26px; font-weight: 650; letter-spacing: -0.02em;
  color: var(--bixin-ink);
}
.bixin-workbench-page__header p { margin: 0; color: var(--bixin-muted); font-size: 13px; }
.bixin-workbench-page__actions { display: flex; gap: 10px; margin-left: auto; align-items: center; }

/* 磨砂承载面：复用首页 .bixin-card 的语言 */
.bixin-panel {
  background: var(--bixin-card);
  backdrop-filter: blur(8px);
  border: 1px solid var(--bixin-card-border);
  border-radius: var(--bixin-radius-card);
  box-shadow: var(--bixin-shadow-card);
  padding: 20px;
}
```
（复用首页已有的 `.bixin-btn` / `.bixin-btn--primary`，不要再造按钮。）

### A4.2 Echo → Bixin 令牌迁移映射表
对四个 Echo 页面做机械但正确的替换：

| Echo 令牌 | 替换为 |
|---|---|
| `--echo-ink` | `--bixin-ink` |
| `--echo-muted` | `--bixin-muted` |
| `--echo-line` | `var(--bixin-ink-08)`（细边）或 `--bixin-card-border` |
| `--echo-surface` / `--echo-page` | `--bixin-surface-solid` |
| `--echo-surface-soft` | `--bixin-green-50` |
| `--echo-glass-card` | `--bixin-card` |
| `--echo-glass-panel` | `--bixin-surface-84` |
| `--echo-glass-pill` | `--bixin-surface-58` |
| `--echo-mint-50` | `--bixin-green-50` |
| `--echo-mint-100` | `--bixin-green-100` |
| `--echo-mint-500` | `--bixin-green-600` |
| `--echo-mint-600` | `--bixin-green-700` |
| `--echo-radius-card` | `--bixin-radius-card-compact` |
| `--echo-radius-panel` | `--bixin-radius-card` |
| `--echo-shadow-card` | `--bixin-shadow-card` |
| `--echo-shadow-mint-sm/md` | `--bixin-shadow-action-soft` / `--bixin-shadow-card` |
| `--echo-shadow-action` | `--bixin-shadow-action-primary` |
| `--echo-danger` | `--color-state-danger`（保留全局） |
| `--color-mint-soft` | `--bixin-green-100` |

### A4.3 每页具体重做要点
- **人物 `CharactersPage`**：改为左右两栏卡片布局——左：人物列表（头像 pill/小卡，用 `characterPortraits`），右：详情表单（姓名/角色/目标/知情）包在 `.bixin-panel` 里；输入框用 `--bixin-radius-input` + `--bixin-surface-solid` + 细边。消除「表单孤零零浮在云上」。表单里 `知情` 的布尔值别再直接显示 `false`，用开关/是否标签。
- **大纲 / 世界观 `MarkdownDocumentPage`**：内容区改成**不透明「纸面」**——居中 `max-width: 860px` 的 `.bixin-panel`（略微更实：`background: var(--bixin-surface-94)`），正文用 `--bixin-font-display` 衬线体、`line-height:1.85`；顶部工具条（从文件导入/完成）用 `.bixin-workbench-page__header`。**不再让 textarea 透明透出背景**。
- **关系 `RelationsPage`**：先修 A5 的图；关系标签编辑器包进 `.bixin-panel`；图容器给磨砂卡背景。
- **任务 `TaskBoardPage`**：四列看板列头用 `--bixin-green-*` 着色 pill；任务卡改 `.bixin-panel`（compact 半径），步骤时间线用 `--bixin-green-600`；空列给占位提示，不要透明细条。
- **写作 `WritingView`**：三栏面板升级为 `.bixin-panel`（章节列表/编辑器/Hermes 对话各一张卡）；顶部露皇冠尖问题由 A3 解决。
- **工作流 `WorkflowCanvasPage`**：节点卡加 `--bixin-shadow-card` 与 `--bixin-radius-card-compact`，inspector 侧栏用 `.bixin-panel`；画布网格底色调到 `--bixin-green-50`。

**验收**：所有子页面无 `--echo-*` 直播用法（`--echo-*` 仅可作过渡别名，最终目标是清零）；卡片与首页同一质感。

---

## A5. 修复关系图整屏黑块（对应问题 ①-c，功能 bug）

**根因（已确诊）**：`echo.css` 中所有 `.character-graph__*` 规则都限定在 `.cockpit-scroll` 祖先下（如 `.cockpit-scroll .character-graph__edge { fill: none; stroke: … }`）。`RelationsPage` 渲染 `CharacterGraph`（`apps/web/src/features/novelora-cockpit/components/CharacterGraph.tsx`）时**没有 `.cockpit-scroll` 祖先**，规则全部落空 → SVG `<path>` 回退默认 `fill:black` → 黑色贝塞尔堆叠成大黑团。

**修复**：为 `CharacterGraph` 提供**不依赖 `.cockpit-scroll`** 的独立样式（新建 `CharacterGraph.css` 与组件并置并 `import`，或写进 `bixin-workbench.css`）。核心必须包含：
```css
.character-graph__edge { fill: none; stroke: var(--bixin-subtle); stroke-width: 1.5; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.character-graph__edge--ally    { stroke: var(--bixin-green-600); }      /* 盟友 绿 */
.character-graph__edge--neutral { stroke: var(--bixin-subtle); }         /* 中立 灰 */
.character-graph__edge--rival   { stroke: var(--color-state-danger); }   /* 冲突 红 */
.character-graph__edge--unknown { stroke: var(--bixin-subtle); stroke-dasharray: 4 4; }  /* 未知 灰虚线 */
```
> spec 8「人物关系网」关系色：盟友 Green / 冲突 Red / 师徒 Purple / 爱慕 Blue / 未知 Gray。当前 `CharacterGraph` 的 kind 仅 `ally/neutral/rival/unknown`，按上表着色；若后续扩展 mentor/love，再加 purple/blue。
- 同步补齐 `.character-graph__stage`（`position:relative; width; height:var(--character-graph-height)`）、`__edges/__nodes { position:absolute; inset:0 }`、`__node { position:absolute; top:var(--character-y); left:var(--character-x) }`、节点头像、legend 样式（照 `echo.css` 2100–2234 的几何，令牌换成 `--bixin-*`）。
- 19 人时走 `graphLayout` 的网格分支（`GRAPH_WIDTH=320` 固定）——关系页应让 `.character-graph__stage` 自适应更大画布或允许滚动，避免节点在 320px 里挤成一团（可把 `GRAPH_WIDTH`/列坐标参数化，或在关系页用更大 viewBox）。此为增强项，先保证不黑屏、连线正确着色。

**验收**：关系页显示正常的节点+彩色连线关系图，无黑块；legend 四色正确。

---

## A6. 品牌标题去 Echo（bonus，1 行）

**问题**：所有截图窗口标题为 `Echo — AI Writing Studio`（来自 `apps/web/index.html` 的 `<title>`，Electron 窗口标题取自文档标题）。

**修复**：
- `apps/web/index.html`：`<title>笔心 · AI 写作工作室</title>`，`<html lang="zh-CN">`。
- 可选：`apps/desktop/src/main.ts` 的 `new BrowserWindow({ ... , title: '笔心' })` 显式设标题兜底。
- 检查是否有 `global.test.ts` 之外的测试断言旧标题。

---

## A7. 书本 / 吉祥物分层还原（对应问题 ②）——代码侧 + 资产接入挂载点

问题 ② 的彻底解决需要 Part B 的**独立吉祥物 / 独立书本**资产。这里分两段：现在能做的代码侧，与资产到位后的接入。

### A7.1 现在（旧单图资产下）能做的
- 书本改为**响应式定位**，随窗口缩放并正确压住人物关系网卡片上沿（spec 17：压左上/上缘非功能区 8–18px，书签 16–30px）：
```css
.bixin-book-layer img {
  position: absolute;
  top: clamp(180px, 22vh, 260px);
  left: clamp(46%, 50%, 54%);
  width: clamp(420px, 34vw, 560px);
  height: auto;
  clip-path: inset(0 0 70px 0);
}
```
- 校准使其只压卡片上沿的非功能区，不遮标题/头像/按钮/数据（spec 17 硬约束）。

### A7.2 资产到位后（Part B 交付独立层）——接入挂载点
目标 DOM：把「一图三注册 + mask」替换为**真正的三层独立资产**。
- `assetRegistry.ts` 的 `bixinAssets` 新增/替换键：
  - `sceneBackground`（无机器人无书的铺底背景，A2 用）
  - `mascot`（独立透明吉祥物 PNG）
  - `book`（独立透明书本+3D地图 PNG，已存在，替换为新图）
- `SceneLayer.tsx`：拆成两层
  ```tsx
  <div className="bixin-scene-layer" aria-hidden="true">
    <img className="bixin-scene-layer__base" src={bixinAssets.sceneBackground} alt="" />
    {variant === 'home' && (
      <img className="bixin-scene-layer__mascot" src={bixinAssets.mascot} alt="" />
    )}
  </div>
  ```
  删除 `__subject` 的 radial-mask hack 与「同图二次注册」。
- 新增 `.bixin-scene-layer__mascot` 定位（绝对定位、按 % + clamp 缩放，位于书本左侧、望远镜对准书中地图，符合 spec 3 的「观察→放大→世界」动线）。
- 更新契约测试：`bixin-home.test.ts` 里断言 mask 坐标/subject 的用例，改为断言新的 `__base`/`__mascot`/`__book` 结构与定位；`BixinHomePage.test.tsx` 的 DOM 顺序断言保持 scene→interface→book。

**验收**：首页三层景深 = 铺底风景（后）→ UI 卡片（中）→ 书本（前），机器人作为独立主体立于书左侧观察地图；书本自然压住关系网卡片上沿，不遮功能区。与参考图空间叙事一致。

---

## A8. 测试、验收与回归

1. **单元/交互**：`npm run test:web`。逐个修复因本次改动变红的契约测试（A0 清单），保持 role/aria 语义。
2. **Lint**：`npm run lint:web`。
3. **类型 + 构建**：`npm run build:web`（`tsc -b && vite build`）。
4. **人工核对**（Electron 窗口，最大化）：对照 spec 24 验收清单逐条打勾——空间三层、白+绿、无深绿大色块、无蓝色 SaaS 主色、卡片半实体、云层铺底、品牌为「笔心」、无 Echo 标志、首页不堆叠过多卡片。
5. **回归重点**：满窗后无横向滚动条；子页面无机器人穿透；关系图不黑屏；不同窗口尺寸（1440/1728/1920/最大化）布局稳定。

---

## A9. 变更文件清单（预期）

- `apps/web/index.html`（标题）
- `apps/web/src/styles/bixin-home.css`（外壳、场景、book、workbench 容器）
- `apps/web/src/styles/tokens.css`（如需新增关系色/中性别名，可选）
- 新增 `apps/web/src/styles/bixin-workbench.css` + 在 `global.css` `@import`（可选，或并入 bixin-home.css）
- `apps/web/src/features/novelora-cockpit/components/home/SceneLayer.tsx`、`BixinHomePage.tsx`、`useFitScale.ts`（退役）
- `apps/web/src/features/novelora-cockpit/components/CharacterGraph.tsx` + 新增 `CharacterGraph.css`
- `apps/web/src/features/novelora-cockpit/components/pages/*.css`（Characters/Relations/MarkdownDocument/TaskBoard 令牌迁移）+ 对应 `.tsx`（结构微调）
- `apps/web/src/features/novelora-cockpit/components/writing/*.css`、`WorkflowCanvasPage.css`（质感升级）
- `apps/web/src/features/novelora-cockpit/assetRegistry.ts`（A7.2 资产键，资产到位后）
- 相应 `*.test.ts(x)` 契约/单元测试更新

---

# Part B — ChatGPT 视觉资产生图提示词（出图后再产出接入方案）

## B0. 使用说明

在已登录的 ChatGPT（图像生成）里，**逐个**粘贴下列提示词生成资产。**务必先上传那张笔心初版首页参考图作为风格锚点**，并在每条前加一句：「Match the exact art style, palette (soft white + brand green #1EA44F), rendering and lighting of the reference image I uploaded.」

统一风格护栏（每条都隐含遵守，取自 spec 15/16）：轻盈、幻想、清澈、收藏级质感；陶瓷薄荷白机身机器人、黑色玻璃面罩、少量金色点缀；**不要**赛博朋克/深色金属机甲/廉价儿童动画风；书页**不得出现任何文字**；主色只用于点缀，避免大面积高饱和绿。

导出规范：PNG；独立主体一律**透明背景**；分辨率给到 2× 以上（示例尺寸见各条）。命名与落位：下载后放入 `apps/web/src/assets/bixin/`，并在 `assetRegistry.ts` 的 `bixinAssets` 注册。

---

## B1. 铺底场景背景（无机器人、无书）——`scene-background.png`
```
A wide, airy fantasy cloudscape that can serve as a full-screen app background, 3200 x 1800, 16:9. Soft luminous white-and-mint sky with layered clouds, floating grassy islands, distant white-jade castles, gentle waterfalls, misty mountains and light greenery. The scene must remain visually continuous and calm from top to bottom, with the LOWER third softly fading into gentle clouds and pale mint mist so that translucent UI cards can sit over the bottom area without a hard edge. No characters, no robot, no book, no text, no UI. Collectible, dreamy, high-key lighting, subtle depth of field. Palette anchored on soft white with brand green #1EA44F accents. Opaque background (not transparent).
```

## B2. 独立吉祥物 Nova（透明背景）——`mascot-nova.png`
```
A cute ceramic-mint-and-white AI companion robot, isolated on a fully transparent background, 1600 x 2000 portrait. Glossy porcelain body, black glossy glass face visor showing a soft "ω <" expression, small gold crown and subtle gold trim accents. It holds a slim writing pen in one hand and raises a small brass telescope to the visor with the other, in an "observing / discovering" pose, body angled three-quarters. Friendly, premium collectible toy quality, soft studio lighting with gentle rim light, subtle contact-free soft shadow baked into the PNG alpha optional. Absolutely NOT a battle mecha, NOT cyberpunk, NOT dark metal, NOT childish cartoon. Transparent PNG, crisp edges.
```

## B3. 独立书本 + 立体地图（透明背景）——`book-foreground.png`
```
An open storybook seen at a slight three-quarter tilt, isolated on a fully transparent background, 2000 x 1400. From the open pages rises a lush 3D miniature fantasy map with clear height: rivers, small white castles, forests, mountains, winding roads and tiny buildings — like a diorama emerging from the book. A ribbon bookmark follows the book's perspective and drapes over the lower-right edge. Warm paper and soft greenery, gentle top light, collectible quality. The map has obvious 3D relief. NO text anywhere on the pages. Transparent PNG.
```

## B4.（可选）工作台安静背景——`scene-ambient.png`
```
A softly blurred, low-contrast version of the same cloudscape (B1) for use as a quiet workbench backdrop, 3200 x 1800. Heavier haze, lower saturation, no focal subject, no castles too prominent — just calm mint-white clouds so UI panels read clearly on top. No robot, no book, no text. Opaque.
```

## B5.（可选）文档纸面纹理——`paper-texture.png`
```
A very subtle warm-white paper texture tile, 1200 x 1200, near-flat with faint fiber grain and a hint of mint undertone, seamless/tileable, for use behind long-form document panels. Extremely low contrast so black text stays perfectly readable. No patterns, no text.
```

## B6.（可选）项目封面占位刷新——`project-cover.png`
```
A dreamy fantasy book-project cover thumbnail, 800 x 800, a floating castle island above mint clouds in the same reference art style, soft and premium, room at the center for a title overlay added later in UI. No text baked in.
```

---

## B-FINAL. 给 ChatGPT 的指令：出图后产出「资产接入方案」

> 生成完上述资产后，请你（ChatGPT）再输出一份《笔心视觉资产接入方案》，用于指导工程师把这些图接入现有 React + 纯 CSS 代码库。必须覆盖：
> 1. 每个资产建议的文件名、放置目录（`apps/web/src/assets/bixin/`）、导出尺寸与是否透明。
> 2. 如何在 `apps/web/src/features/novelora-cockpit/assetRegistry.ts` 的 `bixinAssets` 里新增/替换键（`sceneBackground` / `mascot` / `book` / 可选 `sceneAmbient` / `paperTexture` / `projectCover`），键名用 `keyof typeof` 与类型绑定。
> 3. 如何把首页 `SceneLayer` 从「同一张背景图二次注册 + radial-mask 抠机器人」改为**三层独立资产**：铺底背景（后）→ 独立吉祥物 PNG（中，仅首页）→ 独立书本 PNG（前）；给出各层的 `position/inset/width(clamp)/z-index` 建议，使其符合「机器人举望远镜观察书中地图、地图放大为后方世界」的空间叙事（scene 10 / interface 20 / book 30 不变）。
> 4. 书本与人物关系网卡片的遮挡量建议（压非功能区 8–18px，书签 16–30px），以及机器人相对书本的站位。
> 5. 工作台（子页面）如何改用 B4 安静背景、并隐藏吉祥物，避免主体穿透。
> 6. 需要同步更新哪些视觉契约测试（scene 结构/book 定位）。
> 请以「文件 → 具体改动」的清单形式输出，中文，标识符保留英文。

---

## 附：两条产出线如何合并

- **Grok（Part A）** 先把外壳几何、场景铺底、穿透修复、子页面令牌迁移、关系图、品牌全部落地——**这些不依赖新资产**，做完应用质感已大幅提升。
- **ChatGPT（Part B）** 产出的新资产 + 接入方案，对应 Part A 的 **A2.2 / A7.2** 挂载点：把 `object-fit:cover` 的临时背景换成 B1 铺底图，把 mask 抠出的机器人换成 B2 独立吉祥物，把书本换成 B3——首页三层景深即与参考图完全对齐。
- 两步都完成后，跑一遍 A8 验收三连 + spec 24 人工清单收尾。
