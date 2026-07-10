export type InspirationType = 'image' | 'quote' | 'location' | 'research';

export type AgentTaskState = 'queued' | 'running' | 'done' | 'blocked';

type ProjectCoverAssetKey = 'eclipseOfEchoes' | 'whispersVale' | 'chroniclesLumin';
type CharacterPortraitAssetKey = 'liora' | 'arden' | 'kael' | 'selene' | 'vex';
type InspirationAssetKey = 'moonQuote' | 'observatory' | 'ruins' | 'portal';

export interface Act {
  id: string;
  title: string;
  summary: string;
  chapterIds: string[];
}

export interface CockpitChapter {
  id: string;
  actId: string;
  order: number;
  title: string;
  summary: string;
  status: 'planned' | 'drafting' | 'review' | 'complete';
}

export interface InspirationItem {
  id: string;
  type: InspirationType;
  title: string;
  note: string;
  assetKey: InspirationAssetKey;
  relatedChapterIds: string[];
}

export interface CharacterNode {
  id: string;
  name: string;
  role: string;
  portraitAssetKey: CharacterPortraitAssetKey;
}

export interface CharacterRelationship {
  id: string;
  fromCharacterId: string;
  toCharacterId: string;
  label: string;
  tension: string;
}

export interface ClueFlow {
  id: string;
  title: string;
  provider: {
    providedBy: string;
    clue: string;
    chapterId: string;
  };
  trigger: {
    triggeredBy: string;
    consequence: string;
    chapterId: string;
  };
  receiver: {
    receivedBy: string;
    interpretation: string;
    chapterId: string;
  };
  payoff: {
    paidOffBy: string;
    resolution: string;
    chapterId: string;
  };
}

export interface AgentTask {
  id: string;
  title: string;
  state: AgentTaskState;
  owner: string;
  focus: string;
}

export interface MemorySource {
  id: string;
  label: string;
  kind: 'chapter' | 'character' | 'clue' | 'inspiration';
  summary: string;
  relatedChapterIds: string[];
}

export interface NoveloraProject {
  novelId: string;
  title: string;
  genre: string;
  coverAssetKey: ProjectCoverAssetKey;
  acts: Act[];
  chapters: CockpitChapter[];
  selectedChapterId: string;
  inspirations: InspirationItem[];
  characters: CharacterNode[];
  characterRelationships: CharacterRelationship[];
  clueFlows: ClueFlow[];
  agentTasks: AgentTask[];
  memorySources: MemorySource[];
}
