import type { CockpitChapter } from '../types';

interface ChapterSwimlaneProps {
  chapters: CockpitChapter[];
  selectedChapterId: string;
  onSelectChapter: (chapterId: string) => void;
}

const beats = ['Opening pressure', 'Crossing a threshold', 'Turning point', 'Reckoning'];
const chapterCharacters = [
  ['Kael', 'Liora'],
  ['Liora', 'Arden'],
  ['Kael', 'Vex'],
  ['Selene', 'Kael'],
];

function getWordCount(chapter: CockpitChapter) {
  return `${(chapter.order * 1150 + 950).toLocaleString()} words`;
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
          {chapters.map((chapter, index) => {
            const isSelected = chapter.id === selectedChapterId;
            const characters = chapterCharacters[index % chapterCharacters.length];
            const clueCount = (chapter.order % 3) + 1;

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
                <span className="chapter-card__beat">{beats[index % beats.length]}</span>
                <span className="chapter-card__summary">{chapter.summary}</span>
                <span className="chapter-card__meta">
                  <span>{getWordCount(chapter)}</span>
                  <span>{clueCount} clues</span>
                </span>
                <span className="chapter-card__footer">
                  <span className="chapter-card__avatars" aria-label={`Characters: ${characters.join(', ')}`}>
                    {characters.map((character) => (
                      <span key={character} aria-hidden="true">
                        {character.slice(0, 1)}
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
