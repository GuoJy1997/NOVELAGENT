# 参考图高保真对齐设计（Echo Reference Alignment）

日期：2026-07-19
状态：已评审（头脑风暴阶段通过，待实施计划）

## 背景

当前 Novelora 驾驶舱（`apps/web/src/features/novelora-cockpit/`）与设计参考图 `assets/参考图/image.png`（echo · AI Writing Studio）在布局骨架与视觉语言上同源，但组件细节还原度不足。用户反馈「没有这么还原」，本设计定义把现有界面对齐到参考图的完整方案。

已识别的六个主要差距（按视觉冲击排序）：

1. StructureMap 的 Act 卡片间缺少流动曲线连接与叙事节拍标记（Core Conflict / Climax），章节卡片间缺少箭头串联
2. 右侧 Agent 面板层次单薄：参考图有吉祥物问候卡、任务进度条、Memory Layer 双层 Tab、Review Checklist、Focus Mode 启动卡；当前只有任务列表与一条 Context health
3. 缺少底部状态栏（Words 进度 / Last saved / Focus Deep Work / 写作格言）
4. 线索归因流不是连线图（参考图为 Clue → Revealed To 的曲线连接）
5. 人物关系图缺少真实头像与 Ally/Neutral/Rival/Unknown 彩色编码及图例
6. 左导航缺少「+ New Project」主按钮，吉祥物戏份不足（参考图中更大，且兼任右下角悬浮入口）

## 关键决策（已与用户确认）

- **目标保真度**：高保真对齐。以参考图为目标版式，连接曲线、底部状态栏、右侧五层面板、线索连线图全部向参考图靠拢；内容仍使用 Novelora 的 mock 数据与品牌（Novelora / Nova 不变）。
- **参考图独有元素**：全部以 mock 数据补齐。包括 New Project 按钮、Focus Mode 启动卡、Review Checklist、底部格言、Last saved、人物头像、右下角悬浮吉祥物按钮。
- **线索归因流**：「参考图的形 + 我们的肉」。保留现有 Provider → Trigger → Receiver → Payoff 四段数据模型，视觉改成节点加曲线连接图。

## 实施方案选择

选定 **方案 A：逐版块原地改造**——一次改一个组件，每步独立可测、随时可停。

放弃的两个备选：

- 方案 B（分层对齐：画布令牌 → 框架 → 版块 → 连线）：还原感出现更早，但用户选择 A。
- 方案 C（整网重构再回填）：终态最干净但 diff 最大、回填期界面长期不可用，风险过高。

## 改造单元与顺序

一个前置单元加六个改造单元。每个单元完成后必须本地跑通 `npm run test:web`、`npm run lint:web`、`npm run build:web`（仓库无 CI，此为唯一防线）。

### 单元 0（前置）· fixture 与类型扩展

只动 `apps/web/src/features/novelora-cockpit/types.ts` 与 `data/noveloraMockProject.ts`，补齐渲染所需数据，UI 一行不动。新增字段全部必填（不设可选），fixture 一次写全。

### 单元 1 · StructureMap

- Act 卡片之间加 SVG 流动曲线连接（参考图的波浪串联感）。
- 结构图上方加叙事节拍标记（Core Conflict / Climax 等），数据来自 `Act.narrativeMarkers`。
- Act 卡片补叙事图标。
- 章节泳道卡片间加箭头串联（同属结构连接差异，一并在此单元完成；若实施中体量过大可在计划阶段拆为 1a/1b）。

### 单元 2 · AgentPanel 重构为五层

自上而下：Nova 问候卡（"Hello, I'm Nova…"，数据来自 `agentGreeting`）→ Active Tasks 进度条列表（`AgentTask.progressPercent`）→ Memory Layer 双层 Tab → Review Checklist（已有 `reviewChecklist` 数据，渲染为勾选列表）→ Focus Mode 启动卡（`focusModes` + `activeFocusModeId`）。现有 Context health 保留在 Memory Layer 区内。

Memory Layer 与现有 `memorySources` 数据的映射固定为：上层 Tab 按来源分组——Core Memory 展示全部，World Lore 过滤 `kind: 'inspiration'`，Characters 过滤 `kind: 'character'`；下层子页签按类别过滤——Timeline 对应 `kind: 'chapter'`，Locations 对应 `kind: 'inspiration'`，Clues 对应 `kind: 'clue'`。两层同时生效时取交集，为空时显示空态文案。

