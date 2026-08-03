# Novelora Book-Origin Visual System 设计

日期：2026-07-29  
状态：用户已批准方案一

## 目标

依据 `assets/design.md` 与新版 `assets/参考图/image.png`，把当前由书本、独立流体、CSS 光雾和旧吉祥物共同组成的视觉舞台，收敛为两个核心资产：

1. `book_background.png`：承担书本、晶体底座、书页能量流和体积光。
2. `writing_companion.png`：承担独立的 Nova 吉祥物前景。

页面应呈现为“进入一本会思考的未来书籍”，而不是在普通仪表盘背后叠加装饰图片。

## 架构

视觉层级：

1. Book Background：固定全画布背景，左下对齐，保持完整书本和向右上延展的能量流。
2. Glass UI Layer：导航、工作区与 Agent 面板使用可读的半透明柔白玻璃。
3. Functional Components：结构图、章节泳道、人物关系、灵感与线索内容。
4. Mascot Companion：独立透明前景层，位于左下书本附近，不拦截交互。

`CockpitVisualStage` 只渲染背景和吉祥物，不再渲染独立书本图、mint-flow 图片、wash、filaments 或其他用于重建主体能量流的 CSS 图层。

## 资产策略

- 将源素材复制到 `apps/web/src/assets/novelora/book-origin/`，纳入 Vite 构建。
- `CockpitVisualStage` 和 `AgentPanel` 共同使用新版吉祥物资产。
- 原 `cockpit-book-hero.webp`、`cockpit-mint-flow.webp` 与旧 mascot 不再被运行时代码引用，但本轮不删除历史资产。
- 不以 CSS、SVG 或 Three.js 重绘书本、能量流和吉祥物主体。

## 响应式

- 1440px：完整展示左下书本、能量流和独立吉祥物。
- 1180px：背景保持左下锚定，缩小吉祥物，避免侵入中央工作区。
- ≤900px：背景降低存在感并调整定位；隐藏大型前景吉祥物，避免遮挡单列内容。
- 所有断点禁止页面级水平溢出。

## 动效

- 背景仅进行 24 秒左右的缓慢漂浮/缩放。
- 吉祥物使用轻微上下浮动，不模拟不存在的骨骼挥手动作。
- `prefers-reduced-motion: reduce` 下全部停止。

## 验收

- 运行时视觉舞台只下载两个核心位图资产。
- 新参考图中的书、晶体底座、薄荷能量流和 Nova 位置关系在桌面端成立。
- UI 玻璃层不会完全遮住背景，也不会因透明度过高损害文字可读性。
- Agent 面板使用新版 Nova。
- 现有交互、ARIA、语义状态颜色、测试和构建不回退。

