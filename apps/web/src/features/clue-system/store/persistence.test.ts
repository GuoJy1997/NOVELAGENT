import { beforeEach, describe, expect, it } from 'vitest';
import type { ClueSystemState } from '../types';
import { EMPTY_CLUE_STATE } from './clueStore';
import {
  CLUE_SCHEMA_VERSION,
  CLUE_STORAGE_KEY,
  loadClueSystem,
  saveClueSystem,
} from './persistence';

function makeState(overrides: Partial<ClueSystemState>): ClueSystemState {
  return { ...EMPTY_CLUE_STATE, ...overrides };
}

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

describe('persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips a state under the versioned key', () => {
    const state = makeState({
      projects: [{ novelId: 'novel-a', title: 'Novel A', createdAt: '2026-08-07T00:00:00.000Z' }],
      activeNovelId: 'novel-a',
    });

    expect(saveClueSystem(state)).toBe(true);
    expect(loadClueSystem()).toEqual(state);
    expect(JSON.parse(window.localStorage.getItem(CLUE_STORAGE_KEY) ?? '{}').schemaVersion).toBe(
      CLUE_SCHEMA_VERSION,
    );
  });

  it('returns null when nothing is stored', () => {
    expect(loadClueSystem()).toBeNull();
  });

  it('returns null for a different schema version', () => {
    window.localStorage.setItem(
      CLUE_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 999, state: EMPTY_CLUE_STATE }),
    );
    expect(loadClueSystem()).toBeNull();
  });

  it('returns null for corrupted JSON', () => {
    window.localStorage.setItem(CLUE_STORAGE_KEY, '{not-json');
    expect(loadClueSystem()).toBeNull();
  });

  it('returns null when the payload shape is wrong', () => {
    window.localStorage.setItem(
      CLUE_STORAGE_KEY,
      JSON.stringify({ schemaVersion: CLUE_SCHEMA_VERSION, state: { clues: 'nope' } }),
    );
    expect(loadClueSystem()).toBeNull();
  });

  it('reports failure instead of throwing when storage is unavailable', () => {
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    try {
      expect(saveClueSystem(EMPTY_CLUE_STATE)).toBe(false);
    } finally {
      window.localStorage.setItem = original;
    }
  });
});
