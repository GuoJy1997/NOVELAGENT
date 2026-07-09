# 14 Skill System Spec

状态：Review Candidate

日期：2026-07-09

上游依赖：

- `01-novel-project-spec.md`：定义小说项目、项目设置与小说级 Skill 偏好。
- `02-novel-cockpit-spec.md`：展示可用 Skill、运行状态和入口。
- `03-inspiration-vault-spec.md`：定义灵感整理、转化类 Skill 的业务边界。
- `04-arc-swimlane-diagram-spec.md`：定义结构与时间线 Skill 的业务输入输出。
- `05-clue-foreshadowing-spec.md`：定义线索、伏笔类 Skill 的业务输入输出。
- `06-character-system-spec.md`：定义人物类 Skill 的业务输入输出。
- `07-worldbuilding-system-spec.md`：定义世界观类 Skill 的业务输入输出。
- `08-chapter-writing-spec.md`：定义写作、改写类 Skill 的正文边界。
- `09-chapter-review-spec.md`：定义审查、修订类 Skill 的报告边界。
- `10-agent-orchestration-spec.md`：创建任务、分配 Subagent 并调度 `SkillInvocation`。
- `11-model-router-spec.md`：根据 Skill 的能力要求选择具体模型。
- `12-rag-context-engine-spec.md`：根据 Skill 的上下文声明构建 `ContextBundle`。
- `13-long-term-memory-spec.md`：执行 Skill 的记忆读写权限和候选确认规则。

下游依赖：

- `15-publish-review-spec.md`：使用已发布的审查 Skill 组成发布前检查流程。

相关底座文档：`2026-07-08-novel-agent-product-foundation-design.md`

## 1. 功能定位

Skill System 是 Novel Agent 的可复用能力层。它把“如何完成一种明确工作”封装为有名称、有版本、有输入输出契约、有权限声明、有评测结果的能力包，供用户、Orchestrator 或 Subagent 调用。

它解决的问题是：

1. 同一种写作、审查或修改能力可以跨任务复用，而不必把提示词散落在业务代码中。
2. 一次创作结果能够回答“用了哪个 Skill、哪个版本、什么模型和什么上下文”。
3. 用户可以按小说启用、停用和配置 Skill，不同小说不会互相污染。
4. Skill 升级后不会悄悄改变历史任务和正在运行的任务。
5. Skill 可以声明所需模型能力、上下文、工具和数据权限。
6. 写作型主观能力也有可重复的测试集、人工量表和回归记录。
7. 导入 Skill 不会默认获得任意代码执行、网络访问或跨小说读取能力。
8. Orchestrator、Subagent、Skill 和普通业务功能各自拥有清晰边界。

一句话定义：

> Skill 是一个版本固定、权限受限、输入输出可验证、质量可评测的小说创作能力包；它执行具体方法，但不拥有任务编排权和业务事实最终决定权。

## 2. 系统边界

### 2.1 Skill 与 Orchestrator

| Orchestrator | Skill |
|---|---|
| 理解用户目标并拆分任务 | 完成一种边界明确的能力 |
| 维护跨任务 DAG | 最多执行包内有限步骤 |
| 分配 Subagent | 不创建或管理 Subagent |
| 决定任务重试、暂停和恢复 | 返回成功、失败、部分结果或需确认 |
| 汇总多个任务结果 | 产出单次调用结果 |
| 决定何时调用 Skill | 不主动接管整个项目 |

Skill 可以声明前置条件和依赖 Skill，但不能绕过 Orchestrator 无限扩展任务。

### 2.2 Skill 与 Subagent

| Subagent | Skill |
|---|---|
| 是承担连续职责的角色 | 是可复用的能力或方法 |
| 可在一个任务中调用多个 Skill | 一次调用只服务于明确目标 |
| 可跨步骤观察和汇总 | 不维持独立长期人格 |
| 受任务授权约束 | 受 Invocation 权限约束 |
| 例如“线索编织师” | 例如“线索遗漏扫描” |

判断原则：

- “谁持续负责这项工作”属于 Subagent。
- “具体用什么方法完成一个动作”属于 Skill。
- “先做什么、后做什么、失败怎么办”属于 Orchestrator。

### 2.3 Skill 与普通业务功能

以下能力不应包装成 Skill：

- 保存、删除、排序、分页和筛选。
- 数据库事务与唯一性校验。
- 权限检查和小说隔离。
- 固定公式计算。
- 状态机转换。
- 文档版本创建。
- 文件上传、导出和缓存失效。
- 可由确定性代码稳定完成的字段转换。

只有满足以下一项时才适合成为 Skill：

- 需要模型理解或生成。
- 需要可替换的方法论。
- 需要多步但边界有限的工作流。
- 需要被不同业务入口重复调用。
- 需要独立版本、评测和权限声明。

### 2.4 Skill 与领域系统

Skill 不拥有以下领域事实：

- 小说 Canon。
- 人物、关系和人物状态。
- 世界观设定及规则。
- 线索和伏笔生命周期。
- 篇章、情节节点与章节结构。
- 章节正式正文。
- 审查结论的最终处置。
- 长期记忆。
- 发布状态。

Skill 只能读取授权快照，并输出草稿、建议、检查结果或变更候选。领域系统负责验证、确认和写入。

### 2.5 Skill 与 Prompt

Prompt 可以是 Skill 的一部分，但 Prompt 本身不等于完整 Skill。

完整 Skill 至少需要：

- 清晰触发条件。
- 输入 Schema。
- 输出 Schema。
- 执行说明。
- 模型能力要求。
- 上下文需求。
- 权限声明。
- 失败语义。
- 测试用例。
- 版本和来源。

### 2.6 Skill 与 Agent 自修改

MVP 不允许 Skill：

- 修改自身指令或 Manifest。
- 自动发布新版本。
- 修改其他 Skill。
- 根据一次运行结果永久改变触发规则。
- 自动安装依赖。
- 自动提升权限。

Skill 可以生成 `SkillImprovementProposal`，但必须由用户或管理员审查后创建新草稿版本。

## 3. Skill 包结构

### 3.1 标准目录

```text
skill-package/
├─ SKILL.md
├─ manifest.json
├─ schemas/
│  ├─ input.schema.json
│  └─ output.schema.json
├─ references/
├─ templates/
├─ scripts/
├─ tests/
│  ├─ cases/
│  └─ suite.json
└─ assets/
```

MVP 中只有 `SKILL.md`、`manifest.json`、输入 Schema、输出 Schema 和至少一个测试用例是必需项。

### 3.2 SKILL.md

`SKILL.md` 负责描述执行方法，包括：

- 目标。
- 适用场景。
- 不适用场景。
- 工作步骤。
- 判断标准。
- 输出要求。
- 风险和停止条件。
- 所需参考资料的加载方式。

内容应使用命令式、可执行语言，不应只写泛泛的角色设定。

### 3.3 Manifest

Manifest 负责机器可读声明，包括：

- 标识和版本。
- 名称、说明和分类。
- 能力标签。
- 触发策略。
- 输入输出 Schema 引用。
- 所需模型能力。
- 上下文请求模板。
- 权限。
- 工具依赖。
- Skill 依赖。
- 资源限制。
- 信任等级。
- 兼容版本。
- 内容哈希和签名。

### 3.4 渐进式加载

Skill 资源按需加载：

1. 解析阶段只读取 Manifest 元数据。
2. 选中 Skill 后加载 `SKILL.md`。
3. 执行到相应步骤时再加载指定 reference、template 或 asset。
4. 未使用资源不进入模型上下文。

