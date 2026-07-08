# 01 Novel Project Spec

状态：Review Candidate

日期：2026-07-08

下游依赖：

- `02-novel-cockpit-spec.md`：用户进入某本小说后进入 Cockpit。
- `03-inspiration-vault-spec.md`：每本小说拥有独立灵感库。
- `04-arc-swimlane-diagram-spec.md`：每个泳道图必须绑定 `novelId` 和 `arcId`。

相关底座文档：`2026-07-08-novel-agent-product-foundation-design.md`

## 1. 功能定位

Novel Project 是整个小说原生 Agent 软件的数据边界和入口根对象。

它解决的问题是：

1. 用户可以创建、进入、管理一本小说。
2. 每本小说拥有独立的数据空间，包括灵感库、人物、世界观、线索、大纲、章节、Agent 任务、模型配置和长期记忆。
3. 系统必须防止不同小说的数据互相污染。
4. 用户可以为每本小说设置类型、目标平台、默认模型、写作风格和创作状态。
5. Agent 可以在创建小说时生成初始化建议，但不能未经确认写入核心设定。

一句话定义：

> Novel Project 是一本小说的项目容器，负责建立数据隔离、初始化创作模块，并把用户带入 Novel Cockpit。

## 2. 用户角色

### 2.1 新手作者

通过创建向导建立第一本小说，获得初始大纲、人物、世界观和写作建议。

### 2.2 连载网文作者

为每本连载小说管理平台、更新状态、当前章节、存稿和发布审核状态。

### 2.3 强设定作者

为复杂世界观小说建立独立设定空间、长期记忆和模型偏好。

### 2.4 悬疑 / 推理作者

为每本小说隔离线索链、暗线、伏笔和反转设计，避免跨项目混乱。

### 2.5 编辑 / 审稿人

进入某个小说项目，查看其审查状态、章节进度和修改任务。

## 3. 入口位置

### 3.1 应用主入口

```text
应用启动
  ↓
Project List
  ↓
选择 Novel
  ↓
Novel Cockpit
```

### 3.2 创建入口

用户可以从 Project List 创建新小说：

```text
Project List
  ↓
New Novel
  ↓
Novel Creation Wizard
  ↓
Novel Cockpit
```

### 3.3 返回入口

以下页面必须能返回 Project List：

- Novel Cockpit。
- 小说设置。
- 项目归档列表。
- 项目导入页。
- 项目错误恢复页。

### 3.4 默认进入规则

当用户打开应用时：

1. 如果没有任何小说项目，显示创建第一本小说的引导。
2. 如果存在小说项目，显示 Project List。
3. 如果用户启用“打开上次项目”，可以直接进入上次 Novel 的 Cockpit，但必须提供返回 Project List 的入口。
4. 如果上次项目已归档、删除或损坏，进入 Project List 并显示恢复提示。

## 4. 核心用户目标

Novel Project 必须支持用户完成以下目标：

1. 创建一本小说。
2. 设置小说名称、类型、简介、目标平台和写作状态。
3. 为小说初始化独立灵感库、记忆空间、大纲、人物、世界观、线索、章节和 Agent 任务空间。
4. 进入某本小说的 Novel Cockpit。
5. 查看项目列表和每本小说的进度摘要。
6. 修改项目设置。
7. 设置每本小说的默认模型和模型策略。
8. 设置每本小说的长期记忆策略。
9. 归档小说。
10. 从归档中恢复小说。
11. 导入 / 导出小说项目的基础数据。
12. 防止不同小说之间共享可变创作事实。

## 5. MVP 范围

### 5.1 项目列表

MVP 支持：

- 查看所有未归档小说。
- 查看小说卡片。
- 搜索小说。
- 按最近更新时间排序。
- 进入小说。
- 创建小说。
- 查看归档小说入口。

### 5.2 创建小说

MVP 创建向导支持：

- 书名。
- 类型。
- 简介。
- 目标平台。
- 目标读者。
- 当前创作阶段。
- 默认模型策略。
- 初始写作风格说明。
- 是否让 Agent 生成初始化建议。

