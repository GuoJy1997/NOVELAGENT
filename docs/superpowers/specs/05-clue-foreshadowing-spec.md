# 05 Clue and Foreshadowing Spec

状态：Review Candidate

日期：2026-07-08

上游依赖：

- `01-novel-project-spec.md`：每条线索、伏笔和链路必须绑定 `novelId`。
- `02-novel-cockpit-spec.md`：Cockpit 展示线索摘要、未回收风险和关键链路入口。
- `03-inspiration-vault-spec.md`：灵感可以转成线索 / 伏笔草案。
- `04-arc-swimlane-diagram-spec.md`：泳道图节点提供 Provider / Trigger / Receiver / Payoff 的节点级归因。

相关底座文档：`2026-07-08-novel-agent-product-foundation-design.md`

## 1. 功能定位

Clue and Foreshadowing System 是长篇小说中管理线索、伏笔、暗线、误导和回收的核心系统。

它解决的问题是：

1. 作者能清楚知道每条线索从哪里来、由谁触发、谁接收、谁误解、何时回收。
2. 伏笔不会被忘记，回收不会失去前文依据。
3. 悬疑、推理、权谋、群像、强设定小说里的暗线可以被持续追踪。
4. Agent 写章节和审章节时能准确加载相关线索上下文。
5. 系统能区分“角色知道的信息”“读者知道的信息”“作者知道的信息”。

一句话定义：

> 线索 / 伏笔系统负责把故事中的信息流变成可追踪链路，确保种下、推进、误导、揭示、回收都有明确来源和状态。

## 2. 用户角色

### 2.1 连载网文作者

追踪未回收伏笔、下章钩子、读者期待和章节回收计划。

### 2.2 悬疑 / 推理作者

管理证据、误导、嫌疑人信息差、真线索、假线索和最终揭示。

### 2.3 强设定作者

管理世界观规则的提前暗示、设定揭露和规则回收。

### 2.4 群像 / 权谋作者

管理不同阵营、人物之间的信息掌握差异和暗线推进。

### 2.5 编辑 / 审稿人

检查伏笔是否回收、线索是否自洽、误导是否公平、关键情节是否有前文铺垫。

## 3. 入口位置

### 3.1 主入口

```text
Novel Cockpit
  ↓
Clue / Foreshadowing
```

### 3.2 其他入口

以下模块可以进入线索 / 伏笔系统：

- 篇章泳道图：从线索 / 伏笔节点进入正式链路。
- 灵感库：灵感转成线索 / 伏笔草案。
- 章节写作：从章节上下文查看本章涉及线索。
- 章节审查：从未回收或冲突问题进入。
- 人物系统：从某个人物掌握的信息进入。
- 世界观系统：从设定揭露进入。
- Agent 任务详情：从线索相关任务进入。

### 3.3 默认进入规则

用户进入线索 / 伏笔系统时：

1. 默认展示当前 Novel 的线索总览。
2. 可以按 Arc、Chapter、Character、状态、可信度、读者可见性筛选。
3. 如果从某个泳道节点进入，默认聚焦相关 Clue 或 Foreshadowing。
4. 如果从审查报告进入，默认打开对应风险项。

## 4. 核心用户目标

系统必须支持用户完成以下目标：

1. 创建线索。
2. 创建伏笔。
3. 创建暗线。
4. 创建误导线索。
5. 把线索 / 伏笔串成链路。
6. 记录提供者、触发者、接收者、观察者、误导者、隐藏者、回收者。
7. 记录角色知道什么、读者知道什么、作者知道什么。
8. 记录线索可信度。
9. 记录首次出现、推进、误导、揭示、回收章节。
10. 检查未回收伏笔。
11. 检查线索归因缺失。
12. 检查时间线和因果冲突。
13. 为章节写作提供线索上下文。
14. 为章节审查生成线索问题报告。

## 5. MVP 范围

### 5.1 核心对象

MVP 支持：

- `Clue`
- `Foreshadowing`
- `ClueChain`
- `ForeshadowingChain`
- `HiddenThread`
- `RedHerring`
- `InformationState`
- `ClueBeat`
- `ClueAttribution`
- `ClueReviewReport`

### 5.2 核心链路

MVP 支持四种链：

1. 线索链：从出现到揭示。
2. 伏笔链：从种下到回收。
3. 暗线链：读者可能暂时不知道，但作者需要追踪。
4. 误导链：从错误暗示到澄清。

### 5.3 线索状态

MVP 线索状态：

