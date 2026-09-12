import { noveloraMockProject } from '../../novelora-cockpit/data/noveloraMockProject';
import type {
  Clue,
  ClueAttribution,
  ClueBeat,
  ClueChain,
  ClueSystemState,
  Foreshadowing,
  HiddenThread,
  InformationState,
  RedHerring,
} from '../types';
import { enrichClue, enrichForeshadowing } from '../rules/enrich';
import { loadClueSystem } from './persistence';

const SEED_TIMESTAMP = '2026-08-01T00:00:00.000Z';
const NOVEL_ID = noveloraMockProject.novelId;

function seedAttribution(overrides: Partial<ClueAttribution>): ClueAttribution {
  return {
    providerCharacterId: null,
    triggerCharacterId: null,
    receiverCharacterId: null,
    observerCharacterIds: [],
    missedByCharacterIds: [],
    concealerCharacterId: null,
    misleaderCharacterId: null,
    payoffCharacterId: null,
    payoffChapterId: null,
    payoffNodeId: null,
    mechanism: '',
    completeness: 'incomplete',
    ...overrides,
  };
}

function seedClue(overrides: Partial<Clue>): Clue {
  return enrichClue({
    clueId: '',
    novelId: NOVEL_ID,
    title: '',
    content: '',
    type: 'evidence',
    status: 'draft',
    credibility: 'unknown',
    readerVisibility: 'visible',
    firstAppearanceChapterId: null,
    firstAppearanceNodeId: null,
    currentChainId: null,
    attribution: seedAttribution({}),
    relatedCharacterIds: [],
    relatedWorldItemIds: [],
    relatedForeshadowingIds: [],
    sourceInspirationIds: [],
    sourceEventNodeIds: [],
    missingFields: [],
    riskLevel: 'none',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
    ...overrides,
  });
}

function seedForeshadowing(overrides: Partial<Foreshadowing>): Foreshadowing {
  return enrichForeshadowing({
    foreshadowingId: '',
    novelId: NOVEL_ID,
    title: '',
    content: '',
    status: 'draft',
    plantingChapterId: null,
    plantingNodeId: null,
    expectedPayoffChapterId: null,
    expectedPayoffNodeId: null,
    actualPayoffChapterId: null,
    actualPayoffNodeId: null,
    visibility: 'hinted',
    subtletyLevel: 3,
    relatedClueIds: [],
    chainId: null,
    sourceInspirationIds: [],
    missingFields: [],
    riskLevel: 'none',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
    ...overrides,
  });
}

function seedBeat(overrides: Partial<ClueBeat>): ClueBeat {
  return {
    beatId: '',
    novelId: NOVEL_ID,
    clueId: null,
    foreshadowingId: null,
    chainId: null,
    type: 'plant',
    chapterId: null,
    sceneId: null,
    eventNodeId: null,
    order: 1,
    summary: '',
    readerVisibility: 'visible',
    informationDelta: '',
    createdAt: SEED_TIMESTAMP,
    ...overrides,
  };
}