这样可以减少上下文浪费，并降低无关参考资料干扰当前任务的风险。

### 3.5 资源限制

- 单个 Skill 包必须声明总大小。
- 单个文本资源必须有字符或 Token 上限。
- 二进制资源必须声明 MIME Type。
- 外部链接不是可信指令来源。
- 运行时不得读取包目录之外的本地文件，除非获得显式工具授权。
- 包内不得存储任何小说的正文、Canon、人物资料或用户密钥。

## 4. 用户角色与入口

### 4.1 普通作者

- 浏览内置 Skill。
- 查看说明、示例、版本和权限。
- 为当前小说启用或停用 Skill。
- 修改允许的小说级配置。
- 手动执行 Skill。
- 查看运行记录和结果。

### 4.2 高级作者

- 创建私有 Skill 草稿。
- 编辑说明、Schema、模板和测试。
- 比较版本差异。
- 运行评测。
- 发布到自己的 Workspace。

### 4.3 团队管理员

- 管理 Workspace 安装。
- 审核导入 Skill。
- 配置权限上限。
- 冻结、下架或回滚版本。
- 查看安全与质量报告。

### 4.4 Orchestrator / Subagent

- 根据任务声明请求能力。
- 使用解析后的固定 Skill 版本。
- 传入任务授权范围内的数据。
- 消费结构化结果。
- 不得修改安装、权限和版本。

### 4.5 主入口

```text
Novel Cockpit
  → Skills
  → Skill Center
```

### 4.6 上下文入口

- Cockpit 右侧 Skills 区。
- Agent Task 详情中的 Skill 调用区。
- 写作台的“写作方法”选择器。
- 审查中心的“审查能力”选择器。
- 灵感、人物、世界观、线索和结构模块的智能操作菜单。
- 项目设置中的 Novel Skill Binding。
- 模型路由记录中的兼容性解释。
- 运行历史中的 Skill Invocation 跳转。

## 5. 核心用户目标

### 5.1 找到合适的 Skill

用户可以按领域、动作、题材、输出类型、信任等级和适用场景筛选 Skill，并看到“不适用场景”。

### 5.2 为一本小说配置 Skill

用户可以：

- 启用或禁用。
- 固定版本或跟随兼容更新。
- 设置小说级参数。
- 指定默认 Skill。
- 设置自动调用或仅建议。
- 限制可读领域。
- 查看权限差异。

### 5.3 手动运行 Skill

用户选择目标对象、填写缺失输入、预览将读取的数据和将使用的模型，确认后运行。

### 5.4 让 Agent 自动调用 Skill

Orchestrator 根据任务所需能力解析 Skill。若多个 Skill 都兼容，可以按策略自动选择或请求用户确认。

### 5.5 查看运行来源

任何结果都可以追溯：

- Skill ID 和版本。
- 安装与小说绑定。
- 触发来源。
- 输入快照。
- ContextBundle。
- 模型和参数。
- 工具调用。
- 输出。
- 资源消耗。
- 失败与重试。

### 5.6 安全升级

用户升级前可以查看：

- 指令差异。
- Schema 差异。
- 新增权限。
- 新增依赖。
- 模型要求变化。
- 回归评测变化。
- 现有小说配置兼容性。

## 6. MVP 范围

### 6.1 Skill 注册与目录

- 内置 Skill 注册。
- Workspace 私有 Skill。
- Skill 分类和搜索。
- Skill 详情。
- 不可变版本。
- 启用、停用和废弃。

### 6.2 小说级绑定

- 每本小说独立绑定。
- 独立配置和权限授予。
- 默认 Skill。
- 自动调用策略。
- 版本固定。

### 6.3 解析与执行

- 显式调用。
- Orchestrator 按能力调用。
- 兼容性过滤。
- 输入输出 Schema 校验。
- 模型路由。
- RAG 上下文请求。
- 有限步骤执行。
- 结果与来源持久化。

### 6.4 权限与安全

- 数据域读权限。
- 候选写权限。
- 工具权限。
- 网络权限声明。
- 信任等级。
- 包哈希。
- 导入检查。
- 脚本默认禁用。

### 6.5 测试与评测

- 测试用例。
- 触发评测。
- 输出 Schema 评测。
- 规则断言。
- 人工量表。
- 基线对比。
- 发布门禁。

### 6.6 运行可观察性

- Invocation 状态。
- 步骤日志。
- Token、成本和时长。
- 错误码。
- 结果预览。
- 来源追踪。

## 7. 非 MVP 范围

- 公共 Skill 市场和付费分成。
- 未审核第三方远程代码。
- 任意系统命令执行。
- Skill 自主购买或开通外部服务。
- Skill 自动修改自身。
- Skill 自动发布新版本。
- 跨 Workspace 共享私密 Skill。
- 自动把所有导入 Skill 更新到最新版。
- 无限制递归 Composite Skill。
- 用户之间的实时协作编辑。
- Skill 训练或微调基础模型。
- Skill 持有独立长期记忆。
- Skill 绕过领域系统直接提交 Canon、正文或发布。

## 8. Skill 类型与默认目录

### 8.1 执行类型

| 类型 | 说明 | 示例 |
|---|---|---|
| `promptWorkflow` | 由模型按明确方法生成或分析 | 章节场景扩写 |
| `deterministicTool` | 对确定性工具的版本化封装 | 文本统计 |
| `validator` | 只读检查并输出问题 | POV 一致性检查 |
| `transformer` | 把一种结构转换成另一种结构 | 灵感转情节候选 |
| `compositeWorkflow` | 调用有限的子 Skill DAG | 单章综合审查 |
| `domainAnalyzer` | 结合领域对象和上下文进行分析 | 人物弧光断裂扫描 |

执行类型不决定业务权限；权限必须单独声明。

### 8.2 结构与大纲类

MVP 默认 Skill：

- 故事命题澄清。
- 核心冲突生成。
- 三幕 / 多幕结构建议。
- 篇章拆分。
- 情节节点补全。
- 节奏曲线诊断。
- 泳道图节点编排。
- 章节目标拆分。
- 结构缺口扫描。

### 8.3 线索与伏笔类

- 线索链生成。
- 伏笔植入建议。
- 提供者 / 触发者 / 接收者归因。
- 知情状态扫描。
- 回收窗口建议。
- 误导线索设计。
- 遗漏回收扫描。
- 公平推理检查。

### 8.4 人物类

- 人物小传生成。
- 目标与动机澄清。
- 人物弧光规划。
- 关系张力分析。
- 人物声音提取。
- 知情状态检查。
- 人设漂移检查。
- 配角功能检查。

### 8.5 世界观类

- 设定条目生成。
- 规则—限制—代价—例外补全。
- 世界观冲突扫描。
- 地点与阵营关联建议。
- 历史事件影响推演。
- 设定揭示节奏检查。
- 力量体系平衡检查。

### 8.6 章节写作类

- 章节任务书生成。
- 场景草稿。
- 章节草稿。
- 续写。
- 对白强化。
- 动作与空间清晰化。
- 节奏调整。
- 氛围塑造。
- 视角约束写作。
- 题材表达规则。
- 可解释的 AI 痕迹模式检查。

### 8.7 审查类

- 逻辑一致性审查。
- 跨章连续性审查。
- 人物一致性审查。
- 世界观一致性审查。
- 线索与伏笔审查。
- 节奏审查。
- POV 审查。
- 对白审查。
- 风格与重复表达审查。
- 发布风险预检。

### 8.8 修改类