- 草案。
- 已种下。
- 推进中。
- 已误导。
- 已揭示。
- 已回收。
- 已废弃。

### 5.4 归因要求

MVP 必须支持：

- Provider：谁提供线索。
- Trigger：谁触发线索。
- Receiver：谁接收线索。
- Observer：谁观察到线索。
- MissedBy：谁错过线索。
- Concealer：谁隐藏线索。
- Misleader：谁误导线索。
- Payoff：在哪里回收。

### 5.5 可视化

MVP 支持：

- 线索链列表。
- 线索详情页。
- Provider → Trigger → Receiver → Payoff 链路视图。
- 按章节展示线索出现 / 推进 / 回收。
- 未回收伏笔列表。
- 线索风险列表。

### 5.6 Agent 支持

MVP 支持：

- 线索归因检查。
- 未回收伏笔检查。
- 误导公平性检查。
- 线索时间线检查。
- 章节线索上下文整理。
- 线索草案生成。

## 6. 非 MVP 范围

第一版不做：

- 自动生成完整推理诡计。
- 跨小说共享线索链。
- 复杂读者画像预测。
- 多版本谜底推演。
- 概率化嫌疑人推理引擎。
- 三维线索关系图。
- 自动改写正文以修复线索。
- 自动确认伏笔已回收。

V2 可以支持更复杂的推理矩阵、嫌疑人视角、读者可疑度模拟和跨篇章暗线总图。

## 7. 核心流程

### 7.1 创建线索

```text
用户进入线索系统
  ↓
点击“创建线索”
  ↓
填写线索标题、内容、类型、首次出现位置
  ↓
填写提供者、触发者、接收者
  ↓
系统创建 Clue
```

规则：

- 线索必须绑定 `novelId`。
- 线索可以先以草案保存。
- 线索进入 `planted` 或更高状态前，必须至少填写首次出现位置和基础归因。

### 7.2 创建伏笔

```text
用户点击“创建伏笔”
  ↓
填写伏笔内容和预期回收方向
  ↓
选择种下章节或节点
  ↓
填写预期回收章节或回收节点
  ↓
系统创建 Foreshadowing
```

规则：

- 伏笔可以暂时没有明确回收章节，但必须标记为 `missingPayoff`。
- 没有回收计划的伏笔必须进入风险列表。

### 7.3 从泳道节点创建正式线索

```text
用户在泳道图中选择线索节点
  ↓
点击“转成正式线索”
  ↓
系统读取节点归因字段
  ↓
生成 Clue 草案
  ↓
用户确认
  ↓
Clue 进入线索系统
```

规则：

- 节点归因字段必须映射到 `ClueAttribution`。
- 缺字段时只能生成草案，不能进入已种下状态。
- 必须保留来源 `eventNodeId`。

### 7.4 从灵感创建线索 / 伏笔草案

```text
用户在灵感库选择“转成线索 / 伏笔”
  ↓
Agent 提取线索内容、可能归因和回收方向
  ↓
系统生成 Clue 或 Foreshadowing 草案
  ↓
用户确认或编辑
```

规则：

- 必须保留 `sourceInspirationId`。
- Agent 生成内容不能直接进入正式状态。

### 7.5 构建线索链

```text
用户选择多个 ClueBeat
  ↓
按出现、推进、误导、揭示、回收排序
  ↓
系统创建 ClueChain
  ↓
用户检查链路完整性
```

规则：

- 一个线索链可以包含多个 Clue 和 Foreshadowing。
- 每个链路节点必须有顺序。
- 回收节点不能早于种下节点，除非标记为倒叙结构。

### 7.6 记录信息状态

```text
用户打开某条线索
  ↓
记录某一章后谁知道这条线索
  ↓
记录读者是否知道
  ↓
记录作者备注
```

规则：

- 角色信息状态和读者信息状态必须分开。
- 读者未知不代表作者未知。
- 角色误解必须显式标记。

### 7.7 种下伏笔

```text
用户选择章节或泳道节点
  ↓
创建 ForeshadowingBeat
  ↓
填写种下方式和读者可见性
  ↓
系统记录为 planted
```

规则：

- 伏笔种下必须关联章节或节点。
- 如果没有预期回收点，系统标记风险。

### 7.8 回收伏笔

```text
用户选择 Foreshadowing
  ↓
点击“标记回收”
  ↓
选择回收章节 / 节点
  ↓
填写回收说明
  ↓
系统更新状态为 paidOff
```

规则：

