import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import { AgentPanel } from './AgentPanel';

describe('AgentPanel', () => {
  it('shows the live orchestration state, all memory sources, and review checklist', () => {
    render(<AgentPanel project={noveloraMockProject} />);

    expect(screen.getByText('Scan harbor continuity')).toBeTruthy();
    expect(screen.getByText('Running')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: /Scan harbor continuity/i })).toBeTruthy();

    for (const source of noveloraMockProject.memorySources) {
      expect(screen.getByText(source.label)).toBeTruthy();
    }

    expect(screen.getByText('Plot consistency')).toBeTruthy();
    expect(screen.getByText('Pacing check')).toBeTruthy();
    expect(screen.getByText('Clue payoff')).toBeTruthy();
  });
});