### 单元 3 · BottomStatusBar（新组件）

吸底一整条：Words 进度（`currentWords / wordGoal`）/ Last saved（`lastSavedLabel`，静态 mock 字符串，不做真实时钟）/ Focus（当前 `activeFocusModeId` 对应标签）/ 写作格言（`writingQuote`）。语义用 `role="contentinfo"`。

### 单元 4 · ClueAttributionFlow 连线图

保留四段数据模型不变，渲染改为节点加曲线连接图：每条 clue flow 的 Provider → Trigger → Receiver → Payoff 四个节点以 SVG 曲线串联，节点上保留章节归属信息。现有四栏文字布局被替换。

### 单元 5 · CharacterGraph

节点改为真实头像（`portraitAssetKey`，检查 `assetRegistry` 现有头像素材，不足则补生成图并同步扩展注册表与类型），关系连线按关系类型彩色编码（Ally / Neutral / Rival / Unknown，由 `CharacterRelationship` 数据映射），底部加图例。

### 单元 6 · ProjectSidebar + FloatingMascotButton

侧栏顶部加「+ New Project」主按钮；吉祥物 Nova 视觉加大（沿用现有资产）；新增右下角悬浮吉祥物入口按钮（纯展示，`aria-label` 明确，不做真实功能）。

## 数据模型扩展明细

`NoveloraProject` 及子类型新增字段（均为 mock 展示数据）：

- `Act.narrativeMarkers: { label: string; tone: 'conflict' | 'climax' | 'resolution' }[]`
- `AgentTask.progressPercent: number`（0–100）
- `project.lastSavedLabel: string`（如 `"2 min ago"`）
- `project.focusModes: { id: string; label: string; hint: string }[]`
- `project.activeFocusModeId: string`
- `project.writingQuote: { text: string }`
- `project.agentGreeting: { headline: string; body: string }`

已有、无需新增：`reviewChecklist`、`memorySources`、`subagents`、`skills`、`portraitAssetKey`、`characterRelationships`、`currentWords / wordGoal`。New Project 按钮与悬浮吉祥物按钮为纯 UI，不需要数据字段。

## 样式组织约定

- 保持 `src/styles/cockpit.css` 单文件，不拆分；每个单元的样式放在带分节注释带的区段内（如 `/* ===== StructureMap connectors ===== */`）。理由：`src/styles/global.test.ts` 按文件路径解析 CSS 源码做契约断言，拆文件需连带改测试基础设施，超出本次范围。
- 新增设计令牌（连接线颜色/粗细、头像尺寸、底栏高度等）统一加在 `src/styles/tokens.css`；不使用标注为迁移过渡用的 Legacy 别名。
- 视觉语言沿用 white-mint 体系，对齐参考图的留白与通透感通过既有令牌调节实现，不引入第二套配色。

## 测试策略

- 组件测试沿用现有惯例：Testing Library，按角色与可访问名查询，锁定 ARIA 契约。新增语义包括：底栏 `role="contentinfo"`、悬浮按钮 `aria-label`、Memory Layer Tab 的 `aria-selected`、任务进度条 `role="progressbar"` 与 `aria-valuenow`。
- fixture 新字段补进 `data/*.test.ts` 数据完整性断言。
- `src/styles/global.test.ts` 为连接线、底栏等新样式语义加契约断言。
- 每单元收尾跑 `test:web` + `lint:web` + `build:web`。

## 验收标准

六个单元全部完成后，用 Playwright 截取 1440×900（外加 390 移动端）界面，与参考图并排核对六个差距点逐项消除，产物存 `qa-screenshots/reference-alignment/`。

## 范围外（YAGNI）

- 不做任何真实 Agent、模型、持久化、搜索能力（延续项目当前纯 mock 边界）。
- 不做 New Project、Focus Mode Start、悬浮按钮的真实功能逻辑。
- 不拆分 `cockpit.css`，不重构 `toy-writer-cockpit/`。
- 移动端保持现有响应式折叠行为，仅核对不单独对齐参考图（参考图只有桌面版）。
