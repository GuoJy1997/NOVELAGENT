# 11 Model Router Spec

状态：Review Candidate

日期：2026-07-09

上游依赖：

- `01-novel-project-spec.md`：每本小说拥有独立 `ModelPreferences`。
- `02-novel-cockpit-spec.md`：Cockpit 展示当前模型、推荐模型、成本与上下文适配摘要。
- `08-chapter-writing-spec.md`：写作任务声明长文本、中文、文风、续写和结构化输出需求。
- `09-chapter-review-spec.md`：审查任务声明推理、引用、长上下文和独立审查需求。
- `10-agent-orchestration-spec.md`：编排系统提交 `modelRequirement`，并为每次模型切换创建新 `TaskAttempt`。

相关底座文档：`2026-07-08-novel-agent-product-foundation-design.md`

## 1. 功能定位

Model Router 是统一注册模型、描述模型特点、管理连接、评估能力，并为每个创作任务选择合适模型的调度系统。

它不是一个只显示模型名称的下拉框，也不是把“最贵模型”当成所有任务答案的排行榜。它负责：

1. 维护供应商中立的模型注册表。
2. 为每个模型记录能力、优势、限制、成本、速度、上下文和隐私特点。
3. 区分供应商声明、系统基准测试和项目实际表现。
4. 将任务的硬性要求和偏好转换为可解释的路由决定。
5. 支持小说级、任务类型级、工作流级和单次任务模型覆盖。
6. 在调用前估算上下文适配和成本。
7. 记录每次调用实际使用的模型快照、参数、用量和结果。
8. 在模型不可用时执行受约束的降级，而不是静默换模型。
9. 允许用户编辑模型配置和路由策略，但不在 MVP 中修改基础模型权重。
10. 为 RAG 的生成、嵌入和重排模型提供统一能力档案。

一句话定义：

> Model Router 是小说 Agent 的模型调度中心：模型档案回答“它擅长什么”，任务要求回答“这次需要什么”，路由决定回答“为什么选它”。

## 2. 核心原则

### 2.1 任务适配优先

不存在全局“最好模型”，只有对当前任务、上下文、预算、延迟和隐私要求更合适的模型。

### 2.2 硬约束先于评分

不满足上下文长度、工具调用、结构化输出、数据策略或预算硬上限的模型，不能因为综合分高而被选择。

### 2.3 能力来源可追溯

模型特点必须标记来源：

- `providerDeclared`：供应商声明。
- `systemBenchmarked`：系统基准结果。
- `projectObserved`：当前小说实际运行数据。
- `userDeclared`：用户手动填写或覆盖。
- `userRated`：用户评价。

### 2.4 路由可解释

每次推荐必须说明：

- 为什么适合。
- 哪些能力满足。
- 有哪些限制。
- 预计成本和延迟。
- 为什么没有选择其他候选。

### 2.5 切换不改事实

模型切换只更换执行资源，不修改任务目标、输入版本、Canon 权威或用户确认规则。

### 2.6 运行可复现

每次调用必须保存模型 ID、解析后的供应商模型标识、档案版本、参数预设和能力快照。

## 3. 用户角色与入口

### 3.1 独立作者

查看模型特点，选择默认模型，并在写作、审查或灵感任务中手动切换。

### 3.2 成本敏感作者

设置预算上限、优先轻量模型，并只在关键任务使用高质量模型。

### 3.3 质量优先作者

为篇章设计、章节写作和审查分别指定擅长的模型。

### 3.4 隐私敏感作者

限制任务只能使用符合指定数据保留、区域或本地连接策略的模型。

### 3.5 开发者 / 高级用户

添加供应商连接、注册已有模型端点、编辑参数预设和路由策略。

### 3.6 主入口

```text
Novel Cockpit
  → 模型状态 / 模型设置
  → Model Center
```

### 3.7 上下文入口

- AgentTask 详情中的模型区域。
- 章节写作的模型切换器。
- 章节审查的审查模型设置。
- 灵感生成设置。
- RAG / Context Engine 的嵌入与重排模型设置。
- 任务失败后的降级建议。
- 小说项目设置中的 `ModelPreferences`。

## 4. 核心用户目标

### 4.1 查看每个模型的特点

模型卡必须展示：

- 模型类型。
- 主要优势。
- 明确限制。
- 中文能力。
- 长篇写作能力。
- 深度推理能力。
- 结构化输出能力。
- 工具调用能力。
- 上下文窗口与最大输出。
- 速度等级。
- 成本等级和价格更新时间。
- 隐私与数据策略。
- 健康状态。
- 适合任务与不适合任务。

### 4.2 设置小说默认模型

分别设置：

- 通用默认。
- 灵感与创意。
- 结构与推理。
- 章节写作。
- 润色。
- 审查。
- 工具调用。
- 嵌入。
- 重排。

### 4.3 为单个任务切换模型

用户可以查看当前任务需求、候选模型、推荐理由和切换影响，再创建新的任务尝试。

### 4.4 添加或编辑模型

用户可以：

- 添加供应商连接。
- 发现或手动注册模型。
- 修改显示名称、标签和备注。
- 编辑能力覆盖项。
- 配置参数预设。
- 配置任务类型偏好。
- 禁用或归档模型。

模型实际权重、训练数据和供应商服务端能力不属于可编辑范围。

### 4.5 控制成本和速度

在质量、速度和成本之间选择策略，并在调用前看到估算。

### 4.6 处理模型失败

查看错误原因、兼容候选和降级损失，决定重试、切换、压缩上下文或停止任务。

### 4.7 根据实际表现优化

查看模型在当前小说的成功率、平均成本、用户接受率和典型任务表现。

## 5. MVP 范围

### 5.1 必须包含

- 供应商连接注册。
- 安全凭证引用。
- 模型发现和手动注册。
- 供应商中立模型档案。
- 模型版本与快照。
- 模型类别。
- 能力标签和能力分数。
- 优势、限制、适合与不适合任务。
- 中文和长篇小说专项能力。
- 上下文窗口与最大输出。
- 工具调用、流式输出和结构化输出能力。
- 模型参数预设。
- 小说级 ModelPreferences。
- 任务能力要求。
- 路由策略。
- 候选筛选、评分和推荐。
- 推荐理由。
- 手动覆盖。
- 模型别名。
- 成本估算。
- 实际用量记录。
- 健康状态。
- 失败重试和兼容降级。
- 降级损失说明。
- 路由决定审计。
- 基础模型表现反馈。
- 嵌入和重排模型注册。

