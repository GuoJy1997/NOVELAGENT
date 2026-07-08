# 03 Inspiration Vault Spec

状态：Review Candidate

日期：2026-07-08

上游依赖：

- `01-novel-project-spec.md`，当前尚未编写。本 spec 假设 `Novel` 已存在，且每本小说都有独立数据空间。
- `02-novel-cockpit-spec.md`，已编写。Cockpit 提供灵感库入口和快速记录入口。

相关底座文档：`2026-07-08-novel-agent-product-foundation-design.md`

## 1. 功能定位

Inspiration Vault 是每本小说独立的灵感存储、整理和转化模块。

它解决的问题是：

1. 用户临时来了灵感时，可以快速存起来，不打断当前写作流。
2. 灵感必须按小说划分，不能混在全局池里。
3. 灵感从“随手记”逐步变成可用的创作材料。
4. 灵感可以转成人物、世界观、线索、伏笔、篇章泳道节点、章节想法或 Agent 任务。
5. 系统必须保留灵感来源，后续创作对象能追溯到最初灵感。

一句话定义：

> Inspiration Vault 是一本小说的灵感暂存箱、整理台和转化入口，负责把零散念头沉淀为可追踪的小说结构材料。

## 2. 用户角色

### 2.1 新手作者

用灵感库保存突然想到的人物、桥段、设定，再让 Agent 帮忙判断这些灵感能放到哪里。

### 2.2 连载网文作者

用灵感库随手记录下章钩子、爽点、反转、读者反馈启发和临时补丁。

### 2.3 强设定作者

用灵感库保存世界观规则、历史片段、阵营设定、文化细节，并在确认后转成世界观条目。

### 2.4 悬疑 / 推理作者

用灵感库保存线索、误导、暗线、伏笔回收方式和反转设计。

### 2.5 编辑 / 审稿人

用灵感库记录审稿中发现的修改方向、补充桥段和发布优化点。

## 3. 入口位置

### 3.1 主入口

```text
Novel Cockpit
  ↓
Inspiration Vault
```

### 3.2 快速记录入口

以下位置必须能快速记录灵感：

- Novel Cockpit。
- 章节写作页。
- 篇章泳道图。
- 人物系统。
- 世界观系统。
- 线索 / 伏笔系统。
- 审查报告页。
- Agent 任务详情页。

### 3.3 归属规则

所有灵感必须归属于某一本 `Novel`。

规则：

1. 从小说内部页面记录灵感时，默认绑定当前 `novelId`。
2. 从全局入口记录灵感时，必须先选择小说，或进入“未归属草稿”状态等待用户选择小说。
3. MVP 不允许未归属灵感直接参与 Agent 创作任务。
4. 跨小说复用灵感时，必须复制为目标小说的新灵感，或建立只读引用；不能把同一条灵感同时作为多本小说的可变事实。

## 4. 核心用户目标

Inspiration Vault 必须支持用户完成以下目标：

1. 快速保存临时灵感。
2. 按当前小说查看所有灵感。
3. 按类型、状态、标签、来源、关联对象筛选灵感。
4. 让 Agent 自动识别灵感类型。
5. 手动调整灵感类型和状态。
6. 把灵感关联到人物、世界观、线索、篇章、章节或泳道节点。
7. 把灵感转成 Agent 任务。
8. 查看某个创作对象来源于哪些灵感。
9. 防止灵感直接污染核心设定和长期记忆。
10. 发现灵感与现有设定、人物、线索或章节冲突。

## 5. MVP 范围

### 5.1 灵感创建

MVP 支持：

- 文本灵感。
- 标题。
- 正文。
- 类型。
- 状态。
- 标签。
- 来源说明。
- 当前小说归属。
- 简单附件引用。
- 关联对象。

### 5.2 灵感分类

MVP 默认类型：

- 人物灵感。
- 世界观灵感。
- 情节灵感。
- 线索灵感。
- 伏笔灵感。
- 对话灵感。
- 主题 / 意象灵感。
- 章节钩子灵感。
- 发布 / 运营灵感。
- 未分类。