- 最小改动修复。
- 按审查项修改。
- 扩写。
- 缩写。
- 场景重排建议。
- 对白改写。
- 语气统一。
- 事实冲突修复候选。
- 跨章同步修改计划。

修改 Skill 默认产出 `ChangeSetCandidate`，不得直接覆盖已确认版本。

### 8.9 上下文与记忆辅助类

- ContextRequest 生成。
- 事实候选提取。
- 冲突候选扫描。
- 章节状态卡提取。
- Review Lesson 候选提取。

这些 Skill 只负责提取或建议；Context Engine 和 Memory System 仍负责检索、验证和写入。

### 8.10 通用 Skill 不能包含项目事实

通用 Skill 包不得写入：

- 固定人物名。
- 某本小说的谜底。
- 某本小说的时间线。
- 用户正文。
- 私有世界观。
- 某本小说的模型密钥。

题材方法可以通用，项目事实必须通过 Invocation 输入或 ContextBundle 注入。

## 9. 核心数据对象

### 9.1 SkillDefinition

表示一个长期稳定的 Skill 身份。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | Skill ID |
| `workspaceId` | string? | 否 | 私有 Skill 所属 Workspace；内置为空 |
| `slug` | string | 是 | 稳定机器名 |
| `displayName` | string | 是 | 展示名 |
| `summary` | string | 是 | 简短说明 |
| `category` | enum | 是 | 结构、线索、人物、世界观、写作、审查、修改、上下文等 |
| `executionType` | enum | 是 | 执行类型 |
| `ownershipType` | enum | 是 | `builtIn`、`workspacePrivate`、`imported` |
| `trustLevel` | enum | 是 | 信任等级 |
| `ownerActorId` | string? | 否 | 创建者 |
| `currentPublishedVersionId` | string? | 否 | 当前发布版本 |
| `status` | enum | 是 | `active`、`deprecated`、`suspended`、`archived` |
| `createdAt` | datetime | 是 | 创建时间 |
| `updatedAt` | datetime | 是 | 更新时间 |

`SkillDefinition` 不包含具体小说内容，也不直接存放可变执行指令。

### 9.2 SkillVersion

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 版本 ID |
| `skillDefinitionId` | string | 是 | Skill |
| `version` | string | 是 | SemVer |
| `lifecycleStatus` | enum | 是 | 生命周期状态 |
| `manifestId` | string | 是 | Manifest |
| `instructionResourceId` | string | 是 | SKILL.md |
| `inputSchemaId` | string | 是 | 输入 Schema |
| `outputSchemaId` | string | 是 | 输出 Schema |
| `contentHash` | string | 是 | 包内容哈希 |
| `signature` | string? | 否 | 发布签名 |
| `changelog` | string | 是 | 版本说明 |
| `compatibilityRange` | object | 是 | 平台和依赖兼容范围 |
| `publishedAt` | datetime? | 否 | 发布时间 |
| `publishedBy` | string? | 否 | 发布者 |
| `createdAt` | datetime | 是 | 创建时间 |

已发布版本不可原地修改。任何指令、Schema、权限、依赖或资源变化都必须创建新版本。

### 9.3 SkillManifest

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | Manifest ID |
| `skillVersionId` | string | 是 | Skill 版本 |
| `description` | string | 是 | 做什么以及何时使用 |
| `useWhen` | string[] | 是 | 适用场景 |
| `doNotUseWhen` | string[] | 是 | 不适用场景 |
| `capabilityIds` | string[] | 是 | 提供能力 |
| `triggerPolicy` | object | 是 | 触发策略 |
| `modelRequirement` | object | 是 | 模型能力要求 |
| `contextRequestTemplateId` | string? | 否 | 上下文模板 |
| `permissionDeclarationId` | string | 是 | 权限声明 |
| `toolDependencies` | object[] | 是 | 工具要求 |
| `skillDependencies` | object[] | 是 | Skill 依赖 |
| `resourceLimits` | object | 是 | Token、时长、步骤和成本上限 |
| `riskLevel` | enum | 是 | `low`、`medium`、`high` |
| `confirmationPolicy` | enum | 是 | 确认策略 |
| `resultType` | string | 是 | 主要结果类型 |
| `localeSupport` | string[] | 是 | 支持语言 |

### 9.4 SkillCapability

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 能力 ID |
| `code` | string | 是 | 稳定能力码 |
| `domain` | enum | 是 | 业务领域 |
| `action` | string | 是 | 分析、生成、审查、修改等 |
| `inputKinds` | string[] | 是 | 可接受输入 |
| `outputKinds` | string[] | 是 | 可产出结果 |
| `qualityTags` | string[] | 是 | 长上下文、强推理、风格等 |

Orchestrator 应请求 Capability，而不是依赖展示名模糊匹配 Skill。

### 9.5 SkillResource

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 资源 ID |
| `skillVersionId` | string | 是 | 版本 |
| `resourceType` | enum | 是 | `instruction`、`reference`、`template`、`script`、`asset`、`schema` |
| `path` | string | 是 | 包内路径 |
| `mimeType` | string | 是 | MIME |
| `contentHash` | string | 是 | 哈希 |
| `sizeBytes` | integer | 是 | 大小 |
| `loadPolicy` | enum | 是 | `eager`、`onSelected`、`onStep` |
| `trustedInstruction` | boolean | 是 | 是否可作为指令 |

只有 Skill 主指令和平台认可模板可标记为 `trustedInstruction=true`。reference 默认只是数据。

### 9.6 SkillDependency

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 依赖 ID |
| `skillVersionId` | string | 是 | 所属版本 |
| `dependencySkillId` | string | 是 | 被依赖 Skill |
| `versionRange` | string | 是 | 兼容范围 |
| `requiredCapabilityCode` | string? | 否 | 能力要求 |
| `required` | boolean | 是 | 是否必需 |
| `fallbackPolicy` | enum | 是 | 缺失时处理 |

依赖图必须是有向无环图。发布和执行前都要检测环。

### 9.7 SkillInstallation

表示 Workspace 可用的一个 Skill 版本。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 安装 ID |
| `workspaceId` | string | 是 | Workspace |
| `skillDefinitionId` | string | 是 | Skill |
| `installedVersionId` | string | 是 | 当前安装版本 |
| `versionPolicy` | enum | 是 | `pinned`、`compatibleManual` |
| `enabled` | boolean | 是 | Workspace 是否可用 |
| `installedFrom` | enum | 是 | `builtIn`、`private`、`packageImport` |
| `securityReviewStatus` | enum | 是 | 安全检查状态 |
| `installedBy` | string | 是 | 安装者 |
| `installedAt` | datetime | 是 | 安装时间 |
| `updatedAt` | datetime | 是 | 更新时间 |

MVP 不支持无人值守自动升级。`compatibleManual` 只表示可以提示兼容更新。

### 9.8 NovelSkillBinding

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 绑定 ID |
| `workspaceId` | string | 是 | Workspace |
| `novelId` | string | 是 | 小说 |
| `skillInstallationId` | string | 是 | 安装 |
| `boundVersionId` | string | 是 | 固定版本 |
| `enabled` | boolean | 是 | 本小说是否启用 |
| `invocationPolicy` | enum | 是 | `manualOnly`、`recommend`、`autoLowRisk` |
| `isDefaultForCapabilities` | string[] | 是 | 默认能力 |
| `configurationId` | string? | 否 | 小说级配置 |
| `permissionGrantId` | string | 是 | 小说级授权 |
| `createdBy` | string | 是 | 创建者 |
| `createdAt` | datetime | 是 | 创建时间 |
| `updatedAt` | datetime | 是 | 更新时间 |

