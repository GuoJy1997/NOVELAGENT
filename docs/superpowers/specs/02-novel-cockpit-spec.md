# 02 Novel Cockpit Spec

状态：Review Candidate

日期：2026-07-08

上游依赖：`01-novel-project-spec.md`，当前尚未编写。本 spec 先假设用户已经进入某一本 `Novel`，且该 `Novel` 拥有独立的项目数据、灵感库、记忆空间和默认模型配置。

相关底座文档：`2026-07-08-novel-agent-product-foundation-design.md`

## 1. 功能定位

Novel Cockpit 是用户进入一本小说后的核心入口层。它不是普通首页，而是小说项目的“驾驶舱”和“指挥台”。

它解决的问题是：

1. 让用户一眼看到整本小说当前结构、篇章组成、写作进度和风险。
2. 让用户快速进入灵感库、大纲、篇章泳道图、人物、世界观、线索、章节写作和审查。
3. 让 Agent 编排、模型路由、Skill、长期记忆和审查状态在同一界面中可见、可控。
4. 让“小说创作”从散乱聊天变成可视化、结构化、可追踪的工作流。

Cockpit 的一句话定义：

> 用户进入一本小说后，看到的第一个工作台；它展示小说全局结构，并允许用户指挥 Agent 完成创作、审查和维护任务。

## 2. 用户角色

### 2.1 新手作者

使用 Cockpit 了解下一步该做什么，例如补大纲、建人物、写第一章、整理灵感。

### 2.2 连载网文作者

使用 Cockpit 追踪章节进度、未回收伏笔、当前写作任务、审查问题和发布前清单。

### 2.3 强设定作者

使用 Cockpit 快速查看世界观、人物、设定冲突和记忆状态。

### 2.4 悬疑 / 推理作者

使用 Cockpit 进入线索链、伏笔回收、暗线图和篇章泳道图。

### 2.5 编辑 / 审稿人

使用 Cockpit 查看当前章节质量、问题清单、修改任务和发布风险。

## 3. 入口位置

### 3.1 主入口

```text
项目列表
  ↓
选择一本 Novel
  ↓
Novel Cockpit
```

### 3.2 可返回入口

以下页面必须能返回 Novel Cockpit：

- 灵感库。
- 大纲 / 篇章管理。
- 篇章泳道图。
- 人物系统。
- 世界观系统。
- 线索 / 伏笔系统。
- 章节写作。
- 章节审查。
- Agent 任务详情。
- 模型设置。
- 长期记忆管理。

### 3.3 默认进入规则

当用户进入一本小说时：

1. 如果该小说没有上次打开位置，默认进入 Novel Cockpit。
2. 如果有上次打开位置，系统可提供“继续上次位置”和“进入 Cockpit”两个入口。
3. 如果项目存在高风险事项，例如任务失败、记忆冲突、未回收关键伏笔，进入 Cockpit 时必须显示提醒。

## 4. 核心用户目标

Cockpit 必须支持用户完成以下目标：

1. 查看整本小说由哪些篇章 / 故事单元组成。
2. 聚焦某个篇章并进入对应泳道图。
3. 查看当前写作章节、章节状态和下一步建议。
4. 快速存入灵感，并确认灵感归属到当前小说。
5. 查看当前 Agent 任务、排队任务、失败任务和等待确认任务。
6. 查看当前 Subagent、Skill、模型和长期记忆使用状态。
7. 查看线索 / 伏笔风险，例如未回收、缺归因、冲突。
8. 查看人物、世界观、设定、章节审查的关键提醒。
9. 发起一个高层目标，让 Agent 拆分成任务。
10. 从 Cockpit 跳转到具体模块继续工作。

## 5. MVP 范围

MVP 版本的 Cockpit 需要做这些能力：

### 5.1 页面布局

- 左侧项目导航栏。
- 中央工作区。
- 顶部工作区 Header。
- 中央全书结构地图。
- 中下方辅助面板区。
- 底部线索归因摘要。
- 右侧 Agent Orchestration 面板。
- 视觉吉祥物 / AI 写作伙伴展示层。

### 5.2 信息展示

- 当前小说基础信息。
- 全书篇章 / 章节结构摘要。
- 当前选中篇章或章节。
- 最近灵感。
- 人物关系摘要。
- 世界观 / 设定风险摘要。
- 线索 / 伏笔摘要。
- 当前 Agent 任务列表。
- Subagent 列表。
- Skill 列表。
- 当前模型和推荐模型。
- 长期记忆同步状态。
- 审查清单。