### 5.3 灵感状态

MVP 默认状态：

- 待整理。
- 已分类。
- 已关联。
- 已转化。
- 已采纳。
- 已废弃。

### 5.4 灵感转化

MVP 支持从灵感发起这些转化：

- 转成人物草案。
- 转成世界观条目草案。
- 转成线索草案。
- 转成伏笔草案。
- 转成篇章泳道节点草案。
- 转成章节想法。
- 转成 Agent 任务。

转化结果必须是草案或待确认对象，不能静默写入核心设定。

### 5.5 Agent 支持

MVP 支持：

- 自动分类。
- 自动打标签。
- 推荐关联对象。
- 推荐转化方式。
- 检查潜在冲突。
- 生成整理建议。

## 6. 非 MVP 范围

第一版不做：

- 完整图片生成工作流。
- 语音转写。
- OCR 图片文字识别。
- 跨小说灵感市场。
- 多人共享灵感库。
- 复杂版权来源管理。
- 自动从外部网页抓取灵感。
- 自动把灵感写入核心记忆。
- 自动把灵感改写进正文。
- 多级文件夹知识库。

V2 可以支持图片、语音、网页剪藏和跨小说只读灵感引用。

## 7. 核心流程

### 7.1 快速保存灵感

```text
用户在当前小说内点击“记录灵感”
  ↓
输入灵感内容
  ↓
系统自动绑定当前 novelId
  ↓
系统保存为待整理 Inspiration
  ↓
Agent 异步分类、打标签、推荐关联
```

成功结果：

- 灵感进入当前小说的 Inspiration Vault。
- 用户可以继续原来的写作或审查任务。

关键规则：

- 快速保存不能强迫用户立刻填写完整字段。
- 快速保存必须保留创建位置，例如来自章节写作页、泳道图、审查报告页。

### 7.2 从 Cockpit 进入灵感库

```text
用户进入 Novel Cockpit
  ↓
点击 Inspiration Vault
  ↓
系统加载当前 Novel 的灵感列表
  ↓
用户筛选、整理或转化灵感
```

关键规则：

- 只能加载当前 `novelId` 的灵感。
- 如果用户切换小说，灵感列表必须重新加载，不能保留上一本小说的结果。

### 7.3 自动分类灵感

```text
用户保存灵感
  ↓
Agent 读取灵感内容和当前小说上下文摘要
  ↓
Agent 判断类型、标签、可能关联对象
  ↓
系统写入分类建议
  ↓
用户可接受、修改或忽略
```

关键规则：

- Agent 分类是建议，不是最终事实。
- 用户修改后的分类优先级高于 Agent 建议。

### 7.4 灵感关联到已有对象

```text
用户打开一条灵感
  ↓
系统展示推荐关联对象
  ↓
用户选择人物 / 世界观 / 线索 / 篇章 / 章节 / 节点
  ↓
系统创建 InspirationLink
```

关键规则：

- 关联不等于采纳。
- 关联不改变被关联对象的核心字段。
- 关联必须记录创建人、创建时间和来源。

### 7.5 灵感转成人物草案

```text
用户选择“转成人物”
  ↓
Agent 从灵感中提取人物名称、身份、目标、秘密、关系线索
  ↓
系统生成人物草案
  ↓
用户确认
  ↓
人物草案进入人物系统
```

关键规则：

- 人物草案不是正式人物事实。
- 正式人物字段由 `06-character-system-spec.md` 定义。

### 7.6 灵感转成线索 / 伏笔草案

```text
用户选择“转成线索”或“转成伏笔”
  ↓
Agent 提取线索内容、可能提供者、触发者、接收者、回收点
  ↓
系统生成线索 / 伏笔草案
  ↓
用户确认
  ↓
草案进入线索 / 伏笔系统
```

关键规则：

