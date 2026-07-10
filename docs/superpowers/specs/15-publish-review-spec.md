# 15 Publish Review Spec

状态：Review Candidate

日期：2026-07-10

上游依赖：

- `01-novel-project-spec.md`：定义小说项目、项目成员、版本策略、项目级配置与 `novelId` 隔离。
- `02-novel-cockpit-spec.md`：提供发布中心入口、全书状态总览和待处理风险摘要。
- `03-inspiration-vault-spec.md`：发布审核可检查灵感是否已转化、废弃或仍有未处理素材，但不修改灵感库。
- `04-arc-swimlane-diagram-spec.md`：提供篇章、事件、剧情推进、伏笔线和时间线结构。
- `05-clue-foreshadowing-spec.md`：提供线索、伏笔、误导、触发者、提供者、接收者和回收状态。
- `06-character-system-spec.md`：提供人物设定、弧光、关系、知情状态和一致性证据。
- `07-worldbuilding-system-spec.md`：提供世界观规则、设定揭示、禁忌、地域、组织和术语一致性。
- `08-chapter-writing-spec.md`：提供章节正文版本、写作任务书、章节状态卡和可修改的正文边界。
- `09-chapter-review-spec.md`：提供单章、跨章和篇章审查结果。
- `10-agent-orchestration-spec.md`：负责编排发布审核中的多步骤任务、重试、暂停和人工确认。
- `11-model-router-spec.md`：为不同审查维度选择模型，并记录模型选择原因。
- `12-rag-context-engine-spec.md`：为发布审核提供冻结快照、证据检索和上下文包。
- `13-long-term-memory-spec.md`：沉淀发布审核经验、平台偏好和项目级质量规则。
- `14-skill-system-spec.md`：提供可复用的发布审查、敏感内容扫描、导出校验和报告生成 Skill。

下游依赖：

- 实现计划：把 15 份 spec 拆成可执行里程碑、数据模型、接口、UI 和测试任务。

相关底座文档：`2026-07-08-novel-agent-product-foundation-design.md`

## 1. 功能定位

Publish Review System 是 Novel Agent 的发布前质量门禁系统。它面向“我准备把这一章、一个篇章、一个分卷或整本小说拿去发布 / 交稿 / 导出”这个场景，汇总结构、人物、世界观、线索、文风、平台信息、敏感风险、版权风险和导出格式等结果，形成可追踪、可复审、可批准的发布结论。

它不是一个自动投稿器，也不是法律合规保证器，更不是第二套章节审查系统。

它负责：

1. 为待发布内容创建固定的 `ReleaseCandidate`。
2. 冻结被审查的正文、设定、线索、人物、世界观和上下文证据。
3. 按发布范围执行多维度检查。
4. 合并已有章节审查结果，避免重复发现同一个问题。
5. 将问题分成提醒、建议、轻微问题、重大问题和发布阻断项。
6. 把阻断项转化为可处理的修复计划。
7. 支持用户接受、忽略、豁免、退回修改或重新审核。
8. 在发布前保留人工批准门禁。
9. 生成发布报告、导出清单和可归档的审核记录。
10. 将确认有效的发布经验沉淀为项目级规则或记忆候选。

一句话定义：

> Publish Review System 是小说从“可写”进入“可发布”之前的证据化门禁层；它判断发布准备度，组织修复闭环，但不替作者承担最终发布决定。

## 2. 系统边界

### 2.1 与 Chapter Review 的边界

| Chapter Review | Publish Review |
|---|---|
| 发现正文质量问题 | 判断是否达到发布条件 |
| 以章节或章节区间为核心 | 以发布候选版本为核心 |
| 输出 `ReviewFinding`、`RevisionTask` | 输出 `PublishReviewFinding`、`PublishBlocker`、`ReleasePackage` |
| 重点是怎么改 | 重点是能不能发布、还有什么风险 |
| 可多轮精修 | 发布前聚合门禁 |
| 检查局部正文 | 汇总局部、篇章、全书和平台维度 |

Publish Review 可以引用 Chapter Review 的结果，但不能把所有单章审查逻辑重新实现一遍。

### 2.2 与 Chapter Writing 的边界

| Chapter Writing | Publish Review |
|---|---|
| 写作和改写正文 | 不直接改写正文 |
| 生成章节草稿、修订稿 | 创建发布候选版本 |
| 执行作者批准的修改任务 | 生成修复建议和 `ChangeSetCandidate` |
| 管理正文版本 | 冻结待发布版本并记录审核结论 |

Publish Review 可以提出修改计划，但实际改写必须回到 Chapter Writing 或 Revision Flow 中执行。

### 2.3 与外部发布平台的边界

MVP 不执行自动投稿、自动登录、自动上传、自动支付或自动签约。

MVP 只做到：

- 选择目标平台或通用平台配置。
- 按平台配置检查字数、标题、简介、标签、敏感项和导出格式。
- 生成导出包和发布准备报告。
- 由用户手动复制、下载、上传或归档。

外部平台规则会变化。如果用户要求针对某个真实平台的最新规则，需要通过官方来源刷新平台规则配置，不能依赖内置记忆猜测。

### 2.4 与法律 / 合规的边界

系统可以标记版权、敏感内容、相似表达、未授权素材、隐私泄露和政策风险，但不提供法律意见，也不保证一定合规。

所有合规结论必须以“风险提示”表达，并保留：

- 依据来源。
- 置信度。
- 不确定点。
- 用户最终判断入口。

### 2.5 与 Orchestrator、Subagent、Skill 的边界

| 层级 | 职责 |
|---|---|
| Publish Review System | 定义发布审核业务对象、流程、门禁和 UI |
| Orchestrator | 拆分审核任务、调度 Subagent / Skill、处理重试和汇总 |
| Subagent | 承担连续角色，例如发布审校、合规审查、结构统筹 |
| Skill | 执行可复用检查，例如线索回收扫描、导出格式校验 |
| Model Router | 为不同检查选择模型 |
| Context Engine | 提供可追溯上下文和证据 |
| Long-Term Memory | 保存用户确认过的发布偏好和质量规则 |

