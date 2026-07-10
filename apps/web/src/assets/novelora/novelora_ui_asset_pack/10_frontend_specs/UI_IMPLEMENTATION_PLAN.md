# Novelora AI Writing Studio — UI 还原与前端实现方案

## 1. 目标

完全还原参考图里的桌面端首屏：明亮象牙白大底、珊瑚橙主强调、薄荷绿/天空蓝辅助、少量果冻紫点缀；整体是“高端消费级写作工具 + 潮玩 AI 伙伴 + 小说结构指挥台”，不是传统 B 端后台。

核心体验不是“表格管理小说”，而是让作者在一个可缩放的创作驾驶舱里，从整本书结构图进入章节泳道，再进入线索、人物、灵感和 AI 代理任务。

---

## 2. 哪些用代码实现，哪些必须准备视觉资产

### 代码实现为主

这些不建议切图，应该用前端组件实现，以保证清晰、可响应、可交互：

- 左侧导航栏、项目列表、按钮、搜索框
- Novel Structure Map 的 Act 卡片、连接线、节点、百分比
- Chapter Swimlane 章节卡片、选中态、Add Chapter 占位卡
- Inspiration Vault 容器、筛选 tabs、图片网格
- Character Relationship Graph 的节点和连线
- Clue Attribution Flow 的四段节点和纵向连线
- Agent Orchestration 的任务条、进度条、agent 列表
- Memory Layer、Review Checklist、Focus Mode
- 底部项目 quote / word count / last save 信息条
- hover、selected、drag、zoom、popover、drawer、tooltip 状态

### 视觉资产准备

这些需要提前准备，作为品牌与质感来源：

- Logo 与 app icon
- Mascot 主形象、头像、小贴纸形态
- 左侧项目封面图
- 灵感库缩略图
- 人物头像
- Agent / subagent 头像
- 模块 icon、导航 icon、状态 badge
- 纸张纹理、明亮背景渐变、玻璃丝带/装饰物
- 空状态插画、锁定章节 icon、星标/火焰/记忆/线索图标

---

## 3. 推荐信息架构

### 一级导航

1. Home
2. Structure
3. Characters
4. Worldbuilding
5. Inspiration
6. AI Review
7. Projects

### 首屏核心模块

- 顶部：项目名、类型、字数目标、搜索、通知、用户头像
- 左栏：品牌、导航、项目列表、写作 streak、AI mascot 展示
- 中央上：Novel Structure Map
- 中央中：Chapter Swimlane
- 中央下：Inspiration Vault、Character Relationship Graph、Clue Attribution Flow
- 右栏：AI Agent Orchestration、Agent System、Memory Layer、Review Checklist、Focus Mode
- 底部：当前 focus、项目编号、slogan、字数进度、最近保存

---

## 4. 功能设计

### 4.1 Novel Structure Map

展示整本小说的宏观结构：

- Act I / Act II / Act III / Epilogue
- 每个 Act 有进度百分比、章节范围、状态
- 用贝塞尔曲线连接结构节点
- 点击 Act 后同步筛选 Chapter Swimlane
- 支持 zoom、grid/list 视图切换

数据字段：

```ts
type Act = {
  id: string
  title: string
  subtitle: string
  chapterRange: string
  progress: number
  color: "mint" | "amber" | "coral" | "lilac"
  selected?: boolean
}
```

### 4.2 Chapter Swimlane

展示当前 Act 下的章节节奏：

- 章节号
- 节拍名，如 Turning Point / Midnight Betrayal
- 字数
- 相关角色头像
- 线索数量
- 选中态：白底 + 珊瑚描边 + 柔和投影，而不是黑卡

支持：

- 横向滚动
- 拖拽重排
- 点击进入章节详情
- 章节间线索连接
- Add Chapter 空卡

### 4.3 Inspiration Vault

灵感素材库：

- Quotes / Images / Ideas / Refs tabs
- 主灵感卡片
- 多张缩略图
- 可拖入章节或线索节点
- 可由 AI 自动提取主题、地点、人物意象

### 4.4 Character Relationship Graph

人物关系图：

- 中心 protagonist
- ally / rival / family / mentor 多种关系线
- 支持缩放、拖动、点击节点打开人物卡
- 关系线颜色与 legend 保持一致

建议技术：

- React Flow 或 xyflow
- 自定义 node 组件
- SVG curve edge
- 关系线动画仅在 idle 状态轻微流动

### 4.5 Clue Attribution Flow

线索归因链路：

- Clue Origin
- Trigger
- Receiver
- Payoff

这个模块非常关键，它体现“novel-native AI agent”的差异化：不是普通文本生成，而是追踪伏笔、触发、接收者、回收。

### 4.6 AI Agent Orchestration

右侧 AI 代理编排：

- 当前主 agent：Nova / Lead Story Architect
- Active Tasks：Plot Architect、Character Scout、Lore Keeper、Tone Weaver
- Agent System：Subagents、Skills
- Memory Layer：World Lore、Character Facts、Plot Cues、Writing Notes
- Review Checklist：Plot Consistency、Pacing Check、Clue Payoff 等

