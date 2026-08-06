export type ClueType =
  | 'evidence'
  | 'testimony'
  | 'object'
  | 'behavior'
  | 'memory'
  | 'worldRule'
  | 'relationship'
  | 'location'
  | 'symbol'
  | 'redHerring';

export type ClueStatus =
  | 'draft'
  | 'planted'
  | 'active'
  | 'misleading'
  | 'revealed'
  | 'paidOff'
  | 'discarded';

export type Credibility = 'true' | 'partial' | 'false' | 'unknown';

export type ReaderVisibility = 'hidden' | 'hinted' | 'visible' | 'misleading';

export type RiskLevel = 'none' | 'low' | 'medium' | 'high';

export type AttributionCompleteness =
  | 'complete'
  | 'missingProvider'
  | 'missingTrigger'
  | 'missingReceiver'
  | 'missingPayoff'
  | 'incomplete';

export type ForeshadowingStatus =
  | 'draft'
  | 'planted'
  | 'developing'
  | 'readyForPayoff'
  | 'paidOff'
  | 'abandoned';

export type ClueBeatType =
  | 'plant'
  | 'advance'
  | 'mislead'
  | 'reveal'
  | 'payoff'
  | 'recontextualize'
  | 'discard';

export type ChainType = 'clue' | 'foreshadowing' | 'hiddenThread' | 'redHerring';

export type ClueChainStatus =
  | 'draft'
  | 'active'
  | 'needsPayoff'
  | 'complete'
  | 'inconsistent'
  | 'abandoned';

export type HiddenThreadStatus = 'draft' | 'active' | 'revealed' | 'abandoned';

export type RedHerringStatus =
  | 'draft'
  | 'active'
  | 'clarified'
  | 'unfair'
  | 'abandoned';

export type ReaderKnowledge =
  | 'unknown'
  | 'suspects'
  | 'knowsFalse'
  | 'knowsPartial'
  | 'knowsTruth';

export type AuthorKnowledge = 'unknown' | 'planned' | 'confirmed';

export type CharacterKnowledgeState =
  | 'unknown'
  | 'missed'
  | 'suspects'
  | 'misunderstands'
  | 'knowsPartial'
  | 'knowsTruth'
  | 'conceals';

export type InformationObjectType = 'clue' | 'foreshadowing' | 'hiddenThread' | 'redHerring';

export type FindingType =
  | 'missingAttribution'
  | 'missingPayoff'
  | 'timelineConflict'
  | 'knowledgeConflict'
  | 'unfairMislead'
  | 'orphanClue'
  | 'weakSetup';

export type FindingSeverity = 'info' | 'warning' | 'danger';

export interface ClueAttribution {
  providerCharacterId: string | null;
  triggerCharacterId: string | null;
  receiverCharacterId: string | null;
  observerCharacterIds: string[];
  missedByCharacterIds: string[];
  concealerCharacterId: string | null;
  misleaderCharacterId: string | null;
  payoffCharacterId: string | null;
  payoffChapterId: string | null;
  payoffNodeId: string | null;
  mechanism: string;
  completeness: AttributionCompleteness;
}

export interface Clue {
  clueId: string;
  novelId: string;
  title: string;
  content: string;
  type: ClueType;
  status: ClueStatus;
  credibility: Credibility;
  readerVisibility: ReaderVisibility;
  firstAppearanceChapterId: string | null;
  firstAppearanceNodeId: string | null;
  currentChainId: string | null;
  attribution: ClueAttribution;
  relatedCharacterIds: string[];
  relatedWorldItemIds: string[];
  relatedForeshadowingIds: string[];
  sourceInspirationIds: string[];
  sourceEventNodeIds: string[];
  missingFields: string[];
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
}

export interface Foreshadowing {
  foreshadowingId: string;
  novelId: string;
  title: string;
  content: string;
  status: ForeshadowingStatus;
  plantingChapterId: string | null;
  plantingNodeId: string | null;
  expectedPayoffChapterId: string | null;
  expectedPayoffNodeId: string | null;
  actualPayoffChapterId: string | null;
  actualPayoffNodeId: string | null;
  visibility: ReaderVisibility;
  subtletyLevel: number;
  relatedClueIds: string[];
  chainId: string | null;
  sourceInspirationIds: string[];
  missingFields: string[];
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
}

export interface ClueBeat {
  beatId: string;
  novelId: string;
  clueId: string | null;
  foreshadowingId: string | null;
  chainId: string | null;
  type: ClueBeatType;
  chapterId: string | null;
  sceneId: string | null;
  eventNodeId: string | null;
  order: number;
  summary: string;
  readerVisibility: ReaderVisibility;
  informationDelta: string;
  createdAt: string;
}

export interface ClueChain {
  chainId: string;
  novelId: string;
  title: string;
  type: ChainType;
  status: ClueChainStatus;
  arcIds: string[];
  chapterIds: string[];
  clueIds: string[];
  foreshadowingIds: string[];
  allowFlashback: boolean;
  ownerSubagentId: string | null;
  riskLevel: RiskLevel;
  missingFields: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HiddenThread {
  hiddenThreadId: string;
  novelId: string;
  title: string;
  secretTruth: string;
  visibleToReader: boolean;
  visibleToCharacterIds: string[];
  relatedChainIds: string[];
  plannedRevealChapterId: string | null;
  status: HiddenThreadStatus;
}

export interface RedHerring {
  redHerringId: string;
  novelId: string;
  title: string;
  falseConclusion: string;
  truthBehindIt: string;
  misleaderCharacterId: string | null;
  targetCharacterIds: string[];
  misleadsReader: boolean;
  clarificationChapterId: string | null;
  relatedClueIds: string[];
  status: RedHerringStatus;
}

export interface CharacterKnowledge {
  characterId: string;
  knowledgeState: CharacterKnowledgeState;
  evidence: string;
}

export interface InformationState {
  informationStateId: string;
  novelId: string;
  objectType: InformationObjectType;
  objectId: string;
  chapterId: string | null;
  eventNodeId: string | null;
  readerKnowledge: ReaderKnowledge;
  authorKnowledge: AuthorKnowledge;
  characterKnowledge: CharacterKnowledge[];
  notes: string;
  createdAt: string;
}

export interface ClueFinding {
  findingId: string;
  type: FindingType;
  severity: FindingSeverity;
  summary: string;
  relatedObjectIds: string[];
  suggestedAction: string;
  requiresUserConfirmation: boolean;
}

export interface ClueReviewReport {
  reportId: string;
  novelId: string;
  scopeType: 'novel' | 'arc' | 'chapter' | 'chain' | 'clue';
  scopeId: string | null;
  findings: ClueFinding[];
  modelId: string;
  createdAt: string;
}

export interface NovelProjectMeta {
  novelId: string;
  title: string;
  createdAt: string;
}

export interface ClueSystemState {
  projects: NovelProjectMeta[];
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
