# 09 Chapter Review Spec

状态：Review Candidate

日期：2026-07-09

上游依赖：

- `01-novel-project-spec.md`：所有审查数据必须绑定 `novelId`。
- `02-novel-cockpit-spec.md`：Cockpit 只展示审查摘要、风险和入口。
- `04-arc-swimlane-diagram-spec.md`：结构审查可以引用篇章事件节点。
- `05-clue-foreshadowing-spec.md`：线索系统提供线索、伏笔、误导和回收检查结果。
- `06-character-system-spec.md`：人物系统提供人物一致性、关系、知情和弧光检查结果。
- `07-worldbuilding-system-spec.md`：世界观系统提供规则、时间、空间和设定揭示检查结果。
- `08-chapter-writing-spec.md`：写作系统提供固定正文版本、任务书、上下文包和状态卡，并执行修改任务。

相关底座文档：`2026-07-08-novel-agent-product-foundation-design.md`

## 1. 功能定位

Chapter Review System 是针对固定正文版本执行质量审查、整合多领域证据、生成修改任务并验证修复结果的质量闭环系统。

它不是一个给出“好 / 不好”评价的聊天助手，也不是一个自动重写器。它负责：

1. 对固定正文版本执行可复现审查。
2. 把规则检查、人物、线索、世界观、结构、节奏、对白和文风检查统一编排。
3. 为每个有效问题提供正文证据、预期依据、影响和置信度。
4. 区分确定性错误、语义风险、风格偏好和审查分歧。
5. 把用户接受的问题转成边界明确的 `RevisionTask`。
6. 修改后只复审相关问题，同时检查是否引入回归。
7. 支持单章、章节区间、篇章和跨章一致性审查。
8. 将可复用教训沉淀为小说项目级审查规则，而不是污染全局规则。

核心闭环：

```text
固定正文版本
  → 创建审查请求
  → 多通道审查
  → 证据校验与问题合并
  → 用户决策
  → 修改任务
  → 新正文版本
  → 快速复审与回归检查
```

一句话定义：

> Chapter Review System 是小说正文的证据化质量控制层，负责发现、解释、分派和验证问题，但不越权替作者决定如何改写。

## 2. 用户角色

### 2.1 独立作者

审查单章，查看问题证据，选择接受、忽略或转为修改任务。

### 2.2 长篇连载作者

检查跨章连续性、人物状态、信息释放、伏笔推进和术语一致性。

### 2.3 精修型作者

按维度审查语言、节奏、对白、叙事视角和场景功能，并执行多轮复审。

### 2.4 编辑 / 审校角色

配置审查规则、阻断标准、评分权重和目标平台之外的编辑要求。

### 2.5 Agent 任务发起者

发起“审查本章”“检查这次改稿是否解决问题”“检查整个篇章”等任务。

## 3. 入口位置

### 3.1 主入口

```text
Novel Cockpit
  → 章节卡 / 审查风险
  → Chapter Review
```

### 3.2 上下文入口

用户可以从以下位置进入：

- 章节写作工作台的“送审”动作。
- 章节列表的批量审查。
- 篇章泳道图的结构问题。
- 人物详情中的一致性风险。
- 线索卡中的未回收或不公平问题。
- 世界观工作台中的设定冲突。
- Agent Orchestration 面板。
- RevisionTask 的“复审”动作。
- Cockpit 的 Review Summary。

### 3.3 快捷入口

在当前小说内支持：

```text
/review chapter
/review changes
/review arc
/check continuity
```

系统必须要求明确 `novelId`、审查范围和固定正文版本。当前只有可变工作稿时，应先创建正文快照版本。

## 4. 核心用户目标

### 4.1 审查单章

知道当前章节在逻辑、人物、线索、世界观、结构、节奏、对白和文风上有哪些可证实问题。

### 4.2 理解问题依据

看到问题对应的原文、Canon / 任务书依据、影响范围和审查置信度。

### 4.3 控制审查标准

为不同小说、题材、篇章和审查轮次选择合适的 `ReviewProfile`。

### 4.4 避免误报

区分故意留白、角色误解、不可靠叙述、题材风格和真正错误。

### 4.5 形成修改任务

把被接受的问题转换为最小改动、可执行、可验证的修改任务。

### 4.6 验证修复

比较修改前后版本，确认原问题已解决且没有引入新的连续性问题。

### 4.7 检查跨章连续性

在早期章节被修改后，定位后续章节、状态卡、人物、线索和设定的受影响范围。

### 4.8 沉淀审查经验

把用户明确认可的重复问题模式转成该小说的审查规则或风格记忆。

## 5. MVP 范围

### 5.1 必须包含

- 固定正文版本送审。
- 单章完整审查。
- 快速复审。
- 章节区间和篇章级审查。
- 跨章一致性检查。
- 可配置审查档案。
- 多维审查通道。
- 确定性规则检查与语义模型检查分离。
- 人物、线索、世界观领域检查器接入。
- 问题证据定位。
- 问题去重、合并和分歧标记。
- 严重度、置信度和影响范围。
- 维度评分及解释。
- 阻断门禁。
- 用户接受、忽略、误报、延期和解决决策。
- 修改建议。
- `RevisionTask` 创建与状态管理。
- 修改前后版本对比。
- 原问题复审和回归检查。
- 审查历史。
- 项目级审查教训候选。
- 报告导出。

### 5.2 MVP 可以简化

- 多通道审查可以顺序执行，不要求所有环境都并行。
- 全书审查通过按篇章 / 章节批次执行，不把全文一次塞进模型。
- 评分只用于导航和趋势，不作为唯一通过标准。
- 证据范围以段落、字符偏移或稳定文本锚点表达。
- 修改建议可以只给方向，不必须生成完整替换正文。
- 审查档案使用预置模板加项目覆盖，不提供复杂规则编程语言。
- 审查教训由用户确认后保存，不自动修改 Skill 文件。

## 6. 非 MVP 范围

- 未经用户确认自动重写整章。
- 自动接受所有审查问题。
- 真实平台敏感词、格式和合规发布审核。
- 法律、版权和事实核查服务。
- 多人编辑审批流。
- 训练专属审查模型。
- 实时逐字打断作者写作。
- 把一个通用“AI 感分数”作为作品质量结论。
- 无证据的文学价值排名。
- 自动修改全局 Skill 或其他小说的审查规则。
- 同时审查无限数量章节。

