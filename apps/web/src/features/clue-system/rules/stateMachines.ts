import type { ClueChainStatus, ClueStatus, ForeshadowingStatus } from '../types';

const CLUE_TRANSITIONS: Record<ClueStatus, ClueStatus[]> = {
  draft: ['planted', 'discarded'],
  planted: ['active', 'discarded'],
  active: ['misleading', 'revealed', 'discarded'],
  misleading: ['revealed', 'discarded'],
  revealed: ['paidOff'],
  paidOff: [],
  discarded: [],
};

const FORESHADOWING_TRANSITIONS: Record<ForeshadowingStatus, ForeshadowingStatus[]> = {
  draft: ['planted', 'abandoned'],
  planted: ['developing', 'abandoned'],
  developing: ['readyForPayoff', 'abandoned'],
  readyForPayoff: ['paidOff', 'abandoned'],
  paidOff: [],
  abandoned: [],
};

const CHAIN_TRANSITIONS: Record<ClueChainStatus, ClueChainStatus[]> = {
  draft: ['active', 'abandoned'],
  active: ['needsPayoff', 'inconsistent', 'abandoned'],
  needsPayoff: ['complete', 'inconsistent', 'abandoned'],
  complete: [],
  inconsistent: ['abandoned'],
  abandoned: [],
};

export function canTransitionClue(from: ClueStatus, to: ClueStatus): boolean {
  return CLUE_TRANSITIONS[from].includes(to);
}

export function canTransitionForeshadowing(
  from: ForeshadowingStatus,
  to: ForeshadowingStatus,
): boolean {
  return FORESHADOWING_TRANSITIONS[from].includes(to);
}

export function canTransitionChain(from: ClueChainStatus, to: ClueChainStatus): boolean {
  return CHAIN_TRANSITIONS[from].includes(to);
}
