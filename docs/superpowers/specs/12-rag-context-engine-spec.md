# 12 RAG Context Engine Spec

状态：Review Candidate

日期：2026-07-09

上游依赖：

- `01-novel-project-spec.md`：所有项目知识、索引和查询必须按 `novelId` 隔离。
- `03-inspiration-vault-spec.md`：灵感可以作为低权威检索资料，但不是 Canon。
- `04-arc-swimlane-diagram-spec.md`：篇章、泳道和事件节点提供结构化剧情上下文。
- `05-clue-foreshadowing-spec.md`：线索系统提供线索链、归因、信息状态和来源。
- `06-character-system-spec.md`：人物系统提供人物档案、关系、状态、知情和声音样例。
- `07-worldbuilding-system-spec.md`：世界观系统提供条目、规则、状态和揭示计划。
- `08-chapter-writing-spec.md`：写作系统消费冻结的 `ContextBundle`。
- `09-chapter-review-spec.md`：审查系统消费可追溯证据和权威来源。
- `10-agent-orchestration-spec.md`：编排系统提交 `ContextRequest`，每次尝试绑定冻结上下文。
- `11-model-router-spec.md`：模型路由提供生成、Embedding、Reranker 和压缩模型。

相关底座文档：`2026-07-08-novel-agent-product-foundation-design.md`

## 1. 功能定位

RAG Context Engine 是把一本小说分散在结构化数据库、正文版本、状态卡、长期记忆、灵感和项目资料中的相关内容检索出来，经过排序、冲突标记、压缩和引用组装，形成任务可直接使用上下文的系统。

它是一套软件子系统，不是单独一个向量数据库，也不是长期记忆的替代品。它由以下部分组成：

```text
知识源接入
  → 版本快照
  → 领域化切片
  → 关键词 / 向量 / 关系索引
  → 混合检索
  → 重排与冲突检测
  → Token 预算组装
  → 冻结 ContextBundle
```

它解决的问题是：

1. 长篇小说资料超过单次模型上下文窗口。
2. 不同任务需要不同的最小充分上下文。
3. 只用向量相似度会漏掉人物 ID、时间、线索状态和精确规则。
4. 草案、灵感、正文证据和 Canon 的权威不同。
5. 修改或删除资料后，旧索引不能继续误导模型。
6. 每个检索结果必须能跳回原始来源和具体版本。
7. 冲突资料必须并列返回，不能在检索层擅自合并成“真相”。
8. 不同小说的数据、向量和缓存不能串库。

一句话定义：

> RAG Context Engine 是小说 Agent 的上下文供应链：它负责把正确版本、正确权威、正确范围的资料，在 Token 预算内带着引用交给任务，但不决定什么是 Canon。

## 2. 核心边界

### 2.1 结构化业务系统是真相源

以下系统拥有正式事实：

- 人物系统。
- 世界观系统。
- 线索 / 伏笔系统。
- 篇章 / 泳道图系统。
- 章节正文版本系统。
- 长期记忆系统。

RAG 索引只是这些事实的可重建投影。

### 2.2 RAG 不等于长期记忆

| RAG Context Engine | Long-Term Memory |
|---|---|
| 为当前任务检索相关内容 | 保存需要跨会话持续存在的确认信息 |
| 结果是临时 ContextBundle | 条目有独立生命周期和确认规则 |
| 可以从源数据重建 | 是正式业务数据的一部分 |
| 不自动写入新事实 | 可以在确认后保存新记忆 |

### 2.3 RAG 不拥有 Canon 决策

检索结果可以：

- 提供证据。
- 标记权威等级。
- 发现版本差异。
- 标记冲突。

检索结果不可以：

- 覆盖结构化事实。
- 选择冲突中的胜者。
- 把模型摘要写回 Canon。
- 把相似文本当成同一对象。

### 2.4 向量检索不是唯一检索

Context Engine 必须组合：

- 结构化精确查询。
- 元数据过滤。
- 关键词 / 全文检索。
- 向量语义召回。
- 关系图扩展。
- 时间与版本过滤。
- Reranker 精排。

## 3. 用户角色与入口

### 3.1 普通作者

在章节写作、审查和 Agent 任务中查看“本次模型将读取什么”，无需理解向量数据库。

### 3.2 精细控制型作者

调整检索范围、排除资料、固定必选来源、查看冲突和重新生成上下文包。

### 3.3 长篇项目作者

查看索引健康、过期资料、未完成索引和跨章上下文覆盖情况。

### 3.4 开发者 / 管理员

管理 Embedding、Reranker、索引版本、重建任务、检索评测和存储健康。

### 3.5 业务入口

Context Engine 主要被以下模块调用：

- 章节写作。
- 章节审查。
- Agent 编排。
- 人物、世界观和线索一致性检查。
- 篇章结构分析。
- 灵感查重与关联建议。

### 3.6 管理入口

```text
Novel Cockpit
  → 项目设置 / Memory & Context
  → Context Engine
```

管理页展示：

- 知识源。
- 索引状态。
- Embedding / Reranker。
- 最近同步。
- 失败任务。
- 存储量。
- 检索测试。
- ContextBundle 历史。

## 4. 核心用户目标

### 4.1 为任务获得最小充分上下文

只加载完成当前任务必需的资料，避免把整本小说塞给模型。

### 4.2 确保事实来源正确

看到每条上下文来自哪个对象、哪个版本、哪段正文和哪个权威层。

### 4.3 控制剧透与知情范围

章节写作时区分：

- 作者可见真相。
- 当前 POV 人物已知。
- 其他人物已知。
- 读者当前已知。
- 禁止提前揭示。

### 4.4 发现上下文冲突

看到 Canon、已发布正文、批准计划和草案之间的差异。

### 4.5 保持索引新鲜

修改、归档、删除或回滚源数据后，索引及时更新或明确标记过期。

### 4.6 验证检索质量

使用测试查询确认关键人物、规则、线索和章节能够被召回。

### 4.7 安全删除

删除小说或资料后，向量、全文索引、缓存和上下文包按策略失效，不留下可检索残片。

## 5. MVP 范围

### 5.1 必须包含

- 每本小说独立的知识命名空间。
- 结构化对象接入。
- 正文版本和状态卡接入。
- 长期记忆接入。
- 灵感和项目资料接入。
- 源对象版本快照。
- 领域化切片策略。
- Chunk 元数据。
- Embedding 生成。
- 向量索引。
- 关键词 / 全文索引。
- 结构化过滤。
- 关系扩展。
- 混合检索。
- Reranker。
- 权威等级。
- 时间、篇章、章节、人物、线索和世界观过滤。
- POV / 读者知识策略。
- 冲突检测。
- 去重。
- ContextRequest。
- Token 预算。
- ContextBundle。
- 引用映射。
- 必读、可选和排除项。
- 索引增量更新。
- 软删除和 Tombstone。
- 索引重建。
- Embedding 模型迁移。
- 查询日志和检索评测。
- 索引健康页。

