# 10 Agent Orchestration Spec

状态：Review Candidate

日期：2026-07-09

上游依赖：

- `01-novel-project-spec.md`：每本小说拥有独立 Agent 任务空间，所有任务必须绑定 `novelId`。
- `02-novel-cockpit-spec.md`：Cockpit 右侧面板展示任务、Subagent、Skill、模型和确认状态。
- `03-inspiration-vault-spec.md`：灵感可以转成 Agent 目标或任务输入。
- `04-arc-swimlane-diagram-spec.md`：篇章结构任务可以读取和产出泳道节点候选。
- `05-clue-foreshadowing-spec.md`：线索任务通过领域接口读取和提交线索候选。
- `06-character-system-spec.md`：人物任务通过领域接口读取和提交人物候选。
- `07-worldbuilding-system-spec.md`：世界观任务通过领域接口读取和提交设定候选。
- `08-chapter-writing-spec.md`：章节写作任务提供固定输入、版本化输出和状态卡。
- `09-chapter-review-spec.md`：审查任务提供多通道执行、修改任务和复审结果。

相关底座文档：`2026-07-08-novel-agent-product-foundation-design.md`

## 1. 功能定位

Agent Orchestration System 是将用户的复杂创作目标拆成可追踪任务图，并协调 Subagent、Skill、模型、上下文、记忆、人工确认和业务模块完成执行的控制中枢。

它不直接拥有人物、世界观、线索或正文事实，也不是一个无限循环的聊天 Agent。它负责：

1. 理解用户目标并限定小说、范围和成功标准。
2. 生成可审阅、可版本化的任务计划。
3. 建立任务依赖图并调度可执行节点。
4. 为任务分配合适的 Subagent、Skill、模型和上下文。
5. 控制并行、资源冲突、预算和权限。
6. 保存每次执行的输入、输出、模型、Skill、事件和错误。
7. 在高风险变更前请求用户确认。
8. 将结果以候选产物交给领域模块确认，不静默改写 Canon。
9. 支持暂停、取消、重试、续跑、重启、重规划和崩溃恢复。
10. 汇总结果并判断目标是否真正完成。

一句话定义：

> Agent Orchestration System 是小说创作 Agent 的持久化工作流引擎：Orchestrator 管目标和依赖，Subagent 承担持续职责，Skill 执行单项能力，模型提供推理与生成资源。

## 2. Agent、Subagent、Skill、模型边界

### 2.1 Agent Orchestrator

负责：

- 理解目标。
- 识别缺失信息。
- 拆分任务。
- 建立依赖。
- 提交计划供用户确认。
- 分配 Subagent。
- 请求模型路由。
- 选择或请求 Skill。
- 管理上下文与预算。
- 处理失败和恢复。
- 汇总产物。
- 请求高风险确认。
- 判断目标是否完成。

Orchestrator 不直接成为世界观事实源、人物事实源或正文存储层。

### 2.2 Subagent

Subagent 是具有稳定职责、领域提示、工具权限和输出契约的执行角色，适合承担一个或多个连续步骤。

例如：

- Story Architect 持续负责篇章结构。
- Clue Weaver 持续负责线索链。
- Chapter Writer 持续负责章节写作版本。
- Critic Sage 持续负责审查与复审。

Subagent 的“持续”表示职责和配置可以复用，不表示它拥有无限生命周期、可以绕过 Orchestrator 或自动获得所有小说数据。

### 2.3 Skill

Skill 是可复用的单项能力或标准操作流程，例如：

- 结构分析。
- 章节任务书生成。
- 人物一致性检查。
- 线索归因检查。
- 世界规则冲突检查。
- 选区改写。
- 快速复审。

Skill 不负责跨任务依赖、全局计划和结果汇总。

### 2.4 模型

模型是某次任务尝试使用的执行资源。模型负责推理、生成、抽取或工具调用，不拥有任务生命周期。

模型切换：

- 不改变任务目标。
- 不改变任务输入版本。
- 不改变事实优先级。
- 必须产生新的 `TaskAttempt`。

### 2.5 普通产品功能

拖动卡片、编辑字段、筛选列表、保存草稿等确定性页面操作不应包装成 Subagent 或 Skill。

### 2.6 判断规则

| 问题 | 应归属 |
|---|---|
| 需要理解目标、拆任务、排依赖、汇总结果吗 | Orchestrator |
| 需要一个稳定领域角色跨步骤负责吗 | Subagent |
| 是一次可复用且输入输出明确的能力吗 | Skill |
| 只是推理、生成或工具调用执行资源吗 | 模型 |
| 是确定性的页面编辑或数据库操作吗 | 普通功能 / 领域服务 |
| 会修改 Canon、重大剧情或发布状态吗 | 领域服务加人工确认 |

## 3. 用户角色

### 3.1 独立作者

用自然语言提交创作目标，审阅任务计划，观察执行进度并处理关键确认。

### 3.2 长篇项目作者

同时管理篇章、章节、线索、人物和审查任务，暂停或恢复长期工作流。

### 3.3 精细控制型作者

手动调整任务依赖、Subagent、Skill、模型、预算和执行顺序。

### 3.4 新手作者

使用推荐计划和默认角色，不必理解底层调度细节。

### 3.5 系统管理员 / 开发者

查看任务事件、失败原因、模型使用量、恢复记录和运行健康度。

## 4. 入口位置

### 4.1 常驻入口

Novel Cockpit 右侧常驻 Agent Orchestration 面板，显示：

- 当前目标。
- 正在运行的任务。
- 排队任务。
- 等待用户的确认。
- 运行中的 Subagent。
- 当前模型和 Skill。
- 失败 / 中断任务。
- 预算使用。

### 4.2 全屏入口

```text
Novel Cockpit
  → Agent Orchestration
  → 目标 / 任务图 / 队列 / 恢复中心 / 事件日志
```

### 4.3 业务模块入口

以下模块可以创建预填目标：

- 灵感库：“把这些灵感发展成篇章方案”。
- 泳道图：“完善第二篇章并检查线索链”。
- 人物系统：“补全主要人物弧光”。
- 世界观系统：“检查力量体系漏洞”。
- 章节写作：“写第 12 章并生成状态卡”。
- 章节审查：“修复本章全部阻断问题并复审”。
- 发布审核：“处理发布阻塞项”。

### 4.4 恢复入口

应用启动、项目打开或任务异常后，如果存在未完成运行，显示“未完成任务”入口：

- 查看中断原因。
- 从检查点继续。
- 从头重启任务。
- 刷新输入后重新运行。
- 重规划剩余任务。
- 放弃并归档。

系统不得把失败任务藏在普通历史记录里。

## 5. 核心用户目标

### 5.1 用一句话发起复杂任务

例如：

```text
完善第二篇章：补强女主弧光，埋下潮汐教团暗线，
检查前三章世界观冲突，并给出两版章节调整方案。
```