每个绑定都必须带 `novelId`。绑定、配置、授权和运行历史不能跨小说复用。

### 9.9 SkillConfiguration

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 配置 ID |
| `novelId` | string | 是 | 小说 |
| `novelSkillBindingId` | string | 是 | 绑定 |
| `schemaVersion` | string | 是 | 配置 Schema 版本 |
| `values` | object | 是 | 配置值 |
| `secretRefs` | string[] | 是 | 密钥引用，不保存明文 |
| `createdAt` | datetime | 是 | 创建时间 |
| `updatedAt` | datetime | 是 | 更新时间 |

配置优先级：

```text
本次 Invocation 显式参数
  → NovelSkillBinding 配置
  → Workspace Installation 默认值
  → SkillVersion 默认值
```

高优先级配置不能扩大低层授予的权限。

### 9.10 SkillPermissionDeclaration

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 声明 ID |
| `skillVersionId` | string | 是 | 版本 |
| `readScopes` | string[] | 是 | 请求读取的数据域 |
| `candidateWriteScopes` | string[] | 是 | 可提交候选的领域 |
| `toolScopes` | string[] | 是 | 工具范围 |
| `networkScopes` | string[] | 是 | 网络范围 |
| `secretScopes` | string[] | 是 | 密钥引用类型 |
| `requiresUserConfirmation` | string[] | 是 | 需确认动作 |

### 9.11 SkillPermissionGrant

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 授权 ID |
| `workspaceId` | string | 是 | Workspace |
| `novelId` | string | 是 | 小说 |
| `novelSkillBindingId` | string | 是 | 绑定 |
| `grantedReadScopes` | string[] | 是 | 实际读取权限 |
| `grantedCandidateWriteScopes` | string[] | 是 | 实际候选写权限 |
| `grantedToolScopes` | string[] | 是 | 实际工具权限 |
| `grantedNetworkScopes` | string[] | 是 | 实际网络权限 |
| `grantedBy` | string | 是 | 授权者 |
| `expiresAt` | datetime? | 否 | 到期时间 |
| `revokedAt` | datetime? | 否 | 撤销时间 |

实际权限是声明、Workspace 策略、小说绑定、任务授权和用户身份权限的交集。

### 9.12 SkillInvocationRequest

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 请求 ID |
| `workspaceId` | string | 是 | Workspace |
| `novelId` | string | 是 | 小说 |
| `sourceType` | enum | 是 | `user`、`agentTask`、`subagent`、`domainAction`、`eval` |
| `sourceRefId` | string | 是 | 来源对象 |
| `requestedCapabilityCodes` | string[] | 是 | 所需能力 |
| `explicitSkillRef` | object? | 否 | 用户显式选择 |
| `input` | object | 是 | 输入 |
| `targetRefs` | object[] | 是 | 目标领域对象 |
| `runtimeOverrides` | object | 是 | 本次允许覆盖项 |
| `taskAuthorizationRef` | string? | 否 | 任务授权 |
| `requestedBy` | string | 是 | 请求者 |
| `createdAt` | datetime | 是 | 创建时间 |

### 9.13 SkillInvocation

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 调用 ID |
| `workspaceId` | string | 是 | Workspace |
| `novelId` | string | 是 | 小说 |
| `requestId` | string | 是 | 调用请求 |
| `novelSkillBindingId` | string | 是 | 小说绑定 |
| `skillVersionId` | string | 是 | 固定版本 |
| `status` | enum | 是 | 调用状态 |
| `triggerMode` | enum | 是 | `explicit`、`resolved`、`composite`、`eval` |
| `inputSnapshotRef` | string | 是 | 不可变输入快照 |
| `configurationSnapshotRef` | string | 是 | 配置快照 |
| `permissionSnapshotRef` | string | 是 | 权限快照 |
| `modelDecisionId` | string? | 否 | 模型路由结果 |
| `contextBundleId` | string? | 否 | 上下文包 |
| `resultId` | string? | 否 | 结果 |
| `parentInvocationId` | string? | 否 | Composite 父调用 |
| `attemptNumber` | integer | 是 | 尝试次数 |
| `startedAt` | datetime? | 否 | 开始时间 |
| `finishedAt` | datetime? | 否 | 结束时间 |
| `errorCode` | string? | 否 | 错误码 |
| `createdAt` | datetime | 是 | 创建时间 |

### 9.14 SkillExecutionStep

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 步骤 ID |
| `novelId` | string | 是 | 小说 |
| `skillInvocationId` | string | 是 | 调用 |
| `stepIndex` | integer | 是 | 顺序 |
| `stepType` | enum | 是 | `loadResource`、`retrieveContext`、`modelCall`、`toolCall`、`invokeSkill`、`validate` |
| `name` | string | 是 | 步骤名 |
| `status` | enum | 是 | 步骤状态 |
| `inputRefs` | object[] | 是 | 输入引用 |
| `outputRefs` | object[] | 是 | 输出引用 |
| `startedAt` | datetime? | 否 | 开始时间 |
| `finishedAt` | datetime? | 否 | 结束时间 |
| `errorCode` | string? | 否 | 错误 |

日志不得保存模型密钥或未经脱敏的敏感正文副本。

### 9.15 SkillResult

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 结果 ID |
| `workspaceId` | string | 是 | Workspace |
| `novelId` | string | 是 | 小说 |
| `skillInvocationId` | string | 是 | 调用 |
| `resultType` | string | 是 | 结果类型 |
| `schemaVersion` | string | 是 | 输出 Schema |
| `payloadRef` | string | 是 | 结构化结果 |
| `artifactRefs` | object[] | 是 | 草稿、报告、候选等 |
| `provenanceRefs` | object[] | 是 | 来源 |
| `warnings` | object[] | 是 | 警告 |
| `requiresConfirmation` | boolean | 是 | 是否待确认 |
| `createdAt` | datetime | 是 | 创建时间 |

### 9.16 SkillTestCase

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 用例 ID |
| `skillVersionId` | string | 是 | 版本 |
| `name` | string | 是 | 名称 |
| `testType` | enum | 是 | `trigger`、`schema`、`quality`、`safety`、`regression`、`integration` |
| `inputFixtureRef` | string | 是 | 输入夹具 |
| `expectedAssertions` | object[] | 是 | 断言 |
| `rubricId` | string? | 否 | 人工或模型量表 |
| `tags` | string[] | 是 | 标签 |
| `enabled` | boolean | 是 | 是否启用 |

### 9.17 SkillEvalSuite

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 套件 ID |
| `skillDefinitionId` | string | 是 | Skill |
| `name` | string | 是 | 套件名 |
| `testCaseIds` | string[] | 是 | 测试用例 |
| `requiredForPublish` | boolean | 是 | 发布门禁 |
| `metricDefinitions` | object[] | 是 | 指标 |
| `minimumThresholds` | object | 是 | 最低阈值 |

### 9.18 SkillEvalRun

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 运行 ID |
| `skillVersionId` | string | 是 | 被测版本 |
| `evalSuiteId` | string | 是 | 套件 |
| `baselineVersionId` | string? | 否 | 基线版本 |
| `status` | enum | 是 | 状态 |
| `caseResults` | object[] | 是 | 用例结果 |
| `metricSnapshotId` | string? | 否 | 指标快照 |
| `modelDecisionRefs` | string[] | 是 | 评测使用模型 |
| `reviewerRefs` | string[] | 是 | 人工审阅者 |
| `startedAt` | datetime? | 否 | 开始时间 |
| `finishedAt` | datetime? | 否 | 结束时间 |

