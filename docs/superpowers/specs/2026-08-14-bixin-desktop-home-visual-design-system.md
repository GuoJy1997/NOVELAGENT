# 笔心 · Desktop Novel Agent Design System

> 文档角色：**笔心桌面首页视觉设计宪章（Visual Design Charter）**  
> 状态：**Canonical within scope**  
> 生效日期：2026-08-14  
> 权威范围：对外品牌、桌面首页信息架构、三层空间关系、视觉语言、资产与代码边界、首页视觉验收。  
> 非权威范围：完整产品功能架构、领域数据模型、后端/API、Agent 实现，以及未经单独决策的工程栈迁移。  
> 文档关系：在上述权威范围内，本文件取代根目录旧版 [`design.md`](../../../design.md) 与 [Echo UI rebuild design](./2026-08-01-echo-novel-agent-ui-rebuild-design.md) 中冲突的品牌和首页视觉决策；产品底座仍以 [Product Foundation Design](./2026-07-08-novel-agent-product-foundation-design.md) 和编号功能 specs 为准，工程约束以 [`AGENTS.md`](../../../AGENTS.md) 为准。  
> 工程提示：下文的 Tailwind CSS 目前应理解为目标方案而非已落地事实；仓库 Web 端当前仍使用纯 CSS，在有独立迁移决策前，不应仅为符合本文而引入 Tailwind。

---

> 产品对外名称：**笔心**  
> 内部项目代号：**NovelAgent**  
> 产品形态：桌面端 AI 小说创作 Agent  
> 技术基线：Electron + React + TypeScript + Vite + Tailwind CSS  
> 设计基准：1728 × 972 桌面宽屏

---

## 1. 产品定位

“笔心”不是传统的小说编辑器，也不是企业 SaaS 风格的 Dashboard，而是一套带有强叙事感、空间层次和陪伴感的 **AI 小说创作工作台**。

核心体验目标：

- 用户进入首页时首先感受到“故事世界被打开”。
- 吉祥物不是装饰，而是“观察、探索、书写世界”的 AI 创作伙伴。
- 书本不是 Banner 插图，而是整个界面的空间锚点。
- UI 卡片不是贴在纯白页面上，而是像生长在云层与幻想世界之中。
- 整体强调轻盈、幻想、清澈、收藏级质感，避免传统后台系统感。

关键词：

`Fantasy Workspace / Narrative UI / Layered Interface / Soft Green / Cloudscape / Story World / Creative Companion`

---

## 2. 品牌定义

### 2.1 品牌名称

主品牌：**笔心**  
副标题：**AI写作工作室**

首页不使用 NovelAgent 作为对外品牌名。NovelAgent 仅保留在代码、项目目录或内部技术描述中。

### 2.2 品牌图标

应用图标采用：

- 绿色圆角方形底。
- 白色负形留白形成一支钢笔 / 钢笔尖。
- 不使用十字星、羽毛笔或传统文档图标。
- 图标要保持简洁、可识别，适合桌面 Dock、任务栏和启动器。

视觉资产：

```txt
/public/assets/brand/bixin_app_icon.png
```

---

## 3. 视觉核心概念

首页的视觉故事是：

> 吉祥物一手拿钢笔，一手举起望远镜，对着书本中的地图进行观察；地图中的世界被“放大”，延伸成后方真实存在的浮空岛、城堡、山脉、瀑布与云海。

因此，视觉关系必须遵循：

```txt
地图 → 被观察 → 被放大 → 真实世界
```

而不是单纯：

```txt
书 + 插画背景 + Dashboard
```

这种叙事关系决定了整个首页的视觉统一性。

---

## 4. 三层空间结构

这是整个设计最重要的规则。

### Layer 1 — Scene Layer / 场景底层

内容：

- 天空
- 云层
- 浮空岛
- 城堡
- 山脉
- 瀑布
- 植被
- 吉祥物机器人

视觉资产：

```txt
/public/assets/layers/scene_robot_background.png
```

实现规则：

```css
z-index: 10;
pointer-events: none;
```

这一层必须延伸到 Dashboard 区域后方，不能只作为顶部 Hero Banner。

目的：让底部卡片“生长在场景中”。

---

### Layer 2 — Interface Layer / UI 中层

内容：

- 品牌区
- 左侧导航
- 顶部搜索
- Hero 文案
- CTA 按钮
- 项目卡片
- 章节进度
- 人物关系网
- 写作目标
- 世界观与场景日程
- 日历
- 用户信息

实现规则：

```css
z-index: 20;
```

这一层承担全部业务交互。