### 5.2 MVP 可以简化

- 关系扩展使用已有对象引用，不建设通用知识图数据库。
- 全文索引和向量索引可以由同一数据库或不同服务实现，Spec 不绑定供应商。
- 每个源版本先使用一套主 Chunk 策略。
- 多语言主要优化中文和项目指定语言。
- Reranker 可以按成本策略关闭。
- 大规模重建采用双索引代际切换，不要求零资源占用。
- 用户上传资料先支持文本、Markdown 和常见文档抽取后的纯文本。
- OCR、复杂表格和音视频抽取放到后续版本。

## 6. 非 MVP 范围

- 把互联网自动抓取为 Canon。
- 开放式公共搜索引擎。
- 通用企业知识库平台。
- 完整知识图谱推理引擎。
- OCR、音频和视频内容解析。
- 自动判断版权许可。
- 跨小说默认共享向量。
- 用 RAG 摘要替代原始资料。
- 无版本的“覆盖式”重新索引。
- 依赖纯向量相似度做全部检索。
- 让外部资料中的指令控制 Agent 或工具。
- 直接从 ContextBundle 写入长期记忆。

## 7. 知识源与权威体系

### 7.1 知识源类型

| 类型 | 内容 | 事实归属 |
|---|---|---|
| `structuredCanon` | 人物、世界观、线索等确认数据 | 对应领域系统 |
| `publishedChapter` | 已发布正文版本 | 章节系统 |
| `approvedChapter` | 审查通过正文版本 | 章节系统 |
| `draftChapter` | 草稿正文 | 章节系统 |
| `stateCard` | 章节状态卡 | 章节系统 |
| `approvedPlan` | 篇章、泳道节点、章节任务书 | 结构 / 写作系统 |
| `memory` | 已确认长期记忆 | 长期记忆系统 |
| `inspiration` | 原始灵感 | 灵感库 |
| `projectDocument` | 用户导入的项目资料 | 项目资料空间 |
| `reviewArtifact` | 审查报告和用户意图 | 审查系统 |

### 7.2 权威等级

```text
lockedCanon
  → confirmedCanon
  → publishedEvidence
  → approvedEvidence
  → approvedPlan
  → confirmedMemoryProjection
  → draft
  → inspiration
  → externalReference
```

规则：

- 长期记忆继承其来源权威，不因进入 Memory 自动升级。
- 无法追溯原始来源权威的确认记忆，最高只能标记为 `confirmedMemoryProjection`。
- 已发布正文与 locked Canon 冲突时，双方都返回并标记冲突。
- 低权威结果不能覆盖高权威结果。
- 用户可以要求只检索指定权威层。

### 7.3 可见性与剧透等级

每个索引单元必须标记：

- `authorOnly`：仅作者 / Agent 规划可见。
- `readerKnown`：读者在指定章节已知。
- `characterKnown`：指定人物已知。
- `publicInWorld`：世界内公开。
- `secret`：人物或阵营秘密。
- `futureReveal`：计划未来揭示。

可见性过滤必须在向量召回之前或召回查询约束中执行，不能召回后才依赖模型自行忽略。

## 8. 索引与检索流程

### 8.1 索引管道

```text
领域对象变更
  → Outbox / DomainEvent
  → 创建 SourceSnapshot
  → 解析和规范化
  → 按领域切片
  → 生成 ChunkMetadata
  → 写入全文索引
  → 生成 Embedding
  → 写入向量索引
  → 建立关系引用
  → 校验数量与版本
  → 激活索引代际
```

### 8.2 领域化切片

#### 8.2.1 章节正文

- 优先按场景、段落和语义边界切片。
- 不在句子中间切断。
- 保存章节号、场景、POV、故事时间和字符范围。
- 保留相邻 Chunk 引用。
- 不把不同正文版本混进同一 Chunk。

#### 8.2.2 人物

按以下部分独立或组合切片：

- 身份与目标。
- 当前状态。
- 关系。
- 人物弧光。
- 知情状态。
- 对白样例。

#### 8.2.3 世界观

- 条目摘要。
- 作者真相与公开说法分开。
- 每条规则单独切片。
- 规则例外单独关联。
- 状态快照按故事时间切片。

#### 8.2.4 线索与伏笔

- 线索卡。
- 归因链。
- InformationState。
- 种下、发展、误导、回收节点。
- 不同阶段保持可关联但不合并成无阶段文本。

#### 8.2.5 记忆

- 单个事实或紧密相关事实组。
- 必须保留来源、确认人、生效时间和被替代关系。

#### 8.2.6 灵感与项目资料

- 灵感默认单条切片。
- 导入资料按标题、段落和语义边界切片。
- 外部资料必须标记 `externalReference`。

### 8.3 Chunk 大小策略

Chunk 大小由：

- 源类型。
- Embedding 模型上限。
- 目标语言。
- 检索粒度。
- 引用定位需求。

共同决定。

系统应保存：

- 原始字符范围。
- Token 估算。
- 前后相邻关系。
- 父对象。
- 语义摘要。

### 8.4 查询计划

```text
ContextRequest
  → 识别实体、时间、篇章和任务类型
  → 生成 RetrievalPlan
  → 执行结构化精确查询
  → 执行关键词检索
  → 执行向量召回
  → 执行关系扩展
  → 合并与去重
  → Reranker
  → 权威与可见性校验
  → 冲突检测
  → ContextAssembler
```

### 8.5 混合检索

候选分数至少考虑：

- 结构化精确命中。
- 关键词命中。
- 向量相似度。
- 关系距离。
- 任务相关性。
- 权威等级。
- 时间适配。
- 当前篇章 / 章节距离。
- 源版本新鲜度。
- 用户固定 / 排除。

权威等级不应简单作为语义相关性的替代；一个高权威但无关的对象不应挤掉直接相关资料。

### 8.6 关系扩展

可以沿已有引用扩展：

- Chapter → Character。
- Chapter → EventNode。
- EventNode → Clue / WorldItem。
- Character → Relation / InformationState。
- Clue → Provider / Trigger / Receiver / Payoff。
- WorldRule → Exception / ScopeItem。
- Memory → SourceObject。

关系扩展必须限制深度、节点数和数据域。

### 8.7 重排

Reranker 输入：

- 查询目标。
- 候选摘要或片段。
- 元数据。
- 任务类型。

Reranker 不得：

- 改写候选内容。
- 移除来源。
- 解除 `novelId`、权限或可见性过滤。
- 把低权威资料升级为 Canon。

