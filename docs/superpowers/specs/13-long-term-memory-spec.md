# 13 Long-Term Memory Spec

状态：Review Candidate

日期：2026-07-09

上游依赖：

- `01-novel-project-spec.md`：每本小说创建独立 `MemorySpace` 和 `MemoryPolicy`。
- `03-inspiration-vault-spec.md`：灵感默认不能直接写入核心记忆。
- `04-arc-swimlane-diagram-spec.md`：批准后的结构节点可以提交记忆候选。
- `05-clue-foreshadowing-spec.md`：线索系统拥有线索事实并提交 Clue Memory 候选。
- `06-character-system-spec.md`：人物系统拥有人物事实并提交 Character Memory 候选。
- `07-worldbuilding-system-spec.md`：世界观系统拥有设定事实并提交 World / Core Canon Memory 候选。
- `08-chapter-writing-spec.md`：正文只产生事实候选，不能直接写记忆。
- `09-chapter-review-spec.md`：审查系统提交 Review、Style 和 Intent Memory 候选。
- `10-agent-orchestration-spec.md`：Orchestrator 只创建 `MemoryWriteCandidate`，不直接提交业务记忆。
- `11-model-router-spec.md`：模型偏好可以形成 Workflow Memory 候选。
- `12-rag-context-engine-spec.md`：Context Engine 索引和检索已激活记忆，不拥有记忆生命周期。

相关底座文档：`2026-07-08-novel-agent-product-foundation-design.md`

## 1. 功能定位

Long-Term Memory System 是在长篇创作和多次会话之间，持续保存已确认事实、稳定偏好、叙事意图和工作流经验，并维护来源、版本、时间和冲突的持久化系统。

它不是聊天记录仓库，也不是向量数据库。长期记忆由以下机制共同实现：

```text
领域结构化事实
  → MemoryWriteCandidate
  → 来源与冲突校验
  → 用户 / 领域确认
  → 版本化 MemoryItem
  → RAG 索引
  → 按任务检索
```

它解决的问题是：

1. Agent 在新会话中仍然知道这本小说的核心目标、规则和偏好。
2. 人物、世界观、线索和章节状态不会只存在于临时上下文。
3. 旧事实变化后不会被新摘要无痕覆盖。
4. 记忆冲突能回到原始来源进行解决。
5. “故事里什么时候成立”和“系统什么时候记录”可以分开追踪。
6. 不同小说的记忆完全隔离。
7. 自动提取内容先进入候选，不直接污染长期记忆。
8. RAG 能检索记忆，但不能改变记忆。
9. 用户可以查看、纠正、撤销、替代和删除记忆。

一句话定义：

> Long-Term Memory System 是一本小说的可追溯持久认知层：保存经过确认且值得跨会话复用的信息，并让每条记忆都能回答“谁确认、从哪来、何时成立、替代了什么”。

## 2. 记忆层级与边界

### 2.1 临时工作上下文

包括：

- 当前聊天消息。
- ContextBundle。
- RetrievalCandidate。
- 模型临时摘要。
- 未保存的编辑器内容。

这些不是长期记忆，可以随任务结束或缓存清理而消失。

### 2.2 任务与事件历史

包括：

- AgentTask。
- TaskAttempt。
- OrchestrationEvent。
- ReviewRun。
- ModelUsageRecord。

这些是运行审计记录，不自动成为创作记忆。只有稳定、可复用的经验才能生成 MemoryWriteCandidate。

### 2.3 领域事实投影记忆

人物、世界观、线索、篇章和章节事实由业务系统拥有，MemoryItem 保存可检索投影：

- 继承来源权威。
- 不能覆盖来源。
- 来源改变时需要同步。
- 冲突由来源系统最终解决。

### 2.4 原生记忆

以下内容可以由 Memory System 自身拥有：

- 项目目标和稳定偏好。
- 工作流偏好。
- 模型和 Skill 偏好。
- 文风偏好与样例选择。
- 审查教训。
- 用户确认的叙事意图。
- 恢复和自动化偏好。

### 2.5 RAG 边界

| Long-Term Memory | RAG Context Engine |
|---|---|
| 决定哪些信息值得长期保存 | 决定当前任务检索哪些信息 |
| 维护状态、版本、冲突和撤销 | 维护索引、召回、重排和 Bundle |
| 记忆条目是业务数据 | 索引和缓存是派生数据 |
| 可作为 RAG 知识源 | 不自动反向写入记忆 |

## 3. 记忆类型

### 3.1 Project Memory

保存：

- 小说定位。
- 类型和目标读者。
- 目标平台。
- 创作目标。
- 全书层面的稳定原则。

### 3.2 Workflow Memory

保存：

- 常用模型。
- 常用 Skill。
- 自动化等级。
- 任务确认偏好。
- 失败恢复偏好。
- 常用工作流。

### 3.3 Core Canon Memory

保存经过领域系统确认的高价值核心事实投影：

- 核心世界规则。
- 重大历史真相。
- 主谜底。
- 不可逆剧情事实。
- 核心人物身份。

它不是独立 Canon 数据库，必须引用拥有该事实的领域对象。

### 3.4 Character Memory

保存：

- 人物身份、目标、动机和秘密。
- 当前状态。
- 关系变化。
- 弧光阶段。
- 知情状态。
- 声音规则。

### 3.5 World Memory

保存：

- 世界观条目摘要。
- 规则、限制、代价和例外。
- 阵营和地点状态。
- 历史影响。
- 已揭示 / 未揭示设定。

### 3.6 Clue Memory

保存：

- 线索和伏笔。
- 提供者、触发者和接收者。
- 误导、隐藏和回收状态。
- 信息状态。
- 未完成线索链。

### 3.7 Style Memory

保存：

- 作者明确接受的表达偏好。
- 禁用表达。
- 节奏和对白偏好。
- 正向与反向样例引用。
- 题材写作偏好。

### 3.8 Review Memory

保存：

- 重复出现的问题模式。
- 用户确认的审查偏好。
- 有效的修改策略。
- 误报模式。