### 9.19 SkillMetricSnapshot

保存一次评测中可比较的聚合指标。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 指标快照 ID |
| `skillVersionId` | string | 是 | Skill 版本 |
| `evalRunId` | string | 是 | 评测运行 |
| `metrics` | object | 是 | 分维度指标，不只保存总分 |
| `sampleCounts` | object | 是 | 各指标样本量 |
| `confidenceNotes` | object | 是 | 波动、置信和局限说明 |
| `costSummary` | object | 是 | Token、费用和时长 |
| `segmentation` | object | 是 | 题材、语言、任务难度等分组 |
| `createdAt` | datetime | 是 | 创建时间 |

样本量不足或只由模型评审得出的指标必须明确标记，不得包装成稳定质量结论。

### 9.20 SkillUpgradePlan

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `id` | string | 是 | 升级计划 |
| `skillInstallationId` | string | 是 | 安装 |
| `fromVersionId` | string | 是 | 原版本 |
| `toVersionId` | string | 是 | 目标版本 |
| `manifestDiff` | object | 是 | Manifest 差异 |
| `permissionDiff` | object | 是 | 权限差异 |
| `schemaDiff` | object | 是 | Schema 差异 |
| `dependencyDiff` | object | 是 | 依赖差异 |
| `evalComparison` | object | 是 | 评测对比 |
| `affectedNovelBindingIds` | string[] | 是 | 受影响绑定 |
| `compatibilityStatus` | enum | 是 | 兼容状态 |
| `approvedBy` | string? | 否 | 审批者 |

### 9.21 SkillEvent

所有关键动作写入事件：

- Skill 创建。
- 草稿版本创建。
- 验证开始和结束。
- 版本发布。
- 安装和卸载。
- 小说绑定启停。
- 权限授予和撤销。
- Invocation 创建、开始、结束、失败和取消。
- 评测运行。
- 升级、回滚、废弃、暂停。
- 安全策略拦截。

事件至少包含 `workspaceId`、可选 `novelId`、操作者、对象、动作、时间和追踪 ID。

## 10. 生命周期与版本

### 10.1 SkillVersion 状态机

```text
draft
  → validating
  → tested
  → published
  → deprecated
  → archived

draft / validating / tested
  → rejected

published / deprecated
  → suspended
  → published / deprecated
```

规则：

1. `draft` 可编辑。
2. `validating` 执行静态、Schema、安全和依赖检查。
3. `tested` 表示通过必需评测，不代表已可安装。
4. `published` 版本不可变。
5. `deprecated` 允许现有固定绑定继续使用，但不推荐新绑定。
6. `suspended` 阻止新 Invocation；运行中的调用按安全策略取消或完成。
7. `archived` 不可新安装。
8. `rejected` 记录原因，可以从原内容创建新草稿。

### 10.2 SemVer 规则

- Patch：修正文案、示例或不改变 Schema 和权限的内部实现。
- Minor：新增向后兼容能力、可选字段或资源。
- Major：输入输出不兼容、删除能力、权限扩大、语义显著变化。

即使是 Patch，已发布内容也不得原地覆盖。

### 10.3 Invocation 状态机

```text
created
  → resolving
  → awaitingConfirmation
  → queued
  → preparingContext
  → running
  → validatingOutput
  → succeeded

resolving / preparingContext / running / validatingOutput
  → failed

awaitingConfirmation / queued / running
  → cancelled

running
  → partial

failed / partial
  → retryRequested
  → created(new attempt)
```

重试必须创建新 Attempt，保留原失败记录，并重新固定输入、权限、模型和上下文快照。

### 10.4 安装与绑定规则

- Installation 属于 Workspace。
- Binding 属于一本小说。
- Invocation 固定到确切 `SkillVersionId`。
- Workspace 升级 Installation 不自动改变现有 Binding。
- 用户可批量迁移绑定，但每本小说独立产生升级结果。
- 历史 Invocation 永远指向原版本。

### 10.5 回滚

回滚不是修改旧版本，而是把 Installation 或 Binding 指回一个仍可用的已发布版本。

若旧版本存在已知安全问题，平台可以禁止回滚并说明原因。

## 11. Skill 解析

### 11.1 解析优先级

```text
用户显式选择的 Skill + 版本
  → NovelSkillBinding 的默认 Skill
  → AgentTask 指定的 SkillRef
  → 按 Capability 自动解析
```

显式选择仍需通过启用、权限、兼容性和安全检查。

### 11.2 兼容性过滤

候选 Skill 必须依次通过：

1. Workspace 已安装且启用。
2. 当前小说已绑定且启用。
3. 版本是 `published`，或是受控 Eval 运行。
4. 提供全部必需 Capability。
5. 输入类型和 Schema 兼容。
6. 依赖 Skill 可解析且无环。
7. 所需工具可用。
8. 所需模型能力可满足。
9. Context Engine 可以提供必需上下文类型。
10. 权限声明不超过实际授权。
11. Token、成本和时长不超过任务预算。
12. 信任和风险策略允许运行。

### 11.3 排名因素

通过过滤后可以按以下因素排名：

- 用户显式偏好。
- 小说级默认设置。
- 能力匹配度。
- 题材和语言适配。
- 最近成功率。
- 当前版本评测结果。
- 预计成本和时长。
- 所需上下文完整度。
- 用户历史接受率。

用户历史偏好只能作为排序信号，不能绕过权限和兼容性。

### 11.4 解析结果

`SkillResolutionDecision` 至少返回：

- 候选列表。
- 被过滤原因。
- 最终 Skill 和固定版本。
- 使用的绑定和配置。
- 所需确认。
- 所需模型能力。
- 所需上下文。
- 所需权限。
- 预计成本和时长。
- 决策解释。

### 11.5 禁止模糊替换

若指定 Skill 不可用：

- 不得静默选择同名或相似名称 Skill。
- 可以推荐替代项。
- 必须展示能力、权限、输出和质量差异。
- 高风险任务必须由用户确认替代。

## 12. 执行契约

### 12.1 标准执行流程

```text
SkillInvocationRequest
  → 解析确切 SkillVersion
  → 校验小说绑定与权限
  → 校验输入 Schema
  → 固定配置和输入快照
  → 请求 Model Router
  → 请求 Context Engine
  → 执行有限步骤
  → 校验输出 Schema
  → 创建 SkillResult 与 Artifact
  → 提交领域变更候选
  → 记录 Invocation、用量和来源
```

### 12.2 输入要求

每次 Invocation 必须包含：

- `workspaceId`。
- `novelId`。
- 任务目标。
- 目标对象引用。
- 显式输入。
- 用户或任务授权。
- 输出期待。
- 风险和确认策略。

输入对象引用必须在运行开始时解析为版本化快照，避免执行中源对象变化导致结果不可复现。

### 12.3 输出要求

所有 Skill 输出至少包含：

- 结构化结果。
- `resultType` 和 Schema 版本。
- 目标对象引用。
- 来源引用。
- 假设和不确定项。
- 风险和冲突。
- 是否需要用户确认。
- 建议的下一步，但不得自行创建无限任务。

### 12.4 允许的结果类型

- `DraftArtifact`
- `ReviewFindingSet`
- `ChangeSetCandidate`
- `DomainObjectCandidate`
- `MemoryWriteCandidate`
- `ContextRequestCandidate`
- `TaskExpansionProposal`
- `DecisionRecommendation`
- `MetricReport`

