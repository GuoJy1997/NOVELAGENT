# 07 Worldbuilding System Spec

状态：Review Candidate

日期：2026-07-09

上游依赖：

- `01-novel-project-spec.md`：所有世界观数据必须绑定 `novelId`。
- `02-novel-cockpit-spec.md`：Cockpit 展示世界观摘要、风险和快捷入口。
- `03-inspiration-vault-spec.md`：灵感可以转成世界观草案。
- `04-arc-swimlane-diagram-spec.md`：世界观揭示通过泳道节点进入篇章。
- `05-clue-foreshadowing-spec.md`：当设定信息承担调查、误导或回收功能时，由线索系统维护信息链。
- `06-character-system-spec.md`：人物引用地点、阵营、身份、种族、能力与制度等世界观对象。

相关底座文档：`2026-07-08-novel-agent-product-foundation-design.md`

## 1. 功能定位

Worldbuilding System 是一本小说的世界事实源、规则约束中心和设定揭示管理系统。

它解决的问题是：

1. 作者能统一管理地理、阵营、历史、文化、制度、力量体系、科技和物件等设定。
2. 世界规则不仅是说明文字，还能被 Agent 在写作和审查时执行。
3. 设定随故事时间发生变化，并且变化有事件、章节或人物行为依据。
4. “作者知道的世界真相”和“读者当前知道的内容”严格分离，避免过早泄露或解释不足。
5. 人物、线索、章节、篇章和泳道节点都能引用同一份结构化世界事实。
6. RAG 可以检索相关设定，但不能以相似文本覆盖已确认事实。

一句话定义：

> Worldbuilding System 是一本小说的结构化世界圣经，负责保存世界真相、约束故事运行、规划设定揭示，并发现跨章节的设定冲突。

## 2. 用户角色

### 2.1 新手作者

通过模板创建地点、阵营、历史和力量体系，避免只写概念而缺少可用于剧情的约束。

### 2.2 长篇连载作者

维护持续变化的世界状态，确认当前时间点哪些地点、组织、制度和资源仍然有效。

### 2.3 奇幻 / 科幻作者

管理魔法、科技、种族、自然法则、能力代价、使用条件和例外。

### 2.4 悬疑 / 权谋作者

管理阵营利益、制度权限、秘密历史、公开说法和真实规则。

### 2.5 Agent 任务发起者

要求 Agent 补全设定、检查规则、整理章节上下文、规划揭示节奏或生成修改任务。

## 3. 入口位置

### 3.1 主入口

```text
项目列表
  → 进入某一本小说
  → Novel Cockpit
  → Worldbuilding
```

主入口打开该小说的世界观工作台，默认展示：

- 世界观健康度。
- 设定分类导航。
- 最近编辑条目。
- 待确认草案。
- 规则冲突。
- 待揭示设定。
- 当前篇章相关设定。

### 3.2 上下文入口

用户可以从以下位置进入：

- Cockpit 的世界观摘要卡。
- 全书结构地图中的篇章卡。
- 篇章泳道图的“世界观揭示”节点。
- 人物详情中的阵营、身份、地点和能力引用。
- 线索卡中的设定依据。
- 章节编辑器的上下文栏。
- 灵感库的“转为世界观”动作。
- Agent 建议和审查报告。
- 全局快捷创建器。

### 3.3 快速创建入口

用户在任意小说内输入：

```text
/world
```

或者使用“新建设定”，系统必须将新对象绑定到当前 `novelId`。未进入小说项目时，系统必须先要求选择目标小说。

## 4. 核心用户目标

### 4.1 建立世界圣经

把分散在脑内、灵感、章节和大纲中的设定整理为可检索、可关联、可验证的条目。

### 4.2 定义可执行规则

明确规则的适用范围、条件、代价、限制、例外和后果，让规则能参与写作约束。

### 4.3 管理世界关系

看清地点隶属、组织对立、资源流向、制度管辖、历史因果和力量克制关系。

### 4.4 追踪世界变化

记录政权更替、地点毁坏、资源耗尽、规则失效、技术升级和公开认知变化。

### 4.5 规划设定揭示

决定某个设定何时、由谁、通过什么事件向哪些人物和读者揭示。

### 4.6 检查一致性

发现规则矛盾、时间冲突、空间冲突、能力越界、阵营行为失真和读者知识泄漏。

### 4.7 为章节写作供给上下文

按章节目标检索最少但充分的世界设定，避免一次把整本世界观塞给模型。

## 5. MVP 范围

### 5.1 必须包含

- 按小说隔离的世界观空间。
- 通用世界观条目。
- 设定分类和标签。
- 世界规则。
- 世界对象关系。
- 世界状态快照与变更记录。
- 设定揭示计划。
- 作者真相与读者已知状态分离。
- 条目来源、版本和确认状态。
- 地理、阵营、历史、文化、制度、力量体系、科技、物件等预置类型。
- 列表视图、关系图、时间线、规则视图和揭示视图。
- Agent 设定补全、关联建议和一致性检查。
- 与人物、线索、篇章、章节、泳道节点、RAG 和长期记忆的引用。
- 设定冲突报告和修改任务入口。

### 5.2 MVP 可以简化

