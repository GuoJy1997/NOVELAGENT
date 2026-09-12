# Novelora 写作工作台 v1 设计规格

日期：2026-08-12
状态：待用户评审

## 1. 背景与目标

当前驾驶舱是 mock 数据驱动的概念 UI。本规格把它演进为可真实写作的产品 Novelora v1：

- 新增 **Writing 视图**（章节查看/编辑），由 `Continue Writing` 按钮或章节卡片进入
- 新增 **Echo 聊天栏**，仅存在于 Writing 视图，真实接入本机 hermes-agent API server
- Dashboard 布局不变，做**视觉组件系统刷新**，消除粗糙感
- 全部数据落用户本地文件（对齐 opencode/hermes 的本地文件哲学）

### Design Read

密集产品 UI 的 redesign-evolve：面向长篇小说作者，白绿液态玻璃语言，与绘本风 hero 插画协调；基于现有 `tokens.css` 自研，不引入组件库。

### 设计转盘

`DESIGN_VARIANCE 6 / MOTION_INTENSITY 4 / VISUAL_DENSITY 7`

### taste-skill 适用边界

本产品为 dashboard，不采用 taste-skill 的 landing-page 规则。强制采纳的约束：

- 可见文案零 em-dash（`—`/`–` 作分隔符均禁）
- 色彩一致性锁：单一强调色系（取自 hero 插画的 teal/mint），全站一致
- 圆角一致性锁：仅 `12 / 16 / 20 / 999(丸)` 四档
- 阴影不用纯黑，着色为薄荷环境色
- 玻璃材质为 backdrop-filter 近似实现，必须提供 `prefers-reduced-transparency` 实底降级
- 图标单一图标族（现状为内联 SVG，刷新时统一迁移到 Phosphor 一族，禁止手绘新图标）
- `MOTION 4`：仅 CSS transition 微反馈；`prefers-reduced-motion` 下全部关闭
- serif 纪律：UI 一律 sans；仅正文编辑器（manuscript 场景）使用 EB Garamond
- 装饰性状态点限量：仅真实语义状态（Echo 在线、任务进行中）可用圆点

## 2. 信息架构

两个视图 + 共享顶栏/侧边导航，无路由库（沿用 useState 就地管理）：

- **Dashboard 视图**（现有驾驶舱）：布局不重排，仅视觉刷新
- **Writing 视图**：三栏
  - 左：章节列表（章号、标题、状态、字数，选中态）
  - 中：Markdown 编辑器（编辑/预览切换、实时字数、保存状态指示）
  - 右：Echo 聊天栏（仅此视图出现）
- 入口：`Continue Writing` 按钮 → Writing 视图并选中"当前章节"；Chapter Timeline 章节卡片点击 → Writing 视图选中该章
- 返回：Writing 视图顶部有返回 Dashboard 的控件

## 3. 视觉组件系统刷新（Dashboard + 全局）

### 3.1 设计原则

1. 强调色取自 hero 插画（teal/mint/aqua 族），扩充为 tokens；不使用插画外的灰色系
2. 透明三级：顶栏丸 > 面板卡 > 内容卡，越靠近背景越透
3. 圆角节奏 12/16/20/999
4. 阴影为薄荷环境色多层柔和阴影，无纯黑投影

### 3.2 逐组件清单

- **顶栏**：项目切换器（书封缩略图+书名）、`In Progress` 状态丸、字数统计、搜索框、快捷键提示、通知铃、头像 → 统一为液态玻璃丸（半透明 + 微磨砂 + 1px 内高光边框）
- **侧边导航**：选中态改为薄荷液态指示（左侧指示条 + 柔和底），图标统一线性风格
- **面板卡**（Structure Map / Chapter Timeline / AI Writing Partner / 下排四面板）：半透玻璃面 + 薄荷环境阴影；标题/正文字层级对比加强
- **ACT 卡 / 章节卡**：选中态渐变描边 + 微抬升；进度曲线用 teal→mint 渐变
- **AI Writing Partner 面板**：向"任务流"呈现演进（参考 Mirroric：任务条目 + 状态图标 + 时间线连接），数据仍来自现有 mock
- **滚动条/分隔线**：细化，去厚重感

