# Clue & Foreshadowing System MVP Design

状态：Approved

日期：2026-08-07

上游依据：`05-clue-foreshadowing-spec.md`（本设计是其 MVP 的前端落地）

## 0. 背景与目标

当前 Novelora 驾驶舱是纯前端、mock fixture 驱动的演示仪表盘，线索面板（`ClueAttributionFlow`）只读展示。本设计把 spec 05 的线索/伏笔系统做成**真实可用的功能**：

1. 用户可创建、编辑、流转线索、伏笔、暗线、误导、链路和信息状态。
2. 归因完整性、未回收伏笔、时间线冲突等检查由纯规则引擎实时给出。
3. 接入真实 LLM（OpenAI 兼容协议，浏览器直连），生成审查报告与草案建议。
4. 数据持久化到 localStorage，支持示例项目与新建空项目，按 `novelId` 隔离。

## 1. 关键决策（已与用户确认）

| 决策点 | 结论 |
|---|---|
| 首个功能方向 | 线索伏笔系统（spec 05） |
| 实现深度 | 前端 + 真实 LLM 调用（无后端） |
| 模型接入 | OpenAI 兼容协议；设置面板配置 base URL / API key / model；key 存 localStorage |
| 首期范围 | spec 05 全量 MVP（10 类对象 + 状态机 + 链 + 信息状态 + 审查报告） |
| UI 位置 | 驾驶舱内切换工作区（不引入路由） |
| 初始数据 | 内置示例小说项目（种子数据）+ 支持新建空项目 |
| 架构方案 | 方案 A：独立 feature 模块 + 分层领域存储 |

## 2. 总体架构

新模块 `apps/web/src/features/clue-system/`：

```
features/clue-system/
├── types.ts              # 领域类型，对齐 spec §9（10 类对象 + 枚举）
├── rules/                # 纯函数规则引擎
│   ├── stateMachines.ts  #   线索/伏笔/链路状态机与转移守卫
│   ├── attribution.ts    #   归因条件必填校验、missingFields 推导
│   └── risk.ts           #   风险等级、未回收列表、时间线冲突检测
├── store/                # useReducer + Context，localStorage 持久化
│   ├── clueStore.ts      #   reducer、actions、Provider
│   ├── persistence.ts    #   版本化 schema 读写（novelora.clueSystem.v1）
│   └── seedProject.ts    #   示例小说项目（从现有 fixture 映射）
├── llm/                  # OpenAI 兼容客户端（第 3 期）
│   ├── client.ts         #   fetch chat/completions、超时、重试
│   ├── prompts.ts        #   审查报告/草案生成提示词
│   └── settings.ts       #   base URL / key / model 配置读写
└── components/           # 线索工作区 UI（第 2 期）
```

接入方式：`App.tsx` 增加工作区状态（`cockpit` | `clues`）。`ProjectSidebar` 现有固定导航项（Home/Structure/Characters/Worldbuilding/Inspiration/AI Review/Projects）中新增 "Clues" 项（同步更新其测试对导航顺序的断言）；选中时 `cockpit-main` 内容替换为 `<ClueWorkspace/>`，选回 "Home" 返回驾驶舱。AppShell 保持不变，不引入路由。

依赖方向：components → store → rules → types；llm 依赖 types 与 store 的只读快照。规则引擎零 LLM 依赖——未配置 API key 时，除 LLM 按钮外系统完整可用。

数据隔离：所有对象带 `novelId`，store 查询一律按当前激活 `novelId` 过滤（spec §17.1）。

## 3. 数据模型与持久化

### 3.1 类型

严格按 spec 05 §9 定义：`Clue`、`Foreshadowing`、`ClueChain`、`HiddenThread`、`RedHerring`、`ClueBeat`、`ClueAttribution`、`InformationState`、`CharacterKnowledge`、`ClueReviewReport`、`ClueFinding`。枚举一律字符串字面量联合类型（项目 `erasableSyntaxOnly` 禁用 enum）。

`ForeshadowingChain` 按 spec §9.11 用 `ClueChain.type = 'foreshadowing'` 表达，不单独建类型；plant/advance/payoff beat 分组等派生字段由规则引擎计算。

### 3.2 Store 形状

```ts
interface ClueSystemState {
  projects: NovelProjectMeta[];   // { novelId, title, createdAt }
  activeNovelId: string;
  clues: Clue[];
  foreshadowings: Foreshadowing[];
  chains: ClueChain[];
  hiddenThreads: HiddenThread[];
  redHerrings: RedHerring[];
  beats: ClueBeat[];
  informationStates: InformationState[];
  reports: ClueReviewReport[];
}
```

