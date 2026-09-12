# 笔心首页小窗口等比缩放（fit-scale）设计

日期：2026-08-16
状态：已批准（用户确认方案 A）
关联：`2026-08-14-bixin-desktop-home-visual-design-system.md`（5.2 节适配原则）

## 1. 背景与问题

桌面端（Electron 默认窗口 1728×972，最小 1440×810）与浏览器预览中，当窗口内容区小于 1440×810 时，当前 CSS（`bixin-home.css` 末尾的 `@media (max-width: 1439px), (max-height: 809px)` 块）把 `.bixin-home__frame` 锁为固定 `1416px` 宽并让 `.bixin-home` 横向滚动。用户需要左右滚动才能看全卡片与背景，体验受损。

设计规格 5.2 节规定：1440px 时"允许整体缩放或减少外边距"，且全局原则是"高保真 > 完整响应式"。

历史上曾有一次缩放尝试被 revert（commit a77007c），并留下契约测试禁止 `bixin-home.css` 出现 `transform: scale(`。本设计经用户批准后取代该旧决定。

## 2. 目标与非目标

### 目标

- 任何小于 1416×786 可用区的窗口中，首页（含背景场景、机器人、书本、全部卡片与文字）整体等比缩小，**永不出现横向滚动条**，也不出现因画框 min-height 造成的纵向滚动条。
- 小窗口下画框铺满整个窗口（四边贴合，无"窗中窗"外边距/圆角/阴影）；背景图位于最里层并包围所有卡片（环境光填充：同图 cover 全窗 + 高斯模糊）。
- 窗口 ≥ 1440×810 时视觉与现状完全一致（缩放上限为 1，不放大）。
- 缩放对所有页面生效（首页仪表盘与各工作台页共用同一个 frame）。

### 非目标

- 不重做为流式响应式布局（违背"高保真 > 完整响应式"）。
- 不改变大窗口（≥1440×810）下的任何既有样式与断点行为。
- 不调整 Electron 最小窗口限制（1440×810 保持不变；缩放兜底更小的浏览器预览窗口）。
- 不缩放 App 层的全局反馈浮层 `.echo-action-feedback`（它在 BixinHomePage 之外，属视口级覆盖层）。

## 3. 方案概述

窗口可用内容区小于设计画布时，把整个 `.bixin-home__frame` 当作一块 1416×786 的固定画布，用 `transform: scale()` 等比缩小至刚好容纳，居中显示。缩放系数由一小段 JS 实时计算，经 CSS 变量 `--bixin-fit-scale` 注入。

选用 1416×786 作为缩放画布，因为这是既有紧凑断点（≤1440/≤810）已调校好的最小高保真布局；小于它的窗口不再需要新的布局决策，只做纯缩放。

## 4. 架构与数据流

### 4.1 新增 hook：`useFitScale`

位置：`apps/web/src/features/novelora-cockpit/components/home/useFitScale.ts`

- 导出纯函数 `computeFitScale(contentWidth: number, contentHeight: number): number`：
  - 返回 `min(1, contentWidth / 1416, contentHeight / 786)`。
  - 输入为 0 或非有限数（jsdom 等环境）时返回 1，保证永不产生非法 transform。
- 导出 hook `useFitScale<T extends HTMLElement>(): RefObject<T | null>`：
  - 挂到 `.bixin-home` 根元素；用 `ResizeObserver` 监听其**内容盒**尺寸（`getBoundingClientRect` 减去 computed padding，或直接读 contentBox 信息）。
  - 环境无 `ResizeObserver` 时（jsdom、旧浏览器）回退为 `window` 的 `resize` 监听 + 首次测量。
  - 每次测量后把 `computeFitScale` 的结果写入 `el.style.setProperty('--bixin-fit-scale', String(scale))`。
  - 卸载时断开 observer / 移除监听。

### 4.2 组件接入

