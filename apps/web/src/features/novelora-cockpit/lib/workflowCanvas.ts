import type {
  AttachmentType,
  WorkflowGraph,
  WorkflowNode,
  WorkflowNodeType,
} from './workflowTypes';

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

export const NODE_TYPE_LABEL: Record<WorkflowNodeType, string> = {
  explore: '探索',
  gene: '基因',
  outline: '大纲',
  write: '写作',
  deai: '去AI味',
  review: '审查',
  memory: '记忆',
  gate: '门禁',
  manual: '人工',
};

export const PALETTE_TYPES: WorkflowNodeType[] = [
  'explore',
  'gene',
  'outline',
  'write',
  'deai',
  'review',
  'memory',
  'gate',
  'manual',
];

export const DEFAULT_GRAPH_NAME = 'daily';
export const DEFAULT_GRAPH_MODEL = 'hermes-agent';

const NODE_WIDTH = 168;
const NODE_HEIGHT = 86;
const COL_GAP = 48;
const ROW_GAP = 36;

export function emptyGraph(name = DEFAULT_GRAPH_NAME): WorkflowGraph {
  return { name, model: DEFAULT_GRAPH_MODEL, nodes: [], edges: [] };
}

export function nextNodeId(nodes: Array<{ id: string }>, type: WorkflowNodeType): string {
  if (!nodes.some((node) => node.id === type)) return type;
  let index = 2;
  while (nodes.some((node) => node.id === `${type}-${index}`)) index += 1;
  return `${type}-${index}`;
}

export function defaultNodeFor(type: WorkflowNodeType, id: string): WorkflowNode {
  const title = NODE_TYPE_LABEL[type];
  const base: WorkflowNode = { id, type, title, goal: defaultGoal(type), skills: [] };
  if (type === 'explore') return { ...base, config: { sourcePaths: ['state/facts.md'] } };
  if (type === 'gene') {
    return { ...base, config: { sourcePaths: ['outline.md'], targetPath: 'genes/sample.md' } };
  }
  if (type === 'outline') return { ...base, config: { targetPath: 'outline.md' } };
  if (type === 'write' || type === 'deai') {
    return { ...base, config: { targetPath: 'chapters/ch_01.md' } };
  }
  if (type === 'memory') {
    return { ...base, config: { sourcePaths: ['chapters/ch_01.md'], targetPath: 'state/facts.md' } };
  }
  if (type === 'gate') return { ...base, config: { threshold: 80 } };
  return base;
}

function defaultGoal(type: WorkflowNodeType): string {
  if (type === 'explore') return '盘点全书进度与伏笔';
  if (type === 'gene') return '提取骨架与文笔基因';
  if (type === 'outline') return '按总纲拆卷纲与章纲';
  if (type === 'write') return '写第 1 章';
  if (type === 'deai') return '消除 AI 痕迹';
  if (type === 'review') return '审 OOC、逻辑、文笔';
  if (type === 'memory') return '沉淀本章新事实';
  if (type === 'gate') return '低于 80 分打回';
  return '作者过目后放行';
}

export function addCanvasNode(graph: WorkflowGraph, type: WorkflowNodeType): WorkflowGraph {
  const id = nextNodeId(graph.nodes, type);
  const index = graph.nodes.length;
  const col = index % 4;
  const row = Math.floor(index / 4);
  const node: WorkflowNode = {
    ...defaultNodeFor(type, id),
    x: 24 + col * (NODE_WIDTH + COL_GAP),
    y: 24 + row * (NODE_HEIGHT + ROW_GAP),
  };
  return { ...graph, nodes: [...graph.nodes, node] };
}

function wouldCycle(graph: WorkflowGraph, from: string, to: string): boolean {
  const adjacency = new Map<string, string[]>();
  for (const edge of graph.edges) {
    if (edge.loop) continue;
    const next = adjacency.get(edge.from) ?? [];
    next.push(edge.to);
    adjacency.set(edge.from, next);
  }
  const outgoing = adjacency.get(from) ?? [];
  outgoing.push(to);
  adjacency.set(from, outgoing);

  const visiting = new Set<string>();
  const visited = new Set<string>();
  function walk(id: string): boolean {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const next of adjacency.get(id) ?? []) {
      if (walk(next)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }
  return graph.nodes.some((node) => walk(node.id));
}

export function connectCanvasNodes(graph: WorkflowGraph, fromId: string, toId: string): WorkflowGraph {
  if (fromId === toId) throw new Error('cannot connect a node to itself');
  const from = graph.nodes.find((node) => node.id === fromId);
  const to = graph.nodes.find((node) => node.id === toId);
  if (!from || !to) throw new Error('unknown node');
  if (graph.edges.some((edge) => edge.from === fromId && edge.to === toId)) {
    return graph;
  }

  const attachmentType = NODE_PRODUCES[from.type];
  const loop = from.type === 'gate' && wouldCycle(graph, fromId, toId);
  if (!loop && !NODE_ACCEPTS[to.type].includes(attachmentType)) {
    throw new Error(`node ${toId} does not accept ${attachmentType}`);
  }
  if (!loop && wouldCycle(graph, fromId, toId)) {
    throw new Error('that connection would cycle');
  }

  const edge = loop
    ? { from: fromId, to: toId, attachmentType, loop: true, maxRetries: 2 }
    : { from: fromId, to: toId, attachmentType };
  return { ...graph, edges: [...graph.edges, edge] };
}

export function moveCanvasNode(graph: WorkflowGraph, id: string, x: number, y: number): WorkflowGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((node) => (node.id === id ? { ...node, x, y } : node)),
  };
}