## 7. 核心流程

### 7.1 创建单章审查

```text
用户选择 ChapterDraftVersion
  → 系统确认版本不可变
  → 加载 ChapterBrief、ContextBundle 和 ChapterStateCard
  → 选择 ReviewProfile
  → 生成 ReviewRequest
  → 执行写前校验
  → 创建 ReviewRun
```

写前校验包括：

- 正文版本存在。
- `novelId` 一致。
- 状态卡存在且没有过期。
- 任务书版本可追溯。
- Canon 引用可用。
- 审查范围与成本可估算。

状态卡缺失或过期时：

- 文风、对白和局部结构审查仍可运行。
- 人物状态、线索、世界观和跨章连续性结果必须标记为不完整。
- 完整审查门禁不得通过。

### 7.2 执行多通道审查

```text
ReviewRun
  ├→ Deterministic Rule Pass
  ├→ Narrative & Structure Pass
  ├→ Character Pass
  ├→ Clue & Information Pass
  ├→ World & Timeline Pass
  ├→ Dialogue & Voice Pass
  ├→ Pacing Pass
  └→ Prose & Style Pass
```

通道可以并行执行，但每个通道必须：

- 使用相同的正文版本。
- 记录使用的上下文包和规则版本。
- 独立生成 `ReviewFinding` 候选。
- 不读取其他通道的结论，避免锚定。

### 7.3 确定性规则检查

适用于：

- 字数 / 字符数范围。
- 禁用术语。
- 人物名和物件名一致性。
- 标点和格式规则。
- 章节任务书必选节点覆盖。
- 状态卡版本匹配。
- 已知结构化关系或时间顺序冲突。
- 项目明确配置的可计算阈值。

确定性检查必须记录规则 ID、输入值和预期值。

### 7.4 语义审查

适用于：

- 人物动机是否充分。
- 对白是否自然且符合人物声音。
- 叙事视角是否稳定。
- 场景是否具有功能。
- 节奏是否拖沓或过急。
- 情绪转折是否有铺垫。
- 伏笔是否公平但不过早。
- 设定解释是否自然。
- 文风是否偏离项目规范。
- 是否出现机械、套话、过度总结等模式化表达。

语义问题必须提供具体原文证据和推理依据。只有主观偏好而没有项目规则支撑时，严重度不得高于 `suggestion`。

### 7.5 合并审查结果

```text
各 ReviewPass 完成
  → 校验证据锚点
  → 合并重复问题
  → 建立支持 / 反对来源
  → 标记审查器分歧
  → 计算维度摘要
  → 执行门禁规则
  → 生成 ChapterReviewReport
```

合并规则：

- 相同正文范围、相同根因的问题合并。
- 一个表层问题和一个根因问题建立父子关系，不强行合并。
- 不同审查器结论冲突时保留双方，不由汇总模型秘密裁决。
- 无法定位正文或结构化依据的问题降级为观察项。

### 7.6 用户处理问题

```text
用户打开 ReviewFinding
  → 查看正文证据、依据和影响
  → 选择接受 / 忽略 / 误报 / 延期 / 已有意为之
  → 可编辑严重度和说明
  → 接受的问题可转成 RevisionTask
```

用户将问题标记为“有意为之”时，可以添加叙事意图。后续复审必须携带该意图，避免重复误报。

### 7.7 生成修改任务

```text
用户选择一个或多个 accepted Finding
  → 系统分析依赖和重叠范围
  → 生成 RevisionTask 草案
  → 用户确认修改目标、保留项和验收条件
  → 发送到 Chapter Writing System
```

一个修改任务必须：

- 指向固定源版本。
- 指向一个或多个问题。
- 限定正文范围或说明跨段原因。
- 明确保留项和禁止改动项。
- 定义完成条件。
- 标明可能影响的人物、线索、世界观和后续章节。

### 7.8 快速复审

```text
RevisionTask 产生新正文版本
  → 创建 ReReviewRequest
  → 校验原问题锚点映射
  → 只复审原问题及直接依赖
  → 执行回归保护检查
  → 对比 before / after
  → 标记 resolved / partiallyResolved / unresolved / regressed
```

快速复审不重新执行全部昂贵通道，但必须检查：

- 原问题是否解决。
- 修改范围是否越界。
- 保留项是否仍存在。
- 是否引入新的阻断级冲突。

### 7.9 完整复审

以下情况必须推荐完整复审：

- 改写超过项目配置的正文比例。
- POV、时间线、人物动机或章节结局改变。
- 线索种下 / 回收结果改变。
- 世界规则或人物 Canon 改变。
- 多个 RevisionTask 被一次合并。
- 快速复审发现回归。

### 7.10 篇章级审查

```text
用户选择 Arc 和章节范围
  → 冻结参与审查的章节版本清单
  → 按章节执行基础检查
  → 按维度聚合跨章问题
  → 检查节奏、人物出场、线索推进、世界变化和信息释放
  → 生成 ArcReviewReport
```

篇章级报告必须定位到具体章节和证据，不能只给宏观评价。

### 7.11 跨章一致性检查

触发条件至少包括：

- 人物名、称谓或身份修改。
- 关键物件、地点或术语修改。
- 时间线、死因、伤势或资源状态修改。
- 人物知情状态修改。
- 线索提供者、触发者、接收者或回收点修改。
- 世界规则、例外或揭示时间修改。
- 早期章节关键事件修改。

流程：

```text
确定变更事实与旧值
  → Context Engine 查找下游引用
  → 建立 ImpactGraph
  → 对受影响章节执行定向检查
  → 生成 CrossChapterReviewReport
  → 用户决定批量建任务或逐章处理
  → 修复后重新检索旧值和冲突
```

纯标点、排版或不改变语义的局部润色不触发跨章一致性检查。

### 7.12 审查教训沉淀

```text
用户纠正审查结论或确认新问题模式
  → Agent 生成 ReviewLessonCandidate
  → 判断是单次例外、小说规则还是可复用 Skill 建议
  → 用户确认
  → 写入该小说 Review Memory / Style Memory
```

