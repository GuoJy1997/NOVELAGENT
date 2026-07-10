import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import { ClueAttributionFlow } from './ClueAttributionFlow';

describe('ClueAttributionFlow', () => {
  it('shows the chapter 6 payoff and responsibility at every clue stage', () => {
    render(
      <ClueAttributionFlow
        clueFlows={noveloraMockProject.clueFlows}
        chapters={noveloraMockProject.chapters}
        selectedChapterId="chapter-6"
      />,
    );

    expect(screen.getByText('The old tide map')).toBeTruthy();
    expect(screen.getByText('The map reveals the only safe approach under black water.')).toBeTruthy();
    expect(screen.getByText(/Provided by Liora's archive cache/i)).toBeTruthy();
    expect(
      screen.getByText(/Triggered by The ashfall tide mark aligning with harbor stones/i),
    ).toBeTruthy();
    expect(screen.getByText(/Received by Kael/i)).toBeTruthy();
    expect(screen.getByText(/Paid off by The crew reaching the drowned forge/i)).toBeTruthy();
  });
});