### 5.2 MVP 可以简化

- 供应商适配器先支持少量标准接口。
- 用户可以连接已经运行的兼容端点，但系统不负责部署本地模型。
- 能力分数使用 0 到 100 统一量纲，不声称跨供应商绝对科学。
- 基准测试使用小型固定任务集。
- 价格由管理员或供应商元数据更新，必须展示更新时间。
- 延迟使用近期统计区间，不保证单次请求。
- 路由先使用可解释加权规则，不使用黑盒学习排序。
- 多模态只管理文本输入加图片理解，不负责图片生成。

## 6. 非 MVP 范围

- 训练或微调基础模型。
- 管理 GPU 集群和本地模型部署。
- 自动购买供应商额度。
- 对模型输出质量作绝对承诺。
- 供应商之间完全统一所有高级参数。
- 自动将小说正文上传到未批准的新供应商。
- 无用户授权采集全文做公共基准。
- 黑盒自动路由且不给理由。
- 依据少量样本宣称某模型永久最优。
- 图片、音频和视频生成模型完整调度。
- 自动修改供应商账户和账单。
- 绕过供应商安全或使用限制。

## 7. 核心流程

### 7.1 添加供应商连接

```text
用户选择供应商类型或兼容协议
  → 输入连接地址和凭证
  → 系统保存 SecretRef，不保存明文凭证
  → 执行连通性和权限测试
  → 获取可用模型列表
  → 创建 ProviderConnection
```

连接测试不得把小说正文作为测试内容。

### 7.2 注册模型

```text
从供应商发现模型
  → 读取供应商声明能力
  → 创建 ModelProfile 草案
  → 用户确认显示名称、类别和可用范围
  → 可选运行基准测试
  → ModelProfile 进入 active
```

手动注册必须明确：

- 供应商模型标识。
- 接口协议。
- 模型类别。
- 至少一个可验证能力。
- 上下文和输出上限。

### 7.3 查看模型特点

```text
用户打开模型卡
  → 查看身份与状态
  → 查看能力雷达 / 列表
  → 查看优势和限制
  → 查看适合任务
  → 查看价格、速度和上下文
  → 查看能力来源和更新时间
  → 查看当前小说实际表现
```

供应商声明与系统实测不得混成一个无来源分数。

### 7.4 设置小说模型偏好

```text
用户进入小说设置
  → 选择默认策略
  → 为任务类别设置首选模型或模型池
  → 设置成本、隐私和降级限制
  → 保存 NovelModelPreferences
```

修改偏好只影响未来路由，不改变已创建 `TaskAttempt`。

### 7.5 自动路由

```text
Orchestrator 提交 ModelRequirement
  → 解析硬约束
  → 过滤不可用或不兼容模型
  → 应用小说和任务策略
  → 计算任务适配分
  → 估算上下文、成本和延迟
  → 生成候选排序
  → 创建 ModelRoutingDecision
```

### 7.6 手动切换任务模型

```text
用户打开任务模型切换器
  → 查看当前模型与候选
  → 查看能力差异、成本差异和上下文风险
  → 选择模型和参数预设
  → 保存 ModelOverride
  → Orchestrator 创建新 TaskAttempt
```

如果任务正在运行：

- 默认不热切换。
- 用户可以让当前尝试完成，或取消后创建新尝试。
- 已产生的部分 Artifact 保留。

### 7.7 执行调用

```text
TaskAttempt 获得 ModelRoutingDecision
  → 解析具体模型快照
  → 适配供应商参数
  → 校验上下文和输出预算
  → 发起模型调用
  → 记录流式事件和用量
  → 保存 ModelUsageRecord
  → 更新健康和项目表现统计
```

### 7.8 模型失败与降级

```text
模型调用失败
  → 分类错误
  → 判断是否可重试
  → 读取 FallbackPolicy
  → 对候选重新执行硬约束检查
  → 计算降级损失
  → 自动执行或等待用户确认
  → 创建新的 fallback TaskAttempt
```

### 7.9 模型表现反馈

```text
任务完成
  → 记录 Schema 成功、审查结果、用户接受或拒绝
  → 生成 ProjectModelObservation
  → 达到最小样本数后更新项目表现摘要
```

用户评价不修改供应商声明，只影响项目级偏好和观察数据。

## 8. 模型类型与特点框架

### 8.1 生成模型类型

| 模型类型 | 典型优势 | 典型限制 | 适合任务 | 不适合任务 |
|---|---|---|---|---|
| 深度推理模型 | 结构、因果、约束、复杂关系分析强 | 延迟和成本通常较高，文学表达未必最佳 | 大纲、暗线、线索、世界规则、复杂任务拆分 | 高频轻量分类、简单润色 |
| 长文本写作模型 | 叙事连续、长上下文承接、章节输出稳定 | 可能推理成本高，结构化工具能力差异大 | 整章写作、续写、长篇改写 | 低成本批量标签 |
| 创意发散模型 | 点子多、风格变化大、联想丰富 | 容易偏离 Canon，稳定性可能较弱 | 灵感、命名、方案探索 | Canon 提交、严格审查 |
| 风格与编辑模型 | 改写、润色、对白、文风辨识强 | 可能过度编辑或弱化原作者声音 | 选区改写、对白塑形、文风润色 | 复杂任务编排 |
| 审查模型 | 问题发现、对比、引用和批评能力强 | 可能误报、过于保守 | 单章审查、复审、冲突分析 | 直接生成最终正文 |
| 工具调用模型 | 结构化输出、函数调用和工作流执行稳定 | 文学表达通常不是首要优势 | Agent 编排、数据库、检索、同步 | 高质量长篇文学正文 |
| 高速轻量模型 | 低延迟、低成本、适合批量 | 深度推理和长篇一致性有限 | 分类、摘要、简单抽取、预筛 | 谜底设计、全书一致性 |
| 多模态理解模型 | 可理解图片、图表和视觉灵感 | 纯文本任务可能不具成本优势 | 图片灵感解析、UI 草图、设定图理解 | 纯文本批量处理 |

这些是模型类型的常见特点，不是对某个具体模型的承诺。具体模型卡必须展示自己的来源化数据。

### 8.2 RAG 模型类型