默认只写入当前小说。升级为全局 Skill 必须进入 `14-skill-system-spec.md` 定义的显式发布流程。

## 8. 审查维度

### 8.1 核心维度

| 维度 | 主要问题 |
|---|---|
| `briefCoverage` | 是否完成章节任务书和泳道节点 |
| `narrativeLogic` | 因果、行动和结果是否成立 |
| `continuity` | 与前后章节、状态卡和时间线是否连续 |
| `character` | 动机、行为、能力、关系和弧光是否一致 |
| `knowledgeAndPov` | 人物知情、读者知情和叙事视角是否越界 |
| `clueAndForeshadowing` | 线索归因、推进、误导、公平性和回收 |
| `worldbuilding` | 规则、地点、制度、力量和揭示是否一致 |
| `dialogueAndVoice` | 对白自然度、人物声音和信息功能 |
| `supportingCharacters` | 配角是否工具化、失踪或缺乏主动性 |
| `pacingAndStructure` | 场景功能、松紧、转折和结尾 |
| `proseAndStyle` | 项目文风、重复、套话、解释过度和可读性 |
| `chapterHook` | 结尾方向是否符合任务书 |

### 8.2 维度规则

- 核心维度是产品提供的检查槽位，不等于固定题材规则。
- 每个 `ReviewProfile` 可以启用、关闭或调整权重。
- 题材 Skill 可以为维度增加检查项。
- 维度不允许删除数据安全、Canon 冲突和用户文本保护检查。

### 8.3 模式化表达 / “AI 感”边界

系统不输出无法解释的“AI 概率”。它只检查可观察的表达模式，例如：

- 过度总结意义。
- 套话和高频模板。
- 形容词或修辞密度异常。
- 心理描写过于整齐。
- 对话角色声音趋同。
- 每段结构高度同质。
- 解释已经通过行动呈现的内容。
- 与作者样例明显偏离。

每个问题必须引用具体模式、项目规则或作者样例。不得把文学风格差异伪装成机器检测结论。

### 8.4 题材审查扩展

悬疑、恐怖、言情、权谋、科幻等题材可以添加：

- 信息释放节奏。
- 线索公平性。
- 恐怖场景感官维度。
- 情感关系推进。
- 权力博弈逻辑。
- 科技 / 力量体系边界。

具体阈值、章法和表达方式由项目启用的 Skill / ReviewProfile 决定，不写死在通用系统中。

## 9. 核心数据对象与字段

本节“必填”表示字段必须存在；数组可以为空，除非校验规则另有要求。

### 9.1 ReviewRequest

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `reviewRequestId` | string | 是 | 请求 ID |
| `novelId` | string | 是 | 所属小说 |
| `scopeType` | enum | 是 | `chapter`、`chapterRange`、`arc`、`volume`、`novel`、`reReview`、`crossChapter` |
| `scopeId` | string | 否 | 篇章、分卷或任务 ID |
| `chapterVersionRefs` | object[] | 是 | 固定章节与正文版本列表 |
| `chapterBriefRefs` | object[] | 是 | 任务书版本 |
| `stateCardRefs` | object[] | 是 | 状态卡及状态 |
| `contextBundleRefs` | object[] | 是 | 写作上下文包 |
| `reviewProfileVersionId` | string | 是 | 审查档案版本 |
| `requestedDimensionIds` | string[] | 是 | 请求维度 |
| `sourceRevisionTaskIds` | string[] | 是 | 复审来源任务 |
| `userIntent` | string | 否 | 用户特别关注点 |
| `costPreference` | enum | 是 | `economy`、`balanced`、`quality` |
| `createdBy` | enum | 是 | `user`、`agent`、`workflow` |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.2 ReviewProfile

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `reviewProfileVersionId` | string | 是 | 不可变档案版本 ID |
| `reviewProfileId` | string | 是 | 稳定档案 ID |
| `novelId` | string | 是 | 所属小说 |
| `name` | string | 是 | 名称 |
| `version` | number | 是 | 版本号 |
| `parentVersionId` | string | 否 | 上一版本 |
| `enabledDimensions` | object[] | 是 | 维度、权重和阈值 |
| `deterministicRuleIds` | string[] | 是 | 确定性规则 |
| `semanticRuleIds` | string[] | 是 | 语义规则 |
| `genreSkillIds` | string[] | 是 | 题材审查 Skill |
| `blockingRuleIds` | string[] | 是 | 阻断规则 |
| `ignoredIntentPatterns` | object[] | 是 | 已确认的叙事意图 |
| `minimumEvidenceLevel` | enum | 是 | `text`、`textAndCanon`、`multiSource` |
| `status` | enum | 是 | `draft`、`active`、`archived` |
| `createdBy` | enum | 是 | `user`、`agent`、`template` |
| `createdAt` | ISO datetime | 是 | 创建时间 |

审查档案更新必须创建新版本。已有审查运行继续引用旧版本。

### 9.3 ReviewRun

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `reviewRunId` | string | 是 | 运行 ID |
| `novelId` | string | 是 | 所属小说 |
| `reviewRequestId` | string | 是 | 请求 ID |
| `status` | enum | 是 | 运行状态 |
| `passIds` | string[] | 是 | 审查通道 |
| `modelRoutingDecisions` | object[] | 是 | 模型选择记录 |
| `contextSnapshotRefs` | object[] | 是 | 各通道实际上下文 |
| `progress` | number | 是 | 0 到 100 |
| `costEstimate` | object | 否 | 预估使用量 |
| `actualUsage` | object | 否 | 实际使用量 |
| `reportId` | string | 否 | 最终报告 |
| `warnings` | object[] | 是 | 缺失上下文、降级和分歧 |
| `error` | object | 否 | 失败信息 |
| `startedAt` | ISO datetime | 否 | 开始时间 |
| `endedAt` | ISO datetime | 否 | 结束时间 |

### 9.4 ReviewRunStatus

