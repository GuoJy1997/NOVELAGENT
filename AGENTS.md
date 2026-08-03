# AGENTS.md

本文件供 AI 编码代理阅读，假设读者对本项目一无所知。

## 项目概览

**Novelora**（仓库名 `novel-agent`）是一个"小说创作驾驶舱"（Novel Cockpit）Web 应用的前端工作区：面向长篇小说作者的单页仪表盘，用于浏览整本书的结构（Act / Chapter）、章节泳道、灵感库、人物关系图、线索流向和 AI Agent 任务面板。

**当前阶段的明确边界**：这是一个纯前端、纯 mock 数据驱动的演示型仪表盘。所有项目、章节、灵感、人物、线索、记忆、任务数据均来自本地 fixture（`apps/web/src/features/novelora-cockpit/data/noveloraMockProject.ts`）。Agent 面板和吉祥物 Nova 仅作展示——状态徽章、任务进度、专注模式、上下文健康值都**不**调用真实的 Agent、模型、持久化、协作或搜索。章节抽屉和本地筛选只演示客户端交互，不保存更改。没有后端、没有 API 层、没有环境变量配置。

产品的完整设计意图见 `docs/superpowers/specs/`（15 篇编号产品规格，中文为主，涵盖 Novel Project、Cockpit、灵感库、泳道图、线索伏笔、人物系统、世界观、章节写作/审查、Agent 编排、模型路由、RAG 上下文引擎、长期记忆、技能系统、发布审查），这些是未来后端能力的规格，**当前代码并未实现它们**。实施计划（英文）在 `docs/superpowers/plans/`。

## 技术栈

- **构建**：Vite 8 + `@vitejs/plugin-react`
- **框架**：React 19（`StrictMode`，无路由、无状态管理库，状态用 `useState`/`useRef` 就地管理）
- **语言**：TypeScript ~6.0，`tsc -b` 项目引用模式（`tsconfig.app.json` 管 `src/`，`tsconfig.node.json` 管 `vite.config.ts`）
- **测试**：Vitest 4 + jsdom + Testing Library（`@testing-library/react`、`user-event`、`jest-dom`）
- **Lint**：oxlint（无 ESLint/Prettier）
- **样式**：纯 CSS（无 Tailwind、无 CSS-in-JS），设计令牌集中在 `src/styles/tokens.css`
- Node 包管理用 npm（`apps/web/package-lock.json`）。根目录 `package.json` 只是脚本转发器，依赖装在 `apps/web`。

## 构建与测试命令

依赖安装后（`cd apps/web && npm install`），从**仓库根目录**运行：

```bash
npm run dev:web     # Vite 开发服务器
npm run test:web    # Vitest 单次运行（等价于 apps/web 下 npm run test -- --run）
npm run lint:web    # oxlint
npm run build:web   # tsc -b && vite build（含完整类型检查）
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
    ├── App.tsx               # 组装驾驶舱：Act 选择、章节选择、抽屉开关等顶层状态
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
        │   ├── data/noveloraMockProject.ts   # 唯一 mock 数据源
        │   └── components/       # AppShell、ProjectSidebar、WorkspaceTopbar、
        │                         # StructureMap、ChapterSwimlane、ChapterDetailDrawer、
        │                         # InspirationVault、CharacterGraph、ClueAttributionFlow、
        │                         # AgentPanel、CockpitVisualStage
        └── toy-writer-cockpit/   # 旧版特性，只剩 data/ 和 types.ts，勿在其上新建功能
```

其他顶层目录：

- `docs/superpowers/specs/` — 产品规格与设计文档（中文为主）；`docs/superpowers/plans/` — 实施计划（英文）
- `qa-screenshots/` — Playwright 浏览器 QA 截图产物
- `assets/` — 参考图、生成图等原始素材，**不参与构建**
- `.runtime/` — 本地 dev server 日志；`.worktrees/` — 特性开发的 git worktree；`.superpowers/` — 头脑风暴产物（已被 gitignore）

## 代码风格与约定

- **组件与测试并置**：每个 `X.tsx` 配一个 `X.test.tsx`，放在同一目录。
- **测试即用户行为**：测试通过角色和可访问名查询元素（`getByRole('button', { name: ... })`），断言 `aria-pressed`、`role="dialog"`、焦点恢复等可访问性契约——改动交互时必须保持这些语义。Vitest 开了 `globals: true`，但现有代码仍显式 `import { describe, expect, it } from 'vitest'`，请跟随。
- **CSS 契约测试**：`src/styles/global.test.ts` 直接解析 CSS 源码，锁定调色板、透明表面、图层、断点、reduced-motion 等语义契约。改 `tokens.css`/`global.css`/`cockpit.css` 前先看这些测试，改完必须让它们通过。
- **设计令牌先行**：颜色、阴影、圆角、动效一律引用 `tokens.css` 里的 CSS 变量，不写死色值。当前视觉语言是"白绿液态叙事工作台"（white–mint liquid glass，`--color-mint-*` 一族）。`tokens.css` 中标注 "Legacy color aliases for migration only" 的别名仅供迁移过渡，新代码不要用。
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

- 无后端、无密钥、无网络调用；`.gitignore` 已排除 `.env*`。若未来接入真实 API，不要把密钥提交进仓库。
- `apps/web` 之外的目录（`assets/`、`qa-screenshots/`、`.runtime/`）体积可能很大，搜索时避免无差别递归。
- 环境为 Windows + Git Bash： shell 命令用 Unix 语法，路径用正斜杠。
