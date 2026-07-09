# 08 Chapter Writing Spec

状态：Review Candidate

日期：2026-07-09

上游依赖：

- `01-novel-project-spec.md`：章节、正文和写作运行必须绑定 `novelId`。
- `02-novel-cockpit-spec.md`：Cockpit 提供当前章节和继续写作入口。
- `03-inspiration-vault-spec.md`：灵感可以转成章节任务书或场景计划草案。
- `04-arc-swimlane-diagram-spec.md`：泳道图为章节提供事件、人物、线索和世界观节点。
- `05-clue-foreshadowing-spec.md`：章节写作读取线索计划、归因链和读者信息状态。
- `06-character-system-spec.md`：章节写作读取人物目标、状态、关系、知情范围和声音档案。
- `07-worldbuilding-system-spec.md`：章节写作读取世界事实、规则、状态和揭示计划。

相关底座文档：`2026-07-08-novel-agent-product-foundation-design.md`

## 1. 功能定位

Chapter Writing System 是把结构化故事计划转化为可控正文，并把正文结果同步回小说状态的写作执行系统。

它不是“输入一句话，模型返回一章”的聊天框，而是一条可检查、可暂停、可回滚、可复用的产物流水线：

```text
章节任务书
  → 上下文包
  → 写作运行
  → 正文版本
  → 章节状态卡
  → 章节审查
```

它解决的问题是：

1. 写之前明确本章要完成什么，而不是让模型自由漂移。
2. 只加载与本章相关且来源可追溯的上下文。
3. 支持整章、场景、续写、扩写、改写、润色和局部编辑。
4. 模型生成永远形成新版本，不静默覆盖作者正文。
5. 每个可交付章节版本都即时生成状态卡，保证下一章能承接。
6. 正文中的新事实先成为候选变更，不自动污染人物、世界观、线索和长期记忆。
7. 写作 Skill、项目规范和模型可以切换，但章节事实、版本和引用保持稳定。

一句话定义：

> Chapter Writing System 是小说结构与正式正文之间的受控执行层，负责组装上下文、调用写作能力、维护正文版本，并产出下一章可依赖的状态。

## 2. 用户角色

### 2.1 独立作者

创建章节任务书，选择写作模式，编辑生成正文并决定是否进入审查。

### 2.2 长篇连载作者

快速承接最近章节、追踪未完成钩子、保持人物和线索连续。

### 2.3 精修型作者

对选中段落执行改写、扩写、压缩、对白调整、视角统一和文风润色。

### 2.4 新手作者

让 Agent 从篇章节点生成章节任务书和场景计划，再逐步完成正文。

### 2.5 Agent 任务发起者

发起“写第 N 章”“续写当前场景”“按审查意见修改”等复合任务。

## 3. 入口位置

### 3.1 主入口

```text
项目列表
  → 进入某一本小说
  → Novel Cockpit
  → 当前章节 / 章节列表
  → Chapter Writing
```

### 3.2 上下文入口

用户可以从以下位置进入：

- 全书结构地图的章节卡。
- 篇章泳道图中的事件节点。
- 章节列表。
- 人物详情中的出场章节。
- 线索卡中的种下、发展或回收章节。
- 世界观揭示计划。
- 灵感库的“转成章节任务书”。
- 章节审查报告中的修改任务。
- Agent Orchestration 面板。

### 3.3 快捷入口

在某一本小说内支持：

```text
/write chapter
/continue
/rewrite
/polish
```

系统必须明确当前 `novelId`、`chapterId` 和操作范围。缺少目标章节时不得猜测，应先要求用户选择或创建章节。

## 4. 核心用户目标

### 4.1 规划本章

明确本章目的、冲突、转折、结尾钩子、出场人物、发生地点、线索动作和设定揭示。

### 4.2 检查写前上下文

在生成前查看系统将使用哪些事实、版本、最近章节和风格规则，并移除无关内容。

### 4.3 生成可编辑正文

按整章或场景生成，支持流式查看、暂停、取消和保留部分结果。

### 4.4 精确修改

只改选中段落或指定场景，不让模型借机重写整章。

### 4.5 管理版本

比较作者版本、Agent 版本和审查修改版本，随时回滚或分支。

### 4.6 保持跨章连续

写完本章后立即形成状态卡，记录人物、线索、世界和未解决事项的变化。

### 4.7 安全进入审查

把指定正文版本及其上下文、状态卡、写作规则交给章节审查系统。

## 5. MVP 范围

### 5.1 必须包含

- 按小说隔离的章节空间。
- 章节创建、排序和基本元数据。
- 章节任务书。
- 可选场景计划。
- 写前准备检查。
- 可审阅的上下文包。
- 整章生成。
- 分场景生成。
- 续写、改写、扩写、压缩、润色和对白优化。
- 选区级编辑。
- 流式输出、暂停和取消。
- 正文自动保存。
- 不可变正文版本和版本比较。
- 用户文本保护。
- 写作运行日志。
- 项目写作规范与 Skill 注入。
- 章节状态卡即时生成。
- 状态卡失效与再生成。
- 正文事实候选提取。
- 进入章节审查的交接动作。
- 导入、复制和导出单章正文。

### 5.2 MVP 可以简化

- 编辑器提供基础富文本或 Markdown 能力，不做完整桌面排版软件。
- 版本比较以文本差异为主，不做复杂语义合并。
- 场景计划是可选层，不要求所有章节先拆场景。
- 自动保存使用版本内快照，不为每次按键创建正式版本。
- 协同编辑不在 MVP 范围。
- 状态卡提取使用 Agent 候选加用户确认，不自动写回 Canon。
- 字数目标使用字符数 / 词数双口径配置，不假设所有语言相同。

## 6. 非 MVP 范围

- 多人实时协同写作。
- 专业出版排版和印刷版式。
- 直接发布到外部小说平台。
- 自动接受全部审查修改。
- 无限制自主连续生成整本小说。
- 自动训练或微调基础模型。
- 自动把草稿事实写成核心 Canon。
- 复杂 Git 式多分支合并界面。
- 音频听写和语音角色扮演。
- 图片、漫画或视频分镜生成。
- 读者评论驱动的自动续写。

## 7. 核心流程

### 7.1 创建章节