export function buildSeedState(): ClueSystemState {
  const oldTideMap = seedClue({
    clueId: 'clue-old-tide-map',
    title: 'The old tide map',
    content:
      'A vellum fragment hidden behind the cracked lighthouse lens reveals the forbidden harbor route.',
    type: 'object',
    status: 'paidOff',
    credibility: 'true',
    readerVisibility: 'visible',
    firstAppearanceChapterId: 'chapter-2',
    currentChainId: 'chain-ember-route',
    attribution: seedAttribution({
      providerCharacterId: 'liora',
      triggerCharacterId: 'kael',
      receiverCharacterId: 'kael',
      observerCharacterIds: ['liora', 'vex'],
      payoffCharacterId: 'kael',
      payoffChapterId: 'chapter-6',
      completeness: 'complete',
    }),
    relatedCharacterIds: ['kael', 'liora', 'vex'],
  });

  const falseSigil = seedClue({
    clueId: 'clue-false-harbor-sigil',
    title: 'The false-harbor sigil',
    content:
      'A stamped sigil beside beacon-keeper payments in Arden’s sealed ledgers, seen again on the lantern casing before the trap.',
    type: 'evidence',
    status: 'active',
    credibility: 'true',
    readerVisibility: 'hinted',
    firstAppearanceChapterId: 'chapter-3',
    currentChainId: 'chain-ember-route',
    attribution: seedAttribution({
      providerCharacterId: 'arden',
      triggerCharacterId: 'arden',
      receiverCharacterId: 'liora',
      completeness: 'missingPayoff',
    }),
    relatedCharacterIds: ['arden', 'liora', 'vex'],
  });

  const forgeThreshold = seedForeshadowing({
    foreshadowingId: 'foreshadowing-forge-threshold',
    title: 'The drowned forge threshold',
    content: 'A submerged threshold that opens at the meeting of fire and tide.',
    status: 'planted',
    plantingChapterId: 'chapter-5',
    visibility: 'hinted',
    subtletyLevel: 4,
    chainId: 'chain-ember-route',
    sourceInspirationIds: ['forge-threshold'],
  });

  const reefBargain = seedForeshadowing({
    foreshadowingId: 'foreshadowing-reef-bargain',
    title: 'Selene’s reef bargain',
    content: 'The price Selene paid the reef for her oracle sight, still unspoken.',
    status: 'developing',
    plantingChapterId: 'chapter-4',
    expectedPayoffChapterId: 'chapter-6',
    subtletyLevel: 3,
    sourceInspirationIds: ['vow-fragment'],
    relatedClueIds: [],
  });

  const chain: ClueChain = {
    chainId: 'chain-ember-route',
    novelId: NOVEL_ID,
    title: 'The ember route',
    type: 'clue',
    status: 'active',
    arcIds: ['act-i', 'act-ii', 'act-iii', 'epilogue'],
    chapterIds: ['chapter-2', 'chapter-3', 'chapter-5', 'chapter-6'],
    clueIds: [oldTideMap.clueId, falseSigil.clueId],
    foreshadowingIds: [forgeThreshold.foreshadowingId],
    allowFlashback: false,
    ownerSubagentId: null,
    riskLevel: 'low',
    missingFields: [],
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  };

  const harborRegistry: HiddenThread = {
    hiddenThreadId: 'thread-harbor-registry',
    novelId: NOVEL_ID,
    title: 'The rewritten harbor registry',
    secretTruth: 'Arden altered the harbor registry to hide the forbidden route.',
    visibleToReader: false,
    visibleToCharacterIds: ['arden', 'selene'],
    relatedChainIds: [chain.chainId],
    plannedRevealChapterId: 'chapter-6',
    status: 'active',
  };

  const rescueBeacon: RedHerring = {
    redHerringId: 'herring-rescue-beacon',
    novelId: NOVEL_ID,
    title: 'The rescue beacon',
    falseConclusion: 'The beacon guides ships to safety.',
    truthBehindIt: 'It lures ember-ore ships onto the reef.',
    misleaderCharacterId: 'arden',
    targetCharacterIds: ['kael', 'vex'],
    misleadsReader: true,
    clarificationChapterId: null,
    relatedClueIds: [falseSigil.clueId],
    status: 'active',
  };

  const tideMapInfo: InformationState = {
    informationStateId: 'info-tide-map-ch3',
    novelId: NOVEL_ID,
    objectType: 'clue',
    objectId: oldTideMap.clueId,
    chapterId: 'chapter-3',
    eventNodeId: null,
    readerKnowledge: 'knowsPartial',
    authorKnowledge: 'confirmed',
    characterKnowledge: [
      { characterId: 'kael', knowledgeState: 'knowsTruth', evidence: 'He recognizes the route Vex used.' },
      { characterId: 'liora', knowledgeState: 'knowsPartial', evidence: 'She hid the fragment but not its meaning.' },
      { characterId: 'vex', knowledgeState: 'suspects', evidence: 'The route is his old smuggling path.' },
      { characterId: 'arden', knowledgeState: 'conceals', evidence: 'The registry he altered names this route.' },
    ],
    notes: '',
    createdAt: SEED_TIMESTAMP,
  };

  const beats: ClueBeat[] = [
    seedBeat({
      beatId: 'beat-map-plant',
      clueId: oldTideMap.clueId,
      chainId: chain.chainId,
      type: 'plant',
      chapterId: 'chapter-2',
      order: 1,
      summary: 'Liora bargains for the vellum fragment behind the lighthouse lens.',
    }),
    seedBeat({
      beatId: 'beat-map-advance',
      clueId: oldTideMap.clueId,
      chainId: chain.chainId,
      type: 'advance',
      chapterId: 'chapter-3',
      order: 2,
      summary: 'The ashfall tide mark aligns with harbor stones; the route becomes legible.',
      informationDelta: 'Kael recognizes the route Vex used before disappearing.',
    }),
    seedBeat({
      beatId: 'beat-map-payoff',
      clueId: oldTideMap.clueId,
      chainId: chain.chainId,
      type: 'payoff',
      chapterId: 'chapter-6',
      order: 3,
      summary: 'The map reveals the only safe approach to the drowned forge under black water.',
    }),
    seedBeat({
      beatId: 'beat-sigil-plant',
      clueId: falseSigil.clueId,
      chainId: chain.chainId,
      type: 'plant',
      chapterId: 'chapter-3',
      order: 1,
      summary: 'A stamped sigil appears beside beacon-keeper payments in Arden’s ledgers.',
    }),
    seedBeat({
      beatId: 'beat-sigil-advance',
      clueId: falseSigil.clueId,
      chainId: chain.chainId,
      type: 'advance',
      chapterId: 'chapter-5',
      order: 2,
      summary: 'The sigil appears on the lantern casing as the beacon flame turns green.',
      readerVisibility: 'visible',
    }),
  ];

  return {
    projects: [{ novelId: NOVEL_ID, title: noveloraMockProject.title, createdAt: SEED_TIMESTAMP }],
    activeNovelId: NOVEL_ID,
    clues: [oldTideMap, falseSigil],
    foreshadowings: [forgeThreshold, reefBargain],
    chains: [chain],
    hiddenThreads: [harborRegistry],
    redHerrings: [rescueBeacon],
    beats,
    informationStates: [tideMapInfo],
    reports: [],
  };
}

export function initialClueState(): ClueSystemState {
  return loadClueSystem() ?? buildSeedState();
}
