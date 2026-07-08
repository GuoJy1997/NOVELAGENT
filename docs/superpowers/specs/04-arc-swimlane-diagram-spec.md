# 04 Arc Swimlane Diagram Spec

状态：Review Candidate

日期：2026-07-08

上游依赖：

- `01-novel-project-spec.md`，当前尚未编写。本 spec 假设 `Novel`、`Arc`、`Chapter` 等项目基础对象已存在。
- `02-novel-cockpit-spec.md`，Cockpit 展示全书结构地图，并提供进入某个篇章泳道图的入口。
- `03-inspiration-vault-spec.md`，灵感库可以生成 `EventNode` 草案并交给本模块确认。

相关底座文档：`2026-07-08-novel-agent-product-foundation-design.md`

## 1. 功能定位

Arc Swimlane Diagram 是一个重要篇章 / 故事单元的可视化叙事编排图。

它解决的问题是：

1. 一本小说由多个重要篇章组成，用户需要先看到全书由哪些篇章泳道图构成，再进入某个篇章细看。
2. 一个篇章内部不只有剧情事件，还包含线索、伏笔、人物弧光、世界观揭露、情绪张力等多条叙事维度。
3. 用户需要像软件开发里的泳道图一样，把事件拆成小方块，用箭头连接，清楚看到故事推进与伏笔推进。
4. 每个线索 / 伏笔节点必须记录“谁提供、谁触发、谁接收、谁误导、谁隐藏、哪里回收”。
5. Agent 需要基于泳道图判断剧情因果、伏笔完整性、人物行为合理性和章节写作上下文。

一句话定义：

> 一个 Arc Swimlane Diagram 代表一个重要篇章或完整故事单元，横向展示事件推进，纵向拆分叙事维度，用节点和箭头呈现剧情、线索、人物、世界观之间的关系。

## 2. 用户角色

### 2.1 新手作者

用泳道图理解“一个篇章到底由哪些事件组成”，避免只写散乱剧情。

### 2.2 连载网文作者

用泳道图安排章节节奏、钩子、反转、伏笔和回收，防止连载过程中忘线。

### 2.3 强设定作者

用泳道图控制世界观信息何时揭露、通过谁揭露、对剧情造成什么影响。

### 2.4 悬疑 / 推理作者

用泳道图管理线索链、误导线索、暗线、证据信息差和最终回收。

### 2.5 编辑 / 审稿人

用泳道图快速检查一个篇章的事件因果、节奏密度、伏笔完整性和人物行动逻辑。

## 3. 入口位置

### 3.1 主入口

```text
Novel Cockpit
  ↓
全书结构地图
  ↓
选择 Arc
  ↓
打开 Arc Swimlane Diagram
```

### 3.2 其他入口

以下模块可以跳转到某个泳道图或泳道节点：

- 大纲 / 篇章管理。
- 灵感库：灵感转成泳道节点草案。
- 线索 / 伏笔系统：从线索链跳转到相关节点。
- 人物系统：从人物弧光跳转到相关事件节点。
- 世界观系统：从设定揭露计划跳转到相关节点。
- 章节写作：从章节卡进入该章节相关节点。
- 审查报告：从问题定位跳转到相关节点。
- Agent 任务详情：从任务涉及对象跳转到相关节点。

### 3.3 创建入口规则

当用户从 Cockpit 或 Arc 页面进入泳道图时：

1. 如果该 Arc 已有泳道图，直接打开最近使用的泳道图。
2. 如果该 Arc 没有泳道图，显示“创建泳道图”入口。
3. 如果该 Arc 是空篇章，系统可以提供默认泳道模板和初始化建议。
4. 如果用户从灵感库进入且只生成了节点草案，必须先选择目标 Arc，才能放入正式泳道图。

## 4. 核心用户目标

Arc Swimlane Diagram 必须支持用户完成以下目标：

1. 在全书结构中看到一本小说由多个篇章泳道图组成。
2. 进入某个篇章泳道图并查看完整故事单元。
3. 横向查看事件推进顺序。
4. 纵向查看不同叙事维度，例如剧情、线索、人物、世界观。
5. 创建、编辑、移动、连接事件节点。
6. 为每个节点标记所属章节、场景、故事时间、地点、人物和叙事作用。
7. 为线索 / 伏笔节点填写提供者、触发者、接收者、误导者、隐藏者、回收点。
8. 用箭头表达因果、依赖、伏笔、误导、回收、人物影响。
9. 从节点跳转到章节、人物、线索、世界观或灵感来源。
10. 让 Agent 检查一个篇章的结构、节奏、线索完整性和设定冲突。