```text
用户选择目标 Arc
  → 新建 Chapter
  → 填写标题、顺序、目标字数和 POV
  → 关联泳道节点
  → 创建 ChapterBrief 草案
  → 进入章节规划
```

关键规则：

- 每个章节必须属于一个 `Novel`。
- MVP 中一个章节必须有一个主 `arcId`，可以额外引用其他 Arc。
- 章节排序变化不能改变已经发布章节的稳定 ID。

### 7.2 从泳道节点生成章节任务书

```text
用户选择一个或多个 EventNode
  → Agent 提取本章剧情目标
  → 整理人物、线索、世界观和转折
  → 生成 ChapterBrief 草案
  → 用户编辑并确认
```

Agent 不得把未批准节点自动升级为正式剧情。

### 7.3 写前准备

```text
用户点击“开始写作”
  → 校验 ChapterBrief
  → 加载项目写作规范
  → 加载最近章节状态卡
  → 请求 Context Engine 组装上下文
  → 检查 Canon 冲突和缺失信息
  → 生成 WritingPreflightReport
  → 用户确认上下文包和写作参数
```

写前最低要求：

- 本章目的。
- 主冲突或推进动作。
- POV。
- 起始状态。
- 预期结束状态或结尾方向。
- 至少一个事件节点或用户明确输入的剧情要求。

缺少信息时可以保存任务书，但不能以“上下文完整”状态启动正式整章生成。

### 7.4 生成整章

```text
用户确认 ChapterBrief 和 ContextBundle
  → 选择 WritingSkill、模型和目标长度
  → 创建 WritingRun
  → 模型流式生成
  → 用户暂停、继续或取消
  → 完成后保存 candidate ChapterDraftVersion
  → 执行轻量写后检查
  → 立即生成 ChapterStateCard 草案
  → 用户接受后设为章节当前版本
```

### 7.5 分场景写作

```text
用户创建或确认 ScenePlan
  → 选择当前场景
  → 加载场景专属上下文
  → 生成 SceneDraft
  → 用户接受到章节工作稿
  → 更新场景状态
  → 全部场景完成后组装章节版本
```

场景生成可以并行准备上下文，但同一章节的正文合并必须按场景顺序执行。

### 7.6 续写

```text
用户将光标放在章节末尾或场景末尾
  → 系统读取当前正文尾部
  → 加载尚未完成的 ChapterBrief 目标
  → 用户指定续写长度或停止条件
  → 创建 continuation WritingRun
  → 生成候选文本
  → 用户接受、重试或丢弃
```

“继续写”不得默认跨越本章任务书的结束边界。

### 7.7 选区修改

```text
用户选择正文范围
  → 选择改写 / 扩写 / 压缩 / 润色 / 对白优化
  → 输入保留项和修改目标
  → 系统锁定选区外文本
  → 生成候选差异
  → 用户逐段接受或拒绝
  → 保存新 ChapterDraftVersion
```

选区操作禁止修改选区外内容。若必须联动修改，系统只能提出额外建议。

### 7.8 根据审查任务修改

```text
用户打开 RevisionTask
  → 系统定位问题段落和审查证据
  → 加载任务限定上下文
  → 生成一个或多个修改方案
  → 用户应用选中方案
  → 保存新版本
  → 将旧状态卡标记为 stale
  → 返回复审
```

### 7.9 生成章节状态卡

```text
完整正文版本产生
  → Agent 提取关键事件和状态变化
  → 与 ChapterBrief、Canon 和旧状态对比
  → 生成 ChapterStateCard 草案
  → 标记事实候选与冲突
  → 用户确认状态卡
  → 下一章可以引用
```

状态卡必须紧跟正文版本生成。未产生状态卡的完整章节版本不能成为下一章的“已验证承接版本”。

### 7.10 交给章节审查

```text
用户选择正文版本
  → 校验状态卡存在且未过期
  → 固定本次审查输入版本
  → 创建 ReviewRequest
  → 交给 09 Chapter Review System
```

写作系统只负责发起审查和接收修改任务，不定义审查维度及评分算法。

## 8. 核心数据对象

| 对象 | 职责 |
|---|---|
| `Chapter` | 章节身份、顺序、归属和生命周期 |
| `ChapterBrief` | 本章必须完成的叙事任务 |
| `ScenePlan` | 可选的场景级计划 |
| `WritingPreflightReport` | 写前完整性、冲突和风险报告 |
| `ContextBundle` | 某次写作使用的冻结上下文包 |
| `ContextItemRef` | 上下文条目及来源、优先级和版本 |
| `WritingRun` | 一次模型写作执行 |
| `WritingInstruction` | 本次操作的目标、限制和保留项 |
| `ChapterWorkingCopy` | 编辑器当前可变工作稿 |
| `ChapterDraftVersion` | 不可变正式正文版本 |
| `SceneDraft` | 场景级候选正文 |
| `ChapterStateCard` | 章节结束后的结构化状态 |
| `ChapterFactCandidate` | 从正文提取但尚未确认的事实变化 |
| `StyleRuleProfile` | 小说项目的可解释文风规则和样例 |

### 8.1 建模原则

1. 所有对象必须包含 `novelId`，直接或通过不可歧义的父对象约束。
2. `ChapterWorkingCopy` 可变，`ChapterDraftVersion` 不可变。
3. 每次模型执行必须绑定 `ChapterBrief` 版本和 `ContextBundle`。
4. 正文不是通过聊天消息保存，而是通过工作稿和正式版本保存。
5. 模型输出先进入候选，不自动覆盖用户文本。
6. 状态卡必须绑定具体正文版本。
7. 正文抽取的事实先进入 `ChapterFactCandidate`。
8. Skill 配置属于执行参数，不写入正文事实。
9. 审查对象必须是固定版本，不能是持续变化的工作稿。

## 9. 字段定义

本节“必填”表示字段必须存在；数组可以为空，除非校验规则另有要求。