export function updateCanvasNode(
  graph: WorkflowGraph,
  id: string,
  patch: Partial<Omit<WorkflowNode, 'id' | 'type'>>,
): WorkflowGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)),
  };
}

export function removeCanvasNode(graph: WorkflowGraph, id: string): WorkflowGraph {
  return {
    ...graph,
    nodes: graph.nodes.filter((node) => node.id !== id),
    edges: graph.edges.filter((edge) => edge.from !== id && edge.to !== id),
  };
}

export function removeCanvasEdge(graph: WorkflowGraph, from: string, to: string): WorkflowGraph {
  return {
    ...graph,
    edges: graph.edges.filter((edge) => !(edge.from === from && edge.to === to)),
  };
}

export function layoutAcceptanceGraph(): WorkflowGraph {
  const nodes: WorkflowNode[] = [
    {
      id: 'scan',
      type: 'explore',
      title: '盘点',
      goal: '盘点全书进度与伏笔',
      skills: [],
      config: { sourcePaths: ['outline.md', 'world.md'] },
    },
    {
      id: 'dna',
      type: 'gene',
      title: '拆书',
      goal: '提取骨架与文笔基因',
      skills: [],
      config: { sourcePaths: ['outline.md'], targetPath: 'genes/source-book.md' },
    },
    {
      id: 'draft',
      type: 'write',
      title: '写第一章',
      goal: '写第 1 章',
      skills: ['novel-writing'],
      config: { targetPath: 'chapters/ch_01.md' },
    },
    {
      id: 'wash',
      type: 'deai',
      title: '去 AI 味',
      goal: '消除 AI 痕迹',
      skills: [],
      config: { targetPath: 'chapters/ch_01.md' },
    },
    {
      id: 'judge',
      type: 'review',
      title: '审查',
      goal: '审 OOC、逻辑、文笔',
      skills: [],
    },
    {
      id: 'door',
      type: 'gate',
      title: '门禁',
      goal: '低于 80 分打回',
      skills: [],
      config: { threshold: 80 },
    },
    {
      id: 'check',
      type: 'manual',
      title: '作者检查',
      goal: '作者过目后放行',
      skills: [],
    },
  ];
  const placed = nodes.map((node, index) => ({
    ...node,
    x: 24 + (index % 4) * (NODE_WIDTH + COL_GAP),
    y: 24 + Math.floor(index / 4) * (NODE_HEIGHT + ROW_GAP),
  }));
  return {
    name: DEFAULT_GRAPH_NAME,
    model: DEFAULT_GRAPH_MODEL,
    nodes: placed,
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

export function withLaidOutNodes(graph: WorkflowGraph): WorkflowGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((node, index) => ({
      ...node,
      x: node.x ?? 24 + (index % 4) * (NODE_WIDTH + COL_GAP),
      y: node.y ?? 24 + Math.floor(index / 4) * (NODE_HEIGHT + ROW_GAP),
    })),
  };
}

export function nodeCenter(node: WorkflowNode): { x: number; y: number } {
  return {
    x: (node.x ?? 0) + NODE_WIDTH / 2,
    y: (node.y ?? 0) + NODE_HEIGHT / 2,
  };
}

export const BIXIN_NOVEL_SKILLS: Array<{ id: string; label: string; hint: string }> = [
  { id: 'novel-writing', label: 'novel-writing', hint: '章节规划与续写' },
  { id: 'novel', label: 'novel', hint: '五维审查 OOC / 设定 / 逻辑 / 文风 / 重复' },
  { id: 'zh-writing-humanizer', label: 'zh-writing-humanizer', hint: '中文去 AI 味' },
  { id: 'humanizer', label: 'humanizer', hint: '去 AI 味' },
  { id: 'humanize-ai', label: 'humanize-ai', hint: '中文去 AI 味' },
  { id: 'wenfeng-skill', label: 'wenfeng-skill', hint: '文风基因提取' },
  { id: 'quill', label: 'quill', hint: '多风格配比' },
  { id: 'distill-novels', label: 'distill-novels', hint: '拆书提取基因' },
  { id: 'novel-project-strategy', label: 'novel-project-strategy', hint: '章节状态纪律' },
  { id: 'chinese-write-checker', label: 'chinese-write-checker', hint: '中文写作检查' },
  { id: 'editor-revisor', label: 'editor-revisor', hint: '审稿改稿' },
  { id: 'punct-master', label: 'punct-master', hint: '标点' },
  { id: 'punct-polish', label: 'punct-polish', hint: '标点打磨' },
  { id: 'scene-fit', label: 'scene-fit', hint: '场景适配' },
  { id: 'style-blade', label: 'style-blade', hint: '文风刀' },
  { id: 'voice-dissolver', label: 'voice-dissolver', hint: '声音校准' },
];

export function novelSkillChoices<T extends { id: string; label: string; hint?: string }>(
  skills: T[],
  selected: string[],
): T[] {
  const picked = new Set(selected);
  return skills.filter(
    (item) =>
      picked.has(item.id) ||
      /novel|writ|human|wenfeng|quill|distill|strategy|say-it|zh-writing|hook|lore|ooc|gene|review|outline|chapter|revisor|punct|scene-fit|style-blade|voice-dissolver/.test(
        `${item.id} ${item.label} ${item.hint ?? ''}`,
      ),
  );
}

export const CANVAS_NODE_SIZE = { width: NODE_WIDTH, height: NODE_HEIGHT };