### 5.3 基础交互

- 点击篇章卡片进入篇章聚焦状态。
- 点击章节卡片进入章节详情或章节写作入口。
- 点击灵感入口进入灵感库。
- 点击线索摘要进入线索 / 伏笔系统。
- 点击 Agent 任务进入任务详情。
- 点击模型状态进入模型切换面板。
- 点击记忆状态进入长期记忆管理。
- 快速创建灵感。
- 发起 Agent 高层任务。

### 5.4 MVP 数据方式

MVP 可以先使用 mock data 或本地项目数据驱动 UI，但数据结构必须按本 spec 设计，不能只写死展示文本。

## 6. 非 MVP 范围

Cockpit 第一版不做：

- 多人协作状态。
- 实时协同光标。
- 项目权限管理。
- 真实平台发布操作。
- 复杂 BI 统计报表。
- 完整移动端专属布局。
- 三维关系图。
- 图片生成工作流。
- 自动执行高风险结构改动。
- 跨小说全局数据混合看板。

这些能力可以在 V2 / V3 扩展。

## 7. 核心流程

### 7.1 进入 Cockpit

```text
用户选择 Novel
  ↓
系统加载 NovelCockpitSnapshot
  ↓
系统检查项目风险：任务失败、记忆冲突、未回收伏笔、审查阻塞
  ↓
Cockpit 展示全局结构、当前任务、Agent 状态和快捷入口
```

成功结果：

- 用户看到当前小说的整体状态。
- 用户可以直接进入下一步工作。

异常结果：

- 数据加载失败时显示恢复入口。
- 小说为空项目时显示初始化引导。

### 7.2 查看全书结构

```text
用户进入 Cockpit
  ↓
中央结构地图展示 Arc / Chapter 摘要
  ↓
用户点击某个 Arc
  ↓
Cockpit 进入 arcFocused 状态
  ↓
显示该 Arc 的章节、风险、泳道图入口和 Agent 建议
```

成功结果：

- 用户知道整本小说由哪些篇章构成。
- 用户可以聚焦某个篇章继续创作。

### 7.3 进入篇章泳道图

```text
用户在结构地图中选择 Arc
  ↓
点击“打开泳道图”
  ↓
系统跳转到 Arc Swimlane Diagram
```

规则：

- 如果该 Arc 还没有泳道图，系统提供“创建泳道图”入口。
- 创建泳道图的详细规则属于 `04-arc-swimlane-diagram-spec.md`。

### 7.4 快速存入灵感

```text
用户在 Cockpit 点击“记录灵感”
  ↓
输入灵感文本
  ↓
系统自动绑定当前 Novel
  ↓
Agent 判断灵感类型
  ↓
灵感以待整理状态进入 InspirationVault
```

规则：

- Cockpit 只提供快速捕捉入口。
- 灵感的分类、转化和完整管理属于 `03-inspiration-vault-spec.md`。
- 快速灵感不能直接改写核心设定。

### 7.5 发起 Agent 高层任务

```text
用户输入目标，例如“帮我完善第二篇章”
  ↓
Cockpit 将目标提交给 Agent Orchestrator
  ↓
Agent Orchestrator 生成任务草案
  ↓
Cockpit 展示任务拆分预览
  ↓
用户确认
  ↓
任务进入队列
```

规则：

- 影响核心设定、结局、人物死亡、重大反转的任务必须人类确认。
- 任务执行细节属于 `10-agent-orchestration-spec.md`。

### 7.6 切换任务模型

```text
用户点击右侧 Model Router
  ↓
查看当前任务模型、推荐模型和推荐理由
  ↓
用户选择模型
  ↓
系统保存为当前任务模型覆盖项
```

规则：

- Cockpit 展示模型摘要和切换入口。
- 模型档案、成本、失败降级属于 `11-model-router-spec.md`。

### 7.7 查看长期记忆状态

```text
Cockpit 展示 Memory Sync 状态
  ↓
用户点击记忆状态
  ↓
进入长期记忆面板或详情页
```

规则：

- Cockpit 只展示同步比例、冲突数量、最近写入和核心记忆状态。
- 记忆写入、冲突解决、版本回滚属于 `12-long-term-memory-spec.md`。