### 3.9 Intent Memory

保存用户确认的叙事意图：

- 有意留白。
- 不可靠叙述。
- 未来反转。
- 特殊称谓。
- 暂时不解释的异常。

### 3.10 MemoryType 不是权威等级

记忆类型表示用途，不表示权威。Core Canon Memory 的权威仍来自被引用的 locked / confirmed 领域事实。

## 4. 用户角色与入口

### 4.1 独立作者

查看 Agent 记住了什么，确认候选，纠正错误记忆和解决冲突。

### 4.2 长篇连载作者

追踪人物、线索、世界状态和最近章节事实的长期演化。

### 4.3 精细控制型作者

管理来源、有效时间、权威、记忆策略、撤销、保留和删除。

### 4.4 Agent / Subagent

读取任务授权的记忆，提交候选，但不能绕过确认策略直接写高风险记忆。

### 4.5 主入口

```text
Novel Cockpit
  → Memory
  → Memory Center
```

### 4.6 上下文入口

- Cockpit 的 Memory Layer 摘要。
- 人物详情的 Character Memory。
- 世界观条目的 World Memory。
- 线索卡的 Clue Memory。
- 章节状态卡的事实候选。
- 审查报告的 ReviewLessonCandidate。
- Agent 任务结果的 MemoryWriteCandidate。
- 模型 / Skill / 工作流设置。
- RAG ContextBundle 的来源跳转。

## 5. 核心用户目标

### 5.1 查看当前有效记忆

按类型、对象、篇章、时间、权威、状态和来源筛选。

### 5.2 确认记忆候选

了解候选事实、来源证据、风险、冲突和写入影响。

### 5.3 纠正错误记忆

创建新版本或撤销记忆，而不是直接修改历史。

### 5.4 解决冲突

区分：

- 同一事实真正矛盾。
- 不同故事时间的状态变化。
- 人物认知与作者真相不同。
- 公开说法与真实事实不同。
- 草案与 Canon 不同。

### 5.5 查看来源

跳转到人物、世界观、线索、章节、审查、用户输入或项目设置。

### 5.6 管理遗忘和保留

设置哪些记忆永久保存、定期复核、自动过期、撤销或彻底删除。

### 5.7 防止跨小说串记忆

确保任何读取、候选、冲突、索引和缓存都限定当前 `novelId`。

## 6. MVP 范围

### 6.1 必须包含

- 每本小说独立 MemorySpace。
- 九类记忆。
- MemoryPolicy。
- MemoryWriteCandidate。
- 原子化 MemoryItem。
- 领域投影记忆和原生记忆区分。
- 来源引用和证据。
- 权威继承。
- 用户确认。
- 风险级别。
- 记忆版本。
- Story Time 与 System Time 双时间轴。
- 生效和失效范围。
- supersedes 替代链。
- 撤销和恢复。
- 冲突检测。
- 冲突解决记录。
- 去重。
- 批量候选审阅。
- 记忆同步。
- RAG 索引事件。
- 过期和复核。
- 软删除与硬删除请求。
- 小说删除传播。
- 导入和只读复制。
- 记忆健康检查。
- 记忆历史和审计日志。

### 6.2 MVP 可以简化

- 原子事实使用 `subject + predicate + value` 加自然语言摘要。
- 冲突检测先使用实体、谓词、时间重叠和语义辅助。
- 双时间轴使用故事顺序值加可读标签，不要求所有小说有完整历法。
- 合并只处理完全重复或明确等价事实。
- 原生偏好记忆允许低风险自动写入，但必须可撤销并受 MemoryPolicy 控制。
- 不建设通用事件溯源数据库，关键记忆操作保留不可变事件日志。
- 记忆图只展示引用和冲突，不做复杂图推理。

## 7. 非 MVP 范围

- 把所有聊天自动永久保存。
- 无确认写入核心 Canon。
- 让模型自行删除用户事实。
- 用向量相似度自动合并记忆。
- 跨小说默认共享记忆。
- 人脑式“模糊遗忘”仿真。
- 自动训练专属记忆模型。
- 无限保存所有中间推理。
- 从记忆直接覆盖人物、世界观或线索数据库。
- 把 RAG 缓存当成长久记忆。
- 多人细粒度记忆审批。
- 无审计的物理删除。

## 8. 核心流程

### 8.1 初始化 MemorySpace

```text
创建 Novel
  → 创建 MemorySpace
  → 创建默认 MemoryPolicy
  → 初始化各 MemoryType 分区
  → 注册 RAG 知识源
  → MemorySpace 进入 active
```

### 8.2 提交领域事实候选

```text
领域对象确认或章节事实被接受
  → 领域系统创建 MemoryWriteCandidate
  → 绑定 sourceObjectId 和 sourceVersionId
  → 提取原子事实
  → 继承权威和故事时间
  → 执行去重与冲突检测
  → 等待用户 / 策略确认
```

领域系统已经确认的普通投影仍要经过 MemoryPolicy；高风险 Core Canon 必须用户确认。

### 8.3 提交原生偏好候选

```text
用户明确表达稳定偏好
  → Agent 生成候选
  → 判断是否重复、一次性指令或长期偏好
  → 展示建议作用范围
  → 用户确认或按低风险策略自动激活
```

一次性任务要求不能自动升级为长期偏好。

### 8.4 候选标准化

```text
原始候选
  → 实体解析
  → 事实原子化
  → 规范 predicate
  → 规范时间和作用域
  → 绑定证据
  → 计算风险
  → 生成规范化候选
```

一个候选包含多个独立事实时必须拆分，避免用户只能整包接受。

### 8.5 去重

依次检查：

1. 相同 sourceVersion 和事实 Hash。
2. 相同 subject、predicate、value 和时间。
3. 明确别名或实体映射。
4. 语义相似候选。

只有前两类可以自动去重。语义相似只能提示用户，不自动合并。

### 8.6 冲突检测