- 地图使用节点与连接关系，不提供专业 GIS 能力。
- 世界时间使用统一排序值加显示文本，不强制所有小说采用真实日历。
- 类型差异通过通用条目和类型化属性表达，不为每种设定建立独立子系统。
- 读者知识以章节 / 事件节点为粒度，不追踪每一名真实读者。
- 状态变化以关键快照记录，不要求每个句子都产生世界状态。
- 自动抽取设定只生成候选草案，不直接确认。

## 6. 非 MVP 范围

- 可自由绘制大陆边界的专业地图编辑器。
- 天体运行、气候、经济和人口的实时仿真。
- 完整人工语言生成器。
- RPG 数值战斗模拟器。
- 多人实时协作和细粒度设定权限。
- 跨小说共享且同步修改的可变宇宙。
- 自动把整部正文重写为符合新设定的版本。
- 无人工确认的全书 Canon 自动改写。
- 面向读者发布的百科站点。
- 真实地理数据和外部知识库的自动事实同步。

## 7. 核心流程

### 7.1 从零创建设定

```text
用户选择设定类型
  → 输入名称、摘要和核心事实
  → 系统创建 draft WorldItem
  → Agent 建议缺失字段、相关规则和潜在关系
  → 用户编辑并提交确认
  → 系统执行冲突检查
  → 无阻断冲突时进入 confirmed
  → 可选择写入 World Memory
```

### 7.2 从灵感转为设定

```text
用户在 Inspiration Vault 选择灵感
  → 选择“转为世界观”
  → Agent 判断候选类型并提取事实
  → 创建 draft WorldItem
  → 保存 sourceInspirationId
  → 用户确认后成为正式设定
```

关键规则：

- 原灵感必须保留，不被转换动作覆盖。
- 灵感文本不是 Canon。
- 一个灵感可以拆成多个设定草案。

### 7.3 定义世界规则

```text
用户打开某个设定
  → 新增规则
  → 填写触发条件、适用范围、限制、代价、例外和后果
  → Agent 将自然语言转成结构化草案
  → 系统检查与现有规则的冲突
  → 用户确认
  → 规则参与章节写作与审查
```

### 7.4 建立设定关系

```text
用户选择源条目和目标条目
  → 选择关系类型与方向
  → 填写公开关系、真实关系和生效时间
  → 系统检查循环依赖、重复关系和跨小说引用
  → 保存 WorldRelation
```

### 7.5 记录世界变化

```text
章节 / 事件导致世界状态变化
  → Agent 提取候选变化
  → 生成 WorldStateChange 草案
  → 展示变化前、变化后、来源事件和影响范围
  → 用户确认
  → 创建新快照，不覆盖历史快照
```

### 7.6 规划设定揭示

```text
用户选择一个 confirmed / locked 设定
  → 创建 WorldRevealPlan
  → 指定篇章、章节或事件节点
  → 指定揭示者、接收人物、揭示方式和目标理解程度
  → 系统检查是否过早、重复或缺少铺垫
  → 写作时加载计划
  → 章节确认后更新实际揭示状态
```

### 7.7 从章节抽取设定

```text
章节进入 approved / published
  → Agent 提取新设定与状态变化候选
  → 与现有 WorldItem / WorldRule 比对
  → 分类为新增、补充、重复或冲突
  → 用户逐项确认
  → 更新结构化事实和来源引用
```

章节正文是重要证据，但抽取结果不能自动覆盖 `confirmed` 或 `locked` 设定。

### 7.8 执行世界观一致性检查

```text
用户选择条目 / 章节 / 篇章 / 全书
  → Context Engine 检索相关设定和来源
  → 规则检查执行确定性校验
  → 审查模型执行语义校验
  → 生成 WorldReviewReport
  → 用户接受、忽略或转成 RevisionTask
```

## 8. 核心数据对象

| 对象 | 职责 |
|---|---|
| `WorldItem` | 通用世界观条目和作者事实 |
| `WorldItemVersion` | 条目版本与来源快照 |
| `WorldRule` | 可执行的世界约束 |
| `WorldRuleException` | 规则的明确例外 |
| `WorldRelation` | 世界对象之间的有向或无向关系 |
| `WorldStateSnapshot` | 某时间点的世界对象状态 |
| `WorldStateChange` | 状态变化及其剧情依据 |
| `WorldRevealPlan` | 设定向人物和读者揭示的计划与实际结果 |
| `WorldKnowledgeState` | 作者真相、人物认知和读者认知的映射 |
| `WorldReviewReport` | 世界观一致性审查结果 |
| `WorldFinding` | 单个设定问题 |

### 8.1 建模原则

1. 所有对象必须包含 `novelId`。
2. `WorldItem` 保存“是什么”，`WorldRule` 保存“如何运行”。
3. `WorldRelation` 保存稳定关系，随时间变化的结果通过 `WorldStateChange` 留痕。
4. `WorldRevealPlan` 只管理揭示，不拥有设定真相。
5. 已确认结构化数据是事实源；RAG 是检索层，不是事实源。
6. 任何自动抽取结果先进入草案或候选状态。
7. `contradicted` 是检查结果，不是条目生命周期状态。
8. 删除已被引用的条目时默认归档，不执行硬删除。

## 9. 字段定义