### 3.3 动效

仅 hover/active 微反馈（`transform`/`opacity`，150-250ms），reduced-motion 下禁用。不做滚动驱动动画、不做无限循环动画。

## 4. Writing 视图

### 4.1 章节列表栏

- 数据来自薄后端（章节元数据），含状态徽章与字数
- 选中章节高亮；点击切换编辑器内容

### 4.2 编辑器

- Markdown textarea（EB Garamond 正文）+ 预览切换（渲染态排版）
- 实时字数统计（中文字符按字符计）
- 自动保存：停止输入 1.5s 后 `PUT /projects/:id/chapters/:num`；状态指示 `Saved / Saving… / Save failed (retry)`
- 编辑区域纯色纸面（低透明），保证长文阅读对比度

### 4.3 Echo 聊天栏

- 消息列表（用户/Echo 气泡）+ 输入框 + 发送按钮
- SSE 流式渲染回复；生成中可中断（停止按钮）
- 发送时自动附带上下文：当前章节号 + 本章前 500 字摘要，使 Echo 知道正在写哪章
- 会话连续：请求头 `X-Hermes-Session-Id`，会话记录由 hermes 本地 SQLite 存储
- hermes 离线降级：状态点变灰、输入框禁用、显示重试按钮（轮询 `/health` 恢复）

## 5. 持久化（全本地）

### 5.1 项目目录结构

```
<项目目录>/
├── project.json        项目元数据（书名、当前章节、字数目标）
├── outline.md
├── world.md
├── characters.md
├── canon.md
└── chapters/
    ├── ch_01.md
    └── ch_02.md …
```

开发期根目录：`<repo>/.novelora-data/default-project/`；Electron 打包后指向用户文档目录（后续规格定义）。现有 mock 数据 `noveloraMockProject.ts` 迁移为该目录下的初始文件。

### 5.2 薄后端端点（services/api, Fastify）

- `GET /health`
- `GET /projects/:id` → 项目元数据 + 章节列表（章号/标题/状态/字数）
- `GET /projects/:id/chapters/:num` → 章节正文
- `PUT /projects/:id/chapters/:num` → 保存正文（原子写：tmp + rename）
- 端口默认 `127.0.0.1:8787`，仅监听回环

### 5.3 聊天记录

不另存：使用 hermes 会话存储（SQLite + FTS5，位于 HERMES_HOME）。

## 6. 外部服务接线

- hermes API server：`http://127.0.0.1:8642`，`POST /v1/chat/completions`（SSE），Bearer `novelora-dev-key`（dev；生产由 Electron 壳注入）
- 前端通过 Vite dev proxy `/hermes` → `8642` 避免 CORS（Electron 内直接访问）

## 7. 错误处理

- api 不可达：编辑器只读 + 顶部提示条
- hermes 不可达：聊天栏降级（见 4.3）
- 保存失败：自动重试一次，失败则保留草稿于内存并提示

## 8. 测试策略

- 交互测试（Testing Library）：视图切换、章节选择、编辑/自动保存防抖、聊天发送与流式渲染、离线降级
- API 测试：node test runner 覆盖章节 CRUD 与原子写
- CSS 契约测试（`global.test.ts`/`echo.test.ts`）：tokens、玻璃三级、圆角档位、reduced-motion/reduced-transparency 降级全部入契约
- 文案静态检查：UI 可见字符串零 em-dash（纳入 lint 或测试）

## 9. YAGNI（本版明确不做）

- 富文本编辑器、协作、云同步、账号体系
- Dashboard 上的聊天入口
- 任务进度实时事件流（tool.start/progress 接入下一版）
- MCP 知识库工具（待数据模型稳定后另立规格）
- Electron 壳内 hermes 子进程管理（桌面版规格另立）