| 值 | 说明 |
|---|---|
| `draft` | 参数未确认 |
| `queued` | 等待执行 |
| `running` | 正在审查 |
| `partiallyCompleted` | 部分通道完成 |
| `waitingForUser` | 需要用户处理冲突或成本 |
| `completed` | 报告已生成 |
| `cancelled` | 用户取消 |
| `failed` | 无法形成有效报告 |
| `superseded` | 被新运行替代 |

### 9.5 ReviewPass

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `reviewPassId` | string | 是 | 通道 ID |
| `novelId` | string | 是 | 所属小说 |
| `reviewRunId` | string | 是 | 所属运行 |
| `dimensionIds` | string[] | 是 | 负责维度 |
| `reviewerType` | enum | 是 | `deterministic`、`semanticModel`、`domainChecker`、`human` |
| `modelId` | string | 否 | 使用模型 |
| `skillIds` | string[] | 是 | 使用 Skill |
| `ruleVersionRefs` | object[] | 是 | 使用规则 |
| `contextSnapshotRef` | string | 是 | 冻结上下文 |
| `status` | enum | 是 | `queued`、`running`、`completed`、`failed`、`cancelled` |
| `findingCandidateIds` | string[] | 是 | 候选问题 |
| `summary` | string | 否 | 通道摘要 |
| `confidence` | number | 否 | 通道整体置信度，0 到 1 |
| `startedAt` | ISO datetime | 否 | 开始时间 |
| `endedAt` | ISO datetime | 否 | 结束时间 |

### 9.6 ReviewFinding

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `findingId` | string | 是 | 问题 ID |
| `novelId` | string | 是 | 所属小说 |
| `reviewRunId` | string | 是 | 来源运行 |
| `dimensionId` | string | 是 | 审查维度 |
| `type` | string | 是 | 具体问题类型 |
| `title` | string | 是 | 短标题 |
| `description` | string | 是 | 问题说明 |
| `severity` | enum | 是 | 严重度 |
| `confidence` | number | 是 | 0 到 1 |
| `certaintyType` | enum | 是 | `deterministic`、`strongInference`、`interpretive`、`preference` |
| `chapterId` | string | 是 | 目标章节 |
| `draftVersionId` | string | 是 | 目标正文版本 |
| `evidenceRefs` | `ReviewEvidenceRef[]` | 是 | 正文与结构化证据 |
| `expectedBasisRefs` | object[] | 是 | Canon、任务书、规则或样例依据 |
| `impact` | string | 是 | 对读者、剧情或连续性的影响 |
| `affectedObjectIds` | string[] | 是 | 受影响对象 |
| `parentFindingId` | string | 否 | 根因 / 表层问题关系 |
| `supportingPassIds` | string[] | 是 | 支持该结论的通道 |
| `dissentingPassIds` | string[] | 是 | 不同意该结论的通道 |
| `suggestionIds` | string[] | 是 | 修改建议 |
| `decisionStatus` | enum | 是 | `open`、`needsIntent`、`accepted`、`ignored`、`falsePositive`、`deferred`、`intentional`、`taskCreated` |
| `resolutionStatus` | enum | 是 | `unresolved`、`inRevision`、`partiallyResolved`、`resolved`、`regressed`、`blockedByUpstream` |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.7 ReviewSeverity

| 值 | 说明 |
|---|---|
| `suggestion` | 可选优化，不影响通过 |
| `warning` | 存在明显风险，建议处理 |
| `danger` | 影响逻辑、人物、线索或阅读体验 |
| `blocking` | 违反明确 Canon、门禁规则或造成严重连续性错误 |

约束：

- `blocking` 必须引用阻断规则，并至少有正文证据与规则 / Canon 依据。
- `preference` 类型问题严重度不得高于 `suggestion`。
- 只有解释分歧不能成为 `blocking`。

### 9.8 ReviewEvidenceRef

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `evidenceRefId` | string | 是 | 证据 ID |
| `novelId` | string | 是 | 所属小说 |
| `sourceType` | enum | 是 | `chapterText`、`stateCard`、`brief`、`eventNode`、`character`、`clue`、`world`、`memory`、`reviewRule`、`userIntent` |
| `sourceId` | string | 是 | 来源对象 |
| `sourceVersion` | string | 否 | 来源版本 |
| `chapterId` | string | 否 | 章节 |
| `draftVersionId` | string | 否 | 正文版本 |
| `anchor` | object | 否 | 字符范围、段落 ID 或稳定文本锚点 |
| `excerpt` | string | 是 | 最短充分引用 |
| `relevance` | string | 是 | 为什么支持或反对该问题 |
| `authority` | enum | 是 | `lockedCanon`、`confirmedCanon`、`publishedEvidence`、`approvedPlan`、`draft`、`reviewRule`、`userIntent` |
| `valid` | boolean | 是 | 当前是否仍可定位 |

### 9.9 RevisionSuggestion

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `suggestionId` | string | 是 | 建议 ID |
| `novelId` | string | 是 | 所属小说 |
| `findingId` | string | 是 | 对应问题 |
| `strategy` | enum | 是 | `delete`、`replace`、`expand`、`condense`、`reorder`、`foreshadow`、`clarify`、`deferReveal`、`adjustDialogue`、`adjustPov`、`syncCanon` |
| `direction` | string | 是 | 修改方向 |
| `exampleText` | string | 否 | 可选示例，不默认应用 |
| `preserveRequirements` | string[] | 是 | 必须保留 |
| `risk` | string | 否 | 可能副作用 |
| `affectedObjectIds` | string[] | 是 | 影响对象 |
| `generatedByModelId` | string | 否 | 生成模型 |

### 9.10 ReviewDecision

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `decisionId` | string | 是 | 决策 ID |
| `novelId` | string | 是 | 所属小说 |
| `findingId` | string | 是 | 问题 ID |
| `decision` | enum | 是 | `accepted`、`ignored`、`falsePositive`、`deferred`、`intentional` |
| `reason` | string | 否 | 决策理由 |
| `narrativeIntent` | string | 否 | 有意为之的叙事意图 |
| `adjustedSeverity` | enum | 否 | 用户调整后的严重度 |
| `createLessonCandidate` | boolean | 是 | 是否生成教训候选 |
| `decidedBy` | enum | 是 | `user`、`authorizedEditor` |
| `createdAt` | ISO datetime | 是 | 决策时间 |