本节“必填”表示字段必须存在；数组可以为空，除非字段说明或校验规则另有要求。`draft` 允许内容字段暂时为空，但进入 `proposed` 前必须满足所有必填内容和对应类型的最低要求。

### 9.1 WorldItem

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `worldItemId` | string | 是 | 条目 ID |
| `novelId` | string | 是 | 所属小说 |
| `type` | enum | 是 | 设定类型 |
| `name` | string | 是 | 名称 |
| `aliases` | string[] | 是 | 别名 |
| `summary` | string | 是 | 无剧透短摘要 |
| `authorTruth` | string | 是 | 作者视角完整真相 |
| `publicBelief` | string | 否 | 世界中普遍相信的说法 |
| `typeAttributes` | object | 是 | 按类型扩展的结构化属性 |
| `tags` | string[] | 是 | 标签 |
| `importance` | enum | 是 | `core`、`major`、`supporting`、`background` |
| `canonStatus` | enum | 是 | `draft`、`proposed`、`confirmed`、`locked`、`deprecated`、`archived` |
| `sourceRefs` | object[] | 是 | 灵感、章节、事件、导入文件或用户输入来源 |
| `relatedCharacterIds` | string[] | 是 | 相关人物 |
| `relatedArcIds` | string[] | 是 | 相关篇章 |
| `currentSnapshotId` | string | 否 | 当前状态快照 |
| `version` | number | 是 | 当前版本号 |
| `createdBy` | enum | 是 | `user`、`agent`、`import`、`extraction` |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.2 WorldItemType

| 值 | 说明 |
|---|---|
| `geography` | 大陆、区域、地貌和自然环境 |
| `location` | 城市、建筑、遗迹和具体场所 |
| `faction` | 国家、组织、家族、公司和秘密团体 |
| `culture` | 习俗、价值观、礼仪和社会规范 |
| `history` | 历史时期、战争、灾难和重要事件 |
| `politics` | 权力结构、治理方式和外交秩序 |
| `economy` | 货币、资源、贸易和生产体系 |
| `religion` | 信仰、神话、教团和仪式 |
| `species` | 种族、物种和生命形态 |
| `language` | 语言、文字、称谓和交流规则 |
| `institution` | 法律、教育、军队、职业和社会制度 |
| `magicSystem` | 魔法、超能力和修炼体系 |
| `technologySystem` | 科技水平、设备和技术体系 |
| `artifact` | 关键物件、遗物、武器和装置 |
| `naturalLaw` | 物理、宇宙、时间和超自然基本法则 |
| `calendar` | 纪年、历法、节日和时间单位 |
| `custom` | 局部传统、禁忌和行为习惯 |
| `other` | 无法归入预置类型的设定 |

### 9.3 typeAttributes 最低要求

不同类型允许扩展，但以下类型在进入 `confirmed` 前必须具备最低字段：

| 类型 | 最低属性 |
|---|---|
| `location` | 上级区域、进入条件、空间特征、控制方 |
| `faction` | 目标、资源、权力结构、盟友、敌对方 |
| `history` | 起因、时间位置、参与方、结果、当前影响 |
| `culture` | 核心价值、典型行为、禁忌、内部差异 |
| `institution` | 适用对象、权利、义务、执行者、处罚 |
| `magicSystem` | 能力来源、使用条件、代价、限制、反制 |
| `technologySystem` | 能力边界、资源依赖、使用者、故障或限制 |
| `artifact` | 来源、能力、持有者、限制、当前状态 |
| `naturalLaw` | 适用范围、触发条件、不可违反项、已知例外 |

### 9.4 WorldItemVersion

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `versionId` | string | 是 | 版本 ID |
| `worldItemId` | string | 是 | 条目 ID |
| `novelId` | string | 是 | 所属小说 |
| `version` | number | 是 | 版本号 |
| `snapshot` | object | 是 | 当时的条目完整快照 |
| `changeSummary` | string | 是 | 修改摘要 |
| `reason` | string | 否 | 修改原因 |
| `sourceRefs` | object[] | 是 | 修改依据 |
| `createdBy` | enum | 是 | `user`、`agent`、`import`、`extraction` |
| `confirmedByUser` | boolean | 是 | 是否经用户确认 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.5 WorldRule

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `worldRuleId` | string | 是 | 规则 ID |
| `novelId` | string | 是 | 所属小说 |
| `worldItemId` | string | 是 | 所属设定条目 |
| `name` | string | 是 | 规则名称 |
| `statement` | string | 是 | 人类可读规则 |
| `ruleType` | enum | 是 | 规则类型 |
| `scopeItemIds` | string[] | 是 | 适用对象 |
| `preconditions` | object[] | 是 | 生效前提 |
| `constraints` | object[] | 是 | 限制条件 |
| `costs` | object[] | 是 | 使用代价 |
| `consequences` | object[] | 是 | 触发后果 |
| `exceptionIds` | string[] | 是 | 明确例外 |
| `priority` | number | 是 | 规则冲突时的比较优先级 |
| `canonStatus` | enum | 是 | 与 WorldItem 相同 |
| `sourceRefs` | object[] | 是 | 来源 |
| `version` | number | 是 | 版本号 |

### 9.6 WorldRuleType