Skill 不直接返回“已修改正式正文”或“已发布”作为事实，除非相应领域系统已执行独立确认动作。

### 12.5 Composite Skill

Composite Skill 可以包含有限 DAG：

```text
输入校验
  → 并行调用逻辑审查 / 人物审查 / 线索审查
  → 汇总
  → 输出综合报告
```

限制：

- 最大深度由平台配置。
- 最大子 Invocation 数由 Manifest 声明。
- 子 Skill 必须固定版本。
- 子权限不能超过父 Invocation。
- 依赖图必须无环。
- 子调用失败策略必须显式声明。
- Composite 不得创建 AgentTask；需要扩展时返回 `TaskExpansionProposal`。

### 12.6 取消与超时

- 用户取消后停止创建新步骤。
- 可取消的工具和模型请求应尽快取消。
- 已产生的部分结果标记为 `partial`，不得伪装为完整结果。
- 超时后保存诊断信息和安全的中间产物引用。
- 重试是否复用 ContextBundle 由新鲜度策略决定。

### 12.7 幂等性

- 相同 Invocation ID 不得创建两个最终结果。
- 重试使用新 Attempt ID。
- 确定性工具步骤应支持幂等键。
- 非确定性模型结果不能因输入相同就覆盖旧结果。

### 12.8 可复现性

系统应固定：

- SkillVersion。
- 指令和资源哈希。
- 输入与配置快照。
- 权限快照。
- 模型版本与参数。
- ContextBundle 及来源版本。
- 工具版本。

模型服务可能无法做到逐字复现，系统承诺的是执行条件可追溯，而不是输出字面完全一致。

## 13. 权限、安全与信任

### 13.1 信任等级

| 等级 | 来源 | 默认策略 |
|---|---|---|
| `builtIn` | 产品内置并签名 | 可按小说启用 |
| `verified` | 通过 Workspace 审核 | 可授权低风险自动调用 |
| `userCreated` | 当前 Workspace 创建 | 默认仅私有 |
| `importedUntrusted` | 外部包导入 | 禁止运行，先检查 |
| `suspended` | 被安全策略暂停 | 禁止新调用 |

信任等级不替代权限检查。

### 13.2 最小权限

Skill 实际权限：

```text
Manifest 声明
∩ Workspace 策略
∩ NovelSkillBinding 授权
∩ AgentTask 授权
∩ 当前用户权限
```

任一层未授权即不可用。

### 13.3 数据读取范围

可声明的典型读取域：

- `project.metadata.read`
- `structure.read`
- `character.read`
- `world.read`
- `clue.read`
- `chapter.plan.read`
- `chapter.draft.read`
- `review.read`
- `memory.read`
- `inspiration.read`

每次读取仍必须自动附加 `workspaceId` 和 `novelId` 过滤。

### 13.4 候选写入范围

典型候选权限：

- `structure.candidate.create`
- `character.candidate.create`
- `world.candidate.create`
- `clue.candidate.create`
- `chapter.draft.create`
- `chapter.changeSet.create`
- `review.finding.create`
- `memory.candidate.create`

不得授予通用 Skill：

- `canon.commit`
- `chapter.published.overwrite`
- `memory.activate`
- `publish.approve`
- `permission.grant`

### 13.5 工具与网络

- 工具必须按稳定工具 ID allowlist。
- 参数必须经过 Schema 校验。
- 网络默认关闭。
- 若 Skill 需要网络，必须声明域名、方法、数据类型和目的。
- 不允许通过重定向访问未授权域名。
- 用户正文默认不得发送到第三方服务。
- 密钥只以 Secret Ref 注入，日志和模型上下文不得包含明文。

### 13.6 脚本策略

MVP：

- 内置签名脚本可以在受限运行环境执行。
- 外部导入脚本默认禁用。
- 禁止任意 Shell。
- 禁止访问宿主文件系统。
- 禁止动态安装依赖。
- 限制 CPU、内存、时长和输出大小。
- 只开放明确输入目录和临时输出目录。

### 13.7 Prompt Injection 防护

- 外部资料、RAG 片段和 Skill reference 默认作为数据，不作为高优先级指令。
- Skill 主指令与检索内容使用明确边界。
- 检索内容中的“忽略规则”“调用工具”等文本不得提升权限。
- 工具调用只能来自执行器依据 Manifest 和当前步骤批准的结构化请求。
- 输出校验必须检查越权动作、隐藏指令和异常外链。

### 13.8 导入检查

导入 Skill 必须检查：

- 包结构和 Manifest。
- 文件路径穿越。
- 内容哈希。
- 签名。
- Schema。
- 依赖环。
- 权限范围。
- 脚本和二进制资源。
- 外部链接。
- 可疑 Prompt。
- Secret 和私有小说内容。
- 包大小和资源上限。

检查通过不代表自动启用。

### 13.9 跨小说隔离

- Skill 包不包含小说数据。
- NovelSkillBinding、Configuration、Grant、Invocation、Result、Eval Fixture 都必须明确作用域。
- 小说级 Invocation 只能读取同一 `novelId`。
- Composite 子调用继承同一 `novelId`，不可覆盖。
- 缓存键必须包含 `workspaceId`、`novelId`、SkillVersion 和权限快照。
- 用一本小说创建的真实测试夹具不得用于另一小说。

## 14. 测试、评测与发布门禁

### 14.1 为什么需要评测

Skill 的“能运行”与“值得使用”是两件事。系统需要同时验证：

- 是否在正确场景触发。
- 是否不会在错误场景触发。
- 输入输出是否符合契约。
- 是否遵守权限和业务边界。
- 是否达到领域质量标准。
- 新版本是否比旧版本退化。

### 14.2 触发评测

每个可自动解析 Skill 至少包含：

- 应触发样例。
- 不应触发样例。
- 与相邻 Skill 容易混淆的样例。
- 信息不足时应请求补充的样例。
- 用户显式指定其他 Skill 时不得抢占的样例。

触发指标：

- Precision。
- Recall。
- 相邻能力混淆率。
- 不安全自动触发率。

### 14.3 契约评测

自动检查：

- 输入 Schema。
- 输出 Schema。
- 必填来源。
- 目标引用合法性。
- 未知字段策略。
- 输出大小。
- 错误语义。
- 空结果语义。
- 候选而非直接提交。

### 14.4 安全评测

至少覆盖：

- 跨小说读取尝试。
- 越权写入尝试。
- 外部资料 Prompt Injection。
- Secret 泄漏。
- 非 allowlist 工具调用。
- 网络重定向。
- 递归依赖。
- 超预算执行。
- 恶意输出链接。
- 伪造“用户已确认”。

### 14.5 领域质量评测

不同 Skill 使用不同量表。例如章节写作 Skill 可以评估：

- 是否完成章节目标。
- 人物行为是否符合约束。
- 是否引入未经授权的新 Canon。
- 视角是否稳定。
- 场景因果是否清楚。
- 对白是否区分人物。
- 节奏是否符合任务书。
- 是否出现可解释的模板化表达模式。

线索 Skill 可以评估：

- 提供者、触发者和接收者是否明确。
- 知情状态是否合理。
- 是否可追溯到回收点。
- 是否提前泄露谜底。
- 是否符合公平推理。

### 14.6 主观评测原则

- 不用一个“总分”掩盖不同质量维度。
- 模型评审只作为信号，不等于用户审美。
- 关键版本必须有人类样本审阅。
- 保留正向和反向示例。
- 评测模型版本必须记录。
- 同一版本可以按题材和语言分别报告。

### 14.7 回归对比

