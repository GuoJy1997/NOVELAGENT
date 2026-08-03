# Codex 实现任务：Echo Novel-native AI Agent Dashboard

## 1. 任务目标

在现有项目中实现参考图中的桌面端小说创作工作台。若仓库已有框架、组件库、路由与状态管理，沿用现有技术栈；若是空项目，默认使用 React + TypeScript + Vite，并使用普通 CSS/CSS Modules 实现视觉层。

实现必须满足：

- 参考图中的导航、顶栏、Hero 文案、按钮、数据卡片和右侧 AI 助手均为真实代码组件；
- `assets/hero-background-clean.png` 是唯一主视觉背景；
- 背景保持鲜明、清晰、纯白，不加 blur、opacity、灰色蒙层或低饱和滤镜；
- 书本与 UI 形成原生咬合关系，而不是“卡片半透明后透出书本”；
- 首先以 1672 × 941 画布完成高保真复刻。

## 2. 不可妥协的视觉规则

### 2.1 书与 Chapter Timeline 的遮挡关系

这是本页面最重要的实现点。

1. 书本是完整、不透明的视觉主体。
2. 书本视觉上位于 `Chapter Timeline` 外层大卡片的前方。
3. 书本压到外层卡片的位置，外层卡片的顶边、圆角、阴影和轮廓都必须消失。
4. 不能通过降低整张 Timeline 卡片的透明度实现；`opacity` 必须保持 1。
5. `Ch.1` 至 `Ch.5` 的章节小卡片保持正常、不透明、可点击，不跟着外层轮廓一起裁切。
6. 章节进度条必须位于章节小卡片下方，避免被书的下缘遮住。
7. 右侧 `AI Writing Partner` 卡片不受书本遮挡，保持完整顶边与圆角。

推荐实现不是“把卡片做透明”，而是把前两张大卡片拆成：

- `panel-content`：标题、章节小卡片、文本、图标，正常处于前景；
- `panel-surface`：白色实体底板和阴影；
- `occluded-cap`：顶部可见的有限轮廓段；
- `book-occlusion-gap`：书本经过处不绘制 `panel-surface`，因此背景中原生、不透明的书自然显露。

也就是说：**被遮挡区域不画卡片，而不是把卡片画出来再虚化或透明化。**

### 2.2 背景图规则

```css
.heroBackground {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: #fff url('/assets/hero-background-clean.png') center top / 100% auto no-repeat;
  filter: none;
  opacity: 1;
  pointer-events: none;
}
```

- 1672 × 941 基准画布下使用 1:1 对齐；
- 禁用 `filter: blur()`、`brightness()`、`saturate()` 和半透明白色遮罩；
- 不要把背景压成低质量 WebP；若生产环境必须转换，质量应不低于 92，并保留 PNG 原件；
- 不要将参考 UI 图作为背景。

## 3. 页面坐标基准

以下坐标以 1672 × 941 参考画布为基准，可在实现时以 CSS 变量统一缩放：

| 区域 | 建议范围 |
| --- | --- |
| 左侧栏 | x: 50–230；y: 0–941 |
| 顶栏 | x: 230–1672；y: 20–96 |
| Hero 文案 | x: 308–600；y: 166–375 |
| 主视觉书本/机器人 | 由背景原图决定，不重新定位 |
| 第一排功能区顶线 | y: 512 左右 |
| Novel Structure Map | x: 260–782；y: 512–713 |
| Chapter Timeline | x: 783–1330；y: 512–713 |
| AI Writing Partner | x: 1355–1650；y: 512–746 |
| 第二排功能区 | y: 720 起 |

这些值是视觉锚点，不要求把整页写成绝对定位。推荐用固定左栏 + CSS Grid 构建功能区，再用少量绝对定位完成 Hero 与遮挡细节。

## 4. 层级架构

建议使用以下层级，禁止随意把整组卡片放到背景下面：