### 9.1 Chapter

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `chapterId` | string | 是 | 章节 ID |
| `novelId` | string | 是 | 所属小说 |
| `primaryArcId` | string | 是 | 主篇章 |
| `relatedArcIds` | string[] | 是 | 其他相关篇章 |
| `volumeId` | string | 否 | 所属分卷 |
| `sequenceNumber` | number | 是 | 小说内排序值 |
| `displayNumber` | string | 是 | 展示章节号 |
| `title` | string | 是 | 章节标题 |
| `summary` | string | 否 | 无剧透章节摘要 |
| `povType` | enum | 是 | 叙事视角 |
| `povCharacterIds` | string[] | 是 | POV 人物 |
| `storyTimeStart` | string | 否 | 故事内开始时间 |
| `storyTimeEnd` | string | 否 | 故事内结束时间 |
| `status` | enum | 是 | 章节状态 |
| `activeBriefVersionId` | string | 否 | 当前任务书版本 |
| `workingCopyId` | string | 否 | 当前工作稿 |
| `activeDraftVersionId` | string | 否 | 当前正式草稿版本 |
| `approvedVersionId` | string | 否 | 审查通过版本 |
| `publishedVersionId` | string | 否 | 已发布版本 |
| `stateCardId` | string | 否 | 当前状态卡 |
| `targetLength` | number | 否 | 目标长度 |
| `lengthUnit` | enum | 是 | `characters`、`words` |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.2 ChapterStatus

| 值 | 说明 |
|---|---|
| `outline` | 只有章节任务书 |
| `draft` | 正在写作或已有草稿 |
| `reviewing` | 固定版本正在审查 |
| `revision` | 根据问题修改 |
| `readyToPublish` | 已通过发布前置条件 |
| `published` | 已发布 |
| `locked` | 锁定，不允许普通编辑 |
| `archived` | 已归档 |

`WritingRun` 的 `queued`、`running`、`paused` 等执行状态不能混入 `ChapterStatus`。

### 9.3 ChapterPovType

| 值 | 说明 |
|---|---|
| `firstPerson` | 第一人称 |
| `thirdLimited` | 第三人称限知 |
| `thirdOmniscient` | 第三人称全知 |
| `secondPerson` | 第二人称 |
| `epistolary` | 书信、日志或文档体 |
| `mixed` | 明确设计的混合视角 |

### 9.4 ChapterBrief

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `briefId` | string | 是 | 不可变任务书版本 ID |
| `novelId` | string | 是 | 所属小说 |
| `chapterId` | string | 是 | 所属章节 |
| `version` | number | 是 | 版本号 |
| `parentBriefId` | string | 否 | 上一任务书版本 |
| `chapterPurpose` | string | 是 | 本章在全书中的作用 |
| `openingState` | string | 是 | 开场状态 |
| `centralConflict` | string | 是 | 主冲突或推进动作 |
| `requiredEventNodeIds` | string[] | 是 | 必须覆盖的泳道节点 |
| `optionalEventNodeIds` | string[] | 是 | 可选节点 |
| `requiredCharacterIds` | string[] | 是 | 必须出场人物 |
| `optionalCharacterIds` | string[] | 是 | 可选人物 |
| `locationIds` | string[] | 是 | 发生地点 |
| `clueActions` | object[] | 是 | 种下、发展、误导或回收要求 |
| `worldRevealPlanIds` | string[] | 是 | 设定揭示要求 |
| `characterArcBeatIds` | string[] | 是 | 人物弧光要求 |
| `mustInclude` | string[] | 是 | 必须出现的内容 |
| `mustAvoid` | string[] | 是 | 禁止出现的内容 |
| `endingDirection` | string | 是 | 结束状态或方向 |
| `hookType` | enum | 否 | 结尾钩子类型 |
| `targetEmotion` | string | 否 | 目标阅读情绪 |
| `targetPacing` | enum | 是 | `slow`、`measured`、`fast`、`variable` |
| `targetLength` | number | 否 | 本版本目标长度 |
| `lengthUnit` | enum | 是 | `characters`、`words` |
| `status` | enum | 是 | `draft`、`ready`、`superseded`、`archived` |
| `sourceRefs` | object[] | 是 | 泳道节点、灵感、用户输入等来源 |
| `createdBy` | enum | 是 | `user`、`agent`、`import` |
| `createdAt` | ISO datetime | 是 | 创建时间 |

`ready` 状态必须满足写前最低要求。任务书更新时创建具有新 `briefId` 的版本，并通过 `parentBriefId` 连接历史，不覆盖旧写作运行所绑定的版本。

### 9.5 HookType

| 值 | 说明 |
|---|---|
| `question` | 提出新问题 |
| `revelation` | 揭露信息 |
| `danger` | 威胁迫近 |
| `decision` | 人物作出关键决定 |
| `reversal` | 局势反转 |
| `arrival` | 新人物或力量出现 |
| `promise` | 对下一章行动作出承诺 |
| `emotionalTurn` | 情感关系发生转折 |
| `none` | 本章有意不使用钩子 |

### 9.6 ScenePlan

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `scenePlanId` | string | 是 | 场景计划 ID |
| `novelId` | string | 是 | 所属小说 |
| `chapterId` | string | 是 | 所属章节 |
| `version` | number | 是 | 场景计划版本 |
| `parentScenePlanId` | string | 否 | 上一版本 |
| `sequenceNumber` | number | 是 | 场景顺序 |
| `title` | string | 否 | 场景名 |
| `povCharacterId` | string | 否 | POV 人物 |
| `locationId` | string | 否 | 地点 |
| `storyTime` | string | 否 | 故事时间 |
| `entryState` | string | 是 | 场景进入状态 |
| `sceneGoal` | string | 是 | 场景目标 |
| `conflict` | string | 是 | 场景冲突 |
| `turn` | string | 是 | 场景转折 |
| `exitState` | string | 是 | 场景结束状态 |
| `eventNodeIds` | string[] | 是 | 对应泳道节点 |
| `requiredFacts` | string[] | 是 | 必须出现的事实 |
| `forbiddenFacts` | string[] | 是 | 禁止泄露的事实 |
| `targetLength` | number | 否 | 目标长度 |
| `status` | enum | 是 | `planned`、`drafting`、`complete`、`skipped` |

`ScenePlan` 一经 WritingRun 使用即视为不可变。后续修改创建新的 `scenePlanId`，通过 `parentScenePlanId` 连接历史。

