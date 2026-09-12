# 工作流引擎（图格式 + 文件核执行器）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `services/api`（文件核）里落地作者自编工作流：JSON 图定义 + 校验 + 拓扑执行器 + HTTP 路由，无画布 UI（画布另开计划）。

**Architecture:** 图是纯 JSON 文件（`workflow/graphs/<名>.json`），运行实例是另一份 JSON（`workflow/runs/<run-id>/run.json`）。执行器每次只跑一个节点：拼一次 Hermes 请求（目标 + skill 引用 + 上游附件），产物要么是附件（`workflow/attachments/` 落盘），要么是候选（走现有 `candidateStore`，作者接受才覆盖真文件）。门禁与人工节点不调模型。

**Tech Stack:** Node.js + TypeScript（tsx 执行，`.ts` 后缀 import），Fastify 5，`node:test` + `node:assert/strict` 测试，mock `fetch` 注入。零新依赖。

**对应规格:** `docs/superpowers/specs/2026-08-24-workflow-canvas-nodes-design.md`（下称「节点规格」），上位规格 `2026-08-15-hermes-shell-kernel-design.md`。

## Global Constraints

- 只改 `services/api/src/`，**不碰 `apps/web`**、不碰桌面壳、不做任何 UI。
- 不新增 npm 依赖；测试全部用 `node:test`，风格照抄现有 `recipeRunner.test.ts`（tmpdir 夹具 + mock fetch）。
- 测试命令（在 **Git Bash** 里、`services/api` 目录下运行）：`npx tsx --test src/<文件名>.test.ts`；全量：`npx tsx --test src/*.test.ts`。
- Hermes 网关地址 `http://127.0.0.1:8642`，key 固定 `novelora-dev-key`（与现有 `recipeRunner.ts` 一致）；api 端口 `8787` 不变。
- **候选红线**：模型产物永远先进候选（`drafts/candidates/`），作者接受才覆盖真文件。执行器任何路径都不许直接写 `chapters/`、`outline.md`、`world.md`、`state/`、`genes/`。
- **路线红线**：模型不能改路线。门禁只按作者画死的循环边和 `maxRetries` 走；重试耗尽标 `blocked` 等作者。
- 研究节点（节点规格 2.10）本计划**不做**；`recipeRunner.ts` 的三个固定配方**保留不动**（下线时机等三张预置图验证后另定）。
- 代码、标识符、测试断言用英文；发给模型的提示词与测试夹具文案可用中文。
- 每个任务完成后立即 commit，消息用 `feat:` / `refactor:` / `test:` 前缀。
- Windows 环境注意：凡是要存进 JSON 的相对路径（附件路径、targetPath）一律用正斜杠 `/` 手工拼接字符串，**不要**用 `join()` 的返回值存盘（Windows 上会变反斜杠）；只有真正读写磁盘时才 `join(root, relPath)`。

## 文件结构（全在 `services/api/src/`）

| 文件 | 职责 |
|---|---|
| `hermesClient.ts`（新） | `callHermes` + `HermesFailure`，从 `recipeRunner.ts` 抽出，两处共用 |
| `workflowTypes.ts`（新） | 图 / 节点 / 边 / 运行实例的全部类型 + `NODE_ID_PATTERN` |
| `workflowGraph.ts`（新） | 纯函数：`validateGraph`、`topoOrder`、`reachableFrom`、`nodesToReset`、节点 IO 表 |
| `workflowStore.ts`（新） | 图 / 运行实例 / 附件 / 缓存的落盘读写 |
| `workflowRunner.ts`（新） | 执行器：`startRun`、`runNextNode`、`resolveManual`、`forceRerun`、`parseReportScores` |
| `candidateStore.ts`（改） | 白名单扩展 `state/*`、`genes/*`；`acceptCandidate` 建父目录 |
| `recipeRunner.ts`（改） | 删掉本地 `callHermes`/`HermesFailure`，改为 import |
| `index.ts`（改） | 新增 `/projects/:id/workflow/...` 路由 + `BuildServerOptions.hermesFetch` |

每个新文件配同名 `.test.ts`；端到端验收测试单独放 `workflowRunner.e2e.test.ts`。

---

### Task 1: 抽取 `hermesClient.ts`

**Files:**
- Create: `services/api/src/hermesClient.ts`
- Create: `services/api/src/hermesClient.test.ts`
- Modify: `services/api/src/recipeRunner.ts`（删第 7-8 行常量、第 29-34 行 `HermesFailure`、第 86-109 行 `callHermes`，加一行 import）

**Interfaces:**
- Produces: `callHermes(hermesFetch: typeof fetch, model: string, messages: Array<{ role: string; content: string }>): Promise<string>`；`class HermesFailure extends Error`。后续所有任务的模型调用都走它。

- [ ] **Step 1: 写失败测试**

创建 `services/api/src/hermesClient.test.ts`：

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { callHermes, HermesFailure } from './hermesClient.ts';