升级时至少比较：

- 通过率。
- 关键安全断言。
- 触发 Precision / Recall。
- Schema 合法率。
- 人工量表各维度。
- 平均 Token、成本和时长。
- 用户接受 / 撤销率。

任何安全指标退化都阻止发布。质量退化超过阈值时必须人工审批。

### 14.8 发布门禁

版本进入 `published` 前必须：

1. Manifest 完整。
2. 输入输出 Schema 有效。
3. 依赖无环且版本可解析。
4. 权限声明通过检查。
5. 包内容无 Secret 和项目私有数据。
6. 必需测试用例齐全。
7. 发布必需 EvalSuite 通过。
8. 高风险 Skill 经过人工审阅。
9. 内容哈希生成。
10. 发布签名完成。
11. Changelog 完整。

### 14.9 线上质量信号

系统可以记录聚合指标：

- 调用成功率。
- 输出 Schema 失败率。
- 平均重试次数。
- 用户接受、编辑、撤销和丢弃率。
- 审查发现的后续问题率。
- 平均成本和时长。
- 因权限、上下文或模型不兼容被阻止的比例。

这些指标不得包含可还原的小说正文。

## 15. 模型、RAG、记忆与编排集成

### 15.1 Model Router

Skill 声明能力要求，不绑定具体供应商模型。例如：

```json
{
  "capabilities": ["longContext", "structuredOutput", "strongReasoning"],
  "minimumContextWindow": 64000,
  "preferredStyle": "creativeWriting",
  "supportsToolCalling": true,
  "qualityTier": "balanced",
  "maxEstimatedCost": 1.5
}
```

Model Router：

- 解析实际模型。
- 执行用户模型偏好。
- 检查可用性、预算和数据策略。
- 返回决策解释。

SkillInvocation 固定实际模型决定。切换模型不会改变 SkillVersion。

### 15.2 Context Engine

Skill 可以提供 `ContextRequestTemplate`，声明：

- 必需和可选知识源。
- 时间和章节范围。
- 目标人物、线索、设定或情节节点。
- Token 预算。
- 权威来源优先级。
- 是否需要反例、冲突和未确认候选。

Context Engine 决定检索、重排、裁剪和打包；Skill 不直接查询底层向量库。

### 15.3 Long-Term Memory

Skill 可以：

- 在授权范围内读取已激活记忆。
- 请求特定 MemoryType。
- 输出 `MemoryWriteCandidate`。
- 输出记忆冲突候选。

Skill 不可以：

- 直接激活记忆。
- 覆盖旧记忆。
- 解决高风险 Canon 冲突。
- 把临时推断写成事实。
- 把另一小说记忆作为参考。

### 15.4 Agent Orchestration

Orchestrator 负责：

- 创建 SkillInvocationRequest。
- 选择任务授权。
- 处理需确认状态。
- 根据结果创建后续任务。
- 汇总多个 Skill 结果。
- 决定重试、替代、暂停或降级。

Skill 执行器负责：

- 版本解析。
- Schema 和权限验证。
- 调用模型、上下文和工具。
- 输出验证。
- 记录 Invocation。

### 15.5 领域系统

领域系统必须为 Skill 提供稳定的输入和候选输出契约。例如：

- Character System 接受 `CharacterPatchCandidate`。
- Worldbuilding System 接受 `WorldEntryCandidate`。
- Clue System 接受 `ClueChainCandidate`。
- Chapter Writing 接受 `ChapterDraftArtifact` 或 `ChangeSetCandidate`。
- Review System 接受 `ReviewFindingSet`。

领域系统可以拒绝 Skill 结果，并返回字段级原因。

## 16. UI 信息架构

### 16.1 Skill Center

页面区块：

- 分类导航。
- 搜索与筛选。
- 已安装。
- 当前小说已启用。
- 可更新。
- 内置推荐。
- 私有 Skill。
- 已暂停或废弃。

Skill 卡片至少展示：

- 名称。
- 一句话用途。
- 分类。
- 版本。
- 信任等级。
- 当前小说状态。
- 自动调用策略。
- 主要权限。
- 质量状态。

### 16.2 Skill 详情

Tab：

- 概览。
- 适用 / 不适用场景。
- 输入输出。
- 权限。
- 模型与上下文。
- 版本。
- 测试与评测。
- 运行历史。
- 依赖。

详情页必须用普通用户能理解的语言解释权限，而不只展示权限码。

### 16.3 小说级配置抽屉

展示：

- 是否启用。
- 固定版本。
- 自动调用策略。
- 默认能力。
- 可编辑配置。
- 数据读取范围。
- 候选写入范围。
- 模型偏好。
- 成本上限。
- 升级策略。

### 16.4 执行前预览

高风险或手动 Invocation 显示：

- 将运行的 Skill 和版本。
- 为什么选择它。
- 将读取哪些小说数据。
- 将调用的模型和工具。
- 预计 Token、成本和时长。
- 将产生什么类型的结果。
- 哪些动作仍需用户确认。

### 16.5 运行详情

展示：

- 状态时间线。
- 当前步骤。
- 父子 Invocation。
- 模型与 ContextBundle。
- 权限快照。
- Token、成本和时长。
- 结果与警告。
- 错误与重试。
- 来源。

默认不展示完整内部推理，只展示可审计的决策摘要和结构化步骤。

### 16.6 Skill 编辑器

MVP 高级入口包含：

- Manifest 表单。
- SKILL.md 编辑器。
- Schema 编辑器。
- 资源管理。
- 权限声明。
- 依赖管理。
- 测试用例。
- 本地试运行。
- 版本差异。
- 发布检查清单。

### 16.7 Eval Dashboard

展示：

- 测试套件。
- 用例通过率。
- 触发混淆矩阵。
- 安全断言。
- 质量量表。
- 基线版本对比。
- 成本与时长。
- 人工审阅状态。

### 16.8 Upgrade Diff

升级确认页突出：

- 新增或扩大权限。
- 输入输出不兼容。
- 新增工具、网络和 Secret。
- 指令变化。
- 依赖变化。
- 评测退化。
- 受影响的小说。

权限扩大不得使用默认勾选的“一键同意”。

## 17. 异常与降级

### 17.1 找不到兼容 Skill

- 返回缺失 Capability。
- 展示过滤原因。
- 推荐可安装或可配置项。
- 不创建空 Invocation。

### 17.2 输入不完整

- 返回字段级缺失项。
- 可生成补充问题。
- Invocation 保持 `awaitingConfirmation` 或请求终止。
- 不用模型猜测关键事实。

### 17.3 Skill 被停用

- 新调用被阻止。
- 已排队调用取消并说明。
- 已运行调用按安全等级决定取消或完成。
- 历史结果仍可查看。

### 17.4 版本或依赖不兼容

- 阻止执行。
- 展示具体依赖链。
- 允许创建升级计划。
- 不静默更换版本。

### 17.5 权限不足

- 返回缺少的最小权限。
- 允许请求授权。
- 不展示未经授权数据的存在与内容。
- 授权后创建新 Attempt。

### 17.6 模型不可用

- Model Router 返回替代候选。
- 若替代模型满足能力和策略，可请求确认。
- 明确输出质量、成本和数据策略差异。
- 不兼容时失败。

### 17.7 ContextBundle 不完整

- 标记缺失来源。
- 按 Manifest 判断可降级、需确认或失败。
- 结果必须携带上下文不足警告。
- 不把缺失事实补成 Canon。

### 17.8 输出 Schema 不合法