状态管理用 `useReducer` + React Context，不引入状态管理库（遵循项目约定）。

### 3.3 持久化

- localStorage key `novelora.clueSystem.v1`，写入带 `schemaVersion`。
- 读取时校验版本，不匹配则回退种子数据（首版不做自动迁移，数据可重建）。
- 状态变更后防抖 300ms 写入；写入失败（配额满/隐私模式）界面提示、不阻断操作。

### 3.4 种子数据与项目

- `seedProject.ts` 内置一个示例小说项目：把现有 `noveloraMockProject` 的 `clueFlows`、人物、章节映射为真实领域对象（若干线索、伏笔、至少一条链、信息状态示例），打开即有内容可演示。
- "新建项目"创建空小说，只含 `novelId` 与标题。
- ID 生成：`crypto.randomUUID()`。

## 4. 规则引擎

纯函数，全部单测覆盖，不依赖 React/LLM。

### 4.1 状态机（stateMachines.ts）

- `canTransitionClue(from, to)`、`canTransitionForeshadowing`、`canTransitionChain`，转移图严格按 spec §10（误导分支、废弃分支、链路 `inconsistent` 分支）。
- 转移守卫：进入 `planted` 及以上须满足归因必填（provider/trigger/receiver）；`paidOff` 须有回收章节或节点；链路进入 `complete` 须至少一个种下节点 + 一个回收节点。非法转移返回原因码，UI 据此提示。

### 4.2 归因校验（attribution.ts）

- `computeMissingFields(clue): string[]`：按 spec §9.6 条件必填规则推导；误导线索须有 misleader 或 mechanism，隐藏线索须有 concealer 或 mechanism。
- `computeCompleteness(attribution)` → `complete | missingProvider | missingTrigger | missingReceiver | missingPayoff | incomplete`。

### 4.3 风险与一致性（risk.ts）

- `computeRiskLevel(object)`：规则表驱动（无回收计划的伏笔、缺归因的活跃线索 → medium/high）。
- `findUnpaidForeshadowings(state, novelId)`：planted 之后且无 actualPayoff。
- `findTimelineConflicts(chain, beats)`：回收/揭示 beat 顺序早于种下 beat 且链未标记倒叙结构 → `timelineConflict`。
- `findKnowledgeConflicts(state, novelId)`：基础矛盾检测（如角色知情 unknown 却作为更早 beat 的 receiver/observer）；语义级判断留给 LLM。
- `deriveChainStatus(chain, beats)`：无 payoff beat 的链强制 `needsPayoff` 或 `inconsistent`（spec §9.11）。

### 4.4 派生值不落库

`missingFields`、`riskLevel`、`completeness` 读取时计算，避免存储与规则漂移。类型上保留这些字段（spec 要求），由 `enrichClue()` 等函数填充后交给 UI。

## 5. 工作区 UI

`ClueWorkspace` 占据 `cockpit-main`：

```
┌─ 工作区顶栏：项目切换器（示例项目 ▾ / 新建项目）+ LLM 状态指示 ─┐
├─ 左侧：对象列表（标签页：线索 / 伏笔 / 暗线 / 误导）            ─┤
│        筛选：状态、风险、可信度、读者可见性、章节                ─┤
├─ 右侧：详情编辑区（选中对象时）或 总览（默认）                  ─┤
└─ 底部固定：风险列表抽屉（未回收伏笔、缺归因、时间线冲突…）      ─┘
```

### 5.1 视图清单（对应 spec §15）

1. **总览**：线索总数、未回收伏笔数、高风险数、缺归因数、活跃暗线、当前误导（§15.1）。
2. **详情编辑**：全字段表单 + 归因区 + beat 时间线（增删排序）+ 信息状态区（读者/作者/各角色知情分开录入，§7.6）；状态流转按钮只展示当前状态合法的目标状态。
3. **链路视图**：纵向 Plant → Advance → Mislead/Reveal → Payoff，节点上并列展示 Provider → Trigger → Receiver → Payoff 归因条（§15.2）。
4. **章节视图**：按章节列出新增/推进/误导/回收与知情变化（§15.3）。
5. **人物知情视图**：按人物列出知道/误解/隐藏/提供/被误导（§15.4）。
6. **风险列表**：§15.5 全部项，点击跳转对应对象。
7. **审查报告视图**（第 3 期）：展示 `ClueReviewReport` findings。

### 5.2 创建与删除流程