### 5.2 审阅任务拆分

看到系统将做什么、先后顺序、由谁执行、使用什么能力、预计花费和哪些步骤需要确认。

### 5.3 控制自动化程度

选择只生成建议、自动运行低风险任务、每步确认或按检查点确认。

### 5.4 观察执行进度

通过任务图和队列知道正在做什么、为什么等待、产生了哪些结果。

### 5.5 处理关键决策

对 Canon 写入、重大剧情、人物死亡、线索谜底、章节正文应用和发布动作进行明确确认。

### 5.6 恢复未完成任务

在程序关闭、模型失败、网络中断或用户暂停后，从安全位置继续，而不是重新做完所有步骤。

### 5.7 更换执行资源

为单个任务更换 Subagent、Skill 或模型，不必推倒整个计划。

### 5.8 获得可审计结果

知道每个结果来自哪些输入、模型、Skill、Subagent 和任务尝试。

## 6. MVP 范围

### 6.1 必须包含

- 小说内目标创建。
- 自然语言目标解析。
- 计划草案。
- 计划版本和用户确认。
- 有向无环任务图。
- 任务依赖和条件。
- 任务优先级。
- 动态子任务建议。
- 默认 Subagent 档案。
- Subagent 分配与运行。
- Skill 选择和调用记录。
- 模型路由请求和手动覆盖。
- Context Engine 请求。
- 任务队列和有限并行。
- 资源声明与写冲突控制。
- 预算策略。
- 权限和确认策略。
- 类型化任务产物。
- 产物版本与来源追踪。
- 结果汇总。
- 任务事件日志。
- 暂停、取消和跳过。
- 重试、续跑、重启和重运行。
- 检查点。
- 未完成任务恢复中心。
- 失败降级。
- 上游变更后的下游失效。
- 目标完成判定。

### 6.2 MVP 可以简化

- 任务图只支持 DAG，不支持任意循环。
- 动态新增任务必须形成新计划版本或明确的子任务补丁。
- Subagent 使用预置角色加项目配置，不提供任意代码执行。
- 并发数使用项目 / 提供商上限，不做复杂集群调度。
- 检查点以任务阶段和产物引用为主，不保证所有模型流式状态都可续写。
- 预算以使用量估算和软 / 硬上限为主。
- 任务缓存只复用输入完全一致的只读结果。
- 单用户优先，不实现多人任务审批。

## 7. 非 MVP 范围

- 自主无限循环的 Agent。
- 无人监督发布正文。
- 任意远程代码执行。
- 自定义容器和分布式计算集群。
- 多人实时任务协作。
- 跨小说自动共享可变任务状态。
- Agent 自主修改自身系统提示或权限。
- 自动训练 / 微调模型。
- 复杂 BPMN 全功能流程设计器。
- 循环、递归和无界动态任务图。
- 无预算上限的后台运行。
- 在领域模块之外直接写数据库事实。
- 保证任意模型调用都能从 Token 中间状态精确续跑。

## 8. 核心架构与流程

### 8.1 控制平面

```text
Goal Interpreter
  → Planner
  → Plan Validator
  → Scheduler
  → Runtime
  → Result Aggregator
  → Completion Evaluator
```

横向支撑：

```text
Policy & Approval
Budget Controller
Context Broker
Artifact Registry
Checkpoint Store
Event Log
Recovery Manager
```

### 8.2 创建目标

```text
用户输入目标
  → 系统绑定 novelId
  → 提取范围、约束、成功标准和风险
  → 创建 OrchestrationGoal
  → 缺失关键信息时请求用户补充
  → 进入计划阶段
```

目标必须包含：

- 作用小说。
- 目标描述。
- 成功标准。
- 可修改范围。
- 禁止修改范围。
- 自动化等级。
- 预算偏好。

### 8.3 生成计划

```text
Planner 读取目标和相关项目状态
  → 拆分 AgentTask
  → 建立 TaskDependency
  → 识别可并行节点
  → 分配候选 Subagent / Skill / 模型能力
  → 标记确认点
  → 估算成本和风险
  → 生成 PlanVersion 草案
```

计划验证至少检查：

- 是否存在循环依赖。
- 是否所有任务都有输入和预期输出。
- 是否引用其他小说数据。
- 是否存在未声明的 Canon 写入。
- 是否存在冲突写资源。
- 是否缺少人工确认。
- 是否超预算。
- 成功标准是否可验证。

### 8.4 用户确认计划

用户可以：

- 接受整个计划。
- 调整任务顺序。
- 删除任务。
- 增加约束。
- 更换 Subagent。
- 更换模型策略。
- 调整预算。
- 改为逐步确认。
- 退回重新规划。

计划批准后成为不可变 `approved PlanVersion`。后续变更创建新版本。

### 8.5 调度任务

Scheduler 只把满足以下条件的任务放入队列：

- 所有强依赖已完成。
- 条件依赖已满足。
- 输入产物版本有效。
- 未超过并发上限。
- 资源声明不冲突。
- 预算可用。
- 权限已满足。
- 不在暂停或取消状态。

### 8.6 执行任务

```text
AgentTask 进入 queued
  → 创建 TaskAttempt
  → 分配 SubagentRun
  → Model Router 选择模型
  → Skill System 解析 Skill 版本
  → Context Engine 生成上下文包
  → 执行
  → 产出候选 Artifact
  → 校验输出契约
  → 保存检查点和结果
  → Task 进入 completed / waitingApproval / failed
```

### 8.7 动态拆分子任务

Subagent 执行时发现新工作，只能提交 `TaskExpansionProposal`：

```text
发现缺失前置或新问题
  → 提交子任务建议
  → Orchestrator 检查范围、预算和依赖
  → 低风险且计划允许时创建派生 PlanVersion
  → 其他情况等待用户确认
```

Subagent 不得绕过 Orchestrator 直接创建无限子任务。
自动接受的低风险扩展也必须保留 `TaskExpansionProposal`，并生成新的不可变计划版本，不能原地修改已批准任务图。
派生计划可以复用输入和定义完全未变化的 `taskVersionId`；只有新增或发生变化的任务才创建新版本。Scheduler 切换到派生计划前必须完成 DAG 校验。

### 8.8 人工确认

高风险任务完成后：

```text
保存候选产物
  → 创建 ApprovalRequest
  → Task 进入 waitingApproval
  → 用户查看差异、影响和来源
  → 接受 / 拒绝 / 要求修改
  → 领域服务执行正式提交
```

拒绝候选不会删除执行历史。

### 8.9 结果汇总

Result Aggregator：

- 检查所有必需任务是否完成。
- 收集类型化产物。
- 合并不冲突的分析结论。
- 保留互相矛盾的方案。
- 标记未解决问题。
- 生成目标级摘要。
- 对照成功标准。

汇总器不得把多个互斥结论偷偷合成一个新 Canon。

### 8.10 完成判定

