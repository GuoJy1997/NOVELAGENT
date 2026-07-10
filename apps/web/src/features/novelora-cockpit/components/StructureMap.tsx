import type { Act } from '../types';

interface StructureMapProps {
  acts: Act[];
  selectedActId: string;
  onSelectAct: (actId: string) => void;
}

const actColors = ['coral', 'mint', 'sky', 'amber'] as const;

function getChapterRange(chapterIds: string[]) {
  const chapterNumbers = chapterIds
    .map((chapterId) => Number(chapterId.replace('chapter-', '')))
    .filter(Number.isFinite);

  if (chapterNumbers.length === 0) {
    return 'No chapters';
  }

  const firstChapter = Math.min(...chapterNumbers);
  const lastChapter = Math.max(...chapterNumbers);

  return firstChapter === lastChapter
    ? `Chapter ${firstChapter}`
    : `Chapters ${firstChapter}–${lastChapter}`;
}

function getStructureProgress(index: number, totalActs: number) {
  return Math.round(((index + 1) / totalActs) * 100);
}

export function StructureMap({ acts, selectedActId, onSelectAct }: StructureMapProps) {
  return (
    <section className="structure-map" aria-labelledby="structure-map-title">
      <div className="workspace-section-heading">
        <div>
          <p className="workspace-eyebrow">Whole novel</p>
          <h2 id="structure-map-title">Structure map</h2>
        </div>
        <p className="workspace-section-note">Select an act to focus its chapter lane.</p>
      </div>

      <div className="structure-map__rail">
        <svg className="structure-map__connectors" aria-hidden="true" focusable="false" viewBox="0 0 1000 130" preserveAspectRatio="none">
          <path d="M 90 66 C 180 18, 290 114, 390 66 S 600 18, 670 66 S 840 114, 930 66" />
          <circle cx="90" cy="66" r="5" />
          <circle cx="390" cy="66" r="5" />
          <circle cx="670" cy="66" r="5" />
          <circle cx="930" cy="66" r="5" />
        </svg>

        <div className="structure-map__cards">
          {acts.map((act, index) => {
            const progress = getStructureProgress(index, acts.length);
            const color = actColors[index % actColors.length];
            const isSelected = act.id === selectedActId;

            return (
              <button
                key={act.id}
                className={`act-card act-card--${color}${isSelected ? ' is-selected' : ''}`}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectAct(act.id)}
              >
                <span className="act-card__topline">
                  <span className="act-card__index">0{index + 1}</span>
                  <span>{getChapterRange(act.chapterIds)}</span>
                </span>
                <strong>{act.title}</strong>
                <span className="act-card__summary">{act.summary}</span>
                <span className="act-card__progress">
                  <span className="act-card__progress-label">Structure mapped</span>
                  <span>{progress}%</span>
                </span>
                <span className="act-card__meter" aria-hidden="true">
                  <span style={{ width: `${progress}%` }} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