| 值 | 说明 |
|---|---|
| `permission` | 在何种条件下可以发生 |
| `prohibition` | 明确禁止发生 |
| `requirement` | 发生前必须满足 |
| `cost` | 使用能力或资源必须付出的代价 |
| `causality` | 条件触发的必然或高概率后果 |
| `capacity` | 能力、技术或制度的上限 |
| `jurisdiction` | 规则适用的地域、组织或人群 |
| `temporal` | 时间、周期或持续期规则 |
| `spatial` | 距离、通行、位置和空间限制 |
| `social` | 身份、礼仪、法律和社会约束 |

### 9.7 WorldRuleException

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `exceptionId` | string | 是 | 例外 ID |
| `worldRuleId` | string | 是 | 所属规则 |
| `novelId` | string | 是 | 所属小说 |
| `condition` | string | 是 | 例外成立条件 |
| `scopeItemIds` | string[] | 是 | 例外对象 |
| `reason` | string | 是 | 世界内解释 |
| `costOrConsequence` | string | 否 | 例外代价或后果 |
| `isSecret` | boolean | 是 | 是否为作者秘密 |
| `sourceRefs` | object[] | 是 | 依据 |
| `confirmed` | boolean | 是 | 是否确认 |

例外不能只填写“特殊情况”。必须说明触发条件、适用对象和世界内原因。

### 9.8 WorldRelation

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `worldRelationId` | string | 是 | 关系 ID |
| `novelId` | string | 是 | 所属小说 |
| `sourceWorldItemId` | string | 是 | 源条目 |
| `targetWorldItemId` | string | 是 | 目标条目 |
| `type` | enum | 是 | 关系类型 |
| `direction` | enum | 是 | `oneWay`、`mutual` |
| `publicDescription` | string | 否 | 公开关系 |
| `trueDescription` | string | 是 | 作者真相 |
| `strength` | number | 否 | -5 到 5 |
| `effectiveFrom` | string | 否 | 生效时间或事件 |
| `effectiveTo` | string | 否 | 失效时间或事件 |
| `sourceRefs` | object[] | 是 | 依据 |
| `status` | enum | 是 | `active`、`inactive`、`hidden`、`ended` |

### 9.9 WorldRelationType

| 值 | 说明 |
|---|---|
| `contains` | 包含、隶属 |
| `locatedIn` | 位于 |
| `controls` | 控制、管辖 |
| `dependsOn` | 依赖 |
| `produces` | 生产、产生 |
| `consumes` | 消耗 |
| `tradesWith` | 贸易、交换 |
| `alliedWith` | 联盟 |
| `opposedTo` | 对立 |
| `conflictsWith` | 存在规则或利益冲突 |
| `derivedFrom` | 起源、派生 |
| `causes` | 导致 |
| `restricts` | 限制、克制 |
| `requires` | 必须依赖 |
| `worships` | 信仰、崇拜 |
| `knowsAbout` | 组织或群体知晓 |
| `conceals` | 隐藏、封锁 |
| `other` | 自定义关系 |

### 9.10 WorldStateSnapshot

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `snapshotId` | string | 是 | 快照 ID |
| `worldItemId` | string | 是 | 条目 ID |
| `novelId` | string | 是 | 所属小说 |
| `storyOrder` | number | 是 | 故事内排序值 |
| `storyTimeLabel` | string | 否 | 作者可读时间 |
| `chapterId` | string | 否 | 对应章节 |
| `eventNodeId` | string | 否 | 对应事件节点 |
| `state` | object | 是 | 当前控制方、位置、资源、完整性、公开状态等 |
| `sourceRefs` | object[] | 是 | 依据 |
| `confirmed` | boolean | 是 | 是否确认 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.11 WorldStateChange

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `stateChangeId` | string | 是 | 变化 ID |
| `worldItemId` | string | 是 | 变化对象 |
| `novelId` | string | 是 | 所属小说 |
| `beforeSnapshotId` | string | 否 | 变化前快照 |
| `afterSnapshotId` | string | 是 | 变化后快照 |
| `changeType` | enum | 是 | `created`、`transformed`、`transferred`、`damaged`、`destroyed`、`revealed`、`restricted`、`restored`、`deprecated` |
| `cause` | string | 是 | 变化原因 |
| `actorCharacterIds` | string[] | 是 | 导致变化的人物 |
| `chapterId` | string | 否 | 对应章节 |
| `eventNodeId` | string | 否 | 对应事件节点 |
| `affectedObjectIds` | string[] | 是 | 受影响对象 |
| `confirmed` | boolean | 是 | 是否确认 |

### 9.12 WorldRevealPlan

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `revealPlanId` | string | 是 | 揭示计划 ID |
| `novelId` | string | 是 | 所属小说 |
| `worldItemId` | string | 是 | 被揭示设定 |
| `truthScope` | string | 是 | 本次揭示的具体事实，不默认揭示整个条目 |
| `targetUnderstanding` | enum | 是 | `hint`、`partial`、`functional`、`full`、`falseBelief` |
| `arcId` | string | 否 | 目标篇章 |
| `chapterId` | string | 否 | 目标章节 |
| `eventNodeId` | string | 否 | 目标事件节点 |
| `revealerCharacterIds` | string[] | 是 | 提供或展示信息的人物 |
| `triggerCharacterIds` | string[] | 是 | 促使本次揭示发生的人物 |
| `revealSourceObjectIds` | string[] | 是 | 文档、地点、物件、规则或环境等信息来源 |
| `triggerObjectIds` | string[] | 是 | 触发揭示的事件、行为、物件或环境变化 |
| `receiverCharacterIds` | string[] | 是 | 获得信息的人物 |
| `revealMethod` | enum | 是 | `action`、`dialogue`、`discovery`、`document`、`environment`、`narration`、`consequence` |
| `readerEffect` | string | 是 | 希望读者形成的理解 |
| `prerequisiteRevealIds` | string[] | 是 | 前置揭示 |
| `status` | enum | 是 | `planned`、`drafted`、`revealed`、`revised`、`cancelled` |
| `actualChapterId` | string | 否 | 实际揭示章节 |
| `actualEvidenceRefs` | object[] | 是 | 实际正文证据 |