### 7.8 查看审查风险

```text
Cockpit 读取 ReviewSummary
  ↓
展示章节审查、伏笔回收、人物一致性、世界观冲突、发布审核状态
  ↓
用户点击问题
  ↓
进入对应审查报告或修改任务
```

规则：

- Cockpit 不承载完整审查报告。
- 审查报告和修改任务属于 `09-chapter-review-spec.md`。

## 8. 数据对象

Cockpit 不拥有全部业务数据的真源。它读取各模块聚合出的摘要对象，并维护少量界面状态。

### 8.1 NovelCockpitSnapshot

Cockpit 页面加载的聚合快照。

包含：

- `novel`
- `projectStatus`
- `structureMap`
- `activeFocus`
- `quickActions`
- `inspirationSummary`
- `characterSummary`
- `worldbuildingSummary`
- `clueSummary`
- `chapterSummary`
- `agentPanel`
- `modelRouterSummary`
- `memorySummary`
- `reviewSummary`
- `alerts`

### 8.2 NovelCockpitViewState

前端界面状态。

包含：

- 当前视图。
- 当前聚焦对象。
- 当前选中章节。
- 右侧面板展开状态。
- 快速灵感输入状态。
- Agent 任务输入状态。
- 模型切换弹层状态。

### 8.3 StructureMapSummary

全书结构地图摘要。

包含：

- Arc 列表。
- Chapter 列表摘要。
- 当前选中 Arc / Chapter。
- 篇章状态。
- 风险标记。
- 泳道图入口状态。

### 8.4 CockpitAgentPanel

右侧 Agent 编排面板摘要。

包含：

- 当前任务。
- 排队任务。
- 失败任务。
- 等待用户确认任务。
- Subagent 状态。
- Skill 状态。
- 当前任务模型。

### 8.5 CockpitAlert

需要在 Cockpit 提醒用户的事项。

来源包括：

- 未回收关键伏笔。
- 记忆冲突。
- Agent 任务失败。
- 审查未通过。
- 章节缺失关键字段。
- 模型成本过高。
- 长上下文不足。

## 9. 字段定义

### 9.1 NovelCockpitSnapshot

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `novelId` | string | 是 | 当前小说 ID |
| `generatedAt` | ISO datetime | 是 | 快照生成时间 |
| `novel` | `NovelHeaderSummary` | 是 | 小说头部摘要 |
| `projectStatus` | `ProjectStatusSummary` | 是 | 项目整体状态 |
| `structureMap` | `StructureMapSummary` | 是 | 全书结构地图摘要 |
| `activeFocus` | `CockpitFocus` | 是 | 当前聚焦对象 |
| `quickActions` | `QuickAction[]` | 是 | 快捷动作 |
| `inspirationSummary` | `InspirationSummary` | 是 | 灵感摘要 |
| `characterSummary` | `CharacterSummary` | 是 | 人物摘要 |
| `worldbuildingSummary` | `WorldbuildingSummary` | 是 | 世界观摘要 |
| `clueSummary` | `ClueSummary` | 是 | 线索摘要 |
| `chapterSummary` | `ChapterSummary` | 是 | 章节摘要 |
| `agentPanel` | `CockpitAgentPanel` | 是 | Agent 面板 |
| `modelRouterSummary` | `ModelRouterSummary` | 是 | 模型路由摘要 |
| `memorySummary` | `MemorySummary` | 是 | 长期记忆摘要 |
| `reviewSummary` | `ReviewSummary` | 是 | 审查摘要 |
| `alerts` | `CockpitAlert[]` | 是 | 提醒列表 |

### 9.2 NovelHeaderSummary

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `novelId` | string | 是 | 小说 ID |
| `title` | string | 是 | 书名 |
| `genre` | string | 是 | 类型 |
| `targetPlatform` | string | 否 | 目标平台 |
| `coverAssetId` | string | 否 | 封面或视觉资产 ID |
| `status` | enum | 是 | `planning`、`drafting`、`serializing`、`revision`、`completed`、`archived` |
| `currentWordCount` | number | 是 | 当前字数 |
| `updatedAt` | ISO datetime | 是 | 最近更新时间 |

