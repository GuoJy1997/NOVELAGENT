# 小说原生 Agent · Toy Writer Cockpit UI 还原规格

日期：2026-07-07  
版本：v0.1  
状态：设计规格，待用户评审  
范围：小说原生 Agent 的桌面端项目首页 / 可视化创作工作台 UI 方向与前端还原边界  

## 1. 背景与目标

用户提供了一张“潮玩写作控制台”视觉参考图：暗色作家书桌环境中，中央是小说结构地图，左侧是项目导航，右侧是 AI 编排状态，底部是线索归因链，左下角有潮玩机器人伙伴。

这份规格的目标是把该视觉参考转成可实现的 UI 还原方案，明确：

- 哪些内容是纯视觉资产；
- 哪些内容必须做成真实前端组件；
- 哪些区域需要图谱、拖拽或可视化引擎；
- 第一版 MVP 应该实现哪些内容；
- 哪些视觉效果适合展示模式，哪些需要在工作模式中收敛。

这不是最终实现计划，也不包含代码。进入实现前还需要基于本规格编写实施计划。

## 2. 设计读法

Reading this as：面向小说作者的桌面端 AI 创作工作台，带有潮玩 IP 伙伴、暗色作家案头、小说结构地图和 Agent 控制塔，视觉气质偏“高端潮玩创作装备”，不是传统 SaaS 后台，也不是普通 AI 聊天器。

核心设计词：

> 潮玩写作控制台 / Toy Writer Cockpit

目标情绪：

- 有创造欲；
- 有陪伴感；
- 有高级质感；
- 有一点神秘的作家书房气；
- 同时保留专业工具的清晰度。

## 3. 设计语言合同

### 3.1 Core Word

潮玩写作控制台。

### 3.2 User Emotion

用户应该感觉自己不是在操作普通后台，而是在进入一间“会思考的小说工作室”：有故事结构、有线索、有任务、有伙伴，也有一个可以被掌控的创作仪表盘。

### 3.3 Symbol Motherform

核心视觉母体是：

- 作家案头；
- 章节卡片；
- 线索链；
- 潮玩机器人伙伴；
- 复古黄铜仪表与书房文具。

### 3.4 Material Word

材质关键词：

- dark leather；
- aged paper；
- brass trim；
- matte vinyl；
- soft ceramic；
- warm amber light；
- subtle dust grain；
- frosted acrylic in small amounts。

### 3.5 Typography Personality

标题可偏文学感、复古感或编辑感；正文和工具信息必须清晰。推荐：

- 中文：思源宋体 / 屏显宋体用于少量标题，思源黑体 / 苹方 / 微软雅黑用于正文 UI；
- 英文：editorial serif 用于标题，clean sans 用于状态和组件；
- 数字和状态：可用轻微机械感的 mono 字体，但不要过度赛博。

### 3.6 Color Skeleton

颜色只服务层级和状态，不做廉价霓虹。

```text
bg.base: #0F0C09
bg.panel: #211A13
bg.card: #3A2C20
surface.paper: #D8C3A0
accent.primary: #F28A2E
accent.brass: #B88A4A
accent.support: #4C9A8A
text.primary: #F3E4C6
text.secondary: #A9987A
state.done: #6FAE7D
state.warning: #D49A3A
state.danger: #B65A3C
border.soft: rgba(216, 195, 160, 0.22)
shadow.deep: rgba(0, 0, 0, 0.45)
```

禁止倾向：

- 大面积紫蓝 AI 渐变；
- 随机霓虹光；
- 彩虹色标签；
- 灰字压在暗背景上导致不可读；
- 所有卡片都做玻璃拟态。

### 3.7 Spatial Structure

空间结构是“案头 + 控制台”：

```text
背景书桌 / 书房氛围
└─ 中央软件主面板
   ├─ 左侧导航
   ├─ 中央小说结构地图
   ├─ 中下灵感库与人物图谱
   ├─ 底部线索归因链
   └─ 右侧 AI 编排面板
```

### 3.8 Behavior Archive

用户的创作行为会在界面中留下痕迹：

- 已建立的篇章；
- 已采用的灵感；
- 已回收的伏笔；
- 已确认的正史记忆；
- 已完成的 Agent 任务；
- 已通过的审查项。

### 3.9 Progress System