- 回收必须有回收位置。
- 回收必须关联原伏笔。
- Agent 可以建议回收，但不能自动标记已回收。

### 7.9 创建误导线索

```text
用户创建 RedHerring
  ↓
填写误导内容、误导者或误导机制
  ↓
填写被误导对象和读者可见性
  ↓
填写澄清位置
```

规则：

- 误导必须是可追溯的，不能变成作者随意欺骗读者。
- 必须记录澄清方式或计划。

### 7.10 Agent 检查线索

```text
用户点击“检查线索链”
  ↓
Agent 读取线索、伏笔、泳道节点、章节摘要、人物信息状态
  ↓
Agent 输出缺失归因、未回收伏笔、时间矛盾、误导不公平、人物知情冲突
  ↓
系统生成 ClueReviewReport
```

规则：

- Agent 只能提出问题和建议。
- 修复动作必须由用户确认。

## 8. 数据对象

### 8.1 Clue

故事中可被人物或读者发现、解释、误解或回收的信息。

### 8.2 Foreshadowing

作者提前种下、后文需要回收的暗示或结构性信息。

### 8.3 ClueChain

围绕一个信息目标形成的线索推进链。

### 8.4 ForeshadowingChain

围绕一个伏笔从种下到回收的链。

### 8.5 HiddenThread

作者追踪的暗线，读者或角色可能暂时不知道。

### 8.6 RedHerring

误导线索或假线索。

### 8.7 ClueBeat

线索链中的一次出现、推进、误导、揭示或回收。

### 8.8 ClueAttribution

线索归因对象。

### 8.9 InformationState

记录某一时间点角色、读者、作者分别知道什么。

### 8.10 ClueReviewReport

线索系统审查报告。

## 9. 字段定义

### 9.1 Clue

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `clueId` | string | 是 | 线索 ID |
| `novelId` | string | 是 | 所属小说 |
| `title` | string | 是 | 线索标题 |
| `content` | string | 是 | 线索内容 |
| `type` | enum | 是 | 线索类型 |
| `status` | enum | 是 | 线索状态 |
| `credibility` | enum | 是 | `true`、`partial`、`false`、`unknown` |
| `readerVisibility` | enum | 是 | `hidden`、`hinted`、`visible`、`misleading` |
| `firstAppearanceChapterId` | string | 否 | 首次出现章节 |
| `firstAppearanceNodeId` | string | 否 | 首次出现泳道节点 |
| `currentChainId` | string | 否 | 所属线索链 |
| `attribution` | `ClueAttribution` | 是 | 归因信息 |
| `relatedCharacterIds` | string[] | 是 | 相关人物 |
| `relatedWorldItemIds` | string[] | 是 | 相关设定 |
| `relatedForeshadowingIds` | string[] | 是 | 相关伏笔 |
| `sourceInspirationIds` | string[] | 是 | 来源灵感 |
| `sourceEventNodeIds` | string[] | 是 | 来源泳道节点 |
| `beats` | `ClueBeat[]` | 是 | 推进节点 |
| `informationStates` | `InformationState[]` | 是 | 信息状态 |
| `missingFields` | string[] | 是 | 缺失字段 |
| `riskLevel` | enum | 是 | `none`、`low`、`medium`、`high` |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.2 ClueType

| 值 | 说明 |
|---|---|
| `evidence` | 证据 |
| `testimony` | 证词 / 对话 |
| `object` | 物件 |
| `behavior` | 行为异常 |
| `memory` | 回忆 |
| `worldRule` | 世界观规则 |
| `relationship` | 人物关系 |
| `location` | 地点信息 |
| `symbol` | 象征 / 意象 |
| `redHerring` | 误导线索 |

### 9.3 ClueStatus

| 值 | 说明 |
|---|---|
| `draft` | 草案 |
| `planted` | 已种下 |
| `active` | 推进中 |
| `misleading` | 正在误导 |
| `revealed` | 已揭示 |
| `paidOff` | 已回收 |
| `discarded` | 已废弃 |