### 8.8 冲突检测

冲突类型至少包括：

- 同一对象不同版本。
- Canon 与正文证据冲突。
- 规则与例外适用范围冲突。
- 人物状态时间冲突。
- 线索知情状态冲突。
- 记忆与来源对象冲突。
- 草案与确认事实冲突。

冲突结果必须保留双方来源和版本。

### 8.9 上下文组装

ContextAssembler 按以下顺序分配 Token：

1. 用户明确指令。
2. 当前任务目标和输出契约。
3. 必读 locked / confirmed Canon。
4. 当前范围结构对象。
5. 当前人物、线索、世界状态。
6. 因果前置章节和状态卡。
7. 风格规则和样例。
8. 可选参考资料。

Token 不足时先移除低优先级和重复内容，不能静默截断必读 Canon。

## 9. 核心数据对象与字段

本节“必填”表示字段必须存在；数组可以为空，除非校验规则另有要求。

### 9.1 KnowledgeSourceRef

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `knowledgeSourceId` | string | 是 | 知识源 ID |
| `novelId` | string | 是 | 所属小说 |
| `sourceType` | enum | 是 | 知识源类型 |
| `sourceObjectId` | string | 是 | 业务对象 ID |
| `sourceVersionId` | string | 是 | 不可变源版本 |
| `originNovelId` | string | 否 | 显式只读跨项目引用的来源小说 |
| `originSourceObjectId` | string | 否 | 来源小说中的对象 |
| `authority` | enum | 是 | 权威等级 |
| `visibilityPolicyId` | string | 是 | 可见性策略 |
| `storyOrderFrom` | number | 否 | 生效故事顺序 |
| `storyOrderTo` | number | 否 | 失效故事顺序 |
| `contentHash` | string | 是 | 源内容 Hash |
| `status` | enum | 是 | `active`、`stale`、`deleted`、`unavailable` |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

跨小说只读引用必须先在目标小说创建独立 `KnowledgeSourceRef`，使用目标 `novelId` 建索引，并保留 `originNovelId` 和来源对象；不得直接查询来源小说的向量命名空间。

### 9.2 SourceSnapshot

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `sourceSnapshotId` | string | 是 | 快照 ID |
| `novelId` | string | 是 | 所属小说 |
| `knowledgeSourceId` | string | 是 | 知识源 |
| `sourceObjectId` | string | 是 | 原对象 |
| `sourceVersionId` | string | 是 | 原版本 |
| `schemaVersion` | string | 是 | 源 Schema |
| `normalizedContentRef` | string | 是 | 规范化内容 |
| `metadata` | object | 是 | 领域元数据 |
| `contentHash` | string | 是 | 内容 Hash |
| `createdAt` | ISO datetime | 是 | 创建时间 |

SourceSnapshot 不替代原对象，只用于可重建索引和历史检索复现。

### 9.3 IndexGeneration

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `indexGenerationId` | string | 是 | 索引代际 ID |
| `novelId` | string | 是 | 所属小说 |
| `indexPurpose` | enum | 是 | `primaryKnowledge`、`reviewEvidence`、`experimental` |
| `embeddingModelProfileId` | string | 是 | Embedding 模型 |
| `embeddingModelVersion` | string | 否 | 实际版本 |
| `embeddingDimension` | number | 是 | 向量维度 |
| `chunkStrategyVersion` | string | 是 | 切片策略 |
| `fullTextIndexVersion` | string | 是 | 全文索引版本 |
| `metadataSchemaVersion` | string | 是 | 元数据版本 |
| `status` | enum | 是 | `building`、`validating`、`active`、`stale`、`failed`、`retired`、`deleting` |
| `documentCount` | number | 是 | 文档数 |
| `chunkCount` | number | 是 | Chunk 数 |
| `activatedAt` | ISO datetime | 否 | 激活时间 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

同一小说同一 `indexPurpose` 只能有一个主 `active` 代际；迁移期间允许存在一个 building 代际。

### 9.4 IndexDocument

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `indexDocumentId` | string | 是 | 索引文档 ID |
| `novelId` | string | 是 | 所属小说 |
| `indexGenerationId` | string | 是 | 索引代际 |
| `sourceSnapshotId` | string | 是 | 源快照 |
| `knowledgeSourceId` | string | 是 | 知识源 |
| `sourceObjectId` | string | 是 | 原对象 |
| `sourceVersionId` | string | 是 | 原版本 |
| `domain` | enum | 是 | `structure`、`character`、`clue`、`world`、`chapter`、`memory`、`inspiration`、`review`、`document` |
| `title` | string | 是 | 标题 |
| `authority` | enum | 是 | 权威 |
| `visibilityPolicyId` | string | 是 | 可见性 |
| `metadata` | object | 是 | 检索字段 |
| `status` | enum | 是 | `indexing`、`ready`、`stale`、`failed`、`deleted` |
| `indexedAt` | ISO datetime | 否 | 索引时间 |

### 9.5 KnowledgeChunk

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `chunkId` | string | 是 | Chunk ID |
| `novelId` | string | 是 | 所属小说 |
| `indexGenerationId` | string | 是 | 索引代际 |
| `indexDocumentId` | string | 是 | 父文档 |
| `sourceSnapshotId` | string | 是 | 源快照 |
| `sourceObjectId` | string | 是 | 原对象 |
| `sourceVersionId` | string | 是 | 原版本 |
| `chunkType` | string | 是 | 领域切片类型 |
| `sequenceNumber` | number | 是 | 文档内顺序 |
| `text` | text | 是 | 可检索文本 |
| `summary` | string | 否 | 可选摘要 |
| `charStart` | number | 否 | 原文起点 |
| `charEnd` | number | 否 | 原文终点 |
| `tokenEstimate` | number | 是 | Token 估算 |
| `previousChunkId` | string | 否 | 前一块 |
| `nextChunkId` | string | 否 | 后一块 |
| `authority` | enum | 是 | 权威 |
| `metadata` | object | 是 | 人物、章节、时间等 |
| `contentHash` | string | 是 | 内容 Hash |
| `status` | enum | 是 | `ready`、`stale`、`deleted` |

禁止一个 Chunk 包含多个 `novelId` 或多个不相容源版本。

### 9.6 EmbeddingRecord

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `embeddingRecordId` | string | 是 | 向量记录 ID |
| `novelId` | string | 是 | 所属小说 |
| `indexGenerationId` | string | 是 | 索引代际 |
| `chunkId` | string | 是 | Chunk |
| `embeddingModelProfileId` | string | 是 | 模型 |
| `resolvedModelVersion` | string | 否 | 实际版本 |
| `dimension` | number | 是 | 向量维度 |
| `vectorRef` | string | 是 | 向量存储引用 |
| `inputHash` | string | 是 | 嵌入输入 Hash |
| `status` | enum | 是 | `ready`、`stale`、`failed`、`deleted` |
| `createdAt` | ISO datetime | 是 | 创建时间 |

