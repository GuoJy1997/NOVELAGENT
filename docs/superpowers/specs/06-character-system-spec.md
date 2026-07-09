# 06 Character System Spec

状态：Review Candidate

日期：2026-07-09

上游依赖：

- `01-novel-project-spec.md`：所有人物数据必须绑定 `novelId`。
- `02-novel-cockpit-spec.md`：Cockpit 展示人物关系摘要和人物风险。
- `03-inspiration-vault-spec.md`：灵感可以转成人物草案。
- `04-arc-swimlane-diagram-spec.md`：人物弧光节点引用人物。
- `05-clue-foreshadowing-spec.md`：人物可作为线索提供者、触发者、接收者、隐藏者和误导者。

相关底座文档：`2026-07-08-novel-agent-product-foundation-design.md`

## 1. 功能定位

Character System 是维护人物事实、人物关系、人物弧光、信息状态、出场记录和语言风格的小说人物中枢。

它解决的问题是：

1. 作者能清楚知道每个人是谁、想要什么、害怕什么、隐瞒什么。
2. 人物关系可以随剧情变化，而不是只有一张静态关系图。
3. Agent 写章节时能加载正确的人物目标、当前状态、知情范围和说话风格。
4. 审查系统能发现人物动机断裂、关系跳变、知识越界、能力突变和配角工具化。
5. 人物能与篇章、章节、事件节点、线索、世界观和长期记忆建立可追溯关系。

一句话定义：

> Character System 是一本小说的人物事实源和关系演化系统，负责保证人物在长篇创作中持续一致、持续变化，并且变化有剧情依据。

## 2. 用户角色

### 2.1 新手作者

通过人物模板建立目标、欲望、恐惧、秘密、弱点和人物弧光。

### 2.2 连载作者

追踪人物当前状态、最近出场、关系变化、未完成目标和下次出场任务。

### 2.3 群像 / 权谋作者

管理大量人物、阵营、关系、利益冲突、秘密和知情差异。

### 2.4 悬疑 / 推理作者

管理人物证词、嫌疑、隐藏信息、误导行为和知识边界。

### 2.5 编辑 / 审稿人

检查人物动机、行为一致性、对白差异、配角功能和人物弧光完成度。

## 3. 入口位置

### 3.1 主入口

```text
Novel Cockpit
  ↓
Characters
```

### 3.2 其他入口

- 灵感库：灵感转人物草案。
- 篇章泳道图：从人物弧光节点进入人物详情。
- 线索系统：从 Provider / Trigger / Receiver 等角色进入。
- 世界观系统：从阵营、身份、血统、职业进入。
- 章节写作：查看本章出场人物上下文。
- 章节审查：查看人物一致性问题。
- Agent 任务详情：查看任务涉及人物。

### 3.3 默认进入规则

人物系统默认展示当前 Novel 的人物列表和关系图摘要，可按重要度、阵营、状态、Arc、Chapter 和风险筛选。

## 4. 核心用户目标

系统必须支持用户：

1. 创建和编辑人物。
2. 从灵感生成人物草案。
3. 定义人物外部目标、内部欲望、恐惧、秘密、弱点和价值观。
4. 定义人物身份、阵营、能力和世界观归属。
5. 建立人物关系并记录关系变化。
6. 设计人物弧光并关联篇章 / 事件节点。
7. 记录人物在不同章节的状态。
8. 记录人物知道、误解、隐藏和透露的信息。
9. 定义人物对白和叙事风格。
10. 查看出场记录和长期缺席提醒。
11. 检查动机、关系、知识、能力和语言一致性。
12. 为章节写作提供人物上下文。

## 5. MVP 范围

### 5.1 核心对象

- `Character`
- `CharacterProfile`
- `CharacterRelation`
- `CharacterRelationBeat`
- `CharacterArc`
- `CharacterArcBeat`
- `CharacterStateSnapshot`
- `CharacterVoiceProfile`
- `CharacterAppearance`
- `CharacterKnowledgeRef`
- `CharacterReviewReport`

### 5.2 人物分类

MVP 支持：