目标只有同时满足以下条件才可进入 `completed`：

- 所有必需任务处于成功终态。
- 所有必需确认已处理。
- 必需产物通过 Schema 校验。
- 成功标准逐项可验证。
- 没有未解决阻断错误。
- 结果汇总已生成。

部分任务完成时只能进入 `partiallyCompleted`，不能为了结束流程标记完成。

## 9. 核心数据对象与字段

本节“必填”表示字段必须存在；数组可以为空，除非校验规则另有要求。

### 9.1 OrchestrationGoal

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `goalId` | string | 是 | 目标 ID |
| `novelId` | string | 是 | 所属小说 |
| `title` | string | 是 | 目标标题 |
| `description` | string | 是 | 用户目标 |
| `scopeRefs` | object[] | 是 | 篇章、章节、人物等范围 |
| `successCriteria` | string[] | 是 | 可验证成功标准 |
| `allowedChanges` | string[] | 是 | 允许修改 |
| `forbiddenChanges` | string[] | 是 | 禁止修改 |
| `automationLevel` | enum | 是 | `suggestOnly`、`confirmEachWrite`、`checkpointApproval`、`lowRiskAuto` |
| `budgetPolicyId` | string | 是 | 预算策略 |
| `executionPolicyId` | string | 是 | 执行策略 |
| `activePlanVersionId` | string | 否 | 当前计划 |
| `status` | enum | 是 | 目标状态 |
| `createdBy` | enum | 是 | `user`、`workflow` |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.2 GoalStatus

| 值 | 说明 |
|---|---|
| `draft` | 目标输入中 |
| `planning` | 正在生成计划 |
| `waitingPlanApproval` | 等待计划确认 |
| `ready` | 计划已批准 |
| `running` | 正在执行 |
| `paused` | 用户或系统暂停 |
| `waitingForUser` | 等待用户输入 |
| `partiallyCompleted` | 只有部分结果 |
| `completed` | 成功标准全部满足 |
| `failed` | 无法继续 |
| `cancelled` | 用户取消 |
| `archived` | 已归档 |

### 9.3 PlanVersion

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `planVersionId` | string | 是 | 不可变计划版本 ID |
| `goalId` | string | 是 | 所属目标 |
| `novelId` | string | 是 | 所属小说 |
| `version` | number | 是 | 版本号 |
| `parentPlanVersionId` | string | 否 | 上一版本 |
| `taskGraphId` | string | 是 | 任务图 |
| `summary` | string | 是 | 计划摘要 |
| `assumptions` | string[] | 是 | 明示假设 |
| `riskSummary` | object[] | 是 | 风险 |
| `estimatedUsage` | object | 是 | 预计用量 |
| `approvalCheckpointIds` | string[] | 是 | 确认点 |
| `status` | enum | 是 | `draft`、`proposed`、`approved`、`active`、`rejected`、`superseded` |
| `createdBy` | enum | 是 | `planner`、`user` |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.4 TaskGraph

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `taskGraphId` | string | 是 | 图 ID |
| `novelId` | string | 是 | 所属小说 |
| `planVersionId` | string | 是 | 所属计划 |
| `taskIds` | string[] | 是 | 节点 |
| `dependencyIds` | string[] | 是 | 边 |
| `rootTaskIds` | string[] | 是 | 根任务 |
| `terminalTaskIds` | string[] | 是 | 汇总前终点 |
| `graphHash` | string | 是 | 图校验值 |
| `validated` | boolean | 是 | 是否通过 DAG 校验 |
| `validationErrors` | object[] | 是 | 错误 |

### 9.5 AgentTask

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `taskId` | string | 是 | 稳定任务 ID |
| `taskVersionId` | string | 是 | 不可变任务版本 ID |
| `novelId` | string | 是 | 所属小说 |
| `goalId` | string | 是 | 所属目标 |
| `planVersionId` | string | 是 | 所属计划 |
| `parentTaskId` | string | 否 | 父任务 |
| `taskType` | enum | 是 | 任务类型 |
| `title` | string | 是 | 标题 |
| `description` | string | 是 | 执行说明 |
| `inputArtifactRefs` | `ArtifactRef[]` | 是 | 固定输入 |
| `expectedOutputContracts` | object[] | 是 | 输出契约 |
| `successCriteria` | string[] | 是 | 完成条件 |
| `assignedSubagentProfileId` | string | 否 | 分配角色 |
| `requiredSkillRefs` | object[] | 是 | Skill 与版本约束 |
| `modelRequirement` | object | 是 | 模型能力要求 |
| `modelOverrideId` | string | 否 | 用户指定模型 |
| `contextRequestRef` | string | 否 | 上下文请求 |
| `resourceClaims` | object[] | 是 | 读写资源声明 |
| `riskLevel` | enum | 是 | `low`、`medium`、`high`、`critical` |
| `approvalPolicy` | enum | 是 | `none`、`beforeRun`、`beforeCommit`、`afterRun` |
| `priority` | number | 是 | 队列优先级 |
| `maxAttempts` | number | 是 | 最大尝试次数 |
| `timeoutSeconds` | number | 否 | 单次超时 |
| `idempotencyKey` | string | 是 | 幂等键 |
| `status` | enum | 是 | 任务状态 |
| `activeAttemptId` | string | 否 | 当前尝试 |
| `outputArtifactRefs` | `ArtifactRef[]` | 是 | 输出 |
| `staleReason` | string | 否 | 失效原因 |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.6 AgentTaskType

| 值 | 说明 |
|---|---|
| `plan` | 生成或细化计划 |
| `retrieve` | 检索上下文 |
| `analyze` | 分析结构、关系或问题 |
| `generate` | 生成候选内容 |
| `transform` | 改写、转换或压缩 |
| `review` | 审查 |
| `revise` | 根据问题修改 |
| `validate` | 确定性验证 |
| `synchronize` | 生成同步候选 |
| `aggregate` | 汇总结果 |
| `approval` | 等待人工确认 |
| `commit` | 由领域服务提交已批准变更 |

### 9.7 TaskStatus

| 值 | 说明 |
|---|---|
| `draft` | 任务定义中 |
| `blocked` | 依赖或上游问题未解决 |
| `ready` | 可进入队列 |
| `queued` | 等待执行 |
| `running` | 正在执行 |
| `waitingForUser` | 等待用户输入 |
| `waitingApproval` | 等待确认 |
| `paused` | 已暂停 |
| `completed` | 成功并通过输出校验 |
| `failed` | 尝试耗尽或不可恢复 |
| `cancelled` | 已取消 |
| `skipped` | 条件不满足或用户跳过 |
| `stale` | 上游输入已变化 |
| `orphaned` | 运行租约丢失，等待恢复判断 |
| `superseded` | 被新任务版本替代 |

成功终态是 `completed`。`skipped` 只有在计划明确允许时才能满足依赖。