- 线索类转化必须提示补齐归因字段。
- 如果缺少提供者、触发者、接收者或回收点，系统必须标记为不完整。
- 完整规则由 `05-clue-foreshadowing-spec.md` 定义。

### 7.7 灵感转成篇章泳道节点草案

```text
用户选择“转成泳道节点”
  ↓
选择目标 Arc 或 Chapter
  ↓
Agent 推荐节点类型和所属泳道
  ↓
系统生成 EventNode 草案
  ↓
用户确认后进入泳道图
```

关键规则：

- 没有目标 Arc 时，系统只能生成待归属节点草案。
- 泳道图编辑规则由 `04-arc-swimlane-diagram-spec.md` 定义。

### 7.8 灵感转成 Agent 任务

```text
用户选择“转成任务”
  ↓
Agent 判断任务类型和所需 Subagent / Skill / 模型
  ↓
系统生成 AgentTask 草案
  ↓
用户确认
  ↓
任务进入队列
```

关键规则：

- 高风险任务必须等待用户确认。
- Agent 任务细节由 `10-agent-orchestration-spec.md` 定义。

### 7.9 废弃灵感

```text
用户选择废弃灵感
  ↓
系统要求可选填写废弃原因
  ↓
灵感状态变为 discarded
  ↓
灵感默认从常规列表隐藏
```

关键规则：

- 废弃不是删除。
- 废弃灵感仍可恢复。
- 删除操作属于高风险操作，MVP 可不提供硬删除。

## 8. 数据对象

### 8.1 Inspiration

灵感主对象。

### 8.2 InspirationVault

某一本小说的灵感库聚合对象。

### 8.3 InspirationLink

灵感与其他对象的关联。

### 8.4 InspirationConversion

灵感转化记录。

### 8.5 InspirationAgentSuggestion

Agent 对灵感的分类、标签、关联和转化建议。

### 8.6 InspirationConflict

灵感与现有设定、人物、线索、章节或记忆的冲突提示。

## 9. 字段定义

### 9.1 InspirationVault

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `vaultId` | string | 是 | 灵感库 ID |
| `novelId` | string | 是 | 所属小说 ID |
| `totalCount` | number | 是 | 灵感总数 |
| `unprocessedCount` | number | 是 | 待整理数量 |
| `convertedCount` | number | 是 | 已转化数量 |
| `conflictCount` | number | 是 | 有冲突数量 |
| `lastCapturedAt` | ISO datetime | 否 | 最近记录时间 |
| `defaultView` | enum | 是 | `board`、`list`、`timeline` |

### 9.2 Inspiration

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `inspirationId` | string | 是 | 灵感 ID |
| `novelId` | string | 是 | 所属小说 ID |
| `title` | string | 否 | 标题，可由系统生成 |
| `content` | string | 是 | 灵感正文 |
| `type` | enum | 是 | 灵感类型 |
| `status` | enum | 是 | 灵感状态 |
| `tags` | string[] | 是 | 标签 |
| `sourceType` | enum | 是 | `manual`、`chapter`、`swimlane`、`review`、`agent`、`import`、`externalReference` |
| `sourceObjectId` | string | 否 | 来源对象 ID |
| `captureContext` | string | 否 | 创建时所在上下文说明 |
| `attachments` | `InspirationAttachment[]` | 是 | 附件引用 |
| `links` | `InspirationLink[]` | 是 | 关联对象 |
| `agentSuggestions` | `InspirationAgentSuggestion[]` | 是 | Agent 建议 |
| `conflicts` | `InspirationConflict[]` | 是 | 冲突提示 |
| `createdBy` | string | 是 | 创建者 |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |
| `archivedAt` | ISO datetime | 否 | 归档时间 |

### 9.3 InspirationType

| 值 | 说明 |
|---|---|
| `character` | 人物灵感 |
| `worldbuilding` | 世界观灵感 |
| `plot` | 情节灵感 |
| `clue` | 线索灵感 |
| `foreshadowing` | 伏笔灵感 |
| `dialogue` | 对话灵感 |
| `themeImage` | 主题 / 意象灵感 |
| `chapterHook` | 章节钩子灵感 |
| `publishOps` | 发布 / 运营灵感 |
| `uncategorized` | 未分类 |