不同 Embedding 模型或维度的向量不能写入同一代际进行直接相似度比较。

### 9.7 SourceRelation

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `sourceRelationId` | string | 是 | 关系 ID |
| `novelId` | string | 是 | 所属小说 |
| `fromSourceObjectId` | string | 是 | 起点 |
| `toSourceObjectId` | string | 是 | 终点 |
| `relationType` | string | 是 | 关系类型 |
| `direction` | enum | 是 | `oneWay`、`mutual` |
| `sourceVersionRefs` | string[] | 是 | 关系来源版本 |
| `status` | enum | 是 | `active`、`stale`、`deleted` |

SourceRelation 是业务关系的检索投影，不是新的业务关系事实源。

### 9.8 IndexingJob

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `indexingJobId` | string | 是 | 任务 ID |
| `novelId` | string | 是 | 所属小说 |
| `indexGenerationId` | string | 是 | 目标代际 |
| `jobType` | enum | 是 | `upsertSource`、`deleteSource`、`rebuildNovel`、`migrateEmbedding`、`validateGeneration` |
| `sourceObjectRefs` | object[] | 是 | 目标对象 |
| `idempotencyKey` | string | 是 | 幂等键 |
| `status` | enum | 是 | `queued`、`running`、`partiallyCompleted`、`completed`、`failed`、`cancelled` |
| `processedCount` | number | 是 | 已处理 |
| `failedItems` | object[] | 是 | 失败项 |
| `error` | object | 否 | 错误 |
| `startedAt` | ISO datetime | 否 | 开始时间 |
| `endedAt` | ISO datetime | 否 | 结束时间 |

### 9.9 IndexTombstone

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `tombstoneId` | string | 是 | Tombstone ID |
| `novelId` | string | 是 | 所属小说 |
| `sourceObjectId` | string | 是 | 已删除对象 |
| `sourceVersionId` | string | 是 | 已删除版本 |
| `affectedIndexGenerationIds` | string[] | 是 | 受影响代际 |
| `deleteReason` | string | 是 | 删除原因 |
| `deleteRequestedAt` | ISO datetime | 是 | 请求时间 |
| `purgedAt` | ISO datetime | 否 | 完成清理 |
| `status` | enum | 是 | `pending`、`deleting`、`purged`、`failed` |

### 9.10 VisibilityPolicy

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `visibilityPolicyId` | string | 是 | 策略 ID |
| `novelId` | string | 是 | 所属小说 |
| `visibilityLevel` | enum | 是 | `authorOnly`、`readerKnown`、`characterKnown`、`publicInWorld`、`secret`、`futureReveal` |
| `characterIds` | string[] | 是 | 相关人物 |
| `factionIds` | string[] | 是 | 相关阵营 |
| `effectiveFromChapterId` | string | 否 | 生效章节 |
| `effectiveFromStoryOrder` | number | 否 | 生效顺序 |
| `allowedTaskTypes` | string[] | 是 | 允许任务 |
| `createdFromRefs` | object[] | 是 | 人物知情 / 揭示依据 |

### 9.11 ContextRequest

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `contextRequestId` | string | 是 | 请求 ID |
| `novelId` | string | 是 | 所属小说 |
| `taskVersionId` | string | 否 | AgentTask |
| `attemptId` | string | 否 | TaskAttempt |
| `requesterType` | enum | 是 | `writing`、`review`、`orchestration`、`domainAnalysis`、`userTest` |
| `purpose` | string | 是 | 本次上下文用途 |
| `queryText` | string | 是 | 任务查询 |
| `scopeRefs` | object[] | 是 | 篇章、章节、人物等范围 |
| `requiredSourceRefs` | object[] | 是 | 必读源 |
| `excludedSourceRefs` | object[] | 是 | 排除源 |
| `allowedDomains` | string[] | 是 | 允许数据域 |
| `minimumAuthority` | enum | 是 | 最低权威 |
| `visibilityMode` | enum | 是 | `authorFull`、`readerAtChapter`、`characterAtChapter`、`publicOnly` |
| `viewerCharacterId` | string | 否 | 人物视角 |
| `atChapterId` | string | 否 | 知识时间点 |
| `atStoryOrder` | number | 否 | 故事顺序 |
| `tokenBudget` | number | 是 | 总 Token 预算 |
| `reservedOutputTokens` | number | 是 | 为输出预留 |
| `retrievalPolicyId` | string | 是 | 检索策略 |
| `spoilerPolicy` | enum | 是 | `allowAuthorSecrets`、`respectReaderKnowledge`、`respectCharacterKnowledge` |
| `freshnessRequirement` | enum | 是 | `strict`、`preferFresh`、`allowStaleWithWarning` |
| `createdAt` | ISO datetime | 是 | 创建时间 |

校验规则：

- `novelId` 必须与任务、范围对象和所有必读源一致。
- `characterAtChapter` 必须提供 `viewerCharacterId` 和章节 / 故事顺序。
- `readerAtChapter` 必须提供章节 / 故事顺序。
- `tokenBudget` 必须大于必需系统开销和 `reservedOutputTokens`。

### 9.12 RetrievalPolicy

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `retrievalPolicyId` | string | 是 | 策略 ID |
| `novelId` | string | 否 | 空表示工作区模板 |
| `name` | string | 是 | 名称 |
| `retrievalModes` | string[] | 是 | `structured`、`lexical`、`vector`、`graph` |
| `candidateLimits` | object | 是 | 各通道候选上限 |
| `scoreWeights` | object | 是 | 混合权重 |
| `graphDepth` | number | 是 | 关系扩展深度 |
| `rerankerModelAliasId` | string | 否 | Reranker |
| `rerankLimit` | number | 是 | 精排上限 |
| `dedupeThreshold` | number | 是 | 去重阈值 |
| `authorityPolicy` | object | 是 | 权威规则 |
| `freshnessPolicy` | object | 是 | 新鲜度 |
| `version` | number | 是 | 版本 |
| `status` | enum | 是 | `draft`、`active`、`archived` |

