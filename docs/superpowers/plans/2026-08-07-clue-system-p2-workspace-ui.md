# Clue System P2: Workspace UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the clue workspace UI on top of the P1 data layer: workspace switching in the cockpit, project bar, object list with filters, detail editors with guarded state transitions, chain/chapter/character views, risk drawer, and the clues.css style contract.

**Architecture:** React integration lives in `store/ClueSystemContext.tsx` (useReducer + Context + debounced persistence). Components in `apps/web/src/features/clue-system/components/` consume state via `useClueSystemState()` and dispatch raw `ClueAction` objects. All status transitions go through the new reducer-level `transition*` actions (guarded by the rules engine). Styles in a new `src/styles/clues.css` imported by `global.css`, colors via design tokens only.

**Tech Stack:** React 19, TypeScript strict, Vitest 4 + Testing Library + user-event, jsdom. No new dependencies.

**Specs:** `docs/superpowers/specs/2026-08-07-clue-system-mvp-design.md` (§4 derived values, §5 UI) and `docs/superpowers/specs/05-clue-foreshadowing-spec.md` (§7 flows, §10 state machines, §15 visualization, §16 exceptions). P1 code is committed on this branch under `apps/web/src/features/clue-system/`.

## Global Constraints

- TypeScript strict: `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (type-only imports MUST use `import type`), `erasableSyntaxOnly` (NO `enum`), `noEmit`.
- Tests colocated (`X.test.tsx` next to `X.tsx`), explicitly `import { ... } from 'vitest'`, query by role/accessible name (getByRole('button', { name: ... })), use `@testing-library/user-event`.
- No comments in code unless a test assertion needs explaining.
- Identifiers and UI copy in English.
- **ENVIRONMENT QUIRK (verified in P1):** on this stack (Node 26 + Vitest 4 + jsdom 29) `window.localStorage` is shadowed by Node's experimental global and unavailable to tests. Any test file that touches localStorage MUST define the module-scoped in-memory Storage stub shown in `store/persistence.test.ts` (`createMemoryStorage` + `Object.defineProperty(window, 'localStorage', ...)`) at the top of that file. Never modify `vitest.setup.ts`.
- P1 interfaces (committed, do not change without a finding-driven fix): types in `../types`; rules in `rules/stateMachines.ts` (`canTransition*`, `checkClueTransition`, `checkForeshadowingTransition`, `checkChainTransition`, `TransitionResult`, `TransitionDenialReason`), `rules/attribution.ts` (`emptyAttribution`), `rules/risk.ts` (`findUnpaidForeshadowings`, `findTimelineConflicts`, `findKnowledgeConflicts`, `deriveChainStatus`), `rules/enrich.ts` (`enrichClue`, `enrichForeshadowing`); store in `store/clueStore.ts` (`clueReducer`, `EMPTY_CLUE_STATE`, `ClueAction`), `store/persistence.ts` (`saveClueSystem`, `loadClueSystem`, `CLUE_STORAGE_KEY`), `store/seedProject.ts` (`buildSeedState`, `initialClueState`).
- Runtime SVG assets must use only the approved palette hexes (`#0AA85B #6FDDB1 #14261F #60726A #DDF6EA #CFE8DD #F7FBF9`, any case) and contain at least one hex color (asserted by `assetRegistry.test.ts`).
- CSS: colors only via `var(--token)` from `src/styles/tokens.css` — NO hex literals in clues.css (contract-tested in Task 13). Usable tokens include `--color-mint-primary`, `--color-mint-support`, `--color-mint-soft`, `--color-mint-line`, `--color-surface`, `--color-canvas`, `--color-ink`, `--color-text-muted`, `--color-text-secondary`, `--color-state-danger`, `--color-state-warning`, `--color-state-done`, `--color-state-info`, `--color-focus-ring`, `--color-line`, `--radius-card`, `--radius-panel`, `--radius-sm`, `--radius-pill`, `--shadow-card`, `--shadow-float`, `--font-ui`, `--font-display`.
- Character/chapter pickers in editors read from `noveloraMockProject` (fixture-backed; documented in design §3.4/§5). Import path from components: `../../novelora-cockpit/data/noveloraMockProject`.
- Run from repo root: tests `npm run test:web -- <path>` (focused) / `npm run test:web` (full), lint `npm run lint:web`, build `npm run build:web`.
- Commit after each task; stage only files listed in the task.

---

### Task 1: React store layer + reducer transition actions + timeline guard

**Files:**
- Modify: `apps/web/src/features/clue-system/rules/stateMachines.ts` (add `timelineConflict` denial reason + guard wiring)
- Modify: `apps/web/src/features/clue-system/rules/stateMachines.test.ts`
- Modify: `apps/web/src/features/clue-system/store/clueStore.ts` (3 new actions)
- Modify: `apps/web/src/features/clue-system/store/clueStore.test.ts`
- Create: `apps/web/src/features/clue-system/store/ClueSystemContext.tsx`
- Test: `apps/web/src/features/clue-system/store/ClueSystemContext.test.tsx`

**Interfaces:**
- Consumes: P1 `checkChainTransition`, `findTimelineConflicts`, reducer, persistence, seed.
- Produces (later tasks rely on these exact names):
  - `TransitionDenialReason` gains `'timelineConflict'`.
  - `ClueAction` gains `{ type: 'transitionClue'; clueId: string; to: ClueStatus; updatedAt: string }`, `{ type: 'transitionForeshadowing'; foreshadowingId: string; to: ForeshadowingStatus; updatedAt: string }`, `{ type: 'transitionChain'; chainId: string; to: ClueChainStatus; updatedAt: string }`. Denied transitions are reducer no-ops.
  - `ClueSystemProvider({ children, initialState? }: { children: ReactNode; initialState?: ClueSystemState })`, `useClueSystemState(): ClueSystemState`, `useClueSystemDispatch(): Dispatch<ClueAction>`. `initialState` prop exists for tests; default is `initialClueState()`. Persists via `saveClueSystem` debounced 300ms.

- [ ] **Step 1: Append failing timeline-guard tests to `stateMachines.test.ts`**

Append inside the existing `describe('checkChainTransition')` block:

```ts
  it('denies completion when a payoff beat is ordered before a plant beat', () => {
    const chain = makeChain({ status: 'needsPayoff' });
    const beats = [
      makeBeat({ beatId: 'b-plant', type: 'plant', order: 2 }),
      makeBeat({ beatId: 'b-payoff', type: 'payoff', order: 1 }),
    ];
    expect(checkChainTransition(chain, beats, 'complete')).toEqual({
      allowed: false,
      reason: 'timelineConflict',
    });
  });

  it('allows the same completion when the chain is marked as flashback structure', () => {
    const chain = makeChain({ status: 'needsPayoff', allowFlashback: true });
    const beats = [
      makeBeat({ beatId: 'b-plant', type: 'plant', order: 2 }),
      makeBeat({ beatId: 'b-payoff', type: 'payoff', order: 1 }),
    ];
    expect(checkChainTransition(chain, beats, 'complete')).toEqual({
      allowed: true,
      reason: null,
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/rules/stateMachines.test.ts`
Expected: FAIL — reason is `null`/allowed instead of `timelineConflict`.

- [ ] **Step 3: Wire the guard in `stateMachines.ts`**

Add `'timelineConflict'` to the `TransitionDenialReason` union, add `import { findTimelineConflicts } from './risk';` (no import cycle: risk.ts imports only types + attribution), and inside `checkChainTransition` extend the `to === 'complete'` block:

```ts
  if (to === 'complete') {
    const chainBeats = beats.filter((beat) => beat.chainId === chain.chainId);
    if (!chainBeats.some((beat) => beat.type === 'plant')) return deny('missingPlantBeat');
    if (!chainBeats.some((beat) => beat.type === 'payoff')) return deny('missingPayoffBeat');
    if (findTimelineConflicts(chain, beats).length > 0) return deny('timelineConflict');
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:web -- src/features/clue-system/rules/stateMachines.test.ts`
Expected: PASS.

- [ ] **Step 5: Append failing reducer transition tests to `clueStore.test.ts`**

Add a `makeChain` helper next to the existing helpers:

```ts
function makeChain(overrides: Partial<ClueChain>): ClueChain {
  return {
    chainId: 'chain-x',
    novelId: 'novel-x',
    title: 'Chain',
    type: 'clue',
    status: 'needsPayoff',
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
```

(Add `ClueChain` to the test file's type imports.) Then append:

```ts
describe('clueReducer transitions', () => {
  it('applies a legal clue transition with updatedAt', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertClue',
      clue: makeClue({
        status: 'draft',
        attribution: {
          ...emptyAttribution(),
          providerCharacterId: 'kael',
          triggerCharacterId: 'liora',
          receiverCharacterId: 'vex',
        },
      }),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });
    state = clueReducer(state, {
      type: 'transitionClue',
      clueId: 'clue-x',
      to: 'planted',
      updatedAt: '2026-08-07T10:00:00.000Z',
    });

    expect(state.clues[0].status).toBe('planted');
    expect(state.clues[0].updatedAt).toBe('2026-08-07T10:00:00.000Z');
  });

  it('refuses a guarded clue transition', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertClue',
      clue: makeClue({ status: 'draft' }),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });
    state = clueReducer(state, {
      type: 'transitionClue',
      clueId: 'clue-x',
      to: 'planted',
      updatedAt: '2026-08-07T10:00:00.000Z',
    });

    expect(state.clues[0].status).toBe('draft');
    expect(state.clues[0].updatedAt).toBe('2026-08-07T09:00:00.000Z');
  });

  it('applies a legal foreshadowing transition', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertForeshadowing',
      foreshadowing: makeForeshadowing({
        status: 'readyForPayoff',
        plantingChapterId: 'chapter-2',
        expectedPayoffChapterId: 'chapter-6',
        actualPayoffChapterId: 'chapter-6',
      }),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });
    state = clueReducer(state, {
      type: 'transitionForeshadowing',
      foreshadowingId: 'f-x',
      to: 'paidOff',
      updatedAt: '2026-08-07T10:00:00.000Z',
    });

    expect(state.foreshadowings[0].status).toBe('paidOff');
  });

  it('refuses chain completion without the required beats', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertChain',
      chain: makeChain({}),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });
    state = clueReducer(state, {
      type: 'transitionChain',
      chainId: 'chain-x',
      to: 'complete',
      updatedAt: '2026-08-07T10:00:00.000Z',
    });

    expect(state.chains[0].status).toBe('needsPayoff');
  });

  it('completes a chain whose beats satisfy the guard', () => {
    let state = clueReducer(EMPTY_CLUE_STATE, {
      type: 'upsertChain',
      chain: makeChain({}),
      updatedAt: '2026-08-07T09:00:00.000Z',
    });
    state = clueReducer(state, {
      type: 'upsertBeat',
      beat: makeBeat({ beatId: 'b-plant', chainId: 'chain-x', type: 'plant', order: 1 }),
    });
    state = clueReducer(state, {
      type: 'upsertBeat',
      beat: makeBeat({ beatId: 'b-payoff', chainId: 'chain-x', type: 'payoff', order: 2 }),
    });
    state = clueReducer(state, {
      type: 'transitionChain',
      chainId: 'chain-x',
      to: 'complete',
      updatedAt: '2026-08-07T10:00:00.000Z',
    });

    expect(state.chains[0].status).toBe('complete');
    expect(state.chains[0].updatedAt).toBe('2026-08-07T10:00:00.000Z');
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/store/clueStore.test.ts`
Expected: FAIL — `transitionClue` is not assignable to `ClueAction`.

- [ ] **Step 7: Add transition actions to `clueStore.ts`**

Extend the type imports (`ClueChainStatus`, `ClueStatus`, `ForeshadowingStatus` from `../types`), add `import { checkChainTransition, checkClueTransition, checkForeshadowingTransition } from '../rules/stateMachines';`, extend `ClueAction`:

```ts
  | { type: 'transitionClue'; clueId: string; to: ClueStatus; updatedAt: string }
  | { type: 'transitionForeshadowing'; foreshadowingId: string; to: ForeshadowingStatus; updatedAt: string }
  | { type: 'transitionChain'; chainId: string; to: ClueChainStatus; updatedAt: string }
```

Append the reducer cases:

```ts
    case 'transitionClue': {
      const clue = state.clues.find((candidate) => candidate.clueId === action.clueId);
      if (!clue) return state;
      if (!checkClueTransition(clue, action.to).allowed) return state;
      return {
        ...state,
        clues: state.clues.map((candidate) =>
          candidate.clueId === action.clueId
            ? enrichClue({ ...candidate, status: action.to, updatedAt: action.updatedAt })
            : candidate,
        ),
      };
    }

    case 'transitionForeshadowing': {
      const foreshadowing = state.foreshadowings.find(
        (candidate) => candidate.foreshadowingId === action.foreshadowingId,
      );
      if (!foreshadowing) return state;
      if (!checkForeshadowingTransition(foreshadowing, action.to).allowed) return state;
      return {
        ...state,
        foreshadowings: state.foreshadowings.map((candidate) =>
          candidate.foreshadowingId === action.foreshadowingId
            ? enrichForeshadowing({ ...candidate, status: action.to, updatedAt: action.updatedAt })
            : candidate,
        ),
      };
    }

    case 'transitionChain': {
      const chain = state.chains.find((candidate) => candidate.chainId === action.chainId);
      if (!chain) return state;
      if (!checkChainTransition(chain, state.beats, action.to).allowed) return state;
      return {
        ...state,
        chains: state.chains.map((candidate) =>
          candidate.chainId === action.chainId
            ? { ...candidate, status: action.to, updatedAt: action.updatedAt }
            : candidate,
        ),
      };
    }
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm run test:web -- src/features/clue-system/store/clueStore.test.ts`
Expected: PASS.

- [ ] **Step 9: Write the failing test `ClueSystemContext.test.tsx`**

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClueSystemState } from '../types';
import { EMPTY_CLUE_STATE } from './clueStore';
import {
  ClueSystemProvider,
  useClueSystemDispatch,
  useClueSystemState,
} from './ClueSystemContext';
import { CLUE_STORAGE_KEY } from './persistence';

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

function Probe() {
  const state = useClueSystemState();
  const dispatch = useClueSystemDispatch();
  return (
    <div>
      <p data-testid="active-novel">{state.activeNovelId || 'none'}</p>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: 'createProject',
            novelId: 'novel-a',
            title: 'Novel A',
            createdAt: '2026-08-07T00:00:00.000Z',
          })
        }
      >
        Create project
      </button>
    </div>
  );
}

describe('ClueSystemProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exposes the provided initial state to consumers', () => {
    const initialState: ClueSystemState = { ...EMPTY_CLUE_STATE, activeNovelId: 'seed-novel' };
    render(
      <ClueSystemProvider initialState={initialState}>
        <Probe />
      </ClueSystemProvider>,
    );

    expect(screen.getByTestId('active-novel')).toHaveTextContent('seed-novel');
  });

  it('applies dispatched actions through the reducer', async () => {
    const user = userEvent.setup();
    render(
      <ClueSystemProvider initialState={EMPTY_CLUE_STATE}>
        <Probe />
      </ClueSystemProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Create project' }));
    expect(screen.getByTestId('active-novel')).toHaveTextContent('novel-a');
  });

  it('persists state changes after the debounce interval', () => {
    vi.useFakeTimers();
    render(
      <ClueSystemProvider initialState={EMPTY_CLUE_STATE}>
        <Probe />
      </ClueSystemProvider>,
    );

    screen.getByRole('button', { name: 'Create project' }).click();
    vi.advanceTimersByTime(400);

    const persisted = window.localStorage.getItem(CLUE_STORAGE_KEY);
    expect(persisted).not.toBeNull();
    expect(JSON.parse(persisted ?? '{}').state.activeNovelId).toBe('novel-a');
  });

  it('throws a descriptive error outside the provider', () => {
    expect(() => render(<Probe />)).toThrow('useClueSystemState must be used within ClueSystemProvider');
  });
});
```

- [ ] **Step 10: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/store/ClueSystemContext.test.tsx`
Expected: FAIL — cannot resolve `./ClueSystemContext`.

- [ ] **Step 11: Write `ClueSystemContext.tsx`**

```tsx
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { ClueSystemState } from '../types';
import { clueReducer, EMPTY_CLUE_STATE, type ClueAction } from './clueStore';
import { saveClueSystem } from './persistence';
import { initialClueState } from './seedProject';

const SAVE_DEBOUNCE_MS = 300;

const ClueStateContext = createContext<ClueSystemState | null>(null);
const ClueDispatchContext = createContext<Dispatch<ClueAction> | null>(null);

export function ClueSystemProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: ClueSystemState;
}) {
  const [state, dispatch] = useReducer(clueReducer, EMPTY_CLUE_STATE, () =>
    initialState ?? initialClueState(),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveClueSystem(state);
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  return (
    <ClueStateContext.Provider value={state}>
      <ClueDispatchContext.Provider value={dispatch}>
        {children}
      </ClueDispatchContext.Provider>
    </ClueStateContext.Provider>
  );
}

export function useClueSystemState(): ClueSystemState {
  const state = useContext(ClueStateContext);
  if (!state) throw new Error('useClueSystemState must be used within ClueSystemProvider');
  return state;
}

export function useClueSystemDispatch(): Dispatch<ClueAction> {
  const dispatch = useContext(ClueDispatchContext);
  if (!dispatch) throw new Error('useClueSystemDispatch must be used within ClueSystemProvider');
  return dispatch;
}
```

