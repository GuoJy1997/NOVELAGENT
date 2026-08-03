# Novelora 中景气浪夹层设计

日期：2026-07-30  
状态：用户已批准

## 目标

实现参考图中的真实合成关系：书本气浪遮盖无功能含义的大型栏目外框，但不会遮盖 Act、Chapter、灵感条目、人物节点和线索节点等功能组件；导航文字直接浮在书本场景上，不形成独立侧栏表面。

## 核心判断

仅把外层容器设为透明无法复现参考图。透明只能让背景从后方显露，不能让气浪压住外框边线。必须把气浪放在外框与功能内容之间。

## 图层

1. z0：`book_background.png` 基础背景。
2. z1/普通绘制层：大型栏目外框及其浅白底色、边框。
3. z2：复用 `book_background.png` 的中景绘制层，使用 `mix-blend-mode: multiply`；白色画布对下层近似中性，只让书本、晶体和薄荷气浪覆盖外框。
4. z3：导航文字、顶部控件、栏目标题、功能卡片、节点、连接线、按钮和 Agent 内容。
5. z4：Nova 前景吉祥物。

同一 URL 的背景图片在浏览器缓存中只下载一次，第二次渲染仅用于建立中景合成层，不新增视觉素材。

## 结构层

- `.cockpit-sidebar`、`.cockpit-workspace`、`.cockpit-right-panel` 不得建立统一的 z3 堆叠上下文。
- Structure Map、Chapter Swimlane、Inspiration、Character、Clue 外框恢复极浅结构表面，位于气浪下方。
- 外框不使用 `backdrop-filter`，避免气浪被模糊。
- 外框边线允许被中景气浪局部掩盖。

## 功能层

以下透明包装器或功能内容提升到 z3：

- `.project-sidebar-content`
- `.workspace-topbar-content`
- `.agent-panel`
- `.workspace-section-heading`
- `.structure-map__scroll`
- `.chapter-swimlane__scroll`
- `.chapter-selection-actions`
- `.inspiration-vault__grid`
- `.character-graph__viewport`
- `.character-graph__legend`
- `.clue-attribution-flow__list`

内部内容岛继续使用 96% 白色。普通导航按钮保持透明，只有选中项具有局部浅绿色底色。

## 混合与响应式

- 中景层与基础背景使用同样的 `object-fit`、`object-position` 和 reduced-motion 行为，保证图像严格对齐。
- 中景层使用可调透明度，避免重复绘制造成书本过深。
- 900px 以下隐藏中景覆盖层，仅保留降低存在感的基础背景，避免移动端正文被气浪干扰。
- 中景层永远 `pointer-events: none`。

## 验收

- 1672×941 下，大型栏目外框的边线和浅白底色会被气浪局部盖住。
- Act、Chapter、灵感条目、人物节点和线索节点保持完整白色，不被气浪染色。
- 导航文字与图标没有整块白色父级表面。
- 页面只下载两个唯一位图 URL：背景与 Nova；背景 URL 可以在 DOM 中出现两次。
- 四档视口无页面级横向溢出、控制台错误或资源失败。
- 全量测试、Lint 与构建通过。