进度不是简单百分比，而应与创作对象绑定：

- 章节完成度；
- 伏笔回收度；
- 角色弧光推进度；
- 记忆层同步度；
- 审查通过项；
- Agent 任务队列状态。

### 3.10 Share State

适合作为对外展示的截图状态：

- 当前小说项目已选中；
- 中央 Novel Structure Map 有一个篇章被高亮；
- 底部 Clue Attribution 展示一条完整线索链；
- 右侧 AI Orchestration 显示任务正在运行；
- 左下角潮玩机器人处于“陪伴/思考”状态。

## 4. 产品模式

该视觉方向应拆成两种产品模式。

### 4.1 品牌模式

用途：

- 官网首屏；
- 启动页；
- 项目首页；
- 演示视频；
- 产品宣传图。

特点：

- 背景氛围完整；
- 潮玩机器人较大；
- 书桌、纸张、蜡烛、书本等装饰可见；
- 适合截图传播；
- 信息密度可以略高，但不承担长时间正文编辑。

### 4.2 工作模式

用途：

- 长时间规划；
- 章节写作；
- 审查修改；
- 大纲编辑；
- 复杂图谱拖拽。

特点：

- 背景压暗或隐藏；
- 潮玩机器人缩小成悬浮助手；
- 中央内容区域扩大；
- 正文、结构图和审查面板的可读性优先；
- 动效和纹理降低，避免视觉疲劳。

第一版可以先实现品牌模式的项目首页，再抽象出可复用组件进入工作模式。

## 5. 目标平台与画布

### 5.1 目标平台

优先级：

1. 桌面 Web；
2. Electron / Tauri 桌面壳；
3. 平板横屏适配；
4. 移动端只做轻量管理入口，不承载完整结构地图。

### 5.2 基准尺寸

```text
设计基准：1728 × 960
最低桌面适配：1440 × 900
宽屏适配：1920 × 1080
主工作面板比例：接近 16:9
```

### 5.3 安全区

桌面端需预留：

- 窗口标题栏或自定义拖拽区域；
- 右侧滚动区；
- 低分辨率设备下的最小信息宽度；
- 装饰资产不应遮挡主工作区。

## 6. 页面总布局

建议主页面结构：

```text
AppShell
├─ SceneBackground
│  ├─ bookshelf / desk / papers / warm light
│  └─ optional atmosphere overlay
├─ MascotCompanion
├─ MainConsole
│  ├─ ProjectSidebar
│  ├─ MainWorkspace
│  │  ├─ WorkspaceHeader
│  │  ├─ NovelStructureMap
│  │  ├─ InspirationAndCharacterRow
│  │  └─ ClueAttributionPanel
│  └─ AgentOrchestrationPanel
└─ FocusModeOverlay / CommandBar
```

主面板比例建议：

```text
左侧导航：12% - 15%
中央工作区：58% - 64%
右侧 Agent 面板：20% - 24%
底部线索链：中央工作区下方固定或可折叠
```

## 7. 视觉层级与还原策略

```text
Layer 0：根背景，深色书房底色
Layer 1：环境资产，书桌、书本、纸张、蜡烛、便签
Layer 2：主控制台外壳，深色皮革/金属边框
Layer 3：核心 UI 区域，导航、地图、右侧面板
Layer 4：图谱线条、节点、章节卡片、人物关系
Layer 5：状态高亮、运行态、选中态、提示点
Layer 6：潮玩机器人 IP 前景资产
Layer 7：命令栏、弹窗、节点详情抽屉
```

还原原则：

- 高复杂度物体用图片资产；
- 简单容器、卡片、按钮用 CSS；
- 图谱、连线、节点必须是真组件；
- 状态、任务、审查项必须绑定真实数据；
- 背景资产不能影响工作模式可读性。

## 8. 资产清单

### 8.1 必需资产

```text
assets/mascot/writer-bot-idle.png
assets/mascot/writer-bot-thinking.png
assets/mascot/writer-bot-success.png
assets/backgrounds/writer-desk-dark.jpg
assets/textures/leather-dark.webp
assets/textures/aged-paper.webp
assets/textures/brass-noise.webp
assets/covers/project-cover-placeholder.webp
assets/covers/chapter-card-placeholder.webp
assets/icons/nav-icon-set.svg
```

### 8.2 可延后资产

