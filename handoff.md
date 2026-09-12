# Novelora 开发交接（handoff）

> 交接日期：2026-08-13。本文把当前会话的工作内容与仓库真实状态交给 Cursor 继续开发。
> 所有事实均来自对仓库的直接检查与实跑验证，不是凭记忆。

## 0. 一句话现状

仓库处于**大量未提交改动**状态：写作工作台（Plan A）+ 视觉组件系统刷新（Plan B）的代码已全部落地，**301 个测试全绿、oxlint 0 错误**；会话尾声在做 Writing 视图控件样式微调时被用户叫停，存在 2 个待用户确认的开放问题（见第 3 节），**继续开发前先解决它们**。

## 1. 运行与验证

环境：Windows，仓库根 `D:\NOVELAGENT`。依赖已装好（`apps/web`、`services/api`、`apps/desktop` 均有 node_modules）。

```bash
npm run dev:web      # Vite 开发服务器（apps/web）
npm run dev:api      # Fastify 章节存储服务，127.0.0.1:8787
npm run seed:api     # 初始化 .novelora-data/ 默认项目
npm run test:web     # Vitest 全量（CSS 契约测试要求 cwd 在 apps/web，根脚本已保证）
npm run lint:web     # oxlint
npm run build:web    # tsc -b && vite build
npm run dev:desktop  # Electron 壳（很早期）
```

完整开发需要三个进程：`dev:web` + `dev:api` + 本机 hermes API server（`127.0.0.1:8642`，外部进程）。Vite 代理：`/api → 8787`，`/hermes → 8642`（dev bearer key `novelora-dev-key`，仅本地）。Echo 聊天没有 hermes 时会显示离线提示并每 15s 轮询恢复。

**2026-08-13 实测**：`test:web` 36 文件 301 测试全过（25s）；`lint:web` 0 warnings 0 errors。

## 2. 已完成的工作

### 2.1 写作工作台（Plan A）

计划：`docs/superpowers/plans/2026-08-12-writing-workspace.md`（10 个 Task）；规格：`docs/superpowers/specs/2026-08-12-writing-workspace-design.md`。代码全部落地，但**计划文件里的 checkbox 一个都没勾**（执行时没回写），不要误以为没做。

- **后端** `services/api/`：Fastify 5 + tsx。`src/projectStore.ts`（读 project.json + `chapters/ch_NN.md`，tmp+rename 原子写，CJK+英文混排字数统计），`src/index.ts`（HTTP 端点），`scripts/seed.ts`。测试用 node:test。数据根 `<repo>/.novelora-data/`，项目 id `default-project`。
- **前端 API 层** `apps/web/src/features/novelora-cockpit/lib/`：`noveloraApi.ts`（fetch project/chapter/save）、`hermesChat.ts`（SSE 流式聊天），各带测试。
- **Writing 视图** `components/writing/`：`WritingView.tsx`（三栏壳：章节列表 / 编辑器 / Echo 聊天）、`ChapterList.tsx`、`ChapterEditor.tsx`（1500ms 防抖自动保存 + 卸载兜底保存 + `marked` 预览 + 保存状态指示）、`EchoChat.tsx`（SSE 流式、AbortController 停止、离线检测/自动恢复）、`wordCount.ts`。
- **视图切换** `apps/web/src/App.tsx`：`view: 'dashboard' | 'writing'` useState 管理（无路由库）。入口：hero 区 `Continue Writing`、章节时间线卡片点击；出口：Writing 顶栏 Back 按钮。

### 2.2 视觉组件系统刷新（Plan B）

计划：`docs/superpowers/plans/2026-08-12-visual-refresh.md`（9 个 Task，checkbox 同样未勾）。`apps/web/src/styles/echo.css` 全面重写（现 2556 行），`tokens.css` 新增 echo 令牌族。核心语言：**白绿液态玻璃**——三级透明（`--echo-glass-pill` 55% / `--echo-glass-panel` 72% / `--echo-glass-card` 88% 白底 + backdrop blur + 1px 半透白边）、薄荷环境阴影（无纯黑）、圆角 12/16/20/999、强调色 teal/mint 渐变（`--echo-gradient-accent` / `--echo-gradient-action`）。顶栏玻璃丸、侧边导航液态选中态、面板玻璃卡、ACT/章节卡渐变选中描边、AI Writing Partner 任务流化均已实现。

### 2.3 会话尾声：Writing 视图控件微调（进行中，被打断）

已改（未提交）：

1. `components/writing/ChapterEditor.tsx:62-67` — Preview 按钮移入 meta 行右侧新增的 `chapter-editor__tools` 容器。
2. `apps/web/src/styles/echo.css:2359-2393` — Back to Dashboard 改为玻璃胶囊（blur 14px、999px），`::before` 画 CSS 左箭头（chevron），hover 薄荷浅底 + 抬升 1px。
3. `apps/web/src/styles/echo.css:2454-2485` — `chapter-editor__tools` 玻璃胶囊；`[aria-pressed='true']` 用 `--echo-gradient-action` 深绿底白字。

