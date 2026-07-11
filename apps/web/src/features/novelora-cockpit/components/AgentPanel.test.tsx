import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import { AgentPanel } from './AgentPanel';

describe('AgentPanel', () => {
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

  it('toggles local focus mode state', async () => {
    const user = userEvent.setup();
    render(<AgentPanel project={noveloraMockProject} />);

    const toggle = screen.getByRole('button', { name: /Focus Mode/i });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    await user.click(toggle);

    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });
});
