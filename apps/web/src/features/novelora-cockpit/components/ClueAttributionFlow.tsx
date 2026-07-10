import { clueNodes } from '../assetRegistry';
import type { ClueFlow, CockpitChapter } from '../types';

interface ClueAttributionFlowProps {
  clueFlows: ClueFlow[];
  chapters: CockpitChapter[];
  selectedChapterId: string;
}

const stages = [
  { key: 'provider', label: 'Provider', image: 'origin' },
  { key: 'trigger', label: 'Trigger', image: 'trigger' },
  { key: 'receiver', label: 'Receiver', image: 'receiver' },
  { key: 'payoff', label: 'Payoff', image: 'payoff' },
] as const;

function isRelatedToChapter(flow: ClueFlow, chapterId: string) {
  return stages.some(({ key }) => flow[key].chapterId === chapterId);
}

function chapterLabel(chapters: CockpitChapter[], chapterId: string) {
  const chapter = chapters.find((candidate) => candidate.id === chapterId);
  return chapter ? `Chapter ${chapter.order}` : chapterId;
}

function stageContent(flow: ClueFlow, key: (typeof stages)[number]['key']) {
  switch (key) {
    case 'provider':
      return {
        chapterId: flow.provider.chapterId,
        responsibility: `Provided by ${flow.provider.providedBy}`,
        detail: flow.provider.clue,
      };
    case 'trigger':
      return {
        chapterId: flow.trigger.chapterId,
        responsibility: `Triggered by ${flow.trigger.triggeredBy}`,
        detail: flow.trigger.consequence,
      };
    case 'receiver':
      return {
        chapterId: flow.receiver.chapterId,
        responsibility: `Received by ${flow.receiver.receivedBy}`,
        detail: flow.receiver.interpretation,
      };
    case 'payoff':
      return {
        chapterId: flow.payoff.chapterId,
        responsibility: `Paid off by ${flow.payoff.paidOffBy}`,
        detail: flow.payoff.resolution,
      };
  }
}

export function ClueAttributionFlow({
  clueFlows,
  chapters,
  selectedChapterId,
}: ClueAttributionFlowProps) {
  const relatedFlows = clueFlows.filter((flow) => isRelatedToChapter(flow, selectedChapterId));
  const selectedChapter = chapterLabel(chapters, selectedChapterId);

  return (
    <section className="clue-attribution-flow" aria-labelledby="clue-attribution-flow-title">
      <div className="workspace-section-heading">
        <div>
          <p className="workspace-eyebrow">Traceable story logic</p>
          <h2 id="clue-attribution-flow-title">Clue attribution flow</h2>
        </div>
        <p className="workspace-section-note">{`Evidence connected to ${selectedChapter}.`}</p>
      </div>

      {relatedFlows.length === 0 ? (
        <p className="clue-attribution-flow__empty" role="status">
          No traceable clues are connected to {selectedChapter} yet.
        </p>
      ) : (
        <div className="clue-attribution-flow__list">
          {relatedFlows.map((flow) => (
            <article key={flow.id} className="clue-flow-card" aria-label={flow.title}>
              <h3>{flow.title}</h3>
              <div className="clue-flow-card__stages">
                {stages.map(({ key, label, image }, index) => {
                  const stage = stageContent(flow, key);

                  return (
                    <div key={key} className="clue-stage">
                      {index > 0 ? <span className="clue-stage__arrow" aria-hidden="true">→</span> : null}
                      <img src={clueNodes[image]} alt="" />
                      <div>
                        <span className="clue-stage__label">{label}</span>
                        <p className="clue-stage__responsibility">{stage.responsibility}</p>
                        <p className="clue-stage__detail">{stage.detail}</p>
                        <span className="clue-stage__chapter">{chapterLabel(chapters, stage.chapterId)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