校验规则：

- `revealerCharacterIds` 与 `revealSourceObjectIds` 至少一项非空。
- `triggerCharacterIds` 与 `triggerObjectIds` 至少一项非空。
- 由环境、遗迹或后果直接展示设定时，可以没有人物揭示者，但必须记录来源对象。
- 当揭示同时承担线索功能时，还必须引用 `ClueAttribution`，并服从线索系统的提供者、触发者、接收者和回收规则。

### 9.13 WorldKnowledgeState

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `knowledgeStateId` | string | 是 | 状态 ID |
| `novelId` | string | 是 | 所属小说 |
| `worldItemId` | string | 是 | 对应设定 |
| `truthScope` | string | 是 | 对应的具体事实 |
| `audienceType` | enum | 是 | `reader`、`character`、`faction`、`public` |
| `audienceId` | string | 否 | 人物或阵营 ID |
| `state` | enum | 是 | `unknown`、`hinted`、`misunderstood`、`partial`、`known`、`concealed` |
| `effectiveFromChapterId` | string | 否 | 生效章节 |
| `effectiveFromEventNodeId` | string | 否 | 生效事件 |
| `sourceRefs` | object[] | 是 | 认知依据 |
| `confirmed` | boolean | 是 | 是否确认 |

人物对线索的知情状态仍由 `05-clue-foreshadowing-spec.md` 的 `InformationState` 管理；当同一事实同时是世界设定和线索时，两者通过引用关联，不重复维护真相。

### 9.14 WorldReviewReport

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `reportId` | string | 是 | 报告 ID |
| `novelId` | string | 是 | 所属小说 |
| `scopeType` | enum | 是 | `worldItem`、`chapter`、`arc`、`novel` |
| `scopeId` | string | 否 | 范围 ID |
| `findings` | `WorldFinding[]` | 是 | 问题列表 |
| `checkedRuleIds` | string[] | 是 | 已检查规则 |
| `sourceRefs` | object[] | 是 | 使用的事实与文本 |
| `modelId` | string | 是 | 审查模型 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.15 WorldFinding

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `findingId` | string | 是 | 问题 ID |
| `type` | enum | 是 | 问题类型 |
| `severity` | enum | 是 | `info`、`warning`、`danger`、`blocking` |
| `summary` | string | 是 | 问题摘要 |
| `expectedFact` | string | 否 | 已确认规则或状态 |
| `conflictingFact` | string | 否 | 冲突内容 |
| `relatedWorldItemIds` | string[] | 是 | 相关设定 |
| `relatedObjectIds` | string[] | 是 | 相关章节、人物、线索或节点 |
| `evidenceRefs` | object[] | 是 | 双方证据 |
| `suggestedActions` | string[] | 是 | 修复方向 |
| `requiresUserConfirmation` | boolean | 是 | 是否需要确认 |
| `resolutionStatus` | enum | 是 | `open`、`accepted`、`ignored`、`resolved` |

问题类型至少包含：

- `ruleContradiction`
- `timelineConflict`
- `spatialConflict`
- `stateDiscontinuity`
- `abilityOverflow`
- `missingCost`
- `exceptionAbuse`
- `factionLogicGap`
- `historyImpactGap`
- `readerKnowledgeLeak`
- `revealTooLate`
- `duplicateDefinition`
- `orphanWorldItem`
- `canonSourceWeak`

## 10. 状态机

### 10.1 世界观条目与规则状态

```text
draft → proposed → confirmed → locked
  │         │           │
  └─────────┴──────────→ archived
                        confirmed / locked → deprecated
```

规则：

- `draft`：允许字段不完整，不参与强约束检查。
- `proposed`：字段满足最低要求，等待用户确认。
- `confirmed`：正式 Canon，参与写作和审查。
- `locked`：核心 Canon，修改必须展示影响范围并二次确认。
- `deprecated`：曾经有效但不再作为当前规则；必须保留历史引用。
- `archived`：退出日常使用但不删除。
- `confirmed` 和 `locked` 的任何修改都创建新版本。
- 发现冲突时创建 `WorldFinding`，不把条目状态改为 `contradicted`。

### 10.2 揭示计划状态

```text
planned → drafted → revealed
    │         │          │
    └─────────┴────────→ revised
    └──────────────────→ cancelled
```

- `revealed` 必须有实际章节或事件证据。
- 章节被回滚时，相关揭示可以进入 `revised`，不能静默回到 `planned`。

### 10.3 审查问题状态