## 5. MVP 范围

### 5.1 图层级

MVP 支持：

- 一本小说包含多个 `Arc`。
- 一个 `Arc` 至少可以拥有一个 `SwimlaneDiagram`。
- 一个 `SwimlaneDiagram` 代表一个重要篇章或完整故事单元。
- Cockpit 的全书结构地图展示所有 Arc，并提供进入对应泳道图的入口。

### 5.2 默认泳道

MVP 默认四条纵向泳道：

1. 剧情推进。
2. 线索 / 伏笔。
3. 人物弧光。
4. 世界观 / 设定揭露。

MVP 可以允许用户重命名泳道，但不要求复杂自定义模板。

### 5.3 横向事件列

MVP 横向以事件推进为主，不以自然日期为主。

每个横向事件列代表一个关键故事事件或一组紧密关联的小事件。事件列至少记录：

- 顺序。
- 所属章节 / 场景。
- 故事内时间。
- 地点。
- POV 或主要观察者。
- 事件标题。
- 事件目的。
- 冲突 / 转折。
- 事件结果。

### 5.4 节点

MVP 支持以下节点类型：

- 剧情节点。
- 线索节点。
- 伏笔节点。
- 人物节点。
- 世界观节点。
- 反转节点。
- 高潮节点。
- 回收节点。
- 章节钩子节点。

### 5.5 连接线

MVP 支持以下连接类型：

- 因果。
- 时间顺序。
- 伏笔指向。
- 回收。
- 误导。
- 人物影响。
- 世界观揭露依赖。

### 5.6 基础操作

MVP 支持：

- 创建泳道图。
- 创建节点。
- 编辑节点。
- 移动节点。
- 删除节点草案。
- 锁定节点。
- 创建连接线。
- 删除连接线。
- 聚焦某个节点。
- 从节点跳转到相关对象。
- Agent 检查泳道图。

## 6. 非 MVP 范围

第一版不做：

- 多人实时协作编辑。
- 无限自定义泳道类型。
- 复杂自动布局算法。
- 三维时间线。
- 动态动画回放整本小说。
- 真实地理地图联动。
- 多宇宙 / 平行时间线编辑。
- 跨小说共享同一个泳道图。
- 自动改写正文。
- 自动覆盖核心设定。

V2 可以支持更强的自定义泳道、自动布局、版本对比和多视图编辑。

## 7. 核心流程

### 7.1 从 Cockpit 进入泳道图

```text
用户进入 Novel Cockpit
  ↓
在全书结构地图中选择 Arc
  ↓
点击“打开泳道图”
  ↓
系统加载该 Arc 的 SwimlaneDiagram
  ↓
展示泳道、事件列、节点和连接线
```

成功结果：

- 用户看到该篇章的完整故事编排。
- 用户可以继续编辑节点、连接线和线索归因。

异常结果：

- 如果泳道图不存在，显示创建入口。
- 如果 Arc 不存在或不属于当前 Novel，禁止加载。

### 7.2 创建泳道图

```text
用户选择 Arc
  ↓
点击“创建泳道图”
  ↓
系统生成默认泳道：剧情推进、线索 / 伏笔、人物弧光、世界观 / 设定揭露
  ↓
系统创建空事件列区域
  ↓
用户开始添加节点
```

规则：

- 新泳道图必须绑定 `novelId` 和 `arcId`。
- 默认泳道不可全部删除。
- 用户可以稍后新增扩展泳道。

### 7.3 创建事件列

```text
用户点击“添加事件”
  ↓
填写事件标题、顺序、章节 / 场景、故事时间、地点
  ↓
系统创建 EventColumn
  ↓
用户可在该列的不同泳道中添加节点
```

规则：

- 事件列是横向结构单位。
- 同一事件列内可以有多个泳道节点。
- 如果用户只创建节点，系统可以自动创建对应事件列。

### 7.4 创建普通节点

```text
用户选择泳道和事件列
  ↓
点击添加节点
  ↓
选择节点类型
  ↓
填写节点标题、说明、参与人物、叙事作用
  ↓
系统创建 EventNode
```

规则：

- 所有节点必须绑定 `novelId`、`arcId`、`diagramId`。
- 节点必须属于一个泳道。
- 节点可以暂时不绑定章节，但必须标记为未归属章节。

### 7.5 创建线索 / 伏笔节点

```text
用户选择线索 / 伏笔泳道
  ↓
创建线索节点或伏笔节点
  ↓
填写线索内容
  ↓
填写提供者、触发者、接收者、观察者、误导者、隐藏者、预期回收位置
  ↓
系统检查归因完整性
  ↓
节点进入待完善或可用状态
```