### 9.7 WritingPreflightReport

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `preflightReportId` | string | 是 | 报告 ID |
| `novelId` | string | 是 | 所属小说 |
| `chapterId` | string | 是 | 目标章节 |
| `briefId` | string | 是 | 任务书版本 |
| `completenessStatus` | enum | 是 | `complete`、`warning`、`blocked` |
| `missingFields` | string[] | 是 | 缺失字段 |
| `canonConflicts` | object[] | 是 | Canon 冲突 |
| `knowledgeRisks` | object[] | 是 | 人物或读者知识风险 |
| `continuityRisks` | object[] | 是 | 跨章承接风险 |
| `contextWarnings` | object[] | 是 | 上下文缺失、过期或超预算 |
| `recommendations` | string[] | 是 | 建议 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.8 ContextBundle

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `contextBundleId` | string | 是 | 上下文包 ID |
| `novelId` | string | 是 | 所属小说 |
| `chapterId` | string | 是 | 目标章节 |
| `briefId` | string | 是 | 绑定任务书 |
| `purpose` | enum | 是 | `fullChapter`、`scene`、`continuation`、`rewrite`、`polish`、`reviewRevision` |
| `itemRefs` | `ContextItemRef[]` | 是 | 上下文条目 |
| `recentChapterVersionIds` | string[] | 是 | 最近正文版本 |
| `recentStateCardIds` | string[] | 是 | 最近状态卡 |
| `styleProfileId` | string | 否 | 项目文风档案 |
| `skillIds` | string[] | 是 | 将执行的 Skill |
| `tokenEstimate` | number | 是 | 估算 Token |
| `conflicts` | object[] | 是 | 发现的冲突 |
| `omittedItems` | object[] | 是 | 因预算移除的内容及原因 |
| `checksum` | string | 是 | 冻结内容校验值 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

上下文包一经 WritingRun 使用即不可变。需要增删内容时必须创建新包。

### 9.9 ContextItemRef

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `contextItemRefId` | string | 是 | 引用 ID |
| `novelId` | string | 是 | 所属小说 |
| `sourceType` | enum | 是 | `outline`、`eventNode`、`character`、`world`、`clue`、`chapter`、`stateCard`、`memory`、`style`、`userInstruction` |
| `sourceId` | string | 是 | 来源对象 |
| `sourceVersion` | string | 否 | 来源版本 |
| `excerpt` | string | 是 | 提供给模型的内容 |
| `relevanceReason` | string | 是 | 为什么与本次任务有关 |
| `priority` | enum | 是 | `required`、`high`、`normal`、`optional` |
| `authority` | enum | 是 | `lockedCanon`、`confirmedCanon`、`publishedEvidence`、`approvedPlan`、`draft`、`reference` |
| `mayContainSpoiler` | boolean | 是 | 是否包含作者秘密 |
| `included` | boolean | 是 | 是否进入模型上下文 |

### 9.10 WritingInstruction

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `instructionId` | string | 是 | 指令 ID |
| `novelId` | string | 是 | 所属小说 |
| `chapterId` | string | 是 | 目标章节 |
| `operation` | enum | 是 | 写作操作 |
| `scenePlanId` | string | 否 | 场景写作时绑定的场景计划 |
| `scenePlanVersion` | number | 否 | 场景计划版本 |
| `goal` | string | 是 | 本次目标 |
| `selectionStart` | number | 否 | 选区起点 |
| `selectionEnd` | number | 否 | 选区终点 |
| `preserveRequirements` | string[] | 是 | 必须保留 |
| `changeRequirements` | string[] | 是 | 必须改变 |
| `forbiddenChanges` | string[] | 是 | 禁止改变 |
| `stopConditions` | string[] | 是 | 停止条件 |
| `targetLength` | number | 否 | 目标长度 |
| `lengthUnit` | enum | 是 | `characters`、`words` |
| `userInstruction` | string | 否 | 用户补充要求 |

### 9.11 WritingOperation

| 值 | 说明 |
|---|---|
| `generateChapter` | 生成整章 |
| `generateScene` | 生成场景 |
| `continue` | 从指定位置续写 |
| `rewrite` | 保留事实重新表达 |
| `expand` | 增加细节、动作或情绪层次 |
| `condense` | 压缩冗余内容 |
| `polish` | 改善语言但不改变事实 |
| `dialogue` | 优化对白和角色声音 |
| `pacing` | 调整节奏 |
| `pov` | 修正叙事视角 |
| `deAiStyle` | 按项目规则降低模式化表达 |
| `applyRevision` | 执行审查修改任务 |

### 9.12 WritingRun

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `writingRunId` | string | 是 | 运行 ID |
| `novelId` | string | 是 | 所属小说 |
| `chapterId` | string | 是 | 目标章节 |
| `briefId` | string | 是 | 任务书版本 |
| `contextBundleId` | string | 是 | 上下文包 |
| `instructionId` | string | 是 | 写作指令 |
| `scenePlanId` | string | 否 | 场景写作时绑定的场景计划 |
| `scenePlanVersion` | number | 否 | 场景计划版本 |
| `sourceDraftVersionId` | string | 否 | 源正文版本 |
| `modelId` | string | 是 | 使用模型 |
| `skillIds` | string[] | 是 | 使用 Skill |
| `status` | enum | 是 | 运行状态 |
| `outputBufferRef` | string | 否 | 流式输出暂存引用 |
| `resultDraftVersionId` | string | 否 | 结果版本 |
| `usage` | object | 否 | Token、时间和成本 |
| `warnings` | object[] | 是 | 运行警告 |
| `error` | object | 否 | 失败原因 |
| `startedAt` | ISO datetime | 否 | 开始时间 |
| `endedAt` | ISO datetime | 否 | 结束时间 |

### 9.13 WritingRunStatus

| 值 | 说明 |
|---|---|
| `draft` | 参数尚未确认 |
| `queued` | 等待执行 |
| `running` | 正在生成 |
| `paused` | 用户暂停，可继续 |
| `waitingForUser` | 遇到冲突或需要选择 |
| `completed` | 生成结束并保存结果 |
| `cancelled` | 用户取消，部分输出可保留 |
| `failed` | 执行失败 |
| `superseded` | 结果已被后续运行替代 |