`BixinHomePage` 调用 `useFitScale`，把返回的 ref 挂到 `.bixin-home` 根 `div`。工作台页（写作、大纲、人物等）因在 frame 内部而自动随动缩放。

`SceneLayer` 增加两个结构（仅 fit 模式有视觉作用）：

- `__ambient`：环境填充 img（同图源），fit 模式下 cover 全窗 + `blur(48px)` + `scale(1.15)`，其余模式 `display: none`。
- `__canvas`：包裹原有 `__base` 与 `__subject`（机器人蒙版）的配准包装层，非 fit 模式 `position: absolute; inset: 0`（配准坐标与加包装前完全一致），fit 模式下作为设计画布的一部分居中缩放。

## 5. CSS 改动（仅小窗口块）

小窗口下采用"环境光填充"架构：画框铺满整个窗口（四边贴合），同一背景图 cover 全窗并高斯模糊作为环境层（最里层），已配准的场景/机器人/界面/书本保持 1416×786 设计画布居中缩放，卡片浮于背景之上、被背景包围。

基础规则新增（非小窗口模式零影响）：

```css
.bixin-scene-layer__ambient {
  display: none;               /* 环境填充层只在 fit 模式显示 */
}

.bixin-scene-layer__canvas {   /* 场景配准包装层：base + subject 机器人 */
  position: absolute;
  inset: 0;
}
```

只修改 `bixin-home.css` 末尾的 `@media (max-width: 1439px), (max-height: 809px)` 块：

```css
@media (max-width: 1439px), (max-height: 809px) {
  .bixin-home {
    position: relative;
    min-width: 0;              /* 覆盖基础规则的 min-width: 1440px —— 消除视口级横向滚动 */
    padding: 0;                /* 四边贴合窗口 */
    overflow: hidden;
  }

  .bixin-home__frame {
    position: absolute;        /* 画框脱流并铺满窗口 */
    inset: 0;
    width: auto;
    height: auto;
    min-height: 0;
    margin: 0;
    border-radius: inherit;    /* 父级无圆角 → 0，去掉"窗中窗"外观 */
    box-shadow: none;
    transform: none;
  }

  .bixin-scene-layer {
    left: 0;                   /* 背景延伸到导航栏后方，真正满窗 */
  }

  .bixin-scene-layer__ambient {
    display: block;            /* 环境层：同图 cover + 模糊，包围画布 */
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(48px);
    transform: scale(1.15);    /* 吃掉模糊造成的边缘羽化 */
  }

  .bixin-scene-layer__canvas,
  .bixin-home__interface,
  .bixin-book-layer {
    position: absolute;        /* 已配准内容保持设计画布，居中缩放 */
    top: 50%;
    left: 50%;
    width: 1416px;
    height: 786px;
    transform: translate(-50%, -50%) scale(var(--bixin-fit-scale, 1));
  }
}
```

要点：

- 基础规则里 `.bixin-home { min-width: 1440px }` 与 `global.css` 的 `html, body, #root { overflow-x: visible }` 叠加，正是小窗口下**视口级**横向滚动条的来源，因此小窗口块必须覆盖 `min-width: 0`，仅改容器 overflow 不够。
- **已配准内容必须脱离文档流**（`position: absolute`）：`transform: scale()` 只影响绘制不影响布局，留在流中的 1416×786 布局盒会把容器撑到 810px 高，既产生页面级纵向滚动条，又让 hook 读到被画布污染的高度（循环测量：把 786 当作可用高度，导致缩放系数偏大、内容被裁）。脱流后容器高度诚实等于视口高度，测量自然正确。
- 居中用 `top/left: 50%` + `translate(-50%, -50%)`：与缩放系数无关的中心定位；基础规则的 `margin-inline: auto` 不能残留在缩放层上（CSS Align 规定 auto 边距优先于自对齐，负空间下归零会导致起点对齐，表现为一侧空白、另一侧被裁）。
- 环境层与配准场景用同一图源，模糊层在视觉上掩盖了两层配景的裁切差异，机器人重影风险由 `__canvas` 包装层保持原始配准来消除（不直接拉伸 `__base`）。
- 基础规则与 `@media (max-width: 1440px), (max-height: 810px)` 紧凑块**完全不动**；≥1440×810 窗口下媒体查询不命中，`--bixin-fit-scale` 计算结果恒为 1，视觉零变化（保留画框圆角/阴影/外边距的既定 chrome）。

