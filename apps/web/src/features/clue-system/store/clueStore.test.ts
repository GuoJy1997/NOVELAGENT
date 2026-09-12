import { describe, expect, it } from 'vitest';
import type { Clue, ClueBeat, ClueSystemState, Foreshadowing } from '../types';
import { emptyAttribution } from '../rules/attribution';
import { EMPTY_CLUE_STATE, clueReducer } from './clueStore';

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

function makeBeat(overrides: Partial<ClueBeat>): ClueBeat {
  return {
    beatId: 'beat-x',
    novelId: 'novel-x',
    clueId: 'clue-x',
    foreshadowingId: null,
    chainId: null,
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

describe('clueReducer projects', () => {
  it('creates a project and makes it active', () => {
    const state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'createProject',
      novelId: 'novel-a',
      title: 'Novel A',
      createdAt: '2026-08-07T00:00:00.000Z',
    });

    expect(state.projects).toEqual([
      { novelId: 'novel-a', title: 'Novel A', createdAt: '2026-08-07T00:00:00.000Z' },
    ]);
    expect(state.activeNovelId).toBe('novel-a');
  });

  it('switches the active novel only for known projects', () => {
    const withProject = clueReducer(EMPTY_CLUE_STATE, {
      type: 'createProject',
      novelId: 'novel-a',
      title: 'Novel A',
      createdAt: '2026-08-07T00:00:00.000Z',
    });
    expect(
      clueReducer(withProject, { type: 'setActiveNovel', novelId: 'missing' }).activeNovelId,
    ).toBe('novel-a');
  });
});

describe('clueReducer clues', () => {
  it('upserts clues with recomputed derived fields and updatedAt', () => {
    const state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertClue',
      clue: makeClue({ status: 'active', missingFields: ['stale'] }),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });

    expect(state.clues).toHaveLength(1);
    expect(state.clues[0].missingFields).toEqual([
      'providerCharacterId',
      'triggerCharacterId',
      'receiverCharacterId',
    ]);
    expect(state.clues[0].riskLevel).toBe('high');
    expect(state.clues[0].updatedAt).toBe('2026-08-07T09:00:00.000Z');
  });

  it('replaces an existing clue by clueId', () => {
    const withClue = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertClue',
      clue: makeClue({ title: 'Before' }),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });
    const updated = clueReducer(withClue, {
      type: 'upsertClue',
      clue: makeClue({ title: 'After' }),
      updatedAt: '2026-08-07T10:00:00.000Z',
    });

    expect(updated.clues).toHaveLength(1);
    expect(updated.clues[0].title).toBe('After');
  });

  it('deletes an unreferenced clue together with its information states', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertClue',
      clue: makeClue({}),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });
    state = clueReducer(state, {
      type: 'upsertInformationState',
      informationState: {
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
      },
    });
    state = clueReducer(state, { type: 'deleteClue', clueId: 'clue-x' });

    expect(state.clues).toEqual([]);
    expect(state.informationStates).toEqual([]);
  });

  it('refuses to delete a clue referenced by beats', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertClue',
      clue: makeClue({}),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });
    state = clueReducer(state, { type: 'upsertBeat', beat: makeBeat({}) });
    state = clueReducer(state, { type: 'deleteClue', clueId: 'clue-x' });

    expect(state.clues).toHaveLength(1);
  });
});

describe('clueReducer foreshadowings', () => {
  const makeForeshadowing = (overrides: Partial<Foreshadowing>): Foreshadowing => ({
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
    ...overrides,
  });

  it('upserts with recomputed derived fields', () => {
    const state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertForeshadowing',
      foreshadowing: makeForeshadowing({}),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });

    expect(state.foreshadowings[0].missingFields).toEqual(['expectedPayoff']);
    expect(state.foreshadowings[0].riskLevel).toBe('high');
  });

  it('refuses to delete a foreshadowing referenced by beats', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertForeshadowing',
      foreshadowing: makeForeshadowing({}),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });
    state = clueReducer(state, {
      type: 'upsertBeat',
      beat: makeBeat({ clueId: null, foreshadowingId: 'f-x' }),
    });
    state = clueReducer(state, { type: 'deleteForeshadowing', foreshadowingId: 'f-x' });

    expect(state.foreshadowings).toHaveLength(1);
  });
});

describe('clueReducer beats, chains, threads, herrings, reports', () => {
  it('upserts and deletes beats', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, { type: 'upsertBeat', beat: makeBeat({}) });
    expect(state.beats).toHaveLength(1);
    state = clueReducer(state, { type: 'deleteBeat', beatId: 'beat-x' });
    expect(state.beats).toEqual([]);
  });

  it('upserts chains, hidden threads, red herrings and appends reports', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertChain',
      chain: {
        chainId: 'chain-x', novelId: 'novel-x', title: 'Chain', type: 'clue',
        status: 'active', arcIds: [], chapterIds: [], clueIds: [], foreshadowingIds: [],
        allowFlashback: false, ownerSubagentId: null, riskLevel: 'none', missingFields: [],
        createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
      },
      updatedAt: '2026-08-07T09:00:00.000Z',
    });
    state = clueReducer(state, {
      type: 'upsertHiddenThread',
      hiddenThread: {
        hiddenThreadId: 'thread-x', novelId: 'novel-x', title: 'Thread',
        secretTruth: 'Truth', visibleToReader: false, visibleToCharacterIds: ['arden'],
        relatedChainIds: [], plannedRevealChapterId: null, status: 'active',
      },
    });
    state = clueReducer(state, {
      type: 'upsertRedHerring',
      redHerring: {
        redHerringId: 'herring-x', novelId: 'novel-x', title: 'Herring',
        falseConclusion: 'False', truthBehindIt: 'True', misleaderCharacterId: 'arden',
        targetCharacterIds: ['kael'], misleadsReader: true, clarificationChapterId: null,
        relatedClueIds: [], status: 'active',
      },
    });
    state = clueReducer(state, {
      type: 'addReport',
      report: {
        reportId: 'report-x', novelId: 'novel-x', scopeType: 'novel', scopeId: null,
        findings: [], modelId: 'stub', createdAt: '2026-08-07T09:00:00.000Z',
      },
    });

    expect(state.chains[0].updatedAt).toBe('2026-08-07T09:00:00.000Z');
    expect(state.hiddenThreads).toHaveLength(1);
    expect(state.redHerrings).toHaveLength(1);
    expect(state.reports).toHaveLength(1);
  });

  it('replaces chains, threads, herrings and beats by id', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertHiddenThread',
      hiddenThread: {
        hiddenThreadId: 'thread-x', novelId: 'novel-x', title: 'Before',
        secretTruth: 'Truth', visibleToReader: false, visibleToCharacterIds: [],
        relatedChainIds: [], plannedRevealChapterId: null, status: 'draft',
      },
    });
    state = clueReducer(state, {
      type: 'upsertHiddenThread',
      hiddenThread: {
        hiddenThreadId: 'thread-x', novelId: 'novel-x', title: 'After',
        secretTruth: 'Truth', visibleToReader: false, visibleToCharacterIds: [],
        relatedChainIds: [], plannedRevealChapterId: null, status: 'active',
      },
    });

    expect(state.hiddenThreads).toHaveLength(1);
    expect(state.hiddenThreads[0].title).toBe('After');
  });
});

describe('EMPTY_CLUE_STATE', () => {
  it('is a valid empty state with no active novel', () => {
    const state: ClueSystemState = EMPTY_CLUE_STATE;
    expect(state.projects).toEqual([]);
    expect(state.activeNovelId).toBe('');
    expect(state.clues).toEqual([]);
  });
});