- 主角。
- 反派。
- 主要配角。
- 次要配角。
- 导师。
- 盟友。
- 对手。
- 群体 / 组织代表。

分类只表示叙事功能，不限制人物可以拥有多个标签。

### 5.3 人物关系

MVP 支持：

- 亲属。
- 朋友。
- 爱情。
- 师徒。
- 盟友。
- 对手。
- 敌对。
- 上下级。
- 债务 / 恩情。
- 利益合作。
- 隐藏关系。

### 5.4 人物弧光

MVP 支持：

- 正向成长。
- 负向堕落。
- 平稳坚守。
- 救赎。
- 悲剧。
- 觉醒。
- 身份揭示。

### 5.5 Agent 支持

- 人物草案生成。
- 人物关系建议。
- 人物弧光建议。
- 人物一致性检查。
- 对白风格检查。
- 人物知识边界检查。
- 配角存在感检查。
- 章节人物上下文整理。

## 6. 非 MVP 范围

第一版不做：

- 自动生成人物立绘。
- 完整生理模拟。
- 游戏式复杂属性战斗系统。
- 实时社交网络模拟。
- 多人协作人物权限。
- 跨小说共享可变人物。
- 自动修改正文中的人物表现。
- 自动确认人物死亡、背叛或关系重大变化。

## 7. 核心流程

### 7.1 创建人物

```text
用户点击“创建人物”
  ↓
填写姓名、身份、叙事功能和基础简介
  ↓
填写目标、欲望、恐惧、秘密、弱点
  ↓
系统创建 Character 草案
  ↓
用户确认后进入 active
```

规则：

- 人物必须绑定 `novelId`。
- 草案可以缺少高级字段。
- active 人物至少需要姓名、叙事功能、当前目标和基础身份。

### 7.2 从灵感生成人物草案

```text
用户选择人物灵感
  ↓
Agent 提取身份、目标、冲突、秘密和关系候选
  ↓
生成 Character 草案
  ↓
用户编辑并确认
```

规则：

- 保留 `sourceInspirationIds`。
- Agent 不得静默创建正式人物事实。

### 7.3 建立人物关系

```text
用户选择两个人物
  ↓
选择关系类型和方向
  ↓
填写公开关系、真实关系、双方认知和当前强度
  ↓
创建 CharacterRelation
```

规则：

- 关系可以是单向或双向。
- “A 认为 B 是盟友”不代表 B 也这样认为。
- 公开关系和真实关系必须允许不同。

### 7.4 更新人物关系

```text
剧情事件发生
  ↓
用户或 Agent 建议创建 RelationBeat
  ↓
记录关系变化原因、章节和前后状态
  ↓
用户确认
  ↓
更新当前关系
```

规则：

- 关系跳变必须有事件或章节依据。
- 已发布章节相关关系变更不能静默重写。

### 7.5 创建人物弧光

```text
用户选择人物
  ↓
定义起点、核心缺陷、欲望、转变目标
  ↓
选择关键 Arc / Chapter / EventNode
  ↓
创建 CharacterArc 和 ArcBeat
```

规则：

- 人物弧光必须有起点、至少一个转折和预期终点。
- 弧光节点可以关联泳道图人物弧光泳道。

### 7.6 记录人物状态

```text
章节完成或重要事件确认
  ↓
系统生成人物状态快照建议
  ↓
记录位置、身体、情绪、目标、关系、知识和资源变化
  ↓
用户确认
```

规则：

- 状态快照必须绑定章节或事件节点。
- 新状态不能覆盖历史状态。

### 7.7 定义人物声音

用户可定义：

- 词汇习惯。
- 句长倾向。
- 语气。
- 礼貌程度。
- 情绪表达方式。
- 口头禅。
- 禁用表达。
- 对不同人物的称呼。

该信息用于章节写作和对白审查。

### 7.8 检查人物一致性

```text
用户选择人物、章节、Arc 或全书范围
  ↓
Agent 读取人物事实、状态、关系、弧光、知情状态和章节文本
  ↓
检查动机、关系、知识、能力、声音和出场功能
  ↓
生成 CharacterReviewReport
```