- 四个创建入口（线索/伏笔/暗线/误导）打开同一表单抽屉的不同模式；可存草案，缺字段实时显示 `missingFields` 提示。
- 删除规则（§16.6 落地，MVP 无"已发布"概念，以 beat 引用为准）：未被任何 beat 引用的对象可硬删除（二次确认）；已被 beat 引用的对象只允许废弃（`discarded`/`abandoned`），不允许硬删除。

### 5.3 可访问性与样式

- 沿用项目约定：role/aria 语义（dialog、aria-pressed、焦点归还）、颜色全部走 `tokens.css` 变量、尊重 reduced-motion。
- 新样式写入 `src/styles/clues.css`，并把该文件纳入 `global.test.ts` 契约测试范围。

## 6. LLM 集成

### 6.1 设置

- 设置面板：base URL、API key、model ID；存 localStorage `novelora.llm.v1`。
- key 只随请求发往用户配置的 endpoint，不打日志、不进任何遥测。
- 未配置时 LLM 操作按钮禁用并提示先配置。

### 6.2 客户端（client.ts）

- `fetch` POST `{baseUrl}/chat/completions`，`Authorization: Bearer`。
- AbortController 超时（默认 60s）；网络失败重试一次。
- 要求 JSON 输出，响应经类型守卫校验；解析失败重试一次，仍失败则向用户报错，绝不写入脏数据。
- 错误信息区分：未配置 / 网络或 CORS / 鉴权失败 / 响应解析失败。

### 6.3 LLM 操作（首期三项）

1. **线索审查报告**（scope：novel / chain / clue）：规则引擎先算出确定性 findings（缺归因、未回收、时间线倒挂），LLM 补充语义 findings（误导公平性、知情冲突、weakSetup、orphanClue），合并生成 `ClueReviewReport`。所有 finding 带 `requiresUserConfirmation`。
2. **灵感 → 线索/伏笔草案**：只生成 `draft` 状态对象，保留 `sourceInspirationId`（spec §7.4）。
3. **伏笔回收建议**：仅输出结构化建议，用户确认后才落库。

### 6.4 确认门槛（spec §11.2）

LLM 永远不能直接：标记已回收、改变线索真伪、改变误导真相、把角色知情改为知道真相、删除对象。一切落库动作走用户确认的 store action。Agent 建议输出遵循 spec §11.3 结构化格式。

### 6.5 成本提示

全书级审查触发前弹确认框提示 token 成本（spec §13.2），并建议按 Arc/链分批。

## 7. 测试策略

- `rules/*.test.ts`：状态机、归因、风险、时间线、知情冲突，全纯函数单测。
- `store/clueStore.test.ts`：reducer actions、持久化往返（mock localStorage）、novelId 隔离。
- `llm/client.test.ts`：mock fetch，覆盖超时、重试、解析失败、错误分类。
- `store/seedProject.test.ts`：种子数据完整性（引用 ID 存在、状态合法）。
- `components/*.test.tsx`：Testing Library，按角色/可访问名查询，断言 aria 契约，跟随现有组件测试模式。
- `global.test.ts`：纳入 `clues.css` 契约断言。

## 8. 分期计划

| 期 | 内容 | 产出 |
|---|---|---|
| P1 数据层 | types、rules、store、persistence、seedProject | 完整领域层 + 单测，无 UI |
| P2 UI 层 | 工作区切换、总览/列表/详情/链路/章节/人物/风险视图、CRUD、状态流转 | 可用的线索工作区（无 LLM） |
| P3 LLM | 设置面板、client、审查报告、草案生成、回收建议 | spec §11 Agent 能力落地 |

每期各自产出实施计划（`docs/superpowers/plans/`），独立可验收。

## 9. 非目标（YAGNI）

- spec 05 §6 列出的全部非 MVP 项（推理诡计生成、跨小说共享、读者画像等）。
- 不建后端、不用 IndexedDB、不做旧 fixture 自动迁移。
- 驾驶舱原 `ClueAttributionFlow` 面板继续用 fixture 展示，与新数据层的打通留待后续。
- 不做多语言（UI 文案英文，跟随项目约定）。

## 10. 风险与对策

| 风险 | 对策 |
|---|---|
| 部分 OpenAI 兼容 endpoint 禁止浏览器直连（CORS） | base URL 可配置；错误提示区分 CORS，文档说明 |
| localStorage 5MB 上限 | 纯文本数据远小于上限；写入失败提示不阻断 |
| LLM 输出 JSON 不稳定 | 类型守卫 + 重试 + 失败不写库 |
| 全量 MVP 体量大 | 三期拆分，每期独立计划与验收 |
| API key 存 localStorage 的安全边界 | 单用户本地工具场景可接受；界面明示 key 只存本机 |
