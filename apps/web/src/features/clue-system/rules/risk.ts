import type {
  Clue,
  ClueBeat,
  ClueChain,
  ClueChainStatus,
  ClueSystemState,
  Foreshadowing,
  RiskLevel,
} from '../types';
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

export interface KnowledgeConflict {
  informationStateId: string;
  characterId: string;
  reason: 'unknownButAttributed' | 'knowsBeforePlant';
}

export function findKnowledgeConflicts(
  state: ClueSystemState,
  novelId: string,
): KnowledgeConflict[] {
  const conflicts: KnowledgeConflict[] = [];

  for (const infoState of state.informationStates) {
    if (infoState.novelId !== novelId || infoState.objectType !== 'clue') continue;
    const clue = state.clues.find((candidate) => candidate.clueId === infoState.objectId);
    if (!clue) continue;

    for (const entry of infoState.characterKnowledge) {
      const attributed =
        clue.attribution.providerCharacterId === entry.characterId ||
        clue.attribution.triggerCharacterId === entry.characterId ||
        clue.attribution.receiverCharacterId === entry.characterId;

      if (entry.knowledgeState === 'unknown' && attributed) {
        conflicts.push({
          informationStateId: infoState.informationStateId,
          characterId: entry.characterId,
          reason: 'unknownButAttributed',
        });
      }
      if (
        (entry.knowledgeState === 'knowsTruth' || entry.knowledgeState === 'conceals') &&
        clue.status === 'draft'
      ) {
        conflicts.push({
          informationStateId: infoState.informationStateId,
          characterId: entry.characterId,
          reason: 'knowsBeforePlant',
        });
      }
    }
  }
  return conflicts;
}

export function deriveChainStatus(chain: ClueChain, beats: ClueBeat[]): ClueChainStatus {
  if (chain.status === 'draft' || chain.status === 'abandoned') return chain.status;

  const chainBeats = beats.filter((beat) => beat.chainId === chain.chainId);
  const hasPlant = chainBeats.some((beat) => beat.type === 'plant');
  const hasPayoff = chainBeats.some((beat) => beat.type === 'payoff');

  if (chain.status === 'complete' && (!hasPlant || !hasPayoff)) return 'inconsistent';
  if (!hasPayoff && (chain.status === 'active' || chain.status === 'needsPayoff')) {
    return 'needsPayoff';
  }
  return chain.status;
}
