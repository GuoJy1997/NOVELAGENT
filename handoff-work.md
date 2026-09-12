# 笔心本地 MVP 交接（handoff-work）

交接日期：2026-08-15。拿到这份文件的 IDE / 代理：先读本文，再动代码。  
旧文件 `handoff.md` 是 08-13 写作台 + 视觉刷新交接，**不要当当前真相**。当前真相以本文 + git HEAD 为准。

## 0. 一句话

`feature/toy-writer-cockpit-ui` 上的 **本地 MVP 工作台计划已实现并评审通过**（HEAD `9e27b44`）。测试绿。用户选择 **不合并、不推送、不建 local main**（仓库没有 `main`，`origin/HEAD` 就是这条 feature 分支）。  
**下一件必须做的事不是开新功能，而是本机联调冒烟**：api + Vite/Electron + hermes:8642 → 写作页「委派本章」→ 任务看板接受。这条路径会话里没人亲手跑过。

## 1. 仓库与分支

| 项 | 值 |
|---|---|
| 路径 | `D:\NOVELAGENT` |
| 分支 | `feature/toy-writer-cockpit-ui`（比 `origin/feature/toy-writer-cockpit-ui` **超前 35 个提交**） |
| HEAD | `9e27b44` `fix(workbench): harden atomicWrite, debounce saves, Chinese copy, electron spawn` |
| 远程默认分支 | 就是这条 feature，**没有 `main`/`master`** |
| 工作方式 | 就地开发，不是 git worktree |

**不要**去 `.worktrees/bixin-home-fidelity` 或 `http://127.0.0.1:4173/` 继续。那是旧笔心首页树，**不含这次 MVP**。要用本仓库 `apps/web`（默认 Vite 5173）或 `apps/desktop`。

规格 / 计划（工作区里仍是 **未跟踪** 文件，但内容已评审）：

- `docs/superpowers/specs/2026-08-15-local-mvp-workbench-design.md`
- `docs/superpowers/plans/2026-08-15-local-mvp-workbench.md`

SDD 流水账（gitignore，换机器可能没有）：`.superpowers/sdd/2026-08-15-local-mvp-workbench/progress.md`

## 2. 先跑起来（换 IDE 后的第一步）

环境：Windows。包管理 npm。依赖应已在 `apps/web`、`services/api`、`apps/desktop`。

```bash
# 数据
npm run seed:api          # 写入 .novelora-data/default-project/

# 三个进程（三个终端）
npm run dev:api           # Fastify 127.0.0.1:8787
npm run dev:web           # Vite，代理 /api→8787、/hermes→8642
# 另开 hermes-agent，监听 127.0.0.1:8642
# Bearer: novelora-dev-key（仅本地）
```

桌面端（会 spawn api，仍不 spawn hermes）：

```bash
npm run dev:desktop
```

验收清单（规格要证明的三件事）：

1. 改世界观一句话，保存；任务跑完后 `world.md` 字节不变。
2. 改人物 `role`，关系页出图；Network 里 **没有** `GET .../documents/relations`。
3. 写作页点 **委派本章** → 任务页把 `read_context → draft → self_check → park_draft` 点完 → **接受** → `chapters/ch_NN.md` 更新，卡片进 **完成**。

配方 hermes：`POST ${HERMES_URL}/v1/chat/completions`，`stream: false`，`Authorization: Bearer novelora-dev-key`。聊天 Echo 仍走 SSE `/hermes`。

验证命令（cwd 注意）：

```bash
npm run test:web          # 上次 43 files / 332 tests
npm run lint:web          # oxlint；RelationsPage.test.tsx 仍有 1 条 optional-chaining warning
npm run build:web         # tsc -b && vite build，必须绿
cd services/api && npx tsx --test src/index.test.ts src/taskStore.test.ts src/projectStore.test.ts src/recipeRunner.test.ts scripts/seed.test.ts
cd apps/desktop && npm test
```

`src/styles/global.test.ts` 用 `process.cwd()` 读 CSS，必须在 `apps/web` 下跑（根脚本 `test:web` 已保证）。

## 3. 产品已落地（计划 10 个 Task）

内核：**hermes-agent**，不是自研 Orchestrator。`services/api` 是文件内核 + 配方状态机。前端纯客户端。数据根 `<repo>/.novelora-data/<book-id>/`，书 id `default-project`。

导航（中文）：首页 / 写作 / 大纲 / 人物 / 关系 / 世界观 / 任务。

| 能力 | 要点 |
|---|---|
| 文件 | `outline.md` `world.md` `canon.md` `characters.json` `relations.md`（投影）`chapters/` `drafts/` `tasks/` |
| 投影 | `writeCharacters` 后重写 `relations.md`；禁止 PUT relations；上下文禁止塞 `characters.json` 和 `x:`/`y:` |
| 编辑 | 大纲/世界观 Markdown，1500ms 防抖；世界观提示：「这是设定编辑，不会召唤 Agent。」 |
| 人物/关系 | `saveCharacters` 全文件；关系页用 `CharacterGraph`；标题「人物关系图」 |
| 配方 | 单章 / 一幕 / 一卷；五步；一卷每幕结束 `pause:act` + `awaiting_accept` |
| 看板 | 列：排队 / 进行中 / 待接受 / 完成；`blocked` 在进行中 +「已阻塞」；停止 = `POST .../stop` → `queued`，不删草稿 |
| 委派 | 写作页「委派本章」→ `createTask({ recipe:'chapter', chapterNums:[n] })` + 一次 `/run` |
| 接受 | 最后一章 accept 后 `status: 'done'`；幕暂停中途 accept 仍 `awaiting_accept`，可「继续」 |
| Composer | `/` Skills、`@` Experts 中文 label；listbox 名仍是 `Skills` / `Experts` |
| 桌面 | `resolveApiSpawn()`：`NOVELORA_API_HOST=127.0.0.1`，Electron 下 `ELECTRON_RUN_AS_NODE=1`；spawn 失败不挡窗口 |