### 9.4 Foreshadowing

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `foreshadowingId` | string | 是 | 伏笔 ID |
| `novelId` | string | 是 | 所属小说 |
| `title` | string | 是 | 伏笔标题 |
| `content` | string | 是 | 伏笔内容 |
| `status` | enum | 是 | 伏笔状态 |
| `plantingChapterId` | string | 否 | 种下章节 |
| `plantingNodeId` | string | 否 | 种下泳道节点 |
| `expectedPayoffChapterId` | string | 否 | 预期回收章节 |
| `expectedPayoffNodeId` | string | 否 | 预期回收节点 |
| `actualPayoffChapterId` | string | 否 | 实际回收章节 |
| `actualPayoffNodeId` | string | 否 | 实际回收节点 |
| `visibility` | enum | 是 | `hidden`、`hinted`、`visible`、`misleading` |
| `subtletyLevel` | number | 是 | 隐晦程度，1 到 5 |
| `relatedClueIds` | string[] | 是 | 相关线索 |
| `chainId` | string | 否 | 所属伏笔链 |
| `sourceInspirationIds` | string[] | 是 | 来源灵感 |
| `missingFields` | string[] | 是 | 缺失字段 |
| `riskLevel` | enum | 是 | 风险等级 |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.5 ForeshadowingStatus

| 值 | 说明 |
|---|---|
| `draft` | 草案 |
| `planted` | 已种下 |
| `developing` | 推进中 |
| `readyForPayoff` | 可回收 |
| `paidOff` | 已回收 |
| `abandoned` | 废弃 |

### 9.6 ClueAttribution

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `providerCharacterId` | string | 条件必填 | 谁提供线索 |
| `triggerCharacterId` | string | 条件必填 | 谁触发线索 |
| `receiverCharacterId` | string | 条件必填 | 谁接收线索 |
| `observerCharacterIds` | string[] | 是 | 谁观察到 |
| `missedByCharacterIds` | string[] | 是 | 谁错过 |
| `concealerCharacterId` | string | 否 | 谁隐藏 |
| `misleaderCharacterId` | string | 否 | 谁误导 |
| `payoffCharacterId` | string | 否 | 谁回收或揭示 |
| `payoffChapterId` | string | 否 | 回收章节 |
| `payoffNodeId` | string | 否 | 回收节点 |
| `mechanism` | string | 否 | 触发 / 误导 / 隐藏机制说明 |
| `completeness` | enum | 是 | `complete`、`missingProvider`、`missingTrigger`、`missingReceiver`、`missingPayoff`、`incomplete` |

条件必填规则：

- `draft` 状态可以缺字段，但必须记录到 `missingFields`。
- `planted` 或更高状态的线索必须填写 `providerCharacterId`、`triggerCharacterId`、`receiverCharacterId`。
- `paidOff` 状态必须填写 `payoffChapterId` 或 `payoffNodeId`。
- 误导线索必须填写 `misleaderCharacterId` 或 `mechanism`。
- 隐藏线索必须填写 `concealerCharacterId` 或 `mechanism`。

### 9.7 ClueBeat

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `beatId` | string | 是 | 节点 ID |
| `novelId` | string | 是 | 所属小说 |
| `clueId` | string | 否 | 所属线索 |
| `foreshadowingId` | string | 否 | 所属伏笔 |
| `chainId` | string | 否 | 所属链 |
| `type` | enum | 是 | 节点类型 |
| `chapterId` | string | 否 | 章节 |
| `sceneId` | string | 否 | 场景 |
| `eventNodeId` | string | 否 | 泳道节点 |
| `order` | number | 是 | 顺序 |
| `summary` | string | 是 | 摘要 |
| `readerVisibility` | enum | 是 | 读者可见性 |
| `informationDelta` | string | 否 | 信息变化 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.8 ClueBeatType

| 值 | 说明 |
|---|---|
| `plant` | 种下 |
| `advance` | 推进 |
| `mislead` | 误导 |
| `reveal` | 揭示 |
| `payoff` | 回收 |
| `recontextualize` | 重新解释 |
| `discard` | 废弃 |

### 9.9 ClueChain

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `chainId` | string | 是 | 链 ID |
| `novelId` | string | 是 | 所属小说 |
| `title` | string | 是 | 链标题 |
| `type` | enum | 是 | `clue`、`foreshadowing`、`hiddenThread`、`redHerring` |
| `status` | enum | 是 | 链状态 |
| `arcIds` | string[] | 是 | 涉及篇章 |
| `chapterIds` | string[] | 是 | 涉及章节 |
| `clueIds` | string[] | 是 | 包含线索 |
| `foreshadowingIds` | string[] | 是 | 包含伏笔 |
| `beatIds` | string[] | 是 | 推进节点 |
| `ownerSubagentId` | string | 否 | 负责子代理 |
| `riskLevel` | enum | 是 | 风险等级 |
| `missingFields` | string[] | 是 | 缺失字段 |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.10 ClueChainStatus