### 9.3 StructureMapSummary

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `viewMode` | enum | 是 | `map`、`timeline`、`list` |
| `arcs` | `ArcMapCard[]` | 是 | 篇章卡片 |
| `chapters` | `ChapterMapCard[]` | 是 | 章节卡片摘要 |
| `milestones` | `StoryMilestone[]` | 是 | 故事里程碑 |
| `selectedArcId` | string | 否 | 当前选中篇章 |
| `selectedChapterId` | string | 否 | 当前选中章节 |
| `globalRiskLevel` | enum | 是 | `none`、`low`、`medium`、`high` |

### 9.4 ArcMapCard

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `arcId` | string | 是 | 篇章 ID |
| `title` | string | 是 | 篇章标题 |
| `order` | number | 是 | 排序 |
| `chapterIds` | string[] | 是 | 包含章节 |
| `status` | enum | 是 | `empty`、`planned`、`drafting`、`reviewing`、`complete`、`locked` |
| `swimlaneDiagramId` | string | 否 | 泳道图 ID |
| `riskLevel` | enum | 是 | `none`、`low`、`medium`、`high` |
| `openClueCount` | number | 是 | 未完成线索数 |
| `unresolvedAlertCount` | number | 是 | 未解决提醒数 |

### 9.5 ChapterMapCard

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `chapterId` | string | 是 | 章节 ID |
| `arcId` | string | 是 | 所属篇章 |
| `title` | string | 是 | 章节标题 |
| `order` | number | 是 | 排序 |
| `status` | enum | 是 | `outline`、`draft`、`reviewing`、`revision`、`readyToPublish`、`published`、`locked` |
| `wordCount` | number | 是 | 当前字数 |
| `primaryPurpose` | string | 否 | 本章功能 |
| `clueCount` | number | 是 | 涉及线索数量 |
| `reviewRiskLevel` | enum | 是 | `none`、`low`、`medium`、`high` |

### 9.6 CockpitFocus

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | enum | 是 | `overview`、`arc`、`chapter`、`task`、`alert` |
| `targetId` | string | 否 | 聚焦对象 ID |
| `source` | enum | 是 | `initialLoad`、`userClick`、`agentRecommendation`、`alert` |

### 9.7 QuickAction

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `actionId` | string | 是 | 动作 ID |
| `label` | string | 是 | 展示名称 |
| `type` | enum | 是 | `navigate`、`create`、`agentTask`、`review`、`modelSwitch` |
| `targetModule` | string | 是 | 目标模块 |
| `enabled` | boolean | 是 | 是否可用 |
| `disabledReason` | string | 否 | 不可用原因 |
| `priority` | number | 是 | 排序权重 |

### 9.8 CockpitAgentTaskSummary

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `taskId` | string | 是 | 任务 ID |
| `title` | string | 是 | 任务标题 |
| `taskType` | enum | 是 | `outline`、`inspiration`、`clue`、`character`、`worldbuilding`、`writing`、`review`、`revision`、`publish`、`orchestration` |
| `status` | enum | 是 | `draft`、`queued`、`running`、`waitingForUser`、`done`、`failed`、`cancelled` |
| `assignedSubagentId` | string | 否 | 子代理 ID |
| `skillIds` | string[] | 是 | 使用 Skill |
| `modelId` | string | 否 | 当前任务模型 |
| `relatedObjectIds` | string[] | 是 | 相关对象 |
| `requiresUserConfirmation` | boolean | 是 | 是否需要用户确认 |

### 9.9 ModelRouterSummary

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `defaultModelId` | string | 是 | 当前小说默认模型 |
| `activeTaskModelId` | string | 否 | 当前任务模型 |
| `recommendedModelId` | string | 否 | 推荐模型 |
| `recommendationReason` | string | 否 | 推荐理由 |
| `costLevel` | enum | 是 | `low`、`medium`、`high` |
| `speedLevel` | enum | 是 | `fast`、`normal`、`slow` |
| `contextFit` | enum | 是 | `enough`、`tight`、`insufficient` |
| `manualOverrideEnabled` | boolean | 是 | 是否允许手动覆盖 |

### 9.10 MemorySummary

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `syncPercent` | number | 是 | 记忆同步比例，0 到 100 |
| `coreMemoryCount` | number | 是 | 核心记忆数量 |
| `recentWriteCount` | number | 是 | 最近写入数量 |
| `conflictCount` | number | 是 | 记忆冲突数量 |
| `lastSyncedAt` | ISO datetime | 否 | 最近同步时间 |
| `status` | enum | 是 | `healthy`、`syncing`、`conflict`、`stale`、`error` |