| 模型类型 | 主要特点 | 适合任务 | 关键指标 |
|---|---|---|---|
| Embedding 模型 | 把文本转成向量，决定语义召回基础 | 章节、人物、设定和线索检索 | 语言覆盖、维度、召回率、成本 |
| Reranker 模型 | 对候选片段重新排序，提高相关性 | 长篇上下文精排 | 排序准确率、延迟、候选上限 |
| 摘要 / 压缩模型 | 压缩上下文并保留事实和引用 | Token 预算管理 | 事实保真、引用保留、压缩率 |

Embedding 和 Reranker 不可被路由到正文生成任务。

### 8.3 小说专项能力维度

每个生成模型至少评估：

- `chineseFluency`：中文流畅度。
- `longFormCoherence`：长篇连续性。
- `creativeIdeation`：创意发散。
- `plotReasoning`：剧情因果与结构。
- `characterConsistency`：人物一致性。
- `dialogueQuality`：对白区分度和自然度。
- `styleControl`：文风控制。
- `instructionFollowing`：复杂约束遵循。
- `structuredOutput`：JSON / Schema 稳定性。
- `toolUse`：工具调用。
- `longContextRecall`：长上下文信息保持。
- `citationPrecision`：引用和证据定位。
- `revisionMinimality`：最小范围修改。
- `reviewSensitivity`：问题发现能力。

### 8.4 运行特点维度

- 上下文窗口。
- 最大输出。
- 首 Token 延迟。
- 总吞吐。
- 流式支持。
- 并发与限流。
- 输入成本。
- 输出成本。
- 缓存成本。
- 可用区域。
- 数据保留策略。
- 是否用于供应商训练。
- 可用性和错误率。

### 8.5 特点可信度

能力显示必须同时展示：

```text
分数或等级
来源
样本数
测量时间
适用语言
适用任务
置信度
```

没有测试数据时显示“未测”，不能用默认中间分伪装已知能力。

## 9. 核心数据对象与字段

本节“必填”表示字段必须存在；数组可以为空，除非校验规则另有要求。

### 9.1 ProviderConnection

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `providerConnectionId` | string | 是 | 连接 ID |
| `ownerScope` | enum | 是 | `user`、`workspace` |
| `providerType` | string | 是 | 供应商或协议类型 |
| `displayName` | string | 是 | 显示名称 |
| `baseUrl` | string | 否 | 自定义端点 |
| `protocol` | enum | 是 | `native`、`openAICompatible`、`customAdapter` |
| `secretRef` | string | 是 | 凭证安全引用 |
| `region` | string | 否 | 区域 |
| `dataPolicyId` | string | 否 | 数据策略 |
| `status` | enum | 是 | `draft`、`testing`、`active`、`degraded`、`disabled`、`invalid` |
| `lastTestedAt` | ISO datetime | 否 | 最近测试 |
| `error` | object | 否 | 连接错误 |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

`secretRef` 指向安全凭证存储，任何页面、日志和导出不得返回凭证明文。

### 9.2 ModelProfile

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `modelProfileId` | string | 是 | 稳定模型档案 ID |
| `providerConnectionId` | string | 是 | 供应商连接 |
| `providerModelId` | string | 是 | 供应商模型标识 |
| `resolvedModelVersion` | string | 否 | 解析到的具体版本 |
| `displayName` | string | 是 | 显示名称 |
| `modelKind` | enum | 是 | 模型类别 |
| `modalities` | string[] | 是 | 输入输出模态 |
| `capabilityProfileId` | string | 是 | 能力档案 |
| `operationalProfileId` | string | 是 | 运行特点 |
| `pricingProfileId` | string | 否 | 价格档案 |
| `dataPolicyId` | string | 否 | 数据策略 |
| `strengths` | `ModelTrait[]` | 是 | 带来源的优势 |
| `limitations` | `ModelTrait[]` | 是 | 带来源的限制 |
| `recommendedTaskTypes` | string[] | 是 | 适合任务 |
| `notRecommendedTaskTypes` | string[] | 是 | 不适合任务 |
| `tags` | string[] | 是 | 标签 |
| `defaultParameterPresetId` | string | 否 | 默认参数 |
| `profileVersion` | number | 是 | 档案版本 |
| `status` | enum | 是 | `discovered`、`testing`、`active`、`degraded`、`unavailable`、`deprecated`、`disabled`、`archived` |
| `metadataUpdatedAt` | ISO datetime | 是 | 元数据更新时间 |

#### 9.2.1 ModelTrait

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `statement` | string | 是 | 优势或限制描述 |
| `sourceType` | enum | 是 | `providerDeclared`、`systemBenchmarked`、`projectObserved`、`userDeclared`、`userRated` |
| `sourceRef` | string | 否 | 来源引用 |
| `novelId` | string | 否 | 项目观察或项目评价所属小说 |
| `confidence` | number | 是 | 0 到 1 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

`projectObserved` 和小说内 `userRated` 特点必须填写 `novelId`，且只在对应小说的模型卡和路由中生效。

### 9.3 ModelKind

| 值 | 说明 |
|---|---|
| `generative` | 文本 / 多模态生成与推理 |
| `embedding` | 向量嵌入 |
| `reranker` | 候选重排 |
| `moderation` | 内容风险分类 |
| `specialized` | 供应商特定专用模型 |

### 9.4 ModelCapabilityProfile

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `capabilityProfileId` | string | 是 | 能力档案 ID |
| `modelProfileId` | string | 是 | 模型 |
| `contextWindowTokens` | number | 否 | 上下文上限 |
| `maxOutputTokens` | number | 否 | 最大输出 |
| `supportsStreaming` | boolean | 是 | 流式输出 |
| `supportsToolUse` | boolean | 是 | 工具调用 |
| `supportsParallelTools` | boolean | 是 | 并行工具 |
| `supportsJsonMode` | boolean | 是 | JSON 模式 |
| `supportsJsonSchema` | boolean | 是 | Schema 约束 |
| `supportsVisionInput` | boolean | 是 | 图片输入 |
| `supportsSystemInstruction` | boolean | 是 | 系统指令 |
| `supportsReasoningControl` | boolean | 是 | 推理强度控制 |
| `supportedLanguages` | string[] | 是 | 语言 |
| `scores` | `ModelCapabilityScore[]` | 是 | 能力分数 |
| `sourceRefs` | object[] | 是 | 声明和测试来源 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.5 ModelCapabilityScore

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `dimension` | string | 是 | 能力维度 |
| `score` | number | 否 | 0 到 100；未知时为空 |
| `level` | enum | 是 | `unknown`、`low`、`medium`、`high`、`excellent` |
| `sourceType` | enum | 是 | `providerDeclared`、`systemBenchmarked`、`projectObserved`、`userDeclared`、`userRated` |
| `scopeType` | enum | 是 | `global`、`workspace`、`novel` |
| `novelId` | string | 否 | `scopeType=novel` 时必填 |
| `sampleSize` | number | 是 | 样本数 |
| `language` | string | 否 | 测试语言 |
| `taskType` | string | 否 | 测试任务 |
| `confidence` | number | 是 | 0 到 1 |
| `measuredAt` | ISO datetime | 否 | 测量时间 |