### 5.3 项目初始化

创建小说后，系统必须初始化：

- `Novel`
- `NovelSettings`
- `ProjectDataSpace`
- `InspirationVault`
- `MemorySpace`
- `OutlineSpace`
- `CharacterSpace`
- `WorldbuildingSpace`
- `ClueSpace`
- `ChapterSpace`
- `AgentTaskSpace`
- `ModelPreferences`
- `SkillPreferences`

### 5.4 项目设置

MVP 支持修改：

- 书名。
- 类型。
- 简介。
- 目标平台。
- 目标读者。
- 当前状态。
- 默认模型。
- 写作风格偏好。
- 记忆写入策略。

### 5.5 项目状态

MVP 状态：

- 构思中。
- 大纲中。
- 写作中。
- 连载中。
- 修订中。
- 完结。
- 已归档。

### 5.6 数据隔离

MVP 必须强制：

- 所有创作对象都绑定 `novelId`。
- 查询默认按当前 `novelId` 过滤。
- 跨小说复用必须复制或只读引用。
- Agent 上下文必须显式声明当前 `novelId`。

## 6. 非 MVP 范围

第一版不做：

- 多人项目协作。
- 复杂权限系统。
- 云端同步冲突合并。
- 真实平台账号绑定。
- 收益分析。
- 读者评论导入。
- 项目模板市场。
- 本地模型部署管理。
- 自动从外部网站导入整本小说。
- 跨小说宇宙管理。

V2 可以支持项目模板、导入导出增强、多端同步和协作权限。

## 7. 核心流程

### 7.1 创建第一本小说

```text
用户打开应用
  ↓
系统发现没有 Novel
  ↓
显示创建第一本小说引导
  ↓
用户填写书名、类型、简介、目标平台
  ↓
用户选择是否让 Agent 生成初始化建议
  ↓
系统创建 Novel 和默认数据空间
  ↓
进入 Novel Cockpit
```

规则：

- 书名必填。
- 类型必填。
- 未填写简介时可以创建项目，但 Agent 初始化建议会提示上下文不足。
- 初始化建议必须是草案，不能直接写入核心设定。

### 7.2 创建后续小说

```text
用户进入 Project List
  ↓
点击 New Novel
  ↓
填写创建向导
  ↓
系统创建新的 Novel 和独立数据空间
  ↓
用户进入新小说 Cockpit
```

规则：

- 新小说不能继承上一部小说的创作事实。
- 用户偏好可以继承，例如常用模型、界面偏好、常用 Skill。
- 创作数据必须隔离，例如人物、设定、线索、灵感、记忆。

### 7.3 进入小说

```text
用户在 Project List 点击某个 Novel
  ↓
系统加载 NovelHeaderSummary
  ↓
系统校验项目状态和数据空间
  ↓
进入 Novel Cockpit
```

规则：

- 已归档小说默认只读进入。
- 数据空间缺失时进入恢复流程。
- 如果存在记忆冲突或任务失败，Cockpit 负责展示提醒。

### 7.4 修改项目设置

```text
用户进入 Novel Settings
  ↓
修改类型、平台、状态、默认模型或记忆策略
  ↓
系统校验影响范围
  ↓
用户确认
  ↓
保存设置
```

规则：

- 修改默认模型不应影响正在运行的任务，除非用户选择应用到运行中任务。
- 修改目标平台会影响发布审核规则。
- 修改类型会影响 Agent 推荐模板和 Skill 默认策略。

### 7.5 Agent 初始化建议

```text
用户创建小说时选择“生成初始化建议”
  ↓
Agent 读取书名、类型、简介、目标读者、平台
  ↓
Agent 生成故事核心、大纲方向、人物方向、世界观方向、线索方向
  ↓
系统展示初始化建议
  ↓
用户选择采纳、编辑或忽略
```

规则：

- Agent 输出必须是建议，不是正式数据。
- 用户采纳后，系统生成对应模块的草案。
- 用户确认后，草案才进入目标模块。

