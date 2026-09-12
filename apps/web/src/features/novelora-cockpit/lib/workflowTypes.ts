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

export type NodeRunStatus = 'pending' | 'running' | 'done' | 'blocked' | 'failed' | 'waiting_author';

export type RunStatus = 'running' | 'waiting_author' | 'blocked' | 'offline' | 'done';

export interface WorkflowNodeConfig {
  sourcePaths?: string[];
  voiceSamplePath?: string;
  targetPath?: string;
  threshold?: number;
  scoreField?: string;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  title: string;
  goal: string;
  skills: string[];
  expert?: string;
  model?: string;
  config?: WorkflowNodeConfig;
  x?: number;
  y?: number;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  attachmentType: AttachmentType;
  loop?: boolean;
  maxRetries?: number;
}

export interface WorkflowGraph {
  name: string;
  model: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface NodeRun {
  nodeId: string;
  status: NodeRunStatus;
  attachmentPath?: string;
  candidateId?: string;
  retriesUsed: number;
  score?: number;
  cached?: boolean;
  forceRerun?: boolean;
  error?: string;
}

export interface WorkflowRun {
  id: string;
  graphName: string;
  status: RunStatus;
  nodes: Record<string, NodeRun>;
  createdAt: string;
}