### 9.6 ModelOperationalProfile

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `operationalProfileId` | string | 是 | 运行档案 ID |
| `modelProfileId` | string | 是 | 模型 |
| `latencyLevel` | enum | 是 | `unknown`、`fast`、`medium`、`slow`、`verySlow` |
| `medianFirstTokenMs` | number | 否 | 首 Token 中位数 |
| `medianTokensPerSecond` | number | 否 | 中位吞吐 |
| `recentSuccessRate` | number | 否 | 近期成功率 |
| `rateLimitSummary` | string | 否 | 限流摘要 |
| `maxConcurrency` | number | 否 | 当前连接并发 |
| `healthStatus` | enum | 是 | `unknown`、`healthy`、`degraded`、`unavailable` |
| `observationWindow` | string | 是 | 统计窗口 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.7 PricingProfile

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `pricingProfileId` | string | 是 | 价格档案 ID |
| `modelProfileId` | string | 是 | 模型 |
| `currency` | string | 是 | 币种 |
| `inputPricePerMillionTokens` | number | 否 | 输入价格 |
| `cachedInputPricePerMillionTokens` | number | 否 | 缓存输入价格 |
| `outputPricePerMillionTokens` | number | 否 | 输出价格 |
| `requestBasePrice` | number | 否 | 单请求固定价格 |
| `pricingUnitNotes` | string | 否 | 特殊计价说明 |
| `sourceRef` | string | 否 | 来源 |
| `effectiveAt` | ISO datetime | 否 | 生效时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |
| `staleAfter` | ISO datetime | 否 | 过期提示时间 |

价格未知或过期时只能显示区间或“无法准确估算”，不能显示伪精确金额。

### 9.8 ModelDataPolicy

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `dataPolicyId` | string | 是 | 策略 ID |
| `providerConnectionId` | string | 是 | 连接 |
| `retentionSummary` | string | 是 | 数据保留摘要 |
| `trainingUseSummary` | string | 是 | 是否用于训练的声明 |
| `allowedRegions` | string[] | 是 | 可用区域 |
| `supportsZeroRetention` | boolean | 否 | 是否支持零保留 |
| `sensitiveDataAllowed` | boolean | 是 | 是否允许敏感项目数据 |
| `sourceRef` | string | 否 | 来源 |
| `verifiedAt` | ISO datetime | 否 | 最近核验 |

### 9.9 ModelParameterPreset

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `parameterPresetId` | string | 是 | 预设 ID |
| `modelProfileId` | string | 否 | 空表示跨模型抽象预设 |
| `novelId` | string | 否 | 小说专属预设 |
| `name` | string | 是 | 名称 |
| `purpose` | string | 是 | 用途 |
| `normalizedParameters` | object | 是 | 温度、输出长度、推理强度等抽象参数 |
| `providerParameters` | object | 是 | 供应商特定参数 |
| `unsupportedParameterPolicy` | enum | 是 | `omit`、`warn`、`block` |
| `version` | number | 是 | 版本 |
| `status` | enum | 是 | `draft`、`active`、`archived` |

参数适配器必须忽略或阻止不受支持的参数，不得假设所有模型支持相同参数。

### 9.10 NovelModelPreferences

该对象扩展 `01-novel-project-spec.md` 的 `ModelPreferences`：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `modelPreferencesId` | string | 是 | 偏好 ID |
| `novelId` | string | 是 | 所属小说 |
| `defaultModelAliasId` | string | 是 | 通用默认 |
| `taskTypePreferences` | object[] | 是 | 任务类别首选模型 / 模型池 |
| `routingPolicyId` | string | 是 | 路由策略 |
| `privacyRequirement` | enum | 是 | `standard`、`strict`、`approvedProvidersOnly` |
| `qualityPreference` | number | 是 | 0 到 100 |
| `speedPreference` | number | 是 | 0 到 100 |
| `costPreference` | number | 是 | 0 到 100 |
| `allowFallback` | boolean | 是 | 是否允许降级 |
| `requireApprovalForHighCost` | boolean | 是 | 高成本确认 |
| `allowedProviderConnectionIds` | string[] | 是 | 允许连接 |
| `blockedModelProfileIds` | string[] | 是 | 禁用模型 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.11 ModelAlias

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `modelAliasId` | string | 是 | 别名 ID |
| `novelId` | string | 否 | 空表示工作区别名 |
| `name` | string | 是 | 如“长篇写作首选” |
| `primaryModelProfileId` | string | 是 | 主模型 |
| `fallbackModelProfileIds` | string[] | 是 | 兼容候选 |
| `requiredCapabilities` | object[] | 是 | 别名硬约束 |
| `status` | enum | 是 | `active`、`degraded`、`disabled` |

别名解析结果必须冻结到 TaskAttempt，后续修改别名不改变历史运行。

### 9.12 ModelRequirement

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `modelRequirementId` | string | 是 | 要求 ID |
| `novelId` | string | 是 | 所属小说 |
| `taskType` | string | 是 | 任务类型 |
| `modelKind` | enum | 是 | 所需类别 |
| `requiredCapabilities` | object[] | 是 | 硬能力 |
| `preferredCapabilities` | object[] | 是 | 偏好能力及权重 |
| `requiredModalities` | string[] | 是 | 模态 |
| `minimumContextTokens` | number | 否 | 最小上下文 |
| `minimumOutputTokens` | number | 否 | 最小输出 |
| `requiresToolUse` | boolean | 是 | 工具调用 |
| `requiresJsonSchema` | boolean | 是 | Schema |
| `language` | string | 是 | 主要语言 |
| `maxEstimatedCost` | number | 否 | 成本硬上限 |
| `latencyPreference` | enum | 是 | `low`、`balanced`、`qualityFirst` |
| `privacyRequirement` | enum | 是 | 数据要求 |
| `independenceConstraints` | object[] | 是 | 如审查模型不能与写作模型相同 |