### 9.8 TaskDependency

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `dependencyId` | string | 是 | 依赖 ID |
| `novelId` | string | 是 | 所属小说 |
| `fromTaskVersionId` | string | 是 | 上游 |
| `toTaskVersionId` | string | 是 | 下游 |
| `type` | enum | 是 | `hard`、`soft`、`conditional`、`artifact`、`approval` |
| `condition` | object | 否 | 条件表达式 |
| `requiredArtifactTypes` | string[] | 是 | 必需产物类型 |
| `onFailure` | enum | 是 | `block`、`skipDownstream`、`continueWithWarning`、`requestUser` |

### 9.9 TaskAttempt

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `attemptId` | string | 是 | 尝试 ID |
| `novelId` | string | 是 | 所属小说 |
| `taskVersionId` | string | 是 | 任务版本 |
| `attemptNumber` | number | 是 | 尝试序号 |
| `trigger` | enum | 是 | `initial`、`retry`、`resume`、`restart`、`fallback` |
| `baseAttemptId` | string | 否 | 来源尝试 |
| `checkpointId` | string | 否 | 续跑检查点 |
| `modelDecisionId` | string | 是 | 模型路由决定 |
| `subagentRunId` | string | 否 | 执行角色运行 |
| `skillInvocationIds` | string[] | 是 | Skill 调用 |
| `contextBundleRefs` | object[] | 是 | 实际上下文 |
| `inputSnapshotHash` | string | 是 | 输入快照 |
| `status` | enum | 是 | 尝试状态 |
| `leaseExpiresAt` | ISO datetime | 否 | 执行租约 |
| `heartbeatAt` | ISO datetime | 否 | 心跳 |
| `partialArtifactRefs` | `ArtifactRef[]` | 是 | 部分产物 |
| `resultArtifactRefs` | `ArtifactRef[]` | 是 | 最终产物 |
| `usage` | object | 否 | 用量 |
| `error` | object | 否 | 错误 |
| `startedAt` | ISO datetime | 否 | 开始时间 |
| `endedAt` | ISO datetime | 否 | 结束时间 |

### 9.10 AttemptStatus

| 值 | 说明 |
|---|---|
| `queued` | 等待执行 |
| `running` | 执行中 |
| `checkpointing` | 正在保存检查点 |
| `paused` | 可续跑暂停 |
| `interrupted` | 意外中断 |
| `completed` | 产物生成完成 |
| `failed` | 执行失败 |
| `cancelled` | 用户取消 |
| `superseded` | 已由新尝试替代 |

### 9.11 SubagentProfile

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `subagentProfileId` | string | 是 | 档案 ID |
| `novelId` | string | 否 | 空表示系统模板；项目使用时克隆或覆盖 |
| `name` | string | 是 | 角色名 |
| `roleType` | enum | 是 | 角色类型 |
| `responsibilities` | string[] | 是 | 职责 |
| `allowedTaskTypes` | string[] | 是 | 可执行任务 |
| `allowedDomainReads` | string[] | 是 | 可读领域 |
| `allowedDomainWrites` | string[] | 是 | 可提交候选的领域 |
| `toolPermissions` | string[] | 是 | 工具权限 |
| `defaultSkillRefs` | object[] | 是 | 默认 Skill |
| `modelRequirements` | object | 是 | 默认模型能力 |
| `outputContracts` | object[] | 是 | 输出契约 |
| `behaviorRules` | string[] | 是 | 行为约束 |
| `version` | number | 是 | 版本 |
| `status` | enum | 是 | `active`、`disabled`、`archived` |

### 9.12 默认 SubagentProfile

| Profile | 职责 |
|---|---|
| `StoryArchitect` | 大纲、篇章结构、节奏和故事骨架 |
| `ClueWeaver` | 线索、伏笔、暗线、误导和回收 |
| `LoreKeeper` | 世界观、设定和规则一致性 |
| `CharacterEditor` | 人物档案、弧光、关系和动机 |
| `ChapterWriter` | 章节任务书、正文候选、续写和改写 |
| `CriticSage` | 章节审查、问题证据和复审 |
| `PublishAuditor` | 发布前格式、风险和清单 |
| `ContinuityInspector` | 跨章状态、术语、时间线和影响分析 |

默认角色是可配置档案，不是硬编码模型。

### 9.13 SubagentRun

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `subagentRunId` | string | 是 | 运行 ID |
| `novelId` | string | 是 | 所属小说 |
| `subagentProfileId` | string | 是 | 使用档案 |
| `profileVersion` | number | 是 | 档案版本 |
| `taskVersionId` | string | 是 | 目标任务 |
| `attemptId` | string | 是 | 所属尝试 |
| `sessionContextRef` | string | 是 | 隔离上下文 |
| `status` | enum | 是 | `starting`、`running`、`waitingTool`、`waitingUser`、`completed`、`failed`、`cancelled` |
| `proposalIds` | string[] | 是 | 动态任务或变更建议 |
| `startedAt` | ISO datetime | 否 | 开始时间 |
| `endedAt` | ISO datetime | 否 | 结束时间 |

### 9.14 ArtifactRef

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `artifactId` | string | 是 | 产物 ID |
| `artifactVersionId` | string | 是 | 不可变版本 ID |
| `novelId` | string | 是 | 所属小说 |
| `artifactType` | string | 是 | 产物类型 |
| `domain` | enum | 是 | `orchestration`、`outline`、`character`、`clue`、`world`、`chapter`、`review`、`publish` |
| `sourceTaskVersionId` | string | 是 | 来源任务 |
| `sourceAttemptId` | string | 是 | 来源尝试 |
| `schemaVersion` | string | 是 | Schema 版本 |
| `contentRef` | string | 是 | 内容引用 |
| `contentHash` | string | 是 | 内容校验 |
| `status` | enum | 是 | `partial`、`candidate`、`validated`、`approved`、`committed`、`rejected`、`superseded` |
| `provenanceRefs` | object[] | 是 | 输入、模型、Skill 和上下文来源 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.15 TaskCheckpoint

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `checkpointId` | string | 是 | 检查点 ID |
| `novelId` | string | 是 | 所属小说 |
| `taskVersionId` | string | 是 | 任务版本 |
| `attemptId` | string | 是 | 尝试 |
| `stage` | string | 是 | 阶段名 |
| `resumeStrategy` | enum | 是 | `resumeFromCheckpoint`、`reuseArtifactsInNewAttempt`、`restartTask` |
| `stateRef` | string | 否 | 可序列化运行状态 |
| `completedArtifactRefs` | `ArtifactRef[]` | 是 | 已完成产物 |
| `pendingSteps` | string[] | 是 | 剩余步骤 |
| `inputSnapshotHash` | string | 是 | 输入快照 |
| `safeToResume` | boolean | 是 | 是否可安全续跑 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.16 ApprovalRequest

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `approvalRequestId` | string | 是 | 确认 ID |
| `novelId` | string | 是 | 所属小说 |
| `goalId` | string | 是 | 所属目标 |
| `taskVersionId` | string | 是 | 关联任务 |
| `type` | enum | 是 | `plan`、`cost`、`canonWrite`、`majorPlot`、`chapterApply`、`memoryWrite`、`publish`、`scopeExpansion` |
| `riskLevel` | enum | 是 | 风险 |
| `summary` | string | 是 | 确认摘要 |
| `artifactRefs` | `ArtifactRef[]` | 是 | 待确认产物 |
| `diffRefs` | object[] | 是 | 变化差异 |
| `impactRefs` | object[] | 是 | 影响范围 |
| `options` | object[] | 是 | 可选动作 |
| `status` | enum | 是 | `pending`、`approved`、`rejected`、`changesRequested`、`expired`、`cancelled` |
| `decidedBy` | string | 否 | 决策者 |
| `decisionReason` | string | 否 | 原因 |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `decidedAt` | ISO datetime | 否 | 决策时间 |