硬性规则：

- 线索 / 伏笔节点可以先以草案保存，但只要进入 `ready`、`linked`、`approved` 或 `locked` 状态，就必须补齐归因字段。
- 线索 / 伏笔节点必须记录谁提供线索；缺失时只能保持 `incomplete`。
- 线索 / 伏笔节点必须记录谁触发线索；缺失时只能保持 `incomplete`。
- 线索 / 伏笔节点必须记录谁接收、观察或错过线索；缺失时只能保持 `incomplete`。
- 如果是误导线索，必须记录误导者或误导机制。
- 如果是隐藏线索，必须记录隐藏者或隐藏机制。
- 如果该节点用于回收，必须记录回收位置和回收对象。

### 7.6 连接节点

```text
用户从一个节点拖出连接线
  ↓
选择目标节点
  ↓
选择连接类型
  ↓
系统创建 EventEdge
```

规则：

- 连接线必须有方向。
- 因果连接必须从原因指向结果。
- 伏笔连接必须从种植节点指向回收节点。
- 误导连接必须从误导节点指向被误导对象或错误结论节点。
- 系统允许跨泳道连接。

### 7.7 从灵感转入节点草案

```text
用户在灵感库选择“转成泳道节点”
  ↓
选择目标 Arc
  ↓
Agent 推荐事件列、泳道和节点类型
  ↓
系统生成 EventNodeDraft
  ↓
用户确认
  ↓
草案进入泳道图
```

规则：

- 灵感来源必须保留为 `sourceInspirationId`。
- 草案确认前不能影响正式线索链或章节大纲。
- 如果是线索 / 伏笔草案，必须提示补齐归因字段。

### 7.8 Agent 检查泳道图

```text
用户点击“检查篇章结构”
  ↓
Agent 读取泳道图、章节摘要、人物摘要、世界观摘要、线索摘要
  ↓
Agent 输出结构问题、伏笔问题、人物问题、节奏问题、设定问题
  ↓
系统生成 DiagramReview
  ↓
用户确认是否转成修改任务
```

规则：

- Agent 只能生成建议，不能自动覆盖节点。
- 高风险改动必须由用户确认。

### 7.9 从泳道图进入章节写作

```text
用户聚焦某个 Chapter 相关节点
  ↓
点击“写这一章”
  ↓
系统整理该 Chapter 相关节点、线索、人物、世界观
  ↓
进入章节写作模块
```

规则：

- 泳道图为章节写作提供结构化上下文。
- 正文生成由 `08-chapter-writing-spec.md` 定义。

## 8. 数据对象

### 8.1 Arc

篇章 / 故事单元。一个 Arc 可以对应一个或多个泳道图。MVP 默认一个 Arc 一个主泳道图。

### 8.2 SwimlaneDiagram

某个 Arc 的泳道图主对象。

### 8.3 Swimlane

泳道，表示一种叙事维度。

### 8.4 EventColumn

横向事件列，代表一个关键事件位置或事件组。

### 8.5 EventNode

泳道图里的具体节点。

### 8.6 EventEdge

节点之间的连接线。

### 8.7 ClueAttribution

线索 / 伏笔节点的归因信息。

### 8.8 DiagramReview

Agent 对泳道图的审查结果。

### 8.9 DiagramViewState

前端视图状态，例如缩放、拖拽、聚焦对象。

## 9. 字段定义

### 9.1 SwimlaneDiagram

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `diagramId` | string | 是 | 泳道图 ID |
| `novelId` | string | 是 | 所属小说 ID |
| `arcId` | string | 是 | 所属篇章 ID |
| `title` | string | 是 | 图标题 |
| `description` | string | 否 | 图说明 |
| `status` | enum | 是 | `draft`、`planning`、`active`、`reviewing`、`locked`、`archived` |
| `version` | number | 是 | 版本号 |
| `swimlanes` | `Swimlane[]` | 是 | 泳道 |
| `eventColumns` | `EventColumn[]` | 是 | 横向事件列 |
| `nodes` | `EventNode[]` | 是 | 节点 |
| `edges` | `EventEdge[]` | 是 | 连接线 |
| `reviewSummary` | `DiagramReviewSummary` | 否 | 审查摘要 |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.2 Swimlane

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `swimlaneId` | string | 是 | 泳道 ID |
| `diagramId` | string | 是 | 所属泳道图 |
| `novelId` | string | 是 | 所属小说 |
| `arcId` | string | 是 | 所属篇章 |
| `type` | enum | 是 | 泳道类型 |
| `label` | string | 是 | 展示名称 |
| `order` | number | 是 | 纵向排序 |
| `locked` | boolean | 是 | 是否锁定 |
| `visible` | boolean | 是 | 是否显示 |

