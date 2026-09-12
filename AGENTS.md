# AGENTS.md

本文件供 AI 编码代理阅读，假设读者对本项目一无所知。

## 项目概览

**Novelora**（仓库名 `novel-agent`，对外品牌 **笔心**）是一个小说创作工作台。

**唯一直播 UI 是 Codex 笔心。** 权威入口是 `http://127.0.0.1:4173/`，单一直播壳是 `BixinHomePage`，视觉令牌为 `--bixin-*`。`docs/superpowers/specs/2026-08-14-bixin-desktop-home-visual-design-system.md` 仍是笔心壳的基础视觉章程，但较新的 `docs/redesign/2026-08-28-uizip-implementation-spec.md` 与配套 retrofit plan 在冲突处优先：当前运营首页明确移除了 `BookForeground`（组件仅作为未挂载旧代码保留），所以旧章程中的“场景 → 界面 → 书”不再描述直播首页的实际层级；当前是单一“场景 → 界面”笔心壳，工作台页继续画在该壳内。禁止再做第二套风格或壳（Echo `AppShell`、白绿液态玻璃、mint 驾驶舱、并行首页）。

**当前阶段的明确边界**：这不是纯前端或纯 mock-only 项目。首页文案、统计、建议等展示内容仍主要来自本地 fixture（例如 `bixinHomeContent.ts`），`noveloraMockProject.ts` 也仍提供少量默认演示/回退数据；但直播工作台已接入并保留以下本地集成：

- `services/api` 是 Fastify 本地服务。前端通过 Vite 的 `/api` 代理读写已注册的本地小说工作区，包括项目/章节/文档/人物关系、任务与草稿、候选文件以及工作流图和运行状态；这些路径不是 mock 请求。
- Vite 的 `/hermes` 代理连接本机 Hermes 网关；写作对话、模型/技能/命令/专家目录以及部分导入、任务和工作流路径存在真实适配代码。Hermes 或 API 离线时，部分界面会回退或显示离线状态，并不等于该集成不存在。
- `services/api/.env` 由本地加载器读取，可配置 `DEEPSEEK_API_KEY` / `DEEPSEEK_BASE_URL`；API 还读取 `HERMES_URL`、`NOVELORA_API_HOST` / `NOVELORA_API_PORT` 等进程环境。DeepSeek 上游仅在配置密钥后可用。
- `apps/desktop` 是 Electron 壳：开发/打包时加载 Web UI，启动本地 API 子进程，并通过隔离 preload 暴露文件夹/文件选择 IPC。

上述是当前已经实现的本机 API、文件持久化、Hermes/可选模型和桌面进程集成；不要把它们误写成未来设想。另一方面，`docs/superpowers/specs/` 中 15 篇产品规格描述的完整平台能力仍未整体落地，例如完整 Agent 编排、生产级模型路由与治理、RAG 上下文引擎、长期记忆、多人协作、搜索和发布审查。实施计划（英文）在 `docs/superpowers/plans/`。

## 技术栈

- **构建**：Vite 8 + `@vitejs/plugin-react`
- **框架**：React 19（`StrictMode`，无路由、无状态管理库，状态用 `useState`/`useRef` 就地管理）
- **语言**：TypeScript ~6.0，`tsc -b` 项目引用模式（`tsconfig.app.json` 管 `src/`，`tsconfig.node.json` 管 `vite.config.ts`）
- **测试**：Vitest 4 + jsdom + Testing Library（`@testing-library/react`、`user-event`、`jest-dom`）
- **Lint**：oxlint（无 ESLint/Prettier）
- **样式**：纯 CSS（无 Tailwind、无 CSS-in-JS），设计令牌集中在 `src/styles/tokens.css`
- **本地 API**：Fastify 5 + TypeScript/tsx，文件系统工作区存储；开发端口默认 `127.0.0.1:8787`
- **桌面壳**：Electron 33 + electron-vite，隔离 preload 和 API 子进程管理
- **本机 Agent 网关**：Hermes 默认 `127.0.0.1:8642`，通过 Web `/hermes` 代理和 API 适配器接入
- Node 包管理用 npm；`apps/web`、`services/api`、`apps/desktop` 各有自己的 `package-lock.json`，根目录 `package.json` 转发 Web、API 和 Desktop 脚本。

## 构建与测试命令

依赖安装后（`cd apps/web && npm install`），从**仓库根目录**运行：

```bash
npm run dev:web     # Vite 开发服务器
npm run dev:api     # Fastify 本地 API（默认 127.0.0.1:8787）
npm run seed:api    # 写入本地 API 示例工作区
npm run test:web    # Vitest 单次运行（等价于 apps/web 下 npm run test -- --run）
npm run lint:web    # oxlint
npm run build:web   # tsc -b && vite build（含完整类型检查）
npm run dev:desktop # Electron 开发壳（会启动 API 子进程）
npm run build:desktop # 构建 Electron 主进程/preload/renderer
```

也可在 `apps/web/` 内直接运行 `npm run dev` / `npm run test -- --run` / `npm run lint` / `npm run build` / `npm run preview`。

注意：`src/styles/global.test.ts` 用 `process.cwd()` 读取 CSS 源文件做契约断言，**必须在 `apps/web` 目录下运行测试**（根脚本 `test:web` 已保证这一点）。

## 代码组织