### 9.11 CockpitAlert

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `alertId` | string | 是 | 提醒 ID |
| `type` | enum | 是 | `clueUnresolved`、`memoryConflict`、`taskFailed`、`reviewRisk`、`modelRisk`、`missingField` |
| `severity` | enum | 是 | `info`、`warning`、`danger` |
| `title` | string | 是 | 标题 |
| `message` | string | 是 | 说明 |
| `relatedObjectIds` | string[] | 是 | 相关对象 |
| `primaryAction` | `QuickAction` | 否 | 主操作 |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `dismissible` | boolean | 是 | 是否可关闭 |

## 10. 状态机

### 10.1 Cockpit 加载状态

```text
idle
  ↓
loading
  ↓
ready
```

异常分支：

```text
loading
  ↓
error
  ↓
retrying
  ↓
ready
```

空项目分支：

```text
loading
  ↓
emptyProject
  ↓
guidedSetup
  ↓
ready
```

### 10.2 聚焦状态

```text
overview
  ↓
arcFocused
  ↓
chapterFocused
```

用户也可以从任何状态进入：

```text
taskFocused
alertFocused
modelFocused
memoryFocused
```

规则：

- `overview` 是默认状态。
- `arcFocused` 用于展示某个篇章摘要和泳道图入口。
- `chapterFocused` 用于展示章节状态、写作入口、审查入口。
- `taskFocused` 用于查看 Agent 任务细节。
- `alertFocused` 用于处理风险提醒。

### 10.3 Agent 任务状态

```text
draft
  ↓
queued
  ↓
running
  ↓
done
```

用户确认分支：

```text
running
  ↓
waitingForUser
  ↓
running
  ↓
done
```

失败分支：

```text
running
  ↓
failed
  ↓
queued
```

取消分支：

```text
queued / running / waitingForUser
  ↓
cancelled
```

## 11. Agent 行为

Cockpit 内的 Agent 行为主要由 Agent Orchestrator 负责。

### 11.1 可以自动执行

- 汇总小说当前状态。
- 生成下一步建议。
- 标记未回收伏笔。
- 标记章节缺字段。
- 推荐模型。
- 推荐 Skill。
- 生成任务拆分草案。
- 识别灵感类型。
- 提醒记忆冲突。
- 提醒审查风险。

### 11.2 必须用户确认

以下行为不能静默执行：

- 改写核心设定。
- 改变人物生死。
- 改变结局。
- 改变重大反转。
- 删除章节。
- 删除线索链。
- 把灵感写入核心记忆。
- 执行高成本模型任务。
- 将审查建议直接应用到正文。

### 11.3 Cockpit Agent 建议格式

Agent 在 Cockpit 里输出建议时，必须结构化：

```text
建议标题
建议原因
涉及对象
风险等级
推荐动作
是否需要确认
预计调用的模型
预计调用的 Skill
```

不能只输出一段聊天文本。

## 12. Skill 调用

Cockpit 本身不承载复杂 Skill 逻辑，但它可以触发或展示 Skill。

### 12.1 Cockpit 可触发的 Skill

| Skill | 触发场景 |
|---|---|
| 结构分析 | 用户请求分析全书结构或篇章问题 |
| 线索回收检查 | Cockpit 发现未回收伏笔或用户主动检查 |
| 人物一致性检查 | 章节或篇章人物状态异常 |
| 世界观冲突检查 | 设定摘要出现冲突 |
| 章节审查 | 当前章节进入审查 |
| 发布审核 | 章节或篇章准备发布 |
| 灵感分类 | 用户快速存入灵感 |
| 任务拆分 | 用户发起高层目标 |

### 12.2 Cockpit 展示 Skill 的规则

每个 Skill Badge 至少展示：

- Skill 名称。
- 所属类别。
- 是否可用。
- 最近使用时间。
- 当前是否被任务调用。

## 13. 模型选择规则

Cockpit 的模型区域展示模型路由摘要，并允许进入模型切换。

### 13.1 默认推荐