### 9.4 InspirationStatus

| 值 | 说明 |
|---|---|
| `captured` | 已捕捉，待整理 |
| `classified` | 已分类 |
| `linked` | 已关联对象 |
| `converted` | 已转化为草案或任务 |
| `adopted` | 已采纳进入正式创作结构 |
| `discarded` | 已废弃 |

### 9.5 InspirationAttachment

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `attachmentId` | string | 是 | 附件 ID |
| `type` | enum | 是 | `image`、`audio`、`document`、`url`、`textSnippet` |
| `label` | string | 否 | 展示名称 |
| `assetId` | string | 否 | 内部资产 ID |
| `url` | string | 否 | 外部链接 |
| `note` | string | 否 | 附件说明 |

### 9.6 InspirationLink

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `linkId` | string | 是 | 关联 ID |
| `inspirationId` | string | 是 | 灵感 ID |
| `novelId` | string | 是 | 所属小说 ID |
| `targetType` | enum | 是 | `character`、`worldItem`、`clue`、`foreshadowing`、`arc`、`chapter`、`scene`、`eventNode`、`agentTask`、`memoryItem` |
| `targetId` | string | 是 | 目标对象 ID |
| `relationType` | enum | 是 | `sourceOf`、`relatedTo`、`candidateFor`、`inspiredBy`、`conflictsWith` |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `createdBy` | string | 是 | 创建者 |

### 9.7 InspirationConversion

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `conversionId` | string | 是 | 转化 ID |
| `inspirationId` | string | 是 | 原灵感 ID |
| `novelId` | string | 是 | 所属小说 ID |
| `targetType` | enum | 是 | `characterDraft`、`worldItemDraft`、`clueDraft`、`foreshadowingDraft`、`eventNodeDraft`、`chapterIdea`、`agentTaskDraft` |
| `targetId` | string | 否 | 生成对象 ID |
| `status` | enum | 是 | `drafted`、`confirmed`、`rejected`、`superseded` |
| `createdByAgent` | boolean | 是 | 是否由 Agent 生成 |
| `requiresUserConfirmation` | boolean | 是 | 是否需要用户确认 |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `confirmedAt` | ISO datetime | 否 | 确认时间 |

### 9.8 InspirationAgentSuggestion

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `suggestionId` | string | 是 | 建议 ID |
| `inspirationId` | string | 是 | 灵感 ID |
| `suggestionType` | enum | 是 | `type`、`tag`、`link`、`conversion`、`conflict`、`cleanup` |
| `summary` | string | 是 | 建议摘要 |
| `confidence` | number | 是 | 置信度，0 到 1 |
| `proposedChanges` | object | 是 | 建议变更 |
| `modelId` | string | 是 | 使用模型 |
| `status` | enum | 是 | `pending`、`accepted`、`edited`、`rejected` |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.9 InspirationConflict

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `conflictId` | string | 是 | 冲突 ID |
| `inspirationId` | string | 是 | 灵感 ID |
| `novelId` | string | 是 | 所属小说 ID |
| `conflictType` | enum | 是 | `canon`、`character`、`timeline`、`worldRule`、`clueLogic`、`style` |
| `severity` | enum | 是 | `info`、`warning`、`danger` |
| `summary` | string | 是 | 冲突摘要 |
| `relatedObjectIds` | string[] | 是 | 相关对象 |
| `suggestedResolution` | string | 否 | 建议处理 |
| `status` | enum | 是 | `open`、`ignored`、`resolved` |

## 10. 状态机

### 10.1 灵感生命周期

```text
captured
  ↓
classified
  ↓
linked
  ↓
converted
  ↓
adopted
```

废弃分支：

```text
captured / classified / linked / converted
  ↓
discarded
```