```text
open → accepted → resolved
  └──→ ignored
```

- `blocking` 问题不能只由 Agent 自动标记为 `resolved`。
- 忽略必须记录用户理由。

## 11. Agent 行为

### 11.1 可以自动执行

- 从用户输入、灵感、章节和大纲中提取设定候选。
- 推荐设定类型、标签、关系和缺失字段。
- 把自然语言规则整理成条件、限制、代价、例外和后果。
- 推荐世界观条目之间的候选关系。
- 为章节整理相关世界观上下文。
- 检查规则、时间、空间、状态、阵营逻辑和揭示节奏。
- 从已批准章节提取世界状态变化草案。
- 为冲突生成修复选项和修改任务草案。
- 识别孤立设定和长期未被剧情使用的设定。

### 11.2 必须由用户确认

- 把草案提升为 `confirmed` 或 `locked`。
- 修改 `authorTruth`。
- 新增或修改规则例外。
- 修改已确认规则的限制、代价和后果。
- 改变地点归属、阵营控制、历史结果和力量上限。
- 确认章节抽取出的新 Canon。
- 更新读者“已完全知晓”的状态。
- 写入 World Memory 或 Core Canon Memory。
- 废弃、归档或恢复已确认条目。
- 修改已发布章节所依据的世界事实。

### 11.3 禁止自动执行

- 用 RAG 检索结果覆盖结构化 Canon。
- 因为正文中出现一次不同表述就改写规则。
- 为修复冲突而悄悄增加“主角例外”。
- 删除被人物、线索、章节或事件引用的条目。
- 把 `publicBelief` 当成 `authorTruth`。
- 把 Agent 推断当成用户确认事实。

### 11.4 Agent 建议格式

所有世界观建议必须包含：

```text
建议类型
作用对象
当前 Canon
候选内容或发现的问题
依据来源
受影响的篇章 / 章节 / 人物 / 线索 / 规则
风险等级
推荐动作
是否需要用户确认
推荐模型 / Skill
```

## 12. Skill 调用

| Skill | 触发场景 |
|---|---|
| 世界观条目生成 | 从简介、灵感或大纲创建设定草案 |
| 世界观条目补全 | 补充某类型的最低字段 |
| 世界规则结构化 | 将自然语言转成条件、限制、代价和后果 |
| 力量体系审查 | 检查能力上限、代价、克制和例外 |
| 地理空间一致性检查 | 检查地点隶属、移动路径和空间冲突 |
| 历史时间线检查 | 检查历史先后、角色年龄和因果影响 |
| 阵营逻辑检查 | 检查目标、资源、行动和关系是否一致 |
| 文化制度检查 | 检查制度是否真正影响人物行为与剧情 |
| 设定揭示规划 | 安排设定信息的铺垫、局部揭示和完整揭示 |
| 读者知识检查 | 检查旁白、人物或章节是否提前泄露 |
| 章节设定抽取 | 从已批准正文提取新事实和状态变化候选 |
| 世界观上下文整理 | 为写作任务提供相关且最小的设定包 |
| 世界观冲突审查 | 生成结构化冲突报告 |

Skill 输出必须带：

- `novelId`
- 对象 ID
- 输入来源
- 使用的 Canon 版本
- 输出类型
- 置信度
- 风险等级
- 是否需要用户确认
- 使用模型

## 13. 模型选择规则

| 场景 | 推荐模型特点 |
|---|---|
| 灵感扩展和世界创意发散 | 创意强、风格多样、约束服从良好 |
| 条目补全 | 结构化输出稳定、成本适中 |
| 规则结构化 | 推理稳定、JSON / Schema 遵循良好 |
| 力量体系设计 | 深度推理、能处理约束和反例 |
| 全书一致性审查 | 长上下文、深度推理、引用能力强 |
| 地理与时间线检查 | 逻辑推理、工具调用稳定 |
| 章节设定抽取 | 信息抽取准确、成本适中 |
| 揭示节奏设计 | 叙事理解和长篇规划能力强 |
| 上下文压缩 | 摘要保真、引用可追溯 |

模型路由必须遵守：

1. 生成草案与确认 Canon 可以使用不同模型。
2. 高风险规则修改优先使用深度推理模型复核。
3. 全书审查必须先缩小检索范围，再按条目或篇章分批执行。
4. 用户可以手动覆盖模型选择。
5. 模型切换只改变执行者，不改变事实优先级。
6. 模型建议必须说明质量、速度、成本和上下文能力方面的理由。

## 14. 长期记忆读写

### 14.1 可读取

- Project Memory。
- Core Canon Memory。
- World Memory。
- Character Memory。
- Clue Memory。
- Style Memory。

### 14.2 可写入

经用户确认后可以写入：

- World Memory：确认后的设定摘要、规则、关系、当前状态和揭示状态。
- Core Canon Memory：不可轻易变更的自然法则、核心历史真相和世界运行原则。
- Project Memory：世界观创作偏好，如硬魔法 / 软魔法、设定密度和解释方式。

### 14.3 不得直接写入

- 未确认灵感。
- `draft` 或 `proposed` 条目。
- Agent 推断。
- 未解决的冲突结论。
- 未批准章节抽取结果。
- 临时 RAG 摘要。
- 未确认的规则例外。

### 14.4 记忆写入格式