Agent 只能提出建议，不能直接改写人物事实或正文。

### 7.9 标记人物死亡 / 失踪 / 离场

```text
用户选择人物状态变更
  ↓
选择死亡、失踪、离场或回归
  ↓
关联章节 / 事件节点
  ↓
显示影响范围
  ↓
用户二次确认
```

这是高风险操作，必须确认。

## 8. 数据对象

### 8.1 Character

人物根对象和当前权威状态。

### 8.2 CharacterProfile

人物动机、心理、身份和叙事功能档案。

### 8.3 CharacterRelation

两个人物之间的当前关系。

### 8.4 CharacterRelationBeat

关系变化记录。

### 8.5 CharacterArc

人物变化主线。

### 8.6 CharacterArcBeat

人物弧光的关键节点。

### 8.7 CharacterStateSnapshot

某个章节 / 事件后的状态快照。

### 8.8 CharacterVoiceProfile

人物语言和对白风格。

### 8.9 CharacterAppearance

人物出场记录。

### 8.10 CharacterKnowledgeRef

人物对线索、秘密和世界观事实的知情引用。

### 8.11 CharacterReviewReport

人物一致性审查报告。

## 9. 字段定义

### 9.1 Character

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `characterId` | string | 是 | 人物 ID |
| `novelId` | string | 是 | 所属小说 |
| `name` | string | 是 | 姓名 |
| `aliases` | string[] | 是 | 别名 / 称号 |
| `roleTypes` | enum[] | 是 | 叙事功能 |
| `status` | enum | 是 | 人物状态 |
| `importance` | enum | 是 | `primary`、`major`、`supporting`、`minor` |
| `profileId` | string | 是 | 档案 ID |
| `voiceProfileId` | string | 否 | 声音档案 |
| `factionIds` | string[] | 是 | 阵营 |
| `worldItemIds` | string[] | 是 | 相关设定 |
| `relationIds` | string[] | 是 | 关系 |
| `arcIds` | string[] | 是 | 人物弧光 |
| `sourceInspirationIds` | string[] | 是 | 来源灵感 |
| `firstAppearanceChapterId` | string | 否 | 首次出场 |
| `lastAppearanceChapterId` | string | 否 | 最近出场 |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.2 CharacterStatus

| 值 | 说明 |
|---|---|
| `draft` | 草案 |
| `active` | 活跃 |
| `inactive` | 暂时离场 |
| `missing` | 失踪 |
| `dead` | 死亡 |
| `returned` | 回归 |
| `archived` | 已归档 |

### 9.3 CharacterRoleType

| 值 | 说明 |
|---|---|
| `protagonist` | 主角 |
| `antagonist` | 反派 / 主要阻力来源 |
| `majorSupporting` | 主要配角 |
| `minorSupporting` | 次要配角 |
| `mentor` | 导师 |
| `ally` | 盟友 |
| `rival` | 对手 |
| `factionRepresentative` | 群体 / 组织代表 |

### 9.4 CharacterProfile

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `profileId` | string | 是 | 档案 ID |
| `characterId` | string | 是 | 人物 ID |
| `novelId` | string | 是 | 所属小说 |
| `identity` | string | 是 | 身份 |
| `publicIdentity` | string | 否 | 对外身份 |
| `hiddenIdentity` | string | 否 | 隐藏身份 |
| `externalGoal` | string | 是 | 外部目标 |
| `innerDesire` | string | 否 | 内在欲望 |
| `fear` | string | 否 | 恐惧 |
| `coreWound` | string | 否 | 核心创伤 |
| `secret` | string | 否 | 秘密 |
| `weakness` | string | 否 | 弱点 |
| `strengths` | string[] | 是 | 优势 |
| `values` | string[] | 是 | 价值观 |
| `misbelief` | string | 否 | 错误信念 |
| `currentMotivation` | string | 是 | 当前动机 |
| `stakes` | string | 否 | 失败代价 |
| `skills` | string[] | 是 | 能力 |
| `limitations` | string[] | 是 | 限制 |