Publish Review 不直接越权调用任意模型或读写长期记忆，必须通过这些系统的契约完成。

## 3. 用户角色与入口

### 3.1 用户角色

#### 独立作者

希望在发布前知道“这一章能不能发”“有没有明显坑没填”“标题简介是否准备好”。

#### 长篇连载作者

关注跨章连续性、伏笔回收、人物知情状态、更新时间线、读者期待和断章位置。

#### 精修型作者

关注文风统一、节奏起伏、对白质感、主题表达、章节功能和可读性。

#### 编辑 / 审校角色

配置审查模板、平台门槛、阻断标准、豁免规则和最终批准。

#### Agent 任务发起者

通过自然语言发起任务，例如：

- “检查第 12 章能不能发布。”
- “把第一卷做发布前总审。”
- “生成晋江版发布包。”
- “检查这一卷所有伏笔是否有回收计划。”

### 3.2 主入口

```text
Novel Cockpit
  → Publish Center
  → 创建发布审核
```

Publish Center 是发布审核的稳定入口，适合放在左侧导航中，与 Projects、Inspiration、Characters、Worldbuilding、Outline、Review 并列。

### 3.3 辅助入口

```text
章节编辑器
  → 当前章节状态卡
  → 发布前检查
```

```text
篇章泳道图
  → Arc 菜单
  → 审核整个篇章
```

```text
线索系统
  → 线索回收看板
  → 加入发布审核
```

```text
任务编排面板
  → 新建 Agent Task
  → Publish Review
```

### 3.4 入口页必须展示的摘要

入口页不应只放一个“开始审核”按钮。它需要先告诉用户当前作品离发布还有多远：

- 最近一个 `ReleaseCandidate`。
- 当前待处理阻断项数量。
- 最近一次审核结论。
- 待发布范围。
- 目标平台配置。
- 已冻结正文版本。
- 最近失败的检查。
- 需要人工确认的豁免项。
- 可生成的导出包类型。

## 4. 核心目标

### 4.1 发布准备度判断

系统必须能回答：

1. 这批内容能不能发布？
2. 如果不能，阻断原因是什么？
3. 哪些问题只是建议，哪些问题必须处理？
4. 每个问题证据在哪里？
5. 修复后需要复审哪些部分？

### 4.2 全链路证据化

每个有效发现都必须至少关联一种证据：

- 正文片段。
- 章节版本。
- 人物设定。
- 世界观规则。
- 线索节点。
- 篇章事件。
- 审查规则。
- 平台配置。
- 用户自定义偏好。

如果证据不足，不能硬给结论，必须标记为“证据不足，需要人工判断”。

### 4.3 发布候选版本可复现

每次发布审核必须绑定固定快照：

- 正文版本。
- 章节范围。
- 篇章结构版本。
- 人物设定版本。
- 世界观设定版本。
- 线索图版本。
- 审查模板版本。
- Skill 版本。
- 模型选择记录。
- RAG 检索参数和证据来源。

同一 `ReleaseCandidate` 的审核结论不能随后台数据变化而悄悄改变。

### 4.4 人工最终批准

系统可以建议“Ready”，但不能默认替用户发布或批准。

所有对外发布、导出归档、平台上传、正式交稿类动作都必须经过显式人工批准。

### 4.5 面向长篇小说

普通文章发布检查只看标题、错字、格式和敏感词。小说发布审核还必须关注：

- 跨章时间线是否断裂。
- 伏笔是否种下但没有承接计划。
- 人物是否知道不该知道的信息。
- 世界观规则是否被正文违反。
- 章节断点是否服务读者期待。
- 长期主题和情绪线是否保持一致。
- 连载节奏和篇章承诺是否兑现。

## 5. MVP

MVP 需要完成“发布审核闭环”，而不是一口气做完整平台生态。

### 5.1 发布审核创建

用户可以选择：

- 小说项目。
- 审核范围。
- 目标平台配置。
- 审核模板。
- 是否包含已有审查结果。
- 是否生成导出包。

审核范围必须至少支持：

- 单章。
- 章节区间。
- 一个篇章 / Arc。
- 一个分卷 / Volume。
- 整本小说。

### 5.2 Release Candidate

系统必须创建 `ReleaseCandidate`，用于冻结待发布内容。

它至少包含：

- `releaseCandidateId`
- `novelId`
- `scope`
- `sourceSnapshot`
- `targetProfileId`
- `createdBy`
- `createdAt`
- `status`
- `approvalState`

### 5.3 默认审核模板

MVP 至少内置 4 套模板：

1. 通用章节发布模板。
2. 连载平台章节模板。
3. 篇章 / 分卷总审模板。
4. 整本小说交稿模板。

模板可配置，但 MVP 不需要开放完整模板市场。

### 5.4 发现与阻断项

系统必须把问题拆成：

- `PublishReviewFinding`：普通发现。
- `PublishBlocker`：发布阻断项。
- `PublishFixPlan`：修复计划。
- `ChangeSetCandidate`：可选修改候选。

阻断项必须有负责人、状态、证据和处理结论。

### 5.5 审核报告

每次审核必须生成报告：

- 总体结论。
- 分维度状态。
- 阻断项。
- 主要风险。
- 可忽略建议。
- 已豁免问题。
- 证据链接。
- 下一步建议。

### 5.6 人工批准门禁

MVP 必须实现：

- 批准。
- 拒绝。
- 请求修改。
- 豁免某个问题。
- 撤销批准。

批准记录必须可审计。

### 5.7 导出准备

MVP 支持生成 `ReleasePackage` 和 `PublishExportManifest`。

导出包可以包含：

- 正文。
- 标题。
- 简介。
- 标签。
- 作者备注。
- 审核报告。
- 导出清单。

MVP 不要求直接发布到外部平台。

### 5.8 历史记录

用户能看到：

- 历史发布候选版本。
- 历史审核结论。
- 同一候选版本的多轮复审。
- 每轮修复前后的变化。
- 谁批准、谁豁免、何时发生。

## 6. 非 MVP

以下内容明确不进入 MVP：