### 9.13 RetrievalPlan

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `retrievalPlanId` | string | 是 | 计划 ID |
| `novelId` | string | 是 | 所属小说 |
| `contextRequestId` | string | 是 | 请求 |
| `indexGenerationId` | string | 是 | 使用索引代际 |
| `parsedEntities` | object[] | 是 | 人物、地点、线索等 |
| `structuredQueries` | object[] | 是 | 精确查询 |
| `lexicalQueries` | object[] | 是 | 关键词查询 |
| `vectorQueries` | object[] | 是 | 向量查询 |
| `graphSeeds` | object[] | 是 | 关系扩展起点 |
| `filters` | object[] | 是 | novel、时间、权威、可见性等 |
| `budgetAllocation` | object | 是 | 候选和 Token 分配 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.14 RetrievalRun

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `retrievalRunId` | string | 是 | 运行 ID |
| `novelId` | string | 是 | 所属小说 |
| `contextRequestId` | string | 是 | 请求 |
| `retrievalPlanId` | string | 是 | 计划 |
| `indexGenerationId` | string | 是 | 索引代际 |
| `status` | enum | 是 | `queued`、`running`、`completed`、`partiallyCompleted`、`failed`、`cancelled` |
| `candidateIds` | string[] | 是 | 候选 |
| `conflictIds` | string[] | 是 | 冲突 |
| `channelMetrics` | object | 是 | 各检索通道统计 |
| `modelUsageRefs` | object[] | 是 | Embedding / Reranker 用量 |
| `warnings` | object[] | 是 | 过期、缺失等 |
| `startedAt` | ISO datetime | 否 | 开始时间 |
| `endedAt` | ISO datetime | 否 | 结束时间 |

### 9.15 RetrievalCandidate

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `candidateId` | string | 是 | 候选 ID |
| `novelId` | string | 是 | 所属小说 |
| `retrievalRunId` | string | 是 | 运行 |
| `chunkId` | string | 是 | Chunk |
| `sourceObjectId` | string | 是 | 原对象 |
| `sourceVersionId` | string | 是 | 原版本 |
| `matchedChannels` | string[] | 是 | structured / lexical / vector / graph |
| `channelScores` | object | 是 | 各通道分 |
| `combinedScore` | number | 是 | 混合分 |
| `rerankScore` | number | 否 | 精排分 |
| `authority` | enum | 是 | 权威 |
| `freshnessStatus` | enum | 是 | `fresh`、`stale`、`unknown` |
| `visibilityMatched` | boolean | 是 | 可见性是否满足 |
| `relevanceReason` | string | 是 | 相关原因 |
| `selected` | boolean | 是 | 是否进入组装 |
| `excludedReason` | string | 否 | 排除原因 |

### 9.16 ContextConflict

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `contextConflictId` | string | 是 | 冲突 ID |
| `novelId` | string | 是 | 所属小说 |
| `retrievalRunId` | string | 是 | 运行 |
| `type` | enum | 是 | `versionConflict`、`canonConflict`、`timelineConflict`、`knowledgeConflict`、`memorySourceConflict`、`draftConflict` |
| `candidateIds` | string[] | 是 | 冲突候选 |
| `sourceRefs` | object[] | 是 | 双方来源 |
| `authorityComparison` | object | 是 | 权威对比 |
| `summary` | string | 是 | 冲突说明 |
| `requiresUserDecision` | boolean | 是 | 是否需用户 |
| `status` | enum | 是 | `open`、`acknowledged`、`resolvedUpstream`、`ignoredForRequest` |

Context Engine 只记录和展示冲突；`resolvedUpstream` 必须由源领域系统解决后更新。

### 9.17 ContextBundle

本对象是 `08-chapter-writing-spec.md` 中 ContextBundle 的完整定义；写作 Spec 中字段视为兼容子集。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `contextBundleId` | string | 是 | 不可变上下文包 ID |
| `bundleVersion` | number | 是 | 版本 |
| `novelId` | string | 是 | 所属小说 |
| `contextRequestId` | string | 是 | 来源请求 |
| `taskVersionId` | string | 否 | 任务 |
| `attemptId` | string | 否 | 尝试 |
| `chapterId` | string | 否 | 写作 / 审查目标章节 |
| `briefId` | string | 否 | 章节任务书版本 |
| `purpose` | string | 是 | 用途 |
| `indexGenerationId` | string | 是 | 使用索引代际 |
| `retrievalRunIds` | string[] | 是 | 检索运行 |
| `itemRefs` | `ContextItemRef[]` | 是 | 上下文条目 |
| `requiredItemRefs` | string[] | 是 | 必读条目 |
| `recentChapterVersionIds` | string[] | 是 | 因果前置或最近正文版本 |
| `recentStateCardIds` | string[] | 是 | 相关状态卡 |
| `styleProfileId` | string | 否 | 文风档案 |
| `skillIds` | string[] | 是 | 消费任务将使用的 Skill |
| `conflictIds` | string[] | 是 | 冲突 |
| `conflicts` | object[] | 是 | 冲突轻量快照，便于离线审计 |
| `omittedItems` | object[] | 是 | 移除项及原因 |
| `tokenBudget` | number | 是 | 总预算 |
| `tokenEstimate` | number | 是 | 已使用 Token 估算 |
| `reservedOutputTokens` | number | 是 | 输出预留 |
| `authorityPolicySnapshot` | object | 是 | 权威规则 |
| `visibilityPolicySnapshot` | object | 是 | 可见性规则 |
| `checksum` | string | 是 | 内容校验 |
| `status` | enum | 是 | `building`、`ready`、`incomplete`、`stale`、`superseded` |
| `createdAt` | ISO datetime | 是 | 创建时间 |

ContextBundle 被 TaskAttempt 使用后不可修改。增删资料必须创建新 Bundle 或明确的派生版本。

### 9.18 ContextItemRef

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `contextItemRefId` | string | 是 | 条目 ID |
| `novelId` | string | 是 | 所属小说 |
| `contextBundleId` | string | 是 | 所属 Bundle |
| `sourceType` | enum | 是 | 来源类型 |
| `sourceObjectId` | string | 是 | 原对象 |
| `sourceVersionId` | string | 是 | 原版本 |
| `chunkIds` | string[] | 是 | 对应 Chunk |
| `contentMode` | enum | 是 | `verbatim`、`extractiveSummary`、`structuredProjection`、`verifiedGenerativeSummary` |
| `content` | text | 是 | 提供给任务的内容 |
| `authority` | enum | 是 | 权威 |
| `priority` | enum | 是 | `required`、`high`、`normal`、`optional` |
| `relevanceReason` | string | 是 | 相关原因 |
| `retrievalScores` | object | 是 | 召回和重排分 |
| `citationRefIds` | string[] | 是 | 引用 |
| `tokenEstimate` | number | 是 | Token |
| `mayContainSpoiler` | boolean | 是 | 是否含作者秘密 |
| `conflictIds` | string[] | 是 | 相关冲突 |
| `included` | boolean | 是 | 是否进入最终模型输入 |
| `compressionModelUsageRef` | string | 否 | 生成式压缩模型用量 |
| `factualityStatus` | enum | 是 | `notRequired`、`pending`、`verified`、`failed` |

