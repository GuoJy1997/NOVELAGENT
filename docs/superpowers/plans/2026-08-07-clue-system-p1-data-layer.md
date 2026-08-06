# Clue System P1: Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete domain layer for the clue/foreshadowing system: types, rules engine (state machines, attribution, risk), reducer store, localStorage persistence, and seed project — no UI.

**Architecture:** New feature module `apps/web/src/features/clue-system/` with dependency direction store → rules → types. Everything is pure functions + a reducer, fully unit-tested; React integration (Provider/hooks) is deferred to P2. Derived fields (`missingFields`, `riskLevel`, `completeness`) are always recomputed by the rules engine on write — never trusted from input.

**Tech Stack:** TypeScript ~6.0 (strict), React 19 types only, Vitest 4 + jsdom, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-07-clue-system-mvp-design.md` (§2–§4, §3.3–§3.4) and `docs/superpowers/specs/05-clue-foreshadowing-spec.md` (§9, §10, §16, §17).

## Global Constraints

- TypeScript strict: `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (type-only imports MUST use `import type`), `erasableSyntaxOnly` (NO `enum` — use string literal unions), `noEmit`.
- Tests colocated: every `x.ts` gets `x.test.ts` in the same directory.
- Tests explicitly `import { describe, expect, it } from 'vitest'` (project convention despite `globals: true`).
- No comments in code unless a test assertion needs explaining.
- Identifiers and string copy in English.
- Beats and information states are stored NORMALIZED (flat arrays on the store state, referenced by `clueId`/`foreshadowingId`/`chainId`), not embedded in `Clue.beats` — this deviates from spec §9.1 field embedding by design; the spec fields are derivable.
- IDs in seed data are deterministic literals; `crypto.randomUUID()` is only for runtime-created objects (P2).
- Run tests from repo root: `npm run test:web` (runs Vitest in `apps/web`, required for cwd-based tests). Focused run: `npm run test:web -- <path>`.
- Lint: `npm run lint:web`. Build/typecheck: `npm run build:web`.
- Commit after each task; stage only files listed in the task.

---

### Task 1: Domain types + status transition maps

**Files:**
- Create: `apps/web/src/features/clue-system/types.ts`
- Create: `apps/web/src/features/clue-system/rules/stateMachines.ts`
- Test: `apps/web/src/features/clue-system/rules/stateMachines.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: ALL domain types used by later tasks (`Clue`, `Foreshadowing`, `ClueChain`, `ClueBeat`, `ClueAttribution`, `HiddenThread`, `RedHerring`, `InformationState`, `CharacterKnowledge`, `ClueReviewReport`, `ClueFinding`, `NovelProjectMeta`, `ClueSystemState`, all union types) plus `canTransitionClue(from, to): boolean`, `canTransitionForeshadowing(from, to): boolean`, `canTransitionChain(from, to): boolean`.

- [ ] **Step 1: Write `types.ts`**

```ts
export type ClueType =
  | 'evidence'
  | 'testimony'
  | 'object'
  | 'behavior'
  | 'memory'
  | 'worldRule'
  | 'relationship'
  | 'location'
  | 'symbol'
  | 'redHerring';

export type ClueStatus =
  | 'draft'
  | 'planted'
  | 'active'
  | 'misleading'
  | 'revealed'
  | 'paidOff'
  | 'discarded';

export type Credibility = 'true' | 'partial' | 'false' | 'unknown';

export type ReaderVisibility = 'hidden' | 'hinted' | 'visible' | 'misleading';

export type RiskLevel = 'none' | 'low' | 'medium' | 'high';

export type AttributionCompleteness =
  | 'complete'
  | 'missingProvider'
  | 'missingTrigger'
  | 'missingReceiver'
  | 'missingPayoff'
  | 'incomplete';

export type ForeshadowingStatus =
  | 'draft'
  | 'planted'
  | 'developing'
  | 'readyForPayoff'
  | 'paidOff'
  | 'abandoned';

export type ClueBeatType =
  | 'plant'
  | 'advance'
  | 'mislead'
  | 'reveal'
  | 'payoff'
  | 'recontextualize'
  | 'discard';

export type ChainType = 'clue' | 'foreshadowing' | 'hiddenThread' | 'redHerring';

export type ClueChainStatus =
  | 'draft'
  | 'active'
  | 'needsPayoff'
  | 'complete'
  | 'inconsistent'
  | 'abandoned';

export type HiddenThreadStatus = 'draft' | 'active' | 'revealed' | 'abandoned';

export type RedHerringStatus =
  | 'draft'
  | 'active'
  | 'clarified'
  | 'unfair'
  | 'abandoned';

export type ReaderKnowledge =
  | 'unknown'
  | 'suspects'
  | 'knowsFalse'
  | 'knowsPartial'
  | 'knowsTruth';

export type AuthorKnowledge = 'unknown' | 'planned' | 'confirmed';

export type CharacterKnowledgeState =
  | 'unknown'
  | 'missed'
  | 'suspects'
  | 'misunderstands'
  | 'knowsPartial'
  | 'knowsTruth'
  | 'conceals';

export type InformationObjectType = 'clue' | 'foreshadowing' | 'hiddenThread' | 'redHerring';

export type FindingType =
  | 'missingAttribution'
  | 'missingPayoff'
  | 'timelineConflict'
  | 'knowledgeConflict'
  | 'unfairMislead'
  | 'orphanClue'
  | 'weakSetup';

export type FindingSeverity = 'info' | 'warning' | 'danger';

export interface ClueAttribution {
  providerCharacterId: string | null;
  triggerCharacterId: string | null;
  receiverCharacterId: string | null;
  observerCharacterIds: string[];
  missedByCharacterIds: string[];
  concealerCharacterId: string | null;
  misleaderCharacterId: string | null;
  payoffCharacterId: string | null;
  payoffChapterId: string | null;
  payoffNodeId: string | null;
  mechanism: string;
  completeness: AttributionCompleteness;
}

export interface Clue {
  clueId: string;
  novelId: string;
  title: string;
  content: string;
  type: ClueType;
  status: ClueStatus;
  credibility: Credibility;
  readerVisibility: ReaderVisibility;
  firstAppearanceChapterId: string | null;
  firstAppearanceNodeId: string | null;
  currentChainId: string | null;
  attribution: ClueAttribution;
  relatedCharacterIds: string[];
  relatedWorldItemIds: string[];
  relatedForeshadowingIds: string[];
  sourceInspirationIds: string[];
  sourceEventNodeIds: string[];
  missingFields: string[];
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
}

export interface Foreshadowing {
  foreshadowingId: string;
  novelId: string;
  title: string;
  content: string;
  status: ForeshadowingStatus;
  plantingChapterId: string | null;
  plantingNodeId: string | null;
  expectedPayoffChapterId: string | null;
  expectedPayoffNodeId: string | null;
  actualPayoffChapterId: string | null;
  actualPayoffNodeId: string | null;
  visibility: ReaderVisibility;
  subtletyLevel: number;
  relatedClueIds: string[];
  chainId: string | null;
  sourceInspirationIds: string[];
  missingFields: string[];
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
}

export interface ClueBeat {
  beatId: string;
  novelId: string;
  clueId: string | null;
  foreshadowingId: string | null;
  chainId: string | null;
  type: ClueBeatType;
  chapterId: string | null;
  sceneId: string | null;
  eventNodeId: string | null;
  order: number;
  summary: string;
  readerVisibility: ReaderVisibility;
  informationDelta: string;
  createdAt: string;
}

