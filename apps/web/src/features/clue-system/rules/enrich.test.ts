import { describe, expect, it } from 'vitest';
import type { Clue, Foreshadowing } from '../types';
import { emptyAttribution } from './attribution';
import { enrichClue, enrichForeshadowing } from './enrich';

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

describe('enrichClue', () => {
  it('recomputes missingFields, riskLevel and attribution completeness from current data', () => {
    const enriched = enrichClue(
      makeClue({
        missingFields: ['stale'],
        riskLevel: 'none',
        attribution: { ...emptyAttribution(), completeness: 'complete' },
      }),
    );

    expect(enriched.missingFields).toEqual([
      'providerCharacterId',
      'triggerCharacterId',
      'receiverCharacterId',
    ]);
    expect(enriched.riskLevel).toBe('high');
    expect(enriched.attribution.completeness).toBe('incomplete');
  });

  it('computes risk after missing fields so a clean active clue is low risk', () => {
    const enriched = enrichClue(
      makeClue({
        attribution: {
          ...emptyAttribution(),
          providerCharacterId: 'kael',
          triggerCharacterId: 'liora',
          receiverCharacterId: 'vex',
        },
      }),
    );

    expect(enriched.missingFields).toEqual([]);
    expect(enriched.riskLevel).toBe('low');
  });

  it('does not mutate its input', () => {
    const input = makeClue({});
    enrichClue(input);
    expect(input.missingFields).toEqual([]);
    expect(input.attribution.completeness).toBe('incomplete');
  });
});

describe('enrichForeshadowing', () => {
  it('recomputes missingFields and riskLevel', () => {
    const foreshadowing: Foreshadowing = {
      foreshadowingId: 'f-x',
      novelId: 'novel-x',
      title: 'F',
      content: 'C',
      status: 'planted',
      plantingChapterId: 'chapter-1',
      plantingNodeId: null,
      expectedPayoffChapterId: null,
      expectedPayoffNodeId: null,
      actualPayoffChapterId: null,
      actualPayoffNodeId: null,
      visibility: 'hinted',
      subtletyLevel: 2,
      relatedClueIds: [],
      chainId: null,
      sourceInspirationIds: [],
      missingFields: [],
      riskLevel: 'none',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    const enriched = enrichForeshadowing(foreshadowing);
    expect(enriched.missingFields).toEqual(['expectedPayoff']);
    expect(enriched.riskLevel).toBe('high');
  });
});
