# AI Novel Writing Studio - Book Origin Visual System

## 核心理念

采用 Book-Origin Visual System：

一本打开的未来感书籍位于空间左下角，书页产生薄荷绿色玻璃能量流，
并穿透整个 AI 写作工作区。

视觉层级：

Book Background
→ Page Energy
→ Glass UI Layer
→ Mascot Companion

---

## 视觉资产

最终保持两个核心视觉资产：

assets/

- book_background.png
  - 打开的精致书籍
  - 晶体书底座
  - 薄荷绿色书页能量流
  - 柔和体积光

- writing_companion.png
  - 白色陶瓷机器人
  - 黑色玻璃面罩
  - 薄荷绿色透明树脂
  - 钢笔主题元素

---

## 前端实现结构

App

├── BookBackground
│
├── GlassWorkspace
│   ├── StructureMap
│   ├── ChapterTimeline
│   ├── CharacterGraph
│   └── MemoryPanel
│
└── MascotCompanion


---

## 图层设计

z-index:

0  背景书与流体

1  半透明玻璃UI

2  功能组件

3  吉祥物


---

## 实现原则

代码负责：

- 页面布局
- 卡片组件
- 动效
- 交互


视觉资产负责：

- 书
- 能量流
- 吉祥物


不要使用 CSS/Three.js 重建主体视觉资产。

---

## 动画建议

背景：

20-30 秒缓慢漂浮

吉祥物：

idle:
轻微上下浮动

wave:
挥手动画

thinking:
轻微倾斜


整体目标：

进入一本会思考的未来书籍。