```text
新候选
  → 查找相同 subject + predicate
  → 检查故事时间是否重叠
  → 检查 truthPerspective
  → 检查来源与权威
  → 生成 MemoryConflict 或标记为状态变化
```

### 8.7 确认并写入

```text
用户查看候选、证据、冲突和影响
  → 接受 / 编辑后接受 / 拒绝 / 延期
  → 创建不可变 MemoryItemVersion
  → 更新当前 MemoryItem 指针
  → 写入 MemoryEvent
  → 发布 MemoryChanged 事件
  → RAG 创建或更新索引
```

### 8.8 更新记忆

记忆不能原地覆盖：

```text
提出新事实或纠正
  → 创建新候选
  → 比较当前版本
  → 选择替代、限定时间、并存或拒绝
  → 创建新版本
  → 旧版本进入 superseded / revoked
```

### 8.9 领域源变化同步

```text
源对象版本变化
  → 创建 MemorySyncJob
  → 找到相关投影记忆
  → 比较事实
  → 不变：更新来源版本引用
  → 改变：生成替代候选
  → 删除 / 撤销：标记 sourceInvalid
```

Memory System 不自动修正源领域对象。

### 8.10 解决冲突

用户可以：

- 选择某个事实为当前有效。
- 将两条事实分配到不同故事时间。
- 区分人物认知和作者真相。
- 区分公开说法和真实事实。
- 保留多个解释并标记未决。
- 返回源领域系统修正。

解决结果必须形成 `MemoryConflictResolution`。

### 8.11 复核与过期

```text
达到 reviewAt / expiresAt
  → MemoryItem 进入 needsReview / expired
  → 用户确认继续、替代、撤销或删除
  → RAG 更新可检索状态
```

Core Canon 和领域事实投影默认不因时间自动过期，只能定期复核。

### 8.12 删除

```text
用户发起删除
  → 展示引用与影响
  → 判断软删除 / 隐私硬删除
  → 创建 MemoryDeletionRequest
  → 使记忆停止新检索
  → 通知 RAG 创建 Tombstone
  → 清理缓存和派生索引
  → 记录最小审计元数据
```

`hardDelete` 完成后，审计事件只能保留请求 ID、时间、执行状态和不可逆 Hash；MemoryEvent、冲突记录和来源引用中的正文摘录、结构化值与可还原内容必须同步清除或脱敏。

## 9. 核心数据对象与字段

本节“必填”表示字段必须存在；数组可以为空，除非校验规则另有要求。

### 9.1 MemorySpace

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `memorySpaceId` | string | 是 | 记忆空间 ID |
| `novelId` | string | 是 | 所属小说 |
| `memoryPolicyId` | string | 是 | 当前策略 |
| `status` | enum | 是 | `initializing`、`active`、`degraded`、`locked`、`archived`、`deleting` |
| `activeMemoryCount` | number | 是 | 有效记忆数 |
| `pendingCandidateCount` | number | 是 | 待确认候选 |
| `openConflictCount` | number | 是 | 未解决冲突 |
| `needsReviewCount` | number | 是 | 待复核 |
| `lastConsolidatedAt` | ISO datetime | 否 | 最近整理 |
| `lastHealthCheckAt` | ISO datetime | 否 | 最近健康检查 |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.2 MemoryPolicy

该对象扩展 `01-novel-project-spec.md` 的 MemoryPolicy：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `memoryPolicyId` | string | 是 | 策略 ID |
| `novelId` | string | 是 | 所属小说 |
| `retentionMode` | enum | 是 | `standard`、`strictCanon`、`draftFriendly`、`custom` |
| `autoWriteWorkflowMemory` | boolean | 是 | 是否自动写低风险流程偏好 |
| `requireConfirmationForProject` | boolean | 是 | 项目记忆确认 |
| `requireConfirmationForCanon` | boolean | 是 | Core Canon 确认 |
| `requireConfirmationForCharacterFacts` | boolean | 是 | 人物事实确认 |
| `requireConfirmationForWorldFacts` | boolean | 是 | 世界事实确认 |
| `requireConfirmationForClueFacts` | boolean | 是 | 线索事实确认 |
| `requireConfirmationForStyle` | boolean | 是 | 文风记忆确认 |
| `requireConfirmationForReview` | boolean | 是 | 审查教训确认 |
| `enableConflictDetection` | boolean | 是 | 冲突检测 |
| `autoExpireRules` | object[] | 是 | 自动过期规则 |
| `reviewIntervals` | object[] | 是 | 定期复核规则 |
| `hardDeletePolicy` | enum | 是 | `privacyOnly`、`userConfirmed`、`disabled` |
| `version` | number | 是 | 策略版本 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.3 MemoryWriteCandidate

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `memoryCandidateId` | string | 是 | 候选 ID |
| `novelId` | string | 是 | 所属小说 |
| `originNovelId` | string | 否 | 跨小说复制时的来源小说 |
| `originMemoryId` | string | 否 | 跨小说复制时的来源记忆 |
| `memoryType` | enum | 是 | 记忆类型 |
| `originType` | enum | 是 | `domainProjection`、`userStatement`、`agentSuggestion`、`workflowObservation`、`import` |
| `subjectRef` | object | 是 | 主题对象 |
| `predicate` | string | 是 | 规范化谓词 |
| `value` | object | 是 | 结构化值 |
| `statement` | string | 是 | 人类可读事实 |
| `truthPerspective` | enum | 是 | 真相视角 |
| `scopeRefs` | object[] | 是 | 作用范围 |
| `sourceRefs` | `MemorySourceRef[]` | 是 | 来源 |
| `evidenceRefs` | object[] | 是 | 证据 |
| `proposedAuthority` | enum | 是 | 候选权威 |
| `authorityBasis` | enum | 是 | `inheritedFromSource`、`nativeUserStatement`、`policyObservation`、`unverified` |
| `storyValidFrom` | number | 否 | 故事生效顺序 |
| `storyValidTo` | number | 否 | 故事失效顺序 |
| `systemObservedAt` | ISO datetime | 是 | 系统观察时间 |
| `riskLevel` | enum | 是 | `low`、`medium`、`high`、`critical` |
| `duplicateOfMemoryId` | string | 否 | 完全重复 |
| `possibleDuplicateIds` | string[] | 是 | 可能重复 |
| `conflictIds` | string[] | 是 | 冲突 |
| `requiresUserConfirmation` | boolean | 是 | 是否确认 |
| `status` | enum | 是 | `draft`、`normalized`、`waitingApproval`、`accepted`、`rejected`、`deferred`、`superseded` |
| `createdBy` | enum | 是 | `user`、`agent`、`domainService`、`import` |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.4 TruthPerspective