### 9.17 BudgetPolicy

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `budgetPolicyId` | string | 是 | 策略 ID |
| `novelId` | string | 是 | 所属小说 |
| `mode` | enum | 是 | `economy`、`balanced`、`quality`、`custom` |
| `softTokenLimit` | number | 否 | 软 Token 上限 |
| `hardTokenLimit` | number | 否 | 硬 Token 上限 |
| `softCostLimit` | number | 否 | 软成本上限 |
| `hardCostLimit` | number | 否 | 硬成本上限 |
| `maxParallelTasks` | number | 是 | 最大并发 |
| `requireApprovalAtPercent` | number | 是 | 达到比例时确认 |
| `allowFallbackModels` | boolean | 是 | 是否允许降级 |
| `stopOnHardLimit` | boolean | 是 | 硬上限是否停止 |

### 9.18 ExecutionPolicy

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `executionPolicyId` | string | 是 | 策略 ID |
| `novelId` | string | 是 | 所属小说 |
| `maxParallelTasks` | number | 是 | 并发数 |
| `autoRetryCount` | number | 是 | 低风险自动重试次数 |
| `retryableErrorCodes` | string[] | 是 | 可重试错误 |
| `autoResumeAfterCrash` | boolean | 是 | 是否允许自动恢复低风险只读任务 |
| `autoFallbackModel` | boolean | 是 | 是否自动降级 |
| `requirePlanApproval` | boolean | 是 | 是否确认计划 |
| `requireCanonApproval` | boolean | 是 | Canon 写入确认 |
| `requireChapterApplyApproval` | boolean | 是 | 正文应用确认 |
| `requirePublishApproval` | boolean | 是 | 发布确认 |
| `stalePropagation` | enum | 是 | `markOnly`、`pauseDownstream`、`autoReplanSuggestion` |

### 9.19 TaskExpansionProposal

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `proposalId` | string | 是 | 建议 ID |
| `novelId` | string | 是 | 所属小说 |
| `sourceTaskVersionId` | string | 是 | 来源任务 |
| `reason` | string | 是 | 新增原因 |
| `proposedTasks` | object[] | 是 | 候选任务 |
| `proposedDependencies` | object[] | 是 | 候选依赖 |
| `scopeImpact` | object[] | 是 | 范围影响 |
| `budgetImpact` | object | 是 | 预算影响 |
| `riskLevel` | enum | 是 | 风险 |
| `status` | enum | 是 | `draft`、`autoAccepted`、`waitingApproval`、`approved`、`rejected` |

### 9.20 OrchestrationEvent

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `eventId` | string | 是 | 事件 ID |
| `novelId` | string | 是 | 所属小说 |
| `goalId` | string | 是 | 目标 |
| `taskVersionId` | string | 否 | 任务 |
| `attemptId` | string | 否 | 尝试 |
| `eventType` | string | 是 | 事件类型 |
| `actorType` | enum | 是 | `user`、`orchestrator`、`subagent`、`system`、`domainService` |
| `actorId` | string | 否 | 执行者 |
| `payload` | object | 是 | 事件数据 |
| `correlationId` | string | 是 | 关联链 |
| `createdAt` | ISO datetime | 是 | 时间 |

事件日志只追加，不原地覆盖。

### 9.21 RecoveryRecord

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `recoveryRecordId` | string | 是 | 恢复记录 ID |
| `novelId` | string | 是 | 所属小说 |
| `taskVersionId` | string | 是 | 任务 |
| `interruptedAttemptId` | string | 是 | 中断尝试 |
| `detectedReason` | enum | 是 | `appClosed`、`leaseExpired`、`networkLost`、`providerFailure`、`processCrash`、`manualPause`、`unknown` |
| `latestCheckpointId` | string | 否 | 最新检查点 |
| `availableActions` | string[] | 是 | 可选恢复动作 |
| `recommendedAction` | string | 是 | 推荐动作 |
| `inputStillValid` | boolean | 是 | 输入是否仍有效 |
| `riskSummary` | object[] | 是 | 重复写入等风险 |
| `decision` | enum | 否 | `resume`、`retry`、`restart`、`rerunWithFreshInput`、`replan`、`abandon` |
| `status` | enum | 是 | `open`、`decided`、`recovering`、`resolved`、`failed` |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `resolvedAt` | ISO datetime | 否 | 解决时间 |

## 10. 任务状态与调度规则

### 10.1 目标状态机

```text
draft → planning → waitingPlanApproval → ready → running → completed
                     │                    │        │
                     └→ planning          │        ├→ waitingForUser
                                          │        ├→ paused → running
                                          │        ├→ partiallyCompleted
                                          │        └→ failed
                                          └────────→ cancelled
```

### 10.2 任务状态机

```text
draft → blocked → ready → queued → running → completed
           ↑                 │        │
           │                 │        ├→ waitingForUser → ready
           │                 │        ├→ waitingApproval → completed / ready
           │                 │        ├→ paused → queued
           │                 │        ├→ failed → ready（重试或重启）
           │                 │        └→ orphaned → paused / failed
           └──── stale ← 上游输入变化
```

任意非终态任务可以进入 `cancelled`；计划替换后可以进入 `superseded`。

`waitingApproval` 的处理规则：

- 批准：由领域服务执行必要提交，成功后进入 `completed`。
- 拒绝：候选产物进入 `rejected`，任务进入 `cancelled` 或按计划失败策略处理。
- 要求修改：任务回到 `ready`，后续执行创建新 Attempt。

### 10.3 DAG 规则

- `hard` 依赖未完成时，下游不能执行。
- `soft` 依赖失败时可以带警告继续。
- `conditional` 依赖必须有可解释条件。
- `artifact` 依赖必须校验产物类型和版本。
- `approval` 依赖必须有已批准 ApprovalRequest。
- 任务图不得形成环。
- 图变更必须形成新 PlanVersion；批准的 TaskExpansionProposal 是新版本的来源依据。