### 9.11 ChapterReviewReport

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `reportId` | string | 是 | 报告 ID |
| `novelId` | string | 是 | 所属小说 |
| `reviewRunId` | string | 是 | 来源运行 |
| `scopeType` | enum | 是 | 审查范围 |
| `chapterVersionRefs` | object[] | 是 | 固定正文版本 |
| `dimensionSummaries` | object[] | 是 | 各维度分数、覆盖和结论 |
| `findingIds` | string[] | 是 | 问题列表 |
| `gateResult` | enum | 是 | `passed`、`passedWithWarnings`、`revisionRequired`、`blocked`、`incomplete` |
| `blockingFindingIds` | string[] | 是 | 阻断问题 |
| `reviewerDisagreements` | object[] | 是 | 分歧 |
| `coverage` | object | 是 | 已完成与缺失通道 |
| `overallSummary` | string | 是 | 总结 |
| `recommendedNextActions` | string[] | 是 | 下一步 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

`ArcReviewReport`、`CrossChapterReviewReport` 和全书审查报告使用同一报告模型，通过 `scopeType`、`chapterVersionRefs` 和可选 `ImpactGraph` 表达范围，不另建互不兼容的数据结构。

### 9.12 DimensionSummary

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `dimensionId` | string | 是 | 维度 ID |
| `score` | number | 否 | 0 到 100 |
| `scoreExplanation` | string | 是 | 分数依据 |
| `coverage` | number | 是 | 0 到 1 |
| `findingCounts` | object | 是 | 按严重度统计 |
| `confidence` | number | 是 | 0 到 1 |
| `status` | enum | 是 | `passed`、`warning`、`failed`、`incomplete` |

分数可为空。上下文不足或该维度不适合量化时，不得伪造分数。

### 9.13 RevisionTask

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `revisionTaskId` | string | 是 | 修改任务 ID |
| `novelId` | string | 是 | 所属小说 |
| `chapterId` | string | 是 | 目标章节 |
| `sourceDraftVersionId` | string | 是 | 源正文版本 |
| `findingIds` | string[] | 是 | 对应问题 |
| `title` | string | 是 | 任务标题 |
| `goal` | string | 是 | 修改目标 |
| `targetAnchors` | object[] | 是 | 目标范围 |
| `preserveRequirements` | string[] | 是 | 必须保留 |
| `forbiddenChanges` | string[] | 是 | 禁止改动 |
| `suggestionIds` | string[] | 是 | 可选建议 |
| `acceptanceCriteria` | string[] | 是 | 验收条件 |
| `affectedObjectIds` | string[] | 是 | 影响对象 |
| `dependencyTaskIds` | string[] | 是 | 依赖任务 |
| `priority` | enum | 是 | `low`、`normal`、`high`、`urgent` |
| `status` | enum | 是 | 修改任务状态 |
| `assignedAgentTaskId` | string | 否 | Agent 编排任务 |
| `resultDraftVersionId` | string | 否 | 修改结果版本 |
| `createdBy` | enum | 是 | `user`、`agent` |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.14 RevisionTaskStatus

| 值 | 说明 |
|---|---|
| `draft` | 等待用户确认 |
| `ready` | 可以执行 |
| `queued` | 已进入任务队列 |
| `inProgress` | 正在修改 |
| `waitingForUser` | 需要用户选择 |
| `completed` | 已生成修改版本 |
| `reReviewing` | 正在复审 |
| `verified` | 复审通过 |
| `partiallyVerified` | 部分问题解决 |
| `failed` | 执行失败 |
| `cancelled` | 已取消 |
| `superseded` | 被新任务替代 |

### 9.15 ReReviewResult

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `reReviewResultId` | string | 是 | 复审结果 ID |
| `novelId` | string | 是 | 所属小说 |
| `revisionTaskId` | string | 是 | 修改任务 |
| `beforeDraftVersionId` | string | 是 | 修改前版本 |
| `afterDraftVersionId` | string | 是 | 修改后版本 |
| `findingResults` | object[] | 是 | 各问题结果 |
| `scopeChangeRatio` | number | 是 | 修改比例 |
| `outOfScopeChanges` | object[] | 是 | 越界修改 |
| `preservationFailures` | object[] | 是 | 保留项失败 |
| `regressionFindingIds` | string[] | 是 | 新增回归 |
| `overallStatus` | enum | 是 | `resolved`、`partiallyResolved`、`unresolved`、`regressed`、`incomplete` |
| `recommendedNextAction` | string | 是 | 下一步 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.16 ImpactGraph

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `impactGraphId` | string | 是 | 影响图 ID |
| `novelId` | string | 是 | 所属小说 |
| `sourceChangeRefs` | object[] | 是 | 起点变化 |
| `nodes` | object[] | 是 | 章节、状态卡、人物、线索、世界观和记忆 |
| `edges` | object[] | 是 | 引用、因果、状态承接和术语匹配 |
| `maxDepth` | number | 是 | 分析深度 |
| `unresolvedMappings` | object[] | 是 | 无法判断的影响 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.17 ReviewLessonCandidate

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `lessonCandidateId` | string | 是 | 候选 ID |
| `novelId` | string | 是 | 所属小说 |
| `sourceFindingIds` | string[] | 是 | 来源问题 |
| `triggerDecisionIds` | string[] | 是 | 用户纠正或确认 |
| `pattern` | string | 是 | 可重复问题模式 |
| `negativeExampleRefs` | object[] | 是 | 反例 |
| `preferredApproach` | string | 是 | 推荐方式 |
| `reviewCheck` | string | 是 | 后续如何检查 |
| `targetScope` | enum | 是 | `novelReviewMemory`、`styleMemory`、`projectRule`、`skillProposal` |
| `status` | enum | 是 | `draft`、`confirmed`、`rejected`、`published` |
| `confirmedByUser` | boolean | 是 | 是否确认 |

## 10. 状态机与门禁

### 10.1 审查运行状态

```text
draft → queued → running → completed
                    │
                    ├→ partiallyCompleted → completed
                    ├→ waitingForUser → running
                    ├→ cancelled
                    └→ failed

completed → superseded
```