### 7.6 归档小说

```text
用户在 Project Settings 点击归档
  ↓
系统展示影响说明
  ↓
用户确认
  ↓
Novel 状态变为 archived
  ↓
项目从默认列表隐藏
```

规则：

- 归档不是删除。
- 归档项目保留所有数据。
- 归档项目默认只读。
- 用户可以恢复归档项目。

### 7.7 恢复归档小说

```text
用户进入 Archived Projects
  ↓
选择 Novel
  ↓
点击恢复
  ↓
系统恢复到归档前状态或 revision 状态
  ↓
项目回到 Project List
```

规则：

- 恢复后必须重新校验模型配置和记忆状态。
- 如果项目关联的模型不可用，提示重新选择默认模型。

### 7.8 删除小说

MVP 默认不提供硬删除。

如果后续提供删除：

```text
用户请求删除 Novel
  ↓
系统展示影响范围
  ↓
用户二次确认
  ↓
系统软删除或进入回收站
```

规则：

- 删除是高风险操作。
- 删除前必须展示会影响灵感、章节、人物、世界观、线索、记忆、Agent 任务。
- MVP 用归档代替删除。

### 7.9 导出项目

```text
用户进入 Project Settings
  ↓
点击导出
  ↓
选择导出范围
  ↓
系统生成项目包或 Markdown / JSON 文件
```

MVP 导出范围：

- 项目基础信息。
- 大纲摘要。
- 人物摘要。
- 世界观摘要。
- 线索摘要。
- 灵感摘要。
- 章节清单。

正文全文导出可以在章节写作 spec 中细化。

### 7.10 导入项目

MVP 可以只支持基础导入：

```text
用户选择导入文件
  ↓
系统解析项目基础信息
  ↓
用户确认导入
  ↓
系统创建新 Novel
```

规则：

- 导入总是创建新小说，不覆盖现有小说。
- 导入数据必须重新生成 `novelId`。
- 外部导入的灵感、人物、线索、设定必须进入待确认状态。

## 8. 数据对象

### 8.1 Novel

一本小说项目的根对象。

### 8.2 NovelSettings

小说的配置对象。

### 8.3 ProjectDataSpace

小说独立数据空间的注册表，记录该小说有哪些子空间。

### 8.4 ProjectListItem

项目列表中的小说卡片摘要。

### 8.5 NovelCreationDraft

创建向导中的草稿数据。

### 8.6 ProjectInitializationPlan

创建小说后由系统和 Agent 生成的初始化计划。

### 8.7 ModelPreferences

小说级模型偏好。

### 8.8 MemoryPolicy

小说级长期记忆策略。

### 8.9 ProjectArchiveRecord

归档记录。

### 8.10 ProjectImportRecord

导入记录。

### 8.11 ProjectExportRecord

导出记录。

## 9. 字段定义

### 9.1 Novel

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `novelId` | string | 是 | 小说 ID |
| `title` | string | 是 | 书名 |
| `subtitle` | string | 否 | 副标题 |
| `genre` | string | 是 | 类型 |
| `description` | string | 否 | 简介 |
| `targetAudience` | string | 否 | 目标读者 |
| `targetPlatform` | string | 否 | 目标平台 |
| `status` | enum | 是 | 项目状态 |
| `coverAssetId` | string | 否 | 封面或视觉资产 |
| `settingsId` | string | 是 | 配置 ID |
| `dataSpaceId` | string | 是 | 数据空间 ID |
| `createdBy` | string | 是 | 创建者 |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |
| `archivedAt` | ISO datetime | 否 | 归档时间 |

### 9.2 NovelStatus

| 值 | 说明 |
|---|---|
| `ideation` | 构思中 |
| `outlining` | 大纲中 |
| `drafting` | 写作中 |
| `serializing` | 连载中 |
| `revision` | 修订中 |
| `completed` | 完结 |
| `archived` | 已归档 |