```text
assets/mascot/writer-bot-blink.webp
assets/mascot/writer-bot-wave.webp
assets/backgrounds/desk-props-layer-left.png
assets/backgrounds/desk-props-layer-right.png
assets/characters/avatar-placeholder-set.webp
assets/worldbuilding/location-thumbnail-set.webp
```

### 8.3 资产规范

潮玩机器人：

```text
格式：PNG / WebP
背景：透明
推荐尺寸：1200 × 1200 或以上
页面显示：260 - 420 px
焦点：脸、眼睛、笔尖或卷轴配件
不可被导航、按钮或弹窗遮挡
```

背景书桌：

```text
格式：JPG / WebP
推荐尺寸：至少 2560 × 1440
处理方式：cover
暗角：允许
细节：两侧丰富，中间主面板区域保持低干扰
```

纹理：

```text
皮革纹理：用于主面板底
羊皮纸纹理：用于章节卡、灵感卡
黄铜噪声：用于边框、徽章、仪表
透明度：纹理层默认 4% - 12%
```

## 9. 真实组件边界

以下必须是真实前端组件，不应做成一张图片。

### 9.1 ProjectSidebar

内容：

```text
Current Project
Projects
Inspiration
Characters
Worldbuilding
Outline
Review
```

状态：

```text
default
hover
selected
notification
collapsed
disabled
```

交互：

- 切换模块；
- 当前项目卡可打开项目选择器；
- 通知点表示该模块有未处理任务或新灵感；
- 收起后保留图标。

### 9.2 WorkspaceHeader

内容：

```text
当前视图标题：Novel Structure Map
视图切换：Map / Timeline / List
当前小说状态
搜索 / 命令入口
```

状态：

- 当前 tab 高亮；
- 命令入口可呼出 Agent；
- 视图切换只改变中央工作区，不重置项目。

### 9.3 NovelStructureMap

功能：

- 显示整本小说的篇章结构；
- 章节卡横向排列；
- 按 Act / 卷 / 篇章分组；
- 支持选中章节；
- 支持拖拽排序；
- 支持进入具体篇章泳道图；
- 显示关键节点：Inciting Incident、First Turning Point、Midpoint、Second Turning Point、Crisis、Climax。

章节卡字段：

```text
chapterId
order
title
subtitle
coverImage
actId
status
clueCount
foreshadowingCount
riskLevel
selected
locked
```

第一版状态：

```text
Draft
Planned
Writing
Reviewing
Done
Locked
```

### 9.4 InspirationVault

功能：

- 展示当前小说的灵感卡片；
- 卡片来自该小说独立灵感库；
- 灵感可以拖入结构地图或线索链；
- 未采用的灵感不会进入正史记忆。

卡片字段：

```text
inspirationId
title
summary
type
source
tags
status
relatedChapterIds
createdAt
```

状态：

```text
Inbox
Organized
Incubating
Adopted
Used
Archived
```

### 9.5 CharacterGraph

功能：

- 显示当前篇章或全书关键人物关系；
- 可切换全书关系、当前篇章关系、当前视角人物认知关系；
- 节点点击打开人物卡；
- 边点击打开关系变化记录。

节点字段：

```text
characterId
name
role
avatar
currentState
faction
visibilityScope
```

边字段：

```text
sourceCharacterId
targetCharacterId
relationshipType
trustLevel
conflictLevel
lastChangedEventId
```

### 9.6 ClueAttributionPanel

功能：

- 展示线索从提供到触发、接收、回收的完整链路；
- 支持点击任意节点打开线索详情；
- 缺少提供者、触发者、接收者或回收计划时显示未闭合风险；
- 与篇章泳道图和长期记忆层联动。

链路结构：

```text
Provider → Trigger → Receiver → Payoff
```

线索节点强制字段：

```text
clueId
content
creator
provider
trigger
receiver
observer
concealer
misledTarget
readerVisibility
credibility
pointsTo
payoffEventId
canonStatus
sourceRef
```

### 9.7 AgentOrchestrationPanel

包含：

```text
Agent Tasks
Subagents
Skills
Memory Layer
Review Checklist
```

功能：

- 显示当前 Agent 任务队列；
- 展示哪些 Subagent 正在参与；
- 显示调用的 Skill；
- 显示当前上下文检索和记忆同步状态；
- 展示审查清单。

