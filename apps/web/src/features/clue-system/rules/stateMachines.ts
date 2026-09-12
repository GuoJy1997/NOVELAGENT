import type {
  Clue,
  ClueBeat,
  ClueChain,
  ClueChainStatus,
  ClueStatus,
  Foreshadowing,
  ForeshadowingStatus,
} from '../types';

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

export type TransitionDenialReason =
  | 'invalidTransition'
  | 'missingAttribution'
  | 'missingPayoffLocation'
  | 'missingPlantLocation'
  | 'missingPlantBeat'
  | 'missingPayoffBeat';

export interface TransitionResult {
  allowed: boolean;
  reason: TransitionDenialReason | null;
}

function allow(): TransitionResult {
  return { allowed: true, reason: null };
}

function deny(reason: TransitionDenialReason): TransitionResult {
  return { allowed: false, reason };
}

export function checkClueTransition(clue: Clue, to: ClueStatus): TransitionResult {
  if (!canTransitionClue(clue.status, to)) return deny('invalidTransition');
  if (to !== 'discarded') {
    const { providerCharacterId, triggerCharacterId, receiverCharacterId } = clue.attribution;
    if (!providerCharacterId || !triggerCharacterId || !receiverCharacterId) {
      return deny('missingAttribution');
    }
  }
  if (to === 'paidOff' && !clue.attribution.payoffChapterId && !clue.attribution.payoffNodeId) {
    return deny('missingPayoffLocation');
  }
  return allow();
}

export function checkForeshadowingTransition(
  foreshadowing: Foreshadowing,
  to: ForeshadowingStatus,
): TransitionResult {
  if (!canTransitionForeshadowing(foreshadowing.status, to)) return deny('invalidTransition');
  if (to !== 'abandoned' && !foreshadowing.plantingChapterId && !foreshadowing.plantingNodeId) {
    return deny('missingPlantLocation');
  }
  if (to === 'paidOff' && !foreshadowing.actualPayoffChapterId && !foreshadowing.actualPayoffNodeId) {
    return deny('missingPayoffLocation');
  }
  return allow();
}

export function checkChainTransition(
  chain: ClueChain,
  beats: ClueBeat[],
  to: ClueChainStatus,
): TransitionResult {
  if (!canTransitionChain(chain.status, to)) return deny('invalidTransition');
  if (to === 'complete') {
    const chainBeats = beats.filter((beat) => beat.chainId === chain.chainId);
    if (!chainBeats.some((beat) => beat.type === 'plant')) return deny('missingPlantBeat');
    if (!chainBeats.some((beat) => beat.type === 'payoff')) return deny('missingPayoffBeat');
  }
  return allow();
}