1. 自动登录第三方小说平台。
2. 自动上传、自动定时发布、自动签约或自动收费。
3. 网络级全网查重。
4. 法律意见或合规保证。
5. 实时同步所有平台最新审核政策。
6. 复杂团队工作流，例如多编辑并行审批、合同审批、财务审核。
7. 读者评论分析驱动的自动改稿。
8. 出版社级排版、ISBN、纸书印刷流程。
9. 多语言本地化发布全流程。
10. 面向影视改编、漫画改编或游戏改编的版权包导出。
11. 自动把“建议项”直接改入正文。
12. 对未授权外部素材做实质版权判断。

这些能力可以作为后续扩展，但不能污染 MVP 的核心边界。

## 7. 发布审查范围

### 7.1 Scope 类型

`PublishReviewScope` 描述审核范围。

| scopeType | 说明 | 典型用途 |
|---|---|---|
| `chapter` | 单章 | 连载日更前检查 |
| `chapterRange` | 章节区间 | 连发、活动更新、批量修订后检查 |
| `arc` | 单个篇章 | 一个完整故事单元发布前检查 |
| `volume` | 分卷 | 分卷完结、阶段性归档 |
| `novel` | 整本小说 | 完本、交稿、导出全书 |
| `customBundle` | 自定义集合 | 番外、试读包、投稿样章 |

### 7.2 范围选择原则

范围越大，检查越偏向结构、连续性和长期承诺；范围越小，检查越偏向正文、标题、断点和平台信息。

| 范围 | 主要关注 |
|---|---|
| 单章 | 错字、格式、章节目标、断点、敏感风险、单章连贯性 |
| 章节区间 | 事件连续性、人物状态、重复信息、节奏密度 |
| 篇章 | 故事闭环、伏笔推进、反转兑现、主题递进 |
| 分卷 | 阶段承诺、世界观揭示、角色弧光、读者期待 |
| 整本 | 全局一致性、结构完整、主线闭环、出版级风险 |

### 7.3 发布目标

`targetProfile` 不等同于真实平台账号，而是发布检查配置。

MVP 支持：

- 通用 Web 连载。
- 轻量平台连载。
- 私人归档。
- 编辑交稿。
- 自定义配置。

配置项包括：

- 字数范围。
- 标题要求。
- 简介要求。
- 标签要求。
- 作者有话说。
- 敏感内容策略。
- 格式规则。
- 章节命名规则。
- 是否允许章节末尾强悬念。
- 是否要求摘要。

### 7.4 快照范围

发布审核必须冻结：

- 待发布正文。
- 章节元数据。
- 章节顺序。
- 篇章归属。
- 事件节点。
- 线索图。
- 人物卡。
- 世界观规则。
- 审查模板。
- 目标平台配置。

对于尚未纳入快照的外部材料，系统不能把它当成确定证据。

## 8. 审查维度与决策

### 8.1 默认审查维度

发布审核采用分维度状态，不用一个虚假的总分掩盖问题。

| 维度 | 说明 | 可能阻断 |
|---|---|---|
| `contentCompleteness` | 内容是否完整，章节是否缺正文、缺结尾或缺元数据 | 是 |
| `structureContinuity` | 篇章结构、事件顺序、剧情推进是否连续 | 是 |
| `chapterContinuity` | 章节之间时间、地点、状态是否连贯 | 是 |
| `characterConsistency` | 人物动机、知情状态、关系和弧光是否一致 | 是 |
| `worldConsistency` | 世界观规则、术语、地点、组织和能力限制是否一致 | 是 |
| `clueForeshadowingPayoff` | 线索、伏笔、误导和回收计划是否清晰 | 是 |
| `styleTone` | 文风、叙述视角、语言质感是否稳定 | 否，除非用户设为门禁 |
| `pacingReadability` | 节奏、信息密度、断点和阅读体验 | 否，除非严重 |
| `sensitiveContentPolicy` | 敏感内容、暴力、性、仇恨、未成年人、隐私等风险 | 是 |
| `platformMetadata` | 标题、简介、标签、分类、封面素材状态等元信息 | 是 |
| `copyrightOriginalityRisk` | 未授权素材、明显撞梗、可疑引用和相似表达风险 | 是 |
| `exportFormat` | 导出格式、章节顺序、编码、换行、文件清单 | 是 |
| `authorIntent` | 是否符合作者本次发布目标和承诺 | 否 |
| `readerExperience` | 读者是否能理解、期待是否被合理管理 | 否 |

### 8.2 发现严重程度

| severity | 含义 | 默认处理 |
|---|---|---|
| `info` | 信息提示 | 不影响发布 |
| `suggestion` | 优化建议 | 用户可忽略 |
| `minor` | 轻微问题 | 建议处理，不默认阻断 |
| `major` | 重大风险 | 需要处理或明确豁免 |
| `blocker` | 发布阻断 | 未处理前不能批准 |

### 8.3 结论类型

`PublishReviewDecision` 取值：

| decision | 含义 |
|---|---|
| `ready` | 无阻断项，关键维度通过，可以进入人工批准 |
| `readyWithWarnings` | 无阻断项，但存在建议或轻微风险 |
| `needsRevision` | 存在重大问题，需要修改或豁免 |
| `blocked` | 存在不可发布阻断项 |
| `inconclusive` | 证据不足，不能给出可靠结论 |
| `failed` | 审核流程失败，不代表内容可发布 |

系统不得把 `failed` 当成 `ready`。

### 8.4 门禁规则

默认发布门禁：

- 任意 `blocker` 未解决 → `blocked`。
- 任意必需元数据缺失 → `blocked`。
- 正文快照缺失或版本冲突 → `blocked`。
- 敏感内容高风险且未人工确认 → `blocked`。
- 导出格式校验失败 → `blocked`。
- 证据不足影响核心判断 → `inconclusive`。
- 只有建议和轻微问题 → `readyWithWarnings`。

项目可以配置更严格的门禁，例如：

- 文风一致性低于阈值也阻断。
- 所有伏笔必须有回收计划。
- 每章必须有作者备注。
- 标题必须符合固定命名格式。

### 8.5 豁免规则

用户可以豁免问题，但必须记录：