### 9.3 SwimlaneType

MVP 类型：

| 值 | 说明 |
|---|---|
| `plotProgression` | 剧情推进 |
| `clueForeshadowing` | 线索 / 伏笔 |
| `characterArc` | 人物弧光 |
| `worldbuildingReveal` | 世界观 / 设定揭露 |

V2 扩展类型：

| 值 | 说明 |
|---|---|
| `emotionalTension` | 情绪张力 |
| `factionPower` | 阵营 / 权力冲突 |
| `themeExpression` | 主题表达 |
| `timeSpaceShift` | 时间 / 空间变化 |
| `publicationHook` | 连载钩子 / 发布节奏 |

### 9.4 EventColumn

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `eventColumnId` | string | 是 | 事件列 ID |
| `diagramId` | string | 是 | 所属泳道图 |
| `novelId` | string | 是 | 所属小说 |
| `arcId` | string | 是 | 所属篇章 |
| `order` | number | 是 | 横向顺序 |
| `title` | string | 是 | 事件标题 |
| `chapterId` | string | 否 | 所属章节 |
| `sceneId` | string | 否 | 所属场景 |
| `storyTime` | string | 否 | 故事内时间 |
| `locationId` | string | 否 | 地点 ID |
| `povCharacterId` | string | 否 | POV 或主要观察者 |
| `eventPurpose` | string | 否 | 事件目的 |
| `conflict` | string | 否 | 冲突或转折 |
| `outcome` | string | 否 | 事件结果 |
| `tensionLevel` | number | 否 | 张力等级，1 到 5 |

### 9.5 EventNode

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `nodeId` | string | 是 | 节点 ID |
| `diagramId` | string | 是 | 所属泳道图 |
| `novelId` | string | 是 | 所属小说 |
| `arcId` | string | 是 | 所属篇章 |
| `eventColumnId` | string | 是 | 所属事件列 |
| `swimlaneId` | string | 是 | 所属泳道 |
| `type` | enum | 是 | 节点类型 |
| `title` | string | 是 | 节点标题 |
| `summary` | string | 否 | 节点摘要 |
| `chapterId` | string | 否 | 所属章节 |
| `sceneId` | string | 否 | 所属场景 |
| `storyTime` | string | 否 | 故事内时间 |
| `locationId` | string | 否 | 地点 ID |
| `participantCharacterIds` | string[] | 是 | 参与人物 |
| `povCharacterId` | string | 否 | POV 或主要观察者 |
| `narrativePurpose` | string | 否 | 对故事的作用 |
| `mainlineImpact` | string | 否 | 对主线的作用 |
| `foreshadowingImpact` | string | 否 | 对伏笔的作用 |
| `emotionalBeat` | string | 否 | 情绪节拍 |
| `worldItemIds` | string[] | 是 | 关联设定 |
| `clueIds` | string[] | 是 | 关联线索 |
| `foreshadowingIds` | string[] | 是 | 关联伏笔 |
| `sourceInspirationIds` | string[] | 是 | 来源灵感 |
| `attribution` | `ClueAttribution` | 否 | 线索归因 |
| `status` | enum | 是 | 节点状态 |
| `riskLevel` | enum | 是 | 风险等级 |
| `missingFields` | string[] | 是 | 缺失字段 |
| `locked` | boolean | 是 | 是否锁定 |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.6 EventNodeType

| 值 | 说明 |
|---|---|
| `plot` | 剧情节点 |
| `clue` | 线索节点 |
| `foreshadowing` | 伏笔节点 |
| `character` | 人物弧光节点 |
| `worldbuilding` | 世界观揭露节点 |
| `twist` | 反转节点 |
| `climax` | 高潮节点 |
| `payoff` | 回收节点 |
| `chapterHook` | 章节钩子节点 |

### 9.7 EventNodeStatus

| 值 | 说明 |
|---|---|
| `draft` | 草案 |
| `incomplete` | 缺关键字段 |
| `ready` | 可用 |
| `linked` | 已与其他对象建立关联 |
| `reviewing` | 审查中 |
| `approved` | 已确认 |
| `locked` | 已锁定 |
| `deprecated` | 已废弃 |

### 9.8 ClueAttribution

