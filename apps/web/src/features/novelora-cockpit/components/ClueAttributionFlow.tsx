import type { ClueFlow, CockpitChapter } from '../types';

interface ClueAttributionFlowProps {
  clueFlows: ClueFlow[];
  chapters: CockpitChapter[];
  selectedChapterId: string;
  onViewFullFlow?: () => void;
}

const flowStages = ['provider', 'trigger', 'receiver', 'payoff'] as const;

function firstById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function isRelatedToChapter(flow: ClueFlow, chapterId: string) {
  return flowStages.some((stage) => flow[stage].chapterId === chapterId);
}

function chapterLabel(chapters: CockpitChapter[], chapterId: string) {
  const chapter = chapters.find((candidate) => candidate.id === chapterId);
  return chapter ? `Chapter ${chapter.order}` : chapterId;
}

function connectorPath(index: number) {
  const y = 22 + index * 44;
  return `M 132 ${y} C 153 ${y - 8} 167 ${y + 8} 188 ${y}`;
}

export function ClueAttributionFlow({
  clueFlows,
  chapters,
  selectedChapterId,
  onViewFullFlow,
}: ClueAttributionFlowProps) {
  const relatedFlows = firstById(clueFlows).filter((flow) =>
    isRelatedToChapter(flow, selectedChapterId),
  );
  const selectedChapter = chapterLabel(chapters, selectedChapterId);
  const canvasHeight = Math.max(88, relatedFlows.length * 44);

  return (
    <section className="clue-attribution-flow" aria-labelledby="clue-attribution-flow-title">
      <header className="clue-attribution-flow__heading">
        <h2 id="clue-attribution-flow-title">Clue Attribution Flow</h2>
        {onViewFullFlow ? (
          <button
            className="clue-attribution-flow__view-all"
            type="button"
            onClick={onViewFullFlow}
          >
            View Full Flow
          </button>
        ) : null}
        <p className="sr-only">{`Evidence connected to ${selectedChapter}.`}</p>
      </header>

      {relatedFlows.length === 0 ? (
        <p className="clue-attribution-flow__empty" role="status">
          No traceable clues are connected to {selectedChapter} yet.
        </p>
      ) : (
        <div
          className="clue-attribution-flow__canvas"
          role="region"
          tabIndex={0}
          aria-label="Clue flow connections"
        >
          <svg
            className="clue-attribution-flow__connectors"
            viewBox={`0 0 320 ${canvasHeight}`}
            preserveAspectRatio="none"
            style={{ height: `${canvasHeight}px` }}
            aria-hidden="true"
          >
            {relatedFlows.map((flow, index) => (
              <path key={flow.id} data-flow-id={flow.id} d={connectorPath(index)} />
            ))}
          </svg>

          <div className="clue-attribution-flow__columns">
            <section aria-labelledby="clue-sources-title">
              <h3 id="clue-sources-title">Clues</h3>
              <ul aria-label="Clues">
                {relatedFlows.map((flow) => (
                  <li key={flow.id}>
                    <article
                      className={`clue-source-card${
                        flow.provider.chapterId === selectedChapterId ? ' is-active' : ''
                      }`}
                      data-flow-id={flow.id}
                      aria-label={flow.title}
                    >
                      <strong>{flow.title}</strong>
                      <span className="clue-source-card__chapter">
                        {chapterLabel(chapters, flow.provider.chapterId)}
                      </span>
                      <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                        <path d="M4 2.5 8 6l-4 3.5" />
                      </svg>
                      <span className="sr-only">{flow.provider.clue}</span>
                      <span className="sr-only">{`Provided by ${flow.provider.providedBy}`}</span>
                      <span className="sr-only">{`Triggered by ${flow.trigger.triggeredBy}`}</span>
                    </article>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="clue-recipients-title">
              <h3 id="clue-recipients-title">Revealed To</h3>
              <ul aria-label="Revealed To">
                {relatedFlows.map((flow) => (
                  <li key={flow.id}>
                    <article
                      className="clue-recipient-card"
                      data-flow-id={flow.id}
                      aria-label={`${flow.title} recipient`}
                    >
                      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                        <circle cx="8" cy="5.5" r="2.5" />
                        <path d="M3.5 13c.7-2.4 2.5-3.6 4.5-3.6s3.8 1.2 4.5 3.6" />
                      </svg>
                      <strong>{flow.receiver.receivedBy}</strong>
                      <span className="sr-only">{`Received by ${flow.receiver.receivedBy}`}</span>
                      <span className="sr-only">{flow.receiver.interpretation}</span>
                      <span className="sr-only">{`Paid off by ${flow.payoff.paidOffBy}`}</span>
                      <span className="sr-only">{flow.payoff.resolution}</span>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </section>
  );
}