### 10.4 并行规则

可以并行：

- 只读分析不同领域。
- 对相同固定正文版本执行独立审查。
- 生成互不覆盖的候选方案。

不能直接并行提交：

- 同一人物 Canon 的两个修改。
- 同一章节工作稿的两个应用任务。
- 同一线索链状态的冲突更新。
- 同一世界规则的不同修订。

存在写资源重叠时，Scheduler 必须串行化或让用户选择。

### 10.5 资源声明

每个任务通过 `resourceClaims` 声明：

```text
resourceType
resourceId
accessMode: read / propose / commit
scope
expectedVersion
```

`propose` 只产生候选，不锁定领域对象；`commit` 必须进行版本检查和权限确认。

### 10.6 上游变化与失效传播

当输入 Artifact 或 Canon 版本变化：

1. 直接下游任务标记 `stale`。
2. 尚未运行的任务暂停排队。
3. 已完成结果保留但标记过期。
4. 系统计算影响范围。
5. 用户可选择保持旧输入、刷新输入后重运行或重规划。

不得静默把新输入注入已完成尝试。

## 11. 重试、续跑、重启与恢复

### 11.1 四个概念必须区分

| 动作 | 含义 | 输入 |
|---|---|---|
| `retry` | 同一任务从头再尝试，通常处理临时失败 | 保持同一输入快照 |
| `resume` | 从安全检查点创建连续尝试，只执行剩余步骤 | 保持同一输入快照和检查点 |
| `restart` | 放弃中断尝试，为同一任务创建新尝试 | 默认保持输入，可选择刷新 |
| `rerun` | 在输入、模型、Skill 或约束变化后重新执行 | 创建新任务版本或明确新输入快照 |

`retry`、`resume` 和 `restart` 都创建新的 `TaskAttempt` 并通过 `baseAttemptId` 连接旧尝试；`rerun` 通常先创建新任务版本，再创建初始 Attempt。所有旧 Attempt 都必须保留。

### 11.2 自动重试

只允许：

- 网络瞬断。
- 提供商限流。
- 可识别的临时服务错误。
- 输出 Schema 首次校验失败。

不允许自动重试：

- 用户拒绝。
- 权限不足。
- Canon 冲突。
- 预算硬上限。
- 任务定义错误。
- 重复提交风险。

### 11.3 检查点策略

至少在以下位置保存检查点：

- 上下文包冻结后。
- 每个独立 Skill 完成后。
- 产生可复用中间产物后。
- 等待用户确认前。
- 领域提交前。
- 长任务阶段切换时。

模型流式生成中断时，可以保存完整段落或完整结构块；不承诺从任意 Token 精确恢复。

### 11.4 未完成任务检测

系统在以下时机扫描：

- 应用启动。
- 用户进入小说项目。
- 执行租约过期。
- 提供商恢复。
- 用户打开恢复中心。

检测对象：

- `running` 但心跳超时的 Attempt。
- `paused` 任务。
- `orphaned` 任务。
- `partiallyCompleted` 目标。
- 等待确认但产物仍有效的任务。

### 11.5 恢复判断

Recovery Manager 检查：

- 最新检查点是否完整。
- 输入 Artifact 是否变化。
- 模型和 Skill 是否仍可用。
- 已完成步骤是否幂等。
- 是否存在部分领域写入。
- 预算是否仍可用。
- 用户权限是否仍有效。

### 11.6 自动恢复边界

可以按策略自动恢复：

- 只读检索。
- 确定性验证。
- 不产生外部副作用的低风险分析。

必须用户确认恢复：

- 章节正文生成。
- Canon 候选提交。
- 高成本调用。
- 领域 commit。
- 发布操作。
- 输入已变化的任务。
- 不确定是否重复写入的任务。

### 11.7 防止重复写入

- 每个提交动作使用 `idempotencyKey`。
- 候选 Artifact 使用内容 Hash 去重。
- 领域 commit 使用预期版本和提交令牌。
- 恢复前查询提交是否已完成。
- 无法确认时进入 `waitingForUser`，不重复执行。

### 11.8 恢复中心

每条未完成任务显示：

- 任务和目标。
- 中断时间。
- 中断原因。
- 已完成进度。
- 最新检查点。
- 已生成产物。
- 输入是否变化。
- 推荐动作。
- 续跑 / 重试 / 重启 / 刷新重运行 / 重规划 / 放弃。

## 12. 人工确认与权限

### 12.1 风险级别

| 风险 | 示例 | 默认策略 |
|---|---|---|
| `low` | 只读检索、摘要、格式验证 | 可自动运行 |
| `medium` | 生成候选人物、线索、世界观、章节方案 | 运行后确认 |
| `high` | 应用正文修改、改变线索回收、修改人物状态 | 提交前确认 |
| `critical` | 核心 Canon、人物死亡、谜底、结局、发布 | 执行和提交均确认 |

### 12.2 必须确认

- 计划批准。
- 目标范围扩大。
- 高成本预算。
- Core Canon 写入。
- 正式人物、线索和世界观事实变化。
- 重大剧情结果。
- 正文候选应用。
- 长期记忆写入。
- 已发布内容修改。
- 外部发布。

### 12.3 确认内容

ApprovalRequest 必须展示：

```text
准备做什么
为什么需要
当前值
候选值
差异
影响范围
来源任务、模型与 Skill
成本
可撤销性
拒绝后的后果
```

### 12.4 权限传播

- Orchestrator 不能给 Subagent 超出任务的权限。
- Subagent 不能给 Skill 新增权限。
- Skill 只能在 Invocation 授权范围内运行。
- 模型输出不是权限。
- 用户对一个任务的批准不自动批准其他任务。

## 13. Subagent 与 Skill 编排

### 13.1 Subagent 分配规则

根据以下条件匹配：

- 任务类型。
- 领域。
- 输出契约。
- 所需工具。
- 风险级别。
- 任务持续步骤数。
- 项目偏好。

### 13.2 一个任务何时使用 Subagent

推荐使用：

- 需要跨多个步骤维护领域上下文。
- 需要调用多个 Skill。
- 需要产出组合结果。
- 需要在中途根据结果提出子任务。

不推荐使用：

- 单次格式检查。
- 单条数据库读取。
- 简单字段转换。
- 已有领域服务能确定性完成的动作。

### 13.3 Skill 调用契约

每次 SkillInvocation 必须记录：

- Skill ID 和版本。
- 输入 Artifact。
- 参数。
- 权限范围。
- 输出 Schema。
- 模型要求。
- 执行结果。
- 使用量。
- 错误。

### 13.4 Subagent 输出

Subagent 只能输出以下一种或多种：

- 类型化 Artifact。
- TaskExpansionProposal。
- ApprovalRequest 建议。
- 阻塞原因。
- 结果摘要。

自然语言聊天回复不能作为唯一任务产物。

### 13.5 角色协作示例

