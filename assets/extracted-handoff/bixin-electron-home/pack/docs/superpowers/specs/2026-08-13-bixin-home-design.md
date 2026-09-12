# 笔心桌面端首页高保真设计规格

日期：2026-08-13
状态：已完成设计讨论，待用户最终审阅

## 1. 项目范围

本次只实现“笔心 AI 写作工作室”的桌面端首页，不扩展到项目页、大纲页、人物页、统计页、世界观页等完整业务页面。其他路由仅保留导航结构或占位，不在本轮实现真实业务内容。

技术栈固定为：

- Electron
- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React（图标）

目标优先级：

1. 1728×972 左右桌面宽屏下，尽可能 1:1 还原当前确认参考图。
2. 保证界面是真实可开发的前端，而不是“整张截图当背景”。
3. 保持清晰的三层空间关系：场景底层、UI 中层、书本前景层。
4. 组件必须可复用，便于后续在 Cursor 中继续迭代。

## 2. 视觉概念

页面不是传统 SaaS Dashboard，而是“小说创作世界被打开”的桌面创作工作台。

核心叙事：

- 吉祥物一手持钢笔，一手用望远镜观察书中的地图。
- 书页展示的是无文字的立体地图。
- 云层、城堡、浮空岛、山脉和瀑布等背景景观，表达“地图被望远镜放大后变成真实世界”的视觉立意。
- UI 卡片不是放在一块纯白后台画布上，而是像从云层中自然生长出来。
- 书本位于最外层，轻微压住卡片边缘，形成真实遮挡关系。

## 3. 设计基准尺寸

桌面基准：

- 设计宽度：1728px
- 设计高度：972px
- Electron 默认窗口：1728×972
- 最小窗口：1440×810
- 1920 宽屏时保持主体比例并居中，不强行拉伸布局。

本轮不以完整响应式为优先目标，优先保证 1728/1920 桌面环境中的高保真表现。

## 4. Z 轴分层架构

### Layer 0 — Canvas

页面基础画布。

- 极浅暖白 / 雾白底色
- 负责承接场景透明区域
- z-index: 0

### Layer 1 — Scene Layer

内容：

- 云层
- 浮空岛
- 山脉
- 城堡
- 瀑布
- 远景天空
- 吉祥物机器人

要求：

- 作为一个主视觉组合资产导出。
- 不包含书本。
- 不包含任何 UI 控件或文字。
- 底部保留足够云层与景观延伸，确保卡片放置后仍像“长在场景里”。
- `pointer-events: none`
- z-index: 10

### Layer 2 — Interface Layer

内容：

- 品牌区
- 左侧导航
- 顶部搜索
- Hero 文案
- CTA
- 所有 Dashboard 卡片
- 用户徽章

要求：

- 全部业务交互位于这一层。
- 所有卡片和控件均由 React/Tailwind 构建，不使用截图切块。
- z-index: 20

### Layer 3 — Book Foreground

内容：

- 打开的书
- 3D 立体地图
- 与书统一透视的书签

要求：

- 单独透明 PNG。
- 不含机器人与背景。
- 不含书页文字。
- 书中地图必须有明显立体高度：城堡、地形、河流、森林、道路等有层次。
- 书签跟随整本书的透视角度，不做独立错误旋转。
- z-index: 30
- `pointer-events: none`

## 5. 品牌规范

对外产品名：**笔心**

辅助描述：**AI 写作工作室**

内部项目/代码名可继续使用 NovelAgent，但首页视觉不得把 NovelAgent 作为主品牌名。

### 应用图标

- 绿色圆角方形背景。
- 中央以白色负形留白构成钢笔尖 / 钢笔图形。
- 避免十字星、羽毛笔等旧标识。

## 6. 页面组件树