### 10.2 问题决策状态

```text
open → needsIntent → accepted → taskCreated
  │          │
  ├──────────┴→ ignored
  ├───────────→ falsePositive
  ├───────────→ deferred
  └───────────→ intentional
```

Agent 不得代替用户将问题标记为 `falsePositive`、`intentional` 或 `resolved`。

### 10.3 问题修复状态

```text
unresolved → inRevision → partiallyResolved → resolved
      │                  └→ regressed
      └──────────────────→ blockedByUpstream
```

### 10.4 报告门禁

| 结果 | 条件 |
|---|---|
| `passed` | 所有必需通道完成，无未解决 `danger` / `blocking`，且满足档案阈值 |
| `passedWithWarnings` | 无未解决 `danger` / `blocking`，但存在 warning 或可选建议 |
| `revisionRequired` | 存在未处理的 danger，或关键维度未达阈值 |
| `blocked` | 存在未处理的 blocking 问题 |
| `incomplete` | 必需上下文或审查通道缺失 |

总分不能单独使报告通过，也不能在没有阻断证据时单独使报告 `blocked`。

### 10.5 章节状态联动

- 发起完整审查时，目标 Chapter 进入 `reviewing`。
- 报告为 `revisionRequired` 或 `blocked` 时，Chapter 进入 `revision`。
- 报告为 `passed` / `passedWithWarnings` 时，可以写入 `approvedVersionId`。
- 章节审查通过不等于发布审核通过。
- 工作稿变化不改变已审查版本结论。

## 11. Agent 与审查器行为

### 11.1 可以自动执行

- 校验送审材料。
- 选择符合 ReviewProfile 的审查通道。
- 调用领域检查器。
- 执行确定性规则。
- 生成语义问题候选。
- 校验证据位置。
- 合并重复问题并建立根因关系。
- 标记审查分歧。
- 生成报告摘要。
- 为 accepted 问题生成 RevisionTask 草案。
- 执行快速复审和回归检查。
- 生成 ReviewLessonCandidate。

### 11.2 必须由用户确认

- 接受、忽略、延期或判定误报。
- 将问题标记为有意为之。
- 修改 ReviewProfile 的阻断规则。
- 创建可执行 RevisionTask。
- 应用任何正文修改。
- 将版本标记为审查通过。
- 把教训写入项目记忆或发布为 Skill 规则。
- 使用高成本篇章 / 全书审查。

### 11.3 禁止自动执行

- 修改正在审查的正文版本。
- 用总分替代问题证据。
- 为提高通过率隐藏审查器分歧。
- 把解释性偏好升级为阻断问题。
- 编造原文引用或 Canon 依据。
- 把 RAG 检索片段当成最高权威事实。
- 自动把项目教训写进全局 Skill。
- 复审时只检查新文本、不验证原问题。
- 自动批准已发布版本的修改。

### 11.4 审查独立性

- 语义审查默认优先使用与正文生成不同的模型或独立上下文。
- 各 ReviewPass 不读取其他 Pass 的结论。
- 汇总器只合并和解释，不得抹去原始结论。
- 原始 ReviewPass 输出必须保留，以便审计。

### 11.5 证据最低标准

`warning` 以上问题必须至少包含：

```text
正文版本
原文锚点
最短充分引用
问题规则或预期依据
影响说明
置信度
```

`danger` / `blocking` 还必须包含：

- 结构化 Canon、任务书或明确门禁规则。
- 可执行的修复方向。
- 受影响对象或章节。

## 12. Skill 调用

| Skill | 触发场景 |
|---|---|
| 单章综合审查 | 执行完整单章审查 |
| 快速复审 | 验证指定问题是否解决 |
| 跨章一致性检查 | 关键事实或术语变化后检查下游 |
| 任务书覆盖检查 | 检查章节是否完成计划 |
| 人物一致性审查 | 调用 Character System 检查器 |
| 人物知情检查 | 检查知识越界和 POV 泄漏 |
| 线索公平性审查 | 检查提供、触发、接收、误导和回收 |
| 世界观一致性审查 | 检查规则、时间、空间和能力边界 |
| 对白与人物声音审查 | 检查对话自然度和区分度 |
| 配角存在感审查 | 检查工具化、缺席和主动性 |
| 节奏与结构审查 | 检查场景功能、松紧和转折 |
| 文风偏离审查 | 对比 StyleRuleProfile 与作者样例 |
| 模式化表达检查 | 检查可解释的重复表达模式 |
| 修改任务生成 | 从问题创建最小修改任务 |
| 回归检查 | 检查修改是否引入新问题 |
| 篇章综合审查 | 聚合跨章结构、人物、线索和节奏 |

Skill 输出必须包含：

- `novelId`
- 审查范围与固定版本
- ReviewProfile 版本
- 规则与上下文版本
- 证据引用
- 严重度与置信度
- 使用模型
- 是否需要用户决策

## 13. 模型选择规则

| 场景 | 推荐模型特点 |
|---|---|
| 确定性规则检查 | 优先使用规则引擎，不调用大模型 |
| 叙事逻辑审查 | 深度推理、因果分析强 |
| 人物 / 线索 / 世界审查 | 结构化数据理解和引用能力强 |
| 对白与文风审查 | 语言敏感、风格辨识强 |
| 问题证据定位 | 引用准确、结构化输出稳定 |
| 问题合并 | 分类、聚类和冲突保留能力强 |
| 修改建议 | 最小修改、约束遵循强 |
| 快速复审 | 对比准确、低延迟 |
| 篇章 / 全书审查 | 长上下文、分批汇总和深度推理强 |

模型路由必须遵守：

1. 审查模型默认与写作模型解耦。
2. 不同维度可以使用不同模型。
3. `blocking` 问题可以要求第二审查器复核。
4. 低成本模型可用于规则筛查，不能在证据不足时直接升级严重度。
5. 降级模型必须记录能力缺失，并降低覆盖或置信度。
6. 用户可以手动切换模型或要求双模型复核。
7. 高成本篇章 / 全书审查执行前必须展示范围、批次和成本估算。

## 14. 长期记忆与 RAG

### 14.1 可读取

