import { describe, expect, it } from 'vitest';
import type {
  Clue,
  ClueAttribution,
  ClueBeat,
  ClueChain,
  ClueChainStatus,
  ClueStatus,
  Foreshadowing,
  ForeshadowingStatus,
} from '../types';
import {
  canTransitionChain,
  canTransitionClue,
  canTransitionForeshadowing,
  checkChainTransition,
  checkClueTransition,
  checkForeshadowingTransition,
} from './stateMachines';
import { emptyAttribution } from './attribution';

const CLUE_STATUSES: ClueStatus[] = [
  'draft', 'planted', 'active', 'misleading', 'revealed', 'paidOff', 'discarded',
];

const FORESHADOWING_STATUSES: ForeshadowingStatus[] = [
  'draft', 'planted', 'developing', 'readyForPayoff', 'paidOff', 'abandoned',
];

const CHAIN_STATUSES: ClueChainStatus[] = [
  'draft', 'active', 'needsPayoff', 'complete', 'inconsistent', 'abandoned',
];

describe('canTransitionClue', () => {
  it('allows the main line draft → planted → active → revealed → paidOff', () => {
    expect(canTransitionClue('draft', 'planted')).toBe(true);
    expect(canTransitionClue('planted', 'active')).toBe(true);
    expect(canTransitionClue('active', 'revealed')).toBe(true);
    expect(canTransitionClue('revealed', 'paidOff')).toBe(true);
  });

  it('allows the mislead branch active → misleading → revealed', () => {
    expect(canTransitionClue('active', 'misleading')).toBe(true);
    expect(canTransitionClue('misleading', 'revealed')).toBe(true);
  });

  it('allows discard only from draft, planted, active, misleading', () => {
    expect(canTransitionClue('draft', 'discarded')).toBe(true);
    expect(canTransitionClue('planted', 'discarded')).toBe(true);
    expect(canTransitionClue('active', 'discarded')).toBe(true);
    expect(canTransitionClue('misleading', 'discarded')).toBe(true);
    expect(canTransitionClue('revealed', 'discarded')).toBe(false);
    expect(canTransitionClue('paidOff', 'discarded')).toBe(false);
  });

  it('rejects skipping, backwards moves, and leaving terminal states', () => {
    expect(canTransitionClue('draft', 'active')).toBe(false);
    expect(canTransitionClue('active', 'planted')).toBe(false);
    expect(canTransitionClue('paidOff', 'revealed')).toBe(false);
    expect(canTransitionClue('discarded', 'draft')).toBe(false);
  });

  it('rejects every self-transition', () => {
    for (const status of CLUE_STATUSES) {
      expect(canTransitionClue(status, status)).toBe(false);
    }
  });
});

describe('canTransitionForeshadowing', () => {
  it('allows draft → planted → developing → readyForPayoff → paidOff', () => {
    expect(canTransitionForeshadowing('draft', 'planted')).toBe(true);
    expect(canTransitionForeshadowing('planted', 'developing')).toBe(true);
    expect(canTransitionForeshadowing('developing', 'readyForPayoff')).toBe(true);
    expect(canTransitionForeshadowing('readyForPayoff', 'paidOff')).toBe(true);
  });

  it('allows abandon from every non-terminal state only', () => {
    expect(canTransitionForeshadowing('draft', 'abandoned')).toBe(true);
    expect(canTransitionForeshadowing('planted', 'abandoned')).toBe(true);
    expect(canTransitionForeshadowing('developing', 'abandoned')).toBe(true);
    expect(canTransitionForeshadowing('readyForPayoff', 'abandoned')).toBe(true);
    expect(canTransitionForeshadowing('paidOff', 'abandoned')).toBe(false);
    expect(canTransitionForeshadowing('abandoned', 'abandoned')).toBe(false);
  });

  it('rejects skipping states', () => {
    expect(canTransitionForeshadowing('draft', 'developing')).toBe(false);
    expect(canTransitionForeshadowing('planted', 'paidOff')).toBe(false);
  });

  it('rejects every self-transition', () => {
    for (const status of FORESHADOWING_STATUSES) {
      expect(canTransitionForeshadowing(status, status)).toBe(false);
    }
  });
});

describe('canTransitionChain', () => {
  it('allows draft → active → needsPayoff → complete', () => {
    expect(canTransitionChain('draft', 'active')).toBe(true);
    expect(canTransitionChain('active', 'needsPayoff')).toBe(true);
    expect(canTransitionChain('needsPayoff', 'complete')).toBe(true);
  });

  it('allows inconsistent from active and needsPayoff, abandon from draft/active/needsPayoff/inconsistent', () => {
    expect(canTransitionChain('active', 'inconsistent')).toBe(true);
    expect(canTransitionChain('needsPayoff', 'inconsistent')).toBe(true);
    expect(canTransitionChain('draft', 'abandoned')).toBe(true);
    expect(canTransitionChain('active', 'abandoned')).toBe(true);
    expect(canTransitionChain('needsPayoff', 'abandoned')).toBe(true);
    expect(canTransitionChain('inconsistent', 'abandoned')).toBe(true);
    expect(canTransitionChain('complete', 'abandoned')).toBe(false);
  });

  it('rejects recovering from inconsistent or completing from active', () => {
    expect(canTransitionChain('inconsistent', 'needsPayoff')).toBe(false);
    expect(canTransitionChain('active', 'complete')).toBe(false);
  });

  it('rejects every self-transition', () => {
    for (const status of CHAIN_STATUSES) {
      expect(canTransitionChain(status, status)).toBe(false);
    }
  });
});