所有组件必须由 React + Tailwind CSS 实现，不使用截图切图。

---

### Layer 3 — Book Foreground / 书本前景层

内容：

- 打开的书
- 立体地图
- 书签

视觉资产：

```txt
/public/assets/layers/book_foreground.png
```

实现规则：

```css
z-index: 30;
pointer-events: none;
```

书本必须处于最外层。

允许：

- 书本右下角轻微压住人物关系网卡片上沿。
- 书签自然越过卡片边缘。

禁止：

- 遮挡卡片标题。
- 遮挡人物头像。
- 遮挡按钮。
- 遮挡关键数据。

理想遮挡量：

```txt
8–18px：书本主体
16–30px：书签尾部
```

遮挡必须“像自然长出来”，不能刻意。

---

## 5. 设计基准与页面尺寸

### 5.1 基准画布

```txt
Width: 1728px
Height: 972px
```

Electron 默认窗口：

```txt
1728 × 972
```

最小窗口：

```txt
1440 × 810
```

### 5.2 适配原则

当前阶段优先级：

```txt
高保真 > 完整响应式
```

1920px 宽屏：

- 主体比例保持。
- 内容整体居中。
- 不强行将卡片横向拉宽。

1440px：

- 保持布局结构。
- 允许整体缩放或减少外边距。
- 不改变核心卡片顺序。

小于 1416 × 786 可用区（2026-08-16 起实施）：

- 画框锁为 1416×786 固定画布，按 `min(1, 可用宽/1416, 可用高/786)` 整体等比缩放（fit-scale，`--bixin-fit-scale`）。
- 居中显示，不再出现横向滚动条。
- 详见 `2026-08-16-bixin-home-fit-scale-design.md`。

---

## 6. 页面信息架构

```txt
BixinHomePage
│
├── SceneLayer                    // 背景 + 机器人
│
├── InterfaceLayer
│   ├── Sidebar
│   │   ├── Brand
│   │   ├── Home
│   │   ├── Projects
│   │   ├── Outline
│   │   ├── Characters
│   │   ├── Statistics
│   │   ├── Worldbuilding
│   │   ├── Settings
│   │   └── UserProfile
│   │
│   ├── TopBar
│   │   ├── Search
│   │   ├── Notification
│   │   └── Help
│   │
│   ├── Hero
│   │   ├── AI Badge
│   │   ├── Heading
│   │   ├── Description
│   │   ├── Continue Writing
│   │   └── New Project
│   │
│   └── Dashboard
│       ├── ProjectOverviewCard
│       ├── ChapterProgressCard
│       ├── CharacterNetworkCard
│       ├── WritingGoalsCard
│       └── RightBottomGroup
│           ├── SceneScheduleCard
│           └── CalendarCard
│
└── BookForeground                // 最外层书本
```

---

## 7. 首页布局

### 7.1 左侧导航

宽度建议：

```txt
112–118px
```

左侧导航 **不使用一整块白色外层矩形容器**。

每个路由控件直接浮在场景背景上。

结构：

```txt
Logo

首页
项目
大纲
人物
统计
世界观

设置
用户信息
```

### 7.2 Hero 区

左侧文案：

```txt
AI 更懂你的创作

写出让世界
铭记的故事

构思想迷宫，毫不遗漏的
与笔心AI一起开启你的创作之旅。

[继续写作] [新建项目]
```

“故事”使用品牌绿色高亮。

Hero 区不能出现明显白色矩形底块。

文字要像从云层中自然显露。

---

## 8. Dashboard 布局

首页严格控制卡片数量。

不要继续增加更多模块。

### Grid

建议：

```css
grid-template-columns: 1.12fr 1.02fr 1.05fr;
gap: 16px;
```

结构：

```txt
┌────────────────┬───────────────┬────────────────┐
│                │               │                │
│   我的项目     │   章节奋斗    │   人物关系网   │
│                │               │                │
│                ├───────────────┼──────────┬─────┤
│                │   写作目标    │ 场景日程 │日历 │
│                │               │          │     │
└────────────────┴───────────────┴──────────┴─────┘
```

### 我的项目

占两层高度。

包含：

- 项目封面
- 项目名
- 状态
- 简介
- 字数
- 章节
- 世界观
- 完成度
- 打开项目

### 章节奋斗

包含：

- 灵感
- 大纲
- 草稿
- 修订
- 已发布
- 整体进度 35%

### 人物关系网

中心主角 + 周边角色。

关系色：

```txt
盟友       Green
冲突       Red
师徒/引导  Purple
爱慕       Blue
未知       Gray
```