```
apps/web/
├── index.html
├── vite.config.ts            # 同时是 Vitest 配置（jsdom、globals、setupFiles）
├── vitest.setup.ts           # 引入 @testing-library/jest-dom/vitest
├── .oxlintrc.json
├── public/assets/            # 静态资源（backgrounds / mascot / textures）
└── src/
    ├── main.tsx              # 入口，挂 <App/>
    ├── App.tsx               # 组装笔心壳、导航、工作区选择与各直播工作台页
    ├── App.test.tsx          # 端到端式交互测试
    ├── styles/
    │   ├── tokens.css        # 全部设计令牌（颜色/阴影/圆角/动效/字体）
    │   ├── global.css        # 页面画布与基础样式
    │   ├── cockpit.css       # 驾驶舱全部组件样式（约 1500 行，单文件）
    │   └── global.test.ts    # 对 CSS 源码的语义契约测试（见下）
    ├── assets/               # 打包进构建的图（hero.png、novelora UI 资产包等）
    └── features/
        ├── novelora-cockpit/     # ★ 当前活跃特性
        │   ├── types.ts          # 全部领域类型（Act、CockpitChapter、ClueFlow…）
        │   ├── assetRegistry.ts  # 图片资产注册表（见"资产约定"）
        │   ├── data/noveloraMockProject.ts   # 旧驾驶舱领域 fixture；直播首页另用 bixinHomeContent.ts
        │   └── components/       # 直播：home/BixinHomePage（笔心壳）与 pages/writing
        │                         # 死代码勿挂回产品：AppShell、ProjectSidebar、StructureMap、
        │                         # ChapterSwimlane、InspirationVault、AIWritingPartner 等
        └── toy-writer-cockpit/   # 旧版特性，只剩 data/ 和 types.ts，勿在其上新建功能
```

其他顶层目录：

- `services/api/` — Fastify 本地 API、工作区文件持久化、任务/候选/工作流运行及 Hermes/DeepSeek 适配
- `apps/desktop/` — Electron 主进程、隔离 preload、原生文件选择 IPC 与 API 子进程管理
- `packages/hermes-plugins/` — Hermes 插件包
- `docs/superpowers/specs/` — 产品规格与设计文档（中文为主）；`docs/superpowers/plans/` — 实施计划（英文）
- `qa-screenshots/` — Playwright 浏览器 QA 截图产物
- `assets/` — 参考图、生成图等原始素材，**不参与构建**
- `.runtime/` — 本地 dev server 日志；`.worktrees/` — 特性开发的 git worktree；`.superpowers/` — 头脑风暴产物（已被 gitignore）

## 代码风格与约定

- **组件与测试并置**：每个 `X.tsx` 配一个 `X.test.tsx`，放在同一目录。
- **测试即用户行为**：测试通过角色和可访问名查询元素（`getByRole('button', { name: ... })`），断言 `aria-pressed`、`role="dialog"`、焦点恢复等可访问性契约——改动交互时必须保持这些语义。Vitest 开了 `globals: true`，但现有代码仍显式 `import { describe, expect, it } from 'vitest'`，请跟随。
- **CSS 契约测试**：`src/styles/global.test.ts` 直接解析 CSS 源码，锁定调色板、透明表面、图层、断点、reduced-motion 等语义契约。改 `tokens.css`/`global.css`/`cockpit.css` 前先看这些测试，改完必须让它们通过。
- **设计令牌先行**：颜色、阴影、圆角、动效一律引用 `tokens.css` 里的 CSS 变量，不写死色值。直播视觉语言是 Codex **笔心**（`--bixin-*`）。`--color-mint-*` 与 Echo 玻璃别名不是产品 UI；`tokens.css` 中标注 "Legacy color aliases for migration only" 的别名仅供迁移过渡，新代码不要用。
- **TypeScript 严格项**：`noUnusedLocals`、`noUnusedParameters`、`verbatimModuleSyntax`（类型导入必须 `import type`）、`erasableSyntaxOnly`（禁用 enum 等不可擦除语法）、`noEmit`。模块解析为 bundler 模式，允许 `allowImportingTsExtensions`。
- **Lint**：oxlint，配置在 `apps/web/.oxlintrc.json`（plugins: react/typescript/oxc；`react/rules-of-hooks` 为 error）。
- **资产约定**：打包图片统一经 `features/novelora-cockpit/assetRegistry.ts` 用 `new URL('...', import.meta.url).href` 导出；fixture 类型（如 `portraitAssetKey`）用 `keyof typeof` 绑定注册表的键，新增图片资产要同步扩展注册表和类型。
- **命名与文案**：代码、标识符、测试断言、UI 文案均为英文；产品规格文档以中文为主。

## 测试策略

- 单元/交互测试：Testing Library 渲染真实组件树，模拟用户点击/键盘，断言 DOM 与 ARIA 状态（见 `App.test.tsx`）。
- 数据完整性测试：`data/*.test.ts` 校验 fixture 内部一致性。
- 样式契约测试：`global.test.ts`（上述）。
- 浏览器级 QA：历史上用 Playwright 截图核对视觉效果（产物在 `qa-screenshots/`），非自动化 CI 流程——本仓库**没有 CI 配置**，提交前请本地跑全 `test:web` + `lint:web` + `build:web`。

## 安全与环境注意事项

- 本地 API、Hermes 和可选 DeepSeek 网络路径已经存在；`services/api/.env.example` 只提供变量名示例，`.gitignore` 已排除真实 `.env*`（保留 `.env.example`）。不要把 API 密钥、令牌或用户工作区内容提交进仓库。
- `apps/web` 之外的目录（`assets/`、`qa-screenshots/`、`.runtime/`）体积可能很大，搜索时避免无差别递归。
- 环境为 Windows + Git Bash： shell 命令用 Unix 语法，路径用正斜杠。
