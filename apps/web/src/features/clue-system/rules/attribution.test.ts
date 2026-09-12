import { describe, expect, it } from 'vitest';
import type { Clue, Foreshadowing } from '../types';
import {
  computeClueMissingFields,
  computeCompleteness,
  computeForeshadowingMissingFields,
  emptyAttribution,
} from './attribution';

function makeClue(overrides: Partial<Clue>): Clue {
  return {
    clueId: 'clue-x',
    novelId: 'novel-x',
    title: 'Clue',
    content: 'Content',
    type: 'evidence',
    status: 'draft',
    credibility: 'unknown',
    readerVisibility: 'visible',
    firstAppearanceChapterId: null,
    firstAppearanceNodeId: null,
    currentChainId: null,
    attribution: emptyAttribution(),
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

describe('computeClueMissingFields', () => {
  it('reports nothing for a draft clue with no attribution', () => {
    expect(computeClueMissingFields(makeClue({}))).toEqual([]);
  });

  it('requires provider, trigger, receiver once the clue is planted or beyond', () => {
    const clue = makeClue({ status: 'planted' });
    expect(computeClueMissingFields(clue)).toEqual([
      'providerCharacterId',
      'triggerCharacterId',
      'receiverCharacterId',
    ]);
  });

  it('accepts a fully attributed planted clue', () => {
    const clue = makeClue({
      status: 'active',
      attribution: {
        ...emptyAttribution(),
        providerCharacterId: 'kael',
        triggerCharacterId: 'liora',
        receiverCharacterId: 'vex',
      },
    });
    expect(computeClueMissingFields(clue)).toEqual([]);
  });

  it('requires a payoff location for paidOff clues', () => {
    const clue = makeClue({
      status: 'paidOff',
      attribution: {
        ...emptyAttribution(),
        providerCharacterId: 'kael',
        triggerCharacterId: 'liora',
        receiverCharacterId: 'vex',
      },
    });
    expect(computeClueMissingFields(clue)).toEqual(['payoffLocation']);
    const resolved = makeClue({
      ...clue,
      attribution: { ...clue.attribution, payoffChapterId: 'chapter-6' },
    });
    expect(computeClueMissingFields(resolved)).toEqual([]);
  });

  it('requires a misleader or mechanism for red herring clues', () => {
    const clue = makeClue({ type: 'redHerring' });
    expect(computeClueMissingFields(clue)).toEqual(['misleader']);
    expect(
      computeClueMissingFields(
        makeClue({ type: 'redHerring', attribution: { ...emptyAttribution(), mechanism: 'staged diary' } }),
      ),
    ).toEqual([]);
  });

  it('requires a concealer or mechanism for hidden clues', () => {
    const clue = makeClue({ readerVisibility: 'hidden' });
    expect(computeClueMissingFields(clue)).toEqual(['concealer']);
    expect(
      computeClueMissingFields(
        makeClue({
          readerVisibility: 'hidden',
          attribution: { ...emptyAttribution(), concealerCharacterId: 'arden' },
        }),
      ),
    ).toEqual([]);
  });
});

describe('computeForeshadowingMissingFields', () => {
  it('reports nothing for drafts', () => {
    expect(computeForeshadowingMissingFields(makeForeshadowing({}))).toEqual([]);
  });

  it('requires a planting location once planted', () => {
    expect(
      computeForeshadowingMissingFields(makeForeshadowing({ status: 'planted' })),
    ).toEqual(['plantingLocation', 'expectedPayoff']);
    expect(
      computeForeshadowingMissingFields(
        makeForeshadowing({ status: 'planted', plantingChapterId: 'chapter-2' }),
      ),
    ).toEqual(['expectedPayoff']);
  });

  it('requires an expected payoff while open but not after payoff or abandon', () => {
    expect(
      computeForeshadowingMissingFields(
        makeForeshadowing({ status: 'readyForPayoff', plantingChapterId: 'chapter-2' }),
      ),
    ).toEqual(['expectedPayoff']);
    expect(
      computeForeshadowingMissingFields(
        makeForeshadowing({
          status: 'paidOff',
          plantingChapterId: 'chapter-2',
          actualPayoffChapterId: 'chapter-6',
        }),
      ),
    ).toEqual([]);
    expect(
      computeForeshadowingMissingFields(makeForeshadowing({ status: 'abandoned' })),
    ).toEqual([]);
  });
});

describe('computeCompleteness', () => {
  it('is complete when provider, trigger, receiver and a payoff location exist', () => {
    expect(
      computeCompleteness({
        ...emptyAttribution(),
        providerCharacterId: 'kael',
        triggerCharacterId: 'liora',
        receiverCharacterId: 'vex',
        payoffChapterId: 'chapter-6',
      }),
    ).toBe('complete');
  });

  it('names a single missing role', () => {
    expect(
      computeCompleteness({
        ...emptyAttribution(),
        triggerCharacterId: 'liora',
        receiverCharacterId: 'vex',
        payoffNodeId: 'node-1',
      }),
    ).toBe('missingProvider');
    expect(
      computeCompleteness({
        ...emptyAttribution(),
        providerCharacterId: 'kael',
        receiverCharacterId: 'vex',
        payoffChapterId: 'chapter-6',
      }),
    ).toBe('missingTrigger');
    expect(
      computeCompleteness({
        ...emptyAttribution(),
        providerCharacterId: 'kael',
        triggerCharacterId: 'liora',
        payoffChapterId: 'chapter-6',
      }),
    ).toBe('missingReceiver');
    expect(
      computeCompleteness({
        ...emptyAttribution(),
        providerCharacterId: 'kael',
        triggerCharacterId: 'liora',
        receiverCharacterId: 'vex',
      }),
    ).toBe('missingPayoff');
  });

  it('falls back to incomplete when several roles are missing', () => {
    expect(computeCompleteness(emptyAttribution())).toBe('incomplete');
  });
});