- 豁免原因。
- 豁免人。
- 豁免时间。
- 豁免适用范围。
- 是否仅对当前候选版本有效。
- 是否需要在后续版本重新检查。

系统不能自动豁免 `blocker`。

## 9. 核心数据对象

### 9.1 PublishReviewProfile

发布审核配置档案。

字段：

- `profileId`
- `novelId`
- `name`
- `description`
- `scopeTypes`
- `defaultChecklistTemplateIds`
- `targetProfileIds`
- `gateRules`
- `severityMapping`
- `enabledSkillIds`
- `modelPolicy`
- `memoryPolicy`
- `createdBy`
- `createdAt`
- `updatedAt`

说明：

- 项目可以有多个审核档案。
- 档案必须绑定 `novelId` 或标记为只读系统模板。
- 用户修改系统模板时应复制为项目模板。

### 9.2 PlatformPolicyProfile

目标平台或发布场景配置。

字段：

- `targetProfileId`
- `novelId`
- `name`
- `profileType`
- `source`
- `version`
- `wordCountRange`
- `metadataRequirements`
- `contentRiskPolicy`
- `formatRules`
- `chapterTitleRules`
- `tagRules`
- `summaryRules`
- `updatedAt`
- `requiresFreshExternalCheck`

`source` 可以是：

- `systemGeneric`
- `userDefined`
- `officialImported`
- `teamDefined`

如果 `requiresFreshExternalCheck = true`，系统必须提示用户平台规则可能过期。

### 9.3 PublishReviewRun

一次发布审核执行。

字段：

- `publishReviewRunId`
- `novelId`
- `releaseCandidateId`
- `profileId`
- `targetProfileId`
- `scope`
- `status`
- `decision`
- `startedBy`
- `startedAt`
- `completedAt`
- `checklistSnapshot`
- `contextBundleIds`
- `skillInvocationIds`
- `modelTraceIds`
- `findings`
- `blockers`
- `dimensionSnapshots`
- `errorSummary`

### 9.4 ReleaseCandidate

发布候选版本。

字段：

- `releaseCandidateId`
- `novelId`
- `name`
- `scope`
- `sourceSnapshot`
- `status`
- `createdBy`
- `createdAt`
- `updatedAt`
- `approvalState`
- `approvedBy`
- `approvedAt`
- `packageIds`
- `previousCandidateId`

`sourceSnapshot` 至少包含：

- 章节版本列表。
- 篇章结构版本。
- 人物卡版本。
- 世界观版本。
- 线索图版本。
- 目标平台配置版本。

### 9.5 PublishReviewChecklistTemplate

审核清单模板。

字段：

- `templateId`
- `novelId`
- `name`
- `scopeType`
- `items`
- `defaultSeverity`
- `version`
- `isSystemTemplate`
- `createdBy`
- `updatedAt`

### 9.6 PublishReviewChecklistItem

单个检查项。

字段：

- `itemId`
- `templateId`
- `dimension`
- `title`
- `description`
- `required`
- `defaultSeverity`
- `evidenceRequirement`
- `skillId`
- `gateRuleId`
- `manualOnly`

### 9.7 PublishReviewFinding

发布审核发现。

字段：

- `findingId`
- `novelId`
- `publishReviewRunId`
- `releaseCandidateId`
- `dimension`
- `severity`
- `title`
- `description`
- `evidence`
- `affectedTargets`
- `confidence`
- `source`
- `suggestedAction`
- `status`
- `createdAt`

`source` 可以是：

- `skill`
- `subagent`
- `manual`
- `importedChapterReview`
- `formatValidator`
- `policyCheck`

### 9.8 PublishBlocker

发布阻断项。

字段：

- `blockerId`
- `novelId`
- `releaseCandidateId`
- `publishReviewRunId`
- `findingIds`
- `title`
- `reason`
- `severity`
- `ownerType`
- `ownerId`
- `status`
- `resolution`
- `waiver`
- `createdAt`
- `resolvedAt`

阻断项与发现是多对多关系。多个发现可以合并为一个阻断项，一个发现也可以触发多个阻断维度。

### 9.9 PublishFixPlan

修复计划。

字段：

- `fixPlanId`
- `novelId`
- `releaseCandidateId`
- `blockerIds`
- `findingIds`
- `steps`
- `estimatedImpact`
- `requiresWritingTask`
- `changeSetCandidateIds`
- `status`

发布系统只生成计划，不直接改稿。

### 9.10 PublishApproval

人工批准记录。

字段：

- `approvalId`
- `novelId`
- `releaseCandidateId`
- `publishReviewRunId`
- `decision`
- `approvedBy`
- `comment`
- `waiverIds`
- `createdAt`
- `revokedAt`

### 9.11 ReleasePackage

导出包。

字段：

- `packageId`
- `novelId`
- `releaseCandidateId`
- `targetProfileId`
- `format`
- `manifestId`
- `assetRefs`
- `createdBy`
- `createdAt`
- `status`
- `validationResult`

### 9.12 PublishExportManifest

导出清单。

字段：

- `manifestId`
- `novelId`
- `releaseCandidateId`
- `packageId`
- `chapterOrder`
- `includedFiles`
- `metadata`
- `formatRules`
- `checksum`
- `generatedAt`

### 9.13 PublishReviewEvent

审核事件日志。

字段：

- `eventId`
- `novelId`
- `releaseCandidateId`
- `publishReviewRunId`
- `eventType`
- `actorType`
- `actorId`
- `payload`
- `createdAt`

所有关键动作必须写事件：

- 创建候选版本。
- 开始审核。
- 完成检查。
- 生成阻断项。
- 豁免问题。
- 批准或撤销批准。
- 生成导出包。

## 10. 状态机

### 10.1 PublishReviewRun 状态机

```text
created
  → planning
  → collectingContext
  → runningChecks
  → aggregating
  → awaitingHumanApproval
  → approved

awaitingHumanApproval
  → needsRevision
  → runningChecks

awaitingHumanApproval
  → blocked

created / planning / collectingContext / runningChecks / aggregating
  → failed

created / planning / collectingContext / runningChecks / aggregating / awaitingHumanApproval
  → cancelled
```

