import type { CSSProperties } from 'react';
import { clueNodes } from '../assetRegistry';
import type { Act } from '../types';
import { OccludedPanel } from './OccludedPanel';

interface StructureMapProps {
  acts: Act[];
  selectedActId: string;
  onSelectAct: (actId: string) => void;
}

const actPhases = ['Setup', 'Confrontation', 'Resolution', 'Aftermath'] as const;
const actPercentages = ['1 - 25%', '25 - 75%', '75 - 100%', '100%+'] as const;
const actIcons = [clueNodes.origin, clueNodes.trigger, clueNodes.receiver, clueNodes.payoff] as const;

function getChapterMetric(chapterIds: string[]) {
  if (chapterIds.length === 0) return 'No chapters';

  const chapterCount = `${chapterIds.length} ${chapterIds.length === 1 ? 'chapter' : 'chapters'}`;
  const chapterNumbers = chapterIds.map((chapterId) => {
    const match = /^chapter-(\d+)$/.exec(chapterId);
    if (!match) return null;

    const chapterNumber = Number(match[1]);
    return Number.isSafeInteger(chapterNumber) ? chapterNumber : null;
  });

  if (chapterNumbers.some((chapterNumber) => chapterNumber === null)) return chapterCount;

  const safeChapterNumbers = chapterNumbers.filter(
    (chapterNumber): chapterNumber is number => chapterNumber !== null,
  );

  const firstChapter = Math.min(...safeChapterNumbers);
  const lastChapter = Math.max(...safeChapterNumbers);
  const chapterRange = firstChapter === lastChapter
    ? `Ch. ${firstChapter}`
    : `Ch. ${firstChapter}-${lastChapter}`;

  return `${chapterCount} · ${chapterRange}`;
}

function toRomanNumeral(value: number) {
  const numerals: Array<[number, string]> = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let remainder = value;
  let result = '';

  for (const [amount, numeral] of numerals) {
    while (remainder >= amount) {
      result += numeral;
      remainder -= amount;
    }
  }

  return result;
}

function isEpilogue(act: Act) {
  return act.id.toLowerCase().includes('epilogue') || act.title.toLowerCase().startsWith('epilogue');
}

function getActLabel(acts: Act[], index: number) {
  const act = acts[index] as Act;
  if (isEpilogue(act)) {
    return 'EPILOGUE';
  }

  const actNumber = acts.slice(0, index + 1).filter((candidate) => !isEpilogue(candidate)).length;
  return `ACT ${toRomanNumeral(actNumber)}`;
}

function getMarkerLabel(label: string) {
  return label.toLowerCase() === 'core conflict' ? 'Core Conflict' : label;
}

function getNodeX(index: number, actCount: number) {
  return ((index + 0.5) / actCount) * 1000;
}

function isReferencePattern(acts: Act[]) {
  return acts.length === 4 && acts.slice(0, 3).every((act) => !isEpilogue(act)) && isEpilogue(acts[3] as Act);
}

function getActPresentation(acts: Act[], index: number) {
  const act = acts[index] as Act;
  if (isReferencePattern(acts)) {
    return {
      phase: actPhases[index] as typeof actPhases[number],
      percentage: actPercentages[index] as string,
    };
  }

  if (isEpilogue(act)) return { phase: 'Aftermath', percentage: '100%+' } as const;

  const nonEpilogueActs = acts.filter((candidate) => !isEpilogue(candidate));
  const nonEpilogueIndex = acts
    .slice(0, index)
    .filter((candidate) => !isEpilogue(candidate)).length;
  const isFirst = nonEpilogueIndex === 0;
  const isLast = nonEpilogueIndex === nonEpilogueActs.length - 1;
  const phase = isFirst ? 'Setup' : isLast ? 'Resolution' : 'Confrontation';
  const start = isFirst ? 1 : Math.round((nonEpilogueIndex / nonEpilogueActs.length) * 100);
  const end = Math.round(((nonEpilogueIndex + 1) / nonEpilogueActs.length) * 100);

  return { phase, percentage: `${start} - ${end}%` };
}