线索 / 伏笔 / 回收节点必须使用该对象。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `providerCharacterId` | string | 条件必填 | 谁提供线索 |
| `triggerCharacterId` | string | 条件必填 | 谁触发线索 |
| `receiverCharacterId` | string | 条件必填 | 谁接收线索 |
| `observerCharacterIds` | string[] | 是 | 谁观察到线索 |
| `missedByCharacterIds` | string[] | 是 | 谁错过线索 |
| `concealerCharacterId` | string | 否 | 谁隐藏线索 |
| `misleaderCharacterId` | string | 否 | 谁误导线索 |
| `payoffNodeId` | string | 否 | 回收节点 |
| `payoffChapterId` | string | 否 | 回收章节 |
| `credibility` | enum | 是 | `true`、`partial`、`false`、`unknown` |
| `visibilityToReader` | enum | 是 | `hidden`、`hinted`、`visible`、`misleading` |
| `completeness` | enum | 是 | `complete`、`missingProvider`、`missingTrigger`、`missingReceiver`、`missingPayoff`、`incomplete` |

条件必填规则：

- `clue` 节点在 `draft` 或 `incomplete` 状态可暂缺归因字段，但必须将缺失项写入 `missingFields`。
- `clue` 节点进入 `ready`、`linked`、`approved` 或 `locked` 状态前，必须填写 `providerCharacterId`、`triggerCharacterId`、`receiverCharacterId`。
- `foreshadowing` 节点进入 `ready`、`linked`、`approved` 或 `locked` 状态前，必须填写 `providerCharacterId` 或 `triggerCharacterId`，并填写预期 `payoffChapterId` 或 `payoffNodeId`。
- `payoff` 节点进入 `ready`、`linked`、`approved` 或 `locked` 状态前，必须填写被回收对象，并关联原伏笔或线索。
- `misleading` 线索进入 `ready`、`linked`、`approved` 或 `locked` 状态前，必须填写 `misleaderCharacterId` 或说明误导机制。

### 9.9 EventEdge

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `edgeId` | string | 是 | 连接线 ID |
| `diagramId` | string | 是 | 所属泳道图 |
| `novelId` | string | 是 | 所属小说 |
| `arcId` | string | 是 | 所属篇章 |
| `sourceNodeId` | string | 是 | 起点节点 |
| `targetNodeId` | string | 是 | 终点节点 |
| `type` | enum | 是 | 连接类型 |
| `label` | string | 否 | 展示说明 |
| `strength` | enum | 是 | `weak`、`normal`、`strong` |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.10 EventEdgeType

| 值 | 说明 |
|---|---|
| `causes` | 因果 |
| `precedes` | 时间顺序 |
| `foreshadows` | 伏笔指向 |
| `paysOff` | 回收 |
| `misleads` | 误导 |
| `reveals` | 揭示 |
| `characterImpact` | 人物影响 |
| `worldbuildingDependency` | 设定依赖 |
| `blocks` | 阻碍 |

### 9.11 DiagramReview

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `reviewId` | string | 是 | 审查 ID |
| `diagramId` | string | 是 | 泳道图 ID |
| `novelId` | string | 是 | 小说 ID |
| `arcId` | string | 是 | 篇章 ID |
| `reviewType` | enum | 是 | `structure`、`clue`、`character`、`worldbuilding`、`pacing`、`full` |
| `findings` | `DiagramFinding[]` | 是 | 问题列表 |
| `modelId` | string | 是 | 使用模型 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.12 DiagramViewState

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `diagramId` | string | 是 | 泳道图 ID |
| `zoom` | number | 是 | 缩放比例 |
| `panX` | number | 是 | 横向平移 |
| `panY` | number | 是 | 纵向平移 |
| `focusedNodeId` | string | 否 | 当前聚焦节点 |
| `focusedColumnId` | string | 否 | 当前聚焦事件列 |
| `visibleSwimlaneIds` | string[] | 是 | 可见泳道 |
| `selectedNodeIds` | string[] | 是 | 选中节点 |

## 10. 状态机

### 10.1 泳道图状态

```text
draft
  ↓
planning
  ↓
active
  ↓
reviewing
  ↓
locked
```

归档分支：

```text
draft / planning / active / reviewing / locked
  ↓
archived
```

规则：

- `draft`：刚创建，内容很少。
- `planning`：正在搭建事件结构。
- `active`：可用于章节写作。
- `reviewing`：正在进行结构或线索审查。
- `locked`：该篇章结构已确认，不允许低风险外的自动改动。
- `archived`：不再作为当前篇章结构使用。

### 10.2 节点状态