```text
目标：完善第二篇章

StoryArchitect
  → 生成结构缺口报告

CharacterEditor ─┐
ClueWeaver       ├→ 并行生成候选调整
LoreKeeper       ┘

StoryArchitect
  → 汇总两版篇章方案

CriticSage
  → 独立审查两版方案

用户
  → 选择并确认
```

## 14. 模型、上下文与长期记忆

### 14.1 模型路由

Orchestrator 只提交 `modelRequirement`，具体模型由 `11-model-router-spec.md` 选择。

要求至少包含：

- 任务类型。
- 推理深度。
- 上下文长度。
- 结构化输出要求。
- 工具调用要求。
- 文风要求。
- 延迟偏好。
- 成本上限。

### 14.2 模型覆盖

- 用户可以覆盖单个任务模型。
- 覆盖不影响其他任务。
- 已运行任务切换模型必须创建新 Attempt。
- 降级模型必须重新检查能力约束。

### 14.3 Context Engine

Orchestrator 向 `12-rag-context-engine-spec.md` 提交 ContextRequest，而不是自行拼接所有小说资料。

ContextRequest 至少包含：

- `novelId`
- 任务目标
- 范围对象
- 必需 Artifact
- Canon 权威要求
- Token 预算
- 剧透策略
- 允许的数据域

### 14.4 上下文隔离

- 每个 TaskAttempt 使用冻结 ContextBundle。
- Subagent 只能读取任务授权的数据域。
- 不同小说的 ContextBundle 不可混用。
- 动态检索的新资料必须进入新的 Bundle 或补丁记录。

### 14.5 长期记忆读取

可以读取：

- Workflow Memory。
- Project Memory。
- 当前任务相关的领域记忆。
- 已确认用户偏好。
- 历史任务教训。

### 14.6 长期记忆写入

Orchestrator 不直接写入业务记忆，只能创建 MemoryWriteCandidate，包括：

- 稳定工作流偏好。
- 常用模型 / Skill 偏好。
- 用户确认的任务恢复偏好。
- 反复出现的流程问题。

任何人物、线索、世界观、正文和审查事实必须经对应领域模块确认。

## 15. 可视化与交互要求

### 15.1 常驻编排面板

显示：

- 当前目标。
- 总进度。
- 当前任务。
- 排队任务。
- 等待确认。
- Subagent 状态。
- 模型和 Skill。
- 预算。
- 失败 / 中断提醒。

### 15.2 任务图视图

节点表示 AgentTask，边表示 TaskDependency。

节点必须显示：

- 任务名称。
- 类型。
- 状态。
- Subagent。
- 模型。
- Skill。
- 风险。
- 预计 / 实际使用量。
- 输出产物。

边必须显示：

- 依赖类型。
- 需要的 Artifact。
- 失败策略。

### 15.3 任务图交互

支持：

- 聚焦当前任务。
- 按状态、Subagent、领域和风险过滤。
- 展开 / 折叠子任务。
- 查看关键路径。
- 查看并行分支。
- 点击跳转输入与产物。
- 查看上游变化导致的 stale 传播。
- 手动暂停、取消、重试和重启。

已批准计划的图不能直接原地修改；编辑生成新计划版本。

### 15.4 任务详情

显示：

- 目标和成功标准。
- 输入 Artifact 及版本。
- 输出契约。
- Subagent、Skill、模型。
- 上下文包。
- 资源声明。
- 风险和确认策略。
- Attempt 历史。
- 检查点。
- 事件日志。
- 错误和恢复建议。

### 15.5 队列视图

按以下分组：

- Ready。
- Queued。
- Running。
- Waiting for User。
- Waiting Approval。
- Paused。
- Failed / Orphaned。
- Completed。

支持调整未运行任务优先级，但不能绕过硬依赖。

### 15.6 Subagent 视图

每个角色显示：

- 职责。
- 当前任务。
- 运行状态。
- 使用模型。
- 已调用 Skill。
- 最近产物。
- 权限范围。
- 失败次数。

### 15.7 计划审阅视图

计划确认前展示：

- 任务列表和依赖。
- 可并行部分。
- 关键确认点。
- 预计成本和时间等级。
- 风险。
- 假设。
- 可编辑约束。

### 15.8 恢复中心

使用独立视图集中展示未完成任务，不与普通失败通知混在一起。

必须支持：

- 批量查看。
- 逐项恢复。
- 选择恢复策略。
- 查看重复写入风险。
- 查看输入变化。
- 放弃并归档。

### 15.9 事件时间线

按时间展示：

```text
目标创建
  → 计划批准
  → 任务排队
  → Subagent 启动
  → Skill 调用
  → 模型调用
  → 检查点
  → 产物生成
  → 用户确认
  → 领域提交
  → 目标完成
```

## 16. 异常情况

### 16.1 目标过于模糊

- 创建 Goal 草案。
- 列出缺失的范围、输出和成功标准。
- 一次只询问最关键问题。
- 未澄清前不自动生成高成本计划。

### 16.2 计划出现循环依赖

- Plan Validator 阻止批准。
- 展示环路。
- Planner 重新拆分或引入中间 Artifact。

### 16.3 任务粒度过大

- 标记无法可靠估算、恢复或校验。
- 建议拆成输入输出明确的子任务。
- 不允许用一个任务包办整本小说生成和审查。

### 16.4 任务粒度过小

- 检测大量无价值串行节点。
- 推荐合并纯机械步骤。
- 保留独立确认点和失败边界。

### 16.5 Subagent 不可用

- 推荐兼容角色。
- 用户可以改为普通任务执行。
- 更换角色创建新 Attempt。
- 不修改原 Task 定义来源。

### 16.6 Skill 不可用或版本不兼容

- 阻止执行需要该 Skill 的任务。
- 显示缺失能力和兼容版本。
- 可以让 Planner 生成替代方案。
- 不静默使用名称相似 Skill。

### 16.7 模型不可用

- Model Router 返回替代候选。
- 校验上下文、结构化输出和工具能力。
- 用户策略允许时自动降级。
- 创建新的 fallback Attempt。

### 16.8 上下文过长

- 请求 Context Engine 压缩。
- 移除可选资料。
- 拆分任务。
- 推荐长上下文模型。
- 不静默丢弃 Canon 和用户约束。

### 16.9 预算不足

- 在软上限提醒。
- 在硬上限暂停新任务。
- 保留已完成产物。
- 提供降级模型、缩小范围、减少通道或提高预算选项。

### 16.10 并行写冲突

- 阻止冲突 commit。
- 保留双方候选。
- 展示基础版本和差异。
- 用户选择顺序、合并或放弃。

### 16.11 用户修改上游数据

- 标记受影响任务 `stale`。
- 暂停未运行下游。
- 计算影响图。
- 提供保持旧快照、刷新重运行或重规划。

### 16.12 应用崩溃或关闭