支持：

- 任务状态：queued / running / done / blocked
- 进度条
- 点击进入 agent 运行日志
- 手动触发 review
- focus mode 开关

---

## 5. 前端技术方案

推荐栈：

- Next.js + React + TypeScript
- Tailwind CSS 或 CSS Modules
- Framer Motion：微动效
- React Flow / xyflow：人物关系图、结构图
- Zustand：局部状态管理
- TanStack Query：数据请求
- dnd-kit：章节拖拽与灵感拖入
- Lucide React：基础图标，品牌核心图标用本资源包 SVG
- Canvas/SVG 混合：连接线、节点、曲线

目录建议：

```txt
src/
  app/
    projects/[projectId]/structure/page.tsx
  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
      Topbar.tsx
      RightAgentPanel.tsx
    structure/
      NovelStructureMap.tsx
      ActCard.tsx
      ChapterSwimlane.tsx
      ChapterCard.tsx
    vault/
      InspirationVault.tsx
      InspirationCard.tsx
    graph/
      CharacterGraph.tsx
      CharacterNode.tsx
    clues/
      ClueAttributionFlow.tsx
      ClueNode.tsx
    agents/
      AgentOrchestration.tsx
      AgentTaskItem.tsx
      MemoryLayer.tsx
      ReviewChecklist.tsx
    mascot/
      MascotStage.tsx
  data/
    sampleNovel.ts
  styles/
    tokens.css
```

---

## 6. 视觉还原关键

### 6.1 布局比例

- 左栏约 296px
- 右栏约 360px
- 中央内容自适应
- 主画布使用 24px gap
- 每个大卡片圆角 24px
- 小卡片圆角 16-18px

### 6.2 色彩使用规则

- 大面积背景：象牙白 / 暖白
- 主强调：珊瑚橙，用于选中态、主按钮、重要连线节点
- 辅助：薄荷绿、天空蓝，用于记忆、人物关系、进度
- 紫色：只用于 AI 记忆、魔法感小高光
- 黑色：只用于文字、icon、少量品牌星标，不做大面积黑底

### 6.3 质感

- 所有卡片使用轻边框 + 浅投影 + 内部高光
- 选中态用彩色描边、轻发光、小徽章
- mascot 用 3D 潮玩风格，但在前端阶段可先用 SVG/PNG 静态资产
- 背景用轻纸纹，不使用廉价霓虹和重玻璃拟态

---

## 7. 交互设计

### idle 动效

- 选中章节卡片边缘每 4 秒轻微呼吸
- 结构图连接线有极低透明度流动
- mascot 眼睛偶尔 blink
- Agent task 进度条轻微推进 shimmer
- Focus Mode 开关 hover 时有柔光

### 页面交互

- 点击 Act → 更新 swimlane
- 点击 Chapter → 打开右侧章节详情 drawer
- 拖拽灵感卡 → 绑定到 Chapter 或 Clue
- 点击人物节点 → 弹出人物档案
- 点击 Clue Flow → 显示伏笔证据与回收章节
- 点击 Agent Task → 查看 agent 运行过程、引用来源、修改建议
- 点击 Review Checklist → 自动运行结构审查

---

## 8. 数据模型建议

```ts
type NovelProject = {
  id: string
  title: string
  genre: string
  wordGoal: number
  currentWords: number
  status: "drafting" | "reviewing" | "complete"
  cover: string
  acts: Act[]
  chapters: Chapter[]
  characters: Character[]
  clues: ClueChain[]
  inspirations: Inspiration[]
  agents: AgentTask[]
}

type Chapter = {
  id: string
  number: number
  title: string
  beat: string
  actId: string
  wordCount: number
  characterIds: string[]
  clueCount: number
  selected?: boolean
}

type ClueChain = {
  id: string
  origin: ClueEvent
  trigger: ClueEvent
  receiver: ClueEvent
  payoff: ClueEvent
}

type AgentTask = {
  id: string
  agentName: string
  role: string
  task: string
  progress: number
  status: "queued" | "running" | "done" | "blocked"
}
```

---

## 9. 本资源包内容

- `00_design_system/`：色彩、CSS variables、设计 tokens、色卡
- `01_logo/`：Novelora logo 与 app icon
- `02_mascot/`：Nova mascot SVG、头像、贴纸
- `03_icons/`：导航、模块、行为图标
- `04_ui_badges/`：状态与技能 badge
- `05_project_covers/`：小说项目封面
- `06_character_portraits/`：人物头像占位资产
- `07_inspiration_thumbnails/`：灵感库缩略图
- `08_graph_nodes/`：线索、记忆、关系节点资产
- `09_textures_backgrounds/`：纸纹、背景渐变、玻璃丝带装饰
- `10_frontend_specs/`：组件树、示例数据、实现说明