### 9.13 RoutingPolicy

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `routingPolicyId` | string | 是 | 策略 ID |
| `novelId` | string | 否 | 空表示工作区模板 |
| `name` | string | 是 | 名称 |
| `hardFilters` | object[] | 是 | 硬过滤规则 |
| `scoreWeights` | object | 是 | 质量、速度、成本、项目表现权重 |
| `minimumHealthStatus` | enum | 是 | 最低健康状态 |
| `minimumCapabilityConfidence` | number | 是 | 最低置信度 |
| `fallbackPolicyId` | string | 是 | 降级策略 |
| `tieBreakers` | string[] | 是 | 同分排序 |
| `version` | number | 是 | 版本 |
| `status` | enum | 是 | `draft`、`active`、`archived` |

### 9.14 ModelRoutingDecision

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `modelRoutingDecisionId` | string | 是 | 决定 ID |
| `novelId` | string | 是 | 所属小说 |
| `taskVersionId` | string | 否 | Agent 任务 |
| `modelRequirementId` | string | 是 | 任务要求 |
| `routingPolicyVersionRef` | string | 是 | 策略版本 |
| `status` | enum | 是 | `selected`、`noCompatibleModel`、`blocked` |
| `candidateResults` | object[] | 是 | 候选过滤和评分结果 |
| `selectedModelProfileId` | string | 否 | 选择模型；无兼容模型时为空 |
| `selectedResolvedVersion` | string | 否 | 具体供应商版本 |
| `selectedParameterPresetId` | string | 否 | 参数预设 |
| `selectionSource` | enum | 是 | `router`、`userOverride`、`fallback`、`fixedWorkflow` |
| `reasons` | string[] | 是 | 推荐理由 |
| `tradeoffs` | string[] | 是 | 取舍 |
| `contextFit` | enum | 是 | `enough`、`tight`、`insufficient` |
| `estimatedUsageId` | string | 否 | 估算 |
| `capabilitySnapshot` | object | 是 | 调用时能力快照 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

当 `status=selected` 时，`selectedModelProfileId` 必填；当 `status=noCompatibleModel` 或 `blocked` 时，该字段为空，并由 `candidateResults` 和 `reasons` 记录失败原因。

### 9.15 ModelOverride

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `modelOverrideId` | string | 是 | 覆盖 ID |
| `novelId` | string | 是 | 所属小说 |
| `scopeType` | enum | 是 | `novel`、`taskType`、`workflow`、`subagent`、`task`、`attempt` |
| `scopeId` | string | 否 | 作用对象 |
| `modelProfileId` | string | 是 | 指定模型 |
| `parameterPresetId` | string | 否 | 指定参数 |
| `reason` | string | 否 | 用户原因 |
| `createdBy` | enum | 是 | `user`、`workflow` |
| `activeFrom` | ISO datetime | 是 | 生效时间 |
| `activeTo` | ISO datetime | 否 | 失效时间 |
| `status` | enum | 是 | `active`、`expired`、`disabled` |

### 9.16 FallbackPolicy

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `fallbackPolicyId` | string | 是 | 策略 ID |
| `novelId` | string | 否 | 小说或工作区 |
| `retrySameModelCount` | number | 是 | 同模型重试次数 |
| `fallbackModelProfileIds` | string[] | 是 | 候选顺序 |
| `requireHardConstraintRecheck` | boolean | 是 | 必须重新校验 |
| `maxQualityLoss` | number | 是 | 最大允许质量损失 |
| `maxCostIncrease` | number | 是 | 最大成本增加 |
| `requireUserApprovalForTaskTypes` | string[] | 是 | 需确认任务 |
| `stopIfContextInsufficient` | boolean | 是 | 上下文不足停止 |
| `version` | number | 是 | 版本 |

### 9.17 ModelHealthSnapshot

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `healthSnapshotId` | string | 是 | 快照 ID |
| `modelProfileId` | string | 是 | 模型 |
| `providerConnectionId` | string | 是 | 连接 |
| `status` | enum | 是 | `healthy`、`degraded`、`rateLimited`、`unavailable`、`unknown` |
| `successRate` | number | 否 | 成功率 |
| `latencyMs` | number | 否 | 延迟 |
| `rateLimitResetAt` | ISO datetime | 否 | 限流恢复 |
| `errorClasses` | object[] | 是 | 错误分布 |
| `measuredAt` | ISO datetime | 是 | 测量时间 |
| `expiresAt` | ISO datetime | 是 | 快照过期 |

### 9.18 ModelUsageEstimate

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `estimateId` | string | 是 | 估算 ID |
| `novelId` | string | 是 | 所属小说 |
| `modelProfileId` | string | 是 | 模型 |
| `inputTokenEstimate` | number | 是 | 输入估算 |
| `outputTokenEstimate` | number | 是 | 输出估算 |
| `costLow` | number | 否 | 成本下界 |
| `costHigh` | number | 否 | 成本上界 |
| `nativeCurrency` | string | 否 | 供应商计价币种 |
| `comparisonCurrency` | string | 否 | UI 比较币种 |
| `exchangeRateSnapshotRef` | string | 否 | 汇率快照 |
| `latencyLevel` | enum | 是 | 延迟等级 |
| `pricingProfileUpdatedAt` | ISO datetime | 否 | 价格更新时间 |
| `confidence` | number | 是 | 0 到 1 |
| `createdAt` | ISO datetime | 是 | 估算时间 |

### 9.19 ModelUsageRecord

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `usageRecordId` | string | 是 | 记录 ID |
| `novelId` | string | 是 | 所属小说 |
| `taskVersionId` | string | 否 | 任务 |
| `attemptId` | string | 否 | 尝试 |
| `modelRoutingDecisionId` | string | 是 | 路由决定 |
| `modelProfileId` | string | 是 | 模型 |
| `resolvedModelVersion` | string | 否 | 实际版本 |
| `parameterSnapshot` | object | 是 | 实际参数 |
| `inputTokens` | number | 否 | 输入 Token |
| `cachedInputTokens` | number | 否 | 缓存 Token |
| `outputTokens` | number | 否 | 输出 Token |
| `totalCost` | number | 否 | 实际成本 |
| `currency` | string | 否 | 币种 |
| `firstTokenMs` | number | 否 | 首 Token |
| `durationMs` | number | 否 | 总时长 |
| `status` | enum | 是 | `completed`、`failed`、`cancelled`、`unknown` |
| `providerRequestId` | string | 否 | 供应商请求引用 |
| `createdAt` | ISO datetime | 是 | 时间 |