### 9.3 NovelSettings

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `settingsId` | string | 是 | 配置 ID |
| `novelId` | string | 是 | 所属小说 |
| `language` | string | 是 | 写作语言，MVP 默认 `zh-CN` |
| `genreTemplate` | string | 否 | 类型模板 |
| `targetPlatform` | string | 否 | 目标平台 |
| `updateCadence` | string | 否 | 更新频率 |
| `defaultPov` | string | 否 | 默认叙事视角 |
| `styleGuide` | string | 否 | 写作风格说明 |
| `forbiddenPatterns` | string[] | 是 | 禁用表达或禁用设定 |
| `modelPreferencesId` | string | 是 | 模型偏好 ID |
| `memoryPolicyId` | string | 是 | 记忆策略 ID |
| `skillPreferenceIds` | string[] | 是 | Skill 偏好 |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.4 ProjectDataSpace

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `dataSpaceId` | string | 是 | 数据空间 ID |
| `novelId` | string | 是 | 所属小说 |
| `inspirationVaultId` | string | 是 | 灵感库 ID |
| `memorySpaceId` | string | 是 | 记忆空间 ID |
| `outlineSpaceId` | string | 是 | 大纲空间 ID |
| `characterSpaceId` | string | 是 | 人物空间 ID |
| `worldbuildingSpaceId` | string | 是 | 世界观空间 ID |
| `clueSpaceId` | string | 是 | 线索空间 ID |
| `chapterSpaceId` | string | 是 | 章节空间 ID |
| `agentTaskSpaceId` | string | 是 | Agent 任务空间 ID |
| `createdAt` | ISO datetime | 是 | 创建时间 |
| `healthStatus` | enum | 是 | `healthy`、`missingSpace`、`needsRepair`、`error` |

### 9.5 ProjectListItem

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `novelId` | string | 是 | 小说 ID |
| `title` | string | 是 | 书名 |
| `genre` | string | 是 | 类型 |
| `status` | enum | 是 | 项目状态 |
| `descriptionPreview` | string | 否 | 简介摘要 |
| `coverAssetId` | string | 否 | 封面 |
| `currentWordCount` | number | 是 | 当前字数 |
| `chapterCount` | number | 是 | 章节数量 |
| `openTaskCount` | number | 是 | 未完成任务数 |
| `unresolvedAlertCount` | number | 是 | 未解决提醒数 |
| `lastOpenedAt` | ISO datetime | 否 | 最近打开时间 |
| `updatedAt` | ISO datetime | 是 | 最近更新时间 |

### 9.6 NovelCreationDraft

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `draftId` | string | 是 | 创建草稿 ID |
| `title` | string | 是 | 书名 |
| `genre` | string | 是 | 类型 |
| `description` | string | 否 | 简介 |
| `targetAudience` | string | 否 | 目标读者 |
| `targetPlatform` | string | 否 | 目标平台 |
| `initialStatus` | enum | 是 | 初始状态 |
| `styleGuide` | string | 否 | 写作风格 |
| `defaultModelId` | string | 否 | 默认模型 |
| `enableAgentInitialization` | boolean | 是 | 是否启用 Agent 初始化建议 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.7 ProjectInitializationPlan

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `planId` | string | 是 | 初始化计划 ID |
| `novelId` | string | 是 | 所属小说 |
| `generatedByAgent` | boolean | 是 | 是否由 Agent 生成 |
| `suggestedPremise` | string | 否 | 故事核心建议 |
| `suggestedArcs` | object[] | 是 | 篇章建议 |
| `suggestedCharacters` | object[] | 是 | 人物建议 |
| `suggestedWorldItems` | object[] | 是 | 世界观建议 |
| `suggestedClues` | object[] | 是 | 线索建议 |
| `status` | enum | 是 | `drafted`、`partiallyAccepted`、`accepted`、`rejected` |
| `requiresUserConfirmation` | boolean | 是 | 是否需要用户确认 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.8 ModelPreferences

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `modelPreferencesId` | string | 是 | 模型偏好 ID |
| `novelId` | string | 是 | 所属小说 |
| `defaultModelId` | string | 是 | 默认模型 |
| `writingModelId` | string | 否 | 写作默认模型 |
| `reviewModelId` | string | 否 | 审查默认模型 |
| `reasoningModelId` | string | 否 | 推理默认模型 |
| `inspirationModelId` | string | 否 | 灵感默认模型 |
| `allowHighCostModels` | boolean | 是 | 是否允许高成本模型 |
| `requireConfirmationForHighCost` | boolean | 是 | 高成本是否确认 |
| `fallbackModelId` | string | 否 | 失败降级模型 |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.9 MemoryPolicy

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `memoryPolicyId` | string | 是 | 记忆策略 ID |
| `novelId` | string | 是 | 所属小说 |
| `autoWriteWorkflowMemory` | boolean | 是 | 是否自动写入流程偏好 |
| `requireConfirmationForCanon` | boolean | 是 | 核心设定写入是否需要确认 |
| `requireConfirmationForCharacterFacts` | boolean | 是 | 人物事实写入是否需要确认 |
| `requireConfirmationForClueFacts` | boolean | 是 | 线索事实写入是否需要确认 |
| `enableConflictDetection` | boolean | 是 | 是否启用记忆冲突检测 |
| `retentionMode` | enum | 是 | `standard`、`strictCanon`、`draftFriendly` |
| `updatedAt` | ISO datetime | 是 | 更新时间 |

