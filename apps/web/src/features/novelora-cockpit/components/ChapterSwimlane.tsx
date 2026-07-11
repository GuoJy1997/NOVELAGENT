import type { CockpitChapter } from '../types';

interface ChapterSwimlaneProps {
  chapters: CockpitChapter[];
  selectedChapterId: string;
  onSelectChapter: (chapterId: string) => void;
}

function getLockLabel(status: CockpitChapter['status']) {
  if (status === 'complete') {
    return 'Locked';
  }

  return status === 'review' ? 'Review lock' : 'Open draft';
}

export function ChapterSwimlane({
  chapters,
  selectedChapterId,
  onSelectChapter,
}: ChapterSwimlaneProps) {
  return (
    <section className="chapter-swimlane" aria-labelledby="chapter-swimlane-title">
      <div className="workspace-section-heading">
        <div>
          <p className="workspace-eyebrow">Current act</p>
          <h2 id="chapter-swimlane-title">Chapter swimlane</h2>
        </div>
        <p className="workspace-section-note">Follow the scene rhythm across this act.</p>
      </div>

      <div className="chapter-swimlane__scroll" tabIndex={0} aria-label="Chapter lane">
        <div className="chapter-swimlane__rail">
          {chapters.map((chapter) => {
            const isSelected = chapter.id === selectedChapterId;

            return (
              <button
                key={chapter.id}
                className={`chapter-card${isSelected ? ' is-selected' : ''}`}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectChapter(chapter.id)}
              >
                <span className="chapter-card__number">Chapter {chapter.order}</span>
                <strong>{chapter.title}</strong>
                <span className="chapter-card__beat">{chapter.beat}</span>
                <span className="chapter-card__summary">{chapter.summary}</span>
                <span className="chapter-card__meta">
                  <span>{chapter.wordCount.toLocaleString()} words</span>
                  <span>{chapter.clueCount} clues</span>
                </span>
                <span className="chapter-card__footer">
                  <span className="chapter-card__avatars" aria-label={`Characters: ${chapter.characterIds.join(', ')}`}>
                    {chapter.characterIds.map((characterId) => (
                      <span key={characterId} aria-hidden="true">
                        {characterId.slice(0, 1).toUpperCase()}
                      </span>
                    ))}
                  </span>
                  <span className={`chapter-card__lock chapter-card__lock--${chapter.status}`}>
                    {getLockLabel(chapter.status)}
                  </span>
                </span>
              </button>
            );
          })}

          <button className="chapter-add-card" type="button" disabled>
            <span aria-hidden="true">+</span>
            Add Chapter
          </button>
        </div>
      </div>
    </section>
  );
}