### 9.20 ModelBenchmarkResult

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `benchmarkResultId` | string | 是 | 结果 ID |
| `modelProfileId` | string | 是 | 模型 |
| `benchmarkSuiteVersion` | string | 是 | 测试集版本 |
| `taskType` | string | 是 | 任务 |
| `language` | string | 是 | 语言 |
| `scores` | object[] | 是 | 各维度分数 |
| `sampleCount` | number | 是 | 样本量 |
| `usage` | object | 是 | 成本和时长 |
| `limitations` | string[] | 是 | 测试限制 |
| `createdAt` | ISO datetime | 是 | 时间 |

### 9.21 ProjectModelObservation

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `observationId` | string | 是 | 观察 ID |
| `novelId` | string | 是 | 所属小说 |
| `modelProfileId` | string | 是 | 模型 |
| `taskType` | string | 是 | 任务类型 |
| `taskVersionId` | string | 否 | 任务 |
| `outcome` | enum | 是 | `accepted`、`rejected`、`revised`、`failed`、`unknown` |
| `schemaValid` | boolean | 否 | Schema 是否成功 |
| `reviewResultRef` | string | 否 | 审查结果 |
| `userRating` | number | 否 | 用户评分 |
| `notes` | string | 否 | 用户说明 |
| `createdAt` | ISO datetime | 是 | 时间 |

## 10. 模型与连接状态机

### 10.1 连接状态

```text
draft → testing → active
            │        │
            └→ invalid
                     active → degraded → active
                     active / degraded → disabled
```

### 10.2 模型档案状态

```text
discovered → testing → active
                         │
                         ├→ degraded → active
                         ├→ unavailable → active
                         ├→ deprecated → archived
                         └→ disabled → active / archived
```

### 10.3 路由决定状态

`ModelRoutingDecision` 是不可变事实记录，不设置可变生命周期。重新路由必须创建新决定。

### 10.4 价格和能力过期

- 价格过期不自动禁用模型，但降低成本估算置信度。
- 能力数据过期不删除历史。
- 健康快照过期后，路由前必须刷新或按 `unknown` 处理。
- 供应商别名解析到新版本时，创建新的能力快照。

## 11. 路由算法与优先级

### 11.1 第一步：解析覆盖优先级

从高到低：

```text
attempt 明确覆盖
  → task 明确覆盖
  → workflow / subagent 覆盖
  → taskType 偏好
  → novel 默认别名
  → workspace 默认
```

覆盖模型仍必须满足不可放宽的安全、隐私和接口硬约束。

### 11.2 第二步：硬过滤

至少检查：

- 连接和模型可用。
- 模型类别正确。
- 输入模态支持。
- 上下文窗口足够。
- 最大输出足够。
- 工具调用要求。
- JSON / Schema 要求。
- 语言要求。
- 数据策略。
- 允许供应商列表。
- 成本硬上限。
- 审查独立性要求。
- 模型未被项目禁用。

硬过滤失败的模型必须记录具体原因。

### 11.3 第三步：评分

候选分数至少包含：

```text
任务能力适配
× 能力置信度
+ 项目偏好
+ 项目实际表现
+ 健康状态
+ 上下文余量
- 预计成本
- 预计延迟
- 降级风险
```

每项权重由 RoutingPolicy 决定。未知能力不能自动视为中等能力。

### 11.4 第四步：上下文适配

| 状态 | 条件 |
|---|---|
| `enough` | 必需上下文与输出预算有安全余量 |
| `tight` | 可以执行，但压缩或输出余量有限 |
| `insufficient` | 无法容纳必需上下文或输出 |

`insufficient` 模型不能自动选中。系统应先请求 Context Engine 压缩、拆分任务或推荐其他模型。

### 11.5 第五步：推荐解释

推荐结果必须包含：

- 选中模型。
- 满足的硬要求。
- 最关键优势。
- 已知限制。
- 上下文适配。
- 成本区间。
- 延迟等级。
- 数据策略。
- 替代候选和差异。

### 11.6 路由失败

没有模型满足硬约束时：

- 返回 `noCompatibleModel`。
- 列出每个候选失败原因。
- 建议放宽非安全偏好、拆分任务、压缩上下文、添加连接或停止。
- 不选择“最接近”的模型强行执行。

## 12. Agent 与系统行为

### 12.1 可以自动执行

- 从连接发现模型。
- 刷新供应商元数据。
- 运行不含小说正文的基础连通测试。
- 计算能力适配和候选排序。
- 估算 Token、成本和延迟。
- 更新健康快照。
- 在策略允许时重试临时失败。
- 在硬约束全部满足时执行低风险降级。
- 记录用量和项目观察。
- 提醒能力、价格或隐私数据过期。

### 12.2 必须由用户确认

- 添加或删除供应商连接。
- 保存凭证。
- 允许新供应商访问小说数据。
- 修改小说默认模型。
- 高成本任务模型选择。
- 质量损失明显的降级。
- 正文写作、Canon 分析和发布任务跨供应商切换。
- 将系统实测覆盖供应商声明的展示结论。
- 禁用正在被工作流使用的模型。

### 12.3 禁止自动执行

- 在日志中输出 API Key。
- 将一个小说的内容发送到未批准连接。
- 因模型更换而改变任务输入或 Canon。
- 把未知能力显示为已支持。
- 把过期价格显示为精确实时价格。
- 在不满足硬约束时静默降级。
- 热切换正在运行的模型调用。
- 把失败输出当成成功训练数据。
- 自动修改基础模型权重。

### 12.4 推荐文案格式

```text
推荐模型
适合本任务的原因
满足的硬要求
关键能力来源
上下文适配
预计成本 / 延迟
已知限制
替代模型
切换影响
是否需要确认
```

## 13. 成本、降级与故障处理

### 13.1 成本估算

调用前使用：

- ContextBundle Token 估算。
- 预期输出长度。
- 缓存策略。
- 当前 PricingProfile。
- 供应商特殊计价。

估算必须给出区间和置信度，而不是单点伪精确值。
跨币种比较必须记录换算快照；没有可靠换算数据时，只显示原币种并降低成本排序置信度。

### 13.2 成本门禁

- 低于软上限：正常执行。
- 接近软上限：提示并展示替代模型。
- 超过软上限：按小说策略确认。
- 超过硬上限：阻止执行，除非用户修改预算策略。

