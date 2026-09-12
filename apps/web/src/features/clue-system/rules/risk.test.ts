import { describe, expect, it } from 'vitest';
import type {
  Clue,
  ClueBeat,
  ClueChain,
  ClueSystemState,
  Foreshadowing,
  InformationState,
} from '../types';
import {
  computeClueRisk,
  computeForeshadowingRisk,
  deriveChainStatus,
  findKnowledgeConflicts,
  findTimelineConflicts,
  findUnpaidForeshadowings,
} from './risk';

function makeClue(overrides: Partial<Clue>): Clue {
  return {
    clueId: 'clue-x',
    novelId: 'novel-x',
    title: 'Clue',
    content: 'Content',
    type: 'evidence',
    status: 'active',
    credibility: 'unknown',
    readerVisibility: 'visible',
    firstAppearanceChapterId: null,
    firstAppearanceNodeId: null,
    currentChainId: null,
    attribution: {
      providerCharacterId: null, triggerCharacterId: null, receiverCharacterId: null,
      observerCharacterIds: [], missedByCharacterIds: [], concealerCharacterId: null,
      misleaderCharacterId: null, payoffCharacterId: null, payoffChapterId: null,
      payoffNodeId: null, mechanism: '', completeness: 'incomplete',
    },
    relatedCharacterIds: [],
    relatedWorldItemIds: [],
    relatedForeshadowingIds: [],
    sourceInspirationIds: [],
    sourceEventNodeIds: [],
    missingFields: [],
    riskLevel: 'none',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeForeshadowing(overrides: Partial<Foreshadowing>): Foreshadowing {
  return {
    foreshadowingId: 'foreshadowing-x',
    novelId: 'novel-x',
    title: 'Foreshadowing',
    content: 'Content',
    status: 'planted',
    plantingChapterId: 'chapter-1',
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
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeChain(overrides: Partial<ClueChain>): ClueChain {
  return {
    chainId: 'chain-x',
    novelId: 'novel-x',
    title: 'Chain',
    type: 'clue',
    status: 'active',
    arcIds: [],
    chapterIds: [],
    clueIds: [],
    foreshadowingIds: [],
    allowFlashback: false,
    ownerSubagentId: null,
    riskLevel: 'none',
    missingFields: [],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeBeat(overrides: Partial<ClueBeat>): ClueBeat {
  return {
    beatId: 'beat-x',
    novelId: 'novel-x',
    clueId: null,
    foreshadowingId: null,
    chainId: 'chain-x',
    type: 'plant',
    chapterId: null,
    sceneId: null,
    eventNodeId: null,
    order: 1,
    summary: 'Beat',
    readerVisibility: 'visible',
    informationDelta: '',
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeState(overrides: Partial<ClueSystemState>): ClueSystemState {
  return {
    projects: [],
    activeNovelId: 'novel-x',
    clues: [],
    foreshadowings: [],
    chains: [],
    hiddenThreads: [],
    redHerrings: [],
    beats: [],
    informationStates: [],
    reports: [],
    ...overrides,
  };
}

describe('computeClueRisk', () => {
  it('is none for draft, paidOff and discarded clues', () => {
    expect(computeClueRisk(makeClue({ status: 'draft', missingFields: ['providerCharacterId'] }))).toBe('none');
    expect(computeClueRisk(makeClue({ status: 'paidOff' }))).toBe('none');
    expect(computeClueRisk(makeClue({ status: 'discarded', missingFields: ['misleader'] }))).toBe('none');
  });

  it('is high for committed clues with missing fields', () => {
    expect(computeClueRisk(makeClue({ status: 'active', missingFields: ['receiverCharacterId'] }))).toBe('high');
  });

  it('is medium for unrevealed clues known to be false', () => {
    expect(computeClueRisk(makeClue({ status: 'active', credibility: 'false' }))).toBe('medium');
    expect(computeClueRisk(makeClue({ status: 'revealed', credibility: 'false' }))).toBe('low');
  });

  it('is low otherwise', () => {
    expect(computeClueRisk(makeClue({ status: 'planted' }))).toBe('low');
  });
});

describe('computeForeshadowingRisk', () => {
  it('is none for draft, paidOff and abandoned foreshadowings', () => {
    expect(computeForeshadowingRisk(makeForeshadowing({ status: 'draft' }))).toBe('none');
    expect(computeForeshadowingRisk(makeForeshadowing({ status: 'paidOff' }))).toBe('none');
    expect(computeForeshadowingRisk(makeForeshadowing({ status: 'abandoned' }))).toBe('none');
  });

  it('is high when an open foreshadowing has no expected payoff', () => {
    expect(computeForeshadowingRisk(makeForeshadowing({ status: 'planted' }))).toBe('high');
  });

  it('is low when an expected payoff exists', () => {
    expect(
      computeForeshadowingRisk(
        makeForeshadowing({ status: 'developing', expectedPayoffChapterId: 'chapter-6' }),
      ),
    ).toBe('low');
  });
});

describe('findUnpaidForeshadowings', () => {
  it('returns open foreshadowings without an actual payoff, filtered by novelId', () => {
    const unpaid = makeForeshadowing({ foreshadowingId: 'f-unpaid', status: 'developing' });
    const paid = makeForeshadowing({
      foreshadowingId: 'f-paid',
      status: 'readyForPayoff',
      actualPayoffChapterId: 'chapter-6',
    });
    const draft = makeForeshadowing({ foreshadowingId: 'f-draft', status: 'draft' });
    const otherNovel = makeForeshadowing({ foreshadowingId: 'f-other', novelId: 'novel-y' });
    const state = makeState({ foreshadowings: [unpaid, paid, draft, otherNovel] });

    expect(findUnpaidForeshadowings(state, 'novel-x').map((f) => f.foreshadowingId)).toEqual([
      'f-unpaid',
    ]);
  });
});

describe('findTimelineConflicts', () => {
  it('flags payoff or reveal beats ordered before a plant beat', () => {
    const chain = makeChain({});
    const beats = [
      makeBeat({ beatId: 'b-plant', type: 'plant', order: 2 }),
      makeBeat({ beatId: 'b-payoff', type: 'payoff', order: 1 }),
      makeBeat({ beatId: 'b-reveal', type: 'reveal', order: 3 }),
    ];
    expect(findTimelineConflicts(chain, beats)).toEqual([
      { chainId: 'chain-x', earlyBeatId: 'b-payoff', plantBeatId: 'b-plant' },
    ]);
  });

  it('ignores beats from other chains and returns nothing for healthy order', () => {
    const chain = makeChain({});
    const beats = [
      makeBeat({ beatId: 'b-plant', type: 'plant', order: 1 }),
      makeBeat({ beatId: 'b-payoff', type: 'payoff', order: 2 }),
      makeBeat({ beatId: 'b-foreign', type: 'payoff', order: 0, chainId: 'other-chain' }),
    ];
    expect(findTimelineConflicts(chain, beats)).toEqual([]);
  });

  it('skips chains explicitly marked as flashback structure', () => {
    const chain = makeChain({ allowFlashback: true });
    const beats = [
      makeBeat({ beatId: 'b-plant', type: 'plant', order: 2 }),
      makeBeat({ beatId: 'b-payoff', type: 'payoff', order: 1 }),
    ];
    expect(findTimelineConflicts(chain, beats)).toEqual([]);
  });
});

function makeInformationState(overrides: Partial<InformationState>): InformationState {
  return {
    informationStateId: 'info-x',
    novelId: 'novel-x',
    objectType: 'clue',
    objectId: 'clue-x',
    chapterId: null,
    eventNodeId: null,
    readerKnowledge: 'unknown',
    authorKnowledge: 'confirmed',
    characterKnowledge: [],
    notes: '',
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('findKnowledgeConflicts', () => {
  it('flags characters marked unknown who are attributed on the clue', () => {
    const clue = makeClue({
      clueId: 'clue-x',
      attribution: { ...makeClue({}).attribution, receiverCharacterId: 'kael' },
    });
    const infoState = makeInformationState({
      characterKnowledge: [{ characterId: 'kael', knowledgeState: 'unknown', evidence: '' }],
    });
    const state = makeState({ clues: [clue], informationStates: [infoState] });

    expect(findKnowledgeConflicts(state, 'novel-x')).toEqual([
      {
        informationStateId: 'info-x',
        characterId: 'kael',
        reason: 'unknownButAttributed',
      },
    ]);
  });

  it('flags characters knowing truth while the clue is still a draft', () => {
    const clue = makeClue({ clueId: 'clue-x', status: 'draft' });
    const infoState = makeInformationState({
      characterKnowledge: [{ characterId: 'liora', knowledgeState: 'knowsTruth', evidence: '' }],
    });
    const state = makeState({ clues: [clue], informationStates: [infoState] });

    expect(findKnowledgeConflicts(state, 'novel-x')).toEqual([
      {
        informationStateId: 'info-x',
        characterId: 'liora',
        reason: 'knowsBeforePlant',
      },
    ]);
  });

  it('ignores other novels, non-clue objects and dangling references', () => {
    const infoState = makeInformationState({
      informationStateId: 'info-dangling',
      objectId: 'missing-clue',
      characterKnowledge: [{ characterId: 'kael', knowledgeState: 'unknown', evidence: '' }],
    });
    const otherNovel = makeInformationState({
      informationStateId: 'info-other',
      novelId: 'novel-y',
      characterKnowledge: [{ characterId: 'kael', knowledgeState: 'unknown', evidence: '' }],
    });
    const threadState = makeInformationState({
      informationStateId: 'info-thread',
      objectType: 'hiddenThread',
      characterKnowledge: [{ characterId: 'kael', knowledgeState: 'unknown', evidence: '' }],
    });
    const state = makeState({ informationStates: [infoState, otherNovel, threadState] });

    expect(findKnowledgeConflicts(state, 'novel-x')).toEqual([]);
  });
});

describe('deriveChainStatus', () => {
  it('keeps draft and abandoned untouched', () => {
    expect(deriveChainStatus(makeChain({ status: 'draft' }), [])).toBe('draft');
    expect(deriveChainStatus(makeChain({ status: 'abandoned' }), [])).toBe('abandoned');
  });

  it('downgrades complete to inconsistent when plant or payoff beats are missing', () => {
    const chain = makeChain({ status: 'complete' });
    expect(deriveChainStatus(chain, [makeBeat({ type: 'plant' })])).toBe('inconsistent');
    expect(deriveChainStatus(chain, [makeBeat({ type: 'payoff' })])).toBe('inconsistent');
    expect(
      deriveChainStatus(chain, [
        makeBeat({ type: 'plant' }),
        makeBeat({ beatId: 'b-2', type: 'payoff', order: 2 }),
      ]),
    ).toBe('complete');
  });

  it('forces needsPayoff on active chains without a payoff beat', () => {
    const chain = makeChain({ status: 'active' });
    expect(deriveChainStatus(chain, [makeBeat({ type: 'plant' })])).toBe('needsPayoff');
    expect(
      deriveChainStatus(chain, [
        makeBeat({ type: 'plant' }),
        makeBeat({ beatId: 'b-2', type: 'payoff', order: 2 }),
      ]),
    ).toBe('active');
  });
});