| 值 | 说明 |
|---|---|
| `draft` | 草案 |
| `active` | 推进中 |
| `needsPayoff` | 等待回收 |
| `complete` | 完成 |
| `inconsistent` | 存在矛盾 |
| `abandoned` | 废弃 |

### 9.11 ForeshadowingChain

`ForeshadowingChain` 是 `ClueChain` 的专门化，表示一组伏笔从种下到推进再到回收的链路。实现上可以用 `ClueChain.type = foreshadowing` 表达，但业务语义必须显式保留。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `chainId` | string | 是 | 伏笔链 ID，与 ClueChain 共用 ID |
| `novelId` | string | 是 | 所属小说 |
| `title` | string | 是 | 伏笔链标题 |
| `foreshadowingIds` | string[] | 是 | 包含伏笔 |
| `plantBeatIds` | string[] | 是 | 种下节点 |
| `advanceBeatIds` | string[] | 是 | 推进节点 |
| `payoffBeatIds` | string[] | 是 | 回收节点 |
| `expectedPayoffChapterIds` | string[] | 是 | 预期回收章节 |
| `actualPayoffChapterIds` | string[] | 是 | 实际回收章节 |
| `status` | enum | 是 | 使用 `ClueChainStatus` |
| `missingFields` | string[] | 是 | 缺失字段 |
| `riskLevel` | enum | 是 | 风险等级 |

规则：

- 没有回收节点的伏笔链必须是 `needsPayoff` 或 `inconsistent`。
- 所有 `payoffBeatIds` 必须能追溯到对应 `plantBeatIds`。
- 伏笔链进入 `complete` 前，必须至少有一个种下节点和一个回收节点。

### 9.12 HiddenThread

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `hiddenThreadId` | string | 是 | 暗线 ID |
| `novelId` | string | 是 | 所属小说 |
| `title` | string | 是 | 暗线标题 |
| `secretTruth` | string | 是 | 作者知道的真相 |
| `visibleToReader` | boolean | 是 | 是否对读者可见 |
| `visibleToCharacterIds` | string[] | 是 | 哪些角色知道 |
| `relatedChainIds` | string[] | 是 | 相关线索链 |
| `plannedRevealChapterId` | string | 否 | 计划揭示章节 |
| `status` | enum | 是 | `draft`、`active`、`revealed`、`abandoned` |

### 9.13 RedHerring

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `redHerringId` | string | 是 | 误导 ID |
| `novelId` | string | 是 | 所属小说 |
| `title` | string | 是 | 误导标题 |
| `falseConclusion` | string | 是 | 引导出的错误结论 |
| `truthBehindIt` | string | 否 | 背后真实解释 |
| `misleaderCharacterId` | string | 否 | 误导者 |
| `targetCharacterIds` | string[] | 是 | 被误导角色 |
| `misleadsReader` | boolean | 是 | 是否误导读者 |
| `clarificationChapterId` | string | 否 | 澄清章节 |
| `relatedClueIds` | string[] | 是 | 相关线索 |
| `status` | enum | 是 | `draft`、`active`、`clarified`、`unfair`、`abandoned` |

### 9.14 InformationState

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `informationStateId` | string | 是 | 信息状态 ID |
| `novelId` | string | 是 | 所属小说 |
| `objectType` | enum | 是 | `clue`、`foreshadowing`、`hiddenThread`、`redHerring` |
| `objectId` | string | 是 | 对象 ID |
| `chapterId` | string | 否 | 所属章节 |
| `eventNodeId` | string | 否 | 所属节点 |
| `readerKnowledge` | enum | 是 | `unknown`、`suspects`、`knowsFalse`、`knowsPartial`、`knowsTruth` |
| `authorKnowledge` | enum | 是 | `unknown`、`planned`、`confirmed` |
| `characterKnowledge` | object[] | 是 | 角色知情状态 |
| `notes` | string | 否 | 备注 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.15 CharacterKnowledge

`InformationState.characterKnowledge` 中的元素。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `characterId` | string | 是 | 人物 ID |
| `knowledgeState` | enum | 是 | `unknown`、`missed`、`suspects`、`misunderstands`、`knowsPartial`、`knowsTruth`、`conceals` |
| `evidence` | string | 否 | 知情依据 |