### 写作目标

左侧：

```txt
72% 本月目标
```

右侧：

- 字数目标
- 章节目标
- 修订目标

### 世界观与场景日程

列表型卡片。

每项：

```txt
标题
副标题
状态 Badge
```

### 日历

小尺寸月历。

当前日期使用绿色圆形高亮。

---

## 9. 卡片视觉系统

卡片应该处于“半实体”状态。

不是纯玻璃，也不是完全纯白。

推荐：

```css
background: rgba(255, 255, 255, 0.88);
backdrop-filter: blur(8px);
border: 1px solid rgba(255, 255, 255, 0.70);
border-radius: 24px;
box-shadow: 0 18px 42px rgba(24, 63, 40, 0.06);
```

核心原则：

- 卡片边缘要干净。
- 阴影轻。
- 不使用厚重灰色描边。
- 不使用大面积高饱和绿色背景。
- 主色只用于状态、进度、激活态、CTA。

---

## 10. 色彩系统

### Brand Green

```txt
Green 50   #F5FCF6
Green 100  #EAF7ED
Green 200  #D4F0DC
Green 300  #BAE4C4
Green 400  #8BD59F
Green 500  #48BE69
Green 600  #1EA44F
Green 700  #11843C
Green 800  #0F6A31
Green 900  #0C5227
```

推荐主要使用：

```txt
Primary CTA     Green 600
Hover           Green 700
Active Nav BG   Green 100
Tag BG          Green 50 / 100
Progress        Green 600
```

### Neutral

```txt
Primary Text    #101413
Secondary Text  #5E6662
Muted Text      #929A96
Card White      rgba(255,255,255,.88)
Page White      #F7FAF7
```

---

## 11. 字体系统

### Display / 大标题

推荐：

```txt
Noto Serif SC
Songti SC
Source Han Serif SC
```

用于：

- 笔心品牌名称
- Hero 大标题
- 项目标题（少量）

### UI / Body

推荐：

```txt
PingFang SC
Microsoft YaHei
Noto Sans SC
```

用于：

- 卡片标题
- 数字
- 按钮
- 标签
- 导航
- 正文

### Hero Heading

建议：

```txt
font-size: 68–76px
font-weight: 600
line-height: 1.02–1.08
letter-spacing: -0.03em
```

---

## 12. 按钮设计

### Primary

```txt
背景：Green 600
文字：White
圆角：18px
高度：56px
```

Hover：

```txt
Green 700
translateY(-1px)
```

### Secondary

```txt
背景：rgba(255,255,255,.84)
边框：white / soft gray
文字：#101413
```

禁止：

- 大面积渐变按钮。
- 高亮蓝色按钮。
- 黑色 CTA。

---

## 13. Navigation 控件

### Default

```txt
Transparent
Icon: Neutral 900
Text: Neutral 900
```

### Hover

```txt
rgba(255,255,255,.55)
```

### Active

```txt
Background: Green 100
Icon/Text: Green 700
Radius: 18px
```

---

## 14. 搜索框

顶部右侧。

推荐尺寸：

```txt
Width: 260–300px
Height: 54–56px
Radius: 18px
```

视觉：

```css
background: rgba(255,255,255,.88);
backdrop-filter: blur(8px);
```

结构：

```txt
[Search Icon] 搜索项目...    ⌘K
```

---

## 15. 机器人吉祥物

机器人定位：AI 创作伙伴。

必须保留：

- 白 / 薄荷绿色陶瓷机身。
- 黑色玻璃面罩。
- 金色少量点缀。
- 一手钢笔。
- 一手望远镜。

机器人行为逻辑：

```txt
观察地图 → 理解世界 → 协助创作
```

机器人不能：

- 做成机械战斗机器人。
- 过度赛博朋克。
- 使用深色金属机甲。
- 变成廉价儿童动画风。

---

## 16. 书本设计

书是整个首页的核心视觉锚点。

### 内容

书页不得出现文字。

必须展示：

- 河流
- 城堡
- 森林
- 山地
- 道路
- 小型建筑

地图必须具有明显 3D 高度。

### 角度

- 轻微倾斜。
- 不能完全正对用户。
- 不能角度过大。
- 书签必须跟随书的透视。

### 尺寸

在 1728 基准画布中，建议：

```txt
Width ≈ 390–440px
```

不要过大到抢机器人，也不要过小到失去空间锚点。

---

## 17. 书本与卡片的遮挡关系

书本处于最高层。

正确：

```txt
Book
  ↓
Character Network Card
```