每条记忆必须包含：

```text
novelId
memoryType
subjectId
fact
sourceRefs
canonVersion
confirmedBy
effectiveFrom
supersedesMemoryId
```

新记忆不能覆盖旧记忆；失效事实通过 `supersedesMemoryId` 建立版本链。

### 14.5 与 RAG 的关系

Worldbuilding System 向 Context Engine 提供：

- 条目正文和结构化摘要。
- 规则及例外。
- 关系。
- 状态快照。
- 揭示计划和知识状态。
- 来源章节和事件引用。

检索优先级：

```text
locked Canon
  → confirmed Canon
  → 已发布章节证据
  → 已批准大纲 / 泳道节点
  → proposed / draft
  → 灵感与外部资料
```

低优先级内容与高优先级内容冲突时，Context Engine 必须返回冲突标记，不能自动合并成新事实。

## 15. 可视化要求

### 15.1 世界观工作台

必须显示：

- 分类导航。
- 条目列表。
- Canon 状态。
- 核心规则数。
- 待确认草案。
- 未解决冲突。
- 待揭示设定。
- 最近状态变化。
- 当前篇章相关设定。

### 15.2 世界关系图

节点代表 `WorldItem`，边代表 `WorldRelation`。

必须支持：

- 按类型、篇章、状态和重要度过滤。
- 关系方向和类型。
- 公开关系与作者真相切换。
- 聚焦某一条目的一至三层关系。
- 跳转人物、线索、篇章、章节和事件节点。
- 冲突关系高亮。
- 大图分层加载，避免一次渲染全部节点。

### 15.3 世界时间线

展示历史事件和故事内状态变化：

```text
远古历史 → 故事前史 → 当前故事 → 计划未来
```

必须支持：

- 使用 `storyOrder` 排序。
- 显示作者自定义时间标签。
- 对齐章节和篇章。
- 查看某条目随时间的状态快照。
- 标记时间冲突和缺失区间。

### 15.4 规则视图

每条规则以卡片展示：

```text
规则
适用范围
触发条件
限制
代价
例外
后果
来源
Canon 状态
```

规则之间可以显示：

- 依赖。
- 覆盖。
- 冲突。
- 克制。
- 例外。

### 15.5 揭示视图

设定揭示以篇章 / 章节为横轴，以以下泳道为纵轴：

- 计划揭示。
- 实际揭示。
- 人物已知。
- 读者已知。
- 误解 / 公开谎言。

每个揭示节点必须显示：

- 揭示了哪一部分真相。
- 谁提供或展示。
- 谁或什么触发揭示。
- 谁接收。
- 通过什么方式。
- 读者预期理解。
- 前置揭示。
- 实际正文证据。

### 15.6 地点关系视图

MVP 使用层级和连接图表达：

- 包含关系。
- 可达关系。
- 通行条件。
- 控制方。
- 关键距离或耗时。

不承诺按真实比例绘制地图。

### 15.7 章节上下文侧栏

章节编辑器必须显示：

- 本章发生地点。
- 当前地点和阵营状态。
- 相关规则。
- 相关人物拥有的能力与限制。
- 本章计划揭示。
- 读者当前已知。
- 可能冲突。
- 来源跳转。

## 16. 异常情况

### 16.1 重复条目

- 创建前按名称、别名、类型和语义相似度检查。
- 允许“合并”“建立别名”“保持独立”。
- 合并必须展示关系、版本、来源和引用迁移范围。

### 16.2 规则互相矛盾

- 创建 `ruleContradiction` finding。
- 展示双方规则、优先级、适用范围和来源。
- Agent 可以提出缩小范围、增加有依据的例外或废弃旧规则三类方案。
- 不自动选择胜者。

### 16.3 章节违反设定

- 指向具体段落和对应规则。
- 区分“正文错误”“设定需要修改”“角色误解”“有意伏笔”。
- 生成修改任务前由用户选择解释。

### 16.4 角色能力越界

- 检查能力来源、条件、代价、限制和当前状态。
- 若没有足够依据，创建 `abilityOverflow`。
- 不自动补写训练、血统或隐藏能力作为解释。

### 16.5 规则例外泛滥

- 同一规则出现多个人物专属例外时创建 `exceptionAbuse`。
- 展示例外对紧张感和可信度的影响。

### 16.6 时间或空间不确定

- 允许保存为草案并标记不确定范围。
- `confirmed` 前必须选择明确顺序或建立作者认可的模糊规则。
- 审查时不得把未知值当成冲突。

### 16.7 作者真相与公开说法不一致

- 这是允许的双层信息，不自动报错。
- 只有当正文叙事层级混淆或读者提前知道时才创建 finding。

### 16.8 删除被引用设定

- 显示所有人物、规则、线索、章节和节点引用。
- 默认只允许归档。
- 若用户确认替换，必须先迁移引用并保留版本历史。

### 16.9 跨小说复制设定

- 默认复制为新 ID。
- 保留只读来源引用。
- 不共享状态、版本、记忆和揭示计划。
- 后续修改互不影响。

### 16.10 RAG 返回冲突内容

- 同时显示检索片段和当前 Canon。
- 标记来源、版本和优先级。
- 只允许生成候选修订，不自动写回。

### 16.11 章节回滚或删除