`extractiveSummary` 只能删减和重排原文，不能生成新事实。`verifiedGenerativeSummary` 必须保存压缩模型、输入 Chunk、逐项引用和事实校验结果；`factualityStatus` 不是 `verified` 时不得进入最终模型输入。

与 `08-chapter-writing-spec.md` 的兼容映射：

| 写作 Spec 字段 | Context Engine 字段 |
|---|---|
| `sourceId` | `sourceObjectId` |
| `sourceVersion` | `sourceVersionId` |
| `excerpt` | `content` |
| `included` | `included` |

### 9.19 CitationRef

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `citationRefId` | string | 是 | 引用 ID |
| `novelId` | string | 是 | 所属小说 |
| `sourceObjectId` | string | 是 | 原对象 |
| `sourceVersionId` | string | 是 | 原版本 |
| `sourceSnapshotId` | string | 是 | 源快照 |
| `chunkId` | string | 是 | Chunk |
| `anchor` | object | 是 | 字段、字符范围、段落或节点 |
| `excerpt` | string | 是 | 最短充分引用 |
| `authority` | enum | 是 | 权威 |
| `contentHash` | string | 是 | 引用内容 Hash |

### 9.20 RetrievalEvaluation

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `retrievalEvaluationId` | string | 是 | 评测 ID |
| `novelId` | string | 是 | 所属小说 |
| `querySetVersion` | string | 是 | 测试集 |
| `indexGenerationId` | string | 是 | 索引代际 |
| `retrievalPolicyVersion` | string | 是 | 策略 |
| `metrics` | object | 是 | Recall@K、Precision@K、MRR、nDCG 等 |
| `requiredSourceHitRate` | number | 是 | 必读源命中率 |
| `crossNovelLeakCount` | number | 是 | 跨小说泄漏数 |
| `staleResultCount` | number | 是 | 过期结果数 |
| `citationValidityRate` | number | 是 | 引用有效率 |
| `testCaseResults` | object[] | 是 | 单例结果 |
| `createdAt` | ISO datetime | 是 | 时间 |

`crossNovelLeakCount` 必须为 0，否则该索引代际不能激活。

## 10. 状态机与同步规则

### 10.1 索引代际状态

```text
building → validating → active
    │           │
    └→ failed   └→ failed

active → stale → retired → deleting
```

### 10.2 索引文档状态

```text
indexing → ready
    │        │
    └→ failed
             ready → stale → ready（重新索引）
             ready / stale → deleted
```

### 10.3 ContextBundle 状态

```text
building → ready
    │         │
    └→ incomplete
              ready → stale → superseded
```

### 10.4 增量同步

领域系统必须通过 Outbox / DomainEvent 提交：

- 对象创建。
- 版本更新。
- 状态变化。
- 权威变化。
- 可见性变化。
- 删除 / 归档。

IndexingJob 使用事件 ID 和源版本生成 `idempotencyKey`，重复事件不能产生重复 Chunk。

### 10.5 新鲜度

以下情况标记索引对象 `stale`：

- 源版本变化。
- 权威变化。
- 可见性变化。
- Chunk 策略变化。
- Embedding 模型变化。
- 元数据 Schema 变化。

严格新鲜度请求不得返回 stale Chunk。

### 10.6 Embedding 迁移

```text
创建新 IndexGeneration
  → 使用新 Embedding 模型重建
  → 同步追赶增量事件
  → 执行检索评测和泄漏检查
  → 原子切换 active 代际
  → 旧代际进入 retired
```

迁移期间禁止把不同向量空间的分数直接合并。

### 10.7 删除同步

```text
源对象删除 / 小说删除
  → 创建 Tombstone
  → 立即从查询过滤
  → 删除全文记录
  → 删除向量记录
  → 使缓存和 Bundle 失效
  → 校验无残留
  → Tombstone 进入 purged
```

## 11. 查询、缓存与数据库规则

### 11.1 查询必须先限定小说

所有检索通道必须把 `novelId` 作为硬过滤：

- 结构化 SQL。
- 全文索引。
- 向量索引。
- 关系扩展。
- 查询缓存。
- Reranker 候选。

不得依赖最终应用层再过滤跨小说结果。

### 11.2 建议的逻辑存储分层

| 存储 | 内容 |
|---|---|
| 关系数据库 | 源引用、版本、状态、元数据、任务、引用和冲突 |
| 全文索引 | 关键词、短语和字段检索 |
| 向量索引 | Embedding 和近邻检索 |
| 对象 / 文本存储 | 规范化快照和大文本 |
| 缓存 | 短期查询结果和 Bundle 读取加速 |

具体产品可以合并实现，但逻辑职责不能混淆。

### 11.3 关键索引维度

关系与全文元数据至少支持：

- `novelId`
- `indexGenerationId`
- `sourceObjectId`
- `sourceVersionId`
- `domain`
- `authority`
- `status`
- `arcId`
- `chapterId`
- `characterIds`
- `clueIds`
- `worldItemIds`
- `storyOrder`
- `visibilityLevel`

### 11.4 版本与唯一性

建议唯一约束：

```text
(indexGenerationId, sourceVersionId, chunkType, sequenceNumber)
(indexGenerationId, chunkId, embeddingModelProfileId)
(novelId, idempotencyKey)
```

所有 Update / Delete 必须带预期源版本，避免旧事件覆盖新索引。

### 11.5 查询缓存

缓存键至少包含：

- `novelId`
- ContextRequest 规范化 Hash。
- active IndexGeneration。
- RetrievalPolicy 版本。
- VisibilityPolicy 快照。
- 必读源版本。

任何一项变化都不能命中旧缓存。

### 11.6 缓存不是记忆

- 缓存可随时删除。
- 缓存无独立事实权威。
- 缓存内容不能写入长期记忆。
- 缓存必须遵守小说删除和凭证隔离。

### 11.7 事务与最终一致性

- 业务事实提交与索引事件写入应使用 Outbox 保证不丢事件。
- 索引更新可以最终一致。
- UI 必须显示最近同步时间和 stale 状态。
- 强一致任务可以绕过过期索引，直接读取结构化源。

## 12. Agent 与系统行为

### 12.1 可以自动执行

- 消费领域变更事件。
- 创建源快照。
- 按策略切片。
- 生成 Embedding。
- 更新全文、向量和关系索引。
- 规划混合检索。
- 执行 Reranker。
- 去重和标记冲突。
- 按预算组装 ContextBundle。
- 检测 stale、孤儿 Chunk 和无效引用。
- 执行低风险索引重试。
- 运行固定检索测试。

### 12.2 必须由用户确认