### 9.5 CharacterRelation

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `relationId` | string | 是 | 关系 ID |
| `novelId` | string | 是 | 所属小说 |
| `sourceCharacterId` | string | 是 | 关系发出方 |
| `targetCharacterId` | string | 是 | 关系接收方 |
| `type` | enum | 是 | 关系类型 |
| `direction` | enum | 是 | `oneWay`、`mutual` |
| `publicRelation` | string | 否 | 公开关系 |
| `trueRelation` | string | 否 | 真实关系 |
| `sourcePerception` | string | 否 | source 的认知 |
| `targetPerception` | string | 否 | target 的认知 |
| `trustLevel` | number | 是 | 信任度，-5 到 5 |
| `affectionLevel` | number | 是 | 情感度，-5 到 5 |
| `powerBalance` | number | 是 | 权力平衡，-5 到 5 |
| `status` | enum | 是 | `active`、`strained`、`broken`、`hidden`、`ended` |
| `beatIds` | string[] | 是 | 关系变化 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.6 CharacterRelationType

| 值 | 说明 |
|---|---|
| `family` | 亲属 |
| `friendship` | 朋友 |
| `romance` | 爱情 |
| `mentorStudent` | 师徒 |
| `alliance` | 盟友 |
| `rivalry` | 对手 |
| `hostility` | 敌对 |
| `hierarchy` | 上下级 |
| `debt` | 债务 / 恩情 |
| `interestCooperation` | 利益合作 |
| `hidden` | 隐藏关系 |

### 9.7 CharacterRelationBeat

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `relationBeatId` | string | 是 | 变化 ID |
| `relationId` | string | 是 | 关系 ID |
| `novelId` | string | 是 | 所属小说 |
| `chapterId` | string | 否 | 章节 |
| `eventNodeId` | string | 否 | 事件节点 |
| `beforeState` | object | 是 | 变化前 |
| `afterState` | object | 是 | 变化后 |
| `cause` | string | 是 | 变化原因 |
| `confirmed` | boolean | 是 | 是否确认 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.8 CharacterArc

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `characterArcId` | string | 是 | 弧光 ID |
| `characterId` | string | 是 | 人物 ID |
| `novelId` | string | 是 | 所属小说 |
| `type` | enum | 是 | 弧光类型 |
| `title` | string | 是 | 标题 |
| `startingState` | string | 是 | 起点 |
| `coreConflict` | string | 是 | 核心冲突 |
| `desiredEndState` | string | 是 | 预期终点 |
| `actualEndState` | string | 否 | 实际终点 |
| `arcIds` | string[] | 是 | 涉及故事篇章 |
| `beatIds` | string[] | 是 | 弧光节点 |
| `status` | enum | 是 | `draft`、`active`、`stalled`、`complete`、`abandoned` |

### 9.9 CharacterArcType

| 值 | 说明 |
|---|---|
| `positiveGrowth` | 正向成长 |
| `negativeFall` | 负向堕落 |
| `steadfast` | 平稳坚守 |
| `redemption` | 救赎 |
| `tragedy` | 悲剧 |
| `awakening` | 觉醒 |
| `identityReveal` | 身份揭示 |

### 9.10 CharacterArcBeat

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `arcBeatId` | string | 是 | 节点 ID |
| `characterArcId` | string | 是 | 人物弧光 ID |
| `novelId` | string | 是 | 所属小说 |
| `type` | enum | 是 | `setup`、`pressure`、`choice`、`turningPoint`、`regression`、`revelation`、`resolution` |
| `chapterId` | string | 否 | 章节 |
| `eventNodeId` | string | 否 | 泳道节点 |
| `summary` | string | 是 | 摘要 |
| `stateChange` | string | 是 | 状态变化 |
| `confirmed` | boolean | 是 | 是否确认 |