export interface ClueChain {
  chainId: string;
  novelId: string;
  title: string;
  type: ChainType;
  status: ClueChainStatus;
  arcIds: string[];
  chapterIds: string[];
  clueIds: string[];
  foreshadowingIds: string[];
  allowFlashback: boolean;
  ownerSubagentId: string | null;
  riskLevel: RiskLevel;
  missingFields: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HiddenThread {
  hiddenThreadId: string;
  novelId: string;
  title: string;
  secretTruth: string;
  visibleToReader: boolean;
  visibleToCharacterIds: string[];
  relatedChainIds: string[];
  plannedRevealChapterId: string | null;
  status: HiddenThreadStatus;
}

export interface RedHerring {
  redHerringId: string;
  novelId: string;
  title: string;
  falseConclusion: string;
  truthBehindIt: string;
  misleaderCharacterId: string | null;
  targetCharacterIds: string[];
  misleadsReader: boolean;
  clarificationChapterId: string | null;
  relatedClueIds: string[];
  status: RedHerringStatus;
}

export interface CharacterKnowledge {
  characterId: string;
  knowledgeState: CharacterKnowledgeState;
  evidence: string;
}

export interface InformationState {
  informationStateId: string;
  novelId: string;
  objectType: InformationObjectType;
  objectId: string;
  chapterId: string | null;
  eventNodeId: string | null;
  readerKnowledge: ReaderKnowledge;
  authorKnowledge: AuthorKnowledge;
  characterKnowledge: CharacterKnowledge[];
  notes: string;
  createdAt: string;
}

export interface ClueFinding {
  findingId: string;
  type: FindingType;
  severity: FindingSeverity;
  summary: string;
  relatedObjectIds: string[];
  suggestedAction: string;
  requiresUserConfirmation: boolean;
}

export interface ClueReviewReport {
  reportId: string;
  novelId: string;
  scopeType: 'novel' | 'arc' | 'chapter' | 'chain' | 'clue';
  scopeId: string | null;
  findings: ClueFinding[];
  modelId: string;
  createdAt: string;
}

export interface NovelProjectMeta {
  novelId: string;
  title: string;
  createdAt: string;
}

export interface ClueSystemState {
  projects: NovelProjectMeta[];
  activeNovelId: string;
  clues: Clue[];
  foreshadowings: Foreshadowing[];
  chains: ClueChain[];
  hiddenThreads: HiddenThread[];
  redHerrings: RedHerring[];
  beats: ClueBeat[];
  informationStates: InformationState[];
  reports: ClueReviewReport[];
}
```

- [ ] **Step 2: Write the failing test `stateMachines.test.ts`**

```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/rules/stateMachines.test.ts`
Expected: FAIL — cannot resolve `./stateMachines`.

- [ ] **Step 4: Write minimal `stateMachines.ts`**

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:web -- src/features/clue-system/rules/stateMachines.test.ts`
Expected: PASS (all assertions green).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/clue-system/types.ts apps/web/src/features/clue-system/rules/stateMachines.ts apps/web/src/features/clue-system/rules/stateMachines.test.ts
git commit -m "feat(clue-system): domain types and status transition maps"
```

---

### Task 2: Attribution validation

**Files:**
- Create: `apps/web/src/features/clue-system/rules/attribution.ts`
- Test: `apps/web/src/features/clue-system/rules/attribution.test.ts`

**Interfaces:**
- Consumes: `Clue`, `Foreshadowing`, `ClueAttribution`, `AttributionCompleteness` from `../types`.
- Produces: `computeClueMissingFields(clue: Clue): string[]`, `computeForeshadowingMissingFields(foreshadowing: Foreshadowing): string[]`, `computeCompleteness(attribution: ClueAttribution): AttributionCompleteness`, `emptyAttribution(): ClueAttribution` (factory used by later tasks and seed).

- [ ] **Step 1: Write the failing test `attribution.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import type { Clue, Foreshadowing } from '../types';
import {
  computeClueMissingFields,
  computeCompleteness,
  computeForeshadowingMissingFields,
  emptyAttribution,
} from './attribution';

function makeClue(overrides: Partial<Clue>): Clue {
  return {
    clueId: 'clue-x',
    novelId: 'novel-x',
    title: 'Clue',
    content: 'Content',
    type: 'evidence',
    status: 'draft',
    credibility: 'unknown',
    readerVisibility: 'visible',
    firstAppearanceChapterId: null,
    firstAppearanceNodeId: null,
    currentChainId: null,
    attribution: emptyAttribution(),
    relatedCharacterIds: [],
    relatedWorldItemIds: [],
    relatedForeshadowingIds: [],
    sourceInspirationIds: [],
    sourceEventNodeIds: [],
    missingFields: [],
    riskLevel: 'none',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeForeshadowing(overrides: Partial<Foreshadowing>): Foreshadowing {
  return {
    foreshadowingId: 'foreshadowing-x',
    novelId: 'novel-x',
    title: 'Foreshadowing',
    content: 'Content',
    status: 'draft',
    plantingChapterId: null,
    plantingNodeId: null,
    expectedPayoffChapterId: null,
    expectedPayoffNodeId: null,
    actualPayoffChapterId: null,
    actualPayoffNodeId: null,
    visibility: 'hinted',
    subtletyLevel: 3,
    relatedClueIds: [],
    chainId: null,
    sourceInspirationIds: [],
    missingFields: [],
    riskLevel: 'none',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeClueMissingFields', () => {
  it('reports nothing for a draft clue with no attribution', () => {
    expect(computeClueMissingFields(makeClue({}))).toEqual([]);
  });

  it('requires provider, trigger, receiver once the clue is planted or beyond', () => {
    const clue = makeClue({ status: 'planted' });
    expect(computeClueMissingFields(clue)).toEqual([
      'providerCharacterId',
      'triggerCharacterId',
      'receiverCharacterId',
    ]);
  });

  it('accepts a fully attributed planted clue', () => {
    const clue = makeClue({
      status: 'active',
      attribution: {
        ...emptyAttribution(),
        providerCharacterId: 'kael',
        triggerCharacterId: 'liora',
        receiverCharacterId: 'vex',
      },
    });
    expect(computeClueMissingFields(clue)).toEqual([]);
  });

  it('requires a payoff location for paidOff clues', () => {
    const clue = makeClue({
      status: 'paidOff',
      attribution: {
        ...emptyAttribution(),
        providerCharacterId: 'kael',
        triggerCharacterId: 'liora',
        receiverCharacterId: 'vex',
      },
    });
    expect(computeClueMissingFields(clue)).toEqual(['payoffLocation']);
    const resolved = makeClue({
      ...clue,
      attribution: { ...clue.attribution, payoffChapterId: 'chapter-6' },
    });
    expect(computeClueMissingFields(resolved)).toEqual([]);
  });

  it('requires a misleader or mechanism for red herring clues', () => {
    const clue = makeClue({ type: 'redHerring' });
    expect(computeClueMissingFields(clue)).toEqual(['misleader']);
    expect(
      computeClueMissingFields(
        makeClue({ type: 'redHerring', attribution: { ...emptyAttribution(), mechanism: 'staged diary' } }),
      ),
    ).toEqual([]);
  });

  it('requires a concealer or mechanism for hidden clues', () => {
    const clue = makeClue({ readerVisibility: 'hidden' });
    expect(computeClueMissingFields(clue)).toEqual(['concealer']);
    expect(
      computeClueMissingFields(
        makeClue({
          readerVisibility: 'hidden',
          attribution: { ...emptyAttribution(), concealerCharacterId: 'arden' },
        }),
      ),
    ).toEqual([]);
  });
});

describe('computeForeshadowingMissingFields', () => {
  it('reports nothing for drafts', () => {
    expect(computeForeshadowingMissingFields(makeForeshadowing({}))).toEqual([]);
  });

  it('requires a planting location once planted', () => {
    expect(
      computeForeshadowingMissingFields(makeForeshadowing({ status: 'planted' })),
    ).toEqual(['plantingLocation', 'expectedPayoff']);
    expect(
      computeForeshadowingMissingFields(
        makeForeshadowing({ status: 'planted', plantingChapterId: 'chapter-2' }),
      ),
    ).toEqual(['expectedPayoff']);
  });

  it('requires an expected payoff while open but not after payoff or abandon', () => {
    expect(
      computeForeshadowingMissingFields(
        makeForeshadowing({ status: 'readyForPayoff', plantingChapterId: 'chapter-2' }),
      ),
    ).toEqual(['expectedPayoff']);
    expect(
      computeForeshadowingMissingFields(
        makeForeshadowing({
          status: 'paidOff',
          plantingChapterId: 'chapter-2',
          actualPayoffChapterId: 'chapter-6',
        }),
      ),
    ).toEqual([]);
    expect(
      computeForeshadowingMissingFields(makeForeshadowing({ status: 'abandoned' })),
    ).toEqual([]);
  });
});

describe('computeCompleteness', () => {
  it('is complete when provider, trigger, receiver and a payoff location exist', () => {
    expect(
      computeCompleteness({
        ...emptyAttribution(),
        providerCharacterId: 'kael',
        triggerCharacterId: 'liora',
        receiverCharacterId: 'vex',
        payoffChapterId: 'chapter-6',
      }),
    ).toBe('complete');
  });

  it('names a single missing role', () => {
    expect(
      computeCompleteness({
        ...emptyAttribution(),
        triggerCharacterId: 'liora',
        receiverCharacterId: 'vex',
        payoffNodeId: 'node-1',
      }),
    ).toBe('missingProvider');
    expect(
      computeCompleteness({
        ...emptyAttribution(),
        providerCharacterId: 'kael',
        receiverCharacterId: 'vex',
        payoffChapterId: 'chapter-6',
      }),
    ).toBe('missingTrigger');
    expect(
      computeCompleteness({
        ...emptyAttribution(),
        providerCharacterId: 'kael',
        triggerCharacterId: 'liora',
        payoffChapterId: 'chapter-6',
      }),
    ).toBe('missingReceiver');
    expect(
      computeCompleteness({
        ...emptyAttribution(),
        providerCharacterId: 'kael',
        triggerCharacterId: 'liora',
        receiverCharacterId: 'vex',
      }),
    ).toBe('missingPayoff');
  });

  it('falls back to incomplete when several roles are missing', () => {
    expect(computeCompleteness(emptyAttribution())).toBe('incomplete');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/rules/attribution.test.ts`
Expected: FAIL — cannot resolve `./attribution`.

- [ ] **Step 3: Write minimal `attribution.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:web -- src/features/clue-system/rules/attribution.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/clue-system/rules/attribution.ts apps/web/src/features/clue-system/rules/attribution.test.ts
git commit -m "feat(clue-system): attribution validation rules"
```

---

### Task 3: Guarded transitions

**Files:**
- Modify: `apps/web/src/features/clue-system/rules/stateMachines.ts`
- Modify: `apps/web/src/features/clue-system/rules/stateMachines.test.ts`

**Interfaces:**
- Consumes: `canTransition*` (Task 1), `Clue`, `Foreshadowing`, `ClueChain`, `ClueBeat` types, `isClueCommitted` from `./attribution`.
- Produces: `TransitionDenialReason` (union: `'invalidTransition' | 'missingAttribution' | 'missingPayoffLocation' | 'missingPlantLocation' | 'missingPlantBeat' | 'missingPayoffBeat'`), `TransitionResult` (`{ allowed: boolean; reason: TransitionDenialReason | null }`), `checkClueTransition(clue: Clue, to: ClueStatus): TransitionResult`, `checkForeshadowingTransition(foreshadowing: Foreshadowing, to: ForeshadowingStatus): TransitionResult`, `checkChainTransition(chain: ClueChain, beats: ClueBeat[], to: ClueChainStatus): TransitionResult`.

- [ ] **Step 1: Append failing tests to `stateMachines.test.ts`**

Add these imports at the top (merge with existing): `import type { Clue, ClueAttribution, ClueBeat, ClueChain, Foreshadowing } from '../types';` and `import { checkChainTransition, checkClueTransition, checkForeshadowingTransition } from './stateMachines';` plus `import { emptyAttribution } from './attribution';`

```ts
function makeAttribution(overrides: Partial<ClueAttribution>): ClueAttribution {
  return { ...emptyAttribution(), ...overrides };
}

function makeClueForTransition(overrides: {
  status: ClueStatus;
  attribution?: ClueAttribution;
}): Clue {
  return {
    clueId: 'clue-x',
    novelId: 'novel-x',
    title: 'Clue',
    content: 'Content',
    type: 'evidence',
    status: overrides.status,
    credibility: 'unknown',
    readerVisibility: 'visible',
    firstAppearanceChapterId: null,
    firstAppearanceNodeId: null,
    currentChainId: null,
    attribution: overrides.attribution ?? makeAttribution({}),
    relatedCharacterIds: [],
    relatedWorldItemIds: [],
    relatedForeshadowingIds: [],
    sourceInspirationIds: [],
    sourceEventNodeIds: [],
    missingFields: [],
    riskLevel: 'none',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };
}

const FULL_ATTRIBUTION = makeAttribution({
  providerCharacterId: 'kael',
  triggerCharacterId: 'liora',
  receiverCharacterId: 'vex',
  payoffChapterId: 'chapter-6',
});

describe('checkClueTransition', () => {
  it('rejects transitions the state machine forbids', () => {
    const result = checkClueTransition(makeClueForTransition({ status: 'draft' }), 'active');
    expect(result).toEqual({ allowed: false, reason: 'invalidTransition' });
  });

  it('blocks planting a clue without provider, trigger and receiver', () => {
    const result = checkClueTransition(makeClueForTransition({ status: 'draft' }), 'planted');
    expect(result).toEqual({ allowed: false, reason: 'missingAttribution' });
  });

  it('allows planting a fully attributed clue', () => {
    const clue = makeClueForTransition({ status: 'draft', attribution: FULL_ATTRIBUTION });
    expect(checkClueTransition(clue, 'planted')).toEqual({ allowed: true, reason: null });
  });

  it('blocks paidOff without a payoff location even with full roles', () => {
    const clue = makeClueForTransition({
      status: 'revealed',
      attribution: makeAttribution({
        providerCharacterId: 'kael',
        triggerCharacterId: 'liora',
        receiverCharacterId: 'vex',
      }),
    });
    expect(checkClueTransition(clue, 'paidOff')).toEqual({
      allowed: false,
      reason: 'missingPayoffLocation',
    });
  });

  it('allows discard without attribution', () => {
    const clue = makeClueForTransition({ status: 'active' });
    expect(checkClueTransition(clue, 'discarded')).toEqual({ allowed: true, reason: null });
  });
});

function makeForeshadowingForTransition(overrides: Partial<Foreshadowing>): Foreshadowing {
  return {
    foreshadowingId: 'foreshadowing-x',
    novelId: 'novel-x',
    title: 'Foreshadowing',
    content: 'Content',
    status: 'draft',
    plantingChapterId: null,
    plantingNodeId: null,
    expectedPayoffChapterId: null,
    expectedPayoffNodeId: null,
    actualPayoffChapterId: null,
    actualPayoffNodeId: null,
    visibility: 'hinted',
    subtletyLevel: 3,
    relatedClueIds: [],
    chainId: null,
    sourceInspirationIds: [],
    missingFields: [],
    riskLevel: 'none',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('checkForeshadowingTransition', () => {
  it('blocks planting without a planting location', () => {
    const result = checkForeshadowingTransition(
      makeForeshadowingForTransition({}),
      'planted',
    );
    expect(result).toEqual({ allowed: false, reason: 'missingPlantLocation' });
  });

  it('allows planting with a planting chapter', () => {
    const result = checkForeshadowingTransition(
      makeForeshadowingForTransition({ plantingChapterId: 'chapter-2' }),
      'planted',
    );
    expect(result).toEqual({ allowed: true, reason: null });
  });

  it('blocks paidOff without an actual payoff location', () => {
    const result = checkForeshadowingTransition(
      makeForeshadowingForTransition({ status: 'readyForPayoff', plantingChapterId: 'chapter-2' }),
      'paidOff',
    );
    expect(result).toEqual({ allowed: false, reason: 'missingPayoffLocation' });
  });

  it('allows abandon without locations', () => {
    const result = checkForeshadowingTransition(makeForeshadowingForTransition({}), 'abandoned');
    expect(result).toEqual({ allowed: true, reason: null });
  });
});

function makeChain(overrides: Partial<ClueChain>): ClueChain {
  return {
    chainId: 'chain-x',
    novelId: 'novel-x',
    title: 'Chain',
    type: 'clue',
    status: 'draft',
    arcIds: [],
    chapterIds: [],
    clueIds: [],
    foreshadowingIds: [],
    allowFlashback: false,
    ownerSubagentId: null,
    riskLevel: 'none',
    missingFields: [],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeBeat(overrides: Partial<ClueBeat>): ClueBeat {
  return {
    beatId: 'beat-x',
    novelId: 'novel-x',
    clueId: null,
    foreshadowingId: null,
    chainId: 'chain-x',
    type: 'plant',
    chapterId: null,
    sceneId: null,
    eventNodeId: null,
    order: 1,
    summary: 'Beat',
    readerVisibility: 'visible',
    informationDelta: '',
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('checkChainTransition', () => {
  it('blocks completing a chain without a plant beat', () => {
    const chain = makeChain({ status: 'needsPayoff' });
    const beats = [makeBeat({ type: 'payoff' })];
    expect(checkChainTransition(chain, beats, 'complete')).toEqual({
      allowed: false,
      reason: 'missingPlantBeat',
    });
  });

  it('blocks completing a chain without a payoff beat', () => {
    const chain = makeChain({ status: 'needsPayoff' });
    const beats = [makeBeat({ type: 'plant' })];
    expect(checkChainTransition(chain, beats, 'complete')).toEqual({
      allowed: false,
      reason: 'missingPayoffBeat',
    });
  });

  it('ignores beats from other chains', () => {
    const chain = makeChain({ status: 'needsPayoff' });
    const beats = [
      makeBeat({ type: 'plant', chainId: 'other-chain' }),
      makeBeat({ type: 'payoff', chainId: 'other-chain' }),
    ];
    expect(checkChainTransition(chain, beats, 'complete')).toEqual({
      allowed: false,
      reason: 'missingPlantBeat',
    });
  });

  it('allows completing a chain with both beat kinds', () => {
    const chain = makeChain({ status: 'needsPayoff' });
    const beats = [makeBeat({ type: 'plant' }), makeBeat({ type: 'payoff', order: 2 })];
    expect(checkChainTransition(chain, beats, 'complete')).toEqual({
      allowed: true,
      reason: null,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/rules/stateMachines.test.ts`
Expected: FAIL — `checkClueTransition` is not exported.

- [ ] **Step 3: Append guarded checks to `stateMachines.ts`**

```ts
import type { Clue, ClueBeat, ClueChain, Foreshadowing } from '../types';

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
```

(Keep the existing transition maps and `canTransition*` functions in the same file; add the new imports beside the existing type imports.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:web -- src/features/clue-system/rules/stateMachines.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/clue-system/rules/stateMachines.ts apps/web/src/features/clue-system/rules/stateMachines.test.ts
git commit -m "feat(clue-system): guarded state transitions with attribution checks"
```

---

### Task 4: Risk levels, unpaid foreshadowings, timeline conflicts

**Files:**
- Create: `apps/web/src/features/clue-system/rules/risk.ts`
- Test: `apps/web/src/features/clue-system/rules/risk.test.ts`

**Interfaces:**
- Consumes: `Clue`, `Foreshadowing`, `ClueChain`, `ClueBeat`, `ClueSystemState`, `RiskLevel` from `../types`.
- Produces: `computeClueRisk(clue: Clue): RiskLevel`, `computeForeshadowingRisk(foreshadowing: Foreshadowing): RiskLevel`, `findUnpaidForeshadowings(state: ClueSystemState, novelId: string): Foreshadowing[]`, `TimelineConflict` (`{ chainId, earlyBeatId, plantBeatId }`), `findTimelineConflicts(chain: ClueChain, beats: ClueBeat[]): TimelineConflict[]`.

Note: `computeClueRisk` reads `clue.missingFields`, so callers must compute missing fields first (Task 5's `enrichClue` does this in order).

- [ ] **Step 1: Write the failing test `risk.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import type { Clue, ClueBeat, ClueChain, ClueSystemState, Foreshadowing } from '../types';
import {
  computeClueRisk,
  computeForeshadowingRisk,
  findTimelineConflicts,
  findUnpaidForeshadowings,
} from './risk';

function makeClue(overrides: Partial<Clue>): Clue {
  return {
    clueId: 'clue-x',
    novelId: 'novel-x',
    title: 'Clue',
    content: 'Content',
    type: 'evidence',
    status: 'active',
    credibility: 'unknown',
    readerVisibility: 'visible',
    firstAppearanceChapterId: null,
    firstAppearanceNodeId: null,
    currentChainId: null,
    attribution: {
      providerCharacterId: null, triggerCharacterId: null, receiverCharacterId: null,
      observerCharacterIds: [], missedByCharacterIds: [], concealerCharacterId: null,
      misleaderCharacterId: null, payoffCharacterId: null, payoffChapterId: null,
      payoffNodeId: null, mechanism: '', completeness: 'incomplete',
    },
    relatedCharacterIds: [],
    relatedWorldItemIds: [],
    relatedForeshadowingIds: [],
    sourceInspirationIds: [],
    sourceEventNodeIds: [],
    missingFields: [],
    riskLevel: 'none',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeForeshadowing(overrides: Partial<Foreshadowing>): Foreshadowing {
  return {
    foreshadowingId: 'foreshadowing-x',
    novelId: 'novel-x',
    title: 'Foreshadowing',
    content: 'Content',
    status: 'planted',
    plantingChapterId: 'chapter-1',
    plantingNodeId: null,
    expectedPayoffChapterId: null,
    expectedPayoffNodeId: null,
    actualPayoffChapterId: null,
    actualPayoffNodeId: null,
    visibility: 'hinted',
    subtletyLevel: 3,
    relatedClueIds: [],
    chainId: null,
    sourceInspirationIds: [],
    missingFields: [],
    riskLevel: 'none',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeChain(overrides: Partial<ClueChain>): ClueChain {
  return {
    chainId: 'chain-x',
    novelId: 'novel-x',
    title: 'Chain',
    type: 'clue',
    status: 'active',
    arcIds: [],
    chapterIds: [],
    clueIds: [],
    foreshadowingIds: [],
    allowFlashback: false,
    ownerSubagentId: null,
    riskLevel: 'none',
    missingFields: [],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeBeat(overrides: Partial<ClueBeat>): ClueBeat {
  return {
    beatId: 'beat-x',
    novelId: 'novel-x',
    clueId: null,
    foreshadowingId: null,
    chainId: 'chain-x',
    type: 'plant',
    chapterId: null,
    sceneId: null,
    eventNodeId: null,
    order: 1,
    summary: 'Beat',
    readerVisibility: 'visible',
    informationDelta: '',
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeState(overrides: Partial<ClueSystemState>): ClueSystemState {
  return {
    projects: [],
    activeNovelId: 'novel-x',
    clues: [],
    foreshadowings: [],
    chains: [],
    hiddenThreads: [],
    redHerrings: [],
    beats: [],
    informationStates: [],
    reports: [],
    ...overrides,
  };
}

describe('computeClueRisk', () => {
  it('is none for draft, paidOff and discarded clues', () => {
    expect(computeClueRisk(makeClue({ status: 'draft', missingFields: ['providerCharacterId'] }))).toBe('none');
    expect(computeClueRisk(makeClue({ status: 'paidOff' }))).toBe('none');
    expect(computeClueRisk(makeClue({ status: 'discarded', missingFields: ['misleader'] }))).toBe('none');
  });

  it('is high for committed clues with missing fields', () => {
    expect(computeClueRisk(makeClue({ status: 'active', missingFields: ['receiverCharacterId'] }))).toBe('high');
  });

  it('is medium for unrevealed clues known to be false', () => {
    expect(computeClueRisk(makeClue({ status: 'active', credibility: 'false' }))).toBe('medium');
    expect(computeClueRisk(makeClue({ status: 'revealed', credibility: 'false' }))).toBe('low');
  });

  it('is low otherwise', () => {
    expect(computeClueRisk(makeClue({ status: 'planted' }))).toBe('low');
  });
});

describe('computeForeshadowingRisk', () => {
  it('is none for draft, paidOff and abandoned foreshadowings', () => {
    expect(computeForeshadowingRisk(makeForeshadowing({ status: 'draft' }))).toBe('none');
    expect(computeForeshadowingRisk(makeForeshadowing({ status: 'paidOff' }))).toBe('none');
    expect(computeForeshadowingRisk(makeForeshadowing({ status: 'abandoned' }))).toBe('none');
  });

  it('is high when an open foreshadowing has no expected payoff', () => {
    expect(computeForeshadowingRisk(makeForeshadowing({ status: 'planted' }))).toBe('high');
  });

  it('is low when an expected payoff exists', () => {
    expect(
      computeForeshadowingRisk(
        makeForeshadowing({ status: 'developing', expectedPayoffChapterId: 'chapter-6' }),
      ),
    ).toBe('low');
  });
});

describe('findUnpaidForeshadowings', () => {
  it('returns open foreshadowings without an actual payoff, filtered by novelId', () => {
    const unpaid = makeForeshadowing({ foreshadowingId: 'f-unpaid', status: 'developing' });
    const paid = makeForeshadowing({
      foreshadowingId: 'f-paid',
      status: 'readyForPayoff',
      actualPayoffChapterId: 'chapter-6',
    });
    const draft = makeForeshadowing({ foreshadowingId: 'f-draft', status: 'draft' });
    const otherNovel = makeForeshadowing({ foreshadowingId: 'f-other', novelId: 'novel-y' });
    const state = makeState({ foreshadowings: [unpaid, paid, draft, otherNovel] });

    expect(findUnpaidForeshadowings(state, 'novel-x').map((f) => f.foreshadowingId)).toEqual([
      'f-unpaid',
    ]);
  });
});

describe('findTimelineConflicts', () => {
  it('flags payoff or reveal beats ordered before a plant beat', () => {
    const chain = makeChain({});
    const beats = [
      makeBeat({ beatId: 'b-plant', type: 'plant', order: 2 }),
      makeBeat({ beatId: 'b-payoff', type: 'payoff', order: 1 }),
      makeBeat({ beatId: 'b-reveal', type: 'reveal', order: 3 }),
    ];
    expect(findTimelineConflicts(chain, beats)).toEqual([
      { chainId: 'chain-x', earlyBeatId: 'b-payoff', plantBeatId: 'b-plant' },
    ]);
  });

  it('ignores beats from other chains and returns nothing for healthy order', () => {
    const chain = makeChain({});
    const beats = [
      makeBeat({ beatId: 'b-plant', type: 'plant', order: 1 }),
      makeBeat({ beatId: 'b-payoff', type: 'payoff', order: 2 }),
      makeBeat({ beatId: 'b-foreign', type: 'payoff', order: 0, chainId: 'other-chain' }),
    ];
    expect(findTimelineConflicts(chain, beats)).toEqual([]);
  });

  it('skips chains explicitly marked as flashback structure', () => {
    const chain = makeChain({ allowFlashback: true });
    const beats = [
      makeBeat({ beatId: 'b-plant', type: 'plant', order: 2 }),
      makeBeat({ beatId: 'b-payoff', type: 'payoff', order: 1 }),
    ];
    expect(findTimelineConflicts(chain, beats)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/rules/risk.test.ts`
Expected: FAIL — cannot resolve `./risk`.

- [ ] **Step 3: Write minimal `risk.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:web -- src/features/clue-system/rules/risk.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/clue-system/rules/risk.ts apps/web/src/features/clue-system/rules/risk.test.ts
git commit -m "feat(clue-system): risk levels, unpaid foreshadowings, timeline conflicts"
```

---

### Task 5: Knowledge conflicts, derived chain status, enrichment

**Files:**
- Modify: `apps/web/src/features/clue-system/rules/risk.ts`
- Modify: `apps/web/src/features/clue-system/rules/risk.test.ts`
- Create: `apps/web/src/features/clue-system/rules/enrich.ts`
- Test: `apps/web/src/features/clue-system/rules/enrich.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces: `KnowledgeConflict` (`{ informationStateId, characterId, reason: 'unknownButAttributed' | 'knowsBeforePlant' }`), `findKnowledgeConflicts(state: ClueSystemState, novelId: string): KnowledgeConflict[]`, `deriveChainStatus(chain: ClueChain, beats: ClueBeat[]): ClueChainStatus`, `enrichClue(clue: Clue): Clue`, `enrichForeshadowing(foreshadowing: Foreshadowing): Foreshadowing`.

- [ ] **Step 1: Append failing tests to `risk.test.ts`**

Add imports: `import type { InformationState } from '../types';` and `import { deriveChainStatus, findKnowledgeConflicts } from './risk';`

```ts
function makeInformationState(overrides: Partial<InformationState>): InformationState {
  return {
    informationStateId: 'info-x',
    novelId: 'novel-x',
    objectType: 'clue',
    objectId: 'clue-x',
    chapterId: null,
    eventNodeId: null,
    readerKnowledge: 'unknown',
    authorKnowledge: 'confirmed',
    characterKnowledge: [],
    notes: '',
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('findKnowledgeConflicts', () => {
  it('flags characters marked unknown who are attributed on the clue', () => {
    const clue = makeClue({
      clueId: 'clue-x',
      attribution: { ...makeClue({}).attribution, receiverCharacterId: 'kael' },
    });
    const infoState = makeInformationState({
      characterKnowledge: [{ characterId: 'kael', knowledgeState: 'unknown', evidence: '' }],
    });
    const state = makeState({ clues: [clue], informationStates: [infoState] });

    expect(findKnowledgeConflicts(state, 'novel-x')).toEqual([
      {
        informationStateId: 'info-x',
        characterId: 'kael',
        reason: 'unknownButAttributed',
      },
    ]);
  });

  it('flags characters knowing truth while the clue is still a draft', () => {
    const clue = makeClue({ clueId: 'clue-x', status: 'draft' });
    const infoState = makeInformationState({
      characterKnowledge: [{ characterId: 'liora', knowledgeState: 'knowsTruth', evidence: '' }],
    });
    const state = makeState({ clues: [clue], informationStates: [infoState] });

    expect(findKnowledgeConflicts(state, 'novel-x')).toEqual([
      {
        informationStateId: 'info-x',
        characterId: 'liora',
        reason: 'knowsBeforePlant',
      },
    ]);
  });

  it('ignores other novels, non-clue objects and dangling references', () => {
    const infoState = makeInformationState({
      informationStateId: 'info-dangling',
      objectId: 'missing-clue',
      characterKnowledge: [{ characterId: 'kael', knowledgeState: 'unknown', evidence: '' }],
    });
    const otherNovel = makeInformationState({
      informationStateId: 'info-other',
      novelId: 'novel-y',
      characterKnowledge: [{ characterId: 'kael', knowledgeState: 'unknown', evidence: '' }],
    });
    const threadState = makeInformationState({
      informationStateId: 'info-thread',
      objectType: 'hiddenThread',
      characterKnowledge: [{ characterId: 'kael', knowledgeState: 'unknown', evidence: '' }],
    });
    const state = makeState({ informationStates: [infoState, otherNovel, threadState] });

    expect(findKnowledgeConflicts(state, 'novel-x')).toEqual([]);
  });
});

describe('deriveChainStatus', () => {
  it('keeps draft and abandoned untouched', () => {
    expect(deriveChainStatus(makeChain({ status: 'draft' }), [])).toBe('draft');
    expect(deriveChainStatus(makeChain({ status: 'abandoned' }), [])).toBe('abandoned');
  });

  it('downgrades complete to inconsistent when plant or payoff beats are missing', () => {
    const chain = makeChain({ status: 'complete' });
    expect(deriveChainStatus(chain, [makeBeat({ type: 'plant' })])).toBe('inconsistent');
    expect(deriveChainStatus(chain, [makeBeat({ type: 'payoff' })])).toBe('inconsistent');
    expect(
      deriveChainStatus(chain, [
        makeBeat({ type: 'plant' }),
        makeBeat({ beatId: 'b-2', type: 'payoff', order: 2 }),
      ]),
    ).toBe('complete');
  });

  it('forces needsPayoff on active chains without a payoff beat', () => {
    const chain = makeChain({ status: 'active' });
    expect(deriveChainStatus(chain, [makeBeat({ type: 'plant' })])).toBe('needsPayoff');
    expect(
      deriveChainStatus(chain, [
        makeBeat({ type: 'plant' }),
        makeBeat({ beatId: 'b-2', type: 'payoff', order: 2 }),
      ]),
    ).toBe('active');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/rules/risk.test.ts`
Expected: FAIL — `findKnowledgeConflicts` / `deriveChainStatus` not exported.

- [ ] **Step 3: Append implementations to `risk.ts`**

```ts
import type { ClueChainStatus, InformationState } from '../types';

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
```

(Merge the new type imports into the existing import statement at the top of `risk.ts`.)

- [ ] **Step 4: Run risk tests to verify they pass**

Run: `npm run test:web -- src/features/clue-system/rules/risk.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing test `enrich.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import type { Clue, Foreshadowing } from '../types';
import { emptyAttribution } from './attribution';
import { enrichClue, enrichForeshadowing } from './enrich';

function makeClue(overrides: Partial<Clue>): Clue {
  return {
    clueId: 'clue-x',
    novelId: 'novel-x',
    title: 'Clue',
    content: 'Content',
    type: 'evidence',
    status: 'active',
    credibility: 'unknown',
    readerVisibility: 'visible',
    firstAppearanceChapterId: null,
    firstAppearanceNodeId: null,
    currentChainId: null,
    attribution: emptyAttribution(),
    relatedCharacterIds: [],
    relatedWorldItemIds: [],
    relatedForeshadowingIds: [],
    sourceInspirationIds: [],
    sourceEventNodeIds: [],
    missingFields: [],
    riskLevel: 'none',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('enrichClue', () => {
  it('recomputes missingFields, riskLevel and attribution completeness from current data', () => {
    const enriched = enrichClue(
      makeClue({ missingFields: ['stale'], riskLevel: 'none' }),
    );

    expect(enriched.missingFields).toEqual([
      'providerCharacterId',
      'triggerCharacterId',
      'receiverCharacterId',
    ]);
    expect(enriched.riskLevel).toBe('high');
    expect(enriched.attribution.completeness).toBe('missingPayoff');
  });

  it('computes risk after missing fields so a clean active clue is low risk', () => {
    const enriched = enrichClue(
      makeClue({
        attribution: {
          ...emptyAttribution(),
          providerCharacterId: 'kael',
          triggerCharacterId: 'liora',
          receiverCharacterId: 'vex',
        },
      }),
    );

    expect(enriched.missingFields).toEqual([]);
    expect(enriched.riskLevel).toBe('low');
  });

  it('does not mutate its input', () => {
    const input = makeClue({});
    enrichClue(input);
    expect(input.missingFields).toEqual([]);
    expect(input.attribution.completeness).toBe('incomplete');
  });
});

describe('enrichForeshadowing', () => {
  it('recomputes missingFields and riskLevel', () => {
    const foreshadowing: Foreshadowing = {
      foreshadowingId: 'f-x',
      novelId: 'novel-x',
      title: 'F',
      content: 'C',
      status: 'planted',
      plantingChapterId: 'chapter-1',
      plantingNodeId: null,
      expectedPayoffChapterId: null,
      expectedPayoffNodeId: null,
      actualPayoffChapterId: null,
      actualPayoffNodeId: null,
      visibility: 'hinted',
      subtletyLevel: 2,
      relatedClueIds: [],
      chainId: null,
      sourceInspirationIds: [],
      missingFields: [],
      riskLevel: 'none',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    const enriched = enrichForeshadowing(foreshadowing);
    expect(enriched.missingFields).toEqual(['expectedPayoff']);
    expect(enriched.riskLevel).toBe('high');
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/rules/enrich.test.ts`
Expected: FAIL — cannot resolve `./enrich`.

- [ ] **Step 7: Write minimal `enrich.ts`**

```ts
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
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm run test:web -- src/features/clue-system/rules/enrich.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/features/clue-system/rules/risk.ts apps/web/src/features/clue-system/rules/risk.test.ts apps/web/src/features/clue-system/rules/enrich.ts apps/web/src/features/clue-system/rules/enrich.test.ts
git commit -m "feat(clue-system): knowledge conflicts, derived chain status, enrichment"
```

---

### Task 6: Store reducer

**Files:**
- Create: `apps/web/src/features/clue-system/store/clueStore.ts`
- Test: `apps/web/src/features/clue-system/store/clueStore.test.ts`

**Interfaces:**
- Consumes: all types, `enrichClue`, `enrichForeshadowing`.
- Produces: `ClueAction` union, `clueReducer(state: ClueSystemState, action: ClueAction): ClueSystemState`, `EMPTY_CLUE_STATE: ClueSystemState`. React Provider/hooks are P2.

Deletion semantics (design §5.2): `deleteClue`/`deleteForeshadowing` are no-ops when any beat references the object; otherwise they remove the object plus its information states.

- [ ] **Step 1: Write the failing test `clueStore.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import type { Clue, ClueBeat, ClueSystemState, Foreshadowing } from '../types';
import { emptyAttribution } from '../rules/attribution';
import { EMPTY_CLUE_STATE, clueReducer } from './clueStore';

function makeClue(overrides: Partial<Clue>): Clue {
  return {
    clueId: 'clue-x',
    novelId: 'novel-x',
    title: 'Clue',
    content: 'Content',
    type: 'evidence',
    status: 'draft',
    credibility: 'unknown',
    readerVisibility: 'visible',
    firstAppearanceChapterId: null,
    firstAppearanceNodeId: null,
    currentChainId: null,
    attribution: emptyAttribution(),
    relatedCharacterIds: [],
    relatedWorldItemIds: [],
    relatedForeshadowingIds: [],
    sourceInspirationIds: [],
    sourceEventNodeIds: [],
    missingFields: [],
    riskLevel: 'none',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeBeat(overrides: Partial<ClueBeat>): ClueBeat {
  return {
    beatId: 'beat-x',
    novelId: 'novel-x',
    clueId: 'clue-x',
    foreshadowingId: null,
    chainId: null,
    type: 'plant',
    chapterId: null,
    sceneId: null,
    eventNodeId: null,
    order: 1,
    summary: 'Beat',
    readerVisibility: 'visible',
    informationDelta: '',
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('clueReducer projects', () => {
  it('creates a project and makes it active', () => {
    const state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'createProject',
      novelId: 'novel-a',
      title: 'Novel A',
      createdAt: '2026-08-07T00:00:00.000Z',
    });

    expect(state.projects).toEqual([
      { novelId: 'novel-a', title: 'Novel A', createdAt: '2026-08-07T00:00:00.000Z' },
    ]);
    expect(state.activeNovelId).toBe('novel-a');
  });

  it('switches the active novel only for known projects', () => {
    const withProject = clueReducer(EMPTY_CLUE_STATE, {
      type: 'createProject',
      novelId: 'novel-a',
      title: 'Novel A',
      createdAt: '2026-08-07T00:00:00.000Z',
    });
    expect(
      clueReducer(withProject, { type: 'setActiveNovel', novelId: 'missing' }).activeNovelId,
    ).toBe('novel-a');
  });
});

describe('clueReducer clues', () => {
  it('upserts clues with recomputed derived fields and updatedAt', () => {
    const state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertClue',
      clue: makeClue({ status: 'active', missingFields: ['stale'] }),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });

    expect(state.clues).toHaveLength(1);
    expect(state.clues[0].missingFields).toEqual([
      'providerCharacterId',
      'triggerCharacterId',
      'receiverCharacterId',
    ]);
    expect(state.clues[0].riskLevel).toBe('high');
    expect(state.clues[0].updatedAt).toBe('2026-08-07T09:00:00.000Z');
  });

  it('replaces an existing clue by clueId', () => {
    const withClue = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertClue',
      clue: makeClue({ title: 'Before' }),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });
    const updated = clueReducer(withClue, {
      type: 'upsertClue',
      clue: makeClue({ title: 'After' }),
      updatedAt: '2026-08-07T10:00:00.000Z',
    });

    expect(updated.clues).toHaveLength(1);
    expect(updated.clues[0].title).toBe('After');
  });

  it('deletes an unreferenced clue together with its information states', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertClue',
      clue: makeClue({}),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });
    state = clueReducer(state, {
      type: 'upsertInformationState',
      informationState: {
        informationStateId: 'info-x',
        novelId: 'novel-x',
        objectType: 'clue',
        objectId: 'clue-x',
        chapterId: null,
        eventNodeId: null,
        readerKnowledge: 'unknown',
        authorKnowledge: 'confirmed',
        characterKnowledge: [],
        notes: '',
        createdAt: '2026-08-01T00:00:00.000Z',
      },
    });
    state = clueReducer(state, { type: 'deleteClue', clueId: 'clue-x' });

    expect(state.clues).toEqual([]);
    expect(state.informationStates).toEqual([]);
  });

  it('refuses to delete a clue referenced by beats', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertClue',
      clue: makeClue({}),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });
    state = clueReducer(state, { type: 'upsertBeat', beat: makeBeat({}) });
    state = clueReducer(state, { type: 'deleteClue', clueId: 'clue-x' });

    expect(state.clues).toHaveLength(1);
  });
});

describe('clueReducer foreshadowings', () => {
  const makeForeshadowing = (overrides: Partial<Foreshadowing>): Foreshadowing => ({
    foreshadowingId: 'f-x',
    novelId: 'novel-x',
    title: 'F',
    content: 'C',
    status: 'planted',
    plantingChapterId: 'chapter-1',
    plantingNodeId: null,
    expectedPayoffChapterId: null,
    expectedPayoffNodeId: null,
    actualPayoffChapterId: null,
    actualPayoffNodeId: null,
    visibility: 'hinted',
    subtletyLevel: 2,
    relatedClueIds: [],
    chainId: null,
    sourceInspirationIds: [],
    missingFields: [],
    riskLevel: 'none',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  });

  it('upserts with recomputed derived fields', () => {
    const state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertForeshadowing',
      foreshadowing: makeForeshadowing({}),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });

    expect(state.foreshadowings[0].missingFields).toEqual(['expectedPayoff']);
    expect(state.foreshadowings[0].riskLevel).toBe('high');
  });

  it('refuses to delete a foreshadowing referenced by beats', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertForeshadowing',
      foreshadowing: makeForeshadowing({}),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });
    state = clueReducer(state, {
      type: 'upsertBeat',
      beat: makeBeat({ clueId: null, foreshadowingId: 'f-x' }),
    });
    state = clueReducer(state, { type: 'deleteForeshadowing', foreshadowingId: 'f-x' });

    expect(state.foreshadowings).toHaveLength(1);
  });
});

describe('clueReducer beats, chains, threads, herrings, reports', () => {
  it('upserts and deletes beats', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, { type: 'upsertBeat', beat: makeBeat({}) });
    expect(state.beats).toHaveLength(1);
    state = clueReducer(state, { type: 'deleteBeat', beatId: 'beat-x' });
    expect(state.beats).toEqual([]);
  });

  it('upserts chains, hidden threads, red herrings and appends reports', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertChain',
      chain: {
        chainId: 'chain-x', novelId: 'novel-x', title: 'Chain', type: 'clue',
        status: 'active', arcIds: [], chapterIds: [], clueIds: [], foreshadowingIds: [],
        allowFlashback: false, ownerSubagentId: null, riskLevel: 'none', missingFields: [],
        createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
      },
      updatedAt: '2026-08-07T09:00:00.000Z',
    });
    state = clueReducer(state, {
      type: 'upsertHiddenThread',
      hiddenThread: {
        hiddenThreadId: 'thread-x', novelId: 'novel-x', title: 'Thread',
        secretTruth: 'Truth', visibleToReader: false, visibleToCharacterIds: ['arden'],
        relatedChainIds: [], plannedRevealChapterId: null, status: 'active',
      },
    });
    state = clueReducer(state, {
      type: 'upsertRedHerring',
      redHerring: {
        redHerringId: 'herring-x', novelId: 'novel-x', title: 'Herring',
        falseConclusion: 'False', truthBehindIt: 'True', misleaderCharacterId: 'arden',
        targetCharacterIds: ['kael'], misleadsReader: true, clarificationChapterId: null,
        relatedClueIds: [], status: 'active',
      },
    });
    state = clueReducer(state, {
      type: 'addReport',
      report: {
        reportId: 'report-x', novelId: 'novel-x', scopeType: 'novel', scopeId: null,
        findings: [], modelId: 'stub', createdAt: '2026-08-07T09:00:00.000Z',
      },
    });

    expect(state.chains[0].updatedAt).toBe('2026-08-07T09:00:00.000Z');
    expect(state.hiddenThreads).toHaveLength(1);
    expect(state.redHerrings).toHaveLength(1);
    expect(state.reports).toHaveLength(1);
  });

  it('replaces chains, threads, herrings and beats by id', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertHiddenThread',
      hiddenThread: {
        hiddenThreadId: 'thread-x', novelId: 'novel-x', title: 'Before',
        secretTruth: 'Truth', visibleToReader: false, visibleToCharacterIds: [],
        relatedChainIds: [], plannedRevealChapterId: null, status: 'draft',
      },
    });
    state = clueReducer(state, {
      type: 'upsertHiddenThread',
      hiddenThread: {
        hiddenThreadId: 'thread-x', novelId: 'novel-x', title: 'After',
        secretTruth: 'Truth', visibleToReader: false, visibleToCharacterIds: [],
        relatedChainIds: [], plannedRevealChapterId: null, status: 'active',
      },
    });

    expect(state.hiddenThreads).toHaveLength(1);
    expect(state.hiddenThreads[0].title).toBe('After');
  });
});

describe('EMPTY_CLUE_STATE', () => {
  it('is a valid empty state with no active novel', () => {
    const state: ClueSystemState = EMPTY_CLUE_STATE;
    expect(state.projects).toEqual([]);
    expect(state.activeNovelId).toBe('');
    expect(state.clues).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/store/clueStore.test.ts`
Expected: FAIL — cannot resolve `./clueStore`.

- [ ] **Step 3: Write minimal `clueStore.ts`**

```ts
import type {
  Clue,
  ClueBeat,
  ClueChain,
  ClueReviewReport,
  ClueSystemState,
  Foreshadowing,
  HiddenThread,
  InformationState,
  RedHerring,
} from '../types';
import { enrichClue, enrichForeshadowing } from '../rules/enrich';

export const EMPTY_CLUE_STATE: ClueSystemState = {
  projects: [],
  activeNovelId: '',
  clues: [],
  foreshadowings: [],
  chains: [],
  hiddenThreads: [],
  redHerrings: [],
  beats: [],
  informationStates: [],
  reports: [],
};

export type ClueAction =
  | { type: 'createProject'; novelId: string; title: string; createdAt: string }
  | { type: 'setActiveNovel'; novelId: string }
  | { type: 'upsertClue'; clue: Clue; updatedAt: string }
  | { type: 'deleteClue'; clueId: string }
  | { type: 'upsertForeshadowing'; foreshadowing: Foreshadowing; updatedAt: string }
  | { type: 'deleteForeshadowing'; foreshadowingId: string }
  | { type: 'upsertChain'; chain: ClueChain; updatedAt: string }
  | { type: 'upsertHiddenThread'; hiddenThread: HiddenThread }
  | { type: 'upsertRedHerring'; redHerring: RedHerring }
  | { type: 'upsertBeat'; beat: ClueBeat }
  | { type: 'deleteBeat'; beatId: string }
  | { type: 'upsertInformationState'; informationState: InformationState }
  | { type: 'addReport'; report: ClueReviewReport };

function upsertById<T>(items: T[], next: T, idOf: (item: T) => string): T[] {
  const id = idOf(next);
  const exists = items.some((item) => idOf(item) === id);
  return exists ? items.map((item) => (idOf(item) === id ? next : item)) : [...items, next];
}

export function clueReducer(state: ClueSystemState, action: ClueAction): ClueSystemState {
  switch (action.type) {
    case 'createProject':
      return {
        ...state,
        projects: [
          ...state.projects,
          { novelId: action.novelId, title: action.title, createdAt: action.createdAt },
        ],
        activeNovelId: action.novelId,
      };

    case 'setActiveNovel':
      if (!state.projects.some((project) => project.novelId === action.novelId)) return state;
      return { ...state, activeNovelId: action.novelId };

    case 'upsertClue':
      return {
        ...state,
        clues: upsertById(
          state.clues,
          enrichClue({ ...action.clue, updatedAt: action.updatedAt }),
          (clue) => clue.clueId,
        ),
      };

    case 'deleteClue': {
      if (state.beats.some((beat) => beat.clueId === action.clueId)) return state;
      return {
        ...state,
        clues: state.clues.filter((clue) => clue.clueId !== action.clueId),
        informationStates: state.informationStates.filter(
          (infoState) => !(infoState.objectType === 'clue' && infoState.objectId === action.clueId),
        ),
      };
    }

    case 'upsertForeshadowing':
      return {
        ...state,
        foreshadowings: upsertById(
          state.foreshadowings,
          enrichForeshadowing({ ...action.foreshadowing, updatedAt: action.updatedAt }),
          (foreshadowing) => foreshadowing.foreshadowingId,
        ),
      };

    case 'deleteForeshadowing': {
      if (state.beats.some((beat) => beat.foreshadowingId === action.foreshadowingId)) {
        return state;
      }
      return {
        ...state,
        foreshadowings: state.foreshadowings.filter(
          (foreshadowing) => foreshadowing.foreshadowingId !== action.foreshadowingId,
        ),
        informationStates: state.informationStates.filter(
          (infoState) =>
            !(
              infoState.objectType === 'foreshadowing' &&
              infoState.objectId === action.foreshadowingId
            ),
        ),
      };
    }

    case 'upsertChain':
      return {
        ...state,
        chains: upsertById(
          state.chains,
          { ...action.chain, updatedAt: action.updatedAt },
          (chain) => chain.chainId,
        ),
      };

    case 'upsertHiddenThread':
      return {
        ...state,
        hiddenThreads: upsertById(
          state.hiddenThreads,
          action.hiddenThread,
          (thread) => thread.hiddenThreadId,
        ),
      };

    case 'upsertRedHerring':
      return {
        ...state,
        redHerrings: upsertById(
          state.redHerrings,
          action.redHerring,
          (herring) => herring.redHerringId,
        ),
      };

    case 'upsertBeat':
      return {
        ...state,
        beats: upsertById(state.beats, action.beat, (beat) => beat.beatId),
      };

    case 'deleteBeat':
      return { ...state, beats: state.beats.filter((beat) => beat.beatId !== action.beatId) };

    case 'upsertInformationState':
      return {
        ...state,
        informationStates: upsertById(
          state.informationStates,
          action.informationState,
          (infoState) => infoState.informationStateId,
        ),
      };

    case 'addReport':
      return { ...state, reports: [...state.reports, action.report] };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:web -- src/features/clue-system/store/clueStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/clue-system/store/clueStore.ts apps/web/src/features/clue-system/store/clueStore.test.ts
git commit -m "feat(clue-system): store reducer with guarded deletes and enrichment"
```

---

### Task 7: Persistence

**Files:**
- Create: `apps/web/src/features/clue-system/store/persistence.ts`
- Test: `apps/web/src/features/clue-system/store/persistence.test.ts`

**Interfaces:**
- Consumes: `ClueSystemState`.
- Produces: `CLUE_STORAGE_KEY = 'novelora.clueSystem.v1'`, `CLUE_SCHEMA_VERSION = 1`, `saveClueSystem(state: ClueSystemState): boolean`, `loadClueSystem(): ClueSystemState | null`.

jsdom provides `window.localStorage` in tests; clear it between cases.

- [ ] **Step 1: Write the failing test `persistence.test.ts`**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/store/persistence.test.ts`
Expected: FAIL — cannot resolve `./persistence`.

- [ ] **Step 3: Write minimal `persistence.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:web -- src/features/clue-system/store/persistence.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/clue-system/store/persistence.ts apps/web/src/features/clue-system/store/persistence.test.ts
git commit -m "feat(clue-system): versioned localStorage persistence"
```

---

### Task 8: Seed project + initial state

**Files:**
- Create: `apps/web/src/features/clue-system/store/seedProject.ts`
- Test: `apps/web/src/features/clue-system/store/seedProject.test.ts`

**Interfaces:**
- Consumes: all types, `enrichClue`, `enrichForeshadowing`, `loadClueSystem`, `noveloraMockProject` from `../../novelora-cockpit/data/noveloraMockProject` (read-only source for mapping).
- Produces: `buildSeedState(): ClueSystemState`, `initialClueState(): ClueSystemState` (= `loadClueSystem() ?? buildSeedState()`).

Seed content (deterministic ids, timestamps `'2026-08-01T00:00:00.000Z'`):
- Project `tides-of-embers` / "Tides of Embers" (same novelId as the cockpit fixture).
- Clue `clue-old-tide-map` ("The old tide map"): `object`, `paidOff`, credibility `true`, visibility `visible`, first appearance `chapter-2`, attribution provider `liora`, trigger `kael`, receiver `kael`, observers `['liora','vex']`, payoff chapter `chapter-6`, payoff character `kael`. Beats: `beat-map-plant` (plant, ch2, order 1), `beat-map-advance` (advance, ch3, order 2), `beat-map-payoff` (payoff, ch6, order 3), all on chain `chain-ember-route`.
- Clue `clue-false-harbor-sigil` ("The false-harbor sigil"): `evidence`, `active`, credibility `true`, visibility `hinted`, first appearance `chapter-3`, attribution provider `arden`, trigger `arden`, receiver `liora`, no payoff. Beats: `beat-sigil-plant` (plant, ch3, order 1), `beat-sigil-advance` (advance, ch5, order 2), chain `chain-ember-route`.
- Chain `chain-ember-route` ("The ember route"): type `clue`, status `active`, clueIds both clues, chapterIds `['chapter-2','chapter-3','chapter-5','chapter-6']`, arcIds `['act-i','act-ii','act-iii','epilogue']`, allowFlashback false.
- Foreshadowing `foreshadowing-forge-threshold` ("The drowned forge threshold"): `planted`, planting `chapter-5`, NO expected payoff (demonstrates missingPayoff/high risk), visibility `hinted`, subtlety 4.
- Foreshadowing `foreshadowing-reef-bargain` ("Selene's reef bargain"): `developing`, planting `chapter-4`, expected payoff `chapter-6`, visibility `hinted`, subtlety 3.
- HiddenThread `thread-harbor-registry` ("The rewritten harbor registry"): secretTruth "Arden altered the harbor registry to hide the forbidden route.", visibleToReader false, visibleToCharacterIds `['arden','selene']`, relatedChainIds `['chain-ember-route']`, plannedRevealChapterId `chapter-6`, status `active`.
- RedHerring `herring-rescue-beacon` ("The rescue beacon"): falseConclusion "The beacon guides ships to safety.", truthBehindIt "It lures ember-ore ships onto the reef.", misleader `arden`, targets `['kael','vex']`, misleadsReader true, clarification null, relatedClueIds `['clue-false-harbor-sigil']`, status `active`.
- InformationState `info-tide-map-ch3` on `clue-old-tide-map`, chapter `chapter-3`: reader `knowsPartial`, author `confirmed`, characters: kael `knowsTruth`, liora `knowsPartial`, vex `suspects`, arden `conceals`.
- reports: `[]`.

- [ ] **Step 1: Write the failing test `seedProject.test.ts`**

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { noveloraMockProject } from '../../novelora-cockpit/data/noveloraMockProject';
import { enrichClue, enrichForeshadowing } from '../rules/enrich';
import { findTimelineConflicts, findUnpaidForeshadowings } from '../rules/risk';
import { CLUE_STORAGE_KEY } from './persistence';
import { buildSeedState, initialClueState } from './seedProject';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/store/seedProject.test.ts`
Expected: FAIL — cannot resolve `./seedProject`.

- [ ] **Step 3: Write `seedProject.ts`**

```ts
import { noveloraMockProject } from '../../novelora-cockpit/data/noveloraMockProject';
import type {
  Clue,
  ClueAttribution,
  ClueBeat,
  ClueChain,
  ClueSystemState,
  Foreshadowing,
  HiddenThread,
  InformationState,
  RedHerring,
} from '../types';
import { enrichClue, enrichForeshadowing } from '../rules/enrich';
import { loadClueSystem } from './persistence';

const SEED_TIMESTAMP = '2026-08-01T00:00:00.000Z';
const NOVEL_ID = noveloraMockProject.novelId;

function seedAttribution(overrides: Partial<ClueAttribution>): ClueAttribution {
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
    ...overrides,
  };
}

function seedClue(overrides: Partial<Clue>): Clue {
  return enrichClue({
    clueId: '',
    novelId: NOVEL_ID,
    title: '',
    content: '',
    type: 'evidence',
    status: 'draft',
    credibility: 'unknown',
    readerVisibility: 'visible',
    firstAppearanceChapterId: null,
    firstAppearanceNodeId: null,
    currentChainId: null,
    attribution: seedAttribution({}),
    relatedCharacterIds: [],
    relatedWorldItemIds: [],
    relatedForeshadowingIds: [],
    sourceInspirationIds: [],
    sourceEventNodeIds: [],
    missingFields: [],
    riskLevel: 'none',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
    ...overrides,
  });
}

function seedForeshadowing(overrides: Partial<Foreshadowing>): Foreshadowing {
  return enrichForeshadowing({
    foreshadowingId: '',
    novelId: NOVEL_ID,
    title: '',
    content: '',
    status: 'draft',
    plantingChapterId: null,
    plantingNodeId: null,
    expectedPayoffChapterId: null,
    expectedPayoffNodeId: null,
    actualPayoffChapterId: null,
    actualPayoffNodeId: null,
    visibility: 'hinted',
    subtletyLevel: 3,
    relatedClueIds: [],
    chainId: null,
    sourceInspirationIds: [],
    missingFields: [],
    riskLevel: 'none',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
    ...overrides,
  });
}

function seedBeat(overrides: Partial<ClueBeat>): ClueBeat {
  return {
    beatId: '',
    novelId: NOVEL_ID,
    clueId: null,
    foreshadowingId: null,
    chainId: null,
    type: 'plant',
    chapterId: null,
    sceneId: null,
    eventNodeId: null,
    order: 1,
    summary: '',
    readerVisibility: 'visible',
    informationDelta: '',
    createdAt: SEED_TIMESTAMP,
    ...overrides,
  };
}

export function buildSeedState(): ClueSystemState {
  const oldTideMap = seedClue({
    clueId: 'clue-old-tide-map',
    title: 'The old tide map',
    content:
      'A vellum fragment hidden behind the cracked lighthouse lens reveals the forbidden harbor route.',
    type: 'object',
    status: 'paidOff',
    credibility: 'true',
    readerVisibility: 'visible',
    firstAppearanceChapterId: 'chapter-2',
    currentChainId: 'chain-ember-route',
    attribution: seedAttribution({
      providerCharacterId: 'liora',
      triggerCharacterId: 'kael',
      receiverCharacterId: 'kael',
      observerCharacterIds: ['liora', 'vex'],
      payoffCharacterId: 'kael',
      payoffChapterId: 'chapter-6',
      completeness: 'complete',
    }),
    relatedCharacterIds: ['kael', 'liora', 'vex'],
  });

  const falseSigil = seedClue({
    clueId: 'clue-false-harbor-sigil',
    title: 'The false-harbor sigil',
    content:
      'A stamped sigil beside beacon-keeper payments in Arden’s sealed ledgers, seen again on the lantern casing before the trap.',
    type: 'evidence',
    status: 'active',
    credibility: 'true',
    readerVisibility: 'hinted',
    firstAppearanceChapterId: 'chapter-3',
    currentChainId: 'chain-ember-route',
    attribution: seedAttribution({
      providerCharacterId: 'arden',
      triggerCharacterId: 'arden',
      receiverCharacterId: 'liora',
      completeness: 'missingPayoff',
    }),
    relatedCharacterIds: ['arden', 'liora', 'vex'],
  });

  const forgeThreshold = seedForeshadowing({
    foreshadowingId: 'foreshadowing-forge-threshold',
    title: 'The drowned forge threshold',
    content: 'A submerged threshold that opens at the meeting of fire and tide.',
    status: 'planted',
    plantingChapterId: 'chapter-5',
    visibility: 'hinted',
    subtletyLevel: 4,
    chainId: 'chain-ember-route',
    sourceInspirationIds: ['forge-threshold'],
  });

  const reefBargain = seedForeshadowing({
    foreshadowingId: 'foreshadowing-reef-bargain',
    title: 'Selene’s reef bargain',
    content: 'The price Selene paid the reef for her oracle sight, still unspoken.',
    status: 'developing',
    plantingChapterId: 'chapter-4',
    expectedPayoffChapterId: 'chapter-6',
    subtletyLevel: 3,
    sourceInspirationIds: ['vow-fragment'],
    relatedClueIds: [],
  });

  const chain: ClueChain = {
    chainId: 'chain-ember-route',
    novelId: NOVEL_ID,
    title: 'The ember route',
    type: 'clue',
    status: 'active',
    arcIds: ['act-i', 'act-ii', 'act-iii', 'epilogue'],
    chapterIds: ['chapter-2', 'chapter-3', 'chapter-5', 'chapter-6'],
    clueIds: [oldTideMap.clueId, falseSigil.clueId],
    foreshadowingIds: [forgeThreshold.foreshadowingId],
    allowFlashback: false,
    ownerSubagentId: null,
    riskLevel: 'low',
    missingFields: [],
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  };

  const harborRegistry: HiddenThread = {
    hiddenThreadId: 'thread-harbor-registry',
    novelId: NOVEL_ID,
    title: 'The rewritten harbor registry',
    secretTruth: 'Arden altered the harbor registry to hide the forbidden route.',
    visibleToReader: false,
    visibleToCharacterIds: ['arden', 'selene'],
    relatedChainIds: [chain.chainId],
    plannedRevealChapterId: 'chapter-6',
    status: 'active',
  };

  const rescueBeacon: RedHerring = {
    redHerringId: 'herring-rescue-beacon',
    novelId: NOVEL_ID,
    title: 'The rescue beacon',
    falseConclusion: 'The beacon guides ships to safety.',
    truthBehindIt: 'It lures ember-ore ships onto the reef.',
    misleaderCharacterId: 'arden',
    targetCharacterIds: ['kael', 'vex'],
    misleadsReader: true,
    clarificationChapterId: null,
    relatedClueIds: [falseSigil.clueId],
    status: 'active',
  };

  const tideMapInfo: InformationState = {
    informationStateId: 'info-tide-map-ch3',
    novelId: NOVEL_ID,
    objectType: 'clue',
    objectId: oldTideMap.clueId,
    chapterId: 'chapter-3',
    eventNodeId: null,
    readerKnowledge: 'knowsPartial',
    authorKnowledge: 'confirmed',
    characterKnowledge: [
      { characterId: 'kael', knowledgeState: 'knowsTruth', evidence: 'He recognizes the route Vex used.' },
      { characterId: 'liora', knowledgeState: 'knowsPartial', evidence: 'She hid the fragment but not its meaning.' },
      { characterId: 'vex', knowledgeState: 'suspects', evidence: 'The route is his old smuggling path.' },
      { characterId: 'arden', knowledgeState: 'conceals', evidence: 'The registry he altered names this route.' },
    ],
    notes: '',
    createdAt: SEED_TIMESTAMP,
  };

  const beats: ClueBeat[] = [
    seedBeat({
      beatId: 'beat-map-plant',
      clueId: oldTideMap.clueId,
      chainId: chain.chainId,
      type: 'plant',
      chapterId: 'chapter-2',
      order: 1,
      summary: 'Liora bargains for the vellum fragment behind the lighthouse lens.',
    }),
    seedBeat({
      beatId: 'beat-map-advance',
      clueId: oldTideMap.clueId,
      chainId: chain.chainId,
      type: 'advance',
      chapterId: 'chapter-3',
      order: 2,
      summary: 'The ashfall tide mark aligns with harbor stones; the route becomes legible.',
      informationDelta: 'Kael recognizes the route Vex used before disappearing.',
    }),
    seedBeat({
      beatId: 'beat-map-payoff',
      clueId: oldTideMap.clueId,
      chainId: chain.chainId,
      type: 'payoff',
      chapterId: 'chapter-6',
      order: 3,
      summary: 'The map reveals the only safe approach to the drowned forge under black water.',
    }),
    seedBeat({
      beatId: 'beat-sigil-plant',
      clueId: falseSigil.clueId,
      chainId: chain.chainId,
      type: 'plant',
      chapterId: 'chapter-3',
      order: 1,
      summary: 'A stamped sigil appears beside beacon-keeper payments in Arden’s ledgers.',
    }),
    seedBeat({
      beatId: 'beat-sigil-advance',
      clueId: falseSigil.clueId,
      chainId: chain.chainId,
      type: 'advance',
      chapterId: 'chapter-5',
      order: 2,
      summary: 'The sigil appears on the lantern casing as the beacon flame turns green.',
      readerVisibility: 'visible',
    }),
  ];

  return {
    projects: [{ novelId: NOVEL_ID, title: noveloraMockProject.title, createdAt: SEED_TIMESTAMP }],
    activeNovelId: NOVEL_ID,
    clues: [oldTideMap, falseSigil],
    foreshadowings: [forgeThreshold, reefBargain],
    chains: [chain],
    hiddenThreads: [harborRegistry],
    redHerrings: [rescueBeacon],
    beats,
    informationStates: [tideMapInfo],
    reports: [],
  };
}

export function initialClueState(): ClueSystemState {
  return loadClueSystem() ?? buildSeedState();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:web -- src/features/clue-system/store/seedProject.test.ts`
Expected: PASS. If the "derived fields match" test fails, adjust the seed's pre-set `completeness`/`missingFields`/`riskLevel` inputs until `enrichClue`/`enrichForeshadowing` output equals the stored object (the factories above already run enrichment, so this should pass as written).

- [ ] **Step 5: Run the full verification suite**

Run: `npm run test:web` then `npm run lint:web` then `npm run build:web`
Expected: all tests PASS, no lint errors, build succeeds (typecheck clean).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/clue-system/store/seedProject.ts apps/web/src/features/clue-system/store/seedProject.test.ts
git commit -m "feat(clue-system): seed project and initial state"
```

---

## P1 Acceptance Checklist

- [ ] `npm run test:web` green (all existing + new tests)
- [ ] `npm run lint:web` clean
- [ ] `npm run build:web` clean
- [ ] No UI was added; `App.tsx` untouched
- [ ] Every rule function has a colocated test
- [ ] Seed state passes rules-engine idempotency (enrich(seed) === seed)