| 值 | 说明 |
|---|---|
| `authorTruth` | 作者层真相 |
| `readerKnowledge` | 指定时间读者已知 |
| `characterKnowledge` | 指定人物认知 |
| `factionKnowledge` | 指定阵营认知 |
| `publicBelief` | 世界内公开说法 |
| `narrativeIntent` | 作者设计意图 |
| `preference` | 用户偏好 |
| `workflowRule` | 工作流规则 |

不同 TruthPerspective 的内容不因 statement 相反就自动视为冲突。

### 9.5 MemoryItem

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `memoryId` | string | 是 | 稳定记忆 ID |
| `novelId` | string | 是 | 所属小说 |
| `originNovelId` | string | 否 | 跨小说复制来源 |
| `originMemoryId` | string | 否 | 来源记忆 |
| `memorySpaceId` | string | 是 | 记忆空间 |
| `memoryType` | enum | 是 | 记忆类型 |
| `subjectRef` | object | 是 | 主题对象 |
| `predicate` | string | 是 | 谓词 |
| `truthPerspective` | enum | 是 | 真相视角 |
| `currentVersionId` | string | 是 | 当前版本 |
| `authority` | enum | 是 | 当前权威 |
| `storyValidFrom` | number | 否 | 故事生效顺序 |
| `storyValidTo` | number | 否 | 故事失效顺序 |
| `status` | enum | 是 | 记忆状态 |
| `retentionClass` | enum | 是 | `permanent`、`longTerm`、`reviewable`、`expiring` |
| `reviewAt` | ISO datetime | 否 | 复核时间 |
| `expiresAt` | ISO datetime | 否 | 过期时间 |
| `sourceHealth` | enum | 是 | `healthy`、`stale`、`missing`、`conflicted` |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.6 MemoryStatus

| 值 | 说明 |
|---|---|
| `active` | 当前有效 |
| `needsReview` | 需要复核，可按策略继续读取 |
| `conflicted` | 存在未解决冲突 |
| `expired` | 已过期，不进入普通检索 |
| `superseded` | 已被新版本替代 |
| `revoked` | 用户或来源撤销 |
| `archived` | 归档，不进入普通检索 |
| `deleting` | 正在删除 |
| `deleted` | 已删除，仅保留允许的最小审计 |

### 9.7 MemoryItemVersion

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `memoryVersionId` | string | 是 | 不可变版本 ID |
| `memoryId` | string | 是 | 稳定记忆 ID |
| `novelId` | string | 是 | 所属小说 |
| `version` | number | 是 | 版本号 |
| `parentVersionId` | string | 否 | 上一版本 |
| `value` | object | 是 | 结构化值 |
| `statement` | string | 是 | 人类可读事实 |
| `sourceRefs` | `MemorySourceRef[]` | 是 | 来源 |
| `evidenceRefs` | object[] | 是 | 证据 |
| `authority` | enum | 是 | 权威 |
| `storyValidFrom` | number | 否 | 故事有效起点 |
| `storyValidTo` | number | 否 | 故事有效终点 |
| `systemRecordedAt` | ISO datetime | 是 | 系统记录时间 |
| `systemSupersededAt` | ISO datetime | 否 | 系统替代时间 |
| `status` | enum | 是 | `active`、`superseded`、`revoked`、`deleted` |
| `supersedesMemoryVersionIds` | string[] | 是 | 替代版本 |
| `changeReason` | string | 是 | 变化原因 |
| `confirmedBy` | string | 是 | 确认人 / 授权领域服务 |
| `confirmationType` | enum | 是 | `user`、`domainConfirmed`、`policyAutoLowRisk` |
| `contentHash` | string | 是 | 内容 Hash |
| `createdAt` | ISO datetime | 是 | 创建时间 |

同一 `memoryId` 的内容更新时，旧 `MemoryItemVersion` 进入 `superseded`，而 `MemoryItem` 通常仍保持 `active` 并把 `currentVersionId` 指向新版本。只有整条记忆被另一 `memoryId` 合并替代、撤销或删除时，MemoryItem 本身才进入对应终态。

### 9.8 MemorySourceRef

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `memorySourceRefId` | string | 是 | 来源 ID |
| `novelId` | string | 是 | 所属小说 |
| `originNovelId` | string | 否 | 跨小说只读来源 |
| `originSourceObjectId` | string | 否 | 来源小说对象 |
| `sourceDomain` | enum | 是 | `project`、`structure`、`character`、`world`、`clue`、`chapter`、`review`、`orchestration`、`model`、`skill`、`user` |
| `sourceObjectId` | string | 是 | 源对象 |
| `sourceVersionId` | string | 是 | 源版本 |
| `sourceAuthority` | enum | 是 | 来源权威 |
| `sourceAnchor` | object | 否 | 字段、段落、节点或事件 |
| `relation` | enum | 是 | `derivedFrom`、`confirmedBy`、`correctedBy`、`contradictedBy`、`copiedFrom` |
| `valid` | boolean | 是 | 来源是否有效 |
| `checkedAt` | ISO datetime | 是 | 最近检查 |

