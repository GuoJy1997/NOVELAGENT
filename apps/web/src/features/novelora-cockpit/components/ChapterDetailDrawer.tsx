import { useEffect, useRef, type RefObject } from 'react';
import type { CockpitChapter, NoveloraProject } from '../types';

interface ChapterDetailDrawerProps {
  project: NoveloraProject;
  selectedChapter?: CockpitChapter;
  isOpen: boolean;
  onClose: () => void;
  invokerRef: RefObject<HTMLButtonElement | null>;
}

const beats = ['Opening pressure', 'Crossing a threshold', 'Turning point', 'Reckoning'];

function wordCount(chapter: CockpitChapter) {
  return `${(chapter.order * 1150 + 950).toLocaleString()} words`;
}

function relatedCharacters(project: NoveloraProject, chapter: CockpitChapter) {
  const chapterClueText = project.clueFlows
    .filter((flow) =>
      [flow.provider, flow.trigger, flow.receiver, flow.payoff].some(
        (stage) => stage.chapterId === chapter.id,
      ),
    )
    .map((flow) =>
      [
        flow.provider.providedBy,
        flow.trigger.triggeredBy,
        flow.receiver.receivedBy,
        flow.payoff.paidOffBy,
      ].join(' '),
    )
    .join(' ');

  return project.characters.filter((character) => chapterClueText.includes(character.name));
}

function relatedClues(project: NoveloraProject, chapter: CockpitChapter) {
  return project.clueFlows.filter((flow) =>
    [flow.provider, flow.trigger, flow.receiver, flow.payoff].some(
      (stage) => stage.chapterId === chapter.id,
    ),
  );
}

export function ChapterDetailDrawer({
  project,
  selectedChapter,
  isOpen,
  onClose,
  invokerRef,
}: ChapterDetailDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      closeButtonRef.current?.focus();
      return;
    }

    if (wasOpenRef.current) {
      invokerRef.current?.focus();
      wasOpenRef.current = false;
    }
  }, [invokerRef, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !selectedChapter) {
    return null;
  }

  const act = project.acts.find((candidate) => candidate.id === selectedChapter.actId);
  const characters = relatedCharacters(project, selectedChapter);
  const clues = relatedClues(project, selectedChapter);

  return (
    <div className="chapter-drawer-backdrop">
      <aside
        className="chapter-detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Chapter details"
      >
        <div className="chapter-detail-drawer__header">
          <div>
            <p className="workspace-eyebrow">Chapter details</p>
            <h2 id="chapter-detail-title">{selectedChapter.title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            className="chapter-detail-drawer__close"
            type="button"
            aria-label="Close chapter details"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <dl className="chapter-detail-facts">
          <div><dt>Act</dt><dd>{act?.title ?? 'Unassigned act'}</dd></div>
          <div><dt>Beat</dt><dd>{beats[(selectedChapter.order - 1) % beats.length]}</dd></div>
          <div><dt>Draft length</dt><dd>{wordCount(selectedChapter)}</dd></div>
        </dl>

        <p className="chapter-detail-summary">{selectedChapter.summary}</p>

        <section aria-labelledby="chapter-detail-characters">
          <p className="workspace-eyebrow">Associated characters</p>
          <h3 id="chapter-detail-characters">In this clue context</h3>
          {characters.length ? (
            <ul className="chapter-detail-tags">
              {characters.map((character) => <li key={character.id}>{character.name}</li>)}
            </ul>
          ) : <p className="chapter-detail-empty">No characters are named by this chapter's linked clue flow.</p>}
        </section>

        <section aria-labelledby="chapter-detail-clues">
          <p className="workspace-eyebrow">Linked clue flows</p>
          <h3 id="chapter-detail-clues">Evidence in motion</h3>
          {clues.length ? (
            <ul className="chapter-detail-clue-list">
              {clues.map((clue) => <li key={clue.id}>{clue.title}</li>)}
            </ul>
          ) : <p className="chapter-detail-empty">No clue flow is linked to this chapter yet.</p>}
        </section>
      </aside>
    </div>
  );
}