const okFetch = (content: string) =>
  (async () =>
    new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;

describe('hermesClient', () => {
  it('returns the first choice content on success', async () => {
    const reply = await callHermes(okFetch('正文'), 'hermes-agent', [{ role: 'user', content: 'hi' }]);
    assert.equal(reply, '正文');
  });

  it('sends model, bearer key, and stream:false to /v1/chat/completions', async () => {
    let capturedUrl = '';
    let capturedInit: RequestInit | undefined;
    const spyFetch = (async (url: unknown, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedInit = init;
      return new Response(JSON.stringify({ choices: [{ message: { content: 'x' } }] }), { status: 200 });
    }) as typeof fetch;
    await callHermes(spyFetch, 'strong-model', [{ role: 'user', content: 'hi' }]);
    assert.match(capturedUrl, /\/v1\/chat\/completions$/);
    const headers = capturedInit?.headers as Record<string, string>;
    assert.equal(headers.Authorization, 'Bearer novelora-dev-key');
    const body = JSON.parse(String(capturedInit?.body)) as { model: string; stream: boolean };
    assert.equal(body.model, 'strong-model');
    assert.equal(body.stream, false);
  });

  it('throws HermesFailure on non-200', async () => {
    const badFetch = (async () => new Response('nope', { status: 502 })) as typeof fetch;
    await assert.rejects(
      callHermes(badFetch, 'hermes-agent', []),
      (err: unknown) => err instanceof HermesFailure,
    );
  });

  it('throws HermesFailure when fetch rejects', async () => {
    const deadFetch = (async () => { throw new Error('ECONNREFUSED'); }) as typeof fetch;
    await assert.rejects(
      callHermes(deadFetch, 'hermes-agent', []),
      (err: unknown) => err instanceof HermesFailure,
    );
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd services/api && npx tsx --test src/hermesClient.test.ts`
Expected: FAIL（找不到模块 `./hermesClient.ts`）

- [ ] **Step 3: 实现 `hermesClient.ts`**

内容就是 `recipeRunner.ts` 现有代码搬家 + export：

```ts
export class HermesFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HermesFailure';
  }
}

const HERMES_URL = process.env.HERMES_URL ?? 'http://127.0.0.1:8642';
const HERMES_KEY = 'novelora-dev-key';

export async function callHermes(
  hermesFetch: typeof fetch,
  model: string,
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  try {
    const res = await hermesFetch(`${HERMES_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HERMES_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, stream: false, messages }),
    });
    if (!res.ok) throw new Error(`hermes ${res.status}`);
    const data = await res.json() as { choices?: Array<{ message?: { content?: unknown } }> };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('hermes empty');
    return content;
  } catch (err) {
    if (err instanceof HermesFailure) throw err;
    throw new HermesFailure(err instanceof Error ? err.message : 'hermes failed');
  }
}
```

然后改 `recipeRunner.ts`：

1. 删除第 7-8 行（`HERMES_URL`、`HERMES_KEY` 常量）。
2. 删除 `class HermesFailure { ... }`（现第 29-34 行）。
3. 删除 `async function callHermes(...) { ... }`（现第 86-109 行）。
4. 在文件顶部 import 区加：`import { callHermes, HermesFailure } from './hermesClient.ts';`

其余一行都不动（`stepDraft`、`stepSelfCheck`、`runTaskStep` 里对 `callHermes` / `instanceof HermesFailure` 的用法原样兼容）。

- [ ] **Step 4: 跑测试确认通过（含回归）**

Run: `cd services/api && npx tsx --test src/hermesClient.test.ts src/recipeRunner.test.ts`
Expected: 全部 PASS

- [ ] **Step 5: Commit**

```bash
git add services/api/src/hermesClient.ts services/api/src/hermesClient.test.ts services/api/src/recipeRunner.ts
git commit -m "refactor: extract shared hermes client from recipe runner"
```

---

### Task 2: 类型 + 图校验（`workflowTypes.ts` / `workflowGraph.ts`）

**Files:**
- Create: `services/api/src/workflowTypes.ts`
- Create: `services/api/src/workflowGraph.ts`
- Test: `services/api/src/workflowGraph.test.ts`

**Interfaces:**
- Consumes: `isAllowedTargetPath(path: string): boolean`（来自 `candidateStore.ts`，Task 4 会扩它的白名单，但函数签名不变）
- Produces（后续任务全靠这些，名字不许改）:
  - 类型：`WorkflowNodeType`、`AttachmentType`、`WorkflowNode`、`WorkflowEdge`、`WorkflowGraph`、`NodeRun`、`NodeRunStatus`、`WorkflowRun`、`RunStatus`、`WorkflowNodeConfig`
  - 常量：`NODE_ID_PATTERN`（在 workflowTypes）、`NODE_PRODUCES`、`NODE_ACCEPTS`、`CANDIDATE_NODE_TYPES`
  - 函数：`validateGraph(graph: WorkflowGraph): string[]`（空数组=合法）、`topoOrder(graph: WorkflowGraph): string[]`、`reachableFrom(graph: WorkflowGraph, startId: string): Set<string>`、`nodesToReset(graph: WorkflowGraph, loopTargetId: string, gateId: string): string[]`

**设计决定（节点规格授权本计划敲定的点）：**

- 记忆沉淀的状态文件布局：`state/facts.md`（事实账）、`state/foreshadow.md`（伏笔台账）、`state/timeline.md`（时间线）。
- 审查分数格式：报告正文最后**单独一行** `SCORES: {"overall": <0-100 整数>}`，JSON 里可带其他维度字段。门禁读 `config.scoreField`（默认 `overall`）。
- 门禁没拿到分数 → 转 `waiting_author`（只支持人工放行），不猜分。
- 边类型新增 `pass`：门禁 / 任意节点的纯控制边，不携带内容，只表达先后。门禁的产出类型就是 `pass`。
- 基因节点双产物：`gene` 附件（给同图下游用）+ 指向 `genes/<名>.md` 的候选（作者接受才入库，即节点规格第 8 节的"作者过目"）。

- [ ] **Step 1: 写失败测试**

创建 `services/api/src/workflowGraph.test.ts`：

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nodesToReset, topoOrder, validateGraph } from './workflowGraph.ts';
import type { WorkflowGraph } from './workflowTypes.ts';

function acceptanceGraph(): WorkflowGraph {
  return {
    name: 'acceptance',
    model: 'hermes-agent',
    nodes: [
      { id: 'scan', type: 'explore', title: '盘点', goal: '盘点全书', skills: [], config: { sourcePaths: ['outline.md'] } },
      { id: 'dna', type: 'gene', title: '拆书', goal: '提取基因', skills: [], config: { sourcePaths: ['import/book.txt'], targetPath: 'genes/book.md' } },
      { id: 'draft', type: 'write', title: '写作', goal: '写第 1 章', skills: ['opening-hook'], config: { targetPath: 'chapters/ch_01.md' } },
      { id: 'wash', type: 'deai', title: '去 AI 味', goal: '洗稿', skills: [], config: { targetPath: 'chapters/ch_01.md' } },
      { id: 'judge', type: 'review', title: '审查', goal: '审稿', skills: [] },
      { id: 'door', type: 'gate', title: '门禁', goal: '低分打回', skills: [], config: { threshold: 80 } },
      { id: 'check', type: 'manual', title: '作者检查', goal: '过目', skills: [] },
    ],
    edges: [
      { from: 'scan', to: 'draft', attachmentType: 'fact' },
      { from: 'dna', to: 'draft', attachmentType: 'gene' },
      { from: 'draft', to: 'wash', attachmentType: 'candidate_ref' },
      { from: 'wash', to: 'judge', attachmentType: 'candidate_ref' },
      { from: 'judge', to: 'door', attachmentType: 'report' },
      { from: 'door', to: 'draft', attachmentType: 'pass', loop: true, maxRetries: 2 },
      { from: 'door', to: 'check', attachmentType: 'pass' },
    ],
  };
}

describe('validateGraph', () => {
  it('accepts the acceptance graph from the spec', () => {
    assert.deepEqual(validateGraph(acceptanceGraph()), []);
  });

  it('rejects edges to unknown nodes', () => {
    const graph = acceptanceGraph();
    graph.edges.push({ from: 'scan', to: 'ghost', attachmentType: 'fact' });
    assert.ok(validateGraph(graph).some((e) => e.includes('unknown node')));
  });

  it('rejects a candidate node without an allowed targetPath', () => {
    const graph = acceptanceGraph();
    delete graph.nodes[2].config;
    assert.ok(validateGraph(graph).some((e) => e.includes('targetPath')));
  });

  it('rejects an edge whose type does not match what the source produces', () => {
    const graph = acceptanceGraph();
    graph.edges[0] = { from: 'scan', to: 'draft', attachmentType: 'candidate_ref' };
    assert.ok(validateGraph(graph).some((e) => e.includes('produces fact')));
  });

  it('rejects a review node with no candidate_ref in-edge', () => {
    const graph = acceptanceGraph();
    graph.edges = graph.edges.filter((e) => !(e.to === 'judge' && e.attachmentType === 'candidate_ref'));
    assert.ok(validateGraph(graph).some((e) => e.includes('requires an upstream candidate_ref')));
  });

  it('rejects loop edges from non-gate nodes and loop edges without maxRetries', () => {
    const graph = acceptanceGraph();
    graph.edges.push({ from: 'draft', to: 'scan', attachmentType: 'pass', loop: true, maxRetries: 1 });
    assert.ok(validateGraph(graph).some((e) => e.includes('loop edge must start at a gate')));

    const graph2 = acceptanceGraph();
    const loop = graph2.edges.find((e) => e.loop);
    delete loop?.maxRetries;
    assert.ok(validateGraph(graph2).some((e) => e.includes('maxRetries')));
  });

  it('rejects cycles built from non-loop edges', () => {
    const graph = acceptanceGraph();
    graph.edges.push({ from: 'judge', to: 'wash', attachmentType: 'report' });
    // review 产 report，deai 不吃 report → 先撞类型错；改成合法类型也要撞环检测
    graph.edges[graph.edges.length - 1] = { from: 'check', to: 'scan', attachmentType: 'author_decision' };
    const errors = validateGraph(graph);
    assert.ok(errors.some((e) => e.includes('cycle')) || errors.some((e) => e.includes('does not accept')));
  });
});

describe('topoOrder / nodesToReset', () => {
  it('orders upstream before downstream, ignoring loop edges', () => {
    const order = topoOrder(acceptanceGraph());
    assert.ok(order.indexOf('scan') < order.indexOf('draft'));
    assert.ok(order.indexOf('draft') < order.indexOf('wash'));
    assert.ok(order.indexOf('judge') < order.indexOf('door'));
    assert.ok(order.indexOf('door') < order.indexOf('check'));
    assert.equal(order.length, 7);
  });

  it('resets exactly the nodes between the loop target and the gate', () => {
    const ids = nodesToReset(acceptanceGraph(), 'draft', 'door').sort();
    assert.deepEqual(ids, ['draft', 'judge', 'wash']);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd services/api && npx tsx --test src/workflowGraph.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 `workflowTypes.ts`（完整文件）**

```ts
export type WorkflowNodeType =
  | 'explore'
  | 'gene'
  | 'outline'
  | 'write'
  | 'deai'
  | 'review'
  | 'memory'
  | 'gate'
  | 'manual';

export type AttachmentType = 'fact' | 'report' | 'gene' | 'candidate_ref' | 'author_decision' | 'pass';

export const NODE_ID_PATTERN = /^[a-z][a-z0-9_-]{0,31}$/;

export interface WorkflowNodeConfig {
  /** explore/gene/memory 的输入真文件（书目录相对路径，正斜杠） */
  sourcePaths?: string[];
  /** deai 专属：作者文字样本路径 */
  voiceSamplePath?: string;
  /** 候选节点与 gene 节点的目标真文件路径 */
  targetPath?: string;
  /** gate 专属：低于此分走循环边；缺省 = 只支持人工放行 */
  threshold?: number;
  /** gate 专属：读报告 SCORES 里哪个字段，默认 'overall' */
  scoreField?: string;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  title: string;
  goal: string;
  /** Hermes skill 引用（只存 id，不存正文），见 /hermes/v1/skills */
  skills: string[];
  expert?: string;
  /** 缺省继承 graph.model */
  model?: string;
  config?: WorkflowNodeConfig;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  attachmentType: AttachmentType;
  /** 门禁打回边；不参与拓扑排序与环检测 */
  loop?: boolean;
  /** loop 边必填，>= 1 */
  maxRetries?: number;
}

export interface WorkflowGraph {
  name: string;
  /** 全局默认模型，走 Hermes 路由 */
  model: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export type NodeRunStatus = 'pending' | 'running' | 'done' | 'blocked' | 'failed' | 'waiting_author';

export interface NodeRun {
  nodeId: string;
  status: NodeRunStatus;
  /** 附件相对路径，如 workflow/attachments/<runId>/<nodeId>.md */
  attachmentPath?: string;
  /** 候选节点 / gene 节点产出的候选 id */
  candidateId?: string;
  /** gate 已用重试次数（保留跨 reset） */
  retriesUsed: number;
  /** gate 读到的分数 */
  score?: number;
  /** explore/gene 命中缓存 */
  cached?: boolean;
  /** 作者强制重跑标记（跳过缓存），跑完即清 */
  forceRerun?: boolean;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
}

export type RunStatus = 'running' | 'waiting_author' | 'blocked' | 'offline' | 'done';

export interface WorkflowRun {
  id: string;
  graphName: string;
  status: RunStatus;
  nodes: Record<string, NodeRun>;
  createdAt: string;
}
```

- [ ] **Step 4: 实现 `workflowGraph.ts`（完整文件）**

```ts
import { isAbsolute } from 'node:path';
import { isAllowedTargetPath } from './candidateStore.ts';
import { NODE_ID_PATTERN } from './workflowTypes.ts';
import type { AttachmentType, WorkflowGraph, WorkflowNodeType } from './workflowTypes.ts';

export const NODE_PRODUCES: Record<WorkflowNodeType, AttachmentType> = {
  explore: 'fact',
  gene: 'gene',
  outline: 'candidate_ref',
  write: 'candidate_ref',
  deai: 'candidate_ref',
  review: 'report',
  memory: 'candidate_ref',
  gate: 'pass',
  manual: 'author_decision',
};

export const NODE_ACCEPTS: Record<WorkflowNodeType, AttachmentType[]> = {
  explore: ['pass'],
  gene: ['pass'],
  outline: ['fact', 'gene', 'author_decision', 'pass'],
  write: ['fact', 'gene', 'candidate_ref', 'report', 'author_decision', 'pass'],
  deai: ['candidate_ref', 'author_decision', 'pass'],
  review: ['candidate_ref', 'fact', 'pass'],
  memory: ['author_decision', 'pass'],
  gate: ['report', 'pass'],
  manual: ['fact', 'report', 'gene', 'candidate_ref', 'author_decision', 'pass'],
};

export const CANDIDATE_NODE_TYPES: WorkflowNodeType[] = ['outline', 'write', 'deai', 'memory'];

/** 这些类型必须有对应类型的非 loop 入边，否则摆图就报错 */
const REQUIRED_IN: Partial<Record<WorkflowNodeType, AttachmentType>> = {
  deai: 'candidate_ref',
  review: 'candidate_ref',
  gate: 'report',
};

/** 需要 config.sourcePaths 非空的类型 */
const NEEDS_SOURCES: WorkflowNodeType[] = ['explore', 'gene', 'memory'];

const GRAPH_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

function badPath(path: string): boolean {
  return path.length === 0 || path.includes('..') || isAbsolute(path) || path.includes('\\');
}

export function validateGraph(graph: WorkflowGraph): string[] {
  const errors: string[] = [];
  if (!GRAPH_NAME_PATTERN.test(graph.name)) errors.push(`invalid graph name ${graph.name}`);
  if (typeof graph.model !== 'string' || graph.model.trim() === '') errors.push('graph model must be a non-empty string');

  const ids = new Set<string>();
  for (const node of graph.nodes) {
    if (!NODE_ID_PATTERN.test(node.id)) errors.push(`invalid node id ${node.id}`);
    if (ids.has(node.id)) errors.push(`duplicate node id ${node.id}`);
    ids.add(node.id);
    if (!(node.type in NODE_PRODUCES)) {
      errors.push(`unknown node type ${String(node.type)} on ${node.id}`);
      continue;
    }
    if (CANDIDATE_NODE_TYPES.includes(node.type)) {
      const target = node.config?.targetPath;
      if (!target || !isAllowedTargetPath(target)) errors.push(`node ${node.id} needs an allowed targetPath`);
    }
    if (node.type === 'gene') {
      const target = node.config?.targetPath;
      if (!target || !target.startsWith('genes/') || !isAllowedTargetPath(target)) {
        errors.push(`gene node ${node.id} needs a targetPath under genes/`);
      }
    }
    if (NEEDS_SOURCES.includes(node.type) && !(node.config?.sourcePaths?.length)) {
      errors.push(`node ${node.id} needs non-empty sourcePaths`);
    }
    for (const path of node.config?.sourcePaths ?? []) {
      if (badPath(path)) errors.push(`node ${node.id} has an unsafe source path ${path}`);
    }
    const voice = node.config?.voiceSamplePath;
    if (voice && badPath(voice)) errors.push(`node ${node.id} has an unsafe voiceSamplePath ${voice}`);
  }

  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const loopCount = new Map<string, number>();
  for (const edge of graph.edges) {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) {
      errors.push(`edge ${edge.from}->${edge.to} references an unknown node`);
      continue;
    }
    if (edge.loop) {
      if (from.type !== 'gate') errors.push(`loop edge must start at a gate node, not ${edge.from}`);
      if (!Number.isInteger(edge.maxRetries) || (edge.maxRetries ?? 0) < 1) {
        errors.push(`loop edge ${edge.from}->${edge.to} needs integer maxRetries >= 1`);
      }
      loopCount.set(edge.from, (loopCount.get(edge.from) ?? 0) + 1);
      continue;
    }
    if (NODE_PRODUCES[from.type] !== edge.attachmentType) {
      errors.push(`edge ${edge.from}->${edge.to}: node ${edge.from} produces ${NODE_PRODUCES[from.type]}, not ${edge.attachmentType}`);
    }
    if (!NODE_ACCEPTS[to.type].includes(edge.attachmentType)) {
      errors.push(`edge ${edge.from}->${edge.to}: node ${edge.to} does not accept ${edge.attachmentType}`);
    }
  }
  for (const [gateId, count] of loopCount) {
    if (count > 1) errors.push(`gate ${gateId} may have at most one loop edge`);
  }

  for (const node of graph.nodes) {
    const required = REQUIRED_IN[node.type];
    if (!required) continue;
    const has = graph.edges.some((edge) => !edge.loop && edge.to === node.id && edge.attachmentType === required);
    if (!has) errors.push(`node ${node.id} requires an upstream ${required} edge`);
  }

  if (errors.length === 0 && topoOrder(graph).length !== graph.nodes.length) {
    errors.push('graph has a cycle outside loop edges');
  }
  return errors;
}

/** Kahn 拓扑排序，忽略 loop 边；有环时返回长度不足的数组 */
export function topoOrder(graph: WorkflowGraph): string[] {
  const indegree = new Map<string, number>(graph.nodes.map((node) => [node.id, 0]));
  for (const edge of graph.edges) {
    if (edge.loop || !indegree.has(edge.to) || !indegree.has(edge.from)) continue;
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
  }
  const queue = graph.nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const edge of graph.edges) {
      if (edge.loop || edge.from !== id || !indegree.has(edge.to)) continue;
      const next = (indegree.get(edge.to) ?? 0) - 1;
      indegree.set(edge.to, next);
      if (next === 0) queue.push(edge.to);
    }
  }
  return order;
}

/** 从 startId 沿非 loop 边可达的所有节点（含自身） */
export function reachableFrom(graph: WorkflowGraph, startId: string): Set<string> {
  const seen = new Set<string>([startId]);
  const queue = [startId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of graph.edges) {
      if (edge.loop || edge.from !== current || seen.has(edge.to)) continue;
      seen.add(edge.to);
      queue.push(edge.to);
    }
  }
  return seen;
}

/** 门禁打回时要重置的节点：loopTarget 可达、且能到达 gate 的节点（不含 gate 本身） */
export function nodesToReset(graph: WorkflowGraph, loopTargetId: string, gateId: string): string[] {
  const forward = reachableFrom(graph, loopTargetId);
  const result: string[] = [];
  for (const id of forward) {
    if (id === gateId) continue;
    if (reachableFrom(graph, id).has(gateId)) result.push(id);
  }
  return result;
}
```

- [ ] **Step 5: 跑测试确认通过**

Run: `cd services/api && npx tsx --test src/workflowGraph.test.ts`
Expected: 全部 PASS

- [ ] **Step 6: Commit**

```bash
git add services/api/src/workflowTypes.ts services/api/src/workflowGraph.ts services/api/src/workflowGraph.test.ts
git commit -m "feat: workflow graph types and validation"
```

---

### Task 3: 落盘存储（`workflowStore.ts`）

**Files:**
- Create: `services/api/src/workflowStore.ts`
- Test: `services/api/src/workflowStore.test.ts`

**Interfaces:**
- Consumes: `atomicWrite(target: string, content: string): Promise<void>`（`projectStore.ts`，**不建父目录**，所以每次写之前自己 `mkdir`）
- Produces:
  - `isValidGraphName(name: string): boolean`
  - `writeGraph(root: string, graph: WorkflowGraph): Promise<void>` / `readGraph(root: string, name: string): Promise<WorkflowGraph>` / `listGraphs(root: string): Promise<string[]>`
  - `writeRun(root: string, run: WorkflowRun): Promise<void>` / `readRun(root: string, runId: string): Promise<WorkflowRun>` / `listRuns(root: string): Promise<WorkflowRun[]>`
  - `writeAttachment(root: string, runId: string, nodeId: string, content: string): Promise<string>`（返回**正斜杠**相对路径）/ `readAttachment(root: string, relPath: string): Promise<string>`
  - 错误消息约定（路由靠它分辨 404/400）：未知图 `Unknown graph <name>`、非法图名 `Invalid graph name <name>`、未知运行 `Unknown run <id>`、非法运行 id `Invalid run id <id>`、未知附件 `Unknown attachment <relPath>`

磁盘布局（书目录 `root` 下）：

```
workflow/
├── graphs/<name>.json          # WorkflowGraph
├── runs/<run-id>/run.json      # WorkflowRun
├── attachments/<run-id>/<node-id>.md
└── cache/<node-id>.json        # Task 8 才用：{ fingerprint, content }
```

- [ ] **Step 1: 写失败测试**

创建 `services/api/src/workflowStore.test.ts`：

```ts
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidGraphName, listGraphs, listRuns, readAttachment, readGraph, readRun,
  writeAttachment, writeGraph, writeRun,
} from './workflowStore.ts';
import type { WorkflowGraph, WorkflowRun } from './workflowTypes.ts';

const graph: WorkflowGraph = {
  name: 'daily',
  model: 'hermes-agent',
  nodes: [{ id: 'scan', type: 'explore', title: '盘点', goal: '盘点', skills: [], config: { sourcePaths: ['outline.md'] } }],
  edges: [],
};

describe('workflowStore', () => {
  let root: string;
  before(async () => { root = await mkdtemp(join(tmpdir(), 'novelora-wfstore-')); });
  after(() => rm(root, { recursive: true, force: true }));

  it('round-trips graphs and lists them by name', async () => {
    await writeGraph(root, graph);
    assert.deepEqual(await readGraph(root, 'daily'), graph);
    assert.deepEqual(await listGraphs(root), ['daily']);
    assert.deepEqual(await listGraphs(await mkdtemp(join(tmpdir(), 'novelora-empty-'))), []);
  });

  it('rejects unsafe graph names and unknown graphs', async () => {
    assert.equal(isValidGraphName('../evil'), false);
    await assert.rejects(readGraph(root, '../evil'), /Invalid graph name/);
    await assert.rejects(readGraph(root, 'missing'), /Unknown graph missing/);
  });

  it('round-trips runs', async () => {
    const run: WorkflowRun = {
      id: crypto.randomUUID(),
      graphName: 'daily',
      status: 'running',
      nodes: { scan: { nodeId: 'scan', status: 'pending', retriesUsed: 0 } },
      createdAt: new Date().toISOString(),
    };
    await writeRun(root, run);
    assert.deepEqual(await readRun(root, run.id), run);
    assert.equal((await listRuns(root)).length, 1);
    await assert.rejects(readRun(root, 'not-a-uuid'), /Invalid run id/);
    await assert.rejects(readRun(root, crypto.randomUUID()), /Unknown run/);
  });

  it('writes attachments under workflow/attachments and reads them back', async () => {
    const runId = crypto.randomUUID();
    const relPath = await writeAttachment(root, runId, 'scan', '盘点结果');
    assert.equal(relPath, `workflow/attachments/${runId}/scan.md`);
    assert.equal(await readAttachment(root, relPath), '盘点结果');
    await assert.rejects(readAttachment(root, '../outside.md'), /Unknown attachment/);
    await assert.rejects(readAttachment(root, 'chapters/ch_01.md'), /Unknown attachment/);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd services/api && npx tsx --test src/workflowStore.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 `workflowStore.ts`（完整文件）**

```ts
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { atomicWrite } from './projectStore.ts';
import { NODE_ID_PATTERN } from './workflowTypes.ts';
import type { WorkflowGraph, WorkflowRun } from './workflowTypes.ts';

const GRAPH_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidGraphName(name: string): boolean {
  return GRAPH_NAME_PATTERN.test(name);
}

function notFound(err: unknown): boolean {
  return err instanceof Error && 'code' in err && err.code === 'ENOENT';
}

function graphFile(root: string, name: string): string {
  if (!isValidGraphName(name)) throw new Error(`Invalid graph name ${name}`);
  return join(root, 'workflow', 'graphs', `${name}.json`);
}

function runFile(root: string, runId: string): string {
  if (!UUID_SHAPE.test(runId)) throw new Error(`Invalid run id ${runId}`);
  return join(root, 'workflow', 'runs', runId, 'run.json');
}

export async function writeGraph(root: string, graph: WorkflowGraph): Promise<void> {
  const target = graphFile(root, graph.name);
  await mkdir(join(root, 'workflow', 'graphs'), { recursive: true });
  await atomicWrite(target, JSON.stringify(graph, null, 2));
}

export async function readGraph(root: string, name: string): Promise<WorkflowGraph> {
  try {
    return JSON.parse(await readFile(graphFile(root, name), 'utf8')) as WorkflowGraph;
  } catch (err) {
    if (notFound(err)) throw new Error(`Unknown graph ${name}`);
    throw err;
  }
}

export async function listGraphs(root: string): Promise<string[]> {
  try {
    const names = await readdir(join(root, 'workflow', 'graphs'));
    return names.filter((name) => name.endsWith('.json')).map((name) => name.slice(0, -5)).sort();
  } catch (err) {
    if (notFound(err)) return [];
    throw err;
  }
}

export async function writeRun(root: string, run: WorkflowRun): Promise<void> {
  const target = runFile(root, run.id);
  await mkdir(join(root, 'workflow', 'runs', run.id), { recursive: true });
  await atomicWrite(target, JSON.stringify(run, null, 2));
}

export async function readRun(root: string, runId: string): Promise<WorkflowRun> {
  try {
    return JSON.parse(await readFile(runFile(root, runId), 'utf8')) as WorkflowRun;
  } catch (err) {
    if (notFound(err)) throw new Error(`Unknown run ${runId}`);
    throw err;
  }
}

export async function listRuns(root: string): Promise<WorkflowRun[]> {
  try {
    const ids = await readdir(join(root, 'workflow', 'runs'));
    const runs: WorkflowRun[] = [];
    for (const id of ids) {
      if (!UUID_SHAPE.test(id)) continue;
      try {
        runs.push(await readRun(root, id));
      } catch (err) {
        if (!(err instanceof Error && err.message.startsWith('Unknown run'))) throw err;
      }
    }
    return runs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch (err) {
    if (notFound(err)) return [];
    throw err;
  }
}

export async function writeAttachment(root: string, runId: string, nodeId: string, content: string): Promise<string> {
  if (!UUID_SHAPE.test(runId)) throw new Error(`Invalid run id ${runId}`);
  if (!NODE_ID_PATTERN.test(nodeId)) throw new Error(`Invalid node id ${nodeId}`);
  await mkdir(join(root, 'workflow', 'attachments', runId), { recursive: true });
  await atomicWrite(join(root, 'workflow', 'attachments', runId, `${nodeId}.md`), content);
  return `workflow/attachments/${runId}/${nodeId}.md`;
}

export async function readAttachment(root: string, relPath: string): Promise<string> {
  if (!relPath.startsWith('workflow/attachments/') || relPath.includes('..')) {
    throw new Error(`Unknown attachment ${relPath}`);
  }
  try {
    return await readFile(join(root, relPath), 'utf8');
  } catch (err) {
    if (notFound(err)) throw new Error(`Unknown attachment ${relPath}`);
    throw err;
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `cd services/api && npx tsx --test src/workflowStore.test.ts`
Expected: 全部 PASS

- [ ] **Step 5: Commit**

```bash
git add services/api/src/workflowStore.ts services/api/src/workflowStore.test.ts
git commit -m "feat: workflow graph, run, and attachment storage"
```

---

### Task 4: 候选白名单扩展（`candidateStore.ts`）

**Files:**
- Modify: `services/api/src/candidateStore.ts`
- Test: `services/api/src/candidateStore.test.ts`（追加用例，别动已有用例）

**Interfaces:**
- Produces: `isAllowedTargetPath` 额外放行 `state/facts.md`、`state/foreshadow.md`、`state/timeline.md`、`genes/<安全文件名>.md`；`acceptCandidate` 能写入尚不存在的子目录。
- 继续拒绝：`characters.json`、`relations.md`、任何 `..` / 绝对路径 / 白名单外的路径。

- [ ] **Step 1: 追加失败测试**

在 `services/api/src/candidateStore.test.ts` 的顶层 `describe` 内追加（沿用该文件已有的 `root` 夹具；如果它没有现成 `root`，照 `workflowStore.test.ts` 的 mkdtemp 写法建独立 describe）：

```ts
it('allows state ledgers and gene assets as target paths', () => {
  assert.equal(isAllowedTargetPath('state/facts.md'), true);
  assert.equal(isAllowedTargetPath('state/foreshadow.md'), true);
  assert.equal(isAllowedTargetPath('state/timeline.md'), true);
  assert.equal(isAllowedTargetPath('genes/source-book.md'), true);
  assert.equal(isAllowedTargetPath('state/other.md'), false);
  assert.equal(isAllowedTargetPath('genes/../world.md'), false);
  assert.equal(isAllowedTargetPath('genes/UPPER.md'), false);
});

it('accepting a candidate creates missing parent directories', async () => {
  const candidate = await writeCandidate(root, {
    runId: crypto.randomUUID(),
    targetPath: 'state/facts.md',
    source: 'workflow',
    content: '事实：主角已获得钥匙',
  });
  await acceptCandidate(root, candidate.id);
  assert.match(await readFile(join(root, 'state', 'facts.md'), 'utf8'), /钥匙/);
});
```

（按需补 import：`readFile`、`join`、`isAllowedTargetPath`、`writeCandidate`、`acceptCandidate`。）

- [ ] **Step 2: 跑测试确认失败**

Run: `cd services/api && npx tsx --test src/candidateStore.test.ts`
Expected: 新增两条 FAIL，旧用例 PASS

- [ ] **Step 3: 实现**

`candidateStore.ts` 改三处：

1. 常量区（`ALLOWED_DOCS` 旁）加：

```ts
const ALLOWED_STATE = /^state\/(facts|foreshadow|timeline)\.md$/;
const ALLOWED_GENE = /^genes\/[a-z0-9][a-z0-9_-]{0,63}\.md$/;
```

2. `isAllowedTargetPath` 在 `ALLOWED_CHAPTER.test` 之后加：

```ts
  if (ALLOWED_STATE.test(path) || ALLOWED_GENE.test(path)) return true;
```

3. `acceptCandidate` 里 `atomicWrite` 之前加一行建父目录（`dirname` 从 `node:path` import）：

```ts
  await mkdir(dirname(join(root, meta.targetPath)), { recursive: true });
```

- [ ] **Step 4: 跑测试确认通过**

Run: `cd services/api && npx tsx --test src/candidateStore.test.ts`
Expected: 全部 PASS

- [ ] **Step 5: Commit**

```bash
git add services/api/src/candidateStore.ts services/api/src/candidateStore.test.ts
git commit -m "feat: allow state ledger and gene asset candidate targets"
```

---

### Task 5: 执行器核心（`workflowRunner.ts`：模型节点 + 受阻 + 离线）

**Files:**
- Create: `services/api/src/workflowRunner.ts`
- Test: `services/api/src/workflowRunner.test.ts`

**Interfaces:**
- Consumes: Task 1 `callHermes`/`HermesFailure`；Task 2 全部；Task 3 `readGraph`/`readRun`/`writeRun`/`writeAttachment`/`readAttachment`；`candidateStore` 的 `writeCandidate`/`readCandidateContent`。
- Produces:
  - `startRun(root: string, graphName: string): Promise<WorkflowRun>`（校验失败抛 `Invalid graph <name>: <errors>`）
  - `runNextNode(root: string, runId: string, hermesFetch?: typeof fetch): Promise<WorkflowRun>`
  - 本任务里 gate 分支先抛 `` `gate node ${node.id} is not supported yet` ``，**Task 6 换成真实现**；manual 分支本任务就做完（置 `waiting_author`）。

**执行语义（照节点规格第 6 节，写死）：**

1. 每次 `runNextNode` 只跑一个节点：拓扑序里第一个 `pending` 且所有非 loop 入边源节点都 `done` 的。
2. 上游产物拿不到（候选被作者丢弃、附件文件消失、sourcePaths 缺文件）→ 该节点 `blocked`，不调 Hermes。
3. `HermesFailure` → 节点 `failed`，整个 run `offline`；已有候选与附件全部保留。
4. run 状态归纳优先级：有 `failed` → `offline`；有 `waiting_author` → `waiting_author`；有 `blocked` → `blocked`；全 `done` → `done`；其余 → `running`。

- [ ] **Step 1: 写失败测试**

创建 `services/api/src/workflowRunner.test.ts`：

```ts
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { listPendingCandidates } from './candidateStore.ts';
import { readAttachment, writeGraph } from './workflowStore.ts';
import { runNextNode, startRun } from './workflowRunner.ts';
import type { WorkflowGraph } from './workflowTypes.ts';

function scriptedFetch(replies: string[], bodies: unknown[] = []): typeof fetch {
  return (async (_url: unknown, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body ?? '{}')));
    const content = replies.shift();
    if (content === undefined) throw new Error('scriptedFetch ran out of replies');
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

function chainGraph(): WorkflowGraph {
  return {
    name: 'chain',
    model: 'hermes-agent',
    nodes: [
      { id: 'scan', type: 'explore', title: '盘点', goal: '盘点世界观', skills: [], config: { sourcePaths: ['world.md'] } },
      { id: 'draft', type: 'write', title: '写作', goal: '写第 1 章', skills: ['opening-hook'], model: 'strong-model', config: { targetPath: 'chapters/ch_01.md' } },
      { id: 'wash', type: 'deai', title: '洗稿', goal: '去 AI 味', skills: [], config: { targetPath: 'chapters/ch_01.md', voiceSamplePath: 'voice.md' } },
      { id: 'judge', type: 'review', title: '审查', goal: '审第 1 章', skills: [] },
    ],
    edges: [
      { from: 'scan', to: 'draft', attachmentType: 'fact' },
      { from: 'draft', to: 'wash', attachmentType: 'candidate_ref' },
      { from: 'wash', to: 'judge', attachmentType: 'candidate_ref' },
    ],
  };
}

describe('workflowRunner core', () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'novelora-wfrun-'));
    await mkdir(join(root, 'chapters'), { recursive: true });
    await writeFile(join(root, 'world.md'), '规则：禁直呼潮名');
    await writeFile(join(root, 'voice.md'), '短句。爱用句号。');
    await writeFile(join(root, 'chapters/ch_01.md'), '');
  });

  it('startRun rejects graphs that fail validation', async () => {
    const bad = chainGraph();
    delete bad.nodes[1].config;
    await writeGraph(root, bad);
    await assert.rejects(startRun(root, 'chain'), /Invalid graph chain/);
  });

  it('walks the chain: attachment, candidates, and prompts are wired correctly', async () => {
    await writeGraph(root, chainGraph());
    const bodies: Array<{ model: string; messages: Array<{ role: string; content: string }> }> = [];
    const hermesFetch = scriptedFetch(['盘点：尚无完成章', '初稿正文', '洗稿正文', '审查意见'], bodies as unknown[]);
    let run = await startRun(root, 'chain');

    run = await runNextNode(root, run.id, hermesFetch); // scan
    assert.equal(run.nodes.scan.status, 'done');
    assert.equal(await readAttachment(root, run.nodes.scan.attachmentPath!), '盘点：尚无完成章');
    assert.equal(bodies[0].model, 'hermes-agent');
    assert.match(bodies[0].messages[1].content, /禁直呼潮名/); // sourcePaths 内容进了提示词

    run = await runNextNode(root, run.id, hermesFetch); // draft
    assert.equal(run.nodes.draft.status, 'done');
    assert.ok(run.nodes.draft.candidateId);
    assert.equal(bodies[1].model, 'strong-model'); // 单节点模型覆盖
    assert.match(bodies[1].messages[0].content, /opening-hook/); // skill 引用在 system
    assert.match(bodies[1].messages[1].content, /盘点：尚无完成章/); // 上游附件进提示词

    run = await runNextNode(root, run.id, hermesFetch); // wash
    assert.match(bodies[2].messages[1].content, /初稿正文/); // 上游候选内容
    assert.match(bodies[2].messages[1].content, /短句。爱用句号。/); // 作者样本

    run = await runNextNode(root, run.id, hermesFetch); // judge
    assert.equal(run.nodes.judge.status, 'done');
    assert.match(bodies[3].messages[1].content, /SCORES/); // 审查节点被要求输出分数行
    assert.equal(run.status, 'done');

    // 真文件没被碰，产物全在候选区
    assert.equal(await readFile(join(root, 'chapters/ch_01.md'), 'utf8'), '');
    assert.equal((await listPendingCandidates(root)).length, 2); // draft + wash
  });

  it('marks the node failed and the run offline when hermes dies', async () => {
    await writeGraph(root, chainGraph());
    const deadFetch = (async () => { throw new Error('ECONNREFUSED'); }) as typeof fetch;
    let run = await startRun(root, 'chain');
    run = await runNextNode(root, run.id, deadFetch);
    assert.equal(run.nodes.scan.status, 'failed');
    assert.equal(run.status, 'offline');
    run = await runNextNode(root, run.id, deadFetch); // offline 后不再执行
    assert.equal(run.status, 'offline');
  });

  it('blocks a node whose source file is missing', async () => {
    const graph = chainGraph();
    graph.nodes[0].config = { sourcePaths: ['ghost.md'] };
    await writeGraph(root, graph);
    let run = await startRun(root, 'chain');
    run = await runNextNode(root, run.id, scriptedFetch([]));
    assert.equal(run.nodes.scan.status, 'blocked');
    assert.equal(run.status, 'blocked');
  });

  it('pauses at a manual node with waiting_author', async () => {
    const graph: WorkflowGraph = {
      name: 'pause',
      model: 'hermes-agent',
      nodes: [
        { id: 'scan', type: 'explore', title: '盘点', goal: '盘点', skills: [], config: { sourcePaths: ['world.md'] } },
        { id: 'check', type: 'manual', title: '检查', goal: '作者过目', skills: [] },
      ],
      edges: [{ from: 'scan', to: 'check', attachmentType: 'fact' }],
    };
    await writeGraph(root, graph);
    let run = await startRun(root, 'pause');
    run = await runNextNode(root, run.id, scriptedFetch(['盘点']));
    run = await runNextNode(root, run.id, scriptedFetch([]));
    assert.equal(run.nodes.check.status, 'waiting_author');
    assert.equal(run.status, 'waiting_author');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd services/api && npx tsx --test src/workflowRunner.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 `workflowRunner.ts`（完整文件，gate 留守卫）**

```ts
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { callHermes, HermesFailure } from './hermesClient.ts';
import { readCandidateContent, writeCandidate } from './candidateStore.ts';
import { readAttachment, readGraph, readRun, writeAttachment, writeRun } from './workflowStore.ts';
import { CANDIDATE_NODE_TYPES, topoOrder, validateGraph } from './workflowGraph.ts';
import type {
  RunStatus, WorkflowEdge, WorkflowGraph, WorkflowNode, WorkflowRun,
} from './workflowTypes.ts';

const GENE_COPYRIGHT_RULES = [
  '版权红线：产物只能包含抽象后的叙事模型、语言指纹、技法规则与风格边界。',
  '禁止输出原句、原段或可替代原文阅读的情节复述。',
  '规则入选标准：复现性（同书出现不止一次）、生成力（能指导新场景）、排他性（不是所有小说通用的废话）。',
].join('\n');

const REVIEW_RULES = [
  '审查要求：每条意见必须定位到具体句段并给出改法，禁止「整体感觉不错」式空评。',
  '在报告最后单独输出一行，格式严格为：SCORES: {"overall": <0 到 100 的整数>}',
  '可以在该 JSON 里附加其他维度分数字段。',
].join('\n');

class MissingUpstream extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingUpstream';
  }
}

interface UpstreamPart { edge: WorkflowEdge; content: string }

export async function startRun(root: string, graphName: string): Promise<WorkflowRun> {
  const graph = await readGraph(root, graphName);
  const errors = validateGraph(graph);
  if (errors.length > 0) throw new Error(`Invalid graph ${graphName}: ${errors.join('; ')}`);
  const run: WorkflowRun = {
    id: crypto.randomUUID(),
    graphName,
    status: 'running',
    nodes: Object.fromEntries(graph.nodes.map((node) => [
      node.id, { nodeId: node.id, status: 'pending' as const, retriesUsed: 0 },
    ])),
    createdAt: new Date().toISOString(),
  };
  await writeRun(root, run);
  return run;
}

function pickNextNode(graph: WorkflowGraph, run: WorkflowRun): WorkflowNode | undefined {
  for (const id of topoOrder(graph)) {
    const state = run.nodes[id];
    if (!state || state.status !== 'pending') continue;
    const inEdges = graph.edges.filter((edge) => !edge.loop && edge.to === id);
    if (inEdges.every((edge) => run.nodes[edge.from]?.status === 'done')) {
      return graph.nodes.find((node) => node.id === id);
    }
  }
  return undefined;
}

function recomputeRunStatus(run: WorkflowRun): RunStatus {
  const states = Object.values(run.nodes);
  if (states.some((state) => state.status === 'failed')) return 'offline';
  if (states.some((state) => state.status === 'waiting_author')) return 'waiting_author';
  if (states.some((state) => state.status === 'blocked')) return 'blocked';
  if (states.every((state) => state.status === 'done')) return 'done';
  return 'running';
}

async function readSourceFile(root: string, path: string): Promise<string> {
  try {
    return await readFile(join(root, path), 'utf8');
  } catch {
    throw new MissingUpstream(`missing source file ${path}`);
  }
}

async function gatherUpstream(
  root: string, graph: WorkflowGraph, run: WorkflowRun, nodeId: string,
): Promise<UpstreamPart[]> {
  const parts: UpstreamPart[] = [];
  for (const edge of graph.edges) {
    if (edge.loop || edge.to !== nodeId || edge.attachmentType === 'pass') continue;
    const upstream = run.nodes[edge.from];
    if (edge.attachmentType === 'candidate_ref') {
      if (!upstream?.candidateId) throw new MissingUpstream(`missing candidate from node ${edge.from}`);
      try {
        parts.push({ edge, content: await readCandidateContent(root, upstream.candidateId) });
      } catch {
        throw new MissingUpstream(`candidate from node ${edge.from} was discarded`);
      }
    } else {
      if (!upstream?.attachmentPath) throw new MissingUpstream(`missing attachment from node ${edge.from}`);
      try {
        parts.push({ edge, content: await readAttachment(root, upstream.attachmentPath) });
      } catch {
        throw new MissingUpstream(`attachment from node ${edge.from} is gone`);
      }
    }
  }
  return parts;
}

async function buildNodeMessages(
  root: string, node: WorkflowNode, upstream: UpstreamPart[],
): Promise<Array<{ role: string; content: string }>> {
  const system = [
    'You are executing one node of an author-defined workflow. Run this node only.',
    'Do not change the route, add steps, or ask questions.',
    node.expert ? `Expert persona: ${node.expert}` : '',
    node.skills.length > 0 ? `Apply these Hermes skills: ${node.skills.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  const sections: string[] = [`Node goal:\n${node.goal}`];
  for (const part of upstream) {
    sections.push(`Upstream ${part.edge.attachmentType} from node ${part.edge.from}:\n${part.content}`);
  }
  for (const path of node.config?.sourcePaths ?? []) {
    sections.push(`Source file ${path}:\n${await readSourceFile(root, path)}`);
  }
  if (node.type === 'deai' && node.config?.voiceSamplePath) {
    sections.push(`Author voice sample:\n${await readSourceFile(root, node.config.voiceSamplePath)}`);
  }
  if (node.type === 'gene') sections.push(GENE_COPYRIGHT_RULES);
  if (node.type === 'review') sections.push(REVIEW_RULES);
  if (CANDIDATE_NODE_TYPES.includes(node.type)) {
    sections.push(`Return only the full new content for ${node.config?.targetPath}. No commentary.`);
  }
  return [
    { role: 'system', content: system },
    { role: 'user', content: sections.join('\n\n') },
  ];
}

async function executeModelNode(
  root: string, graph: WorkflowGraph, run: WorkflowRun, node: WorkflowNode, hermesFetch: typeof fetch,
): Promise<void> {
  const state = run.nodes[node.id];
  const upstream = await gatherUpstream(root, graph, run, node.id);
  const messages = await buildNodeMessages(root, node, upstream);
  const content = await callHermes(hermesFetch, node.model ?? graph.model, messages);

  if (node.type === 'gene') {
    const targetPath = node.config?.targetPath;
    if (!targetPath) throw new Error(`gene node ${node.id} is missing targetPath`);
    state.attachmentPath = await writeAttachment(root, run.id, node.id, content);
    const candidate = await writeCandidate(root, { runId: run.id, targetPath, source: 'workflow', content });
    state.candidateId = candidate.id;
  } else if (CANDIDATE_NODE_TYPES.includes(node.type)) {
    const targetPath = node.config?.targetPath;
    if (!targetPath) throw new Error(`node ${node.id} is missing targetPath`);
    const candidate = await writeCandidate(root, { runId: run.id, targetPath, source: 'workflow', content });
    state.candidateId = candidate.id;
  } else {
    state.attachmentPath = await writeAttachment(root, run.id, node.id, content);
  }
  state.status = 'done';
}

export async function runNextNode(
  root: string, runId: string, hermesFetch: typeof fetch = fetch,
): Promise<WorkflowRun> {
  const run = await readRun(root, runId);
  if (run.status === 'done' || run.status === 'offline') return run;
  const graph = await readGraph(root, run.graphName);
  const node = pickNextNode(graph, run);
  if (!node) {
    run.status = recomputeRunStatus(run);
    await writeRun(root, run);
    return run;
  }

  const state = run.nodes[node.id];
  state.status = 'running';
  state.startedAt = new Date().toISOString();
  await writeRun(root, run);

  try {
    if (node.type === 'manual') {
      state.status = 'waiting_author';
    } else if (node.type === 'gate') {
      throw new Error(`gate node ${node.id} is not supported yet`);
    } else {
      await executeModelNode(root, graph, run, node, hermesFetch);
    }
  } catch (err) {
    if (err instanceof MissingUpstream) {
      state.status = 'blocked';
      state.error = err.message;
    } else if (err instanceof HermesFailure) {
      state.status = 'failed';
      state.error = err.message;
    } else {
      throw err;
    }
  }
  state.finishedAt = new Date().toISOString();
  delete state.forceRerun;
  run.status = recomputeRunStatus(run);
  await writeRun(root, run);
  return run;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `cd services/api && npx tsx --test src/workflowRunner.test.ts`
Expected: 全部 PASS

- [ ] **Step 5: Commit**

```bash
git add services/api/src/workflowRunner.ts services/api/src/workflowRunner.test.ts
git commit -m "feat: workflow runner executes model nodes with candidate red line"
```

---

### Task 6: 门禁节点（分数解析 + 循环重试）

**Files:**
- Modify: `services/api/src/workflowRunner.ts`
- Test: `services/api/src/workflowRunner.test.ts`（追加 describe）

**Interfaces:**
- Produces: `parseReportScores(content: string): Record<string, number> | undefined`（导出，供测试与未来 UI 用）；`runNextNode` 的 gate 分支换成 `executeGate`。
- 语义：分数 `>= threshold` → gate `done`（走 `pass` 出边）；`< threshold` 且 `retriesUsed < maxRetries` → `retriesUsed += 1`，重置 `nodesToReset(...)` 里的节点和 gate 自己为 `pending`；重试耗尽 → `blocked`；报告没有可用分数或 gate 没配 `threshold` → `waiting_author`（人工放行，Task 7 的 `resolveManual` 能放）。

- [ ] **Step 1: 追加失败测试**

在 `workflowRunner.test.ts` 追加：

```ts
import { parseReportScores } from './workflowRunner.ts'; // 合并进已有 import

function gateGraph(threshold?: number): WorkflowGraph {
  return {
    name: 'gated',
    model: 'hermes-agent',
    nodes: [
      { id: 'draft', type: 'write', title: '写', goal: '写第 3 章', skills: [], config: { targetPath: 'chapters/ch_03.md' } },
      { id: 'judge', type: 'review', title: '审', goal: '审第 3 章', skills: [] },
      { id: 'door', type: 'gate', title: '门禁', goal: '低分打回', skills: [], config: threshold === undefined ? {} : { threshold } },
    ],
    edges: [
      { from: 'draft', to: 'judge', attachmentType: 'candidate_ref' },
      { from: 'judge', to: 'door', attachmentType: 'report' },
      { from: 'door', to: 'draft', attachmentType: 'pass', loop: true, maxRetries: 1 },
    ],
  };
}

describe('gate node', () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'novelora-wfgate-'));
    await mkdir(join(root, 'chapters'), { recursive: true });
    await writeFile(join(root, 'chapters/ch_03.md'), '');
  });

  it('parses the trailing SCORES line', () => {
    assert.deepEqual(parseReportScores('意见\nSCORES: {"overall": 72, "logic": 88}'), { overall: 72, logic: 88 });
    assert.equal(parseReportScores('没有分数行'), undefined);
    assert.equal(parseReportScores('SCORES: 不是JSON'), undefined);
  });

  it('passes when the score clears the threshold', async () => {
    await writeGraph(root, gateGraph(80));
    const hermesFetch = scriptedFetch(['稿', '好评\nSCORES: {"overall": 88}']);
    let run = await startRun(root, 'gated');
    run = await runNextNode(root, run.id, hermesFetch); // draft
    run = await runNextNode(root, run.id, hermesFetch); // judge
    run = await runNextNode(root, run.id, hermesFetch); // door
    assert.equal(run.nodes.door.status, 'done');
    assert.equal(run.nodes.door.score, 88);
    assert.equal(run.status, 'done');
  });

  it('retries once along the loop edge, then blocks when retries run out', async () => {
    await writeGraph(root, gateGraph(80));
    const hermesFetch = scriptedFetch([
      '稿1', '差\nSCORES: {"overall": 50}',
      '稿2', '还差\nSCORES: {"overall": 60}',
    ]);
    let run = await startRun(root, 'gated');
    for (let i = 0; i < 3; i += 1) run = await runNextNode(root, run.id, hermesFetch); // draft judge door
    assert.equal(run.nodes.door.retriesUsed, 1);
    assert.equal(run.nodes.draft.status, 'pending'); // 被打回
    assert.equal(run.nodes.judge.status, 'pending');
    assert.equal(run.status, 'running');
    for (let i = 0; i < 3; i += 1) run = await runNextNode(root, run.id, hermesFetch); // 第二轮
    assert.equal(run.nodes.door.status, 'blocked');
    assert.equal(run.status, 'blocked');
    assert.match(run.nodes.door.error ?? '', /retries exhausted/);
  });

  it('waits for the author when the report has no scores or the gate has no threshold', async () => {
    await writeGraph(root, gateGraph(80));
    const hermesFetch = scriptedFetch(['稿', '光有意见没有分数行']);
    let run = await startRun(root, 'gated');
    for (let i = 0; i < 3; i += 1) run = await runNextNode(root, run.id, hermesFetch);
    assert.equal(run.nodes.door.status, 'waiting_author');
    assert.equal(run.status, 'waiting_author');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd services/api && npx tsx --test src/workflowRunner.test.ts`
Expected: gate describe 全 FAIL（`parseReportScores` 未导出、gate 抛 not supported）

- [ ] **Step 3: 实现**

`workflowRunner.ts` 改动：

1. import 区补 `nodesToReset`：`import { CANDIDATE_NODE_TYPES, nodesToReset, topoOrder, validateGraph } from './workflowGraph.ts';`
2. 新增导出函数：

```ts
export function parseReportScores(content: string): Record<string, number> | undefined {
  const lines = content.split('\n');
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i].trim();
    if (!line.startsWith('SCORES:')) continue;
    try {
      const parsed = JSON.parse(line.slice('SCORES:'.length).trim()) as Record<string, unknown>;
      const scores: Record<string, number> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'number') scores[key] = value;
      }
      return scores;
    } catch {
      return undefined;
    }
  }
  return undefined;
}
```

3. 新增 `executeGate`（放在 `executeModelNode` 后面）：

```ts
async function executeGate(
  root: string, graph: WorkflowGraph, run: WorkflowRun, node: WorkflowNode,
): Promise<void> {
  const state = run.nodes[node.id];
  const upstream = await gatherUpstream(root, graph, run, node.id);
  const report = upstream.find((part) => part.edge.attachmentType === 'report');
  const scores = report ? parseReportScores(report.content) : undefined;
  const field = node.config?.scoreField ?? 'overall';
  const threshold = node.config?.threshold;

  if (!scores || typeof scores[field] !== 'number' || typeof threshold !== 'number') {
    state.status = 'waiting_author';
    state.error = 'no usable score; author decision required';
    return;
  }

  state.score = scores[field];
  if (scores[field] >= threshold) {
    state.status = 'done';
    return;
  }

  const loopEdge = graph.edges.find((edge) => edge.loop && edge.from === node.id);
  if (!loopEdge) {
    state.status = 'blocked';
    state.error = `score ${scores[field]} < ${threshold} and no loop edge`;
    return;
  }
  if (state.retriesUsed >= (loopEdge.maxRetries ?? 0)) {
    state.status = 'blocked';
    state.error = `score ${scores[field]} < ${threshold}, retries exhausted`;
    return;
  }
  state.retriesUsed += 1;
  for (const id of nodesToReset(graph, loopEdge.to, node.id)) {
    run.nodes[id] = { nodeId: id, status: 'pending', retriesUsed: run.nodes[id].retriesUsed };
  }
  state.status = 'pending'; // gate 自己也回到待跑，等下一轮报告
}
```

4. `runNextNode` 里把 `throw new Error(\`gate node ...\`)` 那行换成 `await executeGate(root, graph, run, node);`

注意：打回后旧候选**不删**（作者可自行丢弃），这是节点规格「已落候选不删」的要求。

- [ ] **Step 4: 跑测试确认通过（全 runner 套件）**

Run: `cd services/api && npx tsx --test src/workflowRunner.test.ts`
Expected: 全部 PASS

- [ ] **Step 5: Commit**

```bash
git add services/api/src/workflowRunner.ts services/api/src/workflowRunner.test.ts
git commit -m "feat: gate node with score parsing and author-drawn retry loop"
```

---

### Task 7: 人工节点放行 + 强制重跑

**Files:**
- Modify: `services/api/src/workflowRunner.ts`
- Test: `services/api/src/workflowRunner.test.ts`（追加 describe）

**Interfaces:**
- Produces:
  - `resolveManual(root: string, runId: string, nodeId: string, decision: { note?: string }): Promise<WorkflowRun>` — 只对 `waiting_author` 的节点有效，否则抛 `` `Node ${nodeId} is not waiting for the author` ``。manual 节点会把 `note`（缺省 `'pass'`）写成 `author_decision` 附件传下游；waiting 状态的 gate 也用它放行（不写附件）。
  - `forceRerun(root: string, runId: string, nodeId: string): Promise<WorkflowRun>` — 把该节点及其非 loop 下游全部重置为 `pending` 并给该节点打 `forceRerun` 标记（Task 8 缓存要用），未知节点抛 `` `Unknown node ${nodeId}` ``。

- [ ] **Step 1: 追加失败测试**

```ts
import { forceRerun, resolveManual } from './workflowRunner.ts'; // 合并进已有 import

describe('manual node and force rerun', () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'novelora-wfmanual-'));
    await writeFile(join(root, 'world.md'), '设定');
  });

  const pauseGraph: WorkflowGraph = {
    name: 'pause',
    model: 'hermes-agent',
    nodes: [
      { id: 'scan', type: 'explore', title: '盘点', goal: '盘点', skills: [], config: { sourcePaths: ['world.md'] } },
      { id: 'check', type: 'manual', title: '检查', goal: '作者过目', skills: [] },
    ],
    edges: [{ from: 'scan', to: 'check', attachmentType: 'fact' }],
  };

  it('resolveManual writes the author decision as an attachment and finishes the run', async () => {
    await writeGraph(root, pauseGraph);
    let run = await startRun(root, 'pause');
    run = await runNextNode(root, run.id, scriptedFetch(['盘点']));
    run = await runNextNode(root, run.id, scriptedFetch([]));
    assert.equal(run.status, 'waiting_author');
    run = await resolveManual(root, run.id, 'check', { note: '走方向 B' });
    assert.equal(run.nodes.check.status, 'done');
    assert.equal(run.status, 'done');
    assert.equal(await readAttachment(root, run.nodes.check.attachmentPath!), '走方向 B');
  });

  it('rejects resolving a node that is not waiting', async () => {
    await writeGraph(root, pauseGraph);
    const run = await startRun(root, 'pause');
    await assert.rejects(resolveManual(root, run.id, 'scan', {}), /not waiting for the author/);
  });

  it('forceRerun resets the node and its downstream to pending with the rerun flag', async () => {
    await writeGraph(root, pauseGraph);
    let run = await startRun(root, 'pause');
    run = await runNextNode(root, run.id, scriptedFetch(['盘点']));
    run = await runNextNode(root, run.id, scriptedFetch([]));
    run = await resolveManual(root, run.id, 'check', {});
    assert.equal(run.status, 'done');
    run = await forceRerun(root, run.id, 'scan');
    assert.equal(run.nodes.scan.status, 'pending');
    assert.equal(run.nodes.scan.forceRerun, true);
    assert.equal(run.nodes.check.status, 'pending');
    assert.equal(run.status, 'running');
    await assert.rejects(forceRerun(root, run.id, 'ghost'), /Unknown node ghost/);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd services/api && npx tsx --test src/workflowRunner.test.ts`
Expected: 新 describe FAIL（函数未导出）

- [ ] **Step 3: 实现**

`workflowRunner.ts` import 区补 `reachableFrom`，然后追加两个导出函数：

```ts
export async function resolveManual(
  root: string, runId: string, nodeId: string, decision: { note?: string },
): Promise<WorkflowRun> {
  const run = await readRun(root, runId);
  const state = run.nodes[nodeId];
  if (!state || state.status !== 'waiting_author') {
    throw new Error(`Node ${nodeId} is not waiting for the author`);
  }
  const graph = await readGraph(root, run.graphName);
  const node = graph.nodes.find((candidate) => candidate.id === nodeId);
  if (node?.type === 'manual') {
    state.attachmentPath = await writeAttachment(root, run.id, nodeId, decision.note ?? 'pass');
  }
  state.status = 'done';
  state.error = undefined;
  state.finishedAt = new Date().toISOString();
  run.status = recomputeRunStatus(run);
  await writeRun(root, run);
  return run;
}

export async function forceRerun(root: string, runId: string, nodeId: string): Promise<WorkflowRun> {
  const run = await readRun(root, runId);
  if (!run.nodes[nodeId]) throw new Error(`Unknown node ${nodeId}`);
  const graph = await readGraph(root, run.graphName);
  for (const id of reachableFrom(graph, nodeId)) {
    run.nodes[id] = { nodeId: id, status: 'pending', retriesUsed: 0 };
  }
  run.nodes[nodeId].forceRerun = true;
  run.status = 'running';
  await writeRun(root, run);
  return run;
}
```

（`state.error = undefined` 若 TS 报 `exactOptionalPropertyTypes` 相关错，改成 `delete state.error;`。）

- [ ] **Step 4: 跑测试确认通过**

Run: `cd services/api && npx tsx --test src/workflowRunner.test.ts`
Expected: 全部 PASS

- [ ] **Step 5: Commit**

```bash
git add services/api/src/workflowRunner.ts services/api/src/workflowRunner.test.ts
git commit -m "feat: manual node resolution and forced rerun"
```

---

### Task 8: 探索 / 基因附件缓存（源文件指纹）

**Files:**
- Modify: `services/api/src/workflowStore.ts`（加 `readCache` / `writeCache`）
- Modify: `services/api/src/workflowRunner.ts`（executeModelNode 接缓存）
- Test: `services/api/src/workflowRunner.test.ts`（追加 describe）

**Interfaces:**
- Produces:
  - store：`writeCache(root: string, nodeId: string, fingerprint: string, content: string): Promise<void>`、`readCache(root: string, nodeId: string, fingerprint: string): Promise<string | undefined>`（指纹不匹配或无缓存返回 `undefined`）。缓存文件 `workflow/cache/<nodeId>.json`，内容 `{ "fingerprint": "...", "content": "..." }`。
  - runner：仅 `explore` / `gene` 节点参与缓存；指纹 = sha256(每个 sourcePath 的路径 + `\0` + 文件内容 + `\0` 依次拼接)；`forceRerun` 标记跳过缓存读取（仍写入新缓存）。命中时 `NodeRun.cached = true` 且不调 Hermes。

- [ ] **Step 1: 追加失败测试**

```ts
import { readCache, writeCache } from './workflowStore.ts'; // 合并进已有 import

describe('explore/gene attachment cache', () => {
  let root: string;
  const cacheGraph: WorkflowGraph = {
    name: 'cached',
    model: 'hermes-agent',
    nodes: [
      { id: 'scan', type: 'explore', title: '盘点', goal: '盘点', skills: [], config: { sourcePaths: ['world.md'] } },
      { id: 'check', type: 'manual', title: '检查', goal: '过目', skills: [] },
    ],
    edges: [{ from: 'scan', to: 'check', attachmentType: 'fact' }],
  };

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'novelora-wfcache-'));
    await writeFile(join(root, 'world.md'), '设定 v1');
    await writeGraph(root, cacheGraph);
  });

  it('store round-trips cache entries by fingerprint', async () => {
    await writeCache(root, 'scan', 'fp-1', '缓存内容');
    assert.equal(await readCache(root, 'scan', 'fp-1'), '缓存内容');
    assert.equal(await readCache(root, 'scan', 'fp-2'), undefined);
    assert.equal(await readCache(root, 'other', 'fp-1'), undefined);
  });

  it('reuses the cached attachment when sources are unchanged, recomputes when they change', async () => {
    let calls = 0;
    const countingFetch = (async () => {
      calls += 1;
      return new Response(JSON.stringify({ choices: [{ message: { content: `盘点第${calls}次` } }] }), { status: 200 });
    }) as typeof fetch;

    let run1 = await startRun(root, 'cached');
    run1 = await runNextNode(root, run1.id, countingFetch);
    assert.equal(calls, 1);
    assert.ok(!run1.nodes.scan.cached);

    let run2 = await startRun(root, 'cached');
    run2 = await runNextNode(root, run2.id, countingFetch);
    assert.equal(calls, 1); // 命中缓存，没调 Hermes
    assert.equal(run2.nodes.scan.cached, true);
    assert.equal(await readAttachment(root, run2.nodes.scan.attachmentPath!), '盘点第1次');

    await writeFile(join(root, 'world.md'), '设定 v2'); // 源变了
    let run3 = await startRun(root, 'cached');
    run3 = await runNextNode(root, run3.id, countingFetch);
    assert.equal(calls, 2);

    let run4 = await startRun(root, 'cached');
    run4 = await forceRerun(root, run4.id, 'scan'); // 作者强制重跑
    run4 = await runNextNode(root, run4.id, countingFetch);
    assert.equal(calls, 3);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd services/api && npx tsx --test src/workflowRunner.test.ts`
Expected: cache describe FAIL

- [ ] **Step 3: 实现**

`workflowStore.ts` 追加：

```ts
export async function writeCache(root: string, nodeId: string, fingerprint: string, content: string): Promise<void> {
  if (!NODE_ID_PATTERN.test(nodeId)) throw new Error(`Invalid node id ${nodeId}`);
  await mkdir(join(root, 'workflow', 'cache'), { recursive: true });
  await atomicWrite(join(root, 'workflow', 'cache', `${nodeId}.json`), JSON.stringify({ fingerprint, content }));
}

export async function readCache(root: string, nodeId: string, fingerprint: string): Promise<string | undefined> {
  if (!NODE_ID_PATTERN.test(nodeId)) throw new Error(`Invalid node id ${nodeId}`);
  try {
    const entry = JSON.parse(await readFile(join(root, 'workflow', 'cache', `${nodeId}.json`), 'utf8')) as {
      fingerprint?: string; content?: string;
    };
    return entry.fingerprint === fingerprint && typeof entry.content === 'string' ? entry.content : undefined;
  } catch (err) {
    if (notFound(err)) return undefined;
    throw err;
  }
}
```

`workflowRunner.ts`：

1. import 区补：`import { createHash } from 'node:crypto';` 以及 store 的 `readCache, writeCache`。
2. 加私有函数：

```ts
async function sourceFingerprint(root: string, paths: string[]): Promise<string> {
  const hash = createHash('sha256');
  for (const path of paths) {
    hash.update(path);
    hash.update('\0');
    hash.update(await readSourceFile(root, path));
    hash.update('\0');
  }
  return hash.digest('hex');
}
```

3. `executeModelNode` 里，把「拼消息 + callHermes」那两行替换为：

```ts
  let content: string | undefined;
  let fingerprint: string | undefined;
  const cacheable = node.type === 'explore' || node.type === 'gene';
  if (cacheable) {
    fingerprint = await sourceFingerprint(root, node.config?.sourcePaths ?? []);
    if (!state.forceRerun) {
      content = await readCache(root, node.id, fingerprint);
      if (content !== undefined) state.cached = true;
    }
  }
  if (content === undefined) {
    const messages = await buildNodeMessages(root, node, upstream);
    content = await callHermes(hermesFetch, node.model ?? graph.model, messages);
    if (cacheable && fingerprint) await writeCache(root, node.id, fingerprint, content);
  }
```

后面写附件 / 候选的分支不变（`content` 此时一定是 string）。

- [ ] **Step 4: 跑测试确认通过（runner + store 全套）**

Run: `cd services/api && npx tsx --test src/workflowRunner.test.ts src/workflowStore.test.ts`
Expected: 全部 PASS

- [ ] **Step 5: Commit**

```bash
git add services/api/src/workflowStore.ts services/api/src/workflowRunner.ts services/api/src/workflowRunner.test.ts
git commit -m "feat: fingerprint cache for explore and gene attachments"
```

---

### Task 9: HTTP 路由（`index.ts`）

**Files:**
- Modify: `services/api/src/index.ts`
- Test: `services/api/src/index.test.ts`（追加独立 describe）

**Interfaces:**
- Consumes: Task 3 store、Task 5-8 runner、Task 2 `validateGraph`。
- Produces（前端以后就靠这些）：
  - `GET  /projects/:id/workflow/graphs` → `string[]`
  - `GET  /projects/:id/workflow/graphs/:name` → `WorkflowGraph` | 404
  - `PUT  /projects/:id/workflow/graphs/:name` → `{ ok, name }` | 400 `{ error, details: string[] }`
  - `POST /projects/:id/workflow/runs`（body `{ graphName }`）→ 201 `WorkflowRun`
  - `GET  /projects/:id/workflow/runs` → `WorkflowRun[]`；`GET .../runs/:runId` → `WorkflowRun` | 404
  - `POST /projects/:id/workflow/runs/:runId/step` → `WorkflowRun`（推进一个节点）
  - `POST /projects/:id/workflow/runs/:runId/manual`（body `{ nodeId, note? }`）→ `WorkflowRun` | 400
  - `POST /projects/:id/workflow/runs/:runId/rerun`（body `{ nodeId }`）→ `WorkflowRun`
  - `BuildServerOptions` 新增 `hermesFetch?: typeof fetch`（测试注入 mock 用）

- [ ] **Step 1: 追加失败测试**

在 `services/api/src/index.test.ts` 文件末尾追加一个**独立** describe（不动已有的）：

```ts
describe('workflow routes', () => {
  let app: Awaited<ReturnType<typeof buildServer>>;
  const hermesReplies: string[] = [];
  const hermesFetch = (async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: hermesReplies.shift() ?? '附件内容' } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;

  before(async () => {
    const root = join(process.env.NOVELORA_DATA_DIR!, 'wf-project');
    await mkdir(join(root, 'chapters'), { recursive: true });
    await writeFile(join(root, 'project.json'), JSON.stringify({
      id: 'wf-project', title: 'WF', currentChapter: 1,
      chapters: [{ num: 1, title: 'One', status: 'planned' }],
    }));
    await writeFile(join(root, 'outline.md'), '# Outline\n第一卷\n');
    app = await buildServer({ hermesFetch });
  });
  after(() => app.close());

  const graph = {
    model: 'hermes-agent',
    nodes: [
      { id: 'scan', type: 'explore', title: '盘点', goal: '盘点全书状态', skills: [], config: { sourcePaths: ['outline.md'] } },
      { id: 'check', type: 'manual', title: '作者检查', goal: '作者过目', skills: [] },
    ],
    edges: [{ from: 'scan', to: 'check', attachmentType: 'fact' }],
  };

  it('rejects an invalid graph with 400 and details', async () => {
    const bad = { ...graph, edges: [{ from: 'scan', to: 'ghost', attachmentType: 'fact' }] };
    const res = await app.inject({ method: 'PUT', url: '/projects/wf-project/workflow/graphs/daily', payload: bad });
    assert.equal(res.statusCode, 400);
    assert.ok(res.json().details.length > 0);
  });

  it('saves a graph, runs it to waiting_author, and resolves the manual node', async () => {
    const saved = await app.inject({ method: 'PUT', url: '/projects/wf-project/workflow/graphs/daily', payload: graph });
    assert.equal(saved.statusCode, 200);

    const list = await app.inject({ url: '/projects/wf-project/workflow/graphs' });
    assert.deepEqual(list.json(), ['daily']);

    const created = await app.inject({
      method: 'POST', url: '/projects/wf-project/workflow/runs', payload: { graphName: 'daily' },
    });
    assert.equal(created.statusCode, 201);
    const runId = created.json().id as string;

    hermesReplies.push('进度盘点：第一卷已完成两章');
    const step1 = await app.inject({ method: 'POST', url: `/projects/wf-project/workflow/runs/${runId}/step` });
    assert.equal(step1.json().nodes.scan.status, 'done');

    const step2 = await app.inject({ method: 'POST', url: `/projects/wf-project/workflow/runs/${runId}/step` });
    assert.equal(step2.json().status, 'waiting_author');

    const resolved = await app.inject({
      method: 'POST', url: `/projects/wf-project/workflow/runs/${runId}/manual`,
      payload: { nodeId: 'check', note: '放行' },
    });
    assert.equal(resolved.json().status, 'done');

    const fetched = await app.inject({ url: `/projects/wf-project/workflow/runs/${runId}` });
    assert.equal(fetched.json().status, 'done');

    const missing = await app.inject({ url: '/projects/wf-project/workflow/runs/00000000-0000-0000-0000-000000000000' });
    assert.equal(missing.statusCode, 404);

    const notWaiting = await app.inject({
      method: 'POST', url: `/projects/wf-project/workflow/runs/${runId}/manual`,
      payload: { nodeId: 'scan' },
    });
    assert.equal(notWaiting.statusCode, 400);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `cd services/api && npx tsx --test src/index.test.ts`
Expected: workflow routes describe FAIL（404 路由不存在 / buildServer 不认识 hermesFetch）

- [ ] **Step 3: 实现**

`index.ts` 改动：

1. import 区追加：

```ts
import { isValidGraphName, listGraphs, listRuns as listWorkflowRuns, readGraph as readWorkflowGraph, readRun as readWorkflowRun, writeGraph } from './workflowStore.ts';
import { validateGraph } from './workflowGraph.ts';
import { forceRerun, resolveManual, runNextNode, startRun } from './workflowRunner.ts';
import type { WorkflowGraph } from './workflowTypes.ts';
```

2. `BuildServerOptions` 加一个字段：`hermesFetch?: typeof fetch;`
3. `buildServer` 函数体开头（`pickFile` 之后）加：`const hermesFetch = options.hermesFetch ?? fetch;`
4. 在 candidates 路由之后、`return app;` 之前追加路由（错误分辨全靠 store/runner 的错误消息前缀）：

```ts
  app.get('/projects/:id/workflow/graphs', async (request, reply) => {
    const { id } = request.params as { id: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
      return await listGraphs(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
  });

  app.get('/projects/:id/workflow/graphs/:name', async (request, reply) => {
    const { id, name } = request.params as { id: string; name: string };
    if (!isValidGraphName(name)) return reply.code(400).send({ error: `Invalid graph name ${name}` });
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      return await readWorkflowGraph(root, name);
    } catch {
      return reply.code(404).send({ error: `Unknown graph ${name}` });
    }
  });

  app.put('/projects/:id/workflow/graphs/:name', async (request, reply) => {
    const { id, name } = request.params as { id: string; name: string };
    if (!isValidGraphName(name)) return reply.code(400).send({ error: `Invalid graph name ${name}` });
    const body = request.body as Partial<WorkflowGraph> | undefined;
    if (!body || !Array.isArray(body.nodes) || !Array.isArray(body.edges) || typeof body.model !== 'string') {
      return reply.code(400).send({ error: 'graph must have model, nodes, and edges' });
    }
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    const graph: WorkflowGraph = { name, model: body.model, nodes: body.nodes, edges: body.edges };
    const errors = validateGraph(graph);
    if (errors.length > 0) return reply.code(400).send({ error: 'invalid graph', details: errors });
    await writeGraph(root, graph);
    return { ok: true, name };
  });

  app.post('/projects/:id/workflow/runs', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { graphName?: unknown };
    if (typeof body?.graphName !== 'string') return reply.code(400).send({ error: 'graphName must be a string' });
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      return reply.code(201).send(await startRun(root, body.graphName));
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Unknown graph')) return reply.code(404).send({ error: err.message });
      if (err instanceof Error && (err.message.startsWith('Invalid graph') || err.message.startsWith('Invalid run'))) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  app.get('/projects/:id/workflow/runs', async (request, reply) => {
    const { id } = request.params as { id: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
      return await listWorkflowRuns(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
  });

  app.get('/projects/:id/workflow/runs/:runId', async (request, reply) => {
    const { id, runId } = request.params as { id: string; runId: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
      return await readWorkflowRun(root, runId);
    } catch {
      return reply.code(404).send({ error: `Unknown run ${runId}` });
    }
  });

  app.post('/projects/:id/workflow/runs/:runId/step', async (request, reply) => {
    const { id, runId } = request.params as { id: string; runId: string };
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      return await runNextNode(root, runId, hermesFetch);
    } catch (err) {
      if (err instanceof Error && (err.message.startsWith('Unknown run') || err.message.startsWith('Invalid run') || err.message.startsWith('Unknown graph'))) {
        return reply.code(404).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post('/projects/:id/workflow/runs/:runId/manual', async (request, reply) => {
    const { id, runId } = request.params as { id: string; runId: string };
    const body = request.body as { nodeId?: unknown; note?: unknown };
    if (typeof body?.nodeId !== 'string') return reply.code(400).send({ error: 'nodeId must be a string' });
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      return await resolveManual(root, runId, body.nodeId, {
        note: typeof body.note === 'string' ? body.note : undefined,
      });
    } catch (err) {
      if (err instanceof Error && (err.message.startsWith('Unknown run') || err.message.startsWith('Invalid run'))) {
        return reply.code(404).send({ error: err.message });
      }
      if (err instanceof Error && err.message.includes('not waiting')) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post('/projects/:id/workflow/runs/:runId/rerun', async (request, reply) => {
    const { id, runId } = request.params as { id: string; runId: string };
    const body = request.body as { nodeId?: unknown };
    if (typeof body?.nodeId !== 'string') return reply.code(400).send({ error: 'nodeId must be a string' });
    const root = await projectRoot(id);
    try {
      await readProject(root);
    } catch {
      return reply.code(404).send({ error: `Unknown project ${id}` });
    }
    try {
      return await forceRerun(root, runId, body.nodeId);
    } catch (err) {
      if (err instanceof Error && (err.message.startsWith('Unknown run') || err.message.startsWith('Invalid run'))) {
        return reply.code(404).send({ error: err.message });
      }
      if (err instanceof Error && err.message.startsWith('Unknown node')) {
        return reply.code(400).send({ error: err.message });
      }
      throw err;
    }
  });
```

- [ ] **Step 4: 跑测试确认通过（含全部旧路由回归）**

Run: `cd services/api && npx tsx --test src/index.test.ts`
Expected: 全部 PASS

- [ ] **Step 5: Commit**

```bash
git add services/api/src/index.ts services/api/src/index.test.ts
git commit -m "feat: workflow graph and run HTTP routes"
```

---

### Task 10: 端到端验收测试（节点规格第 11 节）

**Files:**
- Create: `services/api/src/workflowRunner.e2e.test.ts`

**Interfaces:**
- Consumes: 前面全部任务的导出，不新增任何实现代码。此任务只有测试；如果测试暴露实现 bug，就地修并在提交里说明。

- [ ] **Step 1: 写验收测试（完整文件）**

```ts
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { acceptCandidate, discardCandidate, listPendingCandidates } from './candidateStore.ts';
import { writeGraph } from './workflowStore.ts';
import { resolveManual, runNextNode, startRun } from './workflowRunner.ts';
import type { WorkflowGraph } from './workflowTypes.ts';

function scriptedFetch(replies: string[], bodies: unknown[] = []): typeof fetch {
  return (async (_url: unknown, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body ?? '{}')));
    const content = replies.shift();
    if (content === undefined) throw new Error('scriptedFetch ran out of replies');
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

const acceptanceGraph: WorkflowGraph = {
  name: 'acceptance',
  model: 'hermes-agent',
  nodes: [
    { id: 'scan', type: 'explore', title: '盘点', goal: '盘点全书进度与伏笔', skills: [], config: { sourcePaths: ['outline.md', 'world.md'] } },
    { id: 'dna', type: 'gene', title: '拆书', goal: '提取骨架与文笔基因', skills: [], config: { sourcePaths: ['import/source-book.txt'], targetPath: 'genes/source-book.md' } },
    { id: 'draft', type: 'write', title: '写第一章', goal: '写第 1 章', skills: ['opening-hook'], config: { targetPath: 'chapters/ch_01.md' } },
    { id: 'wash', type: 'deai', title: '去 AI 味', goal: '消除 AI 痕迹', skills: [], config: { targetPath: 'chapters/ch_01.md', voiceSamplePath: 'import/voice-sample.md' } },
    { id: 'judge', type: 'review', title: '审查', goal: '审 OOC、逻辑、文笔', skills: [] },
    { id: 'door', type: 'gate', title: '门禁', goal: '低于 80 分打回', skills: [], config: { threshold: 80 } },
    { id: 'check', type: 'manual', title: '作者检查', goal: '作者过目后放行', skills: [] },
  ],
  edges: [
    { from: 'scan', to: 'draft', attachmentType: 'fact' },
    { from: 'dna', to: 'draft', attachmentType: 'gene' },
    { from: 'draft', to: 'wash', attachmentType: 'candidate_ref' },
    { from: 'wash', to: 'judge', attachmentType: 'candidate_ref' },
    { from: 'judge', to: 'door', attachmentType: 'report' },
    { from: 'door', to: 'draft', attachmentType: 'pass', loop: true, maxRetries: 2 },
    { from: 'door', to: 'check', attachmentType: 'pass' },
  ],
};

describe('workflow acceptance (spec section 11)', () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'novelora-wfe2e-'));
    await mkdir(join(root, 'chapters'), { recursive: true });
    await mkdir(join(root, 'import'), { recursive: true });
    await writeFile(join(root, 'outline.md'), '# 大纲\n第一卷：出海\n');
    await writeFile(join(root, 'world.md'), '规则：禁直呼潮名\n');
    await writeFile(join(root, 'import/source-book.txt'), '外部小说全文……\n');
    await writeFile(join(root, 'import/voice-sample.md'), '短句。爱用句号。\n');
    await writeFile(join(root, 'chapters/ch_01.md'), '');
    await writeGraph(root, acceptanceGraph);
  });
  afterEach(() => rm(root, { recursive: true, force: true }));

  it('runs 探索→基因→写作→去AI味→审查→门禁(打回一次)→人工 end to end', async () => {
    const bodies: Array<{ messages: Array<{ role: string; content: string }> }> = [];
    const replies = [
      '进度盘点：无已完成章',
      '基因：三幕骨架，短句风格',
      '初稿一版',
      '洗稿一版',
      '第 3 段节奏拖沓，建议改为短句收尾。\nSCORES: {"overall": 60}',
      '初稿二版',
      '洗稿二版',
      '节奏问题已修复。\nSCORES: {"overall": 95}',
    ];
    const hermesFetch = scriptedFetch(replies, bodies as unknown[]);

    let run = await startRun(root, 'acceptance');
    for (let i = 0; i < 20 && run.status === 'running'; i += 1) {
      run = await runNextNode(root, run.id, hermesFetch);
    }

    assert.equal(run.status, 'waiting_author');
    assert.equal(run.nodes.door.retriesUsed, 1);
    assert.equal(run.nodes.door.score, 95);
    assert.equal(replies.length, 0); // 8 次 Hermes 调用全部按序发生

    // 写作节点请求：skill 引用在 system，上游事实与基因在 user
    assert.match(bodies[2].messages[0].content, /opening-hook/);
    assert.match(bodies[2].messages[1].content, /进度盘点/);
    assert.match(bodies[2].messages[1].content, /三幕骨架/);
    // 基因节点请求带版权红线
    assert.match(bodies[1].messages[1].content, /复现性/);
    // 去 AI 味请求带作者样本
    assert.match(bodies[3].messages[1].content, /短句。爱用句号。/);

    // 真文件未动；产物只在候选区（基因 1 + 写作 2 + 洗稿 2）
    assert.equal(await readFile(join(root, 'chapters/ch_01.md'), 'utf8'), '');
    assert.equal((await listPendingCandidates(root)).length, 5);

    run = await resolveManual(root, run.id, 'check', { note: '放行' });
    assert.equal(run.status, 'done');

    // 作者接受最终洗稿候选后才落真文件
    await acceptCandidate(root, run.nodes.wash.candidateId!);
    assert.equal(await readFile(join(root, 'chapters/ch_01.md'), 'utf8'), '洗稿二版');
  });

  it('goes offline when Hermes dies and keeps finished attachments', async () => {
    let run = await startRun(root, 'acceptance');
    run = await runNextNode(root, run.id, scriptedFetch(['盘点结果']));
    assert.equal(run.nodes.scan.status, 'done');
    const deadFetch = (async () => { throw new Error('ECONNREFUSED'); }) as typeof fetch;
    run = await runNextNode(root, run.id, deadFetch);
    assert.equal(run.nodes.dna.status, 'failed');
    assert.equal(run.status, 'offline');
    assert.equal(run.nodes.scan.status, 'done'); // 已有产物完好
  });

  it('blocks the downstream node when its upstream candidate is discarded', async () => {
    const twoStep: WorkflowGraph = {
      name: 'two-step',
      model: 'hermes-agent',
      nodes: [
        { id: 'draft', type: 'write', title: '写', goal: '写第 2 章', skills: [], config: { targetPath: 'chapters/ch_02.md' } },
        { id: 'judge', type: 'review', title: '审', goal: '审第 2 章', skills: [] },
      ],
      edges: [{ from: 'draft', to: 'judge', attachmentType: 'candidate_ref' }],
    };
    await writeGraph(root, twoStep);
    const hermesFetch = scriptedFetch(['初稿']);
    let run = await startRun(root, 'two-step');
    run = await runNextNode(root, run.id, hermesFetch);
    await discardCandidate(root, run.nodes.draft.candidateId!);
    run = await runNextNode(root, run.id, hermesFetch);
    assert.equal(run.nodes.judge.status, 'blocked');
    assert.equal(run.status, 'blocked');
  });
});
```

- [ ] **Step 2: 跑验收测试**

Run: `cd services/api && npx tsx --test src/workflowRunner.e2e.test.ts`
Expected: 全部 PASS。若失败，回对应任务的实现文件修（常见坑：拓扑序里 `dna` 排在 `draft` 前取决于 nodes 数组顺序——本图 nodes 顺序已保证；`SCORES:` 必须独占一行）。

- [ ] **Step 3: 全量回归**

Run: `cd services/api && npx tsx --test src/*.test.ts`
Expected: 全部 PASS（含 recipeRunner、candidateStore、index 旧用例）

再跑前端确认没碰坏（应零改动）：`cd ../../apps/web && npm run test -- --run`
Expected: 全部 PASS

- [ ] **Step 4: Commit**

```bash
git add services/api/src/workflowRunner.e2e.test.ts
git commit -m "test: workflow acceptance covering spec section 11"
```

---

## 验收对照表（节点规格第 11 节 ↔ 测试）

| 验收条目 | 覆盖测试 |
|---|---|
| JSON 定义整条图并跑通（探索→写作+skill+基因→去AI味→审查→门禁→人工） | Task 10 e2e 第 1 条 |
| 动手节点产物只出现在候选区，接受后才进真文件 | Task 5 chain 测试 + Task 10 e2e 第 1 条 |
| 拔线 / 上游产物消失 → 下游受阻不跑 | Task 2 REQUIRED_IN 校验测试（摆图期）+ Task 10 第 3 条（运行期） |
| 审查报告定位句段 + 门禁按分数走预画边 + 重试耗尽受阻 | Task 6 三条 gate 测试 |
| 基因产物不含原文（提示词红线） | Task 10 对请求体断言 `复现性`（红线进提示词；语料级检查靠作者过目 = 基因候选须人工接受） |
| Hermes 关掉整图离线，已有候选完好 | Task 5 offline 测试 + Task 10 第 2 条 |

## 明确不做（给执行者划界）

- 不做画布 UI、不改 `apps/web` 任何文件。
- 不做并行分支并发执行（`runNextNode` 一次一个节点，串行拓扑）。
- 不做研究节点、全局基因库、图模板市场。
- 不把对话框 todo 转成图。
- 不下线 `recipeRunner.ts` 三配方（后续用三张预置图复刻验证后另开任务）。
- 不在执行器里直接写任何真文件——只有 `acceptCandidate`（作者动作）能写。
