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
            <h3 id="agent-task-title">Tasks</h3>
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

      <section className="agent-panel__section" aria-labelledby="subagent-roster-title">
        <div className="agent-panel__heading">
          <div>
            <p className="workspace-eyebrow">Fixture roster</p>
            <h3 id="subagent-roster-title">Subagents</h3>
          </div>
          <span>{project.subagents.length} profiles</span>
        </div>
        <ul className="subagent-roster">
          {project.subagents.map((subagent) => (
            <li key={subagent.id} className="subagent-roster__item">
              <span className="subagent-roster__avatar" aria-hidden="true">{subagent.avatarLabel}</span>
              <span className="subagent-roster__identity">
                <strong>{subagent.name}</strong>
                <small>{subagent.role}</small>
              </span>
              <span
                className={`subagent-roster__state${subagent.active ? ' is-active' : ''}`}
                aria-label={`${subagent.name}: ${subagent.active ? 'active' : 'inactive'}`}
              >
                {subagent.active ? 'Active' : 'Inactive'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="agent-panel__section" aria-labelledby="agent-skills-title">
        <div className="agent-panel__heading">
          <div>
            <p className="workspace-eyebrow">Fixture skills</p>
            <h3 id="agent-skills-title">Skills</h3>
          </div>
        </div>
        <ul className="agent-skill-list">
          {project.skills.map((skill) => (
            <li key={skill.id} className="agent-skill-badge">
              <span>{skill.label}</span>
              <small>{skill.category}</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="agent-panel__section" aria-labelledby="review-checklist-title">
        <div className="agent-panel__heading">
          <div>
            <p className="workspace-eyebrow">Fixture review</p>
            <h3 id="review-checklist-title">Review checklist</h3>
          </div>
        </div>
        <ul className="review-checklist">
          {project.reviewChecklist.map((item) => (
            <li key={item.id} className="review-checklist__item">
              <span>{item.label}</span>
              <span
                className={`review-checklist__state${item.passed ? ' is-passed' : ''}`}
                aria-label={`${item.label}: ${item.passed ? 'passed' : 'pending'}`}
              >
                {item.passed ? 'Passed' : 'Pending'}
              </span>
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