```txt
BixinHomePage
├── Canvas
├── SceneBackground                       z10
│   └── scene_robot_background.png
├── InterfaceLayer                        z20
│   ├── Sidebar
│   │   ├── BrandBlock
│   │   ├── NavList
│   │   │   ├── 首页
│   │   │   ├── 项目
│   │   │   ├── 大纲
│   │   │   ├── 人物
│   │   │   ├── 统计
│   │   │   └── 世界观
│   │   ├── SettingsItem
│   │   └── UserBadge
│   ├── TopSearchBar
│   ├── HeroContent
│   │   ├── HeroBadge
│   │   ├── HeroHeading
│   │   ├── HeroDescription
│   │   ├── ContinueWritingButton
│   │   └── NewProjectButton
│   └── DashboardGrid
│       ├── ProjectOverviewCard           2 rows
│       ├── ChapterProgressCard           1 row
│       ├── CharacterNetworkCard          1 row
│       ├── WritingGoalsCard              1 row
│       └── RightBottomGroup              1 row
│           ├── SceneScheduleCard
│           └── CalendarCard
└── BookForeground                        z30
    └── book_foreground.png
```

## 7. 左侧导航设计

禁止做一整块厚重白色矩形 Sidebar 容器。

导航应当表现为“控件直接浮在背景上”：

- 品牌 Logo / 名称悬浮于场景。
- 每个 NavItem 自身是独立交互控件。
- 默认态透明或接近透明。
- 激活态采用浅绿色半透明背景。
- 底部设置与用户徽章保持与主导航一致的视觉语言。

这样可以避免“页面左边被截断”的视觉问题。

## 8. Hero 区设计

左侧内容：

- 小标签：AI 更懂你的创作
- 大标题：写出让世界铭记的故事
- “故事”使用品牌绿色高亮
- 简短辅助描述
- 继续写作（主按钮）
- 新建项目（次按钮）

Hero 文案与云层背景不能出现明显矩形分区边界，文字区域应像从云层中自然显露出来。

## 9. Dashboard 信息架构

首页严格控制信息密度，不增加额外卡片。

### 第一列

`ProjectOverviewCard`

- 占两层高度。
- 项目封面。
- 项目名。
- 项目状态。
- 简介。
- 四个数据指标：字数 / 章节 / 世界观 / 完成度。
- 底部主 CTA：打开项目。

### 第二列上

`ChapterProgressCard`

- 灵感
- 大纲
- 草稿
- 修订
- 已发布
- 右侧整体进度圆环

### 第二列下

`WritingGoalsCard`

- 本月目标圆环
- 目标字数
- 章节目标
- 写作/修订目标

### 第三列上

`CharacterNetworkCard`

- 中心主角节点
- 周边角色头像
- 关系线
- 关系图例

### 第三列下

`RightBottomGroup`

同一视觉区域内放置：

- `SceneScheduleCard`
- `CalendarCard`

避免再产生两个体量过大的独立 Dashboard 模块。

## 10. 卡片视觉规范

卡片目的：既要可读，又必须保留“处在云层中的半实体感”。

建议基础值：

```css
background: rgba(255, 255, 255, 0.90);
backdrop-filter: blur(8px);
border: 1px solid rgba(255, 255, 255, 0.68);
box-shadow:
  0 18px 45px rgba(36, 71, 52, 0.055),
  inset 0 1px 0 rgba(255, 255, 255, 0.70);
border-radius: 24px;
```

卡片不能有明显灰色底板，也不能产生企业 CRM 后台的厚重感。

## 11. Dashboard Grid

建议三列：

```css
grid-template-columns: 1.35fr 1.35fr 1.15fr;
gap: 16px;
```

第一列项目卡跨两行。

其他卡片根据参考图保持规则矩形摆放，不使用大面积随机倾斜。

## 12. 书本遮挡规则

书本必须是真实前景层。

允许的遮挡只有：

1. 书本右下角轻微越过 `CharacterNetworkCard` 的上缘/左上留白区域。
2. 书签尾部轻微进入人物关系卡片的非功能留白。

