import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import { AgentPanel } from './AgentPanel';

describe('AgentPanel', () => {
  it('uses the approved writing companion artwork for Nova', () => {
    render(<AgentPanel project={noveloraMockProject} />);

    const novaPortrait = screen.getByRole('img', { name: 'Nova' });

    expect(novaPortrait.getAttribute('src')).toMatch(/writing_companion.*\.png$/);
    expect(novaPortrait.getAttribute('src')).not.toMatch(/mascot_nova_avatar\.svg$/);
  });

  it('shows fixture-backed task and memory data', () => {
    render(<AgentPanel project={noveloraMockProject} />);

    for (const task of noveloraMockProject.agentTasks) {
      expect(screen.getByText(task.title)).toBeTruthy();
      expect(screen.getByText(task.focus)).toBeTruthy();
      expect(screen.getByText(`Owner: ${task.owner}`)).toBeTruthy();
    }

    for (const status of ['Queued', 'Running', 'Done', 'Blocked']) {
      expect(screen.getByText(status)).toBeTruthy();
    }

    expect(screen.getByRole('progressbar', { name: /Scan harbor continuity/i })).toBeTruthy();
    expect(screen.getByText('78%')).toBeTruthy();

    for (const source of noveloraMockProject.memorySources) {
      expect(screen.getByText(source.label)).toBeTruthy();
    }
  });

  it('shows determinate progress for every fixture-backed task', () => {
    render(<AgentPanel project={noveloraMockProject} />);

    for (const task of noveloraMockProject.agentTasks) {
      const progress = screen.getByRole('progressbar', { name: `${task.title} progress` });

      expect(progress.getAttribute('max')).toBe('100');
      expect(progress.getAttribute('value')).toBe(String(task.progressPercent));
    }
  });

  it('renders each fixture-backed subagent, skill, and review check', () => {
    render(<AgentPanel project={noveloraMockProject} />);

    for (const subagent of noveloraMockProject.subagents) {
      expect(screen.getByText(subagent.name)).toBeTruthy();
      expect(screen.getByText(subagent.role)).toBeTruthy();
      expect(screen.getByText(subagent.avatarLabel)).toBeTruthy();
      expect(
        screen.getByLabelText(`${subagent.name}: ${subagent.active ? 'active' : 'inactive'}`),
      ).toBeTruthy();
    }

    for (const skill of noveloraMockProject.skills) {
      expect(screen.getByText(skill.label)).toBeTruthy();
    }

    for (const category of new Set(noveloraMockProject.skills.map((skill) => skill.category))) {
      expect(screen.getAllByText(category)).toHaveLength(
        noveloraMockProject.skills.filter((skill) => skill.category === category).length,
      );
    }

    for (const item of noveloraMockProject.reviewChecklist) {
      expect(screen.getByText(item.label)).toBeTruthy();
      expect(
        screen.getByLabelText(`${item.label}: ${item.passed ? 'passed' : 'pending'}`),
      ).toBeTruthy();
    }
  });

  it('toggles local focus mode state', async () => {
    const user = userEvent.setup();
    render(<AgentPanel project={noveloraMockProject} />);

    const toggle = screen.getByRole('button', { name: /Focus Mode/i });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    await user.click(toggle);

    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });
});