恢复分支：

```text
discarded
  ↓
captured
```

规则：

- `captured` 是快速记录后的默认状态。
- `classified` 表示灵感已有类型或标签。
- `linked` 表示灵感至少关联一个对象。
- `converted` 表示灵感已生成草案或任务。
- `adopted` 表示转化对象已被用户确认进入正式创作结构。
- `discarded` 表示不再使用，但仍可恢复。

### 10.2 Agent 建议状态

```text
pending
  ↓
accepted
```

或：

```text
pending
  ↓
edited
```

或：

```text
pending
  ↓
rejected
```

规则：

- Agent 建议默认是 `pending`。
- 用户接受后才影响灵感字段或关联。
- 用户编辑后，系统保留原建议和用户版本。

### 10.3 转化状态

```text
drafted
  ↓
confirmed
```

或：

```text
drafted
  ↓
rejected
```

或：

```text
drafted
  ↓
superseded
```

规则：

- `drafted` 是 Agent 或用户生成的草案。
- `confirmed` 才能进入目标模块。
- `rejected` 表示用户拒绝。
- `superseded` 表示被新的转化替代。

## 11. Agent 行为

### 11.1 可以自动执行

Agent 可以自动：

- 为灵感生成标题。
- 判断灵感类型。
- 推荐标签。
- 推荐关联对象。
- 推荐转化方式。
- 检查潜在冲突。
- 总结灵感库中同类灵感。
- 找出长期未整理灵感。
- 给出整理优先级。

### 11.2 必须用户确认

以下行为必须用户确认：

- 把灵感转成正式人物。
- 把灵感转成正式世界观设定。
- 把灵感转成正式线索 / 伏笔。
- 把灵感写入核心记忆。
- 把灵感改写进正文。
- 删除灵感。
- 跨小说复制或引用灵感。
- 使用高成本模型批量整理灵感。

### 11.3 Agent 建议格式

Agent 对灵感输出建议时，必须结构化：

```text
建议类型
建议摘要
建议原因
置信度
涉及对象
风险等级
推荐下一步
使用模型
是否需要用户确认
```

不能只输出聊天式说明。

## 12. Skill 调用

### 12.1 Inspiration Vault 可调用的 Skill

| Skill | 触发场景 |
|---|---|
| 灵感分类 | 新灵感保存后自动分类 |
| 灵感标题生成 | 用户未填写标题时生成标题 |
| 灵感标签生成 | 批量整理或新建灵感 |
| 灵感去重 | 检查相似灵感 |
| 人物草案生成 | 灵感转人物 |
| 世界观草案生成 | 灵感转世界观 |
| 线索草案生成 | 灵感转线索 |
| 伏笔草案生成 | 灵感转伏笔 |
| 泳道节点草案生成 | 灵感转 EventNode |
| 任务拆分 | 灵感转 AgentTask |
| 冲突检查 | 灵感与现有设定、人物、时间线、线索冲突 |

### 12.2 Skill 输出要求

Skill 输出必须包含：

- 输入灵感 ID。
- 输出类型。
- 生成结果。
- 置信度。
- 风险提示。
- 使用模型。
- 是否需要用户确认。

## 13. 模型选择规则

### 13.1 默认模型路由

| 场景 | 推荐模型类型 |
|---|---|
| 快速保存后的标题生成 | 高速轻量模型 |
| 自动分类 / 打标签 | 高速轻量模型 |
| 灵感发散扩写 | 创意发散模型 |
| 灵感转人物草案 | 创意发散模型或长文本写作模型 |
| 灵感转世界观草案 | 深度推理模型 |
| 灵感转线索 / 伏笔草案 | 深度推理模型 |
| 灵感转泳道节点草案 | 深度推理模型 |
| 灵感转 Agent 任务 | 工具调用模型 |
| 冲突检查 | 审校模型或深度推理模型 |
| 批量整理大量灵感 | 高速轻量模型，必要时升级深度推理模型 |

### 13.2 手动覆盖