```text
draft
  ↓
incomplete
  ↓
ready
  ↓
linked
  ↓
approved
  ↓
locked
```

审查分支：

```text
ready / linked
  ↓
reviewing
  ↓
approved
```

废弃分支：

```text
draft / incomplete / ready / linked
  ↓
deprecated
```

规则：

- 线索 / 伏笔节点缺少归因字段时必须为 `incomplete`。
- 被章节写作使用并确认后可以进入 `approved`。
- 影响已发布章节的节点应进入 `locked`。

### 10.3 线索归因完整性状态

```text
incomplete
  ↓
missingProvider / missingTrigger / missingReceiver / missingPayoff
  ↓
complete
```

规则：

- 系统必须根据 `ClueAttribution` 自动计算完整性。
- 用户可以暂时保存不完整节点，但必须看到缺失提示。
- 不完整线索节点不能被标记为已完成线索链。

## 11. Agent 行为

### 11.1 可以自动执行

Agent 可以：

- 根据 Arc 大纲生成泳道图草案。
- 根据章节大纲生成事件列。
- 根据灵感生成节点草案。
- 推荐节点所属泳道。
- 推荐事件顺序。
- 推荐节点连接线。
- 检查线索归因是否完整。
- 检查伏笔是否有回收点。
- 检查人物动机是否支撑事件。
- 检查世界观揭露是否过早或过晚。
- 检查节奏密度。
- 生成结构审查报告。

### 11.2 必须用户确认

以下行为必须用户确认：

- 删除节点。
- 删除连接线。
- 移动已锁定节点。
- 改变重大事件顺序。
- 改变线索提供者、触发者、接收者或回收点。
- 改变人物死亡、背叛、结局、重大反转。
- 把节点写入正式章节大纲。
- 把伏笔标记为已回收。
- 自动生成高成本全图审查。

### 11.3 Agent 建议格式

Agent 对泳道图输出建议时，必须结构化：

```text
建议类型
涉及节点 / 连接 / 泳道
问题说明
叙事影响
风险等级
建议修改
是否需要用户确认
推荐模型
推荐 Skill
```

不能只输出聊天式文本。

## 12. Skill 调用

### 12.1 可调用 Skill

| Skill | 触发场景 |
|---|---|
| 篇章结构分析 | 检查 Arc 内事件是否形成完整故事单元 |
| 泳道图草案生成 | 从 Arc 大纲或章节大纲生成初始图 |
| 事件节点生成 | 从灵感、章节卡或大纲生成节点 |
| 线索归因检查 | 检查线索 / 伏笔节点是否记录提供者、触发者、接收者、回收点 |
| 伏笔回收检查 | 检查种下的伏笔是否有回收节点 |
| 人物动机检查 | 检查人物行为是否支撑事件 |
| 世界观揭露检查 | 检查设定揭露是否符合规则和节奏 |
| 节奏密度检查 | 检查事件密度、高潮位置和章节钩子 |
| 章节上下文整理 | 为章节写作整理相关节点 |

### 12.2 Skill 输出要求

Skill 输出必须包含：

- 输入图 ID。
- 涉及节点 ID。
- 涉及连接 ID。
- 发现问题。
- 建议动作。
- 风险等级。
- 使用模型。
- 是否需要用户确认。

## 13. 模型选择规则

### 13.1 默认模型路由

| 场景 | 推荐模型类型 |
|---|---|
| 从大纲生成泳道图 | 深度推理模型 |
| 从灵感生成节点草案 | 深度推理模型或创意发散模型 |
| 线索 / 伏笔归因检查 | 深度推理模型 |
| 伏笔回收检查 | 深度推理模型 |
| 人物动机检查 | 审校模型或深度推理模型 |
| 世界观揭露检查 | 审校模型或深度推理模型 |
| 节奏密度检查 | 审校模型 |
| 大图摘要 | 高速轻量模型 |
| 为章节写作整理上下文 | 工具调用模型或长文本写作模型 |

### 13.2 手动覆盖

用户可以为以下范围选择模型：

- 单次泳道图审查。
- 单个节点生成。
- 单条线索归因检查。
- 当前 Arc 的默认模型。

规则：

- 全图审查可能成本较高，执行前必须提示。
- 如果图过大，系统应提示上下文可能不足，并建议按章节或泳道分段审查。
- 模型推荐必须展示理由。

## 14. 长期记忆读写

### 14.1 可读取的记忆

泳道图可以读取：