### 9.11 CharacterStateSnapshot

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `snapshotId` | string | 是 | 快照 ID |
| `characterId` | string | 是 | 人物 ID |
| `novelId` | string | 是 | 所属小说 |
| `chapterId` | string | 否 | 章节 |
| `eventNodeId` | string | 否 | 事件节点 |
| `locationId` | string | 否 | 地点 |
| `physicalState` | string | 否 | 身体状态 |
| `emotionalState` | string | 否 | 情绪状态 |
| `currentGoal` | string | 是 | 当前目标 |
| `currentMotivation` | string | 是 | 当前动机 |
| `resources` | string[] | 是 | 资源 |
| `limitations` | string[] | 是 | 限制 |
| `relationshipChanges` | string[] | 是 | 关系变化 |
| `knowledgeRefIds` | string[] | 是 | 知情引用 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.12 CharacterVoiceProfile

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `voiceProfileId` | string | 是 | 声音档案 ID |
| `characterId` | string | 是 | 人物 ID |
| `novelId` | string | 是 | 所属小说 |
| `tone` | string | 否 | 语气 |
| `vocabularyStyle` | string | 否 | 词汇风格 |
| `sentencePattern` | string | 否 | 句式倾向 |
| `politenessLevel` | number | 否 | 礼貌程度，1 到 5 |
| `emotionalExpression` | string | 否 | 情绪表达 |
| `catchphrases` | string[] | 是 | 口头禅 |
| `forbiddenPhrases` | string[] | 是 | 禁用表达 |
| `addressRules` | object[] | 是 | 对不同人物的称呼 |
| `sampleDialogueIds` | string[] | 是 | 对白样本引用 |

### 9.13 CharacterAppearance

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `appearanceId` | string | 是 | 出场记录 ID |
| `characterId` | string | 是 | 人物 ID |
| `novelId` | string | 是 | 所属小说 |
| `chapterId` | string | 是 | 章节 |
| `sceneIds` | string[] | 是 | 场景 |
| `roleInChapter` | string | 否 | 本章功能 |
| `wordPresenceEstimate` | number | 否 | 戏份估算 |
| `hasDialogue` | boolean | 是 | 是否有对白 |
| `stateChanged` | boolean | 是 | 状态是否变化 |

### 9.14 CharacterKnowledgeRef

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `knowledgeRefId` | string | 是 | 引用 ID |
| `characterId` | string | 是 | 人物 ID |
| `novelId` | string | 是 | 所属小说 |
| `informationStateId` | string | 是 | 线索系统信息状态 ID |
| `knowledgeState` | enum | 是 | `unknown`、`missed`、`suspects`、`misunderstands`、`knowsPartial`、`knowsTruth`、`conceals` |
| `effectiveFromChapterId` | string | 否 | 生效章节 |
| `sourceObjectIds` | string[] | 是 | 知情依据 |

### 9.15 CharacterReviewReport

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `reportId` | string | 是 | 报告 ID |
| `novelId` | string | 是 | 所属小说 |
| `scopeType` | enum | 是 | `character`、`chapter`、`arc`、`novel` |
| `scopeId` | string | 否 | 范围 ID |
| `findings` | `CharacterFinding[]` | 是 | 问题 |
| `modelId` | string | 是 | 使用模型 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.16 CharacterFinding

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `findingId` | string | 是 | 问题 ID |
| `type` | enum | 是 | `motivationGap`、`relationshipJump`、`knowledgeLeak`、`abilityDrift`、`voiceDrift`、`arcStall`、`supportingCharacterThin`、`appearanceGap` |
| `severity` | enum | 是 | `info`、`warning`、`danger` |
| `summary` | string | 是 | 摘要 |
| `relatedCharacterIds` | string[] | 是 | 相关人物 |
| `relatedObjectIds` | string[] | 是 | 相关章节 / 节点 |
| `suggestedAction` | string | 否 | 建议动作 |
| `requiresUserConfirmation` | boolean | 是 | 是否确认 |

## 10. 状态机

### 10.1 人物状态

```text
draft → active → inactive → returned
                 ↓
               missing
                 ↓
               returned
```

终止分支：

```text
active / inactive / missing → dead
active / inactive / dead → archived
```

死亡、回归、归档必须有事件依据并经用户确认。

### 10.2 关系状态

```text
active → strained → broken
   ↓         ↓
 hidden     ended
```

关系状态变化必须通过 `CharacterRelationBeat` 记录。