### 9.14 ChapterWorkingCopy

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `workingCopyId` | string | 是 | 工作稿 ID |
| `novelId` | string | 是 | 所属小说 |
| `chapterId` | string | 是 | 所属章节 |
| `baseDraftVersionId` | string | 否 | 基础版本 |
| `content` | text | 是 | 当前正文 |
| `contentFormat` | enum | 是 | `markdown`、`richText`、`plainText` |
| `revision` | number | 是 | 自动保存修订号 |
| `lastEditedBy` | enum | 是 | `user`、`agentApplied`、`import` |
| `lastAutosavedAt` | ISO datetime | 是 | 最近自动保存 |
| `dirty` | boolean | 是 | 是否存在未创建正式版本的修改 |

### 9.15 ChapterDraftVersion

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `draftVersionId` | string | 是 | 正文版本 ID |
| `novelId` | string | 是 | 所属小说 |
| `chapterId` | string | 是 | 所属章节 |
| `versionNumber` | number | 是 | 版本号 |
| `parentVersionId` | string | 否 | 父版本 |
| `content` | text | 是 | 不可变正文 |
| `contentFormat` | enum | 是 | 内容格式 |
| `contentHash` | string | 是 | 内容校验值 |
| `acceptanceStatus` | enum | 是 | `candidate`、`accepted`、`rejected` |
| `wordCount` | number | 是 | 词数 |
| `characterCount` | number | 是 | 字符数 |
| `origin` | enum | 是 | `userSnapshot`、`agentGeneration`、`agentRevision`、`import`、`merge` |
| `writingRunId` | string | 否 | 来源运行 |
| `briefId` | string | 是 | 使用的任务书 |
| `contextBundleId` | string | 否 | 使用的上下文包 |
| `changeSummary` | string | 是 | 版本变化摘要 |
| `createdBy` | enum | 是 | `user`、`agent`、`import` |
| `createdAt` | ISO datetime | 是 | 创建时间 |

Agent 生成的版本初始为 `candidate`；只有用户接受后才能写入 `Chapter.activeDraftVersionId`。作者主动创建的快照和导入后确认的版本可以直接为 `accepted`。

### 9.16 SceneDraft

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `sceneDraftId` | string | 是 | 场景草稿 ID |
| `novelId` | string | 是 | 所属小说 |
| `chapterId` | string | 是 | 所属章节 |
| `scenePlanId` | string | 是 | 场景计划 |
| `writingRunId` | string | 是 | 来源运行 |
| `content` | text | 是 | 场景正文 |
| `status` | enum | 是 | `candidate`、`accepted`、`rejected`、`superseded` |
| `acceptedIntoVersionId` | string | 否 | 进入的章节版本 |

### 9.17 ChapterStateCard

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `stateCardId` | string | 是 | 状态卡 ID |
| `novelId` | string | 是 | 所属小说 |
| `chapterId` | string | 是 | 所属章节 |
| `draftVersionId` | string | 是 | 对应正文版本 |
| `status` | enum | 是 | `generating`、`draft`、`confirmed`、`stale`、`superseded` |
| `keyEvents` | object[] | 是 | 本章关键事件 |
| `characterChanges` | object[] | 是 | 人物前后状态 |
| `relationChanges` | object[] | 是 | 人物关系变化 |
| `knowledgeChanges` | object[] | 是 | 人物和读者知情变化 |
| `clueChanges` | object[] | 是 | 线索种下、发展、误导和回收 |
| `worldChanges` | object[] | 是 | 世界状态和揭示变化 |
| `locationTransitions` | object[] | 是 | 地点变化 |
| `itemAndResourceChanges` | object[] | 是 | 物件与资源变化 |
| `newFacts` | object[] | 是 | 新事实候选摘要 |
| `unresolvedThreads` | object[] | 是 | 未解决问题和钩子 |
| `nextChapterConstraints` | string[] | 是 | 下一章必须承接的限制 |
| `briefCoverage` | object[] | 是 | 任务书目标完成情况 |
| `wordCount` | number | 是 | 词数 |
| `characterCount` | number | 是 | 字符数 |
| `generatedByModelId` | string | 是 | 生成模型 |
| `confirmedByUser` | boolean | 是 | 是否确认 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.18 ChapterFactCandidate

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `factCandidateId` | string | 是 | 候选 ID |
| `novelId` | string | 是 | 所属小说 |
| `chapterId` | string | 是 | 来源章节 |
| `draftVersionId` | string | 是 | 来源版本 |
| `targetDomain` | enum | 是 | `character`、`relation`、`clue`、`world`、`timeline`、`memory` |
| `targetObjectId` | string | 否 | 目标对象 |
| `fact` | string | 是 | 候选事实 |
| `changeType` | enum | 是 | `create`、`update`、`confirm`、`deprecate`、`noChange` |
| `evidenceRange` | object | 是 | 正文证据位置 |
| `confidence` | number | 是 | 0 到 1 |
| `conflicts` | object[] | 是 | 与现有事实的冲突 |
| `status` | enum | 是 | `pending`、`accepted`、`rejected`、`superseded` |
| `requiresUserConfirmation` | boolean | 是 | 是否需要确认 |

### 9.19 StyleRuleProfile

写作系统引用 Skill System 或 Project Settings 中的 `StyleRuleProfile`，最低需要：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `styleProfileId` | string | 是 | 档案 ID |
| `novelId` | string | 是 | 所属小说 |
| `narrativeVoice` | string | 否 | 叙述声音 |
| `sentencePreferences` | string[] | 是 | 句式偏好 |
| `dialogueRules` | string[] | 是 | 对白规则 |
| `pacingRules` | string[] | 是 | 节奏规则 |
| `descriptionRules` | string[] | 是 | 描写规则 |
| `forbiddenPatterns` | string[] | 是 | 禁用表达 |
| `preferredExamples` | object[] | 是 | 正向样例及来源 |
| `negativeExamples` | object[] | 是 | 反向样例及原因 |
| `genreRuleSkillIds` | string[] | 是 | 题材专属 Skill |
| `version` | number | 是 | 版本号 |

“去 AI 感”必须由项目规则、作者样例和明确检查项定义，不能只依赖一个不可解释的总分。

## 10. 状态机

### 10.1 章节状态

```text
outline → draft → reviewing → revision
             ↑         │          │
             └─────────┴──────────┘

reviewing / revision → readyToPublish → published → locked
outline / draft / published → archived
```

规则：

