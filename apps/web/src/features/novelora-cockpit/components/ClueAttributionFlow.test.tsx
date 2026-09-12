import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import { ClueAttributionFlow } from './ClueAttributionFlow';

describe('ClueAttributionFlow', () => {
  it('renders selected-chapter flows in paired source and recipient columns', () => {
    const { container } = render(
      <ClueAttributionFlow
        clueFlows={noveloraMockProject.clueFlows}
        chapters={noveloraMockProject.chapters}
        selectedChapterId="chapter-3"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Clue Attribution Flow' })).toBeTruthy();
    expect(screen.getByText('Evidence connected to Chapter 3.')).toBeTruthy();
    const sources = screen.getByRole('list', { name: 'Clues' });
    const recipients = screen.getByRole('list', { name: 'Revealed To' });
    const expectedIds = noveloraMockProject.clueFlows.map((flow) => flow.id);

    expect(within(sources).getAllByRole('listitem')).toHaveLength(expectedIds.length);
    expect(within(recipients).getAllByRole('listitem')).toHaveLength(expectedIds.length);
    expect(
      within(sources)
        .getAllByRole('article')
        .map((card) => card.getAttribute('data-flow-id')),
    ).toEqual(expectedIds);
    expect(
      within(recipients)
        .getAllByRole('article')
        .map((card) => card.getAttribute('data-flow-id')),
    ).toEqual(expectedIds);
    expect(
      [...sources.querySelectorAll('[data-flow-id]')].map((card) =>
        card.getAttribute('data-flow-id'),
      ),
    ).toEqual(expectedIds);
    expect(
      [...recipients.querySelectorAll('[data-flow-id]')].map((card) =>
        card.getAttribute('data-flow-id'),
      ),
    ).toEqual(expectedIds);
    expect(
      [...container.querySelectorAll('svg path[data-flow-id]')].map((path) =>
        path.getAttribute('data-flow-id'),
      ),
    ).toEqual(expectedIds);
    expect(container.querySelector('.clue-stage')).toBeNull();
  });

  it('keeps meaningful source, trigger, recipient, and payoff text', () => {
    render(
      <ClueAttributionFlow
        clueFlows={noveloraMockProject.clueFlows}
        chapters={noveloraMockProject.chapters}
        selectedChapterId="chapter-2"
      />,
    );

    expect(screen.getByText('The old tide map')).toBeTruthy();
    expect(screen.getByText('A vellum fragment hidden behind the cracked lighthouse lens.')).toBeTruthy();
    expect(screen.getByText(/Provided by Liora's archive cache/i)).toBeTruthy();
    expect(
      screen.getByText(/Triggered by The ashfall tide mark aligning with harbor stones/i),
    ).toBeTruthy();
    expect(screen.getByText(/Received by Kael/i)).toBeTruthy();
    expect(screen.getByText('He recognizes the route Vex used before disappearing.')).toBeTruthy();
    expect(screen.getByText(/Paid off by The crew reaching the drowned forge/i)).toBeTruthy();
    expect(screen.queryByText('The false-harbor sigil')).toBeNull();
  });

  it('draws one finite Bézier connector for each visible flow', () => {
    const { container } = render(
      <ClueAttributionFlow
        clueFlows={noveloraMockProject.clueFlows}
        chapters={noveloraMockProject.chapters}
        selectedChapterId="chapter-6"
      />,
    );

    const paths = container.querySelectorAll('svg path[data-flow-id]');
    const connector = container.querySelector<SVGElement>('svg.clue-attribution-flow__connectors');
    expect(paths).toHaveLength(2);
    expect(screen.getByRole('region', { name: 'Clue flow connections' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(connector).toHaveStyle({ height: '88px' });
    expect(paths[0]).toHaveAttribute('d', 'M 132 22 C 153 14 167 30 188 22');
    expect(paths[1]).toHaveAttribute('d', 'M 132 66 C 153 58 167 74 188 66');
    for (const path of paths) {
      expect(path.getAttribute('d')).toContain('C');
      expect(path.getAttribute('d')).not.toMatch(/NaN|Infinity/);
    }
  });

  it('renders an empty status without paths or cards for an unrelated chapter', () => {
    const { container } = render(
      <ClueAttributionFlow
        clueFlows={noveloraMockProject.clueFlows}
        chapters={noveloraMockProject.chapters}
        selectedChapterId="chapter-99"
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'No traceable clues are connected to chapter-99 yet.',
    );
    expect(container.querySelectorAll('path[data-flow-id]')).toHaveLength(0);
    expect(screen.queryByRole('list', { name: 'Clues' })).toBeNull();
    expect(screen.queryByRole('list', { name: 'Revealed To' })).toBeNull();
  });

  it('keeps the first paired flow for a duplicate business ID', () => {
    const firstFlow = noveloraMockProject.clueFlows[0];
    const { container } = render(
      <ClueAttributionFlow
        clueFlows={[firstFlow, { ...firstFlow, title: 'Duplicate flow' }]}
        chapters={noveloraMockProject.chapters}
        selectedChapterId="chapter-2"
      />,
    );

    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(container.querySelectorAll('path[data-flow-id="old-tide-map"]')).toHaveLength(1);
    expect(screen.queryByText('Duplicate flow')).toBeNull();
  });
});