任务字段：

```text
taskId
title
type
status
assignedSubagent
skills
model
progress
createdAt
updatedAt
requiresApproval
```

任务状态：

```text
Queued
Running
WaitingApproval
Done
Failed
Cancelled
```

## 10. 可视化引擎建议

### 10.1 第一版推荐

```text
小说结构地图：React + SVG
人物关系图：React Flow 或 Cytoscape
线索归因链：SVG + React 节点组件
篇章泳道图：React Flow 或自定义 SVG 网格
```

### 10.2 不建议第一版使用

```text
Three.js 还原整个界面
所有图谱都用 Canvas
复杂物理拖拽动画
实时 3D 机器人
完整游戏化场景
```

原因：

- 该产品核心是写作和结构化创作，不是 3D 游戏；
- 第一版需要先验证信息架构和 Agent 工作流；
- 复杂渲染会延迟核心功能落地。

## 11. 组件状态与交互

### 11.1 通用状态

所有可操作组件至少支持：

```text
default
hover
pressed
selected
disabled
loading
error
```

### 11.2 章节卡交互

- 单击：选中章节；
- 双击：进入篇章泳道图；
- 拖拽：调整章节或篇章顺序；
- 右键或更多菜单：打开章节操作；
- 风险徽标：点击打开审查报告。

### 11.3 线索节点交互

- 单击：打开线索详情；
- 拖拽：调整线索出现位置；
- 连线：建立提供、触发、接收、回收关系；
- 缺字段：显示黄色或红色风险边框；
- 写入正史：必须经过用户确认。

### 11.4 Agent 任务交互

- 新建任务；
- 暂停任务；
- 查看任务步骤；
- 查看调用的 Skill 和模型；
- 审批写回；
- 查看失败原因和重试。

## 12. 动效规格

动效只表达状态变化，不做装饰性循环。

### 12.1 页面进入

```text
Trigger: 打开小说项目
Action: 主控制台轻微上浮，背景暗场渐显，当前项目卡点亮
Duration: 420ms
Easing: ease-out cubic
Fallback: 无位移，仅 opacity 变化
```

### 12.2 章节选中

```text
Trigger: 用户点击章节卡
Action: 章节卡边框暖橙点亮，相关线索链轻微高亮
Duration: 180ms
Easing: ease-out
Fallback: 直接切换 selected 样式
```

### 12.3 Agent 运行

```text
Trigger: Agent task status = Running
Action: 任务行出现低频进度光，Memory Layer 进度条更新
Duration: 状态持续期间
Easing: linear / step update
Fallback: 静态 running badge
```

### 12.4 机器人反馈

```text
Trigger: 任务开始 / 完成 / 等待审批
Action: 切换 mascot idle / thinking / success 资产
Duration: 300ms crossfade
Easing: ease-in-out
Fallback: 静态 idle 图
```

## 13. 数据与 UI 的关系

UI 不应只展示假文本。每个主要区域都要对应未来数据结构。

```text
Novel Project
├─ Structure Map
│  ├─ Acts
│  ├─ Chapters
│  └─ Story Milestones
├─ Inspiration Vault
├─ Character Graph
├─ Clue Attribution Chains
├─ Agent Tasks
├─ Skills
├─ Subagents
└─ Memory Layer
```

关键约束：

- 当前小说必须是所有数据查询的根；
- 灵感库按小说隔离；
- 线索归因链必须保留来源和版本；
- 任何正史写入都要可追溯；
- UI 中的节点要能反向打开对应数据卡。

## 14. MVP 范围

### 14.1 MVP 必做

第一版应实现：

```text
AppShell 桌面布局
左侧 ProjectSidebar
中央 NovelStructureMap 静态数据驱动
底部 ClueAttributionPanel 静态数据驱动
右侧 AgentOrchestrationPanel 静态数据驱动
基础主题 token
章节选中联动线索链高亮
潮玩机器人临时静态资产
背景氛围临时静态素材
```

### 14.2 MVP 可选

```text
章节拖拽排序
人物关系图真实交互
灵感卡拖入结构图
Agent 任务动态执行
节点详情抽屉
工作模式切换
```

### 14.3 MVP 不做

```text
实时 3D 机器人
复杂多用户协作
完整模型调用与任务编排后端
所有图谱的复杂编辑能力
多平台发布连接器
移动端完整适配
```