**未做**：`EchoChat` 的 Send / Stop generating 按钮至今**没有任何 CSS**（composer 只有 textarea 样式，`echo.css:2532-2547`），这是当时排队中的下一项。

## 3. 开放问题（继续前必须先问用户）

用户原话"你先别急着改……先看一下这个 UI 的风格"，并发了一张截图。**注意：上一个模型（kimi k3-256k）读不了图片**，截图内容未知；Cursor 里若模型支持读图，可请用户重发。

1. 已改的 2.3 三处（Back 玻璃胶囊 + 箭头、Preview 玻璃胶囊 + 激活渐变）——**保留还是回退**？
2. 用户期望的控件风格是什么？请其用文字描述或指认现有组件（如"照顶栏玻璃丸做"）。

若用户确认玻璃胶囊方向，下一步自然动作：给 `.echo-chat__composer button` 加同族样式（建议 Send 用 `--echo-gradient-action` 实心白字、Stop 用玻璃胶囊），改完跑 `test:web`（`EchoChat.test.tsx` 按角色/可访问名断言，结构变动要保持 ARIA 语义）。

## 4. 设计系统硬约束（spec 强制，有测试兜底）

- 可见 UI 文案**零 em-dash**（`—`/`–`，有测试强制）；代码/标识符/UI 文案全英文；不加代码注释除非被要求。
- 圆角仅 `12 / 16 / 20 / 999` 四档；阴影必须薄荷环境色、禁纯黑；单一 teal/mint 强调色系。
- 玻璃用 backdrop-filter 近似，须提供 `prefers-reduced-transparency` 实底降级；动效仅 CSS transition，`prefers-reduced-motion` 下全关（`echo.css:2549-2555` 已有全局关断）。
- 图标统一 Phosphor 族（现状为内联 SVG，迁移中），禁止手绘新图标；装饰圆点仅限真实语义状态。
- UI 一律 sans-serif；仅手稿编辑器/预览用 EB Garamond（`echo.css:2487-2504`）。
- 设计令牌一律引用 `tokens.css` 变量，不写死色值；改 CSS 前先看 `src/styles/echo.test.ts` 的契约断言。

## 5. 关键文件地图

| 路径 | 作用 |
| --- | --- |
| `apps/web/src/App.tsx` | 视图切换与驾驶舱组装 |
| `apps/web/src/features/novelora-cockpit/components/writing/` | Writing 视图四组件 + wordCount |
| `apps/web/src/features/novelora-cockpit/lib/` | noveloraApi / hermesChat 客户端 |
| `services/api/src/` | Fastify 服务、projectStore、seed |
| `apps/web/src/styles/tokens.css` | 设计令牌（含 echo 族） |
| `apps/web/src/styles/echo.css` | 全部组件样式（单文件 2556 行） |
| `apps/web/src/styles/echo.test.ts` | CSS 源码契约测试 |
| `docs/superpowers/specs/2026-08-12-writing-workspace-design.md` | v1 设计规格（中文，含完整约束清单） |
| `docs/superpowers/plans/2026-08-12-{writing-workspace,visual-refresh}.md` | 两份实施计划（英文，checkbox 未回写） |
| `assets/extracted-handoff/echo-novel-agent-ui-handoff-v1/` | 更早的 echo UI 设计交付包（参考素材） |

## 6. 仓库卫生与注意事项

- `git status`：29 个已修改文件 + 多个 untracked（`services/`、`apps/desktop/`、`packages/hermes-plugins`、`skills/`（第三方 UI skills 合集）、`qa-screenshots/` 新目录、两份 plan + 一份 spec、`.opencode/`）。`.gitignore` 已改（含 `.novelora-data` 之类，提交前核对）。
- **不要主动 commit**。两份计划都写明"commit 前问用户"；建议用户同意后按主题分组提交（api / web writing / visual refresh / control polish）。
- 根 `AGENTS.md` 必读，但**已部分过时**：它描述的是"纯前端纯 mock"阶段，写作工作台已引入本地后端，以本文为准。
- `apps/desktop` 是 electron-vite 脚手架（只有 `main.ts`/`preload.ts`），不属于本次工作重点。
- TS 严格项：`verbatimModuleSyntax`（类型导入必须 `import type`）、`noUnusedLocals/Parameters`、`erasableSyntaxOnly`（禁 enum）。
- 测试风格：Testing Library 按角色/可访问名查询，断言 ARIA 状态；Vitest 开了 globals 但现有代码显式 `import { describe, expect, it } from 'vitest'`，请跟随。

## 7. 建议的下一步顺序

1. 解决第 3 节两个开放问题（问用户）。
2. 完成 EchoChat Send/Stop 样式，必要时同步 `EchoChat.test.tsx`。
3. 全量验证：`test:web` + `lint:web` + `build:web`。
4. 手动冒烟：`dev:api` + `seed:api` + `dev:web`（+ hermes），走 dashboard → writing → 编辑自动保存 → 预览切换 → Echo 对话 → 离线/恢复提示。
5. 按实际完成度回写两份计划的 checkbox。
6. 用户同意后分组 commit。