用户可以对以下范围手动选择模型：

- 单条灵感整理。
- 批量灵感整理。
- 某次转化任务。
- 当前小说的灵感库默认模型。

规则：

- 高成本模型批量处理前必须提醒。
- 长灵感或大量关联上下文需要提示上下文长度。
- 模型推荐必须显示理由。

## 14. 长期记忆读写

### 14.1 Inspiration Vault 可读取的记忆

灵感库可以读取：

- Project Memory：小说题材、目标、平台、整体风格。
- Core Canon Memory：已确认核心设定。
- Character Memory：已有角色信息。
- World Memory：世界观规则。
- Clue Memory：已有线索和伏笔。
- Style Memory：文风偏好。

用途：

- 自动分类。
- 推荐关联对象。
- 检查冲突。
- 推荐转化方式。

### 14.2 Inspiration Vault 可写入的记忆

默认不能直接写入核心记忆。

可以写入：

- 用户确认后的灵感整理偏好。
- 用户确认后的灵感分类规则。
- 用户确认后的常用标签。

不能直接写入：

- 核心设定。
- 人物事实。
- 世界观规则。
- 线索回收事实。
- 正文事实。

如果用户希望把灵感写入核心记忆，必须走“转化 → 用户确认 → 目标模块入库 → 记忆写入”的路径。

## 15. 可视化要求

### 15.1 灵感库主视图

MVP 支持三种视图：

```text
board
list
timeline
```

默认推荐 `board`，按状态分列：

```text
待整理 → 已分类 → 已关联 → 已转化 → 已采纳
```

### 15.2 灵感卡片

每张灵感卡至少展示：

- 标题。
- 类型。
- 状态。
- 标签。
- 内容摘要。
- 来源。
- 关联对象数量。
- 是否有冲突。
- 是否有 Agent 建议。
- 创建时间。

### 15.3 灵感详情页

详情页展示：

- 完整内容。
- 类型与状态。
- 标签。
- 来源上下文。
- 附件。
- 关联对象。
- Agent 建议。
- 冲突提示。
- 转化记录。
- 操作区。

### 15.4 转化面板

转化面板展示：

- 可转化类型。
- 推荐转化类型。
- 推荐原因。
- 需要补充的字段。
- 预期目标模块。
- 是否需要用户确认。

### 15.5 Cockpit 预览

Novel Cockpit 只展示灵感库摘要：

- 最近灵感。
- 待整理数量。
- 高价值推荐灵感。
- 有冲突灵感。
- 快速记录入口。

## 16. 异常情况

### 16.1 用户从全局入口记录灵感但未选择小说

处理方式：

- 显示小说选择器。
- 用户选择小说后保存。
- 如果用户跳过选择，保存为未归属草稿。
- 未归属草稿不能参与 Agent 创作任务。

### 16.2 灵感保存失败

处理方式：

- 保留本地临时输入。
- 提供重试。
- 提示失败原因。
- 不丢失用户输入。

### 16.3 Agent 分类失败

处理方式：

- 灵感仍保存为 `captured`。
- 类型为 `uncategorized`。
- 显示“等待整理”。
- 用户可手动分类。

### 16.4 转化缺少必要字段

处理方式：

- 生成草案但标记缺字段。
- 展示需要补齐的字段。
- 不允许进入正式对象。

### 16.5 灵感与核心设定冲突

处理方式：

- 创建 InspirationConflict。
- 标记 severity。
- 提供冲突说明。
- 不自动覆盖核心设定。

### 16.6 跨小说复用灵感

处理方式：

- 默认复制为目标小说的新灵感。
- 保留来源引用。
- 不共享可变状态。

### 16.7 用户删除灵感

MVP 默认不提供硬删除，只提供废弃。

如果后续提供删除：

- 必须二次确认。
- 如果灵感已有转化对象，必须提示影响范围。
- 删除后不能破坏目标对象的来源追溯。

## 17. 验收标准

### 17.1 数据隔离验收