## 15. 实现分期建议

### Phase 1：视觉骨架

- 搭建桌面端 AppShell；
- 还原主视觉布局；
- 接入临时背景素材和机器人静态资产；
- 建立 token；
- 用 mock 数据填充主要区域。

### Phase 2：结构地图可交互

- 章节卡选中；
- 章节和里程碑连线；
- 章节详情弹层；
- 与底部线索链联动。

### Phase 3：线索归因链

- Provider / Trigger / Receiver / Payoff 节点；
- 缺字段风险提示；
- 线索详情卡；
- 与篇章泳道图数据结构对齐。

### Phase 4：Agent 编排面板

- 任务队列状态；
- Subagent 和 Skill 展示；
- Memory Layer 检索状态；
- 审查清单联动。

### Phase 5：品牌资产与动效

- 机器人状态图；
- 背景分层；
- 选中、运行、完成动效；
- 专注模式。

## 16. 验收标准

### 16.1 视觉验收

- 第一屏截图有明确品牌识别度；
- 不像普通 SaaS 后台；
- 不像 20 年前的色块网页；
- 潮玩机器人和 UI 属于同一材质世界；
- 暗色背景下正文仍可读；
- 发光只用于状态和焦点，不污染全局。

### 16.2 信息架构验收

- 用户能一眼知道当前小说项目；
- 用户能看到小说结构地图；
- 用户能看到 AI 正在做什么；
- 用户能看到线索从哪里来、如何触发、谁接收、在哪里回收；
- 用户能区分灵感、正文、正史记忆和 Agent 任务。

### 16.3 交互验收

- 点击章节卡后，相关区域有清晰联动；
- 点击线索节点能看到归因详情；
- 右侧任务状态能表达 Queued / Running / Done；
- 页面能在 1440 × 900 下保持可用；
- 背景资产不会遮挡核心操作。

### 16.4 性能验收

- 首屏背景和机器人资源经过压缩；
- 默认不加载高成本动画；
- 低性能设备可关闭动效；
- 复杂图谱节点数量过多时支持折叠或虚拟化；
- 工作模式下减少背景和纹理层。

## 17. 风险与取舍

### 17.1 视觉风险

风险：过度追求宣传图效果，导致真实工作台拥挤。  
取舍：保留品牌模式，同时设计更干净的工作模式。

### 17.2 工程风险

风险：图谱、拖拽、Agent 状态、资产动效同时做会拖慢 MVP。  
取舍：先用静态数据驱动组件，再逐步替换为真实后端和图谱编辑。

### 17.3 可读性风险

风险：暗色皮革、羊皮纸、黄铜边框容易导致对比不足。  
取舍：正文和状态标签必须通过对比度检查，纹理层透明度保持低。

### 17.4 资产依赖风险

风险：没有稳定的机器人和背景资产，界面质感会塌。  
取舍：优先制作少量高质量核心资产，而不是大量低质量装饰。

## 18. 后续实施前需要确认

进入实现计划前，建议用户确认：

1. 第一版是否以 Web / Electron / Tauri 为目标；
2. 机器人资产是先用生成图，还是后续再做 3D 统一建模；
3. MVP 是否先做“静态数据驱动的可视化首页”；
4. 是否同步设计“专注写作模式”；
5. 第一版图谱引擎选择 React Flow、Cytoscape，还是自定义 SVG。

推荐默认选择：

```text
目标平台：桌面 Web，后续可封装 Electron / Tauri
机器人资产：先用生成图透明 PNG / WebP
MVP：静态数据驱动的可视化首页
工作模式：保留设计入口，但不在第一版完整实现
图谱引擎：结构地图先自定义 SVG，人物图谱后续用 React Flow 或 Cytoscape
```

## 19. 结论

该 UI 方向可实现，但应按“资产层 + 真实组件层 + 图谱交互层 + Agent 状态层”拆解。第一版的目标不是把参考图每个装饰细节都复刻出来，而是还原它的核心产品感：

> 一个有潮玩伙伴、有小说结构地图、有线索归因、有 Agent 编排状态的高级创作控制台。

只要第一版守住项目边界、结构地图、线索归因、Agent 面板这四个核心区域，就能形成区别于普通 AI 写作器的产品气质。