### 9.9 MemoryConflict

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `memoryConflictId` | string | 是 | 冲突 ID |
| `novelId` | string | 是 | 所属小说 |
| `candidateIds` | string[] | 是 | 候选 |
| `memoryVersionIds` | string[] | 是 | 现有记忆版本 |
| `type` | enum | 是 | 冲突类型 |
| `subjectRef` | object | 是 | 冲突主题 |
| `predicate` | string | 是 | 冲突谓词 |
| `storyOverlap` | object | 否 | 时间重叠 |
| `perspectiveComparison` | object | 是 | 真相视角对比 |
| `authorityComparison` | object | 是 | 权威对比 |
| `sourceRefs` | object[] | 是 | 双方来源 |
| `summary` | string | 是 | 说明 |
| `severity` | enum | 是 | `info`、`warning`、`danger`、`blocking` |
| `status` | enum | 是 | `open`、`waitingUser`、`resolved`、`ignored`、`blockedBySource` |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.10 MemoryConflictType

| 值 | 说明 |
|---|---|
| `valueConflict` | 同一时间同一视角的值不同 |
| `timelineOverlap` | 状态时间范围不合理重叠 |
| `authorityConflict` | 来源权威关系不明 |
| `sourceVersionConflict` | 来源版本不一致 |
| `perspectiveMismatch` | 真相、认知或公开说法被混淆 |
| `duplicateAmbiguity` | 相似但无法确定是否重复 |
| `sourceMissing` | 原始来源丢失 |
| `sourceRevoked` | 来源被撤销 |
| `memorySourceDrift` | 记忆与当前源事实不同 |

### 9.11 MemoryConflictResolution

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `resolutionId` | string | 是 | 解决记录 ID |
| `novelId` | string | 是 | 所属小说 |
| `memoryConflictId` | string | 是 | 冲突 |
| `action` | enum | 是 | `keepExisting`、`acceptCandidate`、`splitTimeline`、`splitPerspective`、`keepBothUnresolved`、`returnToSource`、`revokeMemory` |
| `selectedVersionIds` | string[] | 是 | 保留版本 |
| `createdVersionIds` | string[] | 是 | 新版本 |
| `reason` | string | 是 | 理由 |
| `resolvedBy` | string | 是 | 用户 / 授权角色 |
| `createdAt` | ISO datetime | 是 | 时间 |

### 9.12 MemorySyncJob

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `memorySyncJobId` | string | 是 | 同步任务 ID |
| `novelId` | string | 是 | 所属小说 |
| `jobType` | enum | 是 | `sourceChanged`、`sourceDeleted`、`rebuildProjection`、`validateSources`、`reindexMemory` |
| `sourceEventIds` | string[] | 是 | 来源事件 |
| `sourceObjectRefs` | object[] | 是 | 对象 |
| `memoryIds` | string[] | 是 | 受影响记忆 |
| `idempotencyKey` | string | 是 | 幂等键 |
| `status` | enum | 是 | `queued`、`running`、`partiallyCompleted`、`completed`、`failed`、`cancelled` |
| `result` | object | 否 | 结果 |
| `error` | object | 否 | 错误 |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `endedAt` | ISO datetime | 否 | 结束时间 |

### 9.13 MemoryReviewTask

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `memoryReviewTaskId` | string | 是 | 复核任务 ID |
| `novelId` | string | 是 | 所属小说 |
| `memoryIds` | string[] | 是 | 目标记忆 |
| `trigger` | enum | 是 | `scheduled`、`sourceChanged`、`conflict`、`userRequested`、`projectRestore` |
| `reason` | string | 是 | 原因 |
| `dueAt` | ISO datetime | 否 | 截止 |
| `status` | enum | 是 | `open`、`inProgress`、`completed`、`dismissed` |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.14 MemoryDeletionRequest

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `memoryDeletionRequestId` | string | 是 | 删除请求 ID |
| `novelId` | string | 是 | 所属小说 |
| `memoryIds` | string[] | 是 | 目标记忆 |
| `mode` | enum | 是 | `revoke`、`softDelete`、`hardDelete` |
| `reason` | string | 是 | 删除原因 |
| `impactRefs` | object[] | 是 | RAG、任务、引用影响 |
| `requiresUserConfirmation` | boolean | 是 | 是否确认 |
| `status` | enum | 是 | `draft`、`approved`、`running`、`completed`、`failed`、`cancelled` |
| `requestedBy` | string | 是 | 发起人 |
| `createdAt` | ISO datetime | 是 | 时间 |
| `completedAt` | ISO datetime | 否 | 完成时间 |

### 9.15 MemoryEvent

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `memoryEventId` | string | 是 | 事件 ID |
| `novelId` | string | 是 | 所属小说 |
| `memoryId` | string | 否 | 记忆 |
| `memoryVersionId` | string | 否 | 版本 |
| `candidateId` | string | 否 | 候选 |
| `eventType` | string | 是 | created / confirmed / superseded / revoked / deleted / conflict 等 |
| `actorType` | enum | 是 | `user`、`agent`、`domainService`、`system` |
| `actorId` | string | 否 | 执行者 |
| `payload` | object | 是 | 事件数据 |
| `correlationId` | string | 是 | 关联链 |
| `createdAt` | ISO datetime | 是 | 时间 |

MemoryEvent 只追加，不原地修改。

### 9.16 MemoryHealthReport

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `memoryHealthReportId` | string | 是 | 报告 ID |
| `novelId` | string | 是 | 所属小说 |
| `activeCountByType` | object | 是 | 各类型数量 |
| `pendingCandidateCount` | number | 是 | 待确认 |
| `openConflictCount` | number | 是 | 冲突 |
| `staleSourceCount` | number | 是 | 来源过期 |
| `missingSourceCount` | number | 是 | 来源丢失 |
| `orphanMemoryCount` | number | 是 | 孤立记忆 |
| `duplicateCandidateCount` | number | 是 | 重复候选 |
| `needsReviewCount` | number | 是 | 待复核 |
| `ragIndexLagCount` | number | 是 | RAG 未同步 |
| `crossNovelLeakCount` | number | 是 | 跨小说泄漏 |
| `findings` | object[] | 是 | 问题 |
| `createdAt` | ISO datetime | 是 | 时间 |

`crossNovelLeakCount` 必须为 0。

## 10. 状态机与双时间轴

### 10.1 候选状态