### 9.16 ClueReviewReport

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `reportId` | string | 是 | 报告 ID |
| `novelId` | string | 是 | 所属小说 |
| `scopeType` | enum | 是 | `novel`、`arc`、`chapter`、`chain`、`clue` |
| `scopeId` | string | 否 | 范围 ID |
| `findings` | `ClueFinding[]` | 是 | 问题 |
| `modelId` | string | 是 | 使用模型 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.17 ClueFinding

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `findingId` | string | 是 | 问题 ID |
| `type` | enum | 是 | `missingAttribution`、`missingPayoff`、`timelineConflict`、`knowledgeConflict`、`unfairMislead`、`orphanClue`、`weakSetup` |
| `severity` | enum | 是 | `info`、`warning`、`danger` |
| `summary` | string | 是 | 摘要 |
| `relatedObjectIds` | string[] | 是 | 相关对象 |
| `suggestedAction` | string | 否 | 建议动作 |
| `requiresUserConfirmation` | boolean | 是 | 是否需要确认 |

## 10. 状态机

### 10.1 线索状态

```text
draft
  ↓
planted
  ↓
active
  ↓
revealed
  ↓
paidOff
```

误导分支：

```text
active
  ↓
misleading
  ↓
revealed
```

废弃分支：

```text
draft / planted / active / misleading
  ↓
discarded
```

### 10.2 伏笔状态

```text
draft
  ↓
planted
  ↓
developing
  ↓
readyForPayoff
  ↓
paidOff
```

废弃分支：

```text
draft / planted / developing / readyForPayoff
  ↓
abandoned
```

### 10.3 链路状态

```text
draft
  ↓
active
  ↓
needsPayoff
  ↓
complete
```

异常分支：

```text
active / needsPayoff
  ↓
inconsistent
```

废弃分支：

```text
draft / active / needsPayoff / inconsistent
  ↓
abandoned
```

### 10.4 信息状态

角色知情状态可以随章节推进：

```text
unknown
  ↓
suspects
  ↓
knowsPartial
  ↓
knowsTruth
```

误解分支：

```text
suspects / knowsPartial
  ↓
misunderstands
  ↓
knowsTruth
```

隐藏分支：

```text
knowsTruth
  ↓
conceals
```

规则：

- 角色知情状态必须与章节或节点绑定。
- 读者知情状态独立于角色知情状态。
- 作者知情状态独立于读者与角色。

## 11. Agent 行为

### 11.1 可以自动执行

Agent 可以：

- 从灵感生成线索 / 伏笔草案。
- 从泳道节点生成正式线索草案。
- 推荐线索链排序。
- 推荐伏笔回收位置。
- 检查归因完整性。
- 检查未回收伏笔。
- 检查线索时间线冲突。
- 检查角色知情冲突。
- 检查误导是否公平。
- 为章节写作整理相关线索上下文。
- 为审查报告生成线索问题列表。

### 11.2 必须用户确认

以下行为必须用户确认：

- 创建正式线索链。
- 标记伏笔已回收。
- 改变线索真伪。
- 改变误导真相。
- 改变角色知情状态为“知道真相”。
- 删除线索、伏笔、暗线或误导。
- 写入 Clue Memory。
- 修改已发布章节相关线索。
- 使用高成本模型进行全书线索审查。

### 11.3 Agent 建议格式

Agent 在线索系统输出建议时，必须结构化：

```text
建议类型
涉及线索 / 伏笔 / 链路
问题说明
涉及章节 / 节点 / 人物
风险等级
建议动作
是否需要用户确认
推荐模型
推荐 Skill
来源引用
```

不能只输出聊天式文本。

## 12. Skill 调用

### 12.1 可调用 Skill

| Skill | 触发场景 |
|---|---|
| 线索草案生成 | 从灵感、泳道节点或章节内容生成线索 |
| 伏笔草案生成 | 从灵感或大纲生成伏笔 |
| 线索归因检查 | 检查 Provider / Trigger / Receiver / Payoff |
| 伏笔回收检查 | 检查未回收伏笔 |
| 误导公平性检查 | 检查红鲱鱼是否有合理依据 |
| 角色知情检查 | 检查人物是否知道不该知道的信息 |
| 线索时间线检查 | 检查出现、推进、回收顺序 |
| 线索上下文整理 | 为章节写作整理相关线索 |
| 线索审查报告生成 | 输出 ClueReviewReport |

### 12.2 Skill 输出要求

Skill 输出必须包含：

- 输入对象 ID。
- 发现或生成的线索对象。
- 相关章节 / 节点。
- 归因字段。
- 风险等级。
- 来源引用。
- 使用模型。
- 是否需要用户确认。

## 13. 模型选择规则

### 13.1 默认模型路由