### 10.3 人物弧光状态

```text
draft → active → complete
           ↓
        stalled
           ↓
        active
```

废弃分支：

```text
draft / active / stalled → abandoned
```

## 11. Agent 行为

### 11.1 可以自动执行

- 生成人物草案。
- 推荐人物目标、缺陷和秘密。
- 推荐关系候选。
- 推荐人物弧光节点。
- 从已确认章节提取状态快照草案。
- 检查动机、关系、知识、能力和对白一致性。
- 检查配角长期缺席和功能薄弱。
- 为章节写作整理人物上下文。

### 11.2 必须用户确认

- 创建正式人物。
- 修改人物核心身份、秘密和目标。
- 修改关系真实状态。
- 标记死亡、失踪、背叛、回归。
- 改变人物知情状态为知道真相。
- 完成人物弧光。
- 写入 Character Memory。
- 修改已发布章节对应的状态事实。

### 11.3 Agent 建议格式

必须包含：

```text
建议类型
涉及人物
当前事实
发现问题
剧情依据
风险等级
建议动作
是否需要用户确认
推荐模型 / Skill
来源引用
```

## 12. Skill 调用

| Skill | 触发场景 |
|---|---|
| 人物草案生成 | 从灵感、简介或大纲生成人物 |
| 人物档案补全 | 补充目标、恐惧、秘密、弱点 |
| 人物关系分析 | 建立或检查关系 |
| 人物弧光设计 | 设计成长 / 堕落 / 救赎路径 |
| 人物动机检查 | 检查行为是否有动机依据 |
| 人物知情检查 | 检查角色是否知道不该知道的信息 |
| 对白风格检查 | 检查声音是否漂移 |
| 配角存在感检查 | 检查配角是否工具化或长期消失 |
| 章节人物上下文整理 | 为写作加载相关人物资料 |

Skill 输出必须包含人物 ID、来源、建议、风险、模型和确认要求。

## 13. 模型选择规则

| 场景 | 推荐模型类型 |
|---|---|
| 人物灵感发散 | 创意发散模型 |
| 人物档案补全 | 创意发散或长文本写作模型 |
| 人物弧光设计 | 深度推理模型 |
| 关系变化检查 | 深度推理模型 |
| 知情状态检查 | 深度推理模型 |
| 对白风格检查 | 风格模仿模型或审校模型 |
| 全书人物一致性审查 | 深度推理模型，按人物或 Arc 分段 |
| 章节人物上下文整理 | 工具调用模型 |

高成本全书审查必须提醒；模型推荐必须说明理由。

## 14. 长期记忆读写

### 14.1 可读取

- Project Memory。
- Core Canon Memory。
- Character Memory。
- World Memory。
- Clue Memory。
- Style Memory。

### 14.2 可写入

用户确认后可以写入：

- Character Memory：身份、目标、秘密、关系、状态、弧光。
- Style Memory：人物声音规则。
- Core Canon Memory：对故事不可逆的重要人物事实。

不得自动写入：

- 人物死亡。
- 核心身份揭示。
- 背叛。
- 重大关系变化。
- 知道真相。

### 14.3 与 RAG 的关系

人物系统向上下文引擎提供人物档案、状态快照、关系变化、出场记录和对白样本。RAG 负责查找相关资料，不得覆盖结构化人物事实。

## 15. 可视化要求

### 15.1 人物列表

展示姓名、角色功能、状态、阵营、当前目标、最近出场、风险。

### 15.2 人物详情

包含：

- 身份与动机。
- 人物弧光。
- 当前状态。
- 关系。
- 知情状态。
- 线索参与。
- 世界观归属。
- 出场记录。
- 对白风格。
- Agent 建议。

### 15.3 人物关系图

节点代表人物，边代表关系。必须支持：

- 方向。
- 类型。
- 信任、情感、权力强度。
- 公开关系与真实关系。
- 随章节查看关系变化。

### 15.4 人物弧光视图

按时间展示：

```text
起点 → 压力 → 选择 → 转折 → 回退 / 觉醒 → 结局
```

并可跳转到 Arc、Chapter 和 EventNode。

