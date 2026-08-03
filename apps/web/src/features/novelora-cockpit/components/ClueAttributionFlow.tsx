import type { ClueFlow, CockpitChapter } from '../types';

interface ClueAttributionFlowProps {
  clueFlows: ClueFlow[];
  chapters: CockpitChapter[];
  selectedChapterId: string;
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
  const y = 37 + index * 74;
  return `M 132 ${y} C 153 ${y - 8} 167 ${y + 8} 188 ${y}`;
}

export function ClueAttributionFlow({
  clueFlows,
  chapters,
  selectedChapterId,
}: ClueAttributionFlowProps) {
  const relatedFlows = firstById(clueFlows).filter((flow) =>
    isRelatedToChapter(flow, selectedChapterId),
  );
  const selectedChapter = chapterLabel(chapters, selectedChapterId);
  const canvasHeight = Math.max(150, relatedFlows.length * 74);

  return (
    <section className="clue-attribution-flow" aria-labelledby="clue-attribution-flow-title">
      <header className="clue-attribution-flow__heading">
        <h2 id="clue-attribution-flow-title">Clue Attribution Flow</h2>
        <p>{`Evidence connected to ${selectedChapter}.`}</p>
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
              <h3 id="clue-sources-title">Clue sources</h3>
              <ul aria-label="Clue sources">
                {relatedFlows.map((flow) => (
                  <li key={flow.id}>
                    <article
                      className="clue-source-card"
                      data-flow-id={flow.id}
                      aria-label={flow.title}
                    >
                      <strong>{flow.title}</strong>
                      <p>{flow.provider.clue}</p>
                      <small>{`Provided by ${flow.provider.providedBy}`}</small>
                      <small>{`Triggered by ${flow.trigger.triggeredBy}`}</small>
                    </article>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="clue-recipients-title">
              <h3 id="clue-recipients-title">Revealed to</h3>
              <ul aria-label="Revealed to">
                {relatedFlows.map((flow) => (
                  <li key={flow.id}>
                    <article
                      className="clue-recipient-card"
                      data-flow-id={flow.id}
                      aria-label={`${flow.title} recipient`}
                    >
                      <strong>{`Received by ${flow.receiver.receivedBy}`}</strong>
                      <p>{flow.receiver.interpretation}</p>
                      <small>{`Paid off by ${flow.payoff.paidOffBy}`}</small>
                      <small>{flow.payoff.resolution}</small>
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