- Project Memory：小说目标、类型、平台和整体风格。
- Core Canon Memory：核心设定。
- Character Memory：人物目标、关系、秘密、弧光。
- World Memory：世界观规则。
- Clue Memory：已有线索、伏笔、暗线、误导、回收状态。
- Style Memory：章节写作风格偏好。

用途：

- 生成节点。
- 检查冲突。
- 推荐线索归因。
- 为章节写作整理上下文。

### 14.2 可写入的记忆

泳道图默认不直接写入核心记忆。

可以写入：

- 用户确认后的结构规划偏好。
- 用户确认后的泳道模板偏好。
- 用户确认后的常用节点类型。

不能直接写入：

- 核心设定事实。
- 人物事实。
- 世界观规则事实。
- 线索回收事实。
- 正文事实。

如果泳道图节点需要写入核心记忆，必须经过：

```text
节点确认
  ↓
目标模块入库
  ↓
审查或用户确认
  ↓
长期记忆写入
```

## 15. 可视化要求

### 15.1 全书到篇章的层级

用户在 Cockpit 看到：

```text
Novel
  ├─ Arc 1 → SwimlaneDiagram 1
  ├─ Arc 2 → SwimlaneDiagram 2
  ├─ Arc 3 → SwimlaneDiagram 3
  └─ Arc N → SwimlaneDiagram N
```

用户可以拖拽、缩放、聚焦到某个 Arc 的泳道图。

### 15.2 泳道图布局

基础布局：