- [ ] **Step 12: Run test to verify it passes, then full suite**

Run: `npm run test:web -- src/features/clue-system/store/ClueSystemContext.test.tsx` then `npm run test:web`
Expected: PASS, full suite green.

- [ ] **Step 13: Commit**

```bash
git add apps/web/src/features/clue-system/rules/stateMachines.ts apps/web/src/features/clue-system/rules/stateMachines.test.ts apps/web/src/features/clue-system/store/clueStore.ts apps/web/src/features/clue-system/store/clueStore.test.ts apps/web/src/features/clue-system/store/ClueSystemContext.tsx apps/web/src/features/clue-system/store/ClueSystemContext.test.tsx
git commit -m "feat(clue-system): provider, guarded transition actions, timeline guard"
```

---

### Task 2: Clues navigation icon + sidebar item

**Files:**
- Create: `apps/web/src/assets/novelora/novelora_ui_asset_pack/03_icons/navigation/clues.svg`
- Modify: `apps/web/src/features/novelora-cockpit/assetRegistry.ts`
- Modify: `apps/web/src/features/novelora-cockpit/assetRegistry.test.ts`
- Modify: `apps/web/src/features/novelora-cockpit/components/ProjectSidebar.tsx`
- Modify: `apps/web/src/features/novelora-cockpit/components/ProjectSidebar.test.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `navigationIcons.clues` (string URL); sidebar nav item "Clues" between "Inspiration" and "AI Review".

- [ ] **Step 1: Update the failing tests first**

In `assetRegistry.test.ts`: add `'../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/clues.svg',` to `navigationSourcePaths` (keep alphabetical order: after `characters.svg`) and change `expect(navigationSourcePaths).toHaveLength(7);` to `expect(navigationSourcePaths).toHaveLength(8);`.

In `ProjectSidebar.test.tsx`: change `navigationLabels` to:

```ts
const navigationLabels = [
  'Home',
  'Structure',
  'Characters',
  'Worldbuilding',
  'Inspiration',
  'Clues',
  'AI Review',
  'Projects',
];
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:web -- src/features/novelora-cockpit/assetRegistry.test.ts src/features/novelora-cockpit/components/ProjectSidebar.test.tsx`
Expected: FAIL — missing clues.svg file / nav order mismatch.

- [ ] **Step 3: Create the icon and register it**

Create `clues.svg` (pack style: 32×32 rounded rect tile, palette hexes only):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">

<rect x="1" y="1" width="30" height="30" rx="10" fill="#F7FBF9" stroke="#CFE8DD" stroke-width="1.4"/>
<circle cx="9" cy="10" r="3" stroke="#0AA85B" stroke-width="2"/>
<circle cx="23" cy="10" r="3" stroke="#0AA85B" stroke-width="2"/>
<circle cx="16" cy="23" r="3" stroke="#0AA85B" stroke-width="2"/>
<path d="M12 10h8M10 12.6l4.5 7.4M22 12.6l-4.5 7.4" stroke="#0AA85B" stroke-width="2" stroke-linecap="round"/>

</svg>
```

In `assetRegistry.ts`, inside `navigationIcons`, add after `characters`:

```ts
    clues: new URL(
      '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/clues.svg',
      import.meta.url,
    ).href,
```

In `ProjectSidebar.tsx` `navigationItems`, insert after the Inspiration entry:

```ts
  { label: 'Clues', icon: navigationIcons.clues },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:web -- src/features/novelora-cockpit/assetRegistry.test.ts src/features/novelora-cockpit/components/ProjectSidebar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/assets/novelora/novelora_ui_asset_pack/03_icons/navigation/clues.svg apps/web/src/features/novelora-cockpit/assetRegistry.ts apps/web/src/features/novelora-cockpit/assetRegistry.test.ts apps/web/src/features/novelora-cockpit/components/ProjectSidebar.tsx apps/web/src/features/novelora-cockpit/components/ProjectSidebar.test.tsx
git commit -m "feat(clue-system): clues navigation icon and sidebar item"
```

---

### Task 3: Workspace switch + shell + overview + clues.css scaffolding

**Files:**
- Create: `apps/web/src/features/clue-system/components/selection.ts`
- Create: `apps/web/src/features/clue-system/components/ClueOverview.tsx`
- Test: `apps/web/src/features/clue-system/components/ClueOverview.test.tsx`
- Create: `apps/web/src/features/clue-system/components/ClueWorkspace.tsx`
- Create: `apps/web/src/styles/clues.css`
- Modify: `apps/web/src/styles/global.css` (add import)
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/App.test.tsx`

**Interfaces:**
- Consumes: Task 1 provider/hooks.
- Produces: `SelectedObject` (`{ kind: 'clue' | 'foreshadowing' | 'hiddenThread' | 'redHerring' | 'chain'; id: string }`) in `selection.ts`; `ClueWorkspace` component; App shows `<ClueSystemProvider><ClueWorkspace /></ClueSystemProvider>` in `cockpit-main` when the sidebar's active item is `Clues`; `ClueOverview` (used by ClueWorkspace when nothing is selected).

- [ ] **Step 1: Write the failing test `ClueOverview.test.tsx`**

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildSeedState } from '../store/seedProject';
import { ClueSystemProvider } from '../store/ClueSystemContext';
import { ClueOverview } from './ClueOverview';

function renderOverview() {
  return render(
    <ClueSystemProvider initialState={buildSeedState()}>
      <ClueOverview />
    </ClueSystemProvider>,
  );
}

describe('ClueOverview', () => {
  it('renders the six overview cards with seed counts', () => {
    renderOverview();

    expect(screen.getByRole('heading', { name: 'Clue overview' })).toBeVisible();
    expect(screen.getByText('Clues').parentElement).toHaveTextContent('2');
    expect(screen.getByText('Unpaid foreshadowings').parentElement).toHaveTextContent('2');
    expect(screen.getByText('High-risk objects').parentElement).toHaveTextContent('1');
    expect(screen.getByText('Missing attribution').parentElement).toHaveTextContent('0');
    expect(screen.getByText('Active hidden threads').parentElement).toHaveTextContent('1');
    expect(screen.getByText('Active red herrings').parentElement).toHaveTextContent('1');
  });

  it('counts only objects of the active novel', () => {
    const state = buildSeedState();
    const withForeign = {
      ...state,
      clues: [
        ...state.clues,
        { ...state.clues[0], clueId: 'foreign-clue', novelId: 'novel-y' },
      ],
    };
    render(
      <ClueSystemProvider initialState={withForeign}>
        <ClueOverview />
      </ClueSystemProvider>,
    );

    expect(screen.getByText('Clues').parentElement).toHaveTextContent('2');
  });
});
```

Note: this test renders `ClueSystemProvider`, which loads from localStorage only when no `initialState` is given — provided here, so no localStorage stub needed.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/components/ClueOverview.test.tsx`
Expected: FAIL — cannot resolve `./ClueOverview`.

- [ ] **Step 3: Create `selection.ts` and `ClueOverview.tsx`**

`selection.ts`:

```ts
export type SelectedObjectKind = 'clue' | 'foreshadowing' | 'hiddenThread' | 'redHerring' | 'chain';

export interface SelectedObject {
  kind: SelectedObjectKind;
  id: string;
}
```

`ClueOverview.tsx`:

```tsx
import { findUnpaidForeshadowings } from '../rules/risk';
import { useClueSystemState } from '../store/ClueSystemContext';