```text
z-index 0   纯白页面底色
z-index 1   hero-background-clean.png（书、机器人、能量岛屿）
z-index 10  前两张卡片的实体 surface（从遮挡带下方开始绘制）
z-index 20  顶栏、侧栏、Hero 文案、卡片标题、功能内容、章节小卡片
z-index 30  弹层、下拉菜单、Tooltip
```

由于书已经在背景资产内，书的“前景效果”通过不绘制被遮挡的外层卡片 surface 来完成。不要复制一张低透明背景覆盖在卡片上。

### 4.1 外层卡片的推荐 DOM

```tsx
<section className="dashboardPanel occludedPanel timelinePanel">
  <div className="panelSurface" aria-hidden="true" />
  <div className="visibleTopCap visibleTopCapLeft" aria-hidden="true" />
  <div className="visibleTopCap visibleTopCapRight" aria-hidden="true" />
  <div className="panelContent">
    <TimelineHeader />
    <ChapterCards />
    <TimelineProgress />
  </div>
</section>
```

### 4.2 外层 surface 的 CSS 思路

```css
.dashboardPanel {
  position: relative;
  min-width: 0;
  isolation: isolate;
}

.occludedPanel .panelSurface {
  position: absolute;
  inset: 56px 0 0;
  z-index: -1;
  background: #fff;
  border: 1px solid #edf2f0;
  border-top: 0;
  border-radius: 0 0 18px 18px;
  box-shadow: 0 12px 30px rgb(25 95 72 / 7%);
}

.panelContent {
  position: relative;
  z-index: 1;
}

.visibleTopCap {
  position: absolute;
  top: 0;
  height: 58px;
  background: #fff;
  border-top: 1px solid #edf2f0;
  pointer-events: none;
}
```

`visibleTopCap` 只在没有书本经过的片段绘制。具体宽度在 1672px 基准画布上用参考图微调；书本经过的中间段完全不创建 cap，避免出现残余卡片轮廓。不要给整个 `.dashboardPanel` 设置 `background`、`border` 或 `backdrop-filter`。

如果现有布局需要更精确的曲线，可用 CSS mask 或一个内联 SVG path 只裁 `panelSurface`；不得裁掉 `.panelContent`。mask 只作用于大卡片实体底板，不作用于章节小卡片。

## 5. 页面组件树

```text
AppShell
├── HeroBackground
├── Sidebar
│   ├── Brand
│   ├── NewProjectButton
│   ├── PrimaryNavigation
│   ├── UtilityActions
│   └── TodayProgress
├── Main
│   ├── Topbar
│   │   ├── ProjectSwitcher
│   │   ├── ProjectStatus
│   │   ├── WordTarget
│   │   ├── GlobalSearch
│   │   ├── NotificationButton
│   │   └── UserMenu
│   ├── HeroCopy
│   │   ├── Headline
│   │   ├── SupportingText
│   │   └── HeroActions
│   └── DashboardGrid
│       ├── NovelStructureMap
│       ├── ChapterTimeline
│       ├── AIWritingPartner
│       ├── InspirationVault
│       ├── CharacterRelationshipGraph
│       ├── ClueAttributionFlow
│       └── MemoryLayer
```

## 6. 布局实现

### 6.1 Shell

- 页面最小宽度建议 `1280px`；最佳预览宽度 `1672px`；
- 侧栏宽度约 `230px`，固定在左侧；
- 主内容从 `230px` 起；
- 页面底色 `#FFFFFF`，不要使用浅灰整页底；
- 第一屏高度至少 `941px`，内容超出时允许纵向滚动；
- 使用 `overflow-x: hidden`，但不要裁掉书本视觉。

### 6.2 Dashboard Grid

桌面基准建议：

```css
.dashboardGrid {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: minmax(390px, 1fr) minmax(470px, 1.06fr) 294px;
  gap: 16px;
  margin: 0 22px 0 30px;
  padding-top: 512px;
}
```

第二排可以使用嵌套 Grid：

```css
.lowerGrid {
  grid-column: 1 / 3;
  display: grid;
  grid-template-columns: 0.9fr 1.06fr 1.28fr;
  gap: 16px;
}
```