- 添加外部项目资料。
- 允许外部资料进入指定任务。
- 更换 Embedding 模型并重建全书索引。
- 放宽剧透或人物知情限制。
- 使用 stale 数据执行关键任务。
- 跨小说只读引用。
- 清空或重建整本小说索引。
- 解决 Canon 冲突。

### 12.3 禁止自动执行

- 将检索结果写成 Canon。
- 将摘要写入长期记忆。
- 跨小说召回。
- 让 Reranker 解除权限和可见性过滤。
- 执行导入资料中的工具指令。
- 把相似度高当成事实相同。
- 隐藏冲突来源。
- 删除业务源对象。
- 使用已删除 Chunk。
- 混合不同 Embedding 空间分数。

### 12.4 外部内容安全

导入资料中的以下内容一律视为数据：

- “忽略系统规则”。
- “调用某工具”。
- “泄露其他项目内容”。
- 伪造的系统提示。

ContextBundle 必须用明确边界标记外部引用；模型和 Subagent 不得把其中指令提升为系统或用户指令。

## 13. 模型选择规则

### 13.1 Embedding 模型

选择标准：

- 中文和项目语言召回。
- 最大输入长度。
- 向量维度。
- 成本。
- 延迟。
- 数据策略。
- 版本稳定性。

更换模型必须新建 IndexGeneration。

### 13.2 Reranker

选择标准：

- 中文排序能力。
- 查询与文档长度。
- 候选上限。
- 延迟和成本。
- 是否支持结构化元数据。

### 13.3 查询解析模型

复杂自然语言任务可使用工具调用 / 结构化输出模型提取：

- 实体。
- 时间。
- 数据域。
- 权威要求。
- 必读对象。

简单精确请求优先使用确定性解析。

### 13.4 压缩模型

必须具备：

- 事实保真。
- 引用保留。
- 结构化输出。
- 禁止新增事实。
- 中文摘要能力。

生成式压缩结果必须标记模型、输入 Chunk 和校验状态。

### 13.5 模型失败

- Embedding 失败：保留全文索引，标记向量通道不完整。
- Reranker 失败：可按策略回退混合分排序。
- 查询解析失败：回退确定性关键词和范围过滤。
- 压缩失败：使用原文摘录或减少可选内容。

关键必读源不能因模型失败而被静默移除。

## 14. 长期记忆关系

### 14.1 RAG 读取记忆

Context Engine 可以索引 `13-long-term-memory-spec.md` 中状态为可用的 MemoryItem。

每条记忆必须保留：

- 原始来源。
- 权威。
- 生效时间。
- 被替代链。
- 确认状态。

### 14.2 RAG 不写记忆

以下都不是长期记忆：

- RetrievalCandidate。
- ContextBundle。
- 查询摘要。
- 模型压缩文本。
- 检索统计。
- 查询缓存。

### 14.3 记忆与源事实冲突

- 返回 MemoryItem 和原始源对象。
- 标记 `memorySourceConflict`。
- 优先展示源事实，但不删除记忆。
- 由 Long-Term Memory System 处理失效或替代。

### 14.4 记忆失效

MemoryItem 被替代、撤销或删除后：

- 对应索引进入 stale / deleted。
- 后续严格查询不得返回。
- 使用过该记忆的 ContextBundle 标记 stale。
- 已完成任务保留历史 Bundle 以供审计。

## 15. 可视化与交互要求

### 15.1 Context Engine 管理页

显示：

- 知识源数量。
- 已索引 / 待索引 / 失败数量。
- active IndexGeneration。
- Embedding / Reranker。
- 最近同步。
- stale 对象。
- Tombstone 清理。
- 存储和成本。
- 最近检索。

### 15.2 ContextBundle 检查器

每条上下文显示：

- 来源名称和类型。
- 原对象和版本。
- 内容模式。
- 权威。
- 相关原因。
- 召回通道。
- 分数。
- Token。
- 剧透标记。
- 冲突。
- 引用跳转。

用户可以：

- 固定为必读。
- 移除。
- 降低 / 提高优先级。
- 查看原文。
- 重新检索。

修改后创建新 Bundle，不修改已使用版本。

### 15.3 检索调试视图

按阶段展示：

```text
ContextRequest
  → 实体和范围
  → 结构化结果
  → 关键词结果
  → 向量结果
  → 关系扩展
  → 重排
  → 去重
  → Token 组装
```

### 15.4 冲突视图

并列展示：

- 来源 A。
- 来源 B。
- 权威。
- 版本。
- 生效时间。
- 原文。
- 受影响任务。
- 上游解决入口。

### 15.5 索引健康视图

显示：

- 文档和 Chunk 数。
- Embedding 覆盖率。
- 全文覆盖率。
- stale 数量。
- 失败项。
- 孤儿 Chunk。
- 无效引用。
- 跨小说泄漏检查。
- 最近评测。

### 15.6 测试查询

用户可以输入：

```text
“女主在第 12 章之前知道潮汐教团的哪些信息？”
```

并查看候选、过滤、重排、冲突和最终 Bundle，不触发正文生成。

## 16. 异常情况

### 16.1 索引落后于源数据

- 标记 stale。
- `strict` 请求绕过或等待重建。
- `allowStaleWithWarning` 必须显示版本差异。
- 不把 stale 结果伪装为最新。

### 16.2 Embedding 维度不匹配

- 阻止写入当前代际。
- 创建失败记录。
- 检查模型版本和 IndexGeneration。
- 不自动截断或填充向量。

### 16.3 部分索引失败

- IndexingJob 进入 `partiallyCompleted`。
- 成功对象可用。
- 失败对象显示在健康页。
- 严格查询命中失败对象范围时返回 incomplete。

### 16.4 向量服务不可用

- 保留结构化和全文检索。
- RetrievalRun 标记通道缺失。
- 关键语义任务可等待恢复。
- 不把降级结果冒充完整检索。

### 16.5 Reranker 不可用

- 使用混合分排序。
- 标记未精排。
- 对高风险审查降低检索置信度。

### 16.6 没有检索结果

- 检查 novelId、范围、可见性、时间和权威过滤。
- 显示每层过滤数量。
- 可以建议放宽非安全范围。
- 不自动跨小说或跨权限寻找。

### 16.7 必读源超过 Token 预算

- 不删除必读源。
- 请求扩大模型上下文、拆分任务或结构化压缩。
- 无法解决时 ContextBundle 进入 `incomplete`。

### 16.8 冲突结果过多

- 按对象和根因分组。
- 推荐先解决上游 Canon。
- 允许任务只读执行但不得自动提交事实。

### 16.9 删除后仍可检索