```text
draft → normalized → waitingApproval → accepted
                         │
                         ├→ rejected
                         ├→ deferred
                         └→ superseded
```

### 10.2 记忆状态

```text
active → needsReview → active
   │          │
   ├→ conflicted
   ├→ expired
   ├→ superseded
   ├→ revoked
   ├→ archived
   └→ deleting → deleted
```

### 10.3 Story Time

描述事实在小说世界中何时成立：

- `storyValidFrom`
- `storyValidTo`
- 可读故事时间标签由源领域对象提供。

例如：

```text
第 1—10 章：角色 A 不知道真相
第 11 章起：角色 A 知道真相
```

这两条不是冲突，而是状态变化。

### 10.4 System Time

描述系统何时记录、替代或撤销：

- `systemRecordedAt`
- `systemSupersededAt`
- MemoryEvent.createdAt

系统时间不能替代故事时间。

### 10.5 双时间查询

系统必须支持：

- “在第 8 章时，人物知道什么？”
- “当前系统认为第 8 章时人物知道什么？”
- “这条记忆在什么时候被纠正？”
- “某次写作运行当时使用的是哪个记忆版本？”

### 10.6 替代规则

- 新版本通过 `parentVersionId` 连接。
- 被替代版本保留。
- 时间范围变化可以产生并存版本。
- 当前指针只指向当前系统有效版本，不删除历史。

## 11. 权威、冲突与确认规则

### 11.1 权威来源

从高到低：

```text
lockedCanon
  → confirmedCanon
  → publishedEvidence
  → approvedEvidence
  → approvedPlan
  → confirmedNativeMemory
  → draft
  → inspiration
  → externalReference
```

领域投影记忆继承来源权威。原生记忆经用户确认后可以是 `confirmedNativeMemory`，但不能覆盖领域 Canon。

### 11.2 自动写入边界

可以按策略自动写入：

- 用户刚刚明确选择的 UI 偏好。
- 低风险工作流偏好。
- 明确的恢复偏好。
- 已有偏好的使用统计更新。

必须用户确认：

- Core Canon。
- 人物身份、死亡、秘密、背叛。
- 线索谜底和回收状态。
- 世界规则和例外。
- 正文章节事实。
- 文风规则升级。
- 审查教训。
- 叙事意图。

### 11.3 领域确认

`domainConfirmed` 只适用于：

- 来源对象已经由用户确认。
- MemoryItem 是无改写的结构化投影。
- 候选与来源版本 Hash 可验证。
- MemoryPolicy 允许。

模型摘要或推断不能使用 `domainConfirmed`。

### 11.4 冲突不自动胜出

高权威可以用于排序和建议，但系统仍需：

- 保留低权威来源。
- 显示冲突。
- 区分时间和视角。
- 不自动删除。

### 11.5 编辑候选

用户编辑候选后：

- 来源关系从纯 `derivedFrom` 变为包含 `correctedBy user`。
- 权威不得自动高于源领域对象。
- 如果编辑改变领域事实，必须返回领域模块确认。

## 12. Agent 与系统行为

### 12.1 可以自动执行

- 从已确认领域对象生成投影候选。
- 把复合文本拆成原子事实候选。
- 解析实体、谓词和时间。
- 计算完全重复。
- 提示语义相似。
- 检测时间、视角和来源冲突。
- 创建 MemorySyncJob。
- 创建定期复核任务。
- 生成 MemoryHealthReport。
- 发布 RAG 索引事件。
- 执行低风险工作流偏好写入。

### 12.2 必须由用户确认

- 高风险候选写入。
- 解决 MemoryConflict。
- 修改 MemoryPolicy 的自动写入边界。
- 撤销 Core Canon / Character / World / Clue Memory。
- 硬删除。
- 跨小说复制记忆。
- 将一次性偏好升级为长期规则。
- 编辑后影响源领域事实。

### 12.3 禁止自动执行

- 把聊天全文当成记忆。
- 把 RAG 结果写入记忆。
- 把模型摘要当成事实。
- 用语义相似自动合并。
- 覆盖旧版本。
- 删除冲突证据。
- 从一个小说读取另一个小说记忆。
- 让记忆覆盖领域 Canon。
- 自动确认人物死亡、谜底或重大反转。
- 把过期记忆伪装为 active。

### 12.4 建议格式

```text
候选记忆
记忆类型
主题 / 谓词 / 值
真相视角
故事有效时间
来源和证据
候选权威及依据
重复与冲突
风险
写入影响
是否需要用户确认
```

## 13. Skill 与模型调用

### 13.1 Memory Skills

| Skill | 触发场景 |
|---|---|
| 记忆候选提取 | 从领域对象、状态卡或用户偏好生成候选 |
| 原子事实拆分 | 拆分复合陈述 |
| 实体解析 | 对齐人物、地点、线索和世界对象 |
| 时间规范化 | 解析 Story Time |
| 记忆去重 | 查找完全重复和可能重复 |
| 记忆冲突检测 | 检查值、时间、视角和来源冲突 |
| 记忆同步 | 源对象变化后更新投影 |
| 记忆复核 | 检查来源和有效性 |
| 记忆健康检查 | 生成健康报告 |
| 记忆删除影响分析 | 查找 RAG、任务和引用影响 |

### 13.2 模型选择

| 场景 | 推荐特点 |
|---|---|
| 原子事实提取 | 结构化输出和忠实抽取强 |
| 实体解析 | 工具调用和候选排序强 |
| 时间 / 视角判断 | 深度推理、结构理解强 |
| 语义重复提示 | Embedding / Reranker |
| 冲突解释 | 多来源推理和引用强 |
| 批量低风险偏好提取 | 高速轻量模型 |

### 13.3 模型边界

- 模型只能生成候选和解释。
- 模型不能确认高风险记忆。
- 模型输出必须绑定输入来源。
- 冲突模型不得隐藏不同结论。
- Embedding 相似只表示相似，不表示重复。

## 14. RAG、数据库与同步规则

### 14.1 RAG 索引