| Cockpit 场景 | 推荐模型类型 |
|---|---|
| 全书结构分析 | 深度推理模型 |
| 任务拆分 | 工具调用模型或深度推理模型 |
| 快速灵感分类 | 高速轻量模型 |
| 灵感发散 | 创意发散模型 |
| 章节写作入口 | 长文本写作模型 |
| 文风润色入口 | 风格模仿模型 |
| 审查风险分析 | 审校模型 |
| 线索 / 伏笔分析 | 深度推理模型 |
| 记忆冲突分析 | 深度推理模型或工具调用模型 |

### 13.2 手动覆盖

用户可以对以下范围设置模型：

- 当前任务。
- 当前 Subagent。
- 当前 Skill 调用。
- 当前小说默认模型。

规则：

- 手动覆盖必须记录来源和时间。
- 高成本模型必须提醒。
- 上下文不足时必须提醒。
- 任务失败后可以推荐降级或切换模型。

## 14. 长期记忆读写

### 14.1 Cockpit 读取的记忆

Cockpit 可以读取：

- Project Memory：项目目标、题材、平台、整体风格。
- Core Canon Memory：核心设定是否完整、是否有冲突。
- Character Memory：人物状态摘要。
- World Memory：世界观风险摘要。
- Clue Memory：未回收线索和暗线摘要。
- Style Memory：当前写作风格摘要。
- Workflow Memory：用户常用模型、常用 Skill、常用工作流。

### 14.2 Cockpit 写入的记忆

Cockpit 默认不直接写入核心记忆。

Cockpit 可以写入：

- 用户确认后的工作流偏好。
- 用户确认后的默认模型偏好。
- 用户确认后的常用快捷动作。

Cockpit 不能直接写入：

- 核心设定记忆。
- 人物事实记忆。
- 世界观规则记忆。
- 线索回收事实。
- 正文内容事实。

这些必须由对应模块或审查流程完成，并保留来源。

## 15. 可视化要求

### 15.1 总体布局

MVP 桌面布局：

```text
┌────────────────────────────────────────────────────────────┐
│ Novel Cockpit                                              │
├──────────────┬──────────────────────────────┬──────────────┤
│ Project Rail │ Workspace Header             │ Agent Rail   │
│              ├──────────────────────────────┤              │
│ Navigation   │ Novel Structure Map           │ Tasks        │
│ Inspiration  │                              │ Subagents    │
│ Characters   ├──────────────┬───────────────┤ Skills       │
│ Worldbuilding│ Inspiration  │ Character /   │ Model Router │
│ Outline      │ Vault Preview│ Clue Preview  │ Memory       │
│ Review       ├──────────────────────────────┤ Review       │
│              │ Clue Attribution Summary      │              │
└──────────────┴──────────────────────────────┴──────────────┘
```

### 15.2 中央结构地图

结构地图展示：

- 篇章卡片。
- 章节卡片。
- 故事里程碑。
- 篇章之间的推进关系。
- 章节风险标记。
- 当前选中章节。
- 锁定章节。
- 泳道图入口。

### 15.3 右侧 Agent Rail

右侧面板展示：

- Agent Tasks。
- Subagents。
- Skills。
- Model Router。
- Memory Layer。
- Review Checklist。

### 15.4 底部线索归因摘要

底部摘要展示一条或多条关键线索链：

```text
Provider → Trigger → Receiver → Payoff
```

每个节点必须能说明：

- 谁提供线索。
- 谁触发线索。
- 谁接收线索。
- 回收位置。
- 当前是否完整。

完整线索系统由 `05-clue-foreshadowing-spec.md` 定义。

## 16. 异常情况

### 16.1 小说数据加载失败

处理方式：

- 显示错误状态。
- 提供重试。
- 提供返回项目列表。
- 不展示过期快照为真实状态，除非明确标记“离线缓存”。

### 16.2 空小说项目

处理方式：

- 显示初始化引导。
- 提供创建大纲、存灵感、创建人物、创建第一篇章的快捷动作。
- 不展示虚假的章节进度。

### 16.3 Agent 任务失败

处理方式：

- 在右侧任务列表标记 failed。
- 展示失败原因。
- 提供重启任务。
- 如果失败与模型有关，提示切换模型。

### 16.4 记忆冲突

处理方式：

- 在 Memory Layer 标记 conflict。
- 展示冲突数量。
- 提供进入记忆冲突解决页。
- 不自动覆盖旧记忆。

### 16.5 高成本模型调用

处理方式：