### 9.10 ProjectArchiveRecord

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `archiveRecordId` | string | 是 | 归档记录 ID |
| `novelId` | string | 是 | 小说 ID |
| `previousStatus` | enum | 是 | 归档前状态 |
| `reason` | string | 否 | 归档原因 |
| `archivedBy` | string | 是 | 操作者 |
| `archivedAt` | ISO datetime | 是 | 归档时间 |
| `restoredAt` | ISO datetime | 否 | 恢复时间 |

### 9.11 ProjectImportRecord

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `importRecordId` | string | 是 | 导入记录 ID |
| `novelId` | string | 是 | 导入后生成的小说 ID |
| `sourceType` | enum | 是 | `json`、`markdown`、`docx`、`manualPaste` |
| `sourceName` | string | 否 | 来源名称 |
| `status` | enum | 是 | `parsed`、`confirmed`、`failed` |
| `createdObjects` | object[] | 是 | 创建对象摘要 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

### 9.12 ProjectExportRecord

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `exportRecordId` | string | 是 | 导出记录 ID |
| `novelId` | string | 是 | 小说 ID |
| `format` | enum | 是 | `json`、`markdown`、`zip` |
| `scope` | string[] | 是 | 导出范围 |
| `status` | enum | 是 | `queued`、`running`、`done`、`failed` |
| `fileAssetId` | string | 否 | 导出文件资产 |
| `createdAt` | ISO datetime | 是 | 创建时间 |

## 10. 状态机

### 10.1 Novel 状态

```text
ideation
  ↓
outlining
  ↓
drafting
  ↓
serializing
  ↓
revision
  ↓
completed
```

归档分支：

```text
ideation / outlining / drafting / serializing / revision / completed
  ↓
archived
```

恢复分支：

```text
archived
  ↓
revision
```

规则：

- `ideation`：只有灵感和初始方向。
- `outlining`：正在建立大纲、人物、世界观、线索。
- `drafting`：正在写正文。
- `serializing`：进入连载发布节奏。
- `revision`：主要进行审查和修改。
- `completed`：正文完成。
- `archived`：从默认列表隐藏，默认只读。

### 10.2 创建向导状态

```text
empty
  ↓
editing
  ↓
validating
  ↓
creating
  ↓
created
```

异常分支：

```text
validating / creating
  ↓
failed
  ↓
editing
```

规则：

- 校验失败不丢失用户输入。
- 创建失败必须显示失败原因和重试入口。

### 10.3 初始化计划状态

```text
drafted
  ↓
partiallyAccepted
  ↓
accepted
```

或：

```text
drafted
  ↓
rejected
```