只有以下状态进入普通检索：

- `active`
- 按策略允许的 `needsReview`

以下状态默认不进入：

- `conflicted`
- `expired`
- `superseded`
- `revoked`
- `archived`
- `deleting`
- `deleted`

审查 / 冲突任务可以显式检索历史版本。

### 14.2 MemoryChanged 事件

每次创建、替代、撤销、过期和删除必须发布事件，至少包含：

- `novelId`
- `memoryId`
- `memoryVersionId`
- 新旧状态。
- 来源版本。
- contentHash。
- 事件时间。

### 14.3 事务边界

- MemoryItemVersion、当前指针和 MemoryEvent 应在同一事务提交。
- RAG 事件使用 Outbox，允许最终一致。
- 同步失败不能回滚已确认记忆，但必须显示 `ragIndexLag`。
- 重试使用 `idempotencyKey`。

### 14.4 建议数据库约束

```text
UNIQUE (novelId, memoryId, version)
UNIQUE (novelId, memoryCandidateId)
UNIQUE (novelId, idempotencyKey)
INDEX  (novelId, memoryType, status)
INDEX  (novelId, subjectType, subjectId, predicate)
INDEX  (novelId, storyValidFrom, storyValidTo)
INDEX  (novelId, reviewAt)
```

所有更新使用乐观版本检查。

### 14.5 当前有效事实查询

查询必须同时限定：

- `novelId`
- MemoryStatus。
- TruthPerspective。
- Story Time。
- System Time / 版本快照。
- 权限。

### 14.6 不从摘要再总结

记忆整理必须回到原始 MemoryItemVersion 和来源对象。禁止反复“摘要的摘要”，避免事实漂移。

### 14.7 RAG 新鲜度

RAG 索引落后时：

- Memory Center 显示延迟。
- 严格任务直接读取结构化 MemoryItem。
- ContextBundle 标记来源版本。
- 不用旧索引覆盖新记忆。

## 15. 可视化与交互要求

### 15.1 Memory Center

显示：

- 各类型记忆数量。
- 待确认候选。
- 冲突。
- 待复核。
- 来源失效。
- RAG 同步延迟。
- 最近变化。
- 健康状态。

### 15.2 记忆列表

每条显示：

- Statement。
- MemoryType。
- 主题。
- 状态。
- 权威。
- Story Time。
- 来源。
- 当前版本。
- 风险。
- 最近更新时间。

### 15.3 记忆详情

包含：

- 结构化事实。
- 人类可读陈述。
- 真相视角。
- Story Time。
- System Time。
- 来源和证据。
- 权威。
- 版本链。
- 冲突。
- RAG 索引状态。
- 被哪些任务使用。

### 15.4 候选收件箱

支持：

- 按类型和风险分组。
- 逐条接受。
- 批量接受低风险候选。
- 编辑后接受。
- 拒绝。
- 延期。
- 查看重复和冲突。

批量接受不能包含 high / critical 候选。

### 15.5 冲突工作台

并列展示：

- 现有事实。
- 新候选。
- 故事时间。
- 真相视角。
- 权威。
- 来源。
- 受影响任务和对象。
- 解决选项。

### 15.6 版本时间线

```text
V1 创建
  → V2 纠正
  → V3 限定故事时间
  → V4 被领域事实替代
```

支持按 Story Time 和 System Time 切换。

### 15.7 记忆图

节点：

- MemoryItem。
- 来源对象。
- 人物。
- 线索。
- 世界观。
- 章节。

边：

- derivedFrom。
- supersedes。
- contradicts。
- appliesTo。
- usedBy。

### 15.8 健康页

显示：

- 孤立记忆。
- 来源 stale / missing。
- 开放冲突。
- 重复候选。
- 待复核。
- RAG 未同步。
- 跨小说泄漏检查。
- 删除未完成。

## 16. 异常情况

### 16.1 候选缺少来源

- 原生用户偏好可以使用用户输入事件作为来源。
- 领域事实缺少 sourceVersion 时禁止确认。
- Agent 推断缺少证据时只能保存为建议，不是记忆候选。

### 16.2 一次性指令被误判为偏好

- 默认等待确认。
- 显示作用范围。
- 用户可标记“仅本次”。
- 不写入 Workflow / Style Memory。

### 16.3 人物状态看似冲突

- 检查 Story Time。
- 如果是前后变化，拆分有效区间。
- 不把状态变化误判为 valueConflict。

### 16.4 人物认知与作者真相不同

- 检查 TruthPerspective。
- 分别保存 authorTruth 和 characterKnowledge。
- 建立来源关系，不互相覆盖。

### 16.5 记忆与源事实不一致

- sourceHealth 进入 `stale` / `conflicted`。
- 创建 MemorySyncJob。
- 关键任务优先读取源事实。
- 不自动修改源对象。

### 16.6 来源对象被归档

- 记忆可以继续保留。
- 标记来源归档。
- 普通检索按 MemoryPolicy 决定。
- 仍可跳转到归档对象。

### 16.7 来源对象被删除

- 记忆进入 `needsReview` 或 `revoked`。
- 创建 sourceMissing / sourceRevoked 冲突。
- RAG 更新索引。
- 隐私硬删除要求同步清理证据摘录。

### 16.8 用户撤销记忆

- 创建新事件。
- 状态进入 `revoked`。
- 保留允许的历史。
- RAG 停止普通召回。
- 不反向删除源领域事实。

### 16.9 并发修改

- 使用当前版本号乐观锁。
- 冲突编辑保存为两个候选。
- 用户选择或合并。
- 不使用最后写入覆盖。

### 16.10 RAG 索引失败

- 记忆仍然有效。
- 标记 `ragIndexLag`。
- 严格任务直接读取数据库。
- 重试索引任务。

### 16.11 记忆过多

- 按类型、重要度、当前范围和时间检索。
- 不自动删除 Core Canon。
- 提示整理重复和过期偏好。
- RAG 负责检索，不把所有记忆塞入上下文。

### 16.12 语义相似但含义不同