状态说明：

| 状态 | 含义 |
|---|---|
| `created` | 审核已创建，还未规划任务 |
| `planning` | Orchestrator 正在拆分检查任务 |
| `collectingContext` | Context Engine 正在冻结快照并构建证据 |
| `runningChecks` | Skill / Subagent 正在执行检查 |
| `aggregating` | 合并发现、去重、计算门禁 |
| `awaitingHumanApproval` | 已有结论，等待人工处理 |
| `approved` | 用户批准当前候选版本 |
| `needsRevision` | 用户要求修改后复审 |
| `blocked` | 存在不可发布阻断项 |
| `failed` | 审核系统失败 |
| `cancelled` | 用户取消 |

### 10.2 ReleaseCandidate 状态机

```text
draft
  → underReview
  → changesRequested
  → underReview
  → approved
  → packaged
  → archived

draft / underReview / changesRequested / approved
  → withdrawn
```

状态说明：

- `draft`：候选版本已创建但未审核。
- `underReview`：正在审核。
- `changesRequested`：需要修改。
- `approved`：已通过人工批准。
- `packaged`：已生成导出包。
- `archived`：已归档。
- `withdrawn`：已撤回。

### 10.3 PublishBlocker 状态机

```text
open
  → assigned
  → fixProposed
  → verifying
  → resolved

verifying
  → reopened
  → assigned

open / assigned / fixProposed
  → waived
```

状态说明：

- `open`：阻断项已发现。
- `assigned`：已有负责人。
- `fixProposed`：已有修复方案。
- `verifying`：修复后等待复审。
- `resolved`：已解决。
- `reopened`：复审失败重新打开。
- `waived`：人工豁免。

### 10.4 PublishApproval 状态机

```text
pending
  → approved

pending
  → rejected

approved
  → revoked
```

批准必须只对一个具体 `ReleaseCandidate` 有效。

## 11. 标准流程

### 11.1 创建发布审核

用户从 Publish Center、章节编辑器或 Agent Task 入口发起审核。

系统需要确认：

1. `novelId`。
2. 审核范围。
3. 目标平台配置。
4. 审核模板。
5. 是否包含已有章节审查结果。
6. 是否允许生成修复建议。
7. 是否需要导出包。

### 11.2 创建 Release Candidate

系统创建 `ReleaseCandidate` 并冻结：

- 正文版本。
- 章节顺序。
- 篇章结构。
- 人物设定。
- 世界观规则。
- 线索图。
- 审核模板。
- 目标配置。

如果任一关键快照失败，审核进入 `blocked` 或 `failed`，不能继续。

### 11.3 构建 Context Bundle

Context Engine 按范围构建上下文：

- 单章：正文、前后章摘要、人物状态、线索节点、世界观规则。
- 篇章：篇章泳道图、事件链、伏笔链、人物弧光、节奏地图。
- 整本：全局大纲、分卷结构、主线、人物弧光、世界观规则、关键线索。

每个上下文包必须可追溯到固定快照。

### 11.4 编排检查任务

Orchestrator 按模板拆分任务：

- 元数据检查。
- 正文完整性检查。
- 章节连续性检查。
- 人物一致性检查。
- 世界观一致性检查。
- 线索 / 伏笔回收检查。
- 敏感内容风险检查。
- 风格和可读性检查。
- 导出格式检查。

可并行执行的检查应并行编排，但同一快照内的结论需要统一聚合。

### 11.5 执行检查

每个检查返回：

- 维度。
- 结论。
- 发现列表。
- 证据。
- 置信度。
- 不确定点。
- 建议动作。

发现必须引用具体对象，例如章节、事件、人物、线索、设定或平台规则。

### 11.6 聚合和去重

聚合器需要：

- 合并重复问题。
- 将普通发现升级为阻断项。
- 将章节审查中的未解决问题纳入发布风险。
- 标记互相矛盾的检查结论。
- 按门禁规则计算维度状态。
- 生成最终 `PublishReviewDecision`。

### 11.7 生成修复计划

对 `major` 和 `blocker` 问题，系统生成 `PublishFixPlan`。

修复计划要写清：

- 要改哪个对象。
- 为什么改。
- 改动影响哪些章节 / 线索 / 人物 / 设定。
- 建议交给哪个系统处理。
- 修复后需要复审哪些检查。

### 11.8 用户处理

用户可以：

- 查看证据。
- 接受问题。
- 忽略建议。
- 豁免阻断项。
- 创建修改任务。
- 要求重新审核。
- 批准发布候选版本。
- 撤回候选版本。

### 11.9 复审

修复后优先执行增量复审：

- 只复审受影响章节。
- 只复审相关人物 / 线索 / 世界观。
- 重新计算门禁。
- 检查是否引入新的阻断项。

如果源快照变化太大，系统应提示创建新的 `ReleaseCandidate`。

### 11.10 批准和导出

当没有未处理阻断项后，用户可以批准候选版本。

批准后系统可以：

- 生成 `ReleasePackage`。
- 生成 `PublishExportManifest`。
- 生成发布报告。
- 归档审核记录。
- 创建长期记忆候选。

## 12. 检查项与默认模板

### 12.1 通用章节发布模板

适用于单章发布。

默认检查项：

1. 正文是否存在且不是空草稿。
2. 章节标题是否存在。
3. 章节字数是否在目标范围内。
4. 章节开头是否接得上上一章。
5. 章节结尾是否完成本章功能。
6. 本章是否引入未登记人物、地点、组织或术语。
7. 本章人物知情状态是否合理。
8. 本章线索是否记录触发者、提供者和接收者。
9. 本章是否有敏感内容风险。
10. 本章是否有明显格式问题。
11. 本章是否有未解决的 `major` 级审查问题。
12. 是否需要作者备注、标签或摘要。

### 12.2 连载平台章节模板

适用于日更或周更。

在通用章节模板上增加：

1. 断章点是否有读者期待。
2. 本章信息密度是否过低或过高。
3. 是否重复上一章已充分说明的信息。
4. 是否破坏长期悬念。
5. 是否误导读者但没有后续承接。
6. 标题是否泄露核心反转。
7. 是否符合连载节奏偏好。