| 场景 | 推荐模型类型 |
|---|---|
| 线索链设计 | 深度推理模型 |
| 伏笔链设计 | 深度推理模型 |
| 暗线规划 | 深度推理模型 |
| 误导公平性检查 | 审校模型或深度推理模型 |
| 角色知情检查 | 深度推理模型 |
| 未回收伏笔检查 | 审校模型 |
| 单章线索上下文整理 | 工具调用模型 |
| 全书线索审查 | 深度推理模型，必要时分段 |
| 从灵感生成线索草案 | 创意发散模型或深度推理模型 |

### 13.2 手动覆盖

用户可以为以下范围选择模型：

- 单条线索分析。
- 单条伏笔分析。
- 某条线索链审查。
- 某个 Arc 的线索审查。
- 全书线索审查。

规则：

- 全书审查成本高，必须提醒。
- 大量章节参与时，系统应建议分 Arc 检查。
- 模型推荐必须展示理由。

## 14. 长期记忆读写

### 14.1 可读取的记忆

线索系统可以读取：

- Project Memory：小说目标、类型和整体结构。
- Core Canon Memory：核心设定。
- Character Memory：人物秘密、动机、关系和已知事实。
- World Memory：世界观规则。
- Clue Memory：已有线索、伏笔、暗线、误导、回收状态。
- Style Memory：写作风格和悬疑表达偏好。

### 14.2 可写入的记忆

线索系统可以在用户确认后写入：

- Clue Memory：正式线索、伏笔、暗线、回收状态。
- Character Memory：某人物知道或隐藏的关键事实。
- Core Canon Memory：已经成为核心设定的真相。

必须用户确认：

- 把线索真相写入核心设定。
- 把人物知情状态写入人物记忆。
- 把伏笔回收状态写入 Clue Memory。

### 14.3 与 RAG / 上下文引擎的关系

线索系统会向未来的 `12-rag-context-engine-spec.md` 提供可检索资料：

- 线索文本。
- 伏笔文本。
- 链路摘要。
- 章节位置。
- 来源引用。
- 信息状态。

RAG 检索结果不能直接覆盖线索事实。它只能作为上下文和证据来源。

## 15. 可视化要求

### 15.1 线索总览

线索总览展示：

- 线索总数。
- 未回收伏笔数量。
- 高风险线索数量。
- 缺归因线索数量。
- 当前活跃暗线。
- 当前误导线索。

### 15.2 链路视图

每条链至少展示：

```text
Plant / First Appearance
  ↓
Advance
  ↓
Mislead / Reveal
  ↓
Payoff
```

对于节点归因，必须展示：

```text
Provider → Trigger → Receiver → Payoff
```

### 15.3 章节视图

按章节展示：

- 本章新增线索。
- 本章推进线索。
- 本章误导线索。
- 本章回收伏笔。
- 本章角色知情变化。

### 15.4 人物知情视图

按人物展示：

- 该人物知道哪些线索。
- 该人物误解哪些线索。
- 该人物隐藏哪些线索。
- 该人物向谁提供过线索。
- 该人物被谁误导。

### 15.5 风险视图

风险列表展示：

- 未回收伏笔。
- 缺提供者 / 触发者 / 接收者。
- 缺回收点。
- 时间线冲突。
- 角色知情冲突。
- 不公平误导。
- 孤立线索。

## 16. 异常情况

### 16.1 线索缺归因

处理方式：

- 状态保持 `draft` 或标记风险。
- 写入 `missingFields`。
- 不允许标记为已种下或已完成。

### 16.2 伏笔缺回收计划

处理方式：

- 标记 `missingPayoff`。
- 进入未回收风险列表。
- Agent 可以推荐回收章节。

### 16.3 回收早于种下

处理方式：

- 标记时间线冲突。
- 如果是倒叙结构，必须显式标记。
- 否则不允许标记链路完成。

### 16.4 角色知道不该知道的信息

处理方式：

- 创建 `knowledgeConflict` finding。
- 标记相关章节和人物。
- 提供修复建议。

### 16.5 误导线索不公平

处理方式：

- 标记 `unfairMislead`。
- 提示缺少真实依据或澄清机制。
- 不自动修改剧情。

### 16.6 删除已被章节使用的线索

处理方式：

- 显示影响范围。
- 要求二次确认。
- 如果关联已发布章节，默认禁止硬删除，只允许废弃。

### 16.7 跨小说引用线索

处理方式：

- 默认禁止共享可变线索。
- 允许复制为当前小说的新线索。
- 允许创建只读来源引用。

