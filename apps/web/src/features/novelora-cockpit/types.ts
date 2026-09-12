import type {
  characterPortraits,
  inspirationThumbnails,
  projectCovers,
} from './assetRegistry';

export type InspirationType = 'image' | 'quote' | 'location' | 'research';

export type AgentTaskState = 'queued' | 'running' | 'done' | 'blocked';
export type SkillCategory = 'writing' | 'review' | 'planning' | 'memory';
export type NarrativeMarkerTone = 'conflict' | 'climax' | 'resolution';
export type RelationshipKind =
  | 'ally' | 'neutral' | 'rival' | 'unknown'
  | 'friend' | 'deal' | 'kin' | 'mentor';
export const KIND_META: Record<RelationshipKind, { label: string }> = {
  ally: { label: '亲密 / 信任' }, friend: { label: '友好 / 合作' },
  rival: { label: '竞争 / 敌对' }, deal: { label: '利用 / 交易' },
  kin: { label: '亲属 / 血缘' }, mentor: { label: '师徒 / 指导' },
  neutral: { label: '中立' }, unknown: { label: '其他' },
};

export interface NarrativeMarker {
  label: string;
  tone: NarrativeMarkerTone;
}

export interface FocusModeOption {
  id: string;
  label: string;
  hint: string;
}

type ProjectCoverAssetKey = keyof typeof projectCovers;
type CharacterPortraitAssetKey = keyof typeof characterPortraits;
type InspirationAssetKey = keyof typeof inspirationThumbnails;

export interface Act {
  id: string;
  title: string;
  summary: string;
  chapterIds: string[];
  narrativeMarkers: NarrativeMarker[];
}

export interface CockpitChapter {
  id: string;
  actId: string;
  order: number;
  title: string;
  summary: string;
  beat: string;
  wordCount: number;
  characterIds: string[];
  clueCount: number;
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
  kind: RelationshipKind;
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
  progressPercent: number;
}

export interface SubagentProfile {
  id: string;
  name: string;
  role: string;
  avatarLabel: string;
  active: boolean;
}

export interface SkillBadge {
  id: string;
  label: string;
  category: SkillCategory;
}

export interface ReviewChecklistItem {
  id: string;
  label: string;
  passed: boolean;
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
  memoryHealthPercent: number;
  currentWords: number;
  wordGoal: number;
  acts: Act[];
  chapters: CockpitChapter[];
  selectedChapterId: string;
  inspirations: InspirationItem[];
  characters: CharacterNode[];
  characterRelationships: CharacterRelationship[];
  clueFlows: ClueFlow[];
  agentTasks: AgentTask[];
  subagents: SubagentProfile[];
  skills: SkillBadge[];
  reviewChecklist: ReviewChecklistItem[];
  memorySources: MemorySource[];
  lastSavedLabel: string;
  focusModes: FocusModeOption[];
  activeFocusModeId: string;
  writingQuote: { text: string };
  agentGreeting: { headline: string; body: string };
}