- 在 Model Router 显示 high cost。
- 执行前请求确认。
- 提供低成本替代模型。

### 16.6 未回收关键伏笔

处理方式：

- 在 Clue Summary 标记 warning 或 danger。
- 显示相关章节和线索链。
- 提供进入线索 / 伏笔系统。

### 16.7 缺失关键字段

处理方式：

- 对缺字段模块显示提醒。
- 提供补全入口。
- Agent 可以生成补全建议，但不能静默写入核心事实。

## 17. 验收标准

### 17.1 信息架构验收

- 用户进入一本小说后默认可进入 Novel Cockpit。
- Cockpit 能跳转到灵感库、大纲、篇章泳道图、人物、世界观、线索、章节写作、审查、模型和记忆模块。
- Cockpit 不混用其他小说的数据。

### 17.2 页面展示验收

- 页面展示当前小说标题、类型、状态和更新时间。
- 页面展示全书结构地图摘要。
- 页面展示至少一个篇章或空项目引导。
- 页面展示 Agent 任务区。
- 页面展示 Subagent 和 Skill 区。
- 页面展示模型路由摘要。
- 页面展示长期记忆摘要。
- 页面展示审查或风险摘要。

### 17.3 交互验收

- 用户可以聚焦篇章。
- 用户可以聚焦章节。
- 用户可以进入篇章泳道图。
- 用户可以快速记录灵感。
- 用户可以发起 Agent 高层任务。
- 用户可以查看模型推荐理由。
- 用户可以进入记忆详情或冲突页。
- 用户可以从提醒进入对应处理页面。

### 17.4 Agent 验收

- Agent 可以生成下一步建议。
- Agent 可以生成任务拆分草案。
- 高风险任务必须等待用户确认。
- Agent 建议必须结构化展示，不只是聊天文本。

### 17.5 数据验收

- Cockpit 页面由 `NovelCockpitSnapshot` 或等价聚合数据驱动。
- 每个摘要对象都带有 `novelId` 或可追溯到当前 `Novel`。
- 快速灵感创建后进入当前小说的灵感库。
- 模型覆盖项记录作用范围。
- 记忆状态只展示摘要，不直接改写核心记忆。

### 17.6 异常验收

- 加载失败有错误状态和重试入口。
- 空项目有初始化引导。
- 任务失败有重启入口。
- 记忆冲突有处理入口。
- 高成本模型调用有确认提醒。

## 18. 后续版本

### 18.1 V2

- 可配置 Cockpit 面板。
- 多视图布局：写作视图、审查视图、线索视图、连载视图。
- 更完整的任务依赖图。
- 最近操作时间线。
- 读者反馈摘要。
- 多端布局优化。

### 18.2 V3

- 多人协作驾驶舱。
- 编辑 / 作者双视图。
- 工作室项目总控台。
- 跨小说世界观宇宙管理。
- 数据分析与连载运营面板。

## 19. 与其他 spec 的边界

| 相关 spec | 边界 |
|---|---|
| `01-novel-project-spec.md` | 定义小说项目创建、进入、数据隔离；Cockpit 假设 Novel 已存在 |
| `03-inspiration-vault-spec.md` | 定义灵感完整管理；Cockpit 只提供快速入口和摘要 |
| `04-arc-swimlane-diagram-spec.md` | 定义泳道图编辑；Cockpit 只展示入口和摘要 |
| `05-clue-foreshadowing-spec.md` | 定义线索链和伏笔归因；Cockpit 只展示关键链路摘要 |
| `06-character-system-spec.md` | 定义人物卡和关系图；Cockpit 只展示人物摘要和入口 |
| `07-worldbuilding-system-spec.md` | 定义世界观条目和冲突检查；Cockpit 只展示设定摘要和风险 |
| `08-chapter-writing-spec.md` | 定义章节写作流程；Cockpit 只展示当前章节和写作入口 |
| `09-chapter-review-spec.md` | 定义审查报告和修改任务；Cockpit 只展示审查摘要和风险 |
| `10-agent-orchestration-spec.md` | 定义任务拆分和执行；Cockpit 是主要入口和状态展示面板 |
| `11-model-router-spec.md` | 定义模型档案、路由和降级；Cockpit 只展示摘要和切换入口 |
| `12-long-term-memory-spec.md` | 定义记忆读写和冲突处理；Cockpit 只展示记忆状态和入口 |