- Core Canon Memory。
- Character Memory。
- World Memory。
- Clue Memory。
- Style Memory。
- Review Memory。
- 用户已确认的叙事意图。
- 历史 ReviewReport 和 RevisionTask。

### 14.2 可写入

经用户确认后可以写入：

- Review Memory：该小说重复出现的问题模式和审查偏好。
- Style Memory：作者明确接受 / 拒绝的表达方式和样例。
- Project Memory：默认审查档案、成本偏好和门禁偏好。
- Intent Memory：有意留白、不可靠叙述、特殊称谓等审查豁免意图。

### 14.3 不得直接写入

- 未确认 ReviewFinding。
- 单个模型的主观评价。
- 用户忽略但未说明理由的问题。
- 审查器分歧中的任一方。
- 临时 RAG 摘要。
- 未确认 ReviewLessonCandidate。
- 其他小说的审查教训。

### 14.4 与 RAG / Context Engine 的关系

Context Engine 为审查提供：

- 固定正文版本。
- 任务书与泳道节点。
- 状态卡和因果前置章节。
- 人物、线索、世界观结构化事实。
- 项目规则和作者样例。
- 历史问题与用户意图。

权威顺序：

```text
lockedCanon
  → confirmedCanon
  → publishedEvidence
  → approvedPlan
  → userIntent / reviewRule
  → draft
  → reference
```

RAG 负责查找相关证据，不负责决定问题成立。检索不到依据时，审查器必须降低严重度或标记上下文不足。

### 14.5 审查教训隔离

- Review Memory 必须绑定 `novelId`。
- 小说 A 的偏好不能自动影响小说 B。
- 项目规则升级为可复用 Skill 需要显式编辑、测试和发布。
- 用户纠正一次问题不自动成为永久规则；系统应先生成候选。

## 15. 可视化与交互要求

### 15.1 审查工作台

桌面端推荐四区结构：

```text
左侧：维度、严重度和问题列表
中央：固定正文与证据高亮
右侧：问题详情、依据、建议和用户决策
底部 / 抽屉：审查通道、版本、修改任务和复审
```

### 15.2 报告摘要

显示：

- 审查范围和正文版本。
- ReviewProfile。
- 门禁结果。
- 各维度覆盖与分数。
- `blocking` / `danger` / `warning` / `suggestion` 数量。
- 审查器分歧。
- 缺失上下文。
- 推荐下一步。

### 15.3 正文热区

正文中按问题严重度高亮：

- 点击问题定位原文。
- 点击原文查看所有关联问题。
- 同一范围多问题可以堆叠展示。
- 高亮必须支持关闭，保证纯阅读。
- 失效锚点必须显示“无法定位”，不能悄悄移动到相似句子。

### 15.4 问题详情

必须显示：

- 问题类型与维度。
- 严重度、置信度和确定性类型。
- 原文证据。
- 预期依据。
- 影响。
- 支持与反对的审查通道。
- 修改建议。
- 受影响对象。
- 用户决策。

### 15.5 维度矩阵

行表示章节，列表示审查维度，单元格显示：

- 状态。
- 分数或“不适用”。
- 问题数。
- 覆盖率。
- 与上次审查的变化。

适用于章节区间和篇章审查。

### 15.6 修改任务面板

显示：

- 任务目标。
- 来源问题。
- 目标范围。
- 保留项。
- 禁止修改项。
- 依赖任务。
- 执行状态。
- 修改前后版本。
- 复审状态。

### 15.7 复审对比

三栏或差异视图展示：

```text
修改前原文
  ↔ 修改后原文
  ↔ 原问题与复审结论
```

并明确标记：

- 已解决。
- 部分解决。
- 未解决。
- 修改越界。
- 新增回归。

### 15.8 跨章影响图

节点包括：

- 变化事实。
- 章节。
- 状态卡。
- 人物。
- 线索。
- 世界观。
- 长期记忆。

边表示：

- 引用。
- 状态承接。
- 因果。
- 术语使用。
- 揭示 / 知情依赖。

用户可以从节点直接创建定向审查或修改任务。

### 15.9 审查历史

按正文版本展示：

- 审查时间。
- 使用档案和模型。
- 门禁结果。
- 问题变化。
- 用户决策。
- 修改任务。
- 复审结果。

## 16. 异常情况

### 16.1 正文版本已变化

- 审查仍绑定原版本。
- 报告顶部提示存在更新版本。
- 用户可以继续查看原报告或为新版本创建审查。
- 不把旧问题锚点自动迁移成新报告结论。

### 16.2 状态卡缺失或过期

- 允许运行不依赖状态卡的通道。
- 相关维度标记 `incomplete`。
- 报告不能进入完整 `passed`。
- 提供返回写作系统生成状态卡的入口。

### 16.3 审查器意见冲突

- 保留双方问题、证据和置信度。
- 标记 `reviewerDisagreements`。
- `danger` / `blocking` 分歧推荐第二模型或用户裁决。
- 汇总器不得秘密选择一方。

### 16.4 审查引用不存在

- 将证据标记为无效。
- 对应问题不能高于 `suggestion`。
- 若引用是模型编造，记录审查运行质量问题。

### 16.5 无法区分故意设计与错误

- 问题状态进入 `needsIntent`。
- 向用户展示两种解释。
- 用户确认意图后更新 ReviewDecision 和项目意图候选。

### 16.6 审查范围过大

- 按 Arc、章节区间或维度分批。
- 先执行确定性筛查，再执行高成本通道。
- 展示未覆盖范围。
- 不用抽样结果冒充全量结论。

### 16.7 模型或 Skill 失败

- 保留已完成 ReviewPass。
- ReviewRun 进入 `partiallyCompleted`。
- 用户可重试失败通道或接受不完整报告。
- 不重复收费式重跑已完成通道，除非上下文发生变化。

### 16.8 修改任务范围重叠

- 检测相同正文锚点和相互冲突目标。
- 推荐合并任务或建立执行顺序。
- 未处理冲突前不能并行应用到同一基础版本。

### 16.9 复审锚点失效

- 使用版本差异尝试映射。
- 无法可靠映射时要求人工重新定位。
- 不通过相似文本猜测来自动宣告解决。

