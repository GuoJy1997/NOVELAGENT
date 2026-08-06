import type { Clue, ClueBeat, ClueChain, ClueSystemState, Foreshadowing, RiskLevel } from '../types';
import { isForeshadowingOpen } from './attribution';

export interface TimelineConflict {
  chainId: string;
  earlyBeatId: string;
  plantBeatId: string;
}

export function computeClueRisk(clue: Clue): RiskLevel {
  if (clue.status === 'draft' || clue.status === 'paidOff' || clue.status === 'discarded') {
    return 'none';
  }
  if (clue.missingFields.length > 0) return 'high';
  if (clue.credibility === 'false' && clue.status !== 'revealed') return 'medium';
  return 'low';
}

export function computeForeshadowingRisk(foreshadowing: Foreshadowing): RiskLevel {
  if (!isForeshadowingOpen(foreshadowing.status)) return 'none';
  const hasExpectedPayoff = Boolean(
    foreshadowing.expectedPayoffChapterId ?? foreshadowing.expectedPayoffNodeId,
  );
  return hasExpectedPayoff ? 'low' : 'high';
}

export function findUnpaidForeshadowings(
  state: ClueSystemState,
  novelId: string,
): Foreshadowing[] {
  return state.foreshadowings.filter(
    (foreshadowing) =>
      foreshadowing.novelId === novelId &&
      isForeshadowingOpen(foreshadowing.status) &&
      !foreshadowing.actualPayoffChapterId &&
      !foreshadowing.actualPayoffNodeId,
  );
}

export function findTimelineConflicts(chain: ClueChain, beats: ClueBeat[]): TimelineConflict[] {
  if (chain.allowFlashback) return [];
  const chainBeats = beats.filter((beat) => beat.chainId === chain.chainId);
  const plantBeats = chainBeats.filter((beat) => beat.type === 'plant');
  const resolutionBeats = chainBeats.filter(
    (beat) => beat.type === 'payoff' || beat.type === 'reveal',
  );

  const conflicts: TimelineConflict[] = [];
  for (const resolution of resolutionBeats) {
    for (const plant of plantBeats) {
      if (resolution.order < plant.order) {
        conflicts.push({
          chainId: chain.chainId,
          earlyBeatId: resolution.beatId,
          plantBeatId: plant.beatId,
        });
      }
    }
  }
  return conflicts;
}