- `reviewing` 必须绑定一个固定 `draftVersionId`。
- 工作稿修改不会自动改变正在审查的版本。
- `readyToPublish` 由章节审查和发布前置条件共同决定。
- `published` 必须记录实际发布版本。
- `locked` 仍可复制为新修订分支，但不能原地修改。

### 10.2 写作运行状态

```text
draft → queued → running → completed
                    │
                    ├→ paused → running
                    ├→ waitingForUser → running
                    ├→ cancelled
                    └→ failed

completed → superseded
```

### 10.3 状态卡状态

```text
generating → draft → confirmed
                 │         │
                 └────────→ stale
confirmed / stale → superseded
```

以下变化会使状态卡进入 `stale`：

- 正文内容发生实质修改。
- 章节任务书中关键事件发生变化。
- 章节顺序或故事时间发生变化。
- 相关人物、世界观或线索 Canon 被修改且影响本章解释。

格式、空格和不改变语义的标点修改不使状态卡失效。

### 10.4 事实候选状态

```text
pending → accepted
       ├→ rejected
       └→ superseded
```

`accepted` 只表示用户接受该候选进入目标系统的确认流程，不代表可以跳过目标系统自身的校验。

## 11. Agent 行为

### 11.1 可以自动执行

- 从泳道节点和用户要求生成章节任务书草案。
- 推荐场景拆分。
- 组装并压缩上下文。
- 检查写前字段和 Canon 冲突。
- 按用户确认的参数生成候选正文。
- 执行局部改写并生成文本差异。
- 自动保存工作稿。
- 创建不可变正文版本。
- 生成状态卡草案。
- 提取事实候选。
- 生成版本摘要。
- 推荐写作模型和 Skill。

### 11.2 必须由用户确认

- 将 Agent 候选应用到含用户文本的工作稿。
- 改变章节任务书中的关键剧情结果。
- 接受事实候选进入人物、世界观、线索或记忆系统。
- 采用会改变 POV、时间线、人物动机或线索回收结果的改写。
- 将正文版本送审。
- 将版本标记为 `readyToPublish`、`published` 或 `locked`。
- 使用高成本模型执行长章节生成。

### 11.3 禁止自动执行

- 静默覆盖作者文本。
- 在选区修改时改动选区之外正文。
- 将 RAG 片段原样拼接成正文。
- 为了让剧情成立而悄悄修改 Canon。
- 把模型生成的新设定直接写入长期记忆。
- 在未生成状态卡的情况下把本章标记为可供下一章承接。
- 未经用户授权连续生成后续多个章节。
- 把题材专属写法当成全局写作铁律。

### 11.4 Agent 生成结果必须附带

```text
目标章节与正文版本
使用的任务书版本
使用的上下文包
使用的模型与 Skill
完成的任务书目标
未完成或偏离的目标
发现的 Canon 风险
字数 / 字符数
状态卡状态
建议的下一步
```

## 12. Skill 调用

| Skill | 触发场景 |
|---|---|
| 章节任务书生成 | 从泳道节点、大纲或灵感生成本章计划 |
| 场景拆分 | 把一章拆成场景目标、冲突、转折和结束状态 |
| 长篇章节写作 | 按任务书和上下文生成完整章节 |
| 场景写作 | 生成单个场景 |
| 章节续写 | 承接当前正文并完成剩余目标 |
| 选区改写 | 在事实不变前提下重新表达 |
| 扩写 | 增加动作、感官、心理或环境层次 |
| 压缩 | 删除冗余并保留关键信息 |
| 文风润色 | 应用项目 StyleRuleProfile |
| 对白塑形 | 按人物声音和关系调整对白 |
| POV 检查与修正 | 发现并修复视角漂移 |
| 节奏调整 | 调整场景密度、段落长度和信息释放 |
| 模式化表达检查 | 按可解释规则检查机械、套话和过度总结 |
| 状态卡生成 | 写后提取事件和状态变化 |
| 正文事实抽取 | 生成 ChapterFactCandidate |
| 写作上下文整理 | 调用 Context Engine 组装最小充分上下文 |

### 12.1 Skill 层级规则

写作约束分三层：

```text
产品级安全与数据规则
  → 小说项目级写作规范
  → 本次任务选择的题材 / 操作 Skill
```

冲突时：

1. 产品级数据安全规则不可覆盖。
2. 用户明确确认的项目规则优先于通用 Skill。
3. 本次用户指令优先于非锁定的风格偏好。
4. Skill 不能覆盖 Canon。

### 12.2 题材规则边界

某个 Skill 可以规定悬疑线索节奏、惊悚描写方式、对白密度或章节长度，但这些规则只对启用该 Skill 的小说或任务生效。系统不得把具体题材的天数、人物名、谜底或固定章法写入通用产品逻辑。

## 13. 模型选择规则

| 场景 | 推荐模型特点 |
|---|---|
| 章节任务书 | 结构规划和约束遵循强 |
| 整章初稿 | 长文本稳定、叙事连贯、风格控制强 |
| 场景写作 | 场景感、对白和动作表现强 |
| 续写 | 长上下文、接续能力和停止控制好 |
| 局部改写 | 指令精确、最小修改能力强 |
| 文风润色 | 风格模仿稳定、不过度改写 |
| 状态卡与事实抽取 | 结构化输出、引用定位准确 |
| 写前一致性检查 | 推理和多来源对比强 |
| 低延迟实时建议 | 响应快、成本低 |

模型路由必须遵守：

1. 规划、正文生成、事实抽取和审查可以使用不同模型。
2. 用户可以为小说、章节或单次运行手动选择模型。
3. 模型推荐必须展示长文本、风格、推理、速度和成本特点。
4. 模型切换不得丢失任务书、上下文包或版本引用。
5. 降级模型前必须检查上下文长度、结构化输出和中文长文本能力。
6. 模型失败后重试必须创建新的运行尝试，不覆盖失败记录。
7. 高成本整章生成前必须显示成本估算或使用量等级。

## 14. 长期记忆读写

### 14.1 可读取

- Project Memory。
- Core Canon Memory。
- Character Memory。
- World Memory。
- Clue Memory。
- Style Memory。
- 最近已确认章节状态卡。
- 与当前篇章相关的审查历史。

### 14.2 写作时的记忆规则