规则：

- Agent 初始化建议默认是 `drafted`。
- 用户可以部分采纳。
- 采纳后仍然进入目标模块草案，不直接成为核心事实。

### 10.4 数据空间健康状态

```text
healthy
```

异常分支：

```text
missingSpace
  ↓
needsRepair
  ↓
healthy
```

或：

```text
missingSpace / needsRepair
  ↓
error
```

规则：

- 进入 Novel Cockpit 前必须检查数据空间。
- 子空间缺失时必须尝试修复或进入恢复页。

## 11. Agent 行为

### 11.1 可以自动执行

Agent 可以：

- 根据创建向导生成初始化建议。
- 推荐小说类型模板。
- 推荐目标平台写作注意事项。
- 推荐默认模型策略。
- 推荐初始 Subagent / Skill 配置。
- 生成项目健康摘要。
- 提醒数据空间缺失。
- 提醒默认模型不可用。
- 提醒记忆策略风险。

### 11.2 必须用户确认

以下行为必须用户确认：

- 写入核心设定。
- 创建正式人物。
- 创建正式世界观条目。
- 创建正式线索链。
- 创建正式篇章结构。
- 修改项目状态为完结。
- 归档小说。
- 导入外部数据。
- 导出包含正文或核心设定的数据。
- 使用高成本模型生成初始化建议。

### 11.3 Agent 建议格式

Agent 在项目层输出建议时，必须结构化：

```text
建议类型
建议摘要
适用模块
依据字段
风险等级
推荐动作
是否需要用户确认
推荐模型
推荐 Skill
```

不能只输出聊天文本。

## 12. Skill 调用

### 12.1 可调用 Skill

| Skill | 触发场景 |
|---|---|
| 项目初始化建议 | 创建小说时生成初始方向 |
| 类型模板推荐 | 根据 genre 推荐结构模板 |
| 平台规则提示 | 根据 targetPlatform 提醒发布注意事项 |
| 初始大纲草案 | 用户选择生成初始化大纲 |
| 初始人物草案 | 用户选择生成人物方向 |
| 初始世界观草案 | 用户选择生成设定方向 |
| 初始线索草案 | 用户选择生成线索方向 |
| 项目健康检查 | 进入小说或打开设置时检查 |
| 导入解析 | 导入外部项目文件 |
| 导出打包 | 导出项目数据 |

### 12.2 Skill 输出要求

Skill 输出必须包含：

- 输入 Novel 或创建草稿 ID。
- 输出目标模块。
- 生成结果。
- 风险提示。
- 使用模型。
- 是否需要用户确认。
- 是否会创建正式对象。

## 13. 模型选择规则

### 13.1 默认模型路由

| 场景 | 推荐模型类型 |
|---|---|
| 创建向导字段补全 | 高速轻量模型 |
| 项目初始化建议 | 深度推理模型或创意发散模型 |
| 类型模板推荐 | 高速轻量模型 |
| 平台规则提示 | 审校模型 |
| 初始大纲草案 | 深度推理模型 |
| 初始人物 / 世界观方向 | 创意发散模型或深度推理模型 |
| 初始线索方向 | 深度推理模型 |
| 项目健康检查 | 工具调用模型 |
| 导入解析 | 工具调用模型 |
| 导出摘要生成 | 高速轻量模型 |

### 13.2 小说级默认模型

每本小说必须有 `ModelPreferences`。

规则：

- 创建小说时必须选择或自动分配 `defaultModelId`。
- 用户可以后续修改。
- 修改小说默认模型不自动覆盖已有任务模型。
- 高成本模型作为默认模型时必须显示提醒。
- 如果默认模型不可用，系统必须提示重新选择或使用 fallback。

## 14. 长期记忆读写

### 14.1 创建小说时初始化记忆空间

每本小说创建时必须创建独立 `MemorySpace`。

初始可写入：

- Project Memory：书名、类型、目标平台、目标读者、整体风格。
- Workflow Memory：用户确认的模型偏好、Skill 偏好、界面偏好。

