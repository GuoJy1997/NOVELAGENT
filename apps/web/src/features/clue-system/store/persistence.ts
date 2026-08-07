import type { ClueSystemState } from '../types';

export const CLUE_STORAGE_KEY = 'novelora.clueSystem.v1';
export const CLUE_SCHEMA_VERSION = 1;

interface PersistedClueSystem {
  schemaVersion: number;
  state: ClueSystemState;
}

const STATE_ARRAY_KEYS = [
  'projects',
  'clues',
  'foreshadowings',
  'chains',
  'hiddenThreads',
  'redHerrings',
  'beats',
  'informationStates',
  'reports',
] as const;

function isClueSystemState(value: unknown): value is ClueSystemState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    STATE_ARRAY_KEYS.every((key) => Array.isArray(candidate[key])) &&
    typeof candidate.activeNovelId === 'string'
  );
}

export function saveClueSystem(state: ClueSystemState): boolean {
  try {
    const payload: PersistedClueSystem = { schemaVersion: CLUE_SCHEMA_VERSION, state };
    window.localStorage.setItem(CLUE_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadClueSystem(): ClueSystemState | null {
  try {
    const raw = window.localStorage.getItem(CLUE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedClueSystem>;
    if (parsed.schemaVersion !== CLUE_SCHEMA_VERSION) return null;
    if (!isClueSystemState(parsed.state)) return null;
    return parsed.state;
  } catch {
    return null;
  }
}