function makeAttribution(overrides: Partial<ClueAttribution>): ClueAttribution {
  return { ...emptyAttribution(), ...overrides };
}

function makeClueForTransition(overrides: {
  status: ClueStatus;
  attribution?: ClueAttribution;
}): Clue {
  return {
    clueId: 'clue-x',
    novelId: 'novel-x',
    title: 'Clue',
    content: 'Content',
    type: 'evidence',
    status: overrides.status,
    credibility: 'unknown',
    readerVisibility: 'visible',
    firstAppearanceChapterId: null,
    firstAppearanceNodeId: null,
    currentChainId: null,
    attribution: overrides.attribution ?? makeAttribution({}),
    relatedCharacterIds: [],
    relatedWorldItemIds: [],
    relatedForeshadowingIds: [],
    sourceInspirationIds: [],
    sourceEventNodeIds: [],
    missingFields: [],
    riskLevel: 'none',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };
}

const FULL_ATTRIBUTION = makeAttribution({
  providerCharacterId: 'kael',
  triggerCharacterId: 'liora',
  receiverCharacterId: 'vex',
  payoffChapterId: 'chapter-6',
});

describe('checkClueTransition', () => {
  it('rejects transitions the state machine forbids', () => {
    const result = checkClueTransition(makeClueForTransition({ status: 'draft' }), 'active');
    expect(result).toEqual({ allowed: false, reason: 'invalidTransition' });
  });

  it('blocks planting a clue without provider, trigger and receiver', () => {
    const result = checkClueTransition(makeClueForTransition({ status: 'draft' }), 'planted');
    expect(result).toEqual({ allowed: false, reason: 'missingAttribution' });
  });

  it('allows planting a fully attributed clue', () => {
    const clue = makeClueForTransition({ status: 'draft', attribution: FULL_ATTRIBUTION });
    expect(checkClueTransition(clue, 'planted')).toEqual({ allowed: true, reason: null });
  });

  it('blocks paidOff without a payoff location even with full roles', () => {
    const clue = makeClueForTransition({
      status: 'revealed',
      attribution: makeAttribution({
        providerCharacterId: 'kael',
        triggerCharacterId: 'liora',
        receiverCharacterId: 'vex',
      }),
    });
    expect(checkClueTransition(clue, 'paidOff')).toEqual({
      allowed: false,
      reason: 'missingPayoffLocation',
    });
  });

  it('allows discard without attribution', () => {
    const clue = makeClueForTransition({ status: 'active' });
    expect(checkClueTransition(clue, 'discarded')).toEqual({ allowed: true, reason: null });
  });
});

function makeForeshadowingForTransition(overrides: Partial<Foreshadowing>): Foreshadowing {
  return {
    foreshadowingId: 'foreshadowing-x',
    novelId: 'novel-x',
    title: 'Foreshadowing',
    content: 'Content',
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
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('checkForeshadowingTransition', () => {
  it('blocks planting without a planting location', () => {
    const result = checkForeshadowingTransition(
      makeForeshadowingForTransition({}),
      'planted',
    );
    expect(result).toEqual({ allowed: false, reason: 'missingPlantLocation' });
  });

  it('allows planting with a planting chapter', () => {
    const result = checkForeshadowingTransition(
      makeForeshadowingForTransition({ plantingChapterId: 'chapter-2' }),
      'planted',
    );
    expect(result).toEqual({ allowed: true, reason: null });
  });

  it('blocks paidOff without an actual payoff location', () => {
    const result = checkForeshadowingTransition(
      makeForeshadowingForTransition({ status: 'readyForPayoff', plantingChapterId: 'chapter-2' }),
      'paidOff',
    );
    expect(result).toEqual({ allowed: false, reason: 'missingPayoffLocation' });
  });

  it('allows abandon without locations', () => {
    const result = checkForeshadowingTransition(makeForeshadowingForTransition({}), 'abandoned');
    expect(result).toEqual({ allowed: true, reason: null });
  });
});

function makeChain(overrides: Partial<ClueChain>): ClueChain {
  return {
    chainId: 'chain-x',
    novelId: 'novel-x',
    title: 'Chain',
    type: 'clue',
    status: 'draft',
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

describe('checkChainTransition', () => {
  it('blocks completing a chain without a plant beat', () => {
    const chain = makeChain({ status: 'needsPayoff' });
    const beats = [makeBeat({ type: 'payoff' })];
    expect(checkChainTransition(chain, beats, 'complete')).toEqual({
      allowed: false,
      reason: 'missingPlantBeat',
    });
  });

  it('blocks completing a chain without a payoff beat', () => {
    const chain = makeChain({ status: 'needsPayoff' });
    const beats = [makeBeat({ type: 'plant' })];
    expect(checkChainTransition(chain, beats, 'complete')).toEqual({
      allowed: false,
      reason: 'missingPayoffBeat',
    });
  });

  it('ignores beats from other chains', () => {
    const chain = makeChain({ status: 'needsPayoff' });
    const beats = [
      makeBeat({ type: 'plant', chainId: 'other-chain' }),
      makeBeat({ type: 'payoff', chainId: 'other-chain' }),
    ];
    expect(checkChainTransition(chain, beats, 'complete')).toEqual({
      allowed: false,
      reason: 'missingPlantBeat',
    });
  });

  it('allows completing a chain with both beat kinds', () => {
    const chain = makeChain({ status: 'needsPayoff' });
    const beats = [makeBeat({ type: 'plant' }), makeBeat({ type: 'payoff', order: 2 })];
    expect(checkChainTransition(chain, beats, 'complete')).toEqual({
      allowed: true,
      reason: null,
    });
  });
});
