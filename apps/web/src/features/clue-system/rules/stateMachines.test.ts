import { describe, expect, it } from 'vitest';
import type { ClueChainStatus, ClueStatus, ForeshadowingStatus } from '../types';
import {
  canTransitionChain,
  canTransitionClue,
  canTransitionForeshadowing,
} from './stateMachines';

const CLUE_STATUSES: ClueStatus[] = [
  'draft', 'planted', 'active', 'misleading', 'revealed', 'paidOff', 'discarded',
];

const FORESHADOWING_STATUSES: ForeshadowingStatus[] = [
  'draft', 'planted', 'developing', 'readyForPayoff', 'paidOff', 'abandoned',
];

const CHAIN_STATUSES: ClueChainStatus[] = [
  'draft', 'active', 'needsPayoff', 'complete', 'inconsistent', 'abandoned',
];

describe('canTransitionClue', () => {
  it('allows the main line draft → planted → active → revealed → paidOff', () => {
    expect(canTransitionClue('draft', 'planted')).toBe(true);
    expect(canTransitionClue('planted', 'active')).toBe(true);
    expect(canTransitionClue('active', 'revealed')).toBe(true);
    expect(canTransitionClue('revealed', 'paidOff')).toBe(true);
  });

  it('allows the mislead branch active → misleading → revealed', () => {
    expect(canTransitionClue('active', 'misleading')).toBe(true);
    expect(canTransitionClue('misleading', 'revealed')).toBe(true);
  });

  it('allows discard only from draft, planted, active, misleading', () => {
    expect(canTransitionClue('draft', 'discarded')).toBe(true);
    expect(canTransitionClue('planted', 'discarded')).toBe(true);
    expect(canTransitionClue('active', 'discarded')).toBe(true);
    expect(canTransitionClue('misleading', 'discarded')).toBe(true);
    expect(canTransitionClue('revealed', 'discarded')).toBe(false);
    expect(canTransitionClue('paidOff', 'discarded')).toBe(false);
  });

  it('rejects skipping, backwards moves, and leaving terminal states', () => {
    expect(canTransitionClue('draft', 'active')).toBe(false);
    expect(canTransitionClue('active', 'planted')).toBe(false);
    expect(canTransitionClue('paidOff', 'revealed')).toBe(false);
    expect(canTransitionClue('discarded', 'draft')).toBe(false);
  });

  it('rejects every self-transition', () => {
    for (const status of CLUE_STATUSES) {
      expect(canTransitionClue(status, status)).toBe(false);
    }
  });
});

describe('canTransitionForeshadowing', () => {
  it('allows draft → planted → developing → readyForPayoff → paidOff', () => {
    expect(canTransitionForeshadowing('draft', 'planted')).toBe(true);
    expect(canTransitionForeshadowing('planted', 'developing')).toBe(true);
    expect(canTransitionForeshadowing('developing', 'readyForPayoff')).toBe(true);
    expect(canTransitionForeshadowing('readyForPayoff', 'paidOff')).toBe(true);
  });

  it('allows abandon from every non-terminal state only', () => {
    expect(canTransitionForeshadowing('draft', 'abandoned')).toBe(true);
    expect(canTransitionForeshadowing('planted', 'abandoned')).toBe(true);
    expect(canTransitionForeshadowing('developing', 'abandoned')).toBe(true);
    expect(canTransitionForeshadowing('readyForPayoff', 'abandoned')).toBe(true);
    expect(canTransitionForeshadowing('paidOff', 'abandoned')).toBe(false);
    expect(canTransitionForeshadowing('abandoned', 'abandoned')).toBe(false);
  });

  it('rejects skipping states', () => {
    expect(canTransitionForeshadowing('draft', 'developing')).toBe(false);
    expect(canTransitionForeshadowing('planted', 'paidOff')).toBe(false);
  });

  it('rejects every self-transition', () => {
    for (const status of FORESHADOWING_STATUSES) {
      expect(canTransitionForeshadowing(status, status)).toBe(false);
    }
  });
});

describe('canTransitionChain', () => {
  it('allows draft → active → needsPayoff → complete', () => {
    expect(canTransitionChain('draft', 'active')).toBe(true);
    expect(canTransitionChain('active', 'needsPayoff')).toBe(true);
    expect(canTransitionChain('needsPayoff', 'complete')).toBe(true);
  });

  it('allows inconsistent from active and needsPayoff, abandon from draft/active/needsPayoff/inconsistent', () => {
    expect(canTransitionChain('active', 'inconsistent')).toBe(true);
    expect(canTransitionChain('needsPayoff', 'inconsistent')).toBe(true);
    expect(canTransitionChain('draft', 'abandoned')).toBe(true);
    expect(canTransitionChain('active', 'abandoned')).toBe(true);
    expect(canTransitionChain('needsPayoff', 'abandoned')).toBe(true);
    expect(canTransitionChain('inconsistent', 'abandoned')).toBe(true);
    expect(canTransitionChain('complete', 'abandoned')).toBe(false);
  });

  it('rejects recovering from inconsistent or completing from active', () => {
    expect(canTransitionChain('inconsistent', 'needsPayoff')).toBe(false);
    expect(canTransitionChain('active', 'complete')).toBe(false);
  });

  it('rejects every self-transition', () => {
    for (const status of CHAIN_STATUSES) {
      expect(canTransitionChain(status, status)).toBe(false);
    }
  });
});
