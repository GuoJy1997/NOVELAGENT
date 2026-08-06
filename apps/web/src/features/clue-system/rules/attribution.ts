import type { AttributionCompleteness, Clue, ClueAttribution, Foreshadowing } from '../types';

export function emptyAttribution(): ClueAttribution {
  return {
    providerCharacterId: null,
    triggerCharacterId: null,
    receiverCharacterId: null,
    observerCharacterIds: [],
    missedByCharacterIds: [],
    concealerCharacterId: null,
    misleaderCharacterId: null,
    payoffCharacterId: null,
    payoffChapterId: null,
    payoffNodeId: null,
    mechanism: '',
    completeness: 'incomplete',
  };
}

export function isClueCommitted(status: Clue['status']): boolean {
  return (
    status === 'planted' ||
    status === 'active' ||
    status === 'misleading' ||
    status === 'revealed' ||
    status === 'paidOff'
  );
}

export function isForeshadowingOpen(status: Foreshadowing['status']): boolean {
  return status === 'planted' || status === 'developing' || status === 'readyForPayoff';
}

export function computeClueMissingFields(clue: Clue): string[] {
  const missing: string[] = [];
  const { attribution } = clue;

  if (isClueCommitted(clue.status)) {
    if (!attribution.providerCharacterId) missing.push('providerCharacterId');
    if (!attribution.triggerCharacterId) missing.push('triggerCharacterId');
    if (!attribution.receiverCharacterId) missing.push('receiverCharacterId');
  }
  if (clue.status === 'paidOff' && !attribution.payoffChapterId && !attribution.payoffNodeId) {
    missing.push('payoffLocation');
  }
  if (clue.type === 'redHerring' && !attribution.misleaderCharacterId && !attribution.mechanism) {
    missing.push('misleader');
  }
  if (
    clue.readerVisibility === 'hidden' &&
    !attribution.concealerCharacterId &&
    !attribution.mechanism
  ) {
    missing.push('concealer');
  }
  return missing;
}

export function computeForeshadowingMissingFields(foreshadowing: Foreshadowing): string[] {
  const missing: string[] = [];
  const committed = isForeshadowingOpen(foreshadowing.status) || foreshadowing.status === 'paidOff';

  if (committed && !foreshadowing.plantingChapterId && !foreshadowing.plantingNodeId) {
    missing.push('plantingLocation');
  }
  if (isForeshadowingOpen(foreshadowing.status)) {
    if (!foreshadowing.expectedPayoffChapterId && !foreshadowing.expectedPayoffNodeId) {
      missing.push('expectedPayoff');
    }
  }
  return missing;
}

export function computeCompleteness(attribution: ClueAttribution): AttributionCompleteness {
  const missing: AttributionCompleteness[] = [];
  if (!attribution.providerCharacterId) missing.push('missingProvider');
  if (!attribution.triggerCharacterId) missing.push('missingTrigger');
  if (!attribution.receiverCharacterId) missing.push('missingReceiver');
  if (!attribution.payoffChapterId && !attribution.payoffNodeId) missing.push('missingPayoff');

  if (missing.length === 0) return 'complete';
  if (missing.length === 1) return missing[0];
  return 'incomplete';
}