不能自动写入：

- Core Canon Memory。
- Character Memory。
- World Memory。
- Clue Memory。

这些必须在用户确认具体内容后由对应模块写入。

### 14.2 项目设置读取的记忆

项目设置可以读取：

- Workflow Memory：默认模型和常用 Skill 偏好。
- Style Memory：写作风格偏好。
- Project Memory：项目目标和平台。

### 14.3 记忆写入规则

规则：

- 修改项目基础信息可以更新 Project Memory。
- 修改默认模型可以更新 Workflow Memory。
- 修改写作风格可以生成 Style Memory 草案，并等待用户确认。
- 任何核心设定、人物事实、线索事实都不能由项目设置直接写入。

## 15. 可视化要求

### 15.1 Project List

项目列表卡片展示：

- 封面或视觉封面默认图。
- 书名。
- 类型。
- 状态。
- 简介摘要。
- 当前字数。
- 章节数量。
- 未完成任务数。
- 未解决提醒数。
- 最近更新时间。

### 15.2 Empty State

没有小说时，展示：

```text
创建第一本小说
导入已有项目
查看示例项目
```

MVP 可以只实现“创建第一本小说”。

### 15.3 Creation Wizard

创建向导建议分步：

```text
基础信息
  ↓
创作目标
  ↓
模型与记忆设置
  ↓
Agent 初始化建议
  ↓
确认创建
```

MVP 可以压缩为单页表单，但字段逻辑必须保留。

### 15.4 Project Settings

项目设置至少包含：

- 基础信息。
- 类型与平台。
- 写作风格。
- 模型偏好。
- 记忆策略。
- 导入导出。
- 归档。

### 15.5 Archived Projects

归档列表展示：

- 书名。
- 归档时间。
- 归档前状态。
- 恢复入口。

## 16. 异常情况

### 16.1 书名缺失

处理方式：

- 禁止创建。
- 显示字段错误。
- 不清空用户已填内容。

### 16.2 类型缺失

处理方式：

- MVP 要求类型必填。
- 可提供“未定类型”选项，但必须显式选择。

### 16.3 创建失败

处理方式：

- 保留创建草稿。
- 显示失败原因。
- 提供重试。
- 如果部分子空间已创建，系统必须回滚或进入修复流程。

### 16.4 数据空间缺失

处理方式：

- 禁止直接进入 Cockpit。
- 显示修复入口。
- 尝试补建缺失子空间。
- 修复失败时显示错误并保留项目。

### 16.5 默认模型不可用

处理方式：

- 显示模型不可用提醒。
- 使用 fallback 模型。
- 如果没有 fallback，要求用户选择新默认模型。

### 16.6 导入格式错误

处理方式：

- 显示解析失败。
- 不创建正式 Novel。
- 保留导入记录。

### 16.7 归档项目被编辑

处理方式：

- 默认禁止编辑。
- 用户必须先恢复项目。

### 16.8 跨小说数据引用

处理方式：

- 默认禁止共享可变对象。
- 允许复制对象到当前 Novel。
- 允许创建只读来源引用。
- 必须记录来源小说和来源对象。

## 17. 验收标准

### 17.1 创建验收

- 用户可以从 Project List 创建小说。
- 创建小说至少需要书名和类型。
- 创建成功后生成 `Novel`、`NovelSettings` 和 `ProjectDataSpace`。
- 创建成功后进入 Novel Cockpit。
- 创建失败不会丢失用户输入。

### 17.2 数据空间验收

- 每本小说必须有独立 `ProjectDataSpace`。
- 创建小说时必须初始化灵感库、记忆空间、大纲空间、人物空间、世界观空间、线索空间、章节空间和 Agent 任务空间。
- 数据空间健康状态可检查。
- 缺失子空间时不能静默进入 Cockpit。

### 17.3 数据隔离验收

- 所有创作对象必须有 `novelId`。
- 默认查询必须按当前 `novelId` 过滤。
- 切换小说后不能继续展示上一部小说的灵感、线索、人物、世界观、章节或记忆。
- 跨小说复用必须复制或只读引用。

