import type { KeyboardEvent, RefObject } from 'react';
import type { CockpitChapter } from '../types';
import { OccludedPanel } from './OccludedPanel';

interface ChapterSwimlaneProps {
  chapters: CockpitChapter[];
  selectedChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  onOpenDetails?: () => void;
  detailsButtonRef?: RefObject<HTMLButtonElement | null>;
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
  onOpenDetails,
  detailsButtonRef,
}: ChapterSwimlaneProps) {
  const selectedChapterIndex = chapters.findIndex((chapter) => chapter.id === selectedChapterId);

  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>, chapterId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectChapter(chapterId);
    }
  }

  return (
    <OccludedPanel
      className="chapter-timeline"
      labelledBy="chapter-timeline-title"
    >
      <header className="echo-panel-heading chapter-timeline__heading">
        <h2 id="chapter-timeline-title">Chapter Timeline</h2>
      </header>

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
              <div
                key={chapter.id}
                className={`chapter-timeline__card${isSelected ? ' is-selected' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => onSelectChapter(chapter.id)}
                onKeyDown={(event) => handleCardKeyDown(event, chapter.id)}
                onFocus={(event) =>
                  event.currentTarget.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
                }
              >
                <span className="chapter-timeline__number">Ch. {chapter.order}</span>
                {isSelected && onOpenDetails ? (
                  <button
                    ref={detailsButtonRef}
                    className="chapter-timeline__details"
                    type="button"
                    aria-label="Open chapter details"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenDetails();
                    }}
                  >
                    <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                      <path d="M2.5 7.5 6 4l3.5 3.5" />
                    </svg>
                  </button>
                ) : null}
                <strong>{chapter.title}</strong>
                <span className="chapter-timeline__meta">
                  <span className="chapter-timeline__beat">{chapter.beat}</span>
                  <span>{chapter.wordCount.toLocaleString()} words</span>
                </span>
                <span className="sr-only">{chapterStatusLabels[chapter.status]}</span>
              </div>
            );
          })}

          <button className="chapter-timeline__add" type="button" disabled aria-label="Add Chapter">
            <span aria-hidden="true">+</span>
          </button>
        </div>

        <div className="chapter-timeline__progress" role="group" aria-label="Chapter progress">
          {chapters.length >= 2 ? (
            <svg
              className="chapter-timeline__progress-line"
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 100 2"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="echoProgressGradientTimeline" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="var(--bixin-green-600)" />
                  <stop offset="1" stopColor="var(--bixin-green-700)" />
                </linearGradient>
              </defs>
              <line
                x1="0"
                y1="1"
                x2="100"
                y2="1"
                stroke="url(#echoProgressGradientTimeline)"
                strokeWidth="2"
              />
            </svg>
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