### 13.3 错误分类

| 错误 | 默认处理 |
|---|---|
| `rateLimit` | 等待并重试，或切换兼容模型 |
| `temporaryUnavailable` | 重试后降级 |
| `authentication` | 停止并修复连接 |
| `permissionDenied` | 停止，不重试 |
| `contextTooLong` | 压缩、拆分或换长上下文模型 |
| `outputTooLong` | 分段或调整任务 |
| `schemaInvalid` | 同模型有限重试或换结构化能力强模型 |
| `contentRejected` | 展示原因并让用户调整任务 |
| `timeout` | 重试或换低延迟模型 |
| `unknownProviderError` | 保留请求引用并等待用户 |

### 13.4 降级兼容检查

降级前重新检查：

- 模型类别。
- 上下文。
- 输出长度。
- 工具。
- Schema。
- 中文能力。
- 任务关键能力。
- 数据策略。
- 成本。
- 独立审查约束。

### 13.5 降级损失

必须展示可能损失：

- 推理深度下降。
- 文风控制下降。
- 长篇连续性下降。
- 结构化输出稳定性下降。
- 上下文需要压缩。
- 成本或延迟上升。

### 13.6 调用版本漂移

供应商模型别名指向新版本时：

- 新调用记录新的 `resolvedModelVersion`。
- 对关键工作流提示版本变化。
- 可以继续使用别名，也可以固定已知版本。
- 历史结果仍引用旧快照。

## 14. 长期记忆与学习

### 14.1 可读取

- Workflow Memory。
- Project Memory。
- 小说级模型偏好。
- 历史 ModelUsageRecord。
- ProjectModelObservation。
- 用户对模型的明确评价。

### 14.2 可写入

经用户确认后可以写入：

- Workflow Memory：常用任务的模型偏好。
- Project Memory：该小说的质量 / 速度 / 成本权重。
- Model Preference Memory：用户明确指定的首选和禁用模型。

### 14.3 自动统计但不直接成为记忆

- 成功率。
- Schema 通过率。
- 平均成本。
- 平均延迟。
- 用户接受率。
- 审查后修改比例。

这些数据存入项目观察表，达到最小样本数后才用于路由评分。

### 14.4 不得写入

- 单次失败推断出的永久偏好。
- 少量样本产生的“最佳模型”结论。
- 其他小说的私有文本或评价。
- 供应商未验证的营销描述作为系统事实。
- 未经用户确认的隐私策略放宽。

### 14.5 项目隔离

- ProjectModelObservation 必须绑定 `novelId`。
- 小说 A 的文风接受率不直接影响小说 B。
- 工作区级模型健康和价格可以共享。
- 小说内容、用户评价原文和任务结果不能跨项目共享。

## 15. 可视化与交互要求

### 15.1 Model Center

分为：

- 已连接供应商。
- 可用模型。
- 模型对比。
- 小说偏好。
- 路由策略。
- 使用量。
- 健康与错误。

### 15.2 模型卡

每张卡必须显示：

- 名称和供应商。
- 模型类型。
- 状态。
- 一句话特点。
- 三项主要优势。
- 三项主要限制。
- 中文 / 长篇 / 推理 / 文风 / 工具 / Schema 等关键能力。
- 上下文和最大输出。
- 速度等级。
- 成本等级。
- 数据策略。
- 适合与不适合任务。
- 数据来源和更新时间。

### 15.3 模型详情

包含：

- 能力列表或雷达图。
- 供应商声明。
- 系统基准。
- 当前小说实际表现。
- 参数预设。
- 价格和历史。
- 健康状态。
- 最近失败。
- 任务使用统计。
- 连接和数据策略。

雷达图只能比较同一量纲、同一来源或明确归一化的数据。

### 15.4 模型切换器

显示：

- 当前任务要求。
- 当前模型。
- 推荐模型。
- 候选排序。
- 硬约束通过 / 失败。
- 能力差异。
- 上下文适配。
- 成本和延迟。
- 数据策略。
- 参数预设。
- 切换后会创建新 Attempt 的提示。

### 15.5 模型对比

支持同时比较 2 到 4 个模型，字段包括：

- 类型。
- 中文。
- 长篇。
- 推理。
- 创意。
- 对白。
- 文风。
- 结构化输出。
- 工具。
- 上下文。
- 最大输出。
- 速度。
- 成本。
- 隐私。
- 健康。
- 数据来源。

### 15.6 路由解释

任务详情中展示：

```text
任务要求
  → 硬过滤
  → 候选评分
  → 选中模型
  → 取舍
  → 备用链
```

### 15.7 使用量视图

按以下维度统计：

- 小说。
- 任务类型。
- 模型。
- Subagent。
- 时间。
- 成功 / 失败。
- 输入 / 输出 Token。
- 成本。

不显示无法验证的估算为实际成本。

### 15.8 健康视图

显示：

- 连接状态。
- 模型状态。
- 成功率。
- 延迟。
- 限流。
- 最近错误。
- 快照更新时间。

## 16. 异常情况

### 16.1 凭证无效

- 连接进入 `invalid`。
- 不调度新任务。
- 已运行任务按供应商结果结束。
- 提供重新测试入口。
- 不在错误信息中回显凭证。

### 16.2 模型列表发现失败

- 保留已有模型档案。
- 标记元数据可能过期。
- 允许手动注册。
- 不删除历史模型。

### 16.3 模型能力未知

- 显示 `unknown`。
- 不能满足依赖该能力的硬约束。
- 用户可运行基准或手动声明，但手动声明必须标记来源。

### 16.4 上下文窗口不明确

- 对需要长上下文的任务视为不满足。
- 用户可以提供经过验证的覆盖值。
- 调用失败后更新观察，不直接篡改供应商声明。

### 16.5 价格过期

- 显示更新时间和低置信度。
- 高成本任务要求确认。
- 实际用量仍记录，成本可暂为空。

### 16.6 路由无候选

- 列出失败原因。
- 推荐拆任务、压缩上下文、添加模型或放宽非安全偏好。
- 不强行选择。

### 16.7 手动指定模型不兼容

- 阻止运行。
- 明确指出不满足的硬约束。
- 允许用户修改任务要求，但不能放宽安全和数据权限。

### 16.8 模型运行中被禁用

- 当前请求允许完成或按用户选择取消。
- 不再创建新 Attempt。
- 后续路由重新选择。

### 16.9 供应商限流