### 12.3 篇章 / Arc 总审模板

适用于一个完整故事单元。

默认检查项：

1. 篇章起点、转折、高潮和收束是否完整。
2. 泳道图中的关键事件是否全部落到章节。
3. 剧情推进和线索 / 伏笔泳道是否相互支撑。
4. 关键线索是否有提供者、触发者、接收者和回收计划。
5. 篇章内人物弧光是否有变化。
6. 世界观揭示是否过早、过晚或自相矛盾。
7. 反派 / 对手行动是否有逻辑。
8. 篇章承诺是否兑现。
9. 结尾是否为下一篇章留下合理动力。
10. 是否存在孤立事件或无功能场景。

### 12.4 整本小说交稿模板

适用于完本、投稿或归档。

默认检查项：

1. 主线是否完整闭合。
2. 核心人物弧光是否完成。
3. 核心世界观规则是否稳定。
4. 主要线索和伏笔是否回收或明确留白。
5. 主题表达是否统一。
6. 章节顺序、卷序和标题是否完整。
7. 全书术语是否一致。
8. 是否存在未处理的高风险敏感内容。
9. 是否存在版权或素材来源风险。
10. 全书导出格式是否正确。
11. 简介、标签、作者说明是否完整。
12. 是否存在已批准豁免项需要在报告中说明。

### 12.5 自定义模板

用户可以复制默认模板后调整：

- 启用 / 停用检查项。
- 修改严重程度。
- 指定检查项需要的 Skill。
- 指定是否必须人工确认。
- 指定是否触发发布门禁。

模板修改只影响之后创建的 `PublishReviewRun`，不能改变历史审核结论。

## 13. Skill / Subagent / Orchestrator 集成

### 13.1 Orchestrator 职责

Orchestrator 负责：

- 解析用户目标。
- 创建发布审核 DAG。
- 判断哪些任务可并行。
- 为每个任务选择 Subagent 或 Skill。
- 处理任务失败、重试和降级。
- 汇总任务结果。
- 推送人工确认节点。
- 触发复审。

Orchestrator 不直接给出发布结论，结论必须来自聚合后的审核结果和门禁规则。

### 13.2 推荐 Subagent

| Subagent | 职责 |
|---|---|
| `Release Editor` | 汇总发布准备度，维护候选版本和最终报告 |
| `Continuity Auditor` | 检查章节、人物、时间线和设定连续性 |
| `Clue Auditor` | 检查线索、伏笔、误导和回收状态 |
| `Lore Auditor` | 检查世界观规则、术语和设定揭示 |
| `Policy Reviewer` | 检查敏感内容和平台配置风险 |
| `Package Validator` | 检查导出格式、清单和元数据 |

这些角色可以是长期 Subagent，也可以由 Orchestrator 临时分配。

### 13.3 推荐 Skill

| Skill | 输入 | 输出 |
|---|---|---|
| `publish-metadata-check` | 标题、简介、标签、平台配置 | 元数据发现 |
| `release-completeness-scan` | ReleaseCandidate 快照 | 完整性结果 |
| `arc-payoff-audit` | 篇章泳道图、线索图 | 伏笔回收发现 |
| `character-state-publish-audit` | 人物卡、章节版本 | 人物一致性发现 |
| `world-rule-publish-audit` | 世界观规则、正文 | 设定冲突发现 |
| `sensitive-content-risk-scan` | 正文、平台配置 | 风险发现 |
| `style-tone-release-check` | 正文区间、风格规则 | 文风一致性发现 |
| `export-format-validator` | 导出包、格式规则 | 格式校验结果 |
| `publish-report-generator` | 聚合结果 | 发布报告 |

Skill 必须声明：

- 输入对象。
- 输出 Schema。
- 证据要求。
- 是否允许读取正文。
- 是否允许读取项目记忆。
- 模型能力要求。
- 失败时是否可降级。

### 13.4 Skill 输出约束

所有 Skill 输出必须能被聚合器处理。

最小输出：

```json
{
  "dimension": "clueForeshadowingPayoff",
  "status": "risk",
  "findings": [
    {
      "severity": "major",
      "title": "关键线索缺少接收者",
      "evidenceRefs": ["clue:old_tide_map", "chapter:3"],
      "confidence": 0.82,
      "suggestedAction": "补充谁看到旧潮汐图，以及该信息如何进入后续推理链。"
    }
  ],
  "uncertainties": []
}
```

### 13.5 任务编排示例

```text
用户：检查第一卷能不能发布

Orchestrator
  → 创建 ReleaseCandidate
  → Context Engine 冻结第一卷快照
  → 并行启动：
      - Completeness Scan
      - Continuity Auditor
      - Clue Auditor
      - Lore Auditor
      - Policy Reviewer
      - Package Validator
  → 聚合发现
  → 生成 PublishBlocker
  → 生成 FixPlan
  → 等待用户批准或修改
```

### 13.6 与 Skill System 的权限关系

发布审核调用 Skill 时必须传入：

- `novelId`
- `releaseCandidateId`
- `publishReviewRunId`
- `scope`
- `contextBundleId`
- `permissionGrant`

Skill 不能自行读取其他小说数据，也不能越过 `ReleaseCandidate` 读取最新草稿。

## 14. 模型 / RAG / 记忆集成

### 14.1 Model Router

发布审核不是所有任务都用最强模型。

| 任务 | 推荐模型策略 |
|---|---|
| 元数据格式检查 | 低成本、确定性强模型 |
| 导出清单校验 | 规则型或低成本模型 |
| 敏感内容风险扫描 | 高召回模型，可多模型交叉 |
| 篇章结构审查 | 长上下文、强推理模型 |
| 全书一致性审查 | 长上下文、强推理模型 |
| 文风一致性判断 | 风格感知强模型 |
| 报告生成 | 表达稳定、结构化能力强模型 |

Model Router 必须记录：

- 选择了哪个模型。
- 为什么选择。
- 是否降级。
- 降级对结论的影响。

### 14.2 RAG Context Engine