「副本」= **一卷**，不是全书，不是文件复制。

## 4. 关键路径

| 路径 | 职责 |
|---|---|
| `services/api/src/projectStore.ts` | 文档、人物、投影、`atomicWrite` |
| `services/api/src/taskStore.ts` | 任务 JSON、草稿、accept/discard、最后一章 → `done` |
| `services/api/src/recipeRunner.ts` | 五步；`assembleContext`；调 hermes |
| `services/api/src/index.ts` | HTTP；`POST /tasks/:id/run` `stop` `accept` `discard` |
| `services/api/scripts/seed.ts` | vol-1 / act-1 ch1–3 / act-2 ch4–6 |
| `apps/web/src/features/novelora-cockpit/lib/noveloraApi.ts` | 前端客户端 |
| `apps/web/src/features/novelora-cockpit/nav.ts` | 七项导航 |
| `.../components/pages/` | MarkdownDocument / Characters / Relations / TaskBoard |
| `.../components/writing/` | WritingView、ChapterEditor、EchoChat、EchoComposer |
| `apps/desktop/src/apiProcess.ts` | spawn 规格 |
| `apps/web/vite.config.ts` | `/api` `/hermes` 代理 |
| `packages/skills/draft-chapter\|act\|volume/SKILL.md` | 提示词；runner **内联同一段**，运行时不读这些文件 |

## 5. 硬约束（规格 + AGENTS.md）

- UI 中文（笔心）；代码标识符英文。可见字符串禁止 `—` / `–`（有测试）。
- api 只绑 `127.0.0.1`。文件写 tmp+rename；`atomicWrite` 先 rename 覆盖，EPERM/EEXIST 才重试，最后才 rm+rename。
- 配方不得写 `world.md` / `characters.json`。
- 不做：节点画布、拆书、伏笔台账、地图/势力/物品模块、RAG、云同步。
- 设计令牌走 `tokens.css` / `--echo-*`；圆角 12/16/20/999。新 CSS 优先页面旁路文件（如 `TaskBoardPage.css`），不要无故重写整份脏的 `echo.css`。
- 组件测试与 `X.tsx` 并置；按 role / 可访问名查询。

## 6. 未提交内容（换机器前要想清楚）

这些 **不在** `9e27b44` 里。合并或换 clone 会丢，除非另作提交或拷走。

**已修改未提交（视觉刷新 WIP）：**  
`AppShell`、`ChapterSwimlane`、`ClueAttributionFlow`、`EchoHeroBackground`、`InspirationVault`、`MemoryLayer`、`OccludedPanel`、`StructureMap`、`AIWritingPartner`、`assetRegistry.test.ts` 及其测试。

**未跟踪：**  
`EchoBookForeground.tsx`+test、大量 `docs/superpowers/*`（含本 MVP 规格/计划）、`handoff.md`、`assets/extracted-handoff/`、`qa-screenshots/`、`packages/hermes-plugins/`、`packages/skills/novel-chapter-draft/`、`skills/`、`.opencode/`。

**不要**把视觉 WIP 和 MVP 混成一次提交。用户还没说要提交。

## 7. 已知缺口（评审留下的，非阻塞）

- 手工 hermes 冒烟未跑（第 2 节）。
- 章节编辑器 / EchoChat 仍有英文壳（发送等已中文化的是 Composer）。
- 关系图「拉节点」规格有、计划选择布局本地化，未做拖拽。
- 看板一步一击「继续」，没有自动循环 `/run`。
- `委派本章` 无 in-flight 锁，连点会建两个任务。
- `/run` 在 `blocked` 上是空操作；重试路径：停止 → queued → 继续。
- 保存成功后 `dirty` 未清，卸载可能多一次 PUT。
- `oxlint`：`RelationsPage.test.tsx` optional-chaining warning。
- 无仓库级 `test:api` 脚本。
- 未提交的 `noveloraMockProject` / `StructureMap` 里仍可能有 em-dash（不在本次提交面）。

## 8. 建议工作顺序（对下一个 IDE）

1. **冒烟**（第 2 节）。失败就修联调，不要开功能。
2. 用户若要保留视觉 WIP：单独提交或 stash；不要和 api/配方搅在一起。
3. 写作页剩余英文 → 中文（改测试里的可访问名）。
4. 下一期规格才做：**伏笔台账**；可选关系图拖节点。节点画布 / RAG / 云仍然不做。
5. 规格「下一小步」：Electron 再收 hermes 子进程（本期明确不 spawn hermes）。

## 9. 给代理的开工口令

你在新 IDE 打开 `D:\NOVELAGENT` 后：

1. 确认分支 `feature/toy-writer-cockpit-ui`、HEAD `9e27b44`。
2. 读 `docs/superpowers/specs/2026-08-15-local-mvp-workbench-design.md` 与 `AGENTS.md`。
3. 先跑第 2 节冒烟，把结果写进对话。
4. 未经用户明确要求：**不要 commit、不要 push、不要 git add -A、不要建 main、不要改 `.worktrees`。**
5. 用户若说「继续开发」，先问：修冒烟 / 收视觉 WIP / 中文化写作壳 / 开伏笔规格，四选一。
