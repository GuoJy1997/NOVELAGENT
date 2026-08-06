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