发布审核依赖 RAG，但必须是“冻结快照 + 证据优先”的 RAG。

Context Engine 需要支持：

- 按 `ReleaseCandidate` 快照检索。
- 分层检索：章节 → 篇章 → 全书。
- 图检索：人物关系、线索链、世界观规则。
- 证据片段引用。
- 检索结果去重。
- 检索不足标记。

禁止行为：

- 从未冻结的最新草稿中抽证据来审旧候选版本。
- 用相似文本猜测设定事实。
- 把外部平台规则当成本地永久规则。

### 14.3 Long-Term Memory

发布审核可以读取：

- 项目级风格偏好。
- 已确认审查规则。
- 平台偏好。
- 用户历史豁免习惯。
- 常见发布问题。

发布审核可以生成记忆候选：

- “作者偏好强悬念断章。”
- “该小说允许章节标题保持诗性，不强制说明剧情。”
- “该项目对世界观术语一致性要求很高。”
- “该平台配置要求简介不剧透核心反转。”

但记忆不能自动生效，必须经用户确认。

### 14.4 与 RAG 的关系是否必要

发布审核非常适合使用 RAG，原因是：

1. 它需要跨章节、人物、世界观、线索和历史审查结果取证。
2. 它不能只依赖一次长上下文塞入所有资料。
3. 它需要解释“为什么认为这是风险”。
4. 它需要对同一候选版本保持可复现。

因此本模块默认依赖 `12-rag-context-engine-spec.md`，但可以在小范围单章审核时降级为直接上下文读取。

## 15. UI 信息架构

### 15.1 Publish Center 总览

入口页布局：

- 顶部：当前小说、发布范围、目标配置、最近审核结论。
- 左侧：Release Candidate 列表。
- 中央：发布准备度面板。
- 右侧：阻断项、待批准项、导出包。
- 底部：历史审核时间线。

不要用一个大分数制造虚假确定性。更好的形式是维度状态：

| 维度 | 状态 |
|---|---|
| 正文完整性 | 通过 |
| 线索回收 | 有风险 |
| 敏感内容 | 需人工确认 |
| 导出格式 | 通过 |

### 15.2 Release Candidate 页面

页面区块：

1. 候选版本信息。
2. 冻结快照。
3. 审核运行记录。
4. 分维度结论。
5. 阻断项。
6. 修复计划。
7. 人工批准。
8. 导出包。

每个区块都要能追溯到证据，而不是只显示状态。

### 15.3 Findings Board

发现看板支持：

- 按严重程度筛选。
- 按维度筛选。
- 按章节 / 人物 / 线索 / 世界观筛选。
- 查看证据。
- 合并重复问题。
- 转为阻断项。
- 转为修改任务。
- 标记为已读。

### 15.4 Blocker Board

阻断项看板支持：

- `open`
- `assigned`
- `fixProposed`
- `verifying`
- `resolved`
- `waived`

每个阻断项卡片显示：

- 标题。
- 影响范围。
- 证据数量。
- 建议负责人。
- 当前状态。
- 下一步动作。

### 15.5 Evidence Viewer

证据查看器必须支持：

- 正文片段高亮。
- 章节版本定位。
- 人物卡定位。
- 世界观规则定位。
- 线索节点定位。
- 篇章泳道图定位。
- 来源检查项定位。

用户点击问题时，不应该只看到一句泛泛解释，而应该能追到“系统为什么这么判断”。

### 15.6 Approval Modal

批准弹窗必须展示：

- 当前结论。
- 未解决问题。
- 已豁免问题。
- 导出包状态。
- 目标平台配置。
- 批准影响范围。
- 批准后是否允许继续修改。

按钮：

- 批准当前候选版本。
- 请求修改。
- 拒绝发布。
- 取消。

如果存在 `blocker`，默认不能批准，除非用户逐项豁免并留下原因。

### 15.7 Export Package 页面

导出页展示：

- 包格式。
- 文件清单。
- 章节顺序。
- 元数据。
- 格式校验结果。
- 校验摘要。
- 下载 / 复制入口。

MVP 只支持导出，不支持自动上传。

### 15.8 与 Cockpit 的联动

Cockpit 中显示：

- 发布状态徽章。
- 当前候选版本。
- 阻断项数量。
- 最近审核结论。
- 一键进入 Publish Center。

对于正在写作中的作品，Cockpit 只显示轻量摘要，避免发布审核喧宾夺主。

## 16. 权限、安全与合规边界

### 16.1 数据隔离

所有核心对象必须包含 `novelId`：

- `PublishReviewProfile`
- `PlatformPolicyProfile`
- `PublishReviewRun`
- `ReleaseCandidate`
- `PublishReviewFinding`
- `PublishBlocker`
- `PublishFixPlan`
- `PublishApproval`
- `ReleasePackage`
- `PublishExportManifest`
- `PublishReviewEvent`

任何查询都必须以 `novelId` 作为隔离条件。

### 16.2 权限模型

建议权限：

| 权限 | 说明 |
|---|---|
| `publishReview:create` | 创建发布审核 |
| `publishReview:read` | 查看审核结果 |
| `publishReview:waive` | 豁免问题 |
| `publishReview:approve` | 批准候选版本 |
| `publishReview:package` | 生成导出包 |
| `publishReview:configure` | 修改审核模板和平台配置 |

个人作者模式下可以默认全部开放；团队模式下必须区分作者、编辑、审校和管理员。

### 16.3 敏感内容处理

敏感内容检查需要做到：

- 明确风险类别。
- 标明文本证据。
- 给出不确定性。
- 支持用户确认或豁免。
- 不把“敏感风险”伪装成确定违规。

### 16.4 版权风险处理

版权风险仅能提示：

- 可疑引用。
- 未登记外部素材。
- 高相似表达。
- 未授权歌词 / 诗句 / 文章片段风险。
- 真实人物或品牌使用风险。

系统不能宣称“无版权问题”。

更安全的结论是：

- “未发现明显风险。”
- “存在需要人工确认的风险。”
- “证据不足，建议人工复核。”

### 16.5 审计日志

以下动作必须审计：

