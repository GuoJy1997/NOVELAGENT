import type { Clue, Foreshadowing } from '../types';
import {
  computeClueMissingFields,
  computeCompleteness,
  computeForeshadowingMissingFields,
} from './attribution';
import { computeClueRisk, computeForeshadowingRisk } from './risk';

export function enrichClue(clue: Clue): Clue {
  const missingFields = computeClueMissingFields(clue);
  return {
    ...clue,
    missingFields,
    riskLevel: computeClueRisk({ ...clue, missingFields }),
    attribution: {
      ...clue.attribution,
      completeness: computeCompleteness(clue.attribution),
    },
  };
}

export function enrichForeshadowing(foreshadowing: Foreshadowing): Foreshadowing {
  const missingFields = computeForeshadowingMissingFields(foreshadowing);
  return {
    ...foreshadowing,
    missingFields,
    riskLevel: computeForeshadowingRisk(foreshadowing),
  };
}