- 写作运行只读取与本章有关的记忆。
- 默认加载最近 3 个已确认状态卡，但项目可以配置数量；存在倒叙、支线或并行时间线时，优先加载因果前置章节，而不是机械加载编号最近章节。
- 每条记忆进入上下文时必须保留来源和版本。
- 与结构化 Canon 冲突的记忆必须标记并降权。
- 记忆内容是上下文，不是对用户指令的替代。

### 14.3 可写入

经用户确认后可以写入：

- Style Memory：作者接受的语言偏好、节奏偏好和正反样例。
- Project Memory：稳定的章节长度、工作流和模型偏好。
- Character / World / Clue Memory：由目标业务系统确认后的章节事实。
- Core Canon Memory：不可逆的重大剧情事实。

### 14.4 不得直接写入

- 原始模型输出。
- 未确认状态卡。
- `pending` ChapterFactCandidate。
- 被用户拒绝的段落。
- 失败或取消运行的输出。
- 临时上下文摘要。
- 审查尚未接受的问题判断。

### 14.5 与 RAG / Context Engine 的关系

写作系统向 Context Engine 提交：

```text
novelId
chapterId
briefId
operation
selectionRange
requiredObjectIds
recentChapterCount
tokenBudget
spoilerPolicy
```

Context Engine 返回 `ContextBundle` 候选。写作系统负责：

- 展示来源和版本。
- 允许用户增删。
- 冻结最终上下文包。
- 将其绑定到 WritingRun。

Context Engine 负责检索和压缩，不负责生成正文。

上下文权威顺序为：

```text
lockedCanon
  → confirmedCanon
  → publishedEvidence
  → approvedPlan
  → draft
  → reference
```

低权威内容与高权威内容冲突时必须保留双方引用并阻止自动合并。

## 15. 可视化与交互要求

### 15.1 章节写作工作台

桌面端推荐四区结构：

```text
左侧：章节 / 场景导航
中央：正文编辑器
右侧：任务书 / 上下文 / Agent
底部或抽屉：版本、运行、状态卡、审查
```

界面必须优先保证正文阅读和编辑空间，Agent 面板不能长期遮挡正文。

### 15.2 章节顶部状态条

显示：

- 章节号与标题。
- 所属 Arc。
- 章节状态。
- 当前正文版本。
- 字数 / 字符数。
- 自动保存状态。
- 使用模型。
- 状态卡状态。
- 审查状态。

### 15.3 任务书面板

按以下分组展示：

- 本章目的。
- 开场状态。
- 主冲突。
- 必须节点。
- 人物与地点。
- 线索动作。
- 世界观揭示。
- 人物弧光。
- 禁止事项。
- 结尾方向。

正文生成后，面板可以显示每一项目标的覆盖状态，但覆盖结论必须允许用户修正。

### 15.4 上下文检查器

每个上下文条目显示：

- 来源类型和名称。
- 相关原因。
- 权威级别。
- 版本。
- Token 占用。
- 是否包含剧透。
- 是否被纳入。

冲突条目必须并列显示，不能只保留模型选择的一方。

### 15.5 正文编辑器

必须支持：

- 自动保存。
- 字数 / 字符数。
- 选区操作。
- Agent 候选差异预览。
- 接受或拒绝候选。
- 撤销和重做。
- 搜索与替换。
- 章节内注释。
- 跳转关联场景。
- 标记正文证据范围。

### 15.6 流式生成状态

生成时显示：

- 当前操作。
- 模型和 Skill。
- 已生成长度。
- 预计使用量。
- 暂停。
- 取消。
- 保留部分输出。
- 丢弃部分输出。

### 15.7 版本视图

必须支持：

- 按时间查看版本。
- 查看来源是作者、Agent、导入还是审查修改。
- 两版本文本差异。
- 恢复为新版本。
- 查看版本绑定的任务书、上下文和状态卡。

恢复旧版本必须创建新版本，不能删除之后的历史。

### 15.8 状态卡视图

按领域分区展示：

- 关键事件。
- 人物与关系变化。
- 知情变化。
- 线索变化。
- 世界变化。
- 地点和物件。
- 未解决事项。
- 下一章约束。
- 任务书覆盖情况。
- 待确认事实。

### 15.9 场景导航

场景卡显示：

- 场景目标。
- POV。
- 地点。
- 冲突。
- 转折。
- 状态。
- 字数。

用户可以拖动未发布章节内的场景顺序。若拖动影响时间、线索或人物状态，系统必须提示重新检查。

## 16. 异常情况

### 16.1 章节任务书不完整

- 允许保存。
- 写前报告列出缺失项。
- 用户可以让 Agent 补全草案。
- `blocked` 状态不得启动正式整章生成。

### 16.2 上下文包含冲突

- 并列展示 Canon、正文证据和草案。
- 用户选择本次遵循哪个解释。
- 选择草案不能自动修改 Canon。
- 选择结果记录进 WritingInstruction。

### 16.3 上下文超过模型预算

压缩顺序：

```text
去除重复
  → 压缩低优先级条目
  → 移除 optional
  → 分场景生成
  → 建议切换长上下文模型
```

不得无提示截断 `lockedCanon`、本章必须节点和用户明确指令。

### 16.4 生成中断

- 保存输出缓冲区。
- 运行状态进入 `paused` 或 `failed`。
- 用户可以从最后完整段落继续。
- 继续操作创建新的尝试记录。

### 16.5 用户在生成期间编辑正文

- 生成结果保持候选状态。
- 不自动覆盖新编辑内容。
- 应用时执行基线版本检查。
- 基线不一致时要求重新比较或重新生成。

### 16.6 模型偏离任务书

- 写后检查标记未覆盖和新增内容。
- 用户可以接受偏离、局部重写或重新生成。
- Agent 不得擅自把偏离内容写回任务书。

### 16.7 选区外发生变化

- 阻止直接应用。
- 展示越界差异。
- 用户可以扩大选区后重新执行。

### 16.8 输出长度异常

- 超出或不足目标时显示偏差。
- 用户可以压缩、扩写或接受。
- 长度只是约束之一，不能自动截断完整句段。

### 16.9 状态卡生成失败

- 正文版本仍然保存。
- 标记该版本 `stateCardMissing` 风险。
- 禁止把它作为下一章的已验证承接版本。
- 用户可以重试或手动填写状态卡。

### 16.10 状态卡与正文不一致