### 15.5 人物知情视图

展示人物知道、怀疑、误解、隐藏的线索和秘密。

## 16. 异常情况

### 16.1 人物缺少核心目标

- 草案允许保存。
- active 前必须补充目标和动机。

### 16.2 关系跳变

- 创建 `relationshipJump` finding。
- 要求关联事件依据。
- 不自动改关系。

### 16.3 人物知识越界

- 创建 `knowledgeLeak` finding。
- 指明知识来源缺失的章节。

### 16.4 人物能力突然变化

- 创建 `abilityDrift` finding。
- 检查是否有训练、道具或设定依据。

### 16.5 删除已出场人物

- 显示影响范围。
- 已发布章节关联人物默认不能硬删除，只能归档。

### 16.6 跨小说复用人物

- 默认复制为新人物。
- 可建立只读来源引用。
- 不共享可变状态和记忆。

## 17. 验收标准

### 17.1 数据隔离

- 所有人物对象必须有 `novelId`。
- 切换小说不能显示上一小说人物。
- 跨小说不共享可变人物事实。

### 17.2 人物档案

- 用户可以创建人物。
- active 人物具备姓名、身份、角色功能、目标和动机。
- 灵感可转成人物草案并保留来源。

### 17.3 关系

- 可建立有方向关系。
- 可区分公开关系、真实关系和双方认知。
- 关系变化必须有 RelationBeat。

### 17.4 弧光

- 可创建人物弧光。
- 弧光至少有起点、转折和终点。
- 弧光节点可关联泳道节点和章节。

### 17.5 状态和出场

- 可记录章节级人物状态快照。
- 可查看人物出场记录。
- 新状态不覆盖历史状态。

### 17.6 知情状态

- 人物可关联线索系统 InformationState。
- 系统能发现知识越界和误解冲突。

### 17.7 Agent 审查

- 能检查动机、关系、知识、能力、声音和人物弧光。
- 报告必须生成 `CharacterReviewReport`。
- 高风险修改必须等待用户确认。

### 17.8 可视化

- 人物关系图支持方向和关系变化。
- 人物弧光视图支持跳转到章节 / 节点。
- 人物详情展示线索、世界观、状态和对白风格。

### 17.9 记忆和 RAG

- 写入 Character Memory 必须用户确认。
- RAG 结果不能覆盖人物事实。
- 章节写作可以检索人物档案、状态和对白样本。

## 18. 后续版本

### 18.1 V2

- 人物关系时间滑块。
- 嫌疑人矩阵。
- 群像戏份平衡。
- 对白样本自动提取。
- 人物视觉资产。
- 人物模板。

### 18.2 V3

- 多人协作人物档案。
- 跨小说宇宙人物引用。
- 复杂社会网络模拟。
- 读者人物偏好分析。

## 19. 与其他 spec 的边界

| 相关 spec | 边界 |
|---|---|
| `01-novel-project-spec.md` | 定义人物空间和数据隔离；本 spec 定义人物内部模型 |
| `02-novel-cockpit-spec.md` | Cockpit 展示人物摘要；本 spec 定义人物完整管理 |
| `03-inspiration-vault-spec.md` | 灵感库生成人物草案；本 spec 负责确认 |
| `04-arc-swimlane-diagram-spec.md` | 泳道图展示人物弧光节点；本 spec 是人物事实源 |
| `05-clue-foreshadowing-spec.md` | 线索系统定义 InformationState；本 spec 引用人物知情状态 |
| `07-worldbuilding-system-spec.md` | 世界观系统定义阵营、身份和规则；本 spec 引用这些对象 |
| `08-chapter-writing-spec.md` | 写作系统读取人物上下文；本 spec 不生成完整正文 |
| `09-chapter-review-spec.md` | 审查系统调用人物一致性检查 |
| `10-agent-orchestration-spec.md` | 编排系统执行人物相关任务 |
| `12-rag-context-engine-spec.md` | 上下文引擎检索人物资料；本 spec 是结构化事实源 |
| `13-long-term-memory-spec.md` | 长期记忆保存确认后的人物事实 |