- 创建候选版本。
- 修改平台配置。
- 运行审核。
- 生成阻断项。
- 豁免阻断项。
- 批准候选版本。
- 撤销批准。
- 生成导出包。

审计日志不能被普通删除。可以归档，但不能静默清除。

## 17. 异常与降级

### 17.1 快照失败

如果正文版本或设定版本无法冻结：

- 审核不得继续。
- 显示失败对象。
- 提供重试入口。
- 不生成发布结论。

### 17.2 上下文不足

如果 RAG 无法找到足够证据：

- 标记 `inconclusive`。
- 显示缺失证据类型。
- 提示用户补充设定、线索或章节状态。
- 不强行生成 `ready`。

### 17.3 Skill 失败

单个 Skill 失败时：

- 可重试。
- 可降级为人工检查。
- 可标记该维度为未知。
- 不得把未知当作通过。

### 17.4 模型降级

如果模型不可用：

- Model Router 可以降级。
- 降级必须写入报告。
- 对强推理检查降级后，维度状态应更保守。

### 17.5 平台配置过期

如果平台配置标记为可能过期：

- 发布审核仍可运行。
- 报告中必须显示“平台规则可能过期”。
- 与平台规则强相关的结论不能显示为确定通过。

### 17.6 候选版本过期

如果用户在审核后修改了正文或设定：

- 原 `ReleaseCandidate` 不自动更新。
- 系统提示创建新候选版本或执行差异复审。
- 已批准候选版本在源内容变化后应显示“源内容已变化”。

### 17.7 审查结论冲突

不同 Skill / Subagent 得出冲突结论时：

- 聚合器标记冲突。
- 展示双方证据。
- 请求人工判断。
- 不把冲突自动合并成低风险。

## 18. 验收标准

### 18.1 创建与范围

- 用户可以为单章、章节区间、篇章、分卷和整本小说创建发布审核。
- 每次审核都绑定 `novelId`。
- 每次审核都创建或引用一个 `ReleaseCandidate`。
- 审核范围、目标配置和模板会被固定记录。

### 18.2 快照与可复现

- `ReleaseCandidate` 能冻结正文、章节顺序、人物、世界观、线索和平台配置版本。
- 历史审核不会因最新草稿变化而自动改变结论。
- 审核报告能显示使用的 Skill、模型和上下文证据。

### 18.3 检查与聚合

- 系统能执行默认模板中的检查项。
- 发现必须包含严重程度、维度、证据和建议动作。
- 聚合器能去重相同问题。
- `blocker` 能阻断发布批准。
- 证据不足时能输出 `inconclusive`。

### 18.4 阻断项与修复

- `PublishBlocker` 支持打开、分配、提出修复、验证、解决、重开和豁免。
- 系统能从阻断项生成 `PublishFixPlan`。
- 修复计划能转交 Chapter Writing / Review 流程处理。
- 修复后可以进行增量复审。

### 18.5 人工批准

- 无人工批准时不能标记为正式发布准备完成。
- 存在未解决 `blocker` 时不能直接批准。
- 豁免 `blocker` 必须填写原因。
- 批准、拒绝、撤销批准都有审计记录。

### 18.6 导出包

- 已批准候选版本可以生成 `ReleasePackage`。
- 导出包必须包含 `PublishExportManifest`。
- 导出格式校验失败时不能显示为发布完成。
- MVP 不会自动上传到第三方平台。

### 18.7 UI

- Publish Center 能看到候选版本、维度状态、阻断项、审核历史和导出包。
- 每个发现都能打开证据查看器。
- 用户能从章节、篇章和 Cockpit 进入发布审核。
- UI 使用分维度状态，不只显示一个总分。

### 18.8 安全与隔离

- 所有发布审核对象都按 `novelId` 隔离。
- Skill 不能越权读取其他小说或未冻结草稿。
- 敏感内容和版权风险以风险提示表达，不伪装成法律结论。
- 平台规则过期时有明确提示。

## 19. 后续扩展与跨 Spec 边界

### 19.1 后续扩展

可在 MVP 稳定后扩展：

1. 第三方平台官方规则导入。
2. 平台账号连接与半自动发布。
3. 多编辑审批流。
4. 团队协作评论。
5. 全网查重服务接入。
6. 读者反馈纳入发布策略。
7. 多平台差异化导出。
8. A/B 标题与简介测试。
9. 完本投稿包。
10. 出版级排版包。

这些扩展应建立在 `ReleaseCandidate`、审核证据和人工批准门禁之上。

### 19.2 与其他 spec 的边界总结

| Spec | Publish Review 依赖什么 | Publish Review 不接管什么 |
|---|---|---|
| Project | `novelId`、项目配置、权限 | 项目创建和成员管理 |
| Cockpit | 入口和摘要展示 | 全局工作台布局 |
| Inspiration Vault | 未处理灵感状态 | 灵感整理和转化 |
| Arc Swimlane | 篇章结构和事件节点 | 泳道图编辑 |
| Clue System | 线索链和伏笔状态 | 线索设计与维护 |
| Character System | 人物卡、状态、关系 | 人物创建和弧光设计 |
| Worldbuilding | 世界观规则和术语 | 设定创建和演化 |
| Chapter Writing | 正文版本和修改入口 | 写作和改稿 |
| Chapter Review | 已有审查发现 | 单章审查闭环 |
| Orchestration | 任务编排 | 业务门禁定义 |
| Model Router | 模型选择 | 发布业务状态 |
| RAG Context Engine | 冻结证据检索 | 发布决策 |
| Long-Term Memory | 项目规则和记忆候选 | 自动学习与生效 |
| Skill System | 可复用检查能力 | 发布候选和批准 |

### 19.3 最终产品意义

有了 Publish Review System，Novel Agent 的闭环才完整：

```text
灵感
  → 大纲 / 篇章 / 设定 / 人物 / 线索
  → 章节写作
  → 章节审查
  → 修订
  → 发布审核
  → 候选版本
  → 人工批准
  → 导出 / 发布准备
```

这使它不只是一个“会写小说的聊天助手”，而是一个能把长篇小说从构思、生产、审查、修订一路送到发布前门禁的原生创作系统。
