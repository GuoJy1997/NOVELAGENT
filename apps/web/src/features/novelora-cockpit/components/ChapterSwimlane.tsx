import { useState } from 'react';
import type { CockpitChapter } from '../types';
import { OccludedPanel } from './OccludedPanel';

interface ChapterSwimlaneProps {
  chapters: CockpitChapter[];
  selectedChapterId: string;
  onSelectChapter: (chapterId: string) => void;
}

const chapterStatusLabels: Record<CockpitChapter['status'], string> = {
  planned: 'Planned',
  drafting: 'Drafting',
  review: 'In review',
  complete: 'Complete',
};

export function ChapterSwimlane({
  chapters,
  selectedChapterId,
  onSelectChapter,
}: ChapterSwimlaneProps) {
  const [isReordering, setIsReordering] = useState(false);
  const selectedChapterIndex = chapters.findIndex((chapter) => chapter.id === selectedChapterId);

  return (
    <OccludedPanel className="chapter-timeline" labelledBy="chapter-timeline-title">
      <header className="echo-panel-heading chapter-timeline__heading">
        <h2 id="chapter-timeline-title">Chapter Timeline</h2>
        <button
          className="chapter-timeline__reorder"
          type="button"
          aria-label="Reorder chapters"
          aria-pressed={isReordering}
          onClick={() => setIsReordering((isActive) => !isActive)}
        >
          Reorder
        </button>
      </header>

      {isReordering ? (
        <p className="chapter-timeline__status" role="status" aria-live="polite">
          Reorder mode active. Drag persistence is not available in this demo.
        </p>
      ) : null}

      <div
        className="chapter-timeline__rail"
        role="region"
        tabIndex={0}
        aria-label="Chapter timeline chapters"
      >
        <div className="chapter-timeline__cards">
          {chapters.map((chapter) => {
            const isSelected = chapter.id === selectedChapterId;

            return (
              <button
                key={chapter.id}
                className={`chapter-timeline__card${isSelected ? ' is-selected' : ''}`}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectChapter(chapter.id)}
                onFocus={(event) =>
                  event.currentTarget.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
                }
              >
                <span className="chapter-timeline__number">Chapter {chapter.order}</span>
                <strong>{chapter.title}</strong>
                <span className="chapter-timeline__beat">{chapter.beat}</span>
                <span className="chapter-timeline__meta">
                  <span>{chapter.wordCount.toLocaleString()} words</span>
                  <span className={`chapter-timeline__chapter-status is-${chapter.status}`}>
                    {chapterStatusLabels[chapter.status]}
                  </span>
                </span>
              </button>
            );
          })}

          <button className="chapter-timeline__add" type="button" disabled>
            <span aria-hidden="true">+</span>
            Add Chapter
          </button>
        </div>

        <div className="chapter-timeline__progress" role="group" aria-label="Chapter progress">
          {chapters.length >= 2 ? (
            <span className="chapter-timeline__progress-line" aria-hidden="true" />
          ) : null}
          {chapters.map((chapter, index) => {
            const isCurrent = index === selectedChapterIndex;
            const isComplete = selectedChapterIndex >= 0 && index <= selectedChapterIndex;
            const isLater = !isComplete;
            const progressStatus = isCurrent ? 'current' : isComplete ? 'complete' : 'later';

            return (
              <span
                key={chapter.id}
                className={`chapter-timeline__progress-node${isComplete ? ' is-complete' : ''}${isCurrent ? ' is-current' : ''}${isLater ? ' is-later' : ''}`}
                role="img"
                aria-label={`Chapter ${chapter.order} ${progressStatus}`}
              />
            );
          })}
        </div>
      </div>
    </OccludedPanel>
  );
}