- 在预算内允许一次结构修复。
- 修复调用保留为步骤。
- 仍失败则 Invocation 失败或部分成功。
- 不把未校验输出交给领域写入接口。

### 17.9 超时或超预算

- 停止新步骤。
- 保存可安全使用的部分结果。
- 返回已消耗资源。
- 提供缩小范围、换模型或拆任务建议。

### 17.10 Composite 子 Skill 失败

按 Manifest 的策略：

- `failFast`：父调用失败。
- `continueWithWarning`：继续并标记缺口。
- `requireUserDecision`：暂停等待。
- `useDeclaredFallback`：使用显式备用 Skill。

不得临时按名称搜索未知替代 Skill。

### 17.11 导入包可疑

- 安装状态保持隔离。
- 不加载脚本。
- 展示命中的安全规则。
- 允许删除或提交人工审核。

### 17.12 Skill 结果与 Canon 冲突

- 创建 Conflict Candidate。
- 保留双方来源。
- 不自动覆盖 Canon。
- 由领域系统和用户解决。

### 17.13 用户在运行中修改目标对象

- 当前 Invocation 继续使用原输入快照。
- 结果写回前检测版本冲突。
- 需要时生成基于新版本的重新运行建议。
- 不强行把旧结果应用到新版本。

### 17.14 配置升级不兼容

- 保留旧绑定和配置。
- 生成迁移预览。
- 自动迁移只处理无歧义字段。
- 有歧义时逐项确认。

## 18. 验收标准

### 18.1 定义与版本

- 可以创建 SkillDefinition 和草稿 SkillVersion。
- 发布版本不可原地修改。
- 指令、Schema、权限或依赖变化会创建新版本。
- 历史 Invocation 始终指向原版本。

### 18.2 边界

- Orchestrator 负责任务 DAG，Skill 不创建无限任务。
- Subagent 可以调用 Skill，但不能扩大其权限。
- Skill 不直接修改 Canon、正式正文、激活记忆或发布状态。
- 确定性业务 CRUD 不被强制包装成 Skill。

### 18.3 小说隔离

- 每个 NovelSkillBinding、Configuration、Grant、Invocation 和 Result 都带 `novelId`。
- Skill 调用无法读取其他小说数据。
- Composite 子调用不能覆盖父调用的小说作用域。
- 缓存和日志不会造成跨小说泄漏。

### 18.4 解析

- 显式 Skill、小说默认、任务指定和 Capability 解析具有确定优先级。
- 解析会检查版本、依赖、模型、上下文、权限、工具和预算。
- 不可用 Skill 不会被名称相似项静默替换。
- 解析结果提供可理解的选择与过滤理由。

### 18.5 执行

- 输入在运行前通过 Schema 校验。
- 每次调用固定版本、输入、配置、权限、模型和上下文。
- 输出在进入领域系统前通过 Schema 校验。
- 失败、部分成功、取消和重试有独立状态和记录。
- Composite 有深度、数量、预算和权限限制。

### 18.6 权限与安全

- 实际权限是多层授权交集。
- 网络、工具、脚本和 Secret 均默认最小权限。
- 外部资料不能提升为可信指令。
- 导入 Skill 在检查和授权前不能运行。
- 任意 Shell、动态依赖安装和宿主文件访问在 MVP 被禁止。

### 18.7 测试与质量

- 每个可发布 Skill 至少有一个应触发、一个不应触发和一个契约测试。
- 高风险 Skill 包含安全测试和人工审阅。
- 发布门禁验证 Schema、权限、依赖、Secret、评测和签名。
- 升级页面显示相对基线的质量、成本和权限变化。
- 主观写作质量按多维量表展示，不压缩成虚假单分。

### 18.8 集成

- Skill 可声明模型能力，由 Model Router 选择具体模型。
- Skill 可声明上下文模板，由 Context Engine 构建 ContextBundle。
- Skill 只能提交 MemoryWriteCandidate，由 Memory System 确认。
- Orchestrator 可以追踪每个 SkillInvocation 和 Artifact。
- 领域系统可以拒绝候选并返回原因。

### 18.9 UI

- 用户可以在 Skill Center 查看、安装、启用、停用和配置。
- 用户能看到 Skill 的适用与不适用场景。
- 高风险运行前可查看数据、模型、工具、成本和权限。
- 运行详情可查看步骤、来源、结果、用量和错误。
- 升级时突出权限扩大和不兼容变化。

## 19. 后续扩展与跨 Spec 边界

### 19.1 后续扩展

- 公共 Skill 市场。
- 团队共享和审批流。
- 付费 Skill 和授权计费。
- 签名作者与信誉体系。
- 多版本 A/B 测试。
- 自动生成脱敏评测集。
- 更细粒度的沙箱脚本运行。
- Skill 组合可视化编辑器。
- 社区评测基准。
- 本地离线 Skill。
- 企业自托管 Skill Registry。

### 19.2 与其他 Spec 的所有权

| Spec | 所有权边界 |
|---|---|
| `01-novel-project-spec.md` | 定义项目和小说级偏好；本 Spec 定义 Skill 绑定与执行 |
| `02-novel-cockpit-spec.md` | 展示 Skill 摘要和入口；本 Spec 定义 Skill Center |
| `03-inspiration-vault-spec.md` | 拥有灵感数据和转化规则；本 Spec 运行灵感 Skill |
| `04-arc-swimlane-diagram-spec.md` | 拥有结构节点和泳道图；本 Spec 运行结构 Skill |
| `05-clue-foreshadowing-spec.md` | 拥有线索事实与生命周期；本 Spec 运行线索 Skill |
| `06-character-system-spec.md` | 拥有人物和关系事实；本 Spec 运行人物 Skill |
| `07-worldbuilding-system-spec.md` | 拥有世界观事实；本 Spec 运行设定 Skill |
| `08-chapter-writing-spec.md` | 拥有章节任务书、草稿和正文版本；本 Spec 运行写作 Skill |
| `09-chapter-review-spec.md` | 拥有 ReviewRun、Finding 和修改闭环；本 Spec 运行审查 Skill |
| `10-agent-orchestration-spec.md` | 拥有任务 DAG、Subagent 和重试策略；本 Spec 拥有 Skill 解析与 Invocation |
| `11-model-router-spec.md` | 拥有具体模型选择和调用策略；本 Spec 只声明模型能力要求 |
| `12-rag-context-engine-spec.md` | 拥有检索、重排和 ContextBundle；本 Spec 只声明 ContextRequest 模板 |
| `13-long-term-memory-spec.md` | 拥有记忆生命周期和确认；本 Spec 只读取授权记忆并提交候选 |
| `15-publish-review-spec.md` | 拥有发布门禁和最终发布审查；本 Spec 提供版本化审查能力 |

### 19.3 最终原则

Skill System 必须始终遵守以下原则：

1. 能力可复用，但项目事实不进入通用 Skill 包。
2. 版本一旦发布即不可变。
3. 每次运行都固定 Skill、输入、权限、模型和上下文。
4. Skill 可以建议和产出候选，但不能夺走领域系统的事实所有权。
5. 自动调用建立在明确 Capability、兼容性和权限之上，不依赖名称猜测。
6. 写作能力必须可评测，但不能用单一分数伪装审美确定性。
7. 导入能力默认不可信，脚本、网络和 Secret 默认关闭。
8. 每本小说的绑定、配置、运行和结果完全隔离。
9. 所有结果可追溯、可比较、可撤销、可重新运行。
10. Skill 是工具箱，Agent 是使用工具的人，Orchestrator 是安排工作的系统。