```text
横向：事件推进 →

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Event 1      │ Event 2      │ Event 3      │ Event 4      │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ 剧情推进      │ 节点          │ 节点          │ 节点          │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ 线索 / 伏笔   │ 节点          │ 节点          │ 回收          │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ 人物弧光      │ 节点          │ 节点          │ 节点          │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ 世界观揭露    │ 节点          │              │ 节点          │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### 15.3 节点卡片展示

每个节点卡片至少展示：

- 节点标题。
- 节点类型。
- 所属章节。
- 参与人物。
- 风险等级。
- 是否缺字段。
- 是否有关联线索。
- 是否已回收。
- 是否来源于灵感。

### 15.4 线索 / 伏笔节点展示

线索 / 伏笔节点必须突出展示：

```text
Provider → Trigger → Receiver → Payoff
```

并显示：

- 可信度。
- 读者可见性。
- 是否误导。
- 是否隐藏。
- 是否完整。

### 15.5 连接线展示

连接线必须有视觉区分：

- 因果线。
- 时间线。
- 伏笔线。
- 回收线。
- 误导线。
- 人物影响线。
- 世界观依赖线。

MVP 可用颜色、线型、箭头样式区分。

### 15.6 详情侧栏

点击节点后显示详情侧栏：

- 基础信息。
- 章节 / 场景。
- 人物。
- 线索归因。
- 关联对象。
- 来源灵感。
- Agent 建议。
- 缺失字段。
- 操作按钮。

## 16. 异常情况

### 16.1 Arc 不存在或不属于当前 Novel

处理方式：

- 禁止加载。
- 显示错误。
- 提供返回 Cockpit。

### 16.2 泳道图不存在

处理方式：

- 显示创建泳道图入口。
- 提供默认模板。
- 提供从大纲生成草案。

### 16.3 节点缺少关键字段

处理方式：

- 节点状态为 `incomplete`。
- 在节点卡片和详情侧栏显示缺失字段。
- 允许保存草案。
- 不允许标记为已确认。

### 16.4 线索节点缺少归因

处理方式：

- 自动计算 `ClueAttribution.completeness`。
- 标记缺少提供者、触发者、接收者或回收点。
- 提供补全建议。
- 不允许进入完整线索链状态。

### 16.5 连接线形成矛盾

例如回收发生在种植之前、原因发生在结果之后。

处理方式：

- 显示时间 / 因果冲突。
- 提供调整顺序或改连接类型建议。
- 不自动修改。

### 16.6 删除已被章节使用的节点

处理方式：

- 显示影响范围。
- 要求二次确认。
- 如果节点关联已发布章节，默认不允许删除，只允许废弃或复制新版本。

### 16.7 大图上下文过长

处理方式：

- 提示分泳道或分章节审查。
- 推荐使用长上下文或深度推理模型。
- 保留当前视图状态。

## 17. 验收标准

### 17.1 数据隔离验收

- 每个泳道图必须有 `novelId` 和 `arcId`。
- 只能加载当前小说下的泳道图。
- 跨小说不能共享可变泳道图。
- 从灵感转入节点时，必须校验灵感和目标 Arc 属于同一小说，或走跨小说复制流程。

### 17.2 层级验收

- Cockpit 能展示一本小说由多个 Arc / 泳道图组成。
- 用户可以从 Cockpit 进入某个 Arc 的泳道图。
- 一个 Arc 没有泳道图时可以创建。
- 一个泳道图代表一个重要篇章或完整故事单元。

### 17.3 泳道验收

- 默认创建剧情推进、线索 / 伏笔、人物弧光、世界观 / 设定揭露四条泳道。
- 节点必须属于某条泳道。
- 用户可以显示 / 隐藏泳道。
- MVP 至少支持重命名非锁定泳道。

### 17.4 横向事件列验收

- 用户可以创建事件列。
- 事件列支持顺序、章节、场景、故事时间、地点、POV、目的、冲突、结果字段。
- 节点必须放置在某个事件列中。
- 用户可以横向查看事件推进。

### 17.5 节点验收

- 用户可以创建、编辑、移动、聚焦节点。
- 节点支持剧情、线索、伏笔、人物、世界观、反转、高潮、回收、章节钩子类型。
- 节点支持关联人物、章节、场景、线索、伏笔、世界观、灵感。
- 缺关键字段的节点必须被标记。

### 17.6 线索归因验收

- 线索 / 伏笔节点必须支持提供者、触发者、接收者、观察者、误导者、隐藏者、回收点字段。
- 系统能计算归因完整性。
- 缺归因字段时节点不能被标记为完整。
- 节点卡片必须能展示 Provider → Trigger → Receiver → Payoff 摘要。

### 17.7 连接线验收

- 用户可以创建有方向连接线。
- 连接线支持因果、时间顺序、伏笔、回收、误导、人物影响、世界观依赖类型。
- 伏笔连接必须能从种植节点指向回收节点。
- 系统能提示明显时间 / 因果矛盾。

### 17.8 Agent 验收

- Agent 可以从大纲生成泳道图草案。
- Agent 可以从灵感生成节点草案。
- Agent 可以检查线索归因、伏笔回收、人物动机、世界观揭露和节奏密度。
- Agent 建议必须结构化。
- 高风险改动必须等待用户确认。

### 17.9 记忆验收

- 泳道图可以读取小说记忆用于检查。
- 泳道图不能直接写入核心设定、人物事实、世界观规则或线索回收事实。
- 用户确认后的泳道模板偏好可以写入 Workflow Memory。

### 17.10 异常验收

- 泳道图不存在时有创建入口。
- 节点缺字段时有提示。
- 线索归因缺失时有补全入口。
- 删除已使用节点时有影响范围提示。
- 大图审查上下文过长时有分段建议。

## 18. 后续版本

### 18.1 V2

- 自定义泳道模板。
- 自动布局。
- 版本对比。
- 时间轴视图与泳道视图切换。
- 按人物过滤节点。
- 按线索链高亮路径。
- 节点批量编辑。
- 节点评论和审稿批注。

### 18.2 V3

- 多人协作编辑。
- 跨卷 / 跨篇章暗线总图。
- 整本小说事件回放。
- 多宇宙或平行时间线。
- 与读者反馈和连载数据联动。

## 19. 与其他 spec 的边界

| 相关 spec | 边界 |
|---|---|
| `01-novel-project-spec.md` | 定义 Novel、Arc、Chapter 的创建和数据隔离；本 spec 假设这些对象存在 |
| `02-novel-cockpit-spec.md` | Cockpit 展示全书结构和泳道图入口；本 spec 定义泳道图内部编辑 |
| `03-inspiration-vault-spec.md` | 灵感库生成泳道节点草案；本 spec 负责确认和放入泳道图 |
| `05-clue-foreshadowing-spec.md` | 定义正式线索链、伏笔链和回收规则；本 spec 定义节点层面的线索归因字段 |
| `06-character-system-spec.md` | 定义人物卡和人物弧光；本 spec 只引用人物并展示人物弧光节点 |
| `07-worldbuilding-system-spec.md` | 定义世界观设定；本 spec 只引用设定并展示揭露节点 |
| `08-chapter-writing-spec.md` | 定义正文写作；本 spec 为章节写作提供结构化上下文 |
| `09-chapter-review-spec.md` | 定义章节审查；本 spec 可生成结构审查和问题定位 |
| `10-agent-orchestration-spec.md` | 定义任务拆分和执行；本 spec 可产生泳道图相关 Agent 任务 |
| `11-model-router-spec.md` | 定义完整模型路由；本 spec 只定义泳道图场景的推荐规则 |
| `12-long-term-memory-spec.md` | 定义记忆写入；本 spec 默认不直接写入核心记忆 |