- 每条灵感必须有 `novelId`。
- 当前小说灵感库只展示当前 `novelId` 的灵感。
- 从小说内任意页面创建灵感时，默认绑定当前 `novelId`。
- 切换小说后，灵感列表必须重新加载。
- 跨小说复用灵感必须复制或只读引用，不能共享可变事实。

### 17.2 创建验收

- 用户可以从 Cockpit 快速保存灵感。
- 用户可以从章节写作、泳道图、人物、世界观、线索、审查页面快速保存灵感。
- 快速保存可以只填正文。
- 保存失败不会丢失输入。

### 17.3 分类验收

- Agent 可以为新灵感生成类型建议。
- Agent 可以生成标签建议。
- 用户可以接受、修改或拒绝建议。
- 用户修改后的分类优先于 Agent 建议。

### 17.4 关联验收

- 用户可以把灵感关联到人物、世界观、线索、伏笔、篇章、章节、泳道节点或 Agent 任务。
- 关联不改变目标对象核心字段。
- 关联记录可追溯。

### 17.5 转化验收

- 灵感可以转成人物草案。
- 灵感可以转成世界观条目草案。
- 灵感可以转成线索 / 伏笔草案。
- 灵感可以转成泳道节点草案。
- 灵感可以转成 Agent 任务草案。
- 转化结果默认需要用户确认。
- 已确认转化必须保留来源灵感链接。

### 17.6 冲突验收

- 系统能标记灵感与核心设定、人物、时间线、世界观规则、线索逻辑或文风的冲突。
- 冲突不自动修改任何核心事实。
- 用户可以忽略或解决冲突。

### 17.7 记忆验收

- 灵感默认不进入核心记忆。
- 灵感写入核心记忆必须经过目标模块和用户确认。
- 灵感整理偏好可以写入 Workflow Memory。

### 17.8 Agent 验收

- Agent 建议必须结构化。
- Agent 不能静默把灵感写入核心设定。
- 高成本批量整理前必须提醒。

## 18. 后续版本

### 18.1 V2

- 图片灵感。
- 语音灵感与转写。
- 网页剪藏。
- 相似灵感合并。
- 跨小说只读引用。
- 灵感热度 / 使用率统计。
- 灵感批量整理工作流。

### 18.2 V3

- 多人共享灵感池。
- 世界观宇宙级灵感库。
- 读者反馈自动转灵感。
- 外部资料来源管理。
- 版权 / 引用风险提示。

## 19. 与其他 spec 的边界

| 相关 spec | 边界 |
|---|---|
| `01-novel-project-spec.md` | 定义小说项目创建、数据隔离和全局入口；本 spec 要求每条灵感绑定 `novelId` |
| `02-novel-cockpit-spec.md` | Cockpit 提供灵感入口和摘要；本 spec 定义灵感库完整行为 |
| `04-arc-swimlane-diagram-spec.md` | 定义 EventNode 和泳道编辑；本 spec 只生成泳道节点草案 |
| `05-clue-foreshadowing-spec.md` | 定义线索 / 伏笔正式字段和归因规则；本 spec 只生成草案和来源追溯 |
| `06-character-system-spec.md` | 定义正式人物对象；本 spec 只生成或关联人物草案 |
| `07-worldbuilding-system-spec.md` | 定义正式世界观条目；本 spec 只生成世界观草案 |
| `08-chapter-writing-spec.md` | 定义章节正文生成；本 spec 不直接把灵感写入正文 |
| `09-chapter-review-spec.md` | 审查报告可以产生灵感；本 spec 负责保存和整理这些灵感 |
| `10-agent-orchestration-spec.md` | 定义任务执行；本 spec 只生成 AgentTask 草案 |
| `11-model-router-spec.md` | 定义完整模型路由；本 spec 只定义灵感场景的模型推荐 |
| `12-long-term-memory-spec.md` | 定义记忆写入和冲突解决；本 spec 默认不直接写入核心记忆 |

