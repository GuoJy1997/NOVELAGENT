import { beforeEach, describe, expect, it } from 'vitest';
import { noveloraMockProject } from '../../novelora-cockpit/data/noveloraMockProject';
import { enrichClue, enrichForeshadowing } from '../rules/enrich';
import { findTimelineConflicts, findUnpaidForeshadowings } from '../rules/risk';
import { CLUE_STORAGE_KEY } from './persistence';
import { buildSeedState, initialClueState } from './seedProject';

function createMemoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear() {
      items.clear();
    },
    getItem(key: string): string | null {
      const value = items.get(key);
      return value === undefined ? null : value;
    },
    key(index: number): string | null {
      return [...items.keys()][index] ?? null;
    },
    removeItem(key: string): void {
      items.delete(key);
    },
    setItem(key: string, value: string): void {
      items.set(key, String(value));
    },
  } as Storage;
}

Object.defineProperty(window, 'localStorage', {
  value: createMemoryStorage(),
  configurable: true,
  writable: true,
});

describe('buildSeedState', () => {
  it('seeds the fixture novel as the single active project', () => {
    const state = buildSeedState();
    expect(state.projects).toEqual([
      {
        novelId: noveloraMockProject.novelId,
        title: noveloraMockProject.title,
        createdAt: '2026-08-01T00:00:00.000Z',
      },
    ]);
    expect(state.activeNovelId).toBe(noveloraMockProject.novelId);
  });

  it('keeps every object inside the seeded novel', () => {
    const state = buildSeedState();
    const novelId = noveloraMockProject.novelId;
    expect(state.clues.every((clue) => clue.novelId === novelId)).toBe(true);
    expect(state.foreshadowings.every((f) => f.novelId === novelId)).toBe(true);
    expect(state.chains.every((chain) => chain.novelId === novelId)).toBe(true);
    expect(state.hiddenThreads.every((thread) => thread.novelId === novelId)).toBe(true);
    expect(state.redHerrings.every((herring) => herring.novelId === novelId)).toBe(true);
    expect(state.beats.every((beat) => beat.novelId === novelId)).toBe(true);
    expect(state.informationStates.every((info) => info.novelId === novelId)).toBe(true);
  });

  it('only references character ids that exist in the fixture', () => {
    const state = buildSeedState();
    const knownCharacterIds = new Set(noveloraMockProject.characters.map((c) => c.id));
    const referenced = new Set<string>();

    for (const clue of state.clues) {
      const attribution = clue.attribution;
      for (const id of [
        attribution.providerCharacterId,
        attribution.triggerCharacterId,
        attribution.receiverCharacterId,
        attribution.concealerCharacterId,
        attribution.misleaderCharacterId,
        attribution.payoffCharacterId,
        ...attribution.observerCharacterIds,
        ...attribution.missedByCharacterIds,
      ]) {
        if (id) referenced.add(id);
      }
      clue.relatedCharacterIds.forEach((id) => referenced.add(id));
    }
    for (const info of state.informationStates) {
      info.characterKnowledge.forEach((entry) => referenced.add(entry.characterId));
    }
    state.hiddenThreads.forEach((thread) =>
      thread.visibleToCharacterIds.forEach((id) => referenced.add(id)),
    );
    state.redHerrings.forEach((herring) => {
      if (herring.misleaderCharacterId) referenced.add(herring.misleaderCharacterId);
      herring.targetCharacterIds.forEach((id) => referenced.add(id));
    });

    for (const id of referenced) {
      expect(knownCharacterIds.has(id), `unknown character id ${id}`).toBe(true);
    }
  });

  it('only references chapter ids that exist in the fixture', () => {
    const state = buildSeedState();
    const knownChapterIds = new Set(noveloraMockProject.chapters.map((c) => c.id));
    const referenced: string[] = [];

    for (const clue of state.clues) {
      if (clue.firstAppearanceChapterId) referenced.push(clue.firstAppearanceChapterId);
      if (clue.attribution.payoffChapterId) referenced.push(clue.attribution.payoffChapterId);
    }
    for (const f of state.foreshadowings) {
      for (const id of [
        f.plantingChapterId,
        f.expectedPayoffChapterId,
        f.actualPayoffChapterId,
      ]) {
        if (id) referenced.push(id);
      }
    }
    state.beats.forEach((beat) => {
      if (beat.chapterId) referenced.push(beat.chapterId);
    });
    state.chains.forEach((chain) => referenced.push(...chain.chapterIds));
    state.informationStates.forEach((info) => {
      if (info.chapterId) referenced.push(info.chapterId);
    });

    for (const id of referenced) {
      expect(knownChapterIds.has(id), `unknown chapter id ${id}`).toBe(true);
    }
  });

  it('stores derived fields that match the rules engine output', () => {
    const state = buildSeedState();
    for (const clue of state.clues) {
      expect(clue).toEqual(enrichClue(clue));
    }
    for (const foreshadowing of state.foreshadowings) {
      expect(foreshadowing).toEqual(enrichForeshadowing(foreshadowing));
    }
  });

  it('demonstrates an unpaid high-risk foreshadowing and no timeline conflicts', () => {
    const state = buildSeedState();
    const unpaid = findUnpaidForeshadowings(state, noveloraMockProject.novelId);
    expect(unpaid.map((f) => f.foreshadowingId)).toContain('foreshadowing-forge-threshold');
    const forge = state.foreshadowings.find(
      (f) => f.foreshadowingId === 'foreshadowing-forge-threshold',
    );
    expect(forge?.riskLevel).toBe('high');

    for (const chain of state.chains) {
      expect(findTimelineConflicts(chain, state.beats)).toEqual([]);
    }
  });

  it('links every beat to an existing chain, clue or foreshadowing', () => {
    const state = buildSeedState();
    const chainIds = new Set(state.chains.map((c) => c.chainId));
    const clueIds = new Set(state.clues.map((c) => c.clueId));
    const foreshadowingIds = new Set(state.foreshadowings.map((f) => f.foreshadowingId));

    for (const beat of state.beats) {
      if (beat.chainId) expect(chainIds.has(beat.chainId)).toBe(true);
      if (beat.clueId) expect(clueIds.has(beat.clueId)).toBe(true);
      if (beat.foreshadowingId) expect(foreshadowingIds.has(beat.foreshadowingId)).toBe(true);
    }
  });
});

describe('initialClueState', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('falls back to the seed when storage is empty', () => {
    expect(initialClueState()).toEqual(buildSeedState());
  });

  it('prefers a valid persisted state', () => {
    const persisted = buildSeedState();
    window.localStorage.setItem(
      CLUE_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, state: { ...persisted, activeNovelId: 'other' } }),
    );
    expect(initialClueState().activeNovelId).toBe('other');
  });
});
