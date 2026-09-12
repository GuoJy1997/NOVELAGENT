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