export function ClueOverview() {
  const state = useClueSystemState();
  const { activeNovelId } = state;

  const clues = state.clues.filter((clue) => clue.novelId === activeNovelId);
  const foreshadowings = state.foreshadowings.filter(
    (foreshadowing) => foreshadowing.novelId === activeNovelId,
  );
  const unpaidForeshadowings = findUnpaidForeshadowings(state, activeNovelId);
  const highRiskCount =
    clues.filter((clue) => clue.riskLevel === 'high').length +
    foreshadowings.filter((foreshadowing) => foreshadowing.riskLevel === 'high').length;
  const missingAttributionCount = clues.filter(
    (clue) => clue.missingFields.length > 0,
  ).length;
  const activeThreads = state.hiddenThreads.filter(
    (thread) => thread.novelId === activeNovelId && thread.status === 'active',
  );
  const activeHerrings = state.redHerrings.filter(
    (herring) => herring.novelId === activeNovelId && herring.status === 'active',
  );

  const cards = [
    { label: 'Clues', value: clues.length },
    { label: 'Unpaid foreshadowings', value: unpaidForeshadowings.length },
    { label: 'High-risk objects', value: highRiskCount },
    { label: 'Missing attribution', value: missingAttributionCount },
    { label: 'Active hidden threads', value: activeThreads.length },
    { label: 'Active red herrings', value: activeHerrings.length },
  ];

  return (
    <section className="clue-overview" aria-label="Clue overview">
      <h2>Clue overview</h2>
      <ul className="clue-overview__grid">
        {cards.map((card) => (
          <li className="clue-overview__card" key={card.label}>
            <strong>{card.value}</strong>
            <span>{card.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:web -- src/features/clue-system/components/ClueOverview.test.tsx`
Expected: PASS.

- [ ] **Step 5: Append the failing App-level workspace-switch test to `App.test.tsx`**

```tsx
  it('switches between the cockpit and the clue workspace from navigation', async () => {
    const user = userEvent.setup();
    render(<App />);

    const navigation = screen.getByRole('navigation', { name: 'Workspace navigation' });
    await user.click(within(navigation).getByRole('button', { name: 'Clues' }));

    expect(screen.getByRole('region', { name: 'Clue project controls' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Clue overview' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Novel Structure Map' })).toBeNull();

    await user.click(within(navigation).getByRole('button', { name: 'Home' }));
    expect(screen.queryByRole('heading', { name: 'Clue overview' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Novel Structure Map' })).toBeTruthy();
  });
```

(App falls back to seed data because `loadClueSystem()` catches the unavailable-localStorage error — verified behavior in P1's environment.)

- [ ] **Step 6: Run test to verify it fails**

Run: `npm run test:web -- src/App.test.tsx`
Expected: FAIL — no `Clue project controls` region (the existing 9 tests must stay green).

- [ ] **Step 7: Create `ClueWorkspace.tsx`, `clues.css`, wire `global.css` and `App.tsx`**

`ClueWorkspace.tsx`:

```tsx
import { useState } from 'react';
import { useClueSystemState } from '../store/ClueSystemContext';
import { ClueOverview } from './ClueOverview';
import type { SelectedObject } from './selection';

export function ClueWorkspace() {
  const state = useClueSystemState();
  const [selectedObject] = useState<SelectedObject | null>(null);

  const activeProject = state.projects.find(
    (project) => project.novelId === state.activeNovelId,
  );

  return (
    <div className="clue-workspace">
      <div className="clue-workspace__topbar" role="region" aria-label="Clue project controls">
        <p className="clue-workspace__project-title">{activeProject?.title ?? 'No project'}</p>
      </div>
      <div className="clue-workspace__body">
        <main className="clue-workspace__detail" aria-label="Clue details">
          {selectedObject === null ? <ClueOverview /> : null}
        </main>
      </div>
    </div>
  );
}
```

(The `selectedObject` state becomes writable in Task 5; declaring it now keeps the layout stable.)

Create `apps/web/src/styles/clues.css`:

```css
.clue-workspace {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  color: var(--color-ink);
  font-family: var(--font-ui);
}

.clue-workspace__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.clue-workspace__project-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
}

.clue-workspace__body {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 16px;
}

.clue-workspace__detail {
  min-width: 0;
}

.clue-overview__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.clue-overview__card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-mint-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.clue-overview__card strong {
  color: var(--color-mint-primary);
  font-size: 1.5rem;
}

.clue-overview__card span {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

@media (prefers-reduced-motion: reduce) {
  .clue-workspace * {
    transition: none;
    animation: none;
  }
}
```

In `global.css`, add after the echo import:

```css
@import './clues.css';
```

In `App.tsx`:
- Add imports:

```tsx
import { ClueSystemProvider } from './features/clue-system/store/ClueSystemContext';
import { ClueWorkspace } from './features/clue-system/components/ClueWorkspace';
```

- Inside `App()`, after the existing state declarations, add:

```tsx
  const showClueWorkspace = activeNavigation === 'Clues';
```

- In the `AppShell` children, replace the `<div className="echo-dashboard">...</div>` block with:

```tsx
        {showClueWorkspace ? (
          <ClueSystemProvider>
            <ClueWorkspace />
          </ClueSystemProvider>
        ) : (
        <div className="echo-dashboard">
          ...existing content unchanged...
        </div>
        )}
```

(Keep the existing dashboard JSX exactly as-is inside the conditional; only the wrapper changes.)

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm run test:web -- src/App.test.tsx` then full `npm run test:web`
Expected: PASS; full suite green.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/features/clue-system/components/selection.ts apps/web/src/features/clue-system/components/ClueOverview.tsx apps/web/src/features/clue-system/components/ClueOverview.test.tsx apps/web/src/features/clue-system/components/ClueWorkspace.tsx apps/web/src/styles/clues.css apps/web/src/styles/global.css apps/web/src/App.tsx apps/web/src/App.test.tsx
git commit -m "feat(clue-system): workspace switch, shell layout, overview cards"
```

---

### Task 4: Project bar

**Files:**
- Create: `apps/web/src/features/clue-system/components/ClueProjectBar.tsx`
- Test: `apps/web/src/features/clue-system/components/ClueProjectBar.test.tsx`
- Modify: `apps/web/src/features/clue-system/components/ClueWorkspace.tsx` (use it in the topbar)
- Modify: `apps/web/src/styles/clues.css`

**Interfaces:**
- Consumes: Task 1 provider/hooks, Task 3 shell.
- Produces: `ClueProjectBar` — project `<select>` bound to `setActiveNovel`, inline "New project" create form dispatching `createProject` (id `crypto.randomUUID()`, `new Date().toISOString()`), static `LLM: not configured` status text (P3 wires the real status).

- [ ] **Step 1: Write the failing test `ClueProjectBar.test.tsx`**

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { buildSeedState } from '../store/seedProject';
import { ClueSystemProvider } from '../store/ClueSystemContext';
import { ClueProjectBar } from './ClueProjectBar';

function renderBar() {
  return render(
    <ClueSystemProvider initialState={buildSeedState()}>
      <ClueProjectBar />
    </ClueSystemProvider>,
  );
}

describe('ClueProjectBar', () => {
  it('shows the active project and a static LLM status', () => {
    renderBar();

    expect(screen.getByRole('region', { name: 'Clue project controls' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Project' })).toHaveValue('tides-of-embers');
    expect(screen.getByText('LLM: not configured')).toBeVisible();
  });

  it('creates a new project and switches to it', async () => {
    const user = userEvent.setup();
    renderBar();

    await user.click(screen.getByRole('button', { name: 'New project' }));
    await user.type(screen.getByRole('textbox', { name: 'Project title' }), 'Empty Novel');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const select = screen.getByRole('combobox', { name: 'Project' });
    const selectedOption = Array.from(select.querySelectorAll('option')).find(
      (option) => option.selected,
    );
    expect(selectedOption?.textContent).toBe('Empty Novel');
    expect(screen.getByRole('textbox', { name: 'Project title' }).querySelector('input')).toBeNull();
  });

  it('cancels creation without creating a project', async () => {
    const user = userEvent.setup();
    renderBar();

    await user.click(screen.getByRole('button', { name: 'New project' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('textbox', { name: 'Project title' })).toBeNull();
    expect(screen.getByRole('combobox', { name: 'Project' })).toHaveValue('tides-of-embers');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/components/ClueProjectBar.test.tsx`
Expected: FAIL — cannot resolve `./ClueProjectBar`.

- [ ] **Step 3: Create `ClueProjectBar.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { useClueSystemDispatch, useClueSystemState } from '../store/ClueSystemContext';

export function ClueProjectBar() {
  const state = useClueSystemState();
  const dispatch = useClueSystemDispatch();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');

  function createProject(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    dispatch({
      type: 'createProject',
      novelId: crypto.randomUUID(),
      title: trimmed,
      createdAt: new Date().toISOString(),
    });
    setTitle('');
    setIsCreating(false);
  }

  return (
    <div className="clue-project-bar" role="region" aria-label="Clue project controls">
      <label className="clue-project-bar__field">
        Project
        <select
          value={state.activeNovelId}
          onChange={(event) =>
            dispatch({ type: 'setActiveNovel', novelId: event.target.value })
          }
        >
          {state.projects.map((project) => (
            <option key={project.novelId} value={project.novelId}>
              {project.title}
            </option>
          ))}
        </select>
      </label>

      {isCreating ? (
        <form className="clue-project-bar__create" onSubmit={createProject}>
          <label>
            Project title
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <button type="submit">Create</button>
          <button type="button" onClick={() => setIsCreating(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setIsCreating(true)}>
          New project
        </button>
      )}

      <span className="clue-project-bar__llm" aria-label="LLM status">
        LLM: not configured
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Wire into `ClueWorkspace.tsx` and add CSS**

In `ClueWorkspace.tsx`, replace the topbar div's inner `<p className="clue-workspace__project-title">...</p>` with `<ClueProjectBar />` and add the import. The topbar keeps `role="region" aria-label="Clue project controls"` on the outer div — remove that from the outer div since `ClueProjectBar` now carries it (avoid duplicate regions with the same name).

Append to `clues.css`:

```css
.clue-project-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.clue-project-bar__field,
.clue-project-bar__create label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.clue-project-bar__create {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clue-project-bar__llm {
  margin-left: auto;
  color: var(--color-text-subtle);
  font-size: 0.8rem;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:web -- src/features/clue-system/components/ClueProjectBar.test.tsx src/App.test.tsx`
Expected: PASS (App test still finds exactly one `Clue project controls` region).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/clue-system/components/ClueProjectBar.tsx apps/web/src/features/clue-system/components/ClueProjectBar.test.tsx apps/web/src/features/clue-system/components/ClueWorkspace.tsx apps/web/src/styles/clues.css
git commit -m "feat(clue-system): project bar with create and switch"
```

---

### Task 5: Object list with tabs, filters, selection

**Files:**
- Create: `apps/web/src/features/clue-system/components/ClueObjectList.tsx`
- Test: `apps/web/src/features/clue-system/components/ClueObjectList.test.tsx`
- Modify: `apps/web/src/features/clue-system/components/ClueWorkspace.tsx` (list column + writable selection)
- Modify: `apps/web/src/styles/clues.css`

**Interfaces:**
- Consumes: provider/hooks, `SelectedObject` from `./selection`.
- Produces: `ClueObjectList({ selectedObject, onSelect }: { selectedObject: SelectedObject | null; onSelect: (selection: SelectedObject) => void })`. Tabs: Clues / Foreshadowings / Hidden threads / Red herrings (`role="tab"`, `aria-selected`); status and risk `<select>` filters; item buttons with `aria-pressed`; empty-filter message. `ClueWorkspace` owns `selectedObject` state and passes callbacks.

- [ ] **Step 1: Write the failing test `ClueObjectList.test.tsx`**

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { buildSeedState } from '../store/seedProject';
import { ClueSystemProvider } from '../store/ClueSystemContext';
import { ClueObjectList } from './ClueObjectList';

function renderList(onSelect = vi.fn(), selectedObject = null) {
  render(
    <ClueSystemProvider initialState={buildSeedState()}>
      <ClueObjectList selectedObject={selectedObject} onSelect={onSelect} />
    </ClueSystemProvider>,
  );
  return onSelect;
}

describe('ClueObjectList', () => {
  it('shows seed clues by default with status and risk badges', () => {
    renderList();

    const list = screen.getByRole('list', { name: 'Object entries' });
    const items = within(list).getAllByRole('button');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('The old tide map');
    expect(items[0]).toHaveTextContent('paidOff');
    expect(items[1]).toHaveTextContent('The false-harbor sigil');
    expect(items[1]).toHaveTextContent('active');
  });

  it('switches tabs to foreshadowings, hidden threads and red herrings', async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole('tab', { name: 'Foreshadowings' }));
    expect(screen.getByText('The drowned forge threshold')).toBeTruthy();
    expect(screen.getByText('Selene’s reef bargain')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Hidden threads' }));
    expect(screen.getByText('The rewritten harbor registry')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Red herrings' }));
    expect(screen.getByText('The rescue beacon')).toBeTruthy();
  });

  it('filters entries by risk level', async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole('tab', { name: 'Foreshadowings' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Risk' }), 'high');

    expect(screen.getByText('The drowned forge threshold')).toBeTruthy();
    expect(screen.queryByText('Selene’s reef bargain')).toBeNull();
  });

  it('reports selection and marks the selected entry', async () => {
    const user = userEvent.setup();
    const onSelect = renderList();

    await user.click(screen.getByText('The old tide map'));
    expect(onSelect).toHaveBeenCalledWith({ kind: 'clue', id: 'clue-old-tide-map' });

    render(
      <ClueSystemProvider initialState={buildSeedState()}>
        <ClueObjectList
          selectedObject={{ kind: 'clue', id: 'clue-old-tide-map' }}
          onSelect={vi.fn()}
        />
      </ClueSystemProvider>,
    );
    expect(screen.getAllByText('The old tide map')[1].closest('button')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('hides entries from other novels', async () => {
    const user = userEvent.setup();
    const state = buildSeedState();
    const withForeign = {
      ...state,
      clues: [...state.clues, { ...state.clues[0], clueId: 'foreign', novelId: 'novel-y', title: 'Foreign clue' }],
    };
    render(
      <ClueSystemProvider initialState={withForeign}>
        <ClueObjectList selectedObject={null} onSelect={vi.fn()} />
      </ClueSystemProvider>,
    );

    expect(screen.queryByText('Foreign clue')).toBeNull();
    await user.click(screen.getByRole('tab', { name: 'Hidden threads' }));
    expect(screen.getByRole('list', { name: 'Object entries' })).toHaveTextContent(
      'The rewritten harbor registry',
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/components/ClueObjectList.test.tsx`
Expected: FAIL — cannot resolve `./ClueObjectList`.

- [ ] **Step 3: Create `ClueObjectList.tsx`**

```tsx
import { useState } from 'react';
import type { RiskLevel } from '../types';
import { useClueSystemState } from '../store/ClueSystemContext';
import type { SelectedObject, SelectedObjectKind } from './selection';

const TABS: ReadonlyArray<{ kind: SelectedObjectKind; label: string }> = [
  { kind: 'clue', label: 'Clues' },
  { kind: 'foreshadowing', label: 'Foreshadowings' },
  { kind: 'hiddenThread', label: 'Hidden threads' },
  { kind: 'redHerring', label: 'Red herrings' },
];

interface ListEntry {
  id: string;
  title: string;
  status: string;
  riskLevel: RiskLevel;
}

export function ClueObjectList({
  selectedObject,
  onSelect,
}: {
  selectedObject: SelectedObject | null;
  onSelect: (selection: SelectedObject) => void;
}) {
  const state = useClueSystemState();
  const [activeKind, setActiveKind] = useState<SelectedObjectKind>('clue');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  const { activeNovelId } = state;

  const entries: ListEntry[] = (() => {
    switch (activeKind) {
      case 'clue':
        return state.clues
          .filter((clue) => clue.novelId === activeNovelId)
          .map((clue) => ({
            id: clue.clueId,
            title: clue.title,
            status: clue.status,
            riskLevel: clue.riskLevel,
          }));
      case 'foreshadowing':
        return state.foreshadowings
          .filter((foreshadowing) => foreshadowing.novelId === activeNovelId)
          .map((foreshadowing) => ({
            id: foreshadowing.foreshadowingId,
            title: foreshadowing.title,
            status: foreshadowing.status,
            riskLevel: foreshadowing.riskLevel,
          }));
      case 'hiddenThread':
        return state.hiddenThreads
          .filter((thread) => thread.novelId === activeNovelId)
          .map((thread) => ({
            id: thread.hiddenThreadId,
            title: thread.title,
            status: thread.status,
            riskLevel: 'none' as RiskLevel,
          }));
      case 'redHerring':
        return state.redHerrings
          .filter((herring) => herring.novelId === activeNovelId)
          .map((herring) => ({
            id: herring.redHerringId,
            title: herring.title,
            status: herring.status,
            riskLevel: 'none' as RiskLevel,
          }));
      default:
        return [];
    }
  })();

  const visibleEntries = entries.filter(
    (entry) =>
      (statusFilter === 'all' || entry.status === statusFilter) &&
      (riskFilter === 'all' || entry.riskLevel === riskFilter),
  );

  const statusOptions = Array.from(new Set(entries.map((entry) => entry.status)));

  return (
    <section className="clue-object-list" aria-label="Clue objects">
      <div className="clue-object-list__tabs" role="tablist" aria-label="Object kinds">
        {TABS.map((tab) => (
          <button
            key={tab.kind}
            type="button"
            role="tab"
            aria-selected={activeKind === tab.kind}
            onClick={() => setActiveKind(tab.kind)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="clue-object-list__filters">
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Risk
          <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
            <option value="all">All risk levels</option>
            {(['none', 'low', 'medium', 'high'] as RiskLevel[]).map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="clue-object-list__items" aria-label="Object entries">
        {visibleEntries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              className="clue-object-list__item"
              aria-pressed={
                selectedObject?.kind === activeKind && selectedObject.id === entry.id
              }
              onClick={() => onSelect({ kind: activeKind, id: entry.id })}
            >
              <span className="clue-object-list__title">{entry.title}</span>
              <span className="clue-object-list__badges">
                <span data-badge="status">{entry.status}</span>
                <span data-badge="risk">{entry.riskLevel}</span>
              </span>
            </button>
          </li>
        ))}
        {visibleEntries.length === 0 ? (
          <li className="clue-object-list__empty">No objects match the current filters.</li>
        ) : null}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:web -- src/features/clue-system/components/ClueObjectList.test.tsx`
Expected: PASS.

- [ ] **Step 5: Wire into `ClueWorkspace.tsx` and add CSS**

In `ClueWorkspace.tsx`:
- Import `ClueObjectList` and `useClueSystemDispatch` is NOT needed; change the state declaration to `const [selectedObject, setSelectedObject] = useState<SelectedObject | null>(null);`.
- Inside `.clue-workspace__body`, before `<main>`, add:

```tsx
        <ClueObjectList selectedObject={selectedObject} onSelect={setSelectedObject} />
```

Append to `clues.css`:

```css
.clue-object-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.clue-object-list__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.clue-object-list__tabs [role='tab'] {
  padding: 6px 10px;
  border: 1px solid var(--color-mint-line);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-text-muted);
}

.clue-object-list__tabs [role='tab'][aria-selected='true'] {
  border-color: var(--color-mint-primary);
  color: var(--color-mint-primary);
}

.clue-object-list__filters {
  display: flex;
  gap: 8px;
}

.clue-object-list__filters label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.clue-object-list__items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.clue-object-list__item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  text-align: left;
  background: var(--color-surface);
  border: 1px solid var(--color-mint-line);
  border-radius: var(--radius-card);
}

.clue-object-list__item[aria-pressed='true'] {
  border-color: var(--color-mint-primary);
}

.clue-object-list__badges {
  display: flex;
  gap: 6px;
}

.clue-object-list__badges [data-badge] {
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-mint-soft);
  color: var(--color-ink);
  font-size: 0.72rem;
}

.clue-object-list__empty {
  color: var(--color-text-subtle);
}
```

- [ ] **Step 6: Run tests, then full suite, then commit**

Run: `npm run test:web -- src/features/clue-system/components/ClueObjectList.test.tsx src/App.test.tsx` then `npm run test:web`
Expected: PASS; full suite green.

```bash
git add apps/web/src/features/clue-system/components/ClueObjectList.tsx apps/web/src/features/clue-system/components/ClueObjectList.test.tsx apps/web/src/features/clue-system/components/ClueWorkspace.tsx apps/web/src/styles/clues.css
git commit -m "feat(clue-system): object list with tabs, filters, selection"
```

### Task 6: Clue detail editor — core fields + status transitions

**Files:**
- Create: `apps/web/src/features/clue-system/components/ClueDetailEditor.tsx`
- Test: `apps/web/src/features/clue-system/components/ClueDetailEditor.test.tsx`
- Modify: `apps/web/src/features/clue-system/components/ClueWorkspace.tsx` (route clue selections)
- Modify: `apps/web/src/styles/clues.css`

**Interfaces:**
- Consumes: provider/hooks, `checkClueTransition`, `noveloraMockProject` (chapter options).
- Produces: `ClueDetailEditor({ clueId }: { clueId: string })` — title/content/type/credibility/readerVisibility/firstAppearanceChapterId form (local state, Save dispatches `upsertClue` with `updatedAt: new Date().toISOString()`), status transition buttons (one per other `ClueStatus`, enabled only when `checkClueTransition(clue, to).allowed`, disabled buttons carry `data-denial-reason` and `title`), missingFields chips, risk badge. `ClueWorkspace` renders it for `selectedObject.kind === 'clue'` with `key={selectedObject.id}` (resets local state on selection change).

- [ ] **Step 1: Write the failing test `ClueDetailEditor.test.tsx`**

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Clue } from '../types';
import { emptyAttribution } from '../rules/attribution';
import { buildSeedState } from '../store/seedProject';
import { ClueSystemProvider } from '../store/ClueSystemContext';
import { ClueDetailEditor } from './ClueDetailEditor';

function makeDraftClue(): Clue {
  return {
    clueId: 'clue-draft',
    novelId: 'tides-of-embers',
    title: 'Draft clue',
    content: 'Uncommitted',
    type: 'evidence',
    status: 'draft',
    credibility: 'unknown',
    readerVisibility: 'hinted',
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
  };
}

function renderEditor(clueId: string, extraClues: Clue[] = []) {
  const state = buildSeedState();
  return render(
    <ClueSystemProvider initialState={{ ...state, clues: [...state.clues, ...extraClues] }}>
      <ClueDetailEditor clueId={clueId} />
    </ClueSystemProvider>,
  );
}

describe('ClueDetailEditor', () => {
  it('edits the title and saves through the store', async () => {
    const user = userEvent.setup();
    renderEditor('clue-false-harbor-sigil');

    const titleInput = screen.getByRole('textbox', { name: 'Title' });
    await user.clear(titleInput);
    await user.type(titleInput, 'The harbor sigil');
    await user.click(screen.getByRole('button', { name: 'Save clue' }));

    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('The harbor sigil');
  });

  it('shows missing-field chips and the risk badge for an unattributed draft', () => {
    renderEditor('clue-draft', [makeDraftClue()]);

    expect(screen.getByText('providerCharacterId')).toBeTruthy();
    expect(screen.getByText('triggerCharacterId')).toBeTruthy();
    expect(screen.getByText('receiverCharacterId')).toBeTruthy();
  });

  it('disables guarded transitions with a denial reason and allows discard', async () => {
    const user = userEvent.setup();
    renderEditor('clue-draft', [makeDraftClue()]);

    const plantButton = screen.getByRole('button', { name: 'Mark planted' });
    expect(plantButton).toBeDisabled();
    expect(plantButton).toHaveAttribute('data-denial-reason', 'missingAttribution');

    await user.click(screen.getByRole('button', { name: 'Mark discarded' }));
    expect(screen.getByText('discarded')).toBeTruthy();
  });

  it('offers legal transitions for the active sigil clue', () => {
    renderEditor('clue-false-harbor-sigil');

    expect(screen.getByRole('button', { name: 'Mark misleading' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Mark revealed' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Mark planted' })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/components/ClueDetailEditor.test.tsx`
Expected: FAIL — cannot resolve `./ClueDetailEditor`.

- [ ] **Step 3: Create `ClueDetailEditor.tsx`**

```tsx
import { useState } from 'react';
import { noveloraMockProject } from '../../novelora-cockpit/data/noveloraMockProject';
import { checkClueTransition } from '../rules/stateMachines';
import { useClueSystemDispatch, useClueSystemState } from '../store/ClueSystemContext';
import type { ClueStatus, ClueType, Credibility, ReaderVisibility } from '../types';

const CLUE_STATUSES: ClueStatus[] = [
  'draft', 'planted', 'active', 'misleading', 'revealed', 'paidOff', 'discarded',
];

const CLUE_TYPES: ClueType[] = [
  'evidence', 'testimony', 'object', 'behavior', 'memory',
  'worldRule', 'relationship', 'location', 'symbol', 'redHerring',
];

const CREDIBILITIES: Credibility[] = ['true', 'partial', 'false', 'unknown'];
const VISIBILITIES: ReaderVisibility[] = ['hidden', 'hinted', 'visible', 'misleading'];

const STATUS_LABELS: Partial<Record<ClueStatus, string>> = {
  planted: 'Mark planted',
  active: 'Mark active',
  misleading: 'Mark misleading',
  revealed: 'Mark revealed',
  paidOff: 'Mark paidOff',
  discarded: 'Mark discarded',
};

export function ClueDetailEditor({ clueId }: { clueId: string }) {
  const state = useClueSystemState();
  const dispatch = useClueSystemDispatch();
  const clue = state.clues.find((candidate) => candidate.clueId === clueId);

  const [title, setTitle] = useState(clue?.title ?? '');
  const [content, setContent] = useState(clue?.content ?? '');
  const [clueType, setClueType] = useState<ClueType>(clue?.type ?? 'evidence');
  const [credibility, setCredibility] = useState<Credibility>(clue?.credibility ?? 'unknown');
  const [visibility, setVisibility] = useState<ReaderVisibility>(
    clue?.readerVisibility ?? 'hinted',
  );
  const [firstChapter, setFirstChapter] = useState(clue?.firstAppearanceChapterId ?? '');

  if (!clue) {
    return <p className="clue-editor__missing">This clue no longer exists.</p>;
  }

  function saveClue() {
    if (!clue) return;
    dispatch({
      type: 'upsertClue',
      clue: {
        ...clue,
        title: title.trim() || clue.title,
        content,
        type: clueType,
        credibility,
        readerVisibility: visibility,
        firstAppearanceChapterId: firstChapter || null,
      },
      updatedAt: new Date().toISOString(),
    });
  }

  function transitionTo(target: ClueStatus) {
    if (!clue) return;
    dispatch({
      type: 'transitionClue',
      clueId: clue.clueId,
      to: target,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <section className="clue-editor" aria-label="Clue editor">
      <header className="clue-editor__header">
        <h2>{clue.title}</h2>
        <span className="clue-editor__badges">
          <span data-badge="status">{clue.status}</span>
          <span data-badge="risk">{clue.riskLevel}</span>
        </span>
      </header>

      {clue.missingFields.length > 0 ? (
        <ul className="clue-editor__missing-fields" aria-label="Missing fields">
          {clue.missingFields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
      ) : null}

      <div className="clue-editor__form">
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Content
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} />
        </label>
        <label>
          Type
          <select value={clueType} onChange={(event) => setClueType(event.target.value as ClueType)}>
            {CLUE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          Credibility
          <select
            value={credibility}
            onChange={(event) => setCredibility(event.target.value as Credibility)}
          >
            {CREDIBILITIES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Reader visibility
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as ReaderVisibility)}
          >
            {VISIBILITIES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          First appearance chapter
          <select value={firstChapter} onChange={(event) => setFirstChapter(event.target.value)}>
            <option value="">Not set</option>
            {noveloraMockProject.chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={saveClue}>
          Save clue
        </button>
      </div>

      <div className="clue-editor__transitions" aria-label="Status transitions">
        {CLUE_STATUSES.filter((target) => target !== clue.status).map((target) => {
          const result = checkClueTransition(clue, target);
          return (
            <button
              key={target}
              type="button"
              disabled={!result.allowed}
              data-denial-reason={result.reason ?? undefined}
              title={result.reason ?? undefined}
              onClick={() => transitionTo(target)}
            >
              {STATUS_LABELS[target] ?? `Mark ${target}`}
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Wire into `ClueWorkspace.tsx` and add CSS**

In `ClueWorkspace.tsx` detail area:

```tsx
          {selectedObject === null ? (
            <ClueOverview />
          ) : selectedObject.kind === 'clue' ? (
            <ClueDetailEditor key={selectedObject.id} clueId={selectedObject.id} />
          ) : null}
```

Append to `clues.css`:

```css
.clue-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.clue-editor__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.clue-editor__header h2 {
  margin: 0;
  font-family: var(--font-display);
}

.clue-editor__badges,
.clue-editor__transitions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.clue-editor__badges [data-badge] {
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-mint-soft);
  font-size: 0.72rem;
}

.clue-editor__missing-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.clue-editor__missing-fields li {
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-state-warning);
  color: var(--color-ink);
  font-size: 0.75rem;
}

.clue-editor__form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.clue-editor__form label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.clue-editor__form button {
  justify-self: start;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:web -- src/features/clue-system/components/ClueDetailEditor.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/clue-system/components/ClueDetailEditor.tsx apps/web/src/features/clue-system/components/ClueDetailEditor.test.tsx apps/web/src/features/clue-system/components/ClueWorkspace.tsx apps/web/src/styles/clues.css
git commit -m "feat(clue-system): clue detail editor with guarded transitions"
```

---

### Task 7: Attribution editor + beat timeline

**Files:**
- Create: `apps/web/src/features/clue-system/components/ClueAttributionEditor.tsx`
- Test: `apps/web/src/features/clue-system/components/ClueAttributionEditor.test.tsx`
- Create: `apps/web/src/features/clue-system/components/ClueBeatTimeline.tsx`
- Test: `apps/web/src/features/clue-system/components/ClueBeatTimeline.test.tsx`
- Modify: `apps/web/src/features/clue-system/components/ClueDetailEditor.tsx` (embed both)
- Modify: `apps/web/src/styles/clues.css`

**Interfaces:**
- Consumes: provider/hooks, `noveloraMockProject` characters/chapters.
- Produces:
  - `ClueAttributionEditor({ clue }: { clue: Clue })` — selects for provider/trigger/receiver/concealer/misleader/payoffCharacter (fixture characters + empty option), observer checkbox group, payoff chapter select, mechanism input; Save dispatches `upsertClue` with the new attribution.
  - `ClueBeatTimeline({ clue }: { clue: Clue })` — beats for this clue sorted by `order`, each row: type badge, chapter title, summary, Delete button, move up/down buttons; add form (type select, chapter select, summary input, order = max existing + 1). Deletion dispatches `deleteBeat`; move swaps `order` values via two `upsertBeat` dispatches.
  - `ClueDetailEditor` renders both below the form (`<ClueAttributionEditor clue={clue} />`, `<ClueBeatTimeline clue={clue} />`).

- [ ] **Step 1: Write the failing test `ClueAttributionEditor.test.tsx`**

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { buildSeedState } from '../store/seedProject';
import { ClueSystemProvider } from '../store/ClueSystemContext';
import { ClueAttributionEditor } from './ClueAttributionEditor';

function renderAttribution(clueId: string) {
  const state = buildSeedState();
  const clue = state.clues.find((candidate) => candidate.clueId === clueId);
  if (!clue) throw new Error(`missing seed clue ${clueId}`);
  return render(
    <ClueSystemProvider initialState={state}>
      <ClueAttributionEditor clue={clue} />
    </ClueSystemProvider>,
  );
}

describe('ClueAttributionEditor', () => {
  it('shows the current attribution roles', () => {
    renderAttribution('clue-false-harbor-sigil');

    expect(screen.getByRole('combobox', { name: 'Provider' })).toHaveValue('arden');
    expect(screen.getByRole('combobox', { name: 'Trigger' })).toHaveValue('arden');
    expect(screen.getByRole('combobox', { name: 'Receiver' })).toHaveValue('liora');
    expect(screen.getByRole('combobox', { name: 'Payoff chapter' })).toHaveValue('');
  });

  it('saves a new payoff chapter through the store', async () => {
    const user = userEvent.setup();
    renderAttribution('clue-false-harbor-sigil');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Payoff chapter' }), 'chapter-6');
    await user.click(screen.getByRole('button', { name: 'Save attribution' }));

    expect(screen.getByRole('combobox', { name: 'Payoff chapter' })).toHaveValue('chapter-6');
  });

  it('toggles observers via checkboxes', async () => {
    const user = userEvent.setup();
    renderAttribution('clue-false-harbor-sigil');

    const vex = screen.getByRole('checkbox', { name: 'Vex' });
    expect(vex).not.toBeChecked();
    await user.click(vex);
    await user.click(screen.getByRole('button', { name: 'Save attribution' }));
    expect(screen.getByRole('checkbox', { name: 'Vex' })).toBeChecked();
  });
});
```

- [ ] **Step 2: Write the failing test `ClueBeatTimeline.test.tsx`**

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { buildSeedState } from '../store/seedProject';
import { ClueSystemProvider } from '../store/ClueSystemContext';
import { ClueBeatTimeline } from './ClueBeatTimeline';

function renderTimeline(clueId: string) {
  const state = buildSeedState();
  const clue = state.clues.find((candidate) => candidate.clueId === clueId);
  if (!clue) throw new Error(`missing seed clue ${clueId}`);
  return render(
    <ClueSystemProvider initialState={state}>
      <ClueBeatTimeline clue={clue} />
    </ClueSystemProvider>,
  );
}

describe('ClueBeatTimeline', () => {
  it('lists the sigil beats in order', () => {
    renderTimeline('clue-false-harbor-sigil');

    const beats = screen.getByRole('list', { name: 'Clue beats' });
    const rows = within(beats).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('plant');
    expect(rows[1]).toHaveTextContent('advance');
    expect(rows[1]).toHaveTextContent('Voren Lights the False Star');
  });

  it('adds a beat with the next order value', async () => {
    const user = userEvent.setup();
    renderTimeline('clue-false-harbor-sigil');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Beat type' }), 'payoff');
    await user.type(screen.getByRole('textbox', { name: 'Beat summary' }), 'The sigil is exposed.');
    await user.click(screen.getByRole('button', { name: 'Add beat' }));

    const beats = screen.getByRole('list', { name: 'Clue beats' });
    expect(within(beats).getAllByRole('listitem')).toHaveLength(3);
    expect(beats).toHaveTextContent('The sigil is exposed.');
  });

  it('deletes a beat', async () => {
    const user = userEvent.setup();
    renderTimeline('clue-false-harbor-sigil');

    await user.click(screen.getAllByRole('button', { name: 'Delete beat' })[0]);
    expect(within(screen.getByRole('list', { name: 'Clue beats' })).getAllByRole('listitem')).toHaveLength(1);
  });

  it('moves a beat down by swapping order values', async () => {
    const user = userEvent.setup();
    renderTimeline('clue-false-harbor-sigil');

    const beats = screen.getByRole('list', { name: 'Clue beats' });
    const firstRow = within(beats).getAllByRole('listitem')[0];
    await user.click(within(firstRow).getByRole('button', { name: 'Move beat down' }));

    const rows = within(beats).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('advance');
    expect(rows[1]).toHaveTextContent('plant');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test:web -- src/features/clue-system/components/ClueAttributionEditor.test.tsx src/features/clue-system/components/ClueBeatTimeline.test.tsx`
Expected: FAIL — cannot resolve modules.

- [ ] **Step 4: Create `ClueAttributionEditor.tsx`**

```tsx
import { useState } from 'react';
import { noveloraMockProject } from '../../novelora-cockpit/data/noveloraMockProject';
import { useClueSystemDispatch } from '../store/ClueSystemContext';
import type { Clue, ClueAttribution } from '../types';

type CharacterRoleField =
  | 'providerCharacterId'
  | 'triggerCharacterId'
  | 'receiverCharacterId'
  | 'concealerCharacterId'
  | 'misleaderCharacterId'
  | 'payoffCharacterId';

const ROLE_LABELS: ReadonlyArray<{ field: CharacterRoleField; label: string }> = [
  { field: 'providerCharacterId', label: 'Provider' },
  { field: 'triggerCharacterId', label: 'Trigger' },
  { field: 'receiverCharacterId', label: 'Receiver' },
  { field: 'concealerCharacterId', label: 'Concealer' },
  { field: 'misleaderCharacterId', label: 'Misleader' },
  { field: 'payoffCharacterId', label: 'Payoff character' },
];

export function ClueAttributionEditor({ clue }: { clue: Clue }) {
  const dispatch = useClueSystemDispatch();
  const [attribution, setAttribution] = useState<ClueAttribution>(clue.attribution);

  function setRole(field: CharacterRoleField, value: string) {
    setAttribution((current) => ({ ...current, [field]: value || null }));
  }

  function toggleObserver(characterId: string) {
    setAttribution((current) => ({
      ...current,
      observerCharacterIds: current.observerCharacterIds.includes(characterId)
        ? current.observerCharacterIds.filter((id) => id !== characterId)
        : [...current.observerCharacterIds, characterId],
    }));
  }

  function saveAttribution() {
    dispatch({
      type: 'upsertClue',
      clue: { ...clue, attribution },
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <section className="clue-attribution" aria-label="Clue attribution">
      <h3>Attribution</h3>
      <div className="clue-attribution__grid">
        {ROLE_LABELS.map(({ field, label }) => (
          <label key={field}>
            {label}
            <select
              value={attribution[field] ?? ''}
              onChange={(event) => setRole(field, event.target.value)}
            >
              <option value="">Not set</option>
              {noveloraMockProject.characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label>
          Payoff chapter
          <select
            value={attribution.payoffChapterId ?? ''}
            onChange={(event) =>
              setAttribution((current) => ({
                ...current,
                payoffChapterId: event.target.value || null,
              }))
            }
          >
            <option value="">Not set</option>
            {noveloraMockProject.chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Mechanism
          <input
            value={attribution.mechanism}
            onChange={(event) =>
              setAttribution((current) => ({ ...current, mechanism: event.target.value }))
            }
          />
        </label>
      </div>

      <fieldset className="clue-attribution__observers">
        <legend>Observers</legend>
        {noveloraMockProject.characters.map((character) => (
          <label key={character.id}>
            <input
              type="checkbox"
              checked={attribution.observerCharacterIds.includes(character.id)}
              onChange={() => toggleObserver(character.id)}
            />
            {character.name}
          </label>
        ))}
      </fieldset>

      <button type="button" onClick={saveAttribution}>
        Save attribution
      </button>
    </section>
  );
}
```

- [ ] **Step 5: Create `ClueBeatTimeline.tsx`**

```tsx
import { useState } from 'react';
import { noveloraMockProject } from '../../novelora-cockpit/data/noveloraMockProject';
import { useClueSystemDispatch, useClueSystemState } from '../store/ClueSystemContext';
import type { Clue, ClueBeat, ClueBeatType } from '../types';

const BEAT_TYPES: ClueBeatType[] = [
  'plant', 'advance', 'mislead', 'reveal', 'payoff', 'recontextualize', 'discard',
];

function chapterTitle(chapterId: string | null): string {
  return (
    noveloraMockProject.chapters.find((chapter) => chapter.id === chapterId)?.title ??
    'No chapter'
  );
}

export function ClueBeatTimeline({ clue }: { clue: Clue }) {
  const state = useClueSystemState();
  const dispatch = useClueSystemDispatch();
  const beats = state.beats
    .filter((beat) => beat.clueId === clue.clueId)
    .sort((first, second) => first.order - second.order);

  const [beatType, setBeatType] = useState<ClueBeatType>('advance');
  const [beatChapter, setBeatChapter] = useState(noveloraMockProject.chapters[0].id);
  const [beatSummary, setBeatSummary] = useState('');

  function addBeat() {
    const summary = beatSummary.trim();
    if (!summary) return;
    const nextOrder = beats.length === 0 ? 1 : Math.max(...beats.map((beat) => beat.order)) + 1;
    const beat: ClueBeat = {
      beatId: crypto.randomUUID(),
      novelId: clue.novelId,
      clueId: clue.clueId,
      foreshadowingId: null,
      chainId: clue.currentChainId,
      type: beatType,
      chapterId: beatChapter,
      sceneId: null,
      eventNodeId: null,
      order: nextOrder,
      summary,
      readerVisibility: clue.readerVisibility,
      informationDelta: '',
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'upsertBeat', beat });
    setBeatSummary('');
  }

  function moveBeat(beat: ClueBeat, direction: -1 | 1) {
    const index = beats.findIndex((candidate) => candidate.beatId === beat.beatId);
    const neighbor = beats[index + direction];
    if (!neighbor) return;
    dispatch({ type: 'upsertBeat', beat: { ...beat, order: neighbor.order } });
    dispatch({ type: 'upsertBeat', beat: { ...neighbor, order: beat.order } });
  }

  return (
    <section className="clue-beats" aria-label="Clue beat timeline">
      <h3>Beat timeline</h3>
      <ul className="clue-beats__list" aria-label="Clue beats">
        {beats.map((beat, index) => (
          <li key={beat.beatId} className="clue-beats__row">
            <span data-badge="beat-type">{beat.type}</span>
            <span className="clue-beats__chapter">{chapterTitle(beat.chapterId)}</span>
            <span className="clue-beats__summary">{beat.summary}</span>
            <span className="clue-beats__actions">
              <button
                type="button"
                aria-label="Move beat up"
                disabled={index === 0}
                onClick={() => moveBeat(beat, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label="Move beat down"
                disabled={index === beats.length - 1}
                onClick={() => moveBeat(beat, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                aria-label="Delete beat"
                onClick={() => dispatch({ type: 'deleteBeat', beatId: beat.beatId })}
              >
                ×
              </button>
            </span>
          </li>
        ))}
      </ul>

      <div className="clue-beats__add">
        <label>
          Beat type
          <select
            value={beatType}
            onChange={(event) => setBeatType(event.target.value as ClueBeatType)}
          >
            {BEAT_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          Beat chapter
          <select value={beatChapter} onChange={(event) => setBeatChapter(event.target.value)}>
            {noveloraMockProject.chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
            ))}
          </select>
        </label>
        <label>
          Beat summary
          <input value={beatSummary} onChange={(event) => setBeatSummary(event.target.value)} />
        </label>
        <button type="button" onClick={addBeat}>
          Add beat
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Embed in `ClueDetailEditor.tsx` and add CSS**

Add imports and render after the transitions div (inside `<section className="clue-editor">`):

```tsx
      <ClueAttributionEditor key={`attribution-${clue.clueId}-${clue.updatedAt}`} clue={clue} />
      <ClueBeatTimeline clue={clue} />
```

(The attribution editor holds local state initialized from `clue.attribution`; keying by `updatedAt` re-syncs it after a save.)

Append to `clues.css`:

```css
.clue-attribution__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.clue-attribution__grid label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.clue-attribution__observers {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  border: 1px solid var(--color-mint-line);
  border-radius: var(--radius-sm);
}

.clue-attribution__observers label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.clue-beats__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.clue-beats__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-mint-line);
  border-radius: var(--radius-sm);
}

.clue-beats__row [data-badge='beat-type'] {
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-mint-soft);
  font-size: 0.72rem;
}

.clue-beats__chapter {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  white-space: nowrap;
}

.clue-beats__summary {
  flex: 1;
  min-width: 0;
}

.clue-beats__actions {
  display: flex;
  gap: 4px;
}

.clue-beats__add {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px;
}

.clue-beats__add label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}
```

- [ ] **Step 7: Run tests to verify they pass, then commit**

Run: `npm run test:web -- src/features/clue-system/components/ClueAttributionEditor.test.tsx src/features/clue-system/components/ClueBeatTimeline.test.tsx src/features/clue-system/components/ClueDetailEditor.test.tsx`
Expected: PASS.

```bash
git add apps/web/src/features/clue-system/components/ClueAttributionEditor.tsx apps/web/src/features/clue-system/components/ClueAttributionEditor.test.tsx apps/web/src/features/clue-system/components/ClueBeatTimeline.tsx apps/web/src/features/clue-system/components/ClueBeatTimeline.test.tsx apps/web/src/features/clue-system/components/ClueDetailEditor.tsx apps/web/src/styles/clues.css
git commit -m "feat(clue-system): attribution editor and beat timeline"
```

---

### Task 8: Information state editor

**Files:**
- Create: `apps/web/src/features/clue-system/components/InformationStateEditor.tsx`
- Test: `apps/web/src/features/clue-system/components/InformationStateEditor.test.tsx`
- Modify: `apps/web/src/features/clue-system/components/ClueDetailEditor.tsx` (embed)
- Modify: `apps/web/src/styles/clues.css`

**Interfaces:**
- Consumes: provider/hooks, fixture characters/chapters.
- Produces: `InformationStateEditor({ clue }: { clue: Clue })` — lists existing `InformationState` records for this clue (chapter, reader/author knowledge, per-character states); create form (chapter select, readerKnowledge select, authorKnowledge select, per-character knowledge select with `not recorded` default meaning no entry, notes textarea) dispatching `upsertInformationState` (id `crypto.randomUUID()`, `objectType: 'clue'`).

- [ ] **Step 1: Write the failing test `InformationStateEditor.test.tsx`**

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { buildSeedState } from '../store/seedProject';
import { ClueSystemProvider } from '../store/ClueSystemContext';
import { InformationStateEditor } from './InformationStateEditor';

function renderInfoStates(clueId: string) {
  const state = buildSeedState();
  const clue = state.clues.find((candidate) => candidate.clueId === clueId);
  if (!clue) throw new Error(`missing seed clue ${clueId}`);
  return render(
    <ClueSystemProvider initialState={state}>
      <InformationStateEditor clue={clue} />
    </ClueSystemProvider>,
  );
}

describe('InformationStateEditor', () => {
  it('lists the seeded information state with character knowledge', () => {
    renderInfoStates('clue-old-tide-map');

    expect(screen.getByText('knowsPartial')).toBeTruthy();
    expect(screen.getByText('knowsTruth')).toBeTruthy();
    expect(screen.getByText('suspects')).toBeTruthy();
    expect(screen.getByText('conceals')).toBeTruthy();
  });

  it('creates a new information state for the sigil clue', async () => {
    const user = userEvent.setup();
    renderInfoStates('clue-false-harbor-sigil');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Chapter' }), 'chapter-5');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Reader knowledge' }), 'suspects');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Kael' }), 'missed');
    await user.click(screen.getByRole('button', { name: 'Add information state' }));

    expect(screen.getByText('missed')).toBeTruthy();
    expect(screen.getAllByText('suspects')).not.toHaveLength(0);
  });

  it('requires a chapter before creating', async () => {
    const user = userEvent.setup();
    renderInfoStates('clue-false-harbor-sigil');

    await user.click(screen.getByRole('button', { name: 'Add information state' }));
    expect(screen.queryByText('missed')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/components/InformationStateEditor.test.tsx`
Expected: FAIL — cannot resolve `./InformationStateEditor`.

- [ ] **Step 3: Create `InformationStateEditor.tsx`**

```tsx
import { useState } from 'react';
import { noveloraMockProject } from '../../novelora-cockpit/data/noveloraMockProject';
import { useClueSystemDispatch, useClueSystemState } from '../store/ClueSystemContext';
import type {
  AuthorKnowledge,
  CharacterKnowledge,
  CharacterKnowledgeState,
  Clue,
  ReaderKnowledge,
} from '../types';

const READER_KNOWLEDGE: ReaderKnowledge[] = [
  'unknown', 'suspects', 'knowsFalse', 'knowsPartial', 'knowsTruth',
];

const AUTHOR_KNOWLEDGE: AuthorKnowledge[] = ['unknown', 'planned', 'confirmed'];

const CHARACTER_STATES: CharacterKnowledgeState[] = [
  'unknown', 'missed', 'suspects', 'misunderstands', 'knowsPartial', 'knowsTruth', 'conceals',
];

function chapterTitle(chapterId: string | null): string {
  return (
    noveloraMockProject.chapters.find((chapter) => chapter.id === chapterId)?.title ??
    'No chapter'
  );
}

export function InformationStateEditor({ clue }: { clue: Clue }) {
  const state = useClueSystemState();
  const dispatch = useClueSystemDispatch();
  const infoStates = state.informationStates.filter(
    (infoState) => infoState.objectType === 'clue' && infoState.objectId === clue.clueId,
  );

  const [chapterId, setChapterId] = useState('');
  const [readerKnowledge, setReaderKnowledge] = useState<ReaderKnowledge>('unknown');
  const [authorKnowledge, setAuthorKnowledge] = useState<AuthorKnowledge>('confirmed');
  const [characterStates, setCharacterStates] = useState<Record<string, CharacterKnowledgeState | ''>>({});
  const [notes, setNotes] = useState('');

  function addInformationState() {
    if (!chapterId) return;
    const characterKnowledge: CharacterKnowledge[] = Object.entries(characterStates)
      .filter((entry): entry is [string, CharacterKnowledgeState] => entry[1] !== '')
      .map(([characterId, knowledgeState]) => ({ characterId, knowledgeState, evidence: '' }));
    dispatch({
      type: 'upsertInformationState',
      informationState: {
        informationStateId: crypto.randomUUID(),
        novelId: clue.novelId,
        objectType: 'clue',
        objectId: clue.clueId,
        chapterId,
        eventNodeId: null,
        readerKnowledge,
        authorKnowledge,
        characterKnowledge,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      },
    });
    setChapterId('');
    setReaderKnowledge('unknown');
    setCharacterStates({});
    setNotes('');
  }

  return (
    <section className="clue-info-states" aria-label="Information states">
      <h3>Information states</h3>
      <ul className="clue-info-states__list">
        {infoStates.map((infoState) => (
          <li key={infoState.informationStateId} className="clue-info-states__row">
            <strong>{chapterTitle(infoState.chapterId)}</strong>
            <span>Reader: {infoState.readerKnowledge}</span>
            <span>Author: {infoState.authorKnowledge}</span>
            <ul>
              {infoState.characterKnowledge.map((entry) => (
                <li key={entry.characterId}>
                  {noveloraMockProject.characters.find(
                    (character) => character.id === entry.characterId,
                  )?.name ?? entry.characterId}
                  : {entry.knowledgeState}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className="clue-info-states__add">
        <label>
          Chapter
          <select value={chapterId} onChange={(event) => setChapterId(event.target.value)}>
            <option value="">Select a chapter</option>
            {noveloraMockProject.chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
            ))}
          </select>
        </label>
        <label>
          Reader knowledge
          <select
            value={readerKnowledge}
            onChange={(event) => setReaderKnowledge(event.target.value as ReaderKnowledge)}
          >
            {READER_KNOWLEDGE.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Author knowledge
          <select
            value={authorKnowledge}
            onChange={(event) => setAuthorKnowledge(event.target.value as AuthorKnowledge)}
          >
            {AUTHOR_KNOWLEDGE.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend>Character knowledge</legend>
          {noveloraMockProject.characters.map((character) => (
            <label key={character.id}>
              {character.name}
              <select
                value={characterStates[character.id] ?? ''}
                onChange={(event) =>
                  setCharacterStates((current) => ({
                    ...current,
                    [character.id]: event.target.value as CharacterKnowledgeState | '',
                  }))
                }
              >
                <option value="">Not recorded</option>
                {CHARACTER_STATES.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
          ))}
        </fieldset>

        <label>
          Notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
        </label>
        <button type="button" onClick={addInformationState}>
          Add information state
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Embed in `ClueDetailEditor.tsx` and add CSS**

Add after `<ClueBeatTimeline clue={clue} />`:

```tsx
      <InformationStateEditor clue={clue} />
```

Append to `clues.css`:

```css
.clue-info-states__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.clue-info-states__row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-mint-line);
  border-radius: var(--radius-sm);
}

.clue-info-states__row ul {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--color-text-muted);
}

.clue-info-states__add {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.clue-info-states__add label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.clue-info-states__add fieldset {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  border: 1px solid var(--color-mint-line);
  border-radius: var(--radius-sm);
}
```

- [ ] **Step 5: Run tests to verify they pass, then commit**

Run: `npm run test:web -- src/features/clue-system/components/InformationStateEditor.test.tsx src/features/clue-system/components/ClueDetailEditor.test.tsx`
Expected: PASS.

```bash
git add apps/web/src/features/clue-system/components/InformationStateEditor.tsx apps/web/src/features/clue-system/components/InformationStateEditor.test.tsx apps/web/src/features/clue-system/components/ClueDetailEditor.tsx apps/web/src/styles/clues.css
git commit -m "feat(clue-system): information state editor"
```

---

### Task 9: Foreshadowing editor + hidden thread / red herring editors

**Files:**
- Create: `apps/web/src/features/clue-system/components/ForeshadowingDetailEditor.tsx`
- Test: `apps/web/src/features/clue-system/components/ForeshadowingDetailEditor.test.tsx`
- Create: `apps/web/src/features/clue-system/components/HiddenThreadEditor.tsx`
- Test: `apps/web/src/features/clue-system/components/HiddenThreadEditor.test.tsx`
- Create: `apps/web/src/features/clue-system/components/RedHerringEditor.tsx`
- Test: `apps/web/src/features/clue-system/components/RedHerringEditor.test.tsx`
- Modify: `apps/web/src/features/clue-system/components/ClueWorkspace.tsx` (route the three kinds)
- Modify: `apps/web/src/styles/clues.css`

**Interfaces:**
- Produces:
  - `ForeshadowingDetailEditor({ foreshadowingId }: { foreshadowingId: string })` — title/content/visibility/subtlety (1–5)/planting/expected/actual payoff chapter selects; transition buttons per `checkForeshadowingTransition`; missingFields chips + risk badge.
  - `HiddenThreadEditor({ hiddenThreadId }: { hiddenThreadId: string })` — title/secretTruth/visibleToReader/visibleToCharacterIds/plannedRevealChapterId/status plain select; save via `upsertHiddenThread`.
  - `RedHerringEditor({ redHerringId }: { redHerringId: string })` — title/falseConclusion/truthBehindIt/misleader/targets/misleadsReader/clarificationChapterId/status plain select; save via `upsertRedHerring`.
  - `ClueWorkspace` routes `foreshadowing`/`hiddenThread`/`redHerring` kinds with `key={id}`.

- [ ] **Step 1: Write the failing tests**

`ForeshadowingDetailEditor.test.tsx`:

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { buildSeedState } from '../store/seedProject';
import { ClueSystemProvider } from '../store/ClueSystemContext';
import { ForeshadowingDetailEditor } from './ForeshadowingDetailEditor';

function renderEditor(foreshadowingId: string) {
  return render(
    <ClueSystemProvider initialState={buildSeedState()}>
      <ForeshadowingDetailEditor foreshadowingId={foreshadowingId} />
    </ClueSystemProvider>,
  );
}

describe('ForeshadowingDetailEditor', () => {
  it('shows missing expected payoff for the forge threshold', () => {
    renderEditor('foreshadowing-forge-threshold');

    expect(screen.getByText('expectedPayoff')).toBeTruthy();
    expect(screen.getByText('high')).toBeTruthy();
  });

  it('marks the reef bargain ready for payoff through a guarded transition', async () => {
    const user = userEvent.setup();
    renderEditor('foreshadowing-reef-bargain');

    await user.click(screen.getByRole('button', { name: 'Mark readyForPayoff' }));
    expect(screen.getByText('readyForPayoff')).toBeTruthy();
  });

  it('blocks paidOff until an actual payoff chapter is saved', async () => {
    const user = userEvent.setup();
    renderEditor('foreshadowing-reef-bargain');

    await user.click(screen.getByRole('button', { name: 'Mark readyForPayoff' }));

    const paidOffButton = screen.getByRole('button', { name: 'Mark paidOff' });
    expect(paidOffButton).toBeDisabled();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Actual payoff chapter' }),
      'chapter-6',
    );
    await user.click(screen.getByRole('button', { name: 'Save foreshadowing' }));

    expect(screen.getByRole('button', { name: 'Mark paidOff' })).toBeEnabled();
  });
});
```

`HiddenThreadEditor.test.tsx`:

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { buildSeedState } from '../store/seedProject';
import { ClueSystemProvider } from '../store/ClueSystemContext';
import { HiddenThreadEditor } from './HiddenThreadEditor';

describe('HiddenThreadEditor', () => {
  it('shows the seed thread and saves status changes', async () => {
    const user = userEvent.setup();
    render(
      <ClueSystemProvider initialState={buildSeedState()}>
        <HiddenThreadEditor hiddenThreadId="thread-harbor-registry" />
      </ClueSystemProvider>,
    );

    expect(screen.getByRole('textbox', { name: 'Secret truth' })).toHaveValue(
      'Arden altered the harbor registry to hide the forbidden route.',
    );

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'revealed');
    await user.click(screen.getByRole('button', { name: 'Save hidden thread' }));

    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('revealed');
  });
});
```

`RedHerringEditor.test.tsx`:

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { buildSeedState } from '../store/seedProject';
import { ClueSystemProvider } from '../store/ClueSystemContext';
import { RedHerringEditor } from './RedHerringEditor';

describe('RedHerringEditor', () => {
  it('shows the seed herring and saves a clarification chapter', async () => {
    const user = userEvent.setup();
    render(
      <ClueSystemProvider initialState={buildSeedState()}>
        <RedHerringEditor redHerringId="herring-rescue-beacon" />
      </ClueSystemProvider>,
    );

    expect(screen.getByRole('textbox', { name: 'False conclusion' })).toHaveValue(
      'The beacon guides ships to safety.',
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Clarification chapter' }),
      'chapter-6',
    );
    await user.click(screen.getByRole('button', { name: 'Save red herring' }));

    expect(screen.getByRole('combobox', { name: 'Clarification chapter' })).toHaveValue(
      'chapter-6',
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:web -- src/features/clue-system/components/ForeshadowingDetailEditor.test.tsx src/features/clue-system/components/HiddenThreadEditor.test.tsx src/features/clue-system/components/RedHerringEditor.test.tsx`
Expected: FAIL — cannot resolve modules.

- [ ] **Step 3: Create the three editors**

`ForeshadowingDetailEditor.tsx`:

```tsx
import { useState } from 'react';
import { noveloraMockProject } from '../../novelora-cockpit/data/noveloraMockProject';
import { checkForeshadowingTransition } from '../rules/stateMachines';
import { useClueSystemDispatch, useClueSystemState } from '../store/ClueSystemContext';
import type { ForeshadowingStatus, ReaderVisibility } from '../types';

const FORESHADOWING_STATUSES: ForeshadowingStatus[] = [
  'draft', 'planted', 'developing', 'readyForPayoff', 'paidOff', 'abandoned',
];

const VISIBILITIES: ReaderVisibility[] = ['hidden', 'hinted', 'visible', 'misleading'];

function ChapterSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Not set</option>
        {noveloraMockProject.chapters.map((chapter) => (
          <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
        ))}
      </select>
    </label>
  );
}

export function ForeshadowingDetailEditor({ foreshadowingId }: { foreshadowingId: string }) {
  const state = useClueSystemState();
  const dispatch = useClueSystemDispatch();
  const foreshadowing = state.foreshadowings.find(
    (candidate) => candidate.foreshadowingId === foreshadowingId,
  );

  const [title, setTitle] = useState(foreshadowing?.title ?? '');
  const [content, setContent] = useState(foreshadowing?.content ?? '');
  const [visibility, setVisibility] = useState<ReaderVisibility>(
    foreshadowing?.visibility ?? 'hinted',
  );
  const [subtlety, setSubtlety] = useState(foreshadowing?.subtletyLevel ?? 3);
  const [planting, setPlanting] = useState(foreshadowing?.plantingChapterId ?? '');
  const [expected, setExpected] = useState(foreshadowing?.expectedPayoffChapterId ?? '');
  const [actual, setActual] = useState(foreshadowing?.actualPayoffChapterId ?? '');

  if (!foreshadowing) {
    return <p className="clue-editor__missing">This foreshadowing no longer exists.</p>;
  }

  function saveForeshadowing() {
    if (!foreshadowing) return;
    dispatch({
      type: 'upsertForeshadowing',
      foreshadowing: {
        ...foreshadowing,
        title: title.trim() || foreshadowing.title,
        content,
        visibility,
        subtletyLevel: subtlety,
        plantingChapterId: planting || null,
        expectedPayoffChapterId: expected || null,
        actualPayoffChapterId: actual || null,
      },
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <section className="clue-editor" aria-label="Foreshadowing editor">
      <header className="clue-editor__header">
        <h2>{foreshadowing.title}</h2>
        <span className="clue-editor__badges">
          <span data-badge="status">{foreshadowing.status}</span>
          <span data-badge="risk">{foreshadowing.riskLevel}</span>
        </span>
      </header>

      {foreshadowing.missingFields.length > 0 ? (
        <ul className="clue-editor__missing-fields" aria-label="Missing fields">
          {foreshadowing.missingFields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
      ) : null}

      <div className="clue-editor__form">
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Content
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={3} />
        </label>
        <label>
          Reader visibility
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as ReaderVisibility)}
          >
            {VISIBILITIES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Subtlety level
          <select value={subtlety} onChange={(event) => setSubtlety(Number(event.target.value))}>
            {[1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </label>
        <ChapterSelect label="Planting chapter" value={planting} onChange={setPlanting} />
        <ChapterSelect label="Expected payoff chapter" value={expected} onChange={setExpected} />
        <ChapterSelect label="Actual payoff chapter" value={actual} onChange={setActual} />
        <button type="button" onClick={saveForeshadowing}>
          Save foreshadowing
        </button>
      </div>

      <div className="clue-editor__transitions" aria-label="Status transitions">
        {FORESHADOWING_STATUSES.filter((target) => target !== foreshadowing.status).map(
          (target) => {
            const result = checkForeshadowingTransition(foreshadowing, target);
            return (
              <button
                key={target}
                type="button"
                disabled={!result.allowed}
                data-denial-reason={result.reason ?? undefined}
                title={result.reason ?? undefined}
                onClick={() =>
                  dispatch({
                    type: 'transitionForeshadowing',
                    foreshadowingId: foreshadowing.foreshadowingId,
                    to: target,
                    updatedAt: new Date().toISOString(),
                  })
                }
              >
                {`Mark ${target}`}
              </button>
            );
          },
        )}
      </div>
    </section>
  );
}
```

`HiddenThreadEditor.tsx`:

```tsx
import { useState } from 'react';
import { noveloraMockProject } from '../../novelora-cockpit/data/noveloraMockProject';
import { useClueSystemDispatch, useClueSystemState } from '../store/ClueSystemContext';
import type { HiddenThreadStatus } from '../types';

const THREAD_STATUSES: HiddenThreadStatus[] = ['draft', 'active', 'revealed', 'abandoned'];

export function HiddenThreadEditor({ hiddenThreadId }: { hiddenThreadId: string }) {
  const state = useClueSystemState();
  const dispatch = useClueSystemDispatch();
  const thread = state.hiddenThreads.find(
    (candidate) => candidate.hiddenThreadId === hiddenThreadId,
  );

  const [title, setTitle] = useState(thread?.title ?? '');
  const [secretTruth, setSecretTruth] = useState(thread?.secretTruth ?? '');
  const [visibleToReader, setVisibleToReader] = useState(thread?.visibleToReader ?? false);
  const [visibleCharacters, setVisibleCharacters] = useState<string[]>(
    thread?.visibleToCharacterIds ?? [],
  );
  const [plannedReveal, setPlannedReveal] = useState(thread?.plannedRevealChapterId ?? '');
  const [status, setStatus] = useState<HiddenThreadStatus>(thread?.status ?? 'draft');

  if (!thread) {
    return <p className="clue-editor__missing">This hidden thread no longer exists.</p>;
  }

  function toggleCharacter(characterId: string) {
    setVisibleCharacters((current) =>
      current.includes(characterId)
        ? current.filter((id) => id !== characterId)
        : [...current, characterId],
    );
  }

  function saveThread() {
    if (!thread) return;
    dispatch({
      type: 'upsertHiddenThread',
      hiddenThread: {
        ...thread,
        title: title.trim() || thread.title,
        secretTruth,
        visibleToReader,
        visibleToCharacterIds: visibleCharacters,
        plannedRevealChapterId: plannedReveal || null,
        status,
      },
    });
  }

  return (
    <section className="clue-editor" aria-label="Hidden thread editor">
      <header className="clue-editor__header">
        <h2>{thread.title}</h2>
        <span className="clue-editor__badges">
          <span data-badge="status">{thread.status}</span>
        </span>
      </header>

      <div className="clue-editor__form">
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Secret truth
          <textarea
            value={secretTruth}
            onChange={(event) => setSecretTruth(event.target.value)}
            rows={3}
          />
        </label>
        <label>
          Visible to reader
          <input
            type="checkbox"
            checked={visibleToReader}
            onChange={(event) => setVisibleToReader(event.target.checked)}
          />
        </label>
        <label>
          Planned reveal chapter
          <select value={plannedReveal} onChange={(event) => setPlannedReveal(event.target.value)}>
            <option value="">Not set</option>
            {noveloraMockProject.chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as HiddenThreadStatus)}
          >
            {THREAD_STATUSES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <fieldset className="clue-attribution__observers">
          <legend>Characters who know</legend>
          {noveloraMockProject.characters.map((character) => (
            <label key={character.id}>
              <input
                type="checkbox"
                checked={visibleCharacters.includes(character.id)}
                onChange={() => toggleCharacter(character.id)}
              />
              {character.name}
            </label>
          ))}
        </fieldset>
        <button type="button" onClick={saveThread}>
          Save hidden thread
        </button>
      </div>
    </section>
  );
}
```

`RedHerringEditor.tsx`:

```tsx
import { useState } from 'react';
import { noveloraMockProject } from '../../novelora-cockpit/data/noveloraMockProject';
import { useClueSystemDispatch, useClueSystemState } from '../store/ClueSystemContext';
import type { RedHerringStatus } from '../types';

const HERRING_STATUSES: RedHerringStatus[] = [
  'draft', 'active', 'clarified', 'unfair', 'abandoned',
];

export function RedHerringEditor({ redHerringId }: { redHerringId: string }) {
  const state = useClueSystemState();
  const dispatch = useClueSystemDispatch();
  const herring = state.redHerrings.find(
    (candidate) => candidate.redHerringId === redHerringId,
  );

  const [title, setTitle] = useState(herring?.title ?? '');
  const [falseConclusion, setFalseConclusion] = useState(herring?.falseConclusion ?? '');
  const [truthBehindIt, setTruthBehindIt] = useState(herring?.truthBehindIt ?? '');
  const [misleader, setMisleader] = useState(herring?.misleaderCharacterId ?? '');
  const [targets, setTargets] = useState<string[]>(herring?.targetCharacterIds ?? []);
  const [misleadsReader, setMisleadsReader] = useState(herring?.misleadsReader ?? false);
  const [clarification, setClarification] = useState(herring?.clarificationChapterId ?? '');
  const [status, setStatus] = useState<RedHerringStatus>(herring?.status ?? 'draft');

  if (!herring) {
    return <p className="clue-editor__missing">This red herring no longer exists.</p>;
  }

  function toggleTarget(characterId: string) {
    setTargets((current) =>
      current.includes(characterId)
        ? current.filter((id) => id !== characterId)
        : [...current, characterId],
    );
  }

  function saveHerring() {
    if (!herring) return;
    dispatch({
      type: 'upsertRedHerring',
      redHerring: {
        ...herring,
        title: title.trim() || herring.title,
        falseConclusion,
        truthBehindIt,
        misleaderCharacterId: misleader || null,
        targetCharacterIds: targets,
        misleadsReader,
        clarificationChapterId: clarification || null,
        status,
      },
    });
  }

  return (
    <section className="clue-editor" aria-label="Red herring editor">
      <header className="clue-editor__header">
        <h2>{herring.title}</h2>
        <span className="clue-editor__badges">
          <span data-badge="status">{herring.status}</span>
        </span>
      </header>

      <div className="clue-editor__form">
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          False conclusion
          <textarea
            value={falseConclusion}
            onChange={(event) => setFalseConclusion(event.target.value)}
            rows={2}
          />
        </label>
        <label>
          Truth behind it
          <textarea
            value={truthBehindIt}
            onChange={(event) => setTruthBehindIt(event.target.value)}
            rows={2}
          />
        </label>
        <label>
          Misleader
          <select value={misleader} onChange={(event) => setMisleader(event.target.value)}>
            <option value="">Not set</option>
            {noveloraMockProject.characters.map((character) => (
              <option key={character.id} value={character.id}>{character.name}</option>
            ))}
          </select>
        </label>
        <label>
          Misleads reader
          <input
            type="checkbox"
            checked={misleadsReader}
            onChange={(event) => setMisleadsReader(event.target.checked)}
          />
        </label>
        <label>
          Clarification chapter
          <select
            value={clarification}
            onChange={(event) => setClarification(event.target.value)}
          >
            <option value="">Not set</option>
            {noveloraMockProject.chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as RedHerringStatus)}
          >
            {HERRING_STATUSES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <fieldset className="clue-attribution__observers">
          <legend>Misled characters</legend>
          {noveloraMockProject.characters.map((character) => (
            <label key={character.id}>
              <input
                type="checkbox"
                checked={targets.includes(character.id)}
                onChange={() => toggleTarget(character.id)}
              />
              {character.name}
            </label>
          ))}
        </fieldset>
        <button type="button" onClick={saveHerring}>
          Save red herring
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Route in `ClueWorkspace.tsx`**

Extend the detail routing:

```tsx
          ) : selectedObject.kind === 'foreshadowing' ? (
            <ForeshadowingDetailEditor
              key={selectedObject.id}
              foreshadowingId={selectedObject.id}
            />
          ) : selectedObject.kind === 'hiddenThread' ? (
            <HiddenThreadEditor key={selectedObject.id} hiddenThreadId={selectedObject.id} />
          ) : selectedObject.kind === 'redHerring' ? (
            <RedHerringEditor key={selectedObject.id} redHerringId={selectedObject.id} />
          ) : null}
```

- [ ] **Step 5: Run tests to verify they pass, then commit**

Run: `npm run test:web -- src/features/clue-system/components/ForeshadowingDetailEditor.test.tsx src/features/clue-system/components/HiddenThreadEditor.test.tsx src/features/clue-system/components/RedHerringEditor.test.tsx`
Expected: PASS.

```bash
git add apps/web/src/features/clue-system/components/ForeshadowingDetailEditor.tsx apps/web/src/features/clue-system/components/ForeshadowingDetailEditor.test.tsx apps/web/src/features/clue-system/components/HiddenThreadEditor.tsx apps/web/src/features/clue-system/components/HiddenThreadEditor.test.tsx apps/web/src/features/clue-system/components/RedHerringEditor.tsx apps/web/src/features/clue-system/components/RedHerringEditor.test.tsx apps/web/src/features/clue-system/components/ClueWorkspace.tsx apps/web/src/styles/clues.css
git commit -m "feat(clue-system): foreshadowing, hidden thread, red herring editors"
```

---

### Task 10: Create dialog + delete/discard flows

**Files:**
- Create: `apps/web/src/features/clue-system/components/dialogBehavior.ts`
- Create: `apps/web/src/features/clue-system/components/ObjectCreateDialog.tsx`
- Test: `apps/web/src/features/clue-system/components/ObjectCreateDialog.test.tsx`
- Modify: `apps/web/src/features/clue-system/components/ClueObjectList.tsx` (New button per active tab)
- Modify: `apps/web/src/features/clue-system/components/ClueDetailEditor.tsx` (delete/discard header actions)
- Modify: `apps/web/src/features/clue-system/components/ForeshadowingDetailEditor.tsx` (delete/abandon header actions)
- Modify: `apps/web/src/features/clue-system/components/ClueWorkspace.tsx` (clear selection after delete; wire dialog state)
- Test: extend `ClueDetailEditor.test.tsx` and `ClueObjectList.test.tsx` (append cases below)
- Modify: `apps/web/src/styles/clues.css`

**Interfaces:**
- Produces:
  - `useDialogBehavior(isOpen, onClose)` in `dialogBehavior.ts` — Escape closes, focus the close button on open, simple focus trap on Tab (reuse the tabbable-element approach from `ChapterDetailDrawer`).
  - `ObjectCreateDialog({ kind, onClose, onCreated }: { kind: 'clue' | 'foreshadowing' | 'hiddenThread' | 'redHerring'; onClose: () => void; onCreated: (selection: SelectedObject) => void })` — portal dialog (`role="dialog"`, `aria-modal="true"`, backdrop) with Title + Content fields; creates a `draft` object via the matching upsert action (id `crypto.randomUUID()`, timestamps `new Date().toISOString()`, novelId = active novel), then `onCreated({ kind, id })` and closes. Empty attribution for clues via `emptyAttribution()`; foreshadowing `subtletyLevel: 3`, `visibility: 'hinted'`; thread `visibleToReader: false`; herring `misleadsReader: false`.
  - Object list header gains a `New <kind>` button that opens the dialog for the active tab (create hidden thread / red herring labels: `New hidden thread`, `New red herring`).
  - Detail editors gain a delete area: if any beat references the object → a Discard/Abandon transition button (dispatches `transitionClue` to `discarded` / `transitionForeshadowing` to `abandoned`); otherwise a Delete button with two-step inline confirm (`Confirm delete` / `Cancel`). After delete, the parent clears the selection via a new `onDeleted` callback prop on both editors.

- [ ] **Step 1: Write the failing test `ObjectCreateDialog.test.tsx`**

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { buildSeedState } from '../store/seedProject';
import { ClueSystemProvider } from '../store/ClueSystemContext';
import { ObjectCreateDialog } from './ObjectCreateDialog';

function renderDialog(onCreated = vi.fn(), onClose = vi.fn()) {
  render(
    <ClueSystemProvider initialState={buildSeedState()}>
      <ObjectCreateDialog kind="clue" onClose={onClose} onCreated={onCreated} />
    </ClueSystemProvider>,
  );
  return { onCreated, onClose };
}

describe('ObjectCreateDialog', () => {
  it('opens a modal dialog with title and content fields', () => {
    renderDialog();

    expect(screen.getByRole('dialog', { name: 'Create clue' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Title' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Content' })).toBeTruthy();
  });

  it('creates a draft clue and reports the selection', async () => {
    const user = userEvent.setup();
    const { onCreated, onClose } = renderDialog();

    await user.type(screen.getByRole('textbox', { name: 'Title' }), 'The glass lens');
    await user.click(screen.getByRole('button', { name: 'Create clue draft' }));

    expect(onCreated).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'clue', id: expect.any(String) }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('requires a title', async () => {
    const user = userEvent.setup();
    const { onCreated } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Create clue draft' }));
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Append failing delete-flow tests to `ClueDetailEditor.test.tsx`**

```tsx
describe('ClueDetailEditor delete flows', () => {
  it('offers discard instead of delete when beats reference the clue', () => {
    renderEditor('clue-false-harbor-sigil');

    expect(screen.queryByRole('button', { name: 'Delete clue' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Discard clue' })).toBeEnabled();
  });

  it('deletes an unreferenced draft after inline confirmation', async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    const state = buildSeedState();
    render(
      <ClueSystemProvider
        initialState={{ ...state, clues: [...state.clues, makeDraftClue()] }}
      >
        <ClueDetailEditor clueId="clue-draft" onDeleted={onDeleted} />
      </ClueSystemProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Delete clue' }));
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));

    expect(onDeleted).toHaveBeenCalledOnce();
    expect(
      screen.getByText('This clue no longer exists.'),
    ).toBeTruthy();
  });
});
```

(Add `import { vi } from 'vitest'` to that file's vitest import and export `makeDraftClue` from its current position by hoisting it above both describes — it already exists at file scope, reuse it. `ClueDetailEditor` gains optional prop `onDeleted?: () => void`.)

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test:web -- src/features/clue-system/components/ObjectCreateDialog.test.tsx src/features/clue-system/components/ClueDetailEditor.test.tsx`
Expected: FAIL — cannot resolve `./ObjectCreateDialog`; delete buttons missing.

- [ ] **Step 4: Create `dialogBehavior.ts` and `ObjectCreateDialog.tsx`**

`dialogBehavior.ts`:

```ts
import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react';

const tabbableSelector = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[tabindex]',
].join(',');

export function useDialogBehavior(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  function trapFocus(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const elements = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(tabbableSelector),
    ).filter((element) => element.tabIndex >= 0 && !element.matches(':disabled'));
    const first = elements[0];
    const last = elements.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return { dialogRef, closeButtonRef, trapFocus };
}
```

`ObjectCreateDialog.tsx`:

```tsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { emptyAttribution } from '../rules/attribution';
import { useClueSystemDispatch, useClueSystemState } from '../store/ClueSystemContext';
import { useDialogBehavior } from './dialogBehavior';
import type { SelectedObject } from './selection';

const KIND_LABELS = {
  clue: 'clue',
  foreshadowing: 'foreshadowing',
  hiddenThread: 'hidden thread',
  redHerring: 'red herring',
} as const;

interface ObjectCreateDialogProps {
  kind: 'clue' | 'foreshadowing' | 'hiddenThread' | 'redHerring';
  onClose: () => void;
  onCreated: (selection: SelectedObject) => void;
}

export function ObjectCreateDialog({ kind, onClose, onCreated }: ObjectCreateDialogProps) {
  const state = useClueSystemState();
  const dispatch = useClueSystemDispatch();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { dialogRef, closeButtonRef, trapFocus } = useDialogBehavior(true, onClose);

  const kindLabel = KIND_LABELS[kind];
  const now = () => new Date().toISOString();

  function createObject() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const novelId = state.activeNovelId;
    const id = crypto.randomUUID();

    if (kind === 'clue') {
      dispatch({
        type: 'upsertClue',
        clue: {
          clueId: id,
          novelId,
          title: trimmed,
          content,
          type: 'evidence',
          status: 'draft',
          credibility: 'unknown',
          readerVisibility: 'hinted',
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
          createdAt: now(),
          updatedAt: now(),
        },
        updatedAt: now(),
      });
    } else if (kind === 'foreshadowing') {
      dispatch({
        type: 'upsertForeshadowing',
        foreshadowing: {
          foreshadowingId: id,
          novelId,
          title: trimmed,
          content,
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
          createdAt: now(),
          updatedAt: now(),
        },
        updatedAt: now(),
      });
    } else if (kind === 'hiddenThread') {
      dispatch({
        type: 'upsertHiddenThread',
        hiddenThread: {
          hiddenThreadId: id,
          novelId,
          title: trimmed,
          secretTruth: content,
          visibleToReader: false,
          visibleToCharacterIds: [],
          relatedChainIds: [],
          plannedRevealChapterId: null,
          status: 'draft',
        },
      });
    } else {
      dispatch({
        type: 'upsertRedHerring',
        redHerring: {
          redHerringId: id,
          novelId,
          title: trimmed,
          falseConclusion: content,
          truthBehindIt: '',
          misleaderCharacterId: null,
          targetCharacterIds: [],
          misleadsReader: false,
          clarificationChapterId: null,
          relatedClueIds: [],
          status: 'draft',
        },
      });
    }

    onCreated({ kind, id });
    onClose();
  }

  return createPortal(
    <div className="clue-dialog-backdrop">
      <section
        ref={dialogRef}
        className="clue-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`Create ${kindLabel}`}
        onKeyDown={trapFocus}
      >
        <header className="clue-dialog__header">
          <h2>{`Create ${kindLabel}`}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label={`Close create ${kindLabel} dialog`}
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Content
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={3} />
        </label>
        <button type="button" onClick={createObject}>
          {`Create ${kindLabel} draft`}
        </button>
      </section>
    </div>,
    document.body,
  );
}
```

- [ ] **Step 5: Wire the New button, delete flows, and CSS**

In `ClueObjectList.tsx`, add props `onCreateNew: () => void` and `createLabel: string`; render a button above the tabs:

```tsx
      <button type="button" className="clue-object-list__new" onClick={onCreateNew}>
        {createLabel}
      </button>
```

In `ClueWorkspace.tsx`:
- Add `const [createKind, setCreateKind] = useState<SelectedObjectKind | null>(null);`
- Track the active list tab: lift `activeKind` out of `ClueObjectList`? Simpler: `ClueObjectList` gains optional `onActiveKindChange` — no, simplest: keep tab state in the workspace. Move `activeKind`/`setActiveKind` into `ClueWorkspace` and pass as props (`activeKind`, `onActiveKindChange`). Update `ClueObjectList` to accept and use them (its internal useState for kind goes away; keep filter state internal).
- Render the create button in the list via `createLabel` computed from activeKind (`New clue` / `New foreshadowing` / `New hidden thread` / `New red herring`) and `onCreateNew={() => setCreateKind(activeKind)}`.
- Render `{createKind && createKind !== 'chain' ? <ObjectCreateDialog kind={createKind} onClose={() => setCreateKind(null)} onCreated={(selection) => { setSelectedObject(selection); }} /> : null}`.
- Pass `onDeleted={() => setSelectedObject(null)}` to `ClueDetailEditor` and `ForeshadowingDetailEditor`.

In `ClueDetailEditor.tsx`:
- Add optional prop `onDeleted?: () => void`.
- Add local state `const [confirmingDelete, setConfirmingDelete] = useState(false);`
- Compute `const referenced = state.beats.some((beat) => beat.clueId === clue.clueId);`
- Render in the header area:

```tsx
        {referenced ? (
          <button type="button" onClick={() => transitionTo('discarded')}>
            Discard clue
          </button>
        ) : confirmingDelete ? (
          <span className="clue-editor__confirm">
            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'deleteClue', clueId: clue.clueId });
                onDeleted?.();
              }}
            >
              Confirm delete
            </button>
            <button type="button" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmingDelete(true)}>
            Delete clue
          </button>
        )}
```

In `ForeshadowingDetailEditor.tsx`: same pattern — `referenced = state.beats.some((beat) => beat.foreshadowingId === foreshadowing.foreshadowingId)`; Abandon button dispatches `transitionForeshadowing` to `'abandoned'`; otherwise Delete with inline confirm dispatching `deleteForeshadowing` then `onDeleted?.()`.

Append to `clues.css`:

```css
.clue-object-list__new {
  align-self: flex-start;
}

.clue-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  background: var(--surface-border-whisper);
}

.clue-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(480px, 90vw);
  padding: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-mint-line);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-float);
}

.clue-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.clue-dialog__header h2 {
  margin: 0;
  font-family: var(--font-display);
}

.clue-dialog label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.clue-editor__confirm {
  display: inline-flex;
  gap: 8px;
}
```

- [ ] **Step 6: Run tests to verify they pass, then full suite, then commit**

Run: `npm run test:web -- src/features/clue-system/components/ObjectCreateDialog.test.tsx src/features/clue-system/components/ClueDetailEditor.test.tsx src/features/clue-system/components/ClueObjectList.test.tsx` then `npm run test:web`
Expected: PASS; full suite green.

Note: `ClueObjectList.test.tsx` and existing callers must be updated for the lifted `activeKind` props (add `activeKind="clue"` + `onActiveKindChange={() => {}}` where needed, or keep internal state when props are absent — choose ONE approach: props are required; update the test renders accordingly).

```bash
git add apps/web/src/features/clue-system/components/dialogBehavior.ts apps/web/src/features/clue-system/components/ObjectCreateDialog.tsx apps/web/src/features/clue-system/components/ObjectCreateDialog.test.tsx apps/web/src/features/clue-system/components/ClueObjectList.tsx apps/web/src/features/clue-system/components/ClueObjectList.test.tsx apps/web/src/features/clue-system/components/ClueDetailEditor.tsx apps/web/src/features/clue-system/components/ClueDetailEditor.test.tsx apps/web/src/features/clue-system/components/ForeshadowingDetailEditor.tsx apps/web/src/features/clue-system/components/ClueWorkspace.tsx apps/web/src/styles/clues.css
git commit -m "feat(clue-system): create dialog and guarded delete flows"
```

---

### Task 11: Chains tab + chain view

**Files:**
- Modify: `apps/web/src/features/clue-system/components/ClueObjectList.tsx` (add Chains tab)
- Modify: `apps/web/src/features/clue-system/components/ClueObjectList.test.tsx`
- Create: `apps/web/src/features/clue-system/components/ClueChainView.tsx`
- Test: `apps/web/src/features/clue-system/components/ClueChainView.test.tsx`
- Modify: `apps/web/src/features/clue-system/components/ClueWorkspace.tsx`
- Modify: `apps/web/src/styles/clues.css`

**Interfaces:**
- Produces: chains listed in the object list's Chains tab (title + status badge, no risk). `ClueChainView({ chainId }: { chainId: string })` — chain title, stored status + derived status via `deriveChainStatus`, vertical beat timeline (sorted by order: type badge, chapter title, summary), attribution strip per clue in the chain (`Provider → Trigger → Receiver → Payoff` with character names), transition buttons per `checkChainTransition(chain, state.beats, target)` dispatching `transitionChain`.

- [ ] **Step 1: Write the failing test `ClueChainView.test.tsx`**

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { buildSeedState } from '../store/seedProject';
import { ClueSystemProvider } from '../store/ClueSystemContext';
import { ClueChainView } from './ClueChainView';

describe('ClueChainView', () => {
  it('shows the seed chain with ordered beats and attribution names', () => {
    render(
      <ClueSystemProvider initialState={buildSeedState()}>
        <ClueChainView chainId="chain-ember-route" />
      </ClueSystemProvider>,
    );

    expect(screen.getByRole('heading', { name: 'The ember route' })).toBeTruthy();
    const beats = screen.getByRole('list', { name: 'Chain beats' });
    const rows = within(beats).getAllByRole('listitem');
    expect(rows).toHaveLength(5);
    expect(rows[0]).toHaveTextContent('plant');
    expect(rows[4]).toHaveTextContent('advance');

    expect(screen.getByText('Liora')).toBeTruthy();
    expect(screen.getAllByText('Kael')).not.toHaveLength(0);
    expect(screen.getByText('Arden')).toBeTruthy();
  });

  it('marks the chain needsPayoff-derived status and offers guarded transitions', async () => {
    const user = userEvent.setup();
    const state = buildSeedState();
    render(
      <ClueSystemProvider initialState={state}>
        <ClueChainView chainId="chain-ember-route" />
      </ClueSystemProvider>,
    );

    expect(screen.getByRole('button', { name: 'Mark needsPayoff' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Mark complete' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Mark needsPayoff' }));
    expect(screen.getAllByText('needsPayoff')).not.toHaveLength(0);
  });
});
```

Append to `ClueObjectList.test.tsx`:

```tsx
  it('lists chains in the Chains tab', async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole('tab', { name: 'Chains' }));
    expect(screen.getByText('The ember route')).toBeTruthy();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:web -- src/features/clue-system/components/ClueChainView.test.tsx src/features/clue-system/components/ClueObjectList.test.tsx`
Expected: FAIL — cannot resolve `./ClueChainView`; no Chains tab.

- [ ] **Step 3: Implement**

In `ClueObjectList.tsx`: add `{ kind: 'chain', label: 'Chains' }` to `TABS` and a `case 'chain'` mapping `state.chains.filter(novelId).map({ id: chainId, title, status, riskLevel: 'none' })`. In `ClueWorkspace.tsx`, the create button must not appear for the Chains tab (render it only when `activeKind !== 'chain'`), and route `selectedObject.kind === 'chain'` to `<ClueChainView key={selectedObject.id} chainId={selectedObject.id} />`.

`ClueChainView.tsx`:

```tsx
import { noveloraMockProject } from '../../novelora-cockpit/data/noveloraMockProject';
import { deriveChainStatus } from '../rules/risk';
import { checkChainTransition } from '../rules/stateMachines';
import { useClueSystemDispatch, useClueSystemState } from '../store/ClueSystemContext';
import type { ClueChainStatus } from '../types';

const CHAIN_STATUSES: ClueChainStatus[] = [
  'draft', 'active', 'needsPayoff', 'complete', 'inconsistent', 'abandoned',
];

function characterName(characterId: string | null): string {
  if (!characterId) return 'Not set';
  return (
    noveloraMockProject.characters.find((character) => character.id === characterId)?.name ??
    characterId
  );
}

function chapterTitle(chapterId: string | null): string {
  return (
    noveloraMockProject.chapters.find((chapter) => chapter.id === chapterId)?.title ??
    'No chapter'
  );
}

export function ClueChainView({ chainId }: { chainId: string }) {
  const state = useClueSystemState();
  const dispatch = useClueSystemDispatch();
  const chain = state.chains.find((candidate) => candidate.chainId === chainId);

  if (!chain) {
    return <p className="clue-editor__missing">This chain no longer exists.</p>;
  }

  const chainBeats = state.beats
    .filter((beat) => beat.chainId === chain.chainId)
    .sort((first, second) => first.order - second.order);
  const derivedStatus = deriveChainStatus(chain, state.beats);
  const chainClues = state.clues.filter((clue) => chain.clueIds.includes(clue.clueId));

  return (
    <section className="clue-editor" aria-label="Chain view">
      <header className="clue-editor__header">
        <h2>{chain.title}</h2>
        <span className="clue-editor__badges">
          <span data-badge="status">{chain.status}</span>
          <span data-badge="derived">{`derived: ${derivedStatus}`}</span>
        </span>
      </header>

      <section aria-label="Chain attribution">
        <h3>Attribution</h3>
        <ul className="clue-chain__attributions">
          {chainClues.map((clue) => (
            <li key={clue.clueId}>
              <strong>{clue.title}: </strong>
              {characterName(clue.attribution.providerCharacterId)}
              {' → '}
              {characterName(clue.attribution.triggerCharacterId)}
              {' → '}
              {characterName(clue.attribution.receiverCharacterId)}
              {' → '}
              {characterName(clue.attribution.payoffCharacterId)}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Chain beats">
        <h3>Beats</h3>
        <ul className="clue-beats__list" aria-label="Chain beats">
          {chainBeats.map((beat) => (
            <li key={beat.beatId} className="clue-beats__row">
              <span data-badge="beat-type">{beat.type}</span>
              <span className="clue-beats__chapter">{chapterTitle(beat.chapterId)}</span>
              <span className="clue-beats__summary">{beat.summary}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="clue-editor__transitions" aria-label="Chain transitions">
        {CHAIN_STATUSES.filter((target) => target !== chain.status).map((target) => {
          const result = checkChainTransition(chain, state.beats, target);
          return (
            <button
              key={target}
              type="button"
              disabled={!result.allowed}
              data-denial-reason={result.reason ?? undefined}
              title={result.reason ?? undefined}
              onClick={() =>
                dispatch({
                  type: 'transitionChain',
                  chainId: chain.chainId,
                  to: target,
                  updatedAt: new Date().toISOString(),
                })
              }
            >
              {`Mark ${target}`}
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

Append to `clues.css`:

```css
.clue-chain__attributions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--color-text-muted);
}
```

- [ ] **Step 4: Run tests to verify they pass, then commit**

Run: `npm run test:web -- src/features/clue-system/components/ClueChainView.test.tsx src/features/clue-system/components/ClueObjectList.test.tsx`
Expected: PASS.

```bash
git add apps/web/src/features/clue-system/components/ClueObjectList.tsx apps/web/src/features/clue-system/components/ClueObjectList.test.tsx apps/web/src/features/clue-system/components/ClueChainView.tsx apps/web/src/features/clue-system/components/ClueChainView.test.tsx apps/web/src/features/clue-system/components/ClueWorkspace.tsx apps/web/src/styles/clues.css
git commit -m "feat(clue-system): chains tab and chain view"
```

---

### Task 12: Chapter view + character knowledge view

**Files:**
- Create: `apps/web/src/features/clue-system/components/ChapterClueView.tsx`
- Test: `apps/web/src/features/clue-system/components/ChapterClueView.test.tsx`
- Create: `apps/web/src/features/clue-system/components/CharacterKnowledgeView.tsx`
- Test: `apps/web/src/features/clue-system/components/CharacterKnowledgeView.test.tsx`
- Modify: `apps/web/src/features/clue-system/components/ClueWorkspace.tsx` (view-mode switcher)
- Modify: `apps/web/src/styles/clues.css`

**Interfaces:**
- Produces:
  - `ClueWorkspace` gains view mode state (`'objects' | 'chapters' | 'characters'`, default `'objects'`) with an `aria-label="Clue view modes"` button group (`aria-pressed`) above the body. `'objects'` shows the current list+detail layout; the other modes replace the body with the corresponding view.
  - `ChapterClueView()` — for each fixture chapter (order ascending): chapter heading; beats in that chapter (type + summary, active novel only); information states at that chapter (object title + reader knowledge).
  - `CharacterKnowledgeView()` — a character `<select>` (fixture characters) + sections: "Knowledge" (information-state entries for that character, with clue title + knowledgeState), "Attribution roles" (clues where the character is provider/trigger/receiver/concealer/misleader), "Misled by" (red herrings targeting them).

- [ ] **Step 1: Write the failing tests**

`ChapterClueView.test.tsx`:

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildSeedState } from '../store/seedProject';
import { ClueSystemProvider } from '../store/ClueSystemContext';
import { ChapterClueView } from './ChapterClueView';

describe('ChapterClueView', () => {
  it('groups beats and information states by chapter', () => {
    render(
      <ClueSystemProvider initialState={buildSeedState()}>
        <ChapterClueView />
      </ClueSystemProvider>,
    );

    const chapter3 = screen.getByRole('region', { name: 'Salt Map, Ember Mark' });
    expect(within(chapter3).getAllByRole('listitem')).not.toHaveLength(0);
    expect(chapter3).toHaveTextContent('The ashfall tide mark aligns');
    expect(chapter3).toHaveTextContent('knowsPartial');

    const chapter6 = screen.getByRole('region', { name: 'Embers Under Black Water' });
    expect(chapter6).toHaveTextContent('payoff');
  });
});
```

`CharacterKnowledgeView.test.tsx`:

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { buildSeedState } from '../store/seedProject';
import { ClueSystemProvider } from '../store/ClueSystemContext';
import { CharacterKnowledgeView } from './CharacterKnowledgeView';

describe('CharacterKnowledgeView', () => {
  it('shows Kael knowledge, roles and misleads by default', () => {
    render(
      <ClueSystemProvider initialState={buildSeedState()}>
        <CharacterKnowledgeView />
      </ClueSystemProvider>,
    );

    expect(screen.getByRole('combobox', { name: 'Character' })).toHaveValue('kael');
    expect(screen.getByText('knowsTruth')).toBeTruthy();
    expect(screen.getByText('Trigger')).toBeTruthy();
    expect(screen.getByText('Receiver')).toBeTruthy();
    expect(screen.getByText('The rescue beacon')).toBeTruthy();
  });

  it('switches to Arden concealing and misleading', async () => {
    const user = userEvent.setup();
    render(
      <ClueSystemProvider initialState={buildSeedState()}>
        <CharacterKnowledgeView />
      </ClueSystemProvider>,
    );

    await user.selectOptions(screen.getByRole('combobox', { name: 'Character' }), 'arden');
    expect(screen.getByText('conceals')).toBeTruthy();
    expect(screen.getByText('Misleader')).toBeTruthy();
  });
});
```

(For Arden: seed herring misleader is arden → "Misleader" row; info state has arden conceals → "conceals".)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:web -- src/features/clue-system/components/ChapterClueView.test.tsx src/features/clue-system/components/CharacterKnowledgeView.test.tsx`
Expected: FAIL — cannot resolve modules.

- [ ] **Step 3: Create the two views**

`ChapterClueView.tsx`:

```tsx
import { noveloraMockProject } from '../../novelora-cockpit/data/noveloraMockProject';
import { useClueSystemState } from '../store/ClueSystemContext';

export function ChapterClueView() {
  const state = useClueSystemState();
  const { activeNovelId } = state;
  const chapters = [...noveloraMockProject.chapters].sort(
    (first, second) => first.order - second.order,
  );

  function clueTitle(clueId: string | null): string {
    return state.clues.find((clue) => clue.clueId === clueId)?.title ?? '';
  }

  return (
    <div className="clue-chapters">
      {chapters.map((chapter) => {
        const beats = state.beats
          .filter((beat) => beat.novelId === activeNovelId && beat.chapterId === chapter.id)
          .sort((first, second) => first.order - second.order);
        const infoStates = state.informationStates.filter(
          (infoState) =>
            infoState.novelId === activeNovelId && infoState.chapterId === chapter.id,
        );

        if (beats.length === 0 && infoStates.length === 0) return null;

        return (
          <section
            key={chapter.id}
            className="clue-chapters__section"
            aria-label={chapter.title}
          >
            <h3>{chapter.title}</h3>
            <ul>
              {beats.map((beat) => (
                <li key={beat.beatId}>
                  <span data-badge="beat-type">{beat.type}</span> {beat.summary}
                </li>
              ))}
              {infoStates.map((infoState) => (
                <li key={infoState.informationStateId}>
                  <span data-badge="info">info</span>{' '}
                  {infoState.objectType === 'clue' ? clueTitle(infoState.objectId) : infoState.objectId}
                  {` — reader ${infoState.readerKnowledge}`}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
```

`CharacterKnowledgeView.tsx`:

```tsx
import { useState } from 'react';
import { noveloraMockProject } from '../../novelora-cockpit/data/noveloraMockProject';
import { useClueSystemState } from '../store/ClueSystemContext';

export function CharacterKnowledgeView() {
  const state = useClueSystemState();
  const [characterId, setCharacterId] = useState(noveloraMockProject.characters[0].id);
  const { activeNovelId } = state;

  const knowledgeEntries = state.informationStates
    .filter((infoState) => infoState.novelId === activeNovelId)
    .flatMap((infoState) =>
      infoState.characterKnowledge
        .filter((entry) => entry.characterId === characterId)
        .map((entry) => ({
          id: infoState.informationStateId,
          title:
            state.clues.find((clue) => clue.clueId === infoState.objectId)?.title ??
            infoState.objectId,
          knowledgeState: entry.knowledgeState,
        })),
    );

  const roles: Array<{ role: string; title: string }> = [];
  for (const clue of state.clues.filter((candidate) => candidate.novelId === activeNovelId)) {
    const attribution = clue.attribution;
    if (attribution.providerCharacterId === characterId) roles.push({ role: 'Provider', title: clue.title });
    if (attribution.triggerCharacterId === characterId) roles.push({ role: 'Trigger', title: clue.title });
    if (attribution.receiverCharacterId === characterId) roles.push({ role: 'Receiver', title: clue.title });
    if (attribution.concealerCharacterId === characterId) roles.push({ role: 'Concealer', title: clue.title });
    if (attribution.misleaderCharacterId === characterId) roles.push({ role: 'Misleader', title: clue.title });
  }

  const misledBy = state.redHerrings.filter(
    (herring) =>
      herring.novelId === activeNovelId && herring.targetCharacterIds.includes(characterId),
  );

  return (
    <section className="clue-character" aria-label="Character knowledge">
      <label>
        Character
        <select value={characterId} onChange={(event) => setCharacterId(event.target.value)}>
          {noveloraMockProject.characters.map((character) => (
            <option key={character.id} value={character.id}>{character.name}</option>
          ))}
        </select>
      </label>

      <section aria-label="Knowledge">
        <h3>Knowledge</h3>
        <ul>
          {knowledgeEntries.map((entry) => (
            <li key={`${entry.id}-${entry.title}`}>
              {entry.title}: {entry.knowledgeState}
            </li>
          ))}
          {knowledgeEntries.length === 0 ? <li>No recorded knowledge.</li> : null}
        </ul>
      </section>

      <section aria-label="Attribution roles">
        <h3>Attribution roles</h3>
        <ul>
          {roles.map((entry, index) => (
            <li key={`${entry.role}-${index}`}>
              {entry.role}: {entry.title}
            </li>
          ))}
          {roles.length === 0 ? <li>No attribution roles.</li> : null}
        </ul>
      </section>

      <section aria-label="Misled by">
        <h3>Misled by</h3>
        <ul>
          {misledBy.map((herring) => (
            <li key={herring.redHerringId}>{herring.title}</li>
          ))}
          {misledBy.length === 0 ? <li>Not misled by any red herring.</li> : null}
        </ul>
      </section>
    </section>
  );
}
```

Note for the test expectation `getByText('Trigger')` / `'Receiver'`: Kael is trigger and receiver on the tide map clue, producing "Trigger: The old tide map" — `getByText('Trigger')` matches the exact-role text node only if the li splits text; render as `<li>{entry.role}: {entry.title}</li>` produces a single text node "Trigger: The old tide map" — so tests should use `screen.getByText(/Trigger/)`? The plan's test uses exact 'Trigger' — adjust implementation so the role is in its own element: `<li><span data-badge="role">{entry.role}</span> {entry.title}</li>` — then `getByText('Trigger')` matches the span exactly. Use this markup. Same for 'Receiver', 'Misleader'.

In `ClueWorkspace.tsx`:
- Add `const [viewMode, setViewMode] = useState<'objects' | 'chapters' | 'characters'>('objects');`
- Render a view-mode group above `.clue-workspace__body`:

```tsx
      <div className="clue-workspace__modes" role="group" aria-label="Clue view modes">
        {(['objects', 'chapters', 'characters'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={viewMode === mode}
            onClick={() => setViewMode(mode)}
          >
            {mode === 'objects' ? 'By object' : mode === 'chapters' ? 'By chapter' : 'By character'}
          </button>
        ))}
      </div>
```

- Render body conditionally: `'objects'` → existing list+detail; `'chapters'` → `<ChapterClueView />`; `'characters'` → `<CharacterKnowledgeView />`.

Append to `clues.css`:

```css
.clue-workspace__modes {
  display: flex;
  gap: 6px;
}

.clue-workspace__modes button {
  padding: 6px 10px;
  border: 1px solid var(--color-mint-line);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-text-muted);
}

.clue-workspace__modes button[aria-pressed='true'] {
  border-color: var(--color-mint-primary);
  color: var(--color-mint-primary);
}

.clue-chapters,
.clue-character {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.clue-chapters__section ul,
.clue-character ul {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--color-text-muted);
}

.clue-chapters__section [data-badge='beat-type'],
.clue-chapters__section [data-badge='info'],
.clue-character [data-badge='role'] {
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-mint-soft);
  color: var(--color-ink);
  font-size: 0.72rem;
}
```

- [ ] **Step 4: Run tests to verify they pass, then commit**

Run: `npm run test:web -- src/features/clue-system/components/ChapterClueView.test.tsx src/features/clue-system/components/CharacterKnowledgeView.test.tsx src/App.test.tsx`
Expected: PASS.

```bash
git add apps/web/src/features/clue-system/components/ChapterClueView.tsx apps/web/src/features/clue-system/components/ChapterClueView.test.tsx apps/web/src/features/clue-system/components/CharacterKnowledgeView.tsx apps/web/src/features/clue-system/components/CharacterKnowledgeView.test.tsx apps/web/src/features/clue-system/components/ClueWorkspace.tsx apps/web/src/styles/clues.css
git commit -m "feat(clue-system): chapter and character knowledge views"
```

---

### Task 13: Risk drawer + CSS contract test + final verification

**Files:**
- Create: `apps/web/src/features/clue-system/components/RiskDrawer.tsx`
- Test: `apps/web/src/features/clue-system/components/RiskDrawer.test.tsx`
- Modify: `apps/web/src/features/clue-system/components/ClueWorkspace.tsx` (risk button + drawer state)
- Modify: `apps/web/src/styles/clues.css`
- Modify: `apps/web/src/styles/global.test.ts`

**Interfaces:**
- Produces: `RiskDrawer({ onSelect }: { onSelect: (selection: SelectedObject) => void })` — bottom drawer dialog (`role="dialog"`, `aria-label="Clue risks"`) listing: unpaid foreshadowings (`findUnpaidForeshadowings`), clues with missingFields (missingAttribution), timeline conflicts (`findTimelineConflicts` per chain), knowledge conflicts (`findKnowledgeConflicts`); each item a button that selects the object (chain conflicts select the chain; knowledge conflicts select the clue) and closes the drawer. Workspace bottom bar shows `Risks (N)` button with the total count.
- `global.test.ts` gains a `cluesCss` contract describe: global.css imports it, no hex literals, reduced-motion block present.

- [ ] **Step 1: Write the failing test `RiskDrawer.test.tsx`**

```tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { buildSeedState } from '../store/seedProject';
import { ClueSystemProvider } from '../store/ClueSystemContext';
import { RiskDrawer } from './RiskDrawer';

function renderDrawer(onSelect = vi.fn()) {
  render(
    <ClueSystemProvider initialState={buildSeedState()}>
      <RiskDrawer onSelect={onSelect} />
    </ClueSystemProvider>,
  );
  return onSelect;
}

describe('RiskDrawer', () => {
  it('lists the two unpaid foreshadowings', () => {
    renderDrawer();

    const dialog = screen.getByRole('dialog', { name: 'Clue risks' });
    expect(dialog).toHaveTextContent('The drowned forge threshold');
    expect(dialog).toHaveTextContent('Selene’s reef bargain');
  });

  it('selects a foreshadowing from the unpaid list', async () => {
    const user = userEvent.setup();
    const onSelect = renderDrawer();

    await user.click(screen.getByRole('button', { name: /The drowned forge threshold/ }));
    expect(onSelect).toHaveBeenCalledWith({
      kind: 'foreshadowing',
      id: 'foreshadowing-forge-threshold',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:web -- src/features/clue-system/components/RiskDrawer.test.tsx`
Expected: FAIL — cannot resolve `./RiskDrawer`.

- [ ] **Step 3: Create `RiskDrawer.tsx` and wire the button**

`RiskDrawer.tsx`:

```tsx
import { createPortal } from 'react-dom';
import { useDialogBehavior } from './dialogBehavior';
import {
  findKnowledgeConflicts,
  findTimelineConflicts,
  findUnpaidForeshadowings,
} from '../rules/risk';
import { useClueSystemState } from '../store/ClueSystemContext';
import type { SelectedObject } from './selection';

export function RiskDrawer({ onSelect, onClose }: { onSelect: (selection: SelectedObject) => void; onClose: () => void }) {
  const state = useClueSystemState();
  const { dialogRef, closeButtonRef, trapFocus } = useDialogBehavior(true, onClose);
  const { activeNovelId } = state;

  const unpaid = findUnpaidForeshadowings(state, activeNovelId);
  const missingAttribution = state.clues.filter(
    (clue) => clue.novelId === activeNovelId && clue.missingFields.length > 0,
  );
  const timelineConflicts = state.chains
    .filter((chain) => chain.novelId === activeNovelId)
    .flatMap((chain) => findTimelineConflicts(chain, state.beats));
  const knowledgeConflicts = findKnowledgeConflicts(state, activeNovelId);

  function selectAndClose(selection: SelectedObject) {
    onSelect(selection);
    onClose();
  }

  return createPortal(
    <div className="clue-risk-backdrop">
      <section
        ref={dialogRef}
        className="clue-risk-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Clue risks"
        onKeyDown={trapFocus}
      >
        <header className="clue-dialog__header">
          <h2>Clue risks</h2>
          <button ref={closeButtonRef} type="button" aria-label="Close clue risks" onClick={onClose}>
            ×
          </button>
        </header>

        <section aria-label="Unpaid foreshadowings">
          <h3>Unpaid foreshadowings</h3>
          <ul>
            {unpaid.map((foreshadowing) => (
              <li key={foreshadowing.foreshadowingId}>
                <button
                  type="button"
                  onClick={() =>
                    selectAndClose({
                      kind: 'foreshadowing',
                      id: foreshadowing.foreshadowingId,
                    })
                  }
                >
                  {foreshadowing.title}
                </button>
              </li>
            ))}
            {unpaid.length === 0 ? <li>No unpaid foreshadowings.</li> : null}
          </ul>
        </section>

        <section aria-label="Missing attribution">
          <h3>Missing attribution</h3>
          <ul>
            {missingAttribution.map((clue) => (
              <li key={clue.clueId}>
                <button
                  type="button"
                  onClick={() => selectAndClose({ kind: 'clue', id: clue.clueId })}
                >
                  {clue.title}
                </button>
              </li>
            ))}
            {missingAttribution.length === 0 ? <li>No clues missing attribution.</li> : null}
          </ul>
        </section>

        <section aria-label="Timeline conflicts">
          <h3>Timeline conflicts</h3>
          <ul>
            {timelineConflicts.map((conflict) => (
              <li key={`${conflict.chainId}-${conflict.earlyBeatId}`}>
                <button
                  type="button"
                  onClick={() => selectAndClose({ kind: 'chain', id: conflict.chainId })}
                >
                  {`Chain ${conflict.chainId}: beat ${conflict.earlyBeatId} precedes plant ${conflict.plantBeatId}`}
                </button>
              </li>
            ))}
            {timelineConflicts.length === 0 ? <li>No timeline conflicts.</li> : null}
          </ul>
        </section>

        <section aria-label="Knowledge conflicts">
          <h3>Knowledge conflicts</h3>
          <ul>
            {knowledgeConflicts.map((conflict) => {
              const infoState = state.informationStates.find(
                (candidate) => candidate.informationStateId === conflict.informationStateId,
              );
              return (
                <li key={`${conflict.informationStateId}-${conflict.characterId}`}>
                  <button
                    type="button"
                    onClick={() =>
                      selectAndClose({
                        kind: 'clue',
                        id: infoState?.objectId ?? '',
                      })
                    }
                  >
                    {`${conflict.characterId}: ${conflict.reason}`}
                  </button>
                </li>
              );
            })}
            {knowledgeConflicts.length === 0 ? <li>No knowledge conflicts.</li> : null}
          </ul>
        </section>
      </section>
    </div>,
    document.body,
  );
}
```

In `ClueWorkspace.tsx`:
- Add `const [riskDrawerOpen, setRiskDrawerOpen] = useState(false);`
- Compute the total count with the same four rule calls (import them) and render a bottom bar after the body:

```tsx
      <div className="clue-workspace__footer">
        <button type="button" onClick={() => setRiskDrawerOpen(true)}>
          {`Risks (${riskCount})`}
        </button>
      </div>
      {riskDrawerOpen ? (
        <RiskDrawer
          onSelect={(selection) => {
            setSelectedObject(selection);
            setViewMode('objects');
          }}
          onClose={() => setRiskDrawerOpen(false)}
        />
      ) : null}
```

- Export a shared counter? Keep the count computation inline in ClueWorkspace (duplication of four rule calls is acceptable; the drawer recomputes for display).

- [ ] **Step 4: Add CSS + contract test**

Append to `clues.css`:

```css
.clue-workspace__footer {
  display: flex;
  justify-content: flex-end;
}

.clue-risk-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: flex-end;
  background: var(--surface-border-whisper);
}

.clue-risk-drawer {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-height: 60vh;
  overflow-y: auto;
  padding: 20px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-mint-line);
  border-radius: var(--radius-panel) var(--radius-panel) 0 0;
  box-shadow: var(--shadow-float);
}

.clue-risk-drawer ul {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
```

In `global.test.ts`, add near the other source reads:

```ts
const cluesCss = readFileSync(resolve(process.cwd(), 'src/styles/clues.css'), 'utf8');
```

Append a new describe block:

```ts
describe('clues.css contract', () => {
  it('is imported by global.css', () => {
    expect(globalCss).toContain("@import './clues.css';");
  });

  it('uses design tokens instead of literal hex colors', () => {
    expect(stripCssComments(cluesCss).match(/#[0-9a-f]{3,8}\b/gi) ?? []).toEqual([]);
  });

  it('declares a reduced-motion block', () => {
    expect(cluesCss).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)/);
  });
});
```

- [ ] **Step 5: Run everything, then commit**

Run: `npm run test:web -- src/features/clue-system/components/RiskDrawer.test.tsx src/styles/global.test.ts` then `npm run test:web`, `npm run lint:web`, `npm run build:web`
Expected: all PASS.

```bash
git add apps/web/src/features/clue-system/components/RiskDrawer.tsx apps/web/src/features/clue-system/components/RiskDrawer.test.tsx apps/web/src/features/clue-system/components/ClueWorkspace.tsx apps/web/src/styles/clues.css apps/web/src/styles/global.test.ts
git commit -m "feat(clue-system): risk drawer and clues.css contract"
```

---

## P2 Acceptance Checklist

- [ ] `npm run test:web` green (all existing + new tests)
- [ ] `npm run lint:web` clean
- [ ] `npm run build:web` clean
- [ ] Sidebar has a working Clues nav item; cockpit ↔ clue workspace switch preserves both UIs
- [ ] All editors write through the guarded reducer actions (no direct status mutation)
- [ ] Chain completion respects timeline conflicts (spec §16.3)
- [ ] Risk drawer surfaces unpaid foreshadowings, missing attribution, timeline and knowledge conflicts
- [ ] clues.css is hex-free and covered by the style contract test