## 6. 契约测试更新（`src/styles/bixin-home.test.ts`）

旧契约 `uses an unscaled full-window desktop frame` 中"全文件禁止 `transform: scale(`"一条作废，替换为新契约（测试名改为如 `fits small windows with proportional scaling`）：

- 基础 `.bixin-home` / `.bixin-home__frame` 规则中**仍禁止** `transform: scale(`（大窗口零变化）。
- 小窗口块（`@media (max-width: 1439px), (max-height: 809px)`）内**必须**：
  - `.bixin-home` 为 `position: relative`、`min-width: 0`、`padding: 0`、`overflow: hidden`（禁止再出现 `overflow: auto`）；
  - `.bixin-home__frame` 为 `position: absolute; inset: 0` 铺满窗口，`margin: 0`、`border-radius: inherit`、`box-shadow: none`、`transform: none`；
  - `.bixin-scene-layer` 为 `left: 0`（背景延伸到导航栏后方）；`__ambient` 为 `display: block` + `object-fit: cover` + `filter: blur(...)`；
  - `.bixin-scene-layer__canvas, .bixin-home__interface, .bixin-book-layer` 共享居中画布声明：`position: absolute; top/left: 50%; width: 1416px; height: 786px; transform: translate(-50%, -50%) scale(var(--bixin-fit-scale, 1))`。
- 基础规则新增断言：`__ambient` 默认 `display: none`、`__canvas` 为 `position: absolute; inset: 0`（大窗口配准不变）。
- 继续保留"禁止 `--echo-scale`"断言——本方案使用笔心自有变量 `--bixin-fit-scale`，不触碰 echo 遗留缩放机制。

## 7. 新增测试

- `useFitScale.test.ts`：`computeFitScale` 三种情形——充足空间返回 1（不放大）、宽度受限、高度受限；非法输入（0 / NaN）返回 1。
- `BixinHomePage.test.tsx` 增补：渲染后根元素带有 `--bixin-fit-scale` 内联变量；jsdom 无 `ResizeObserver` 时组件不报错（验证回退路径）；场景层渲染 3 张场景图（ambient/base/subject-image 顺序与类名）及 `__canvas` 包装层。

## 8. 错误处理与边界

- jsdom / 无 `ResizeObserver` 环境：回退 `window.resize`，首次渲染即写入 scale=1（jsdom 布局尺寸为 0，`computeFitScale` 守卫返回 1）。
- 窗口恰好 1416×786 可用区：scale=1，与现状一致。
- 极宽但极矮窗口（如 2000×700）：命中高度媒体查询，画布按高度比例缩小居中——与现行"高度触发紧凑布局"的行为一致，只是从滚动变为缩放。
- 缩放后 44px 触控目标与 focus 描边随内容按比例缩小：这是用户明确选择的整体缩放语义的固有结果；桌面端最小窗口 1440×810 下缩放系数 ≈0.99，无实际影响。

## 9. 验证

- `npm run test:web`、`npm run lint:web`、`npm run build:web` 全绿（仓库根目录运行）。
- 浏览器/Electron 手动核对 1366×768 等小窗口：无横向滚动条，背景与卡片完整可见且等比缩小。

## 10. 文档同步

- 实施后更新 `2026-08-14-bixin-desktop-home-visual-design-system.md` 5.2 节：在"1440px"条目补充"小于 1416×786 可用区时整体等比缩放（fit-scale），不再滚动"。