- 健康状态进入 `rateLimited` / `degraded`。
- 显示预计恢复时间。
- 按策略排队、重试或降级。

### 16.10 模型返回无效 Schema

- 保存原始响应引用。
- 进行有限次数修复重试。
- 仍失败时切换结构化输出更强模型或请求用户。
- 失败结果不能作为有效 Artifact。

### 16.11 降级模型上下文不足

- 停止自动降级。
- 请求 Context Engine 重新压缩或拆分任务。
- 新上下文包和新模型必须创建新 Attempt。

### 16.12 供应商别名漂移

- 记录实际解析版本。
- 能力差异较大时暂停关键任务并提示。
- 不修改历史 ModelRoutingDecision。

### 16.13 模型表现统计样本不足

- 显示样本数。
- 不参与或低权重参与路由。
- 不输出“最适合本小说”的确定结论。

### 16.14 用户删除连接

- 检查模型别名、小说偏好、工作流和未完成任务引用。
- 默认先禁用，不立即硬删除。
- 历史档案和用量记录保留。
- 未完成任务进入等待模型选择。

### 16.15 已有本地兼容端点

- 可以作为 ProviderConnection 注册。
- 系统测试协议和能力。
- 用户负责端点部署和硬件。
- 不把“本地”自动等同于“绝对隐私”，仍需填写数据策略。

## 17. 验收标准

### 17.1 模型注册

- 用户可以添加连接并安全保存凭证引用。
- 可以发现或手动注册模型。
- 每个模型有类型、能力、优势、限制和更新时间。
- 历史模型不会因发现失败被删除。

### 17.2 模型特点

- 每个模型卡显示中文、长篇、推理、创意、文风、结构化和工具能力。
- 能力值显示来源、样本数和时间。
- 未知能力明确显示未知。
- 供应商声明和系统实测可区分。
- 适合与不适合任务均可见。

### 17.3 小说偏好

- 每本小说拥有独立 ModelPreferences。
- 可以为不同任务类别指定模型或模型池。
- 可以配置质量、速度、成本和隐私偏好。
- 修改偏好不影响已运行 Attempt。

### 17.4 路由

- Orchestrator 可以提交 ModelRequirement。
- Router 先执行硬过滤，再评分。
- 路由决定包含候选、失败原因、推荐理由和取舍。
- 无兼容模型时不会强行执行。
- 审查独立性等任务约束可以生效。

### 17.5 手动切换

- 用户可以为单个任务选择模型和参数预设。
- 切换前显示能力、成本、上下文和隐私影响。
- 切换创建新 TaskAttempt。
- 旧 Attempt 和部分产物保留。

### 17.6 成本与用量

- 调用前显示成本区间和置信度。
- 价格显示更新时间。
- 实际 Token 和成本可以记录。
- 软 / 硬预算门禁生效。
- 估算不冒充实际账单。

### 17.7 降级

- 失败可以按错误类型重试或降级。
- 降级重新校验所有硬约束。
- 用户能看到质量、上下文、成本和速度损失。
- 不兼容模型不会自动降级。
- fallback 创建新 Attempt。

### 17.8 健康与版本

- 模型和连接健康状态可见。
- 健康快照有过期时间。
- 供应商实际模型版本记录到调用。
- 别名变化不改写历史。

### 17.9 隐私

- API Key 不出现在页面、日志或导出。
- 小说只能发送到允许的连接。
- 数据策略参与硬过滤。
- 用户允许一个连接不自动允许其他连接。

### 17.10 项目反馈

- 模型结果可以记录用户接受、拒绝和修改。
- 项目观察绑定 `novelId`。
- 样本不足时不产生强结论。
- 其他小说的私有表现不直接影响当前小说。

### 17.11 RAG 模型

- Embedding 和 Reranker 可以注册为独立 ModelKind。
- 生成模型不会误路由到嵌入任务。
- 嵌入模型不会误路由到正文生成。
- RAG 模型也有成本、健康、语言和数据策略。

## 18. 后续版本

### 18.1 V2

- 更完整的模型基准套件。
- A/B 盲选和用户偏好学习。
- 多模型候选竞赛。
- 自适应路由权重。
- 供应商价格自动同步。
- 模型输出质量趋势。
- 任务级缓存和供应商提示缓存优化。
- 本地模型运行状态接入。
- 更丰富的多模态模型类型。

### 18.2 V3

- 私有模型微调和评测管理。
- 多租户配额和团队成本中心。
- 学习排序路由器。
- 跨项目匿名化模型评测。
- 自动模型组合与验证。
- 本地 GPU 调度和部署管理。

## 19. 与其他 Spec 的边界

| 相关 Spec | 边界 |
|---|---|
| `01-novel-project-spec.md` | 定义小说级 ModelPreferences；本 Spec 扩展模型档案和路由 |
| `02-novel-cockpit-spec.md` | Cockpit 展示模型摘要和切换入口；本 Spec 提供完整 Model Center |
| `03-inspiration-vault-spec.md` | 灵感任务声明创意能力；本 Spec 选择模型，不修改灵感 |
| `04-arc-swimlane-diagram-spec.md` | 结构任务声明推理能力；本 Spec 选择模型，不拥有结构数据 |
| `05-clue-foreshadowing-spec.md` | 线索任务声明推理和长上下文能力；本 Spec 不拥有线索事实 |
| `06-character-system-spec.md` | 人物任务声明一致性和对白能力；本 Spec 不拥有人物事实 |
| `07-worldbuilding-system-spec.md` | 世界任务声明规则推理能力；本 Spec 不拥有世界事实 |
| `08-chapter-writing-spec.md` | 写作系统定义任务和正文版本；本 Spec 提供写作模型和参数 |
| `09-chapter-review-spec.md` | 审查系统定义审查通道；本 Spec 提供独立审查模型选择 |
| `10-agent-orchestration-spec.md` | 编排系统创建 TaskAttempt 并提交 ModelRequirement；本 Spec 返回 ModelRoutingDecision |
| `12-rag-context-engine-spec.md` | Context Engine 使用生成、Embedding 和 Reranker；本 Spec 注册和路由这些模型 |
| `13-long-term-memory-spec.md` | 长期记忆保存用户确认的模型偏好；本 Spec 只提交偏好候选 |
| `14-skill-system-spec.md` | Skill 声明模型能力需求；本 Spec 解析并选择兼容模型 |
| `15-publish-review-spec.md` | 发布审核声明审校或分类能力；本 Spec 选择模型，不定义发布门禁 |