- 心跳超时后 Attempt 进入 `interrupted`。
- Task 进入 `orphaned`。
- 创建 RecoveryRecord。
- 下次打开项目显示恢复中心。

### 16.13 部分提交

- 查询领域提交令牌和预期版本。
- 已提交部分不重复执行。
- 未提交部分进入恢复或人工处理。
- 无法判断时停止并请求用户。

### 16.14 用户取消父任务

- 默认取消尚未开始的子任务。
- 正在运行任务收到取消请求并保存可用检查点。
- 已完成产物保留。
- 共享子任务若仍被其他目标引用则不取消。

### 16.15 用户拒绝确认

- 候选 Artifact 标记 `rejected`。
- 下游按依赖失败策略处理。
- 可以返回 Planner 生成替代方案。
- 不删除被拒绝产物和理由。

### 16.16 汇总结论冲突

- 保留不同方案和支持证据。
- 标记需要用户选择或增加验证任务。
- 不由 Aggregator 伪造折中事实。

### 16.17 任务无限扩张

- 限制动态子任务深度和数量。
- 超过阈值暂停扩张。
- 展示新增范围和预算。
- 要求用户确认或重规划。

### 16.18 跨小说引用

- 默认阻止。
- 用户显式复制时生成新 Artifact ID。
- 不共享可变任务、记忆和领域状态。
- 只读引用必须记录来源并受权限控制。

## 17. 验收标准

### 17.1 数据隔离

- 所有目标、计划、任务、尝试、运行、产物、确认和恢复记录可追溯到 `novelId`。
- 切换小说不能显示或调度另一小说任务。
- ContextBundle 和 Artifact 不可跨小说误用。

### 17.2 目标与计划

- 用户可以用自然语言创建目标。
- 目标包含范围、成功标准和变更边界。
- 系统可以生成 DAG 计划。
- 计划批准前可以编辑。
- 批准后修改创建新版本。
- 循环依赖不能通过校验。

### 17.3 任务调度

- 任务只在依赖、预算、权限和资源满足时运行。
- 只读任务可以安全并行。
- 写冲突任务不会并行提交。
- 任务状态和阻塞原因可见。
- 动态子任务受深度、预算和确认控制。

### 17.4 Subagent、Skill 与模型

- Subagent 以版本化 Profile 分配。
- Skill 调用记录 ID、版本、输入和输出。
- 模型选择记录能力要求和路由决定。
- 切换模型创建新 Attempt。
- 普通确定性操作不强行包装成 Agent。

### 17.5 产物与来源

- 任务输出符合类型化 Schema。
- Artifact 记录输入、任务、Attempt、模型、Skill 和上下文来源。
- 候选产物不自动成为 Canon。
- 互斥结论不会被静默合并。

### 17.6 人工确认

- 计划、Canon、正文应用、记忆和发布动作有明确确认。
- ApprovalRequest 展示差异、影响、成本和可撤销性。
- 拒绝不删除执行历史。
- 一个任务的批准不扩散到其他任务。

### 17.7 失败与恢复

- 每个任务保留所有 Attempt。
- 用户能区分 retry、resume、restart 和 rerun。
- 长任务在安全阶段产生检查点。
- 应用重启后可以看到未完成任务。
- 恢复前检查输入变化和重复写入风险。
- 高风险任务不会无确认自动恢复。

### 17.8 幂等和重复写入

- 提交任务有 idempotencyKey。
- 领域 commit 使用预期版本。
- 恢复时可以识别已完成提交。
- 无法判断提交状态时停止并请求用户。

### 17.9 上游变化

- 上游 Artifact / Canon 改变会标记下游 stale。
- 已完成旧结果保留。
- 用户可以保持旧快照、刷新重运行或重规划。
- 新输入不会静默进入旧 Attempt。

### 17.10 预算

- 计划显示预计使用量。
- 运行显示实际使用量。
- 软上限提醒，硬上限暂停。
- 用户可以降级、缩小范围或提高预算。

### 17.11 可视化

- 任务图展示节点、依赖、状态和关键路径。
- 队列展示可运行、运行中、等待和失败任务。
- 任务详情可查看输入、输出、模型、Skill、Attempt 和事件。
- 恢复中心可以执行所有恢复动作。

### 17.12 完成判定

- 目标完成必须逐项验证成功标准。
- 必需确认未处理时不能完成。
- 部分成功必须标记 `partiallyCompleted`。
- 汇总结果包含产物、未解决问题和来源。

## 18. 后续版本

### 18.1 V2

- 可视化计划编辑器。
- 任务模板和工作流模板。
- 更细粒度并发配额。
- 多模型竞赛与自动选择。
- 语义级任务缓存。
- 后台定时任务。
- 跨设备恢复。
- 自定义 Subagent Profile 编辑器。
- 任务性能和成本分析。

### 18.2 V3

- 多人审批和团队角色。
- 分布式执行器。
- 受控循环工作流。
- 可验证的自主长周期创作。
- 系列小说跨项目只读工作流。
- Agent 运行评测和自动策略优化。

## 19. 与其他 Spec 的边界

| 相关 Spec | 边界 |
|---|---|
| `01-novel-project-spec.md` | 定义小说任务空间；本 Spec 定义目标、计划、任务和运行 |
| `02-novel-cockpit-spec.md` | Cockpit 展示编排摘要；本 Spec 提供完整任务控制台 |
| `03-inspiration-vault-spec.md` | 灵感可以成为任务输入；本 Spec 不修改灵感原文 |
| `04-arc-swimlane-diagram-spec.md` | 泳道图拥有结构节点；本 Spec 只调度结构任务和候选产物 |
| `05-clue-foreshadowing-spec.md` | 线索系统拥有线索事实；本 Spec 不直接改线索状态 |
| `06-character-system-spec.md` | 人物系统拥有人物事实；本 Spec 不直接改人物 Canon |
| `07-worldbuilding-system-spec.md` | 世界观系统拥有设定事实；本 Spec 不直接改世界 Canon |
| `08-chapter-writing-spec.md` | 写作系统拥有正文版本和写作运行；本 Spec 调度写作目标和依赖 |
| `09-chapter-review-spec.md` | 审查系统定义报告、问题和修改任务；本 Spec 调度多通道执行和恢复 |
| `11-model-router-spec.md` | 模型路由拥有模型注册、能力、推荐、成本和降级；本 Spec 只声明模型要求 |
| `12-rag-context-engine-spec.md` | Context Engine 检索和组装上下文；本 Spec 只提交 ContextRequest |
| `13-long-term-memory-spec.md` | 长期记忆保存确认信息；本 Spec 只提交 MemoryWriteCandidate |
| `14-skill-system-spec.md` | Skill 系统拥有 Skill 定义、版本、权限和执行；本 Spec 调度 SkillInvocation |
| `15-publish-review-spec.md` | 发布审核拥有平台门禁；本 Spec 只调度审核和等待发布确认 |