- 标记 possible duplicate。
- 展示差异字段和时间。
- 不自动合并。

### 16.13 跨小说复制

- 复制为目标小说新 `memoryId`。
- 默认进入候选。
- 保留 originNovelId 和来源引用。
- 不共享可变版本链和 RAG 向量。

### 16.14 小说归档

- MemorySpace 进入 `archived`。
- 默认只读。
- 暂停自动候选和复核。
- 恢复时校验来源和 RAG 新鲜度。

### 16.15 小说删除

- MemorySpace 进入 `deleting`。
- 停止所有读取和写入。
- 创建批量硬删除与 RAG Tombstone。
- 清理 MemoryItem、候选、冲突、索引和缓存。
- 仅保留策略允许的最小审计元数据。
- 校验 `crossNovelLeakCount` 和残留为 0。

### 16.16 摘要漂移

- 对比 MemoryItem 与原始来源。
- 标记 memorySourceDrift。
- 从原始来源重新生成候选。
- 不从旧摘要继续压缩。

## 17. 验收标准

### 17.1 小说隔离

- 所有记忆、候选、版本、冲突、同步、删除和事件有 `novelId`。
- 所有读取和写入首先过滤 `novelId`。
- 跨小说复制产生新 ID。
- `crossNovelLeakCount` 必须为 0。

### 17.2 候选写入

- Agent 和领域系统只能先创建候选。
- 候选包含主题、谓词、值、视角、时间、来源和风险。
- 复合事实可以拆分。
- 高风险候选必须用户确认。
- 一次性指令不会自动成为长期偏好。

### 17.3 来源与权威

- 领域投影记忆引用源对象和版本。
- 记忆继承来源权威。
- 原生记忆标明用户 / 策略确认。
- 记忆不能覆盖领域 Canon。
- 来源失效可以检测。

### 17.4 版本与时间

- MemoryItemVersion 不可变。
- 更新创建新版本并保留历史。
- 支持 Story Time 和 System Time。
- 可以复现某次任务当时使用的记忆版本。
- 状态变化不会误判为同一时间冲突。

### 17.5 冲突

- 冲突保存双方来源和权威。
- 可以区分值、时间、视角、版本和来源冲突。
- 冲突不能自动删除低权威记忆。
- 用户解决形成 MemoryConflictResolution。
- 上游领域冲突可以返回来源模块。

### 17.6 撤销、过期和删除

- 记忆可以复核、过期、替代、撤销和归档。
- 撤销不删除源领域事实。
- 删除会传播到 RAG 和缓存。
- 隐私硬删除清理证据摘录。
- 小说删除可以验证无残留。

### 17.7 RAG

- active 记忆可以进入索引。
- 非活动记忆默认不进入普通检索。
- RAG 不写记忆。
- 索引落后可见。
- 严格任务可以绕过 stale 索引读取数据库。

### 17.8 健康

- 可以生成 MemoryHealthReport。
- 能发现来源丢失、冲突、孤立、重复、待复核和索引延迟。
- 健康问题可以跳转处理。
- 跨小说泄漏会阻断正常状态。

### 17.9 数据完整性

- MemoryItemVersion、当前指针和 MemoryEvent 原子提交。
- Outbox 事件可重试且幂等。
- 并发更新使用乐观锁。
- 不发生最后写入静默覆盖。

### 17.10 用户可控

- 用户可以查看 Agent 记住了什么。
- 可以查看来源和版本。
- 可以拒绝、编辑、撤销和删除。
- 可以配置 MemoryPolicy。
- 批量接受不会包含高风险候选。

## 18. 后续版本

### 18.1 V2

- 更强的实体消歧。
- 记忆重要度衰减和复核推荐。
- 章节级认知矩阵。
- 记忆覆盖率和缺口分析。
- 多候选批量冲突解决。
- 记忆图时间动画。
- 用户自定义 MemoryType。
- 更完整的隐私删除报告。

### 18.2 V3

- 系列小说授权共享记忆。
- 多人记忆审批。
- 可验证的自动记忆整理。
- 私有记忆抽取模型评测。
- 跨媒介世界观记忆。
- 复杂事件溯源和分支时间线。

## 19. 与其他 Spec 的边界

| 相关 Spec | 边界 |
|---|---|
| `01-novel-project-spec.md` | 初始化 MemorySpace 和基础策略；本 Spec 定义完整记忆生命周期 |
| `02-novel-cockpit-spec.md` | Cockpit 展示记忆摘要；本 Spec 提供 Memory Center |
| `03-inspiration-vault-spec.md` | 灵感库拥有原始灵感；本 Spec 不让灵感直接进入 Core Canon |
| `04-arc-swimlane-diagram-spec.md` | 泳道图拥有结构事实；本 Spec 保存批准后的投影 |
| `05-clue-foreshadowing-spec.md` | 线索系统拥有线索事实；本 Spec 保存 Clue Memory 投影 |
| `06-character-system-spec.md` | 人物系统拥有人物事实；本 Spec 保存 Character Memory 投影 |
| `07-worldbuilding-system-spec.md` | 世界观系统拥有设定事实；本 Spec 保存 World / Canon 投影 |
| `08-chapter-writing-spec.md` | 写作系统生成事实候选；本 Spec 只接受经目标领域确认的事实 |
| `09-chapter-review-spec.md` | 审查系统生成 Review / Style / Intent 候选；本 Spec 管理确认和版本 |
| `10-agent-orchestration-spec.md` | 编排系统提交 MemoryWriteCandidate；本 Spec 决定是否写入 |
| `11-model-router-spec.md` | 模型路由提供抽取模型并提交偏好候选；本 Spec 不选择模型 |
| `12-rag-context-engine-spec.md` | RAG 索引和检索 active 记忆；本 Spec 拥有 MemoryItem |
| `14-skill-system-spec.md` | Skill 声明记忆读写需求；本 Spec 执行权限和生命周期规则 |
| `15-publish-review-spec.md` | 发布审核可以读取记忆；本 Spec 不作发布判断 |