### 16.10 快速复审发现大范围变化

- 中止快速通过。
- 标记需要完整复审。
- 保留已经验证的局部结论。

### 16.11 用户将问题标记为误报

- 要求可选理由。
- 不删除原问题。
- 生成 ReviewLessonCandidate 前检查是否为一次性例外。
- 不自动降低其他小说同类规则。

### 16.12 Canon 自身存在冲突

- 审查报告标记上游阻塞。
- 不要求正文同时满足互相冲突的事实。
- 创建人物 / 线索 / 世界观领域解决入口。
- Canon 未解决前相关 Finding 保持 `blockedByUpstream`。

### 16.13 领域报告重复

- 保留领域报告原 ID。
- 章节报告只建立引用并做聚合。
- 同一根因不重复创建多个 RevisionTask。

### 16.14 已发布章节发现问题

- 仍可生成报告和修订任务。
- 不直接修改 `publishedVersionId`。
- 修改结果进入新版本。
- 是否重新发布由 Publish Review System 决定。

## 17. 验收标准

### 17.1 数据与版本

- 所有审查对象可以追溯到 `novelId`。
- 每次审查绑定不可变正文版本和 ReviewProfile 版本。
- 工作稿变化不影响已完成报告。
- 审查历史不被后续运行覆盖。

### 17.2 审查通道

- 可以分别执行确定性、叙事、人物、线索、世界观、对白、节奏和文风检查。
- 各通道记录模型、Skill、规则和上下文。
- 部分失败时保留已完成结果并标记覆盖不足。
- 原始通道结论可以追溯。

### 17.3 问题证据

- `warning` 以上问题有正文锚点和依据。
- `danger` / `blocking` 有明确规则或 Canon 支撑。
- 无效引用不能维持高严重度。
- 用户可以从问题跳转到正文和上游事实。

### 17.4 分歧与误报

- 审查器分歧不会被隐藏。
- 用户可以标记误报和有意为之。
- 用户意图在后续复审中生效。
- 单次误报不会自动改写全局规则。

### 17.5 评分与门禁

- 每个维度显示覆盖、置信度和分数解释。
- 不适合量化时允许无分数。
- 总分不是唯一通过标准。
- 阻断必须引用阻断规则和证据。
- 缺少必需通道时报告为 `incomplete`。

### 17.6 修改任务

- accepted 问题可以生成 RevisionTask 草案。
- 任务包含源版本、目标范围、保留项、禁止项和验收条件。
- 任务不直接修改正文。
- 重叠任务可以检测冲突和依赖。

### 17.7 快速复审

- 复审比较修改前后固定版本。
- 能标记解决、部分解决、未解决和回归。
- 能发现越界修改和保留项丢失。
- 变化过大时要求完整复审。

### 17.8 跨章一致性

- 关键事实变化可以生成 ImpactGraph。
- 可以定位受影响章节、状态卡、人物、线索、世界观和记忆。
- 纯语言润色不触发不必要的全书检查。
- 修复后可以再次搜索旧值和未解决冲突。

### 17.9 审查教训

- 用户纠正可生成 ReviewLessonCandidate。
- 未确认候选不写入记忆。
- 项目教训默认只作用于当前小说。
- 发布为 Skill 需要显式流程。

### 17.10 可视化

- 报告可以按维度和严重度筛选。
- 正文高亮可定位并可关闭。
- 篇章审查可以使用维度矩阵。
- 复审可以查看修改前后和问题状态。
- 跨章影响可以通过图查看。

### 17.11 性能与成本

- 单章审查可以显示通道进度。
- 篇章 / 全书审查支持分批。
- 高成本运行前显示估算。
- 已完成通道在上下文未变化时可复用。

## 18. 后续版本

### 18.1 V2

- 审查规则可视化编辑器。
- 多模型盲审和一致性统计。
- 语义级问题锚点迁移。
- 审查趋势与作者成长分析。
- 自定义编辑角色和批注。
- 章节节奏曲线与情绪曲线对照。
- 多候选修改方案实验。
- 平台发布要求预检入口。

### 18.2 V3

- 多人编辑审批流。
- 专属审查模型评测与微调。
- 跨小说匿名化审查规则学习。
- 大规模系列小说一致性审查。
- 读者模拟与多受众理解测试。
- 可验证的自动修订流水线。

## 19. 与其他 Spec 的边界

| 相关 Spec | 边界 |
|---|---|
| `01-novel-project-spec.md` | 定义小说级数据空间；本 Spec 定义审查数据和流程 |
| `02-novel-cockpit-spec.md` | Cockpit 展示审查摘要；本 Spec 提供完整报告和操作 |
| `03-inspiration-vault-spec.md` | 灵感不是审查事实源；本 Spec 不修改灵感 |
| `04-arc-swimlane-diagram-spec.md` | 泳道图提供结构节点和结构检查；本 Spec 聚合到章节 / 篇章报告 |
| `05-clue-foreshadowing-spec.md` | 线索系统拥有线索事实和领域检查器；本 Spec 调用并聚合 |
| `06-character-system-spec.md` | 人物系统拥有人物事实和领域检查器；本 Spec 调用并聚合 |
| `07-worldbuilding-system-spec.md` | 世界观系统拥有世界事实和领域检查器；本 Spec 调用并聚合 |
| `08-chapter-writing-spec.md` | 写作系统创建正文版本并执行 RevisionTask；本 Spec 不直接改正文 |
| `10-agent-orchestration-spec.md` | 编排系统调度并行审查、重试和依赖；本 Spec 定义审查业务契约 |
| `11-model-router-spec.md` | 模型路由选择审查模型；本 Spec 声明各通道能力需求 |
| `12-rag-context-engine-spec.md` | Context Engine 检索和组装证据；本 Spec 判断问题并生成报告 |
| `13-long-term-memory-spec.md` | 长期记忆保存确认后的审查教训；本 Spec 只生成候选 |
| `14-skill-system-spec.md` | Skill 系统注册审查能力和发布规则；本 Spec 定义审查 Skill 输入输出 |
| `15-publish-review-spec.md` | 发布审核检查平台、格式、敏感和发布质量；本 Spec 检查章节创作质量 |