建议遮挡量：

- 书角：8–18px
- 书签：16–30px

严禁遮挡：

- 卡片标题
- 人物头像
- 人物名称
- 关系线主要交汇区域
- 状态文本
- 按钮
- 可点击区域

视觉目标是“不经意地压住”，而不是刻意制造穿插。

## 13. 通用基础组件

必须代码实现：

- Button
- IconButton
- Card
- CardHeader
- CardTitle
- Chip
- StatusBadge
- Tag
- Avatar
- SearchBar
- ProgressRing
- ProgressBar
- MetricItem
- Divider
- Tooltip（需要时）

图标优先使用 Lucide React，并通过统一 `size/strokeWidth/color` token 管理。

## 14. 状态与数据策略

本轮首页使用本地 Mock Data。

建议数据模块：

- `nav.ts`
- `project.ts`
- `chapterProgress.ts`
- `characterNetwork.ts`
- `writingGoals.ts`
- `sceneSchedule.ts`
- `calendar.ts`

组件不得硬编码大量业务数据在 JSX 内。

## 15. Electron 边界

本轮只搭建足够启动首页的 Electron 桌面壳：

- BrowserWindow
- preload
- renderer
- 基础安全配置

不在本轮实现：

- 本地小说文件系统
- 数据库
- 自动保存
- 多窗口
- IPC 业务能力
- 云同步
- 编辑器页面

这些全部留到后续子项目。

## 16. 错误与降级处理

- 图片资产加载失败时保留浅色背景，不让 UI 崩塌。
- Hero 图片使用合理 `object-fit` / 定位策略。
- 书本前景不可拦截鼠标事件。
- 1440 宽度时优先整体缩小间距与字体，不重新排列为移动布局。

## 17. 验收标准

### 视觉

- [ ] 1728px 宽度下整体构图与参考图高度一致或极接近。
- [ ] 品牌名称为“笔心”。
- [ ] Logo 是绿色底白色负形钢笔。
- [ ] 左侧导航没有厚重外层大矩形。
- [ ] 背景与机器人在 UI 后面。
- [ ] 卡片处在场景/云层中，而非纯白 SaaS 背景。
- [ ] 书本永远在卡片前面。
- [ ] 书角仅轻压人物关系卡片少许。
- [ ] 书签跟随书本透视且不遮挡功能。
- [ ] 书中地图具有明显 3D 立体效果。

### 工程

- [ ] `npm install` 成功。
- [ ] `npm run dev` 可启动 Electron 首页。
- [ ] TypeScript 编译无错误。
- [ ] Tailwind 正常生效。
- [ ] 资产路径可解析。
- [ ] 页面组件按职责拆分，而非单文件堆砌。
- [ ] Mock data 与 UI 分离。
- [ ] README 有 Cursor 启动步骤。

## 18. 最终交付结构

```txt
笔心-electron-home/
├── electron/
│   ├── main.ts
│   └── preload.ts
├── src/
│   ├── assets/
│   │   ├── brand/
│   │   ├── layers/
│   │   ├── project/
│   │   └── characters/
│   ├── components/
│   │   ├── layout/
│   │   ├── nav/
│   │   ├── ui/
│   │   ├── cards/
│   │   └── scene/
│   ├── data/
│   ├── styles/
│   ├── App.tsx
│   └── main.tsx
├── docs/
│   ├── implementation-plan.md
│   ├── component-inventory.md
│   ├── visual-layering.md
│   └── superpowers/specs/
├── reference/
│   └── approved-home-reference.png
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## 19. 明确不做事项

为了保证本轮高保真与可交付性，以下内容不加入本项目：

- 完整多页面业务逻辑
- 富文本小说编辑器
- AI 对话后端
- RAG / Agent 编排
- 数据库存储
- 登录系统
- 云服务
- Electron 安装包签名

本轮的定义是：**一个高保真、可运行、可继续扩展的笔心 Electron 首页工程。**
