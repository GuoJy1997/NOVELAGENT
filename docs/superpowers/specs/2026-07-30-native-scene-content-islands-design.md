# Novelora 原生场景与白色内容岛设计

日期：2026-07-30  
状态：用户已批准

## 问题

当前页面把侧栏、顶部、右侧栏和五个主要栏目都实现为带背景色与 `backdrop-filter` 的玻璃面。即使这些表面只有较低白色透明度，书页气浪仍会先被整块漂白和模糊，再被内部卡片二次覆盖，因此背景看起来像隔着界面，而不是界面的原生空间。

参考图使用的不是“整页玻璃化”，而是“透明空间 + 白色内容岛”：

1. 书本与连续气浪构成统一背景。
2. 导航、顶部工具和栏目布局只负责定位，不形成整块视觉表面。
3. 栏目外框只保留低对比轮廓，不遮罩或模糊背景。
4. 只有承载实际信息或交互的内部组件使用接近纯白的实体表面。
5. Nova 作为独立前景层位于书本附近。

## 图层契约

从后向前：

1. `book_background.png`：书本、晶体底座与连续气浪。
2. 透明布局空间：Sidebar、Topbar、Workspace、Right Panel。
3. 透明栏目轮廓：Structure Map、Chapter Swimlane、Inspiration、Character、Clue。
4. 白色内容岛：Act、Chapter、Inspiration Item、Character Node、Clue Card、Project Card、Search 与操作按钮。
5. `writing_companion.png`：独立前景 Nova。

背景气浪无需拆分为新图层。因为外层空间完全透明，气浪自然穿过栏目标题、空白和卡片间隙；内部内容岛再在局部遮住气浪。

## 外层空间

以下组件必须使用 `background: transparent`，且不得声明 `backdrop-filter` 或 `-webkit-backdrop-filter`：

- `.cockpit-sidebar`
- `.cockpit-topbar`
- `.cockpit-right-panel`
- `.structure-map`
- `.chapter-swimlane`
- `.inspiration-vault`
- `.character-graph`
- `.clue-attribution-flow`

Sidebar 不再渲染全高曲线边界或任何用于模拟独立面板的伪元素。栏目外框保留 `--surface-border-whisper` 圆角轮廓，但移除大面积阴影。

## 白色内容岛

`--surface-inner-card` 调整为 `rgba(255, 255, 255, 0.96)`。以下实际内容组件继续引用该令牌：

- Act、Chapter 与 Add Chapter 卡片
- 灵感条目
- 人物节点
- 线索卡
- 当前项目与连续写作卡
- Nova Lead Card 与 Focus Mode

选中状态保留薄荷绿描边和极浅局部色彩，不允许给整个栏目铺绿色背景。

## 响应式

- 宽屏继续沿用已经批准的渐进退台和紧凑章节泳道。
- 中小屏取消退台，但外层空间仍保持透明。
- 移动端隐藏大型前景 Nova；背景书页降低存在感以保证文本可读。
- 所有尺寸禁止页面级横向溢出。

## 验收

- 1672×941 下，气浪能清晰连续地穿过左侧导航空白、栏目标题和外层容器。
- 气浪只在内部白色内容卡片覆盖范围内消失。
- 左侧导航不再呈现为单独的白色/玻璃面板。
- 外层栏目不存在模糊造成的朦胧矩形区域。
- 内部内容岛保持稳定文本对比度。
- 无控制台错误、资源失败或页面级横向溢出。
- 全量测试、Lint 与生产构建通过。