- 指向对应证据段落。
- 用户修改状态卡或正文。
- 未解决前保持 `draft` 或 `stale`。

### 16.11 修改早期章节

- 标记后续状态卡、章节任务书和相关审查报告可能过期。
- 计算受影响的人物、线索、世界状态和术语。
- 创建跨章一致性检查任务。
- 不自动重写后续章节。

### 16.12 已发布章节修改

- 保留 `publishedVersionId`。
- 修改内容进入新修订版本。
- 显示本地版本与发布版本差异。
- 是否重新发布由发布审核系统处理。

### 16.13 跨小说复制章节

- 复制为新 `chapterId` 和新版本。
- 所有外部引用进入待映射状态。
- 不复制源小说长期记忆。
- 未完成映射前不能标记任务书 `ready`。

### 16.14 Skill 或模型不可用

- 保留写作参数。
- 推荐兼容替代项并说明差异。
- 用户确认后创建新 WritingRun。
- 不修改已完成版本的来源记录。

## 17. 验收标准

### 17.1 数据隔离

- 每个章节、任务书、上下文包、写作运行、正文版本和状态卡可追溯到 `novelId`。
- 切换小说不能看到上一小说正文或写作上下文。
- 跨小说复制生成新 ID 并要求重新映射引用。

### 17.2 章节规划

- 用户可以创建章节并关联主 Arc。
- 可以从泳道节点生成 ChapterBrief 草案。
- `ready` 任务书满足写前最低要求。
- 任务书修改保留版本。

### 17.3 上下文

- 写作前可以查看、增删和确认上下文条目。
- 每个条目有来源、版本、相关原因和权威级别。
- 上下文包使用后不可变。
- 超预算时不静默丢弃强制内容。
- RAG 结果不能覆盖 Canon。

### 17.4 写作运行

- 支持整章、场景、续写和选区修改。
- 支持流式输出、暂停和取消。
- 每次运行记录模型、Skill、任务书和上下文包。
- 失败运行不会覆盖正文。
- 用户可以保留或丢弃部分输出。

### 17.5 用户文本保护

- Agent 输出默认是候选。
- 选区修改不改变选区外文本。
- 应用候选前检查基线版本。
- 所有正式修改形成新正文版本。

### 17.6 版本

- 正式正文版本不可变。
- Agent 生成版本初始为 `candidate`，只有用户接受后才成为当前正文版本。
- 可以比较两个版本。
- 可以从历史版本恢复为新版本。
- 正在审查、已批准和已发布版本有明确 ID。

### 17.7 状态卡

- 完整正文版本生成后立即创建状态卡草案。
- 状态卡记录人物、关系、知识、线索、世界和未解决事项。
- 状态卡绑定具体正文版本。
- 正文实质变化后状态卡进入 `stale`。
- 缺少有效状态卡的章节不能成为下一章已验证承接版本。

### 17.8 事实同步

- 正文新事实生成 ChapterFactCandidate。
- 候选包含正文证据和冲突信息。
- 未确认候选不写入人物、世界观、线索或长期记忆。
- 接受候选仍需经过目标系统校验。

### 17.9 Skill 与模型

- 项目写作规范、题材 Skill 和本次操作 Skill 有明确优先级。
- 题材专属规则不会污染其他小说。
- 用户可以查看并切换模型。
- 模型切换不丢失运行输入和版本引用。

### 17.10 审查交接

- 用户可以选择固定正文版本送审。
- 送审时携带任务书、上下文包、状态卡和写作运行来源。
- 工作稿后续变化不改变已发起审查的输入。

### 17.11 编辑器体验

- 自动保存状态可见。
- Agent 生成期间用户仍可安全查看正文。
- 版本、状态卡、上下文和任务书可以互相跳转。
- 大段正文编辑不依赖聊天记录恢复。

## 18. 后续版本

### 18.1 V2

- 语义级版本差异。
- 场景卡可视化编排。
- 多候选并排写作。
- 作者实时行文建议。
- 章节节奏曲线。
- 对白角色声纹对比。
- 术语批量迁移。
- 离线编辑与同步。
- 外部文稿格式导入导出。

### 18.2 V3

- 多人协同写作与评论。
- 复杂正文分支合并。
- 连续多章自主写作沙箱。
- 个性化写作模型微调管理。
- 语音口述与角色表演。
- 面向不同平台的正文版本派生。

## 19. 与其他 Spec 的边界

| 相关 Spec | 边界 |
|---|---|
| `01-novel-project-spec.md` | 定义章节数据空间；本 Spec 定义章节写作产物和流程 |
| `02-novel-cockpit-spec.md` | Cockpit 展示当前章节和入口；本 Spec 提供完整写作工作台 |
| `03-inspiration-vault-spec.md` | 灵感库保存原始想法；本 Spec 接收章节任务书或场景草案 |
| `04-arc-swimlane-diagram-spec.md` | 泳道图定义篇章事件结构；本 Spec 将节点转化为章节正文 |
| `05-clue-foreshadowing-spec.md` | 线索系统维护线索事实和归因链；本 Spec 执行本章线索动作并产生候选结果 |
| `06-character-system-spec.md` | 人物系统维护人物事实；本 Spec 读取人物上下文并产生状态候选 |
| `07-worldbuilding-system-spec.md` | 世界观系统维护世界 Canon；本 Spec 读取规则并产生世界变化候选 |
| `09-chapter-review-spec.md` | 审查系统定义审查维度、报告和修改任务；本 Spec 生成并修改正文 |
| `10-agent-orchestration-spec.md` | 编排系统拆分、调度和重试复合任务；本 Spec 执行单次章节写作任务 |
| `11-model-router-spec.md` | 模型路由管理模型档案、推荐和降级；本 Spec 声明写作任务需要的模型特点 |
| `12-rag-context-engine-spec.md` | Context Engine 检索、排序、压缩和引用上下文；本 Spec 审阅并消费 ContextBundle |
| `13-long-term-memory-spec.md` | 长期记忆保存确认事实和偏好；本 Spec 只提交候选记忆 |
| `14-skill-system-spec.md` | Skill 系统注册和执行写作能力；本 Spec 定义写作 Skill 的业务输入输出 |
| `15-publish-review-spec.md` | 发布审核判断章节是否适合目标平台；本 Spec 只维护正文及已发布版本引用 |