function getTrackMinWidth(actCount: number) {
  if (actCount <= 1) return 104;
  if (actCount === 4) return 448;
  return actCount * 104 + (actCount - 1) * 10;
}

export function StructureMap({ acts, selectedActId, onSelectAct }: StructureMapProps) {
  const renderedActCount = Math.max(acts.length, 1);
  const trackStyle = {
    '--structure-act-count': renderedActCount,
    '--structure-track-min-width': `${getTrackMinWidth(acts.length)}px`,
  } as CSSProperties;
  const firstMarker = acts.flatMap((act) => act.narrativeMarkers)[0];

  return (
    <OccludedPanel className="echo-structure-map" labelledBy="echo-structure-title">
      <header className="echo-panel-heading">
        <h2 id="echo-structure-title">Novel Structure Map</h2>
        <span className="echo-panel-heading__chevron" aria-hidden="true">
          <svg viewBox="0 0 12 12" focusable="false">
            <path d="M2.5 4.5 6 8l3.5-3.5" />
          </svg>
        </span>
        {firstMarker ? (
          <span className="echo-structure-map__legend">
            <span aria-hidden="true" />
            {getMarkerLabel(firstMarker.label)}
          </span>
        ) : null}
      </header>

      <div
        className="echo-structure-map__rail"
        role="region"
        aria-label="Novel structure acts"
        tabIndex={0}
      >
        <div className="echo-structure-map__track" style={trackStyle}>
          <svg
            className="echo-structure-map__connectors"
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 1000 80"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="echoProgressGradientStructure" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="var(--bixin-green-600)" />
                <stop offset="1" stopColor="var(--bixin-green-700)" />
              </linearGradient>
            </defs>
            {acts.slice(0, -1).map((act, index) => {
              const nextAct = acts[index + 1] as Act;
              const startX = getNodeX(index, acts.length);
              const endX = getNodeX(index + 1, acts.length);
              const distance = endX - startX;
              const handle = Math.min(42, distance / 3);

              return (
                <path
                  key={`${act.id}::${index}`}
                  className="echo-structure-map__connector"
                  data-from-act-id={act.id}
                  data-to-act-id={nextAct.id}
                  stroke="url(#echoProgressGradientStructure)"
                  d={`M ${startX} 40 C ${startX + handle} 26, ${endX - handle} 54, ${endX} 40`}
                />
              );
            })}
          </svg>

          <div className="echo-structure-map__cards">
            {acts.map((act, index) => {
              const isSelected = act.id === selectedActId;
              const { phase, percentage } = getActPresentation(acts, index);
              const label = getActLabel(acts, index);
              const chapterMetric = getChapterMetric(act.chapterIds);
              const icon = actIcons[index % actIcons.length] as string;

              return (
                <button
                  key={act.id}
                  className={`echo-act-card echo-solid-card${isSelected ? ' is-selected' : ''}`}
                  type="button"
                  data-act-id={act.id}
                  aria-label={`${label}, ${phase}, ${act.title}, ${percentage}, ${chapterMetric}`}
                  aria-pressed={isSelected}
                  title={act.title}
                  onFocus={(event) => event.currentTarget.scrollIntoView?.({
                    block: 'nearest',
                    inline: 'nearest',
                  })}
                  onClick={() => onSelectAct(act.id)}
                >
                  <span className="echo-act-card__label">{label}</span>
                  <strong className="echo-act-card__phase">{phase}</strong>
                  <span className="echo-act-card__percentage">{percentage}</span>
                  <img className="echo-act-card__icon" src={icon} alt="" aria-hidden="true" />
                  <small className="echo-act-card__metric">{chapterMetric}</small>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </OccludedPanel>
  );
}