- 立即禁用对应 Chunk。
- 创建高优先级清理任务。
- 使缓存和 Bundle stale。
- 运行残留检查。
- 记录数据完整性事故。

### 16.10 Chunk 无法定位原文

- CitationRef 标记无效。
- Chunk 不得进入 `required` 上下文。
- 重新从 SourceSnapshot 切片。
- 无法恢复时删除索引投影。

### 16.11 Chunk 重复

- 使用源版本、Chunk 类型、序号和内容 Hash 去重。
- 保留最可靠来源。
- 不合并不同权威或不同版本的内容。

### 16.12 摘要产生新事实

- 事实校验失败。
- 回退原文摘录。
- 保存压缩失败记录。
- 不进入 ContextBundle。

### 16.13 外部资料包含提示注入

- 标记可疑指令片段。
- 作为引用数据隔离。
- 不传入工具权限上下文。
- 对高风险任务可排除该 Chunk。

### 16.14 Embedding 模型被下线

- 旧 active 代际继续只读可用。
- 注册新模型并创建迁移代际。
- 迁移通过评测后切换。
- 不删除旧代际直到保留期结束。

### 16.15 小说删除

- 阻止新查询。
- 创建整本小说 Tombstone 批次。
- 删除向量、全文、缓存和未审计 Bundle。
- 保留策略允许的最小审计元数据。
- 校验跨存储残留为 0。

## 17. 验收标准

### 17.1 小说隔离

- 每个知识源、快照、文档、Chunk、向量、查询和 Bundle 有 `novelId`。
- 所有检索通道在查询阶段硬过滤 `novelId`。
- `crossNovelLeakCount` 必须为 0。
- 缓存键包含 `novelId`。

### 17.2 来源与版本

- 每个 Chunk 可追溯到原对象和不可变版本。
- 每个 ContextItemRef 有 CitationRef。
- 已修改源不会被当成新鲜结果。
- 历史 Bundle 可以复现其使用的索引代际。

### 17.3 索引

- 结构化对象、正文、状态卡、记忆和灵感可以索引。
- Chunk 使用领域策略。
- 全文和向量索引均可工作。
- 重复事件不会创建重复 Chunk。
- Embedding 维度不匹配会被阻止。

### 17.4 检索

- 支持结构化、关键词、向量和关系检索。
- 支持 Reranker。
- 支持篇章、章节、人物、时间、权威和可见性过滤。
- 可以解释候选为什么入选或被排除。
- 无候选时不跨项目放宽。

### 17.5 权威与冲突

- 上下文条目标记权威。
- Memory 继承来源权威。
- 冲突双方都保留来源。
- Context Engine 不自动解决 Canon 冲突。
- 低权威结果不能覆盖高权威事实。

### 17.6 知情与剧透

- 可以按作者、读者和人物视角检索。
- 人物视角请求必须遵守 InformationState。
- 未来揭示内容不会进入受限 Bundle。
- 可见性过滤不依赖模型自行遵守。

### 17.7 ContextBundle

- Bundle 有 Token 预算、必读项、移除项和冲突。
- Bundle 被 TaskAttempt 使用后不可变。
- 必读 Canon 不被静默截断。
- 每条内容可以跳回原文。
- 使用 stale 源时有明确警告。

### 17.8 更新与删除

- 源对象更新会产生增量索引任务。
- 源删除会创建 Tombstone 并立即停止召回。
- 小说删除会清理所有检索存储。
- 缓存和旧 Bundle 会正确失效。
- 清理失败可见且可重试。

### 17.9 模型迁移

- 更换 Embedding 模型创建新 IndexGeneration。
- 不同向量空间不直接混分。
- 新代际通过检索评测后才能激活。
- 切换失败不破坏旧 active 代际。

### 17.10 降级与失败

- 向量失败时可以保留全文 / 结构化检索。
- Reranker 失败有明确降级。
- 通道缺失会降低覆盖和置信度。
- 必读源不会因模型失败被隐藏。

### 17.11 安全

- 外部文档指令作为数据处理。
- Reranker 和模型不能解除权限过滤。
- 不向未批准模型连接发送项目内容。
- 删除后残留检查可执行。

### 17.12 检索质量

- 支持固定查询集评测。
- 记录 Recall@K、Precision@K、MRR / nDCG 和引用有效率。
- 必读源命中率可追踪。
- 评测失败可以阻止新代际激活。

## 18. 后续版本

### 18.1 V2

- 多查询改写和查询融合。
- 更强的知识图谱扩展。
- 自动检索策略选择。
- OCR 和复杂表格解析。
- 引用级语义缓存。
- 多向量表示。
- 场景级时间推理索引。
- 用户标注驱动的检索评测。
- 上下文压缩事实验证器。

### 18.2 V3

- 音频、视频和图像知识索引。
- 系列小说跨项目授权检索。
- 学习排序检索器。
- 大规模分布式向量索引。
- 私有领域 Embedding 微调。
- 可验证知识图谱推理。

## 19. 与其他 Spec 的边界

| 相关 Spec | 边界 |
|---|---|
| `01-novel-project-spec.md` | 定义小说数据边界；本 Spec 定义检索命名空间和索引 |
| `02-novel-cockpit-spec.md` | Cockpit 展示上下文健康摘要；本 Spec 提供完整管理和调试 |
| `03-inspiration-vault-spec.md` | 灵感库拥有原始灵感；本 Spec 只做低权威索引 |
| `04-arc-swimlane-diagram-spec.md` | 泳道图拥有事件结构；本 Spec 投影引用并检索 |
| `05-clue-foreshadowing-spec.md` | 线索系统拥有线索事实；本 Spec 不修改归因和状态 |
| `06-character-system-spec.md` | 人物系统拥有人物事实；本 Spec 不修改人物档案 |
| `07-worldbuilding-system-spec.md` | 世界观系统拥有规则和状态；本 Spec 不解决设定冲突 |
| `08-chapter-writing-spec.md` | 写作系统审阅并消费 ContextBundle；本 Spec 负责生成 Bundle |
| `09-chapter-review-spec.md` | 审查系统判断问题；本 Spec 只检索证据 |
| `10-agent-orchestration-spec.md` | 编排系统提交 ContextRequest 并冻结任务输入；本 Spec 执行检索 |
| `11-model-router-spec.md` | 模型路由注册 Embedding、Reranker 和压缩模型；本 Spec 使用这些模型 |
| `13-long-term-memory-spec.md` | 长期记忆拥有 MemoryItem；本 Spec 只索引和检索 |
| `14-skill-system-spec.md` | Skill 可以声明 ContextRequest 模板；本 Spec 不执行 Skill 业务逻辑 |
| `15-publish-review-spec.md` | 发布审核可检索目标平台规则和正文证据；本 Spec 不作发布判断 |
