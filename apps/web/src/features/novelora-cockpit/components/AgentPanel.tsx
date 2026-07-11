import { useState } from 'react';
import { novaAvatar } from '../assetRegistry';
import type { AgentTask, NoveloraProject } from '../types';

interface AgentPanelProps {
  project: NoveloraProject;
}

const statusLabels: Record<AgentTask['state'], string> = {
  queued: 'Queued',
  running: 'Running',
  done: 'Done',
  blocked: 'Blocked',
};

export function AgentPanel({ project }: AgentPanelProps) {
  const [focusMode, setFocusMode] = useState(false);

  return (
    <div className="agent-panel">
      <section className="nova-lead-card" aria-labelledby="nova-lead-title">
        <img src={novaAvatar} alt="Nova" />
        <div>
          <p className="workspace-eyebrow">Lead agent</p>
          <h2 id="nova-lead-title">Nova</h2>
          <p>Orchestrating story work without running actions from this panel.</p>
        </div>
      </section>

      <section className="agent-panel__section" aria-labelledby="agent-task-title">
        <div className="agent-panel__heading">
          <div>
            <p className="workspace-eyebrow">Task orchestration</p>
            <h3 id="agent-task-title">Subagents</h3>
          </div>
          <span>{project.agentTasks.length} tasks</span>
        </div>
        <ul className="agent-task-list">
          {project.agentTasks.map((task) => (
            <li key={task.id} className="agent-task-row">
              <div className="agent-task-row__topline">
                <strong>{task.title}</strong>
                <span className={`agent-status-chip agent-status-chip--${task.state}`}>
                  {statusLabels[task.state]}
                </span>
              </div>
              <p>{task.focus}</p>
              <div className="agent-task-row__meta">
                <span>Owner: {task.owner}</span>
              </div>
              {task.state === 'running' ? (
                <progress className="agent-task-progress" aria-label={`${task.title} progress`} />
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="agent-panel__section" aria-labelledby="memory-layer-title">
        <div className="agent-panel__heading">
          <div>
            <p className="workspace-eyebrow">Memory layer</p>
            <h3 id="memory-layer-title">Context health</h3>
          </div>
          <strong className="memory-health">{project.memoryHealthPercent}%</strong>
        </div>
        <div className="memory-health-meter" aria-label={`Memory health ${project.memoryHealthPercent}%`}>
          <span style={{ width: `${project.memoryHealthPercent}%` }} />
        </div>
        <ul className="memory-source-list">
          {project.memorySources.map((source) => (
            <li key={source.id}>
              <strong>{source.label}</strong>
              <span>{source.kind}</span>
            </li>
          ))}
        </ul>
      </section>

      <button
        className={`focus-mode-toggle${focusMode ? ' is-active' : ''}`}
        type="button"
        aria-pressed={focusMode}
        onClick={() => setFocusMode((enabled) => !enabled)}
      >
        <span>Focus Mode</span>
        <small>{focusMode ? 'On' : 'Off'}</small>
      </button>
    </div>
  );
}