### 17.4 项目列表验收

- Project List 展示未归档小说。
- 项目卡片展示书名、类型、状态、字数、章节数、任务数和更新时间。
- 用户可以搜索项目。
- 用户可以进入某本小说。
- 归档小说默认不显示在主列表。

### 17.5 设置验收

- 用户可以修改小说基础信息。
- 用户可以修改目标平台。
- 用户可以修改默认模型。
- 用户可以修改记忆策略。
- 修改高影响设置时必须展示影响说明。

### 17.6 Agent 验收

- Agent 可以生成初始化建议。
- Agent 初始化建议必须是草案。
- 用户确认前不能写入核心设定、正式人物、正式世界观或正式线索。
- 高成本初始化任务必须确认。

### 17.7 模型验收

- 每本小说必须有 `ModelPreferences`。
- 默认模型不可用时必须提示。
- 修改默认模型不影响已运行任务，除非用户确认。

### 17.8 记忆验收

- 每本小说必须有独立 `MemorySpace`。
- 项目基础信息可以写入 Project Memory。
- 核心设定、人物事实、线索事实不能由项目设置直接写入。
- 记忆策略必须可配置。

### 17.9 归档验收

- 用户可以归档小说。
- 归档前必须确认。
- 归档后项目从默认列表隐藏。
- 归档项目可以恢复。
- 归档不是删除。

### 17.10 导入导出验收

- 用户可以导出项目基础数据。
- 导入项目必须创建新 Novel。
- 导入不能覆盖现有 Novel。
- 导入对象默认进入待确认状态。

## 18. 后续版本

### 18.1 V2

- 项目模板。
- 项目复制。
- 完整正文导入导出。
- 多端同步。
- 回收站和软删除。
- 项目级统计。
- 平台发布配置。
- 项目封面和素材管理。

### 18.2 V3

- 多人协作。
- 项目权限。
- 工作室项目总控台。
- 跨小说宇宙管理。
- 读者反馈与运营数据联动。
- 项目模板市场。

## 19. 与其他 spec 的边界

| 相关 spec | 边界 |
|---|---|
| `02-novel-cockpit-spec.md` | 本 spec 定义如何创建和进入 Novel；Cockpit 定义进入后的工作台 |
| `03-inspiration-vault-spec.md` | 本 spec 初始化独立灵感库；灵感库 spec 定义灵感创建、分类和转化 |
| `04-arc-swimlane-diagram-spec.md` | 本 spec 定义 Novel / Arc 数据隔离基础；泳道图 spec 定义 Arc 内部可视化编排 |
| `05-clue-foreshadowing-spec.md` | 本 spec 初始化线索空间；线索 spec 定义正式线索链和伏笔链 |
| `06-character-system-spec.md` | 本 spec 初始化人物空间；人物 spec 定义人物卡和关系图 |
| `07-worldbuilding-system-spec.md` | 本 spec 初始化世界观空间；世界观 spec 定义设定条目和规则检查 |
| `08-chapter-writing-spec.md` | 本 spec 初始化章节空间；章节写作 spec 定义正文生成流程 |
| `09-chapter-review-spec.md` | 本 spec 提供项目和章节入口；审查 spec 定义审查报告和修改任务 |
| `10-agent-orchestration-spec.md` | 本 spec 初始化 Agent 任务空间；编排 spec 定义任务拆分和执行 |
| `11-model-router-spec.md` | 本 spec 定义小说级模型偏好；模型路由 spec 定义完整模型档案和调度 |
| `12-long-term-memory-spec.md` | 本 spec 初始化小说级记忆空间；长期记忆 spec 定义记忆读写、冲突和回滚 |
| `13-skill-system-spec.md` | 本 spec 定义小说级 Skill 偏好；Skill spec 定义 Skill 注册、执行和版本 |
| `14-publish-review-spec.md` | 本 spec 定义目标平台字段；发布审核 spec 定义平台规则和发布清单 |