根据项目实际 DOM 调整，但视觉顺序必须与参考图一致。

## 7. 设计 Token

```css
:root {
  --page: #ffffff;
  --surface: #ffffff;
  --surface-soft: #f8fffc;
  --mint-50: #effdf8;
  --mint-100: #dff8ef;
  --mint-300: #7ee5c0;
  --mint-500: #09c779;
  --mint-600: #05ae68;
  --cyan-500: #18cbe8;
  --blue-600: #3458b9;
  --ink: #101613;
  --muted: #61706a;
  --line: #edf2f0;
  --danger: #ff4a4a;
  --radius-lg: 18px;
  --radius-md: 13px;
  --shadow-card: 0 12px 32px rgb(30 100 75 / 7%);
  --shadow-action: 0 10px 24px rgb(0 190 110 / 20%);
}
```

- 字体优先 `Inter, SF Pro Display, system-ui, sans-serif`；
- 标题粗度 700–800，正文 400–500；
- Hero 标题约 38–42px，行高约 1.1；
- 主要功能卡标题 14–16px；
- 辅助文字 11–13px；
- UI 黑色不要用纯黑大面积填充，正文使用 `#101613`。

## 8. 关键组件细节

### Sidebar

- 白底，右侧只保留极浅分隔或柔和阴影；
- `New Project` 使用薄荷绿实色胶囊按钮；
- 当前导航 `Home` 使用浅薄荷底，左侧细绿色状态条；
- 图标用统一 1.75px 线宽的 SVG，不用 Emoji；
- `Today’s Progress` 为白色圆角卡，绿色圆环显示 72%。

### Hero Copy

- 文案固定为参考图中的层级；
- `AI` 使用薄荷绿；
- 两个按钮均为真实按钮；主按钮为绿色，次按钮白底轻阴影；
- 文案区域不可添加白色蒙版去压背景，背景本身已有负空间。

### Novel Structure Map

- 四张阶段卡：ACT I、ACT II、ACT III、Epilogue；
- 小卡片为不透明白底、13px 圆角、极浅阴影；
- 阶段间用细薄荷虚线连接；
- 顶部外层轮廓被书遮挡的位置不绘制。

### Chapter Timeline

- 章节小卡片保持等高；Ch.4 使用绿色描边和淡绿高亮；
- 章节卡之间可用细绿色虚线表示顺序；
- `Reorder` 与左右箭头放在标题行右侧，但不能浮到书本上形成杂乱重叠；
- 进度线放在章节卡下方，至少留 12px 间距；
- 进度节点 1–4 为绿色，第 4 节点为双圆高亮，后续节点为浅灰；
- 进度条绝不能处于书本下缘后方。

### AI Writing Partner

- 完整白色实体卡，不能被书本遮挡；
- 小机器人可以使用简化 SVG/已有图标，若没有单独资产，不要从主背景粗暴裁图；
- 任务进度条为薄荷绿，不做厚重渐变；
- `View All` 是可点击文本按钮。

### 第二排

- Inspiration Vault：三条灵感素材，缩略图可先用可替换占位数据，但布局和比例需复刻；
- Character Relationship Graph：使用 SVG 绘制节点与连线，避免 Canvas 模糊；
- Clue Attribution Flow：使用 SVG 贝塞尔曲线，线条轻、颜色低饱和；
- Memory Layer：胶囊标签，选中项绿色实底。

## 9. 数据与交互

首版可使用本地 mock 数据，但组件接口需要可接真实数据：

```ts
type Chapter = {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  progress: number;
  status: 'draft' | 'active' | 'complete';
};

type AgentTask = {
  id: string;
  label: string;
  progress: number;
};
```

必须具备的基础交互：

- 侧栏当前项切换；
- Project Switcher 下拉；
- 搜索框聚焦；
- 章节卡选中；
- `Reorder` 进入排序状态；
- `Continue Writing` 与 `AI Assist` 按钮反馈；
- `View All`、`Manage` 的 hover/focus 状态；
- Tooltip/弹层位于最高层，不被背景或遮挡容器裁掉。