- 标记相关状态变化和揭示证据失效。
- 将揭示计划转为 `revised`。
- 不删除已经存在的历史版本。
- 提醒用户重新确认当前状态。

## 17. 验收标准

### 17.1 数据隔离

- 所有世界观对象必须有 `novelId`。
- 切换小说不能显示上一小说的条目、规则、关系或记忆。
- 跨小说复制必须生成新 ID。

### 17.2 世界观条目

- 用户可以创建、编辑、确认、锁定、废弃和归档条目。
- 预置类型覆盖地理、地点、阵营、历史、文化、制度、力量体系、科技和物件。
- `confirmed` 前检查类型最低字段。
- 确认后的修改生成版本。

### 17.3 规则

- 规则可以记录适用范围、条件、限制、代价、后果和例外。
- Agent 写作和审查可以读取 `confirmed` / `locked` 规则。
- 例外必须具备条件、对象和原因。
- 冲突不会自动改写任一规则。

### 17.4 关系与状态

- 可以建立有方向和无方向的世界关系。
- 状态变化保留前后快照和剧情依据。
- 用户可以查看任一条目在指定故事时间点的状态。
- 删除或归档不破坏已有引用。

### 17.5 设定揭示

- 可以把设定的局部真相关联到篇章、章节和事件节点。
- 每个揭示计划可记录揭示者、接收者、方式和读者预期理解。
- 每个揭示计划必须能追溯信息来源和触发来源；非人物来源不能留空省略。
- 计划揭示与实际揭示可比较。
- 作者真相、人物认知和读者认知相互分离。

### 17.6 Agent 与审查

- Agent 只能自动创建候选草案。
- 系统能检查规则、时间、空间、状态、能力、阵营和读者知识问题。
- 报告必须引用冲突双方证据。
- `blocking` 问题必须由用户确认解决。

### 17.7 可视化

- 世界关系图支持类型、状态和篇章过滤。
- 世界时间线可以跳转章节和事件节点。
- 规则视图显示完整约束结构。
- 揭示视图区分计划、实际、人物已知和读者已知。
- 章节侧栏显示本章最相关设定和风险。

### 17.8 记忆与 RAG

- 只有用户确认后的世界事实可以写入长期记忆。
- RAG 结果不能覆盖结构化 Canon。
- 检索结果必须包含来源和 Canon 版本。
- 低优先级来源与 Canon 冲突时必须显式提示。

### 17.9 性能与规模

- 关系图默认只加载聚焦条目的局部网络。
- 全书审查可以按篇章或设定类型分批执行。
- 章节上下文只加载与本章人物、地点、事件和规则相关的内容。
- 大量条目不会阻止用户使用列表和搜索完成基础管理。

## 18. 后续版本

### 18.1 V2

- 可绘制区域和路线的视觉地图编辑器。
- 自定义历法和日期换算。
- 阵营势力变化动画。
- 资源流与经济关系视图。
- 设定模板市场。
- 规则单元测试和反例生成。
- 世界观术语自动统一。
- 多种读者视角的剧透模拟。

### 18.2 V3

- 跨小说共享宇宙与分支 Canon。
- 气候、人口、交通和资源仿真。
- 人工语言辅助设计。
- 可运行的力量体系模拟器。
- 多人世界观协作与审批。
- 面向读者的无剧透百科导出。

## 19. 与其他 Spec 的边界

| 相关 Spec | 边界 |
|---|---|
| `01-novel-project-spec.md` | 定义小说级数据空间；本 Spec 定义该空间内的世界事实 |
| `02-novel-cockpit-spec.md` | Cockpit 展示摘要和风险；本 Spec 提供数据与完整工作台 |
| `03-inspiration-vault-spec.md` | 灵感库保存原始想法；本 Spec 接收并确认世界观草案 |
| `04-arc-swimlane-diagram-spec.md` | 泳道图安排世界观揭示节点；本 Spec 保存设定真相和揭示计划 |
| `05-clue-foreshadowing-spec.md` | 线索系统维护调查、误导与回收链；本 Spec 提供其中引用的世界事实 |
| `06-character-system-spec.md` | 人物系统维护人物身份、状态和知情；本 Spec 定义人物所处的地点、阵营、制度和规则 |
| `08-chapter-writing-spec.md` | 写作系统消费世界观上下文并生成正文；本 Spec 不生成完整章节 |
| `09-chapter-review-spec.md` | 章节审查编排多类检查；本 Spec 提供世界观检查器和报告 |
| `10-agent-orchestration-spec.md` | 编排系统拆分和调度任务；本 Spec 定义世界观任务的输入输出与确认边界 |
| `11-model-router-spec.md` | 模型路由选择具体模型；本 Spec 只定义任务需要的模型特点 |
| `12-rag-context-engine-spec.md` | Context Engine 负责检索和组装；本 Spec 是世界观结构化事实源 |
| `13-long-term-memory-spec.md` | 长期记忆保存确认后的高价值事实；本 Spec 决定哪些世界事实有资格写入 |
| `14-skill-system-spec.md` | Skill 系统定义注册、执行和权限；本 Spec 定义世界观 Skill 的业务契约 |
| `15-publish-review-spec.md` | 发布审核检查读者可见文本；本 Spec 提供设定一致性和泄漏检查依据 |
