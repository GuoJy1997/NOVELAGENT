export type ChapterStatus = 'Draft' | 'Planned' | 'Writing' | 'Reviewing' | 'Done' | 'Locked';
export type RiskLevel = 'low' | 'medium' | 'high';
export type TaskStatus = 'Queued' | 'Running' | 'WaitingApproval' | 'Done' | 'Failed' | 'Cancelled';
export type InspirationStatus = 'Inbox' | 'Organized' | 'Incubating' | 'Adopted' | 'Used' | 'Archived';
export type ClueCredibility = 'true' | 'false' | 'partial' | 'misread' | 'bait';

export interface ProjectNavigationItem {
  id: string;
  label: string;
  icon: string;
  selected?: boolean;
  notification?: boolean;
}

export interface StoryMilestone {
  id: string;
  label: string;
  chapterId: string;
  tone: 'teal' | 'amber' | 'ember';
}

export interface ChapterCard {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  actId: string;
  status: ChapterStatus;
  clueCount: number;
  foreshadowingCount: number;
  riskLevel: RiskLevel;
  selected?: boolean;
  locked?: boolean;
}

export interface InspirationCard {
  id: string;
  title: string;
  summary: string;
  status: InspirationStatus;
  tags: string[];
  relatedChapterIds: string[];
}

export interface CharacterNode {
  id: string;
  name: string;
  role: string;
  relationship: string;
}

export interface CharacterEdge {
  id: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  relationshipType: string;
}

export interface ClueChainNode {
  label: string;
  detail: string;
}

export interface ClueChain {
  id: string;
  title: string;
  provider: ClueChainNode;
  trigger: ClueChainNode;
  receiver: ClueChainNode;
  payoff: ClueChainNode;
  credibility: ClueCredibility;
  relatedChapterIds: string[];
  missingFields: Array<'provider' | 'trigger' | 'receiver' | 'payoff'>;
}

export interface AgentTask {
  id: string;
  title: string;
  status: TaskStatus;
  assignedSubagent: string;
  skills: string[];
  requiresApproval: boolean;
}

export interface SubagentProfile {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

export interface SkillBadge {
  id: string;
  label: string;
  category: 'writing' | 'review' | 'planning' | 'memory';
}

export interface ReviewChecklistItem {
  id: string;
  label: string;
  passed: boolean;
}

export interface NovelProject {
  id: string;
  title: string;
  genre: string;
  currentView: 'Map' | 'Timeline' | 'List';
  navigation: ProjectNavigationItem[];
  chapters: ChapterCard[];
  milestones: StoryMilestone[];
  inspirations: InspirationCard[];
  characters: CharacterNode[];
  characterEdges: CharacterEdge[];
  clueChains: ClueChain[];
  agentTasks: AgentTask[];
  subagents: SubagentProfile[];
  skills: SkillBadge[];
  memorySyncPercent: number;
  reviewChecklist: ReviewChecklistItem[];
}
