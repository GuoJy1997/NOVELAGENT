import { useId, type RefObject } from 'react';
import { echoAssistantCard } from '../assetRegistry';
import type { AgentTask, NoveloraProject } from '../types';

export interface AIWritingPartnerProps {
  project: NoveloraProject;
  onViewAll: () => void;
  viewAllButtonRef: RefObject<HTMLButtonElement | null>;
}

const taskStateLabels: Record<AgentTask['state'], string> = {
  queued: 'Queued',
  running: 'Running',
  done: 'Done',
  blocked: 'Blocked',
};

function normalizeProgress(progressPercent: number) {
  if (!Number.isFinite(progressPercent)) return 0;
  return Math.min(100, Math.max(0, progressPercent));
}

export function AIWritingPartner({
  project,
  onViewAll,
  viewAllButtonRef,
}: AIWritingPartnerProps) {
  const titleId = useId();

  return (
    <section className="ai-writing-partner" aria-labelledby={titleId} tabIndex={0}>
      <header className="ai-writing-partner__header">
        <div>
          <p className="ai-writing-partner__eyebrow">Always by your side</p>
          <h2 id={titleId}>AI Writing Partner</h2>
        </div>
        <span className="ai-writing-partner__status">
          <span aria-hidden="true" />
          Active
        </span>
      </header>

      <div className="ai-writing-partner__intro">
        <img
          src={echoAssistantCard}
          alt="Echo"
          width={192}
          height={192}
          decoding="async"
        />
        <strong>Hello, I'm Echo.</strong>
      </div>

      <ul className="ai-writing-partner__tasks">
        {project.agentTasks.slice(0, 4).map((task) => {
          const progressPercent = normalizeProgress(task.progressPercent);

          return (
            <li key={task.id}>
              <div className="ai-writing-partner__task-heading">
                <strong>{task.title}</strong>
                <span>{taskStateLabels[task.state]}</span>
              </div>
              <div className="ai-writing-partner__progress-row">
                <progress
                  aria-label={`${task.title} progress`}
                  max={100}
                  value={progressPercent}
                />
                <span>{progressPercent}%</span>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        ref={viewAllButtonRef}
        className="ai-writing-partner__view-all"
        type="button"
        onClick={onViewAll}
      >
        View All agent details
      </button>
    </section>
  );
}