## 10. 响应式策略

### ≥ 1440px

- 完整三列布局；
- 背景按宽度缩放，保持主体位置；
- 遮挡带高度随背景比例等比变化。

### 1280–1439px

- 缩小间距和右侧栏宽度；
- Hero 标题略缩小；
- 仍保留三列，允许 Chapter Timeline 内部横向滚动；
- 不得为了省空间裁切书本。

### < 1280px

- 进入简化桌面模式：侧栏收窄为图标栏或可折叠；
- 右侧 AI 卡移到第二排；
- 背景保持顶部完整展示；
- 遮挡关系可简化为外层卡片从书本下方开始，但仍禁止透明卡片透书。

## 11. 图片清晰度要求

- 保留源 PNG；
- 页面上不要给图片设置低质量尺寸后再放大；
- 使用 `decoding="async"`，主视觉可设置 `fetchpriority="high"`；
- 在 1672px 视口下以接近原始像素尺寸显示；
- 避免父级 `transform: scale()` 导致整页文字和图片共同模糊；
- 若必须整体缩放设计画布，使用设备像素比测试并优先改为流式布局。

## 12. 可访问性与工程要求

- 所有图标按钮有 `aria-label`；
- 键盘可聚焦，focus ring 使用薄荷绿且清晰；
- 文本与白底对比度达到 WCAG AA；
- 装饰背景使用空 alt 或 CSS background，避免屏幕阅读器朗读；
- 尊重 `prefers-reduced-motion`；
- 不使用 Base64 内嵌主背景；
- 组件拆分清晰，不把整个页面堆在一个文件；
- 不引入仅为复刻一张页面而体积巨大的 UI 框架。

## 13. 建议实施顺序

1. 搭建 AppShell、侧栏、顶栏和纯白页面；
2. 放入高清背景并在 1672 × 941 对齐；
3. 实现 Hero 文案和按钮；
4. 实现第一排三张功能卡和章节小卡片；
5. 完成书本遮挡：移除被书覆盖区域的大卡片 surface/轮廓；
6. 把章节进度线放到小卡片下方；
7. 实现第二排功能卡和 SVG 关系图；
8. 添加交互态、键盘态、响应式；
9. 用参考图做截图比对并修正位置、间距、圆角、阴影；
10. 运行 lint、typecheck、测试和生产构建。

## 14. 验收清单

### 视觉

- [ ] 背景与提供的干净背景一样鲜明、清晰，没有灰雾和失色；
- [ ] 页面底色为纯白；
- [ ] 书本看起来从 UI 中“长出来”，不是被卡片虚化透出；
- [ ] 书压住 Chapter Timeline 外层卡片的位置没有残余边框、圆角或阴影；
- [ ] 章节小卡片不透明、未被裁切；
- [ ] 章节进度条完整地位于小卡片下方；
- [ ] 右侧 AI Writing Partner 卡片完整；
- [ ] 没有泛黄、灰底、廉价蓝色阴影或过重玻璃效果；
- [ ] 1672 × 941 截图与参考图的主区域位置接近。

### 工程

- [ ] UI 由真实组件实现，参考图没有被直接当页面；
- [ ] 主背景只加载一次；
- [ ] 无横向溢出；
- [ ] 交互控件可键盘访问；
- [ ] typecheck、lint、测试与 build 通过；
- [ ] README 写明启动命令和主要目录。

## 15. 明确禁止

- 禁止将 `reference/final-ui-reference.png` 作为整页背景；
- 禁止把卡片整体设为透明或使用大面积 `backdrop-filter: blur()`；
- 禁止在书本上方残留 Chapter Timeline 的边框线；
- 禁止让进度条藏在书本后面；
- 禁止重新生成、改色、锐化或压暗背景图；
- 禁止用灰色页面底“提升高级感”；
- 禁止用 Canvas 绘制所有 UI；
- 禁止为了贴图方便而牺牲真实功能与响应式。

完成后请输出：变更文件清单、启动方式、测试结果、1672 × 941 页面截图，以及仍需产品确认的少量差异。