错误：

```txt
Character Network Card
  ↓
Book
```

书本可压住人物关系网的左上 / 上缘少许非功能区。

书签尾部允许进一步进入卡片，但必须保持“不经意”。

---

## 18. 云层与卡片的关系

Dashboard 下方不可突然切换到纯白区域。

场景必须继续向下延伸。

允许：

- 云层从卡片背后露出。
- 底部角落出现少量植被 / 云岛。
- 卡片之间可看见环境色。

禁止：

- 顶部是幻想世界，底部突然变传统 SaaS 白背景。
- 卡片像贴在一张白色网页上。

---

## 19. 动效原则

动效必须弱干扰。

推荐：

### 云层

```txt
6–12s 缓慢 drift
1–3px 位移
```

### 吉祥物

```txt
轻微呼吸 / 浮动
Y: ±3px
Duration: 3–5s
```

### Card Hover

```txt
translateY(-2px)
shadow +10%
```

### Button Hover

```txt
translateY(-1px)
```

不要：

- 粒子满屏飞。
- 强烈霓虹。
- 高频动画。
- Dashboard 卡片持续摇晃。

---

## 20. 前端组件规范

推荐结构：

```txt
src/
├── components/
│   ├── layout/
│   │   ├── SidebarRail.tsx
│   │   ├── BrandHeader.tsx
│   │   ├── TopBar.tsx
│   │   ├── HeroSection.tsx
│   │   └── DashboardGrid.tsx
│   │
│   ├── scene/
│   │   ├── SceneLayer.tsx
│   │   └── BookLayer.tsx
│   │
│   ├── cards/
│   │   ├── ProjectOverviewCard.tsx
│   │   ├── ChapterProgressCard.tsx
│   │   ├── CharacterNetworkCard.tsx
│   │   ├── WritingGoalsCard.tsx
│   │   ├── ScheduleCard.tsx
│   │   └── CalendarCard.tsx
│   │
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── ProgressRing.tsx
│
├── data/
│   ├── home.ts
│   └── nav.ts
│
└── styles/
    └── globals.css
```

---

## 21. 图片资产与代码边界

### 必须使用视觉资产

```txt
scene_robot_background.png
book_foreground.png
bixin_app_icon.png
project-cover.png
```

### 必须由代码生成

```txt
导航
按钮
搜索框
卡片
进度条
圆环
关系线
Tag
Badge
日历
文字
统计指标
```

禁止为了“还原”而把这些 UI 控件全部切成 PNG。

---

## 22. Electron 窗口规范

```js
width: 1728
height: 972
minWidth: 1440
minHeight: 810
```

建议：

```js
backgroundColor: '#f5f8f5'
autoHideMenuBar: true
contextIsolation: true
sandbox: true
```

---

## 23. Cursor 实现优先级

开发顺序必须是：

```txt
1. 先还原页面尺寸
2. Scene Layer
3. Hero 文案
4. Sidebar
5. Dashboard Grid
6. Book Layer
7. 调整 Z-index 和遮挡
8. 微调卡片透明度
9. 字体尺寸与间距
10. Hover / 轻动效
```

不要一开始先做动画。

---

## 24. 验收标准

### 空间

- [ ] 机器人 + 背景属于底层。
- [ ] UI 卡片属于中层。
- [ ] 书本属于最外层。
- [ ] 书本正确压住人物关系网少量非功能区域。
- [ ] 书签不会被卡片反压。

### 视觉

- [ ] 页面主要色彩为白 + 绿色。
- [ ] 没有大面积深绿色色块。
- [ ] 没有蓝色 SaaS 主色。
- [ ] 卡片轻盈、干净、半实体。
- [ ] 云层延伸到底部卡片后方。

### 品牌

- [ ] 产品名称为“笔心”。
- [ ] 图标是绿色背景 + 白色负形钢笔。
- [ ] 不出现旧 Echo 十字标志。
- [ ] 不以 NovelAgent 作为首页品牌标题。

### 内容

- [ ] 首页不堆叠过多卡片。
- [ ] “我的项目”占两层。
- [ ] 其余辅助模块体量更小。
- [ ] 信息层级清晰。

### 工程

- [ ] UI 控件使用 React 实现。
- [ ] 视觉资产和 UI 代码严格分离。
- [ ] 三层资产拥有独立组件。
- [ ] 后续更换书本或背景不需要重写 Dashboard。

---

## 25. 一句话设计原则

> **让“笔心”看起来不是一个放了幻想插图的 Dashboard，而是一套真正生长在故事世界里的创作工作台。**