## 17. 验收标准

### 17.1 数据隔离验收

- 每条 Clue、Foreshadowing、ClueChain、InformationState 必须有 `novelId`。
- 默认查询必须按当前 `novelId` 过滤。
- 跨小说不能共享可变线索链。

### 17.2 创建验收

- 用户可以创建线索。
- 用户可以创建伏笔。
- 用户可以创建暗线。
- 用户可以创建误导线索。
- 用户可以从灵感生成线索 / 伏笔草案。
- 用户可以从泳道节点生成线索 / 伏笔草案。

### 17.3 归因验收

- 线索支持 Provider、Trigger、Receiver、Observer、MissedBy、Concealer、Misleader、Payoff 字段。
- `planted` 或更高状态的线索必须填写 Provider、Trigger、Receiver。
- `paidOff` 状态必须填写回收章节或回收节点。
- 缺字段必须出现在 `missingFields`。

### 17.4 链路验收

- 用户可以创建线索链。
- 用户可以创建伏笔链。
- 用户可以创建暗线链。
- 用户可以创建误导链。
- 链路节点必须有顺序。
- 回收节点不能早于种下节点，除非标记为倒叙结构。

### 17.5 信息状态验收

- 系统能记录读者知情状态。
- 系统能记录作者知情状态。
- 系统能记录每个角色的知情状态。
- 系统能发现角色知情冲突。

### 17.6 审查验收

- Agent 能检查未回收伏笔。
- Agent 能检查缺归因线索。
- Agent 能检查时间线冲突。
- Agent 能检查角色知情冲突。
- Agent 能检查误导公平性。
- 审查结果必须生成 `ClueReviewReport`。

### 17.7 记忆验收

- 线索系统可以读取 Clue Memory。
- 线索系统写入 Clue Memory 必须用户确认。
- RAG 检索结果不能直接覆盖线索事实。

### 17.8 可视化验收

- 系统能展示 Provider → Trigger → Receiver → Payoff。
- 系统能按章节展示线索出现、推进、误导、回收。
- 系统能按人物展示知情状态。
- 系统能展示未回收和高风险线索列表。

### 17.9 异常验收

- 缺归因不能标记完成。
- 缺回收计划必须进入风险列表。
- 不公平误导必须被标记。
- 删除已使用线索必须显示影响范围。

## 18. 后续版本

### 18.1 V2

- 嫌疑人矩阵。
- 读者误判模拟。
- 按人物视角查看全部线索。
- 跨篇章暗线总图。
- 线索链自动布局。
- 多版本谜底推演。
- 线索与评论反馈联动。

### 18.2 V3

- 复杂推理诡计建模。
- 多结局线索管理。
- 跨小说世界观线索引用。
- 读者可疑度预测。
- 自动生成公平性报告。

## 19. 与其他 spec 的边界

| 相关 spec | 边界 |
|---|---|
| `01-novel-project-spec.md` | 定义 Novel 和数据隔离；本 spec 要求所有线索对象绑定 `novelId` |
| `02-novel-cockpit-spec.md` | Cockpit 展示线索摘要和风险；本 spec 定义正式线索系统 |
| `03-inspiration-vault-spec.md` | 灵感库生成线索 / 伏笔草案；本 spec 负责确认和正式链路 |
| `04-arc-swimlane-diagram-spec.md` | 泳道图定义节点级归因；本 spec 定义正式线索链和信息状态 |
| `06-character-system-spec.md` | 人物系统定义人物卡；本 spec 引用人物作为提供者、触发者、接收者、误导者等 |
| `07-worldbuilding-system-spec.md` | 世界观系统定义设定规则；本 spec 可将世界观规则作为线索或伏笔对象 |
| `08-chapter-writing-spec.md` | 章节写作读取线索上下文；本 spec 提供线索 Context |
| `09-chapter-review-spec.md` | 章节审查可调用线索审查；本 spec 生成 ClueReviewReport |
| `10-agent-orchestration-spec.md` | 编排系统执行线索相关任务；本 spec 定义任务对象涉及的线索数据 |
| `11-model-router-spec.md` | 模型路由定义完整模型策略；本 spec 定义线索场景推荐模型 |
| `12-rag-context-engine-spec.md` | RAG 上下文引擎检索线索资料；本 spec 是线索事实源之一 |
| `13-long-term-memory-spec.md` | 长期记忆保存确认后的线索事实；本 spec 不让 RAG 或 Agent 静默覆盖 Clue Memory |
