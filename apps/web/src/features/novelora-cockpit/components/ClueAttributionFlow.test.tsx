import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import { ClueAttributionFlow } from './ClueAttributionFlow';

const echoCss = readFileSync(resolve(process.cwd(), 'src/styles/echo.css'), 'utf8');

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
    const sources = screen.getByRole('list', { name: 'Clue sources' });
    const recipients = screen.getByRole('list', { name: 'Revealed to' });
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
    const connectorRule = echoCss.match(
      /\.cockpit-scroll \.clue-attribution-flow__connectors\s*\{([^}]*)\}/,
    )?.[1];
    const canvasRule = echoCss.match(
      /\.cockpit-scroll \.clue-attribution-flow__canvas\s*\{([^}]*)\}/,
    )?.[1];
    const cardRule = echoCss.match(
      /\.cockpit-scroll \.clue-source-card,\s*\.cockpit-scroll \.clue-recipient-card\s*\{([^}]*)\}/,
    )?.[1];
    const listRule = Array.from(
      echoCss.matchAll(
        /\.cockpit-scroll \.clue-attribution-flow__columns ul\s*\{([^}]*)\}/g,
      ),
      (match) => match[1],
    ).find((body) => body.includes('gap:'));
    const columnHeadingRule = echoCss.match(
      /\.cockpit-scroll \.clue-attribution-flow__columns h3\s*\{([^}]*)\}/,
    )?.[1];
    expect(paths).toHaveLength(2);
    expect(screen.getByRole('region', { name: 'Clue flow connections' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(connector).toHaveStyle({ height: '150px' });
    expect(connectorRule).toMatch(/top:\s*14px;/);
    expect(canvasRule).toMatch(/height:\s*164px;/);
    expect(canvasRule).toMatch(/overflow-y:\s*auto;/);
    expect(cardRule).toMatch(/height:\s*70px;/);
    expect(listRule).toMatch(/gap:\s*4px;/);
    expect(columnHeadingRule).toMatch(/line-height:\s*12px;/);
    expect(columnHeadingRule).toMatch(/margin:\s*0 0 4px;/);
    expect(16 + 2 * 70 + 4).toBeLessThanOrEqual(164);
    expect(paths[0]).toHaveAttribute('d', 'M 132 37 C 153 29 167 45 188 37');
    expect(paths[1]).toHaveAttribute('d', 'M 132 111 C 153 103 167 119 188 111');
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
    expect(screen.queryByRole('list', { name: 'Clue sources' })).toBeNull();
    expect(screen.queryByRole('list', { name: 'Revealed to' })).toBeNull();
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

  it('reclaims heading height before the 164px clue canvas', () => {
    const sharedHeadingSelector = '.cockpit-scroll .inspiration-vault__heading,';
    const clueHeadingSelector = '.cockpit-scroll .clue-attribution-flow__heading {';
    const sharedHeadingIndex = echoCss.indexOf(sharedHeadingSelector);
    const sharedHeadingOpening = echoCss.indexOf('{', sharedHeadingIndex);
    const sharedHeadingClosing = echoCss.indexOf('}', sharedHeadingOpening);
    const clueHeadingIndex = echoCss.indexOf(clueHeadingSelector, sharedHeadingClosing + 1);
    const sharedHeadingRule = echoCss.slice(
      sharedHeadingOpening + 1,
      sharedHeadingClosing,
    );
    const clueHeadingRule = echoCss.slice(
      echoCss.indexOf('{', clueHeadingIndex) + 1,
      echoCss.indexOf('}', echoCss.indexOf('{', clueHeadingIndex)),
    );

    expect(sharedHeadingIndex).toBeGreaterThanOrEqual(0);
    expect(clueHeadingIndex).toBeGreaterThan(sharedHeadingIndex);
    expect(sharedHeadingRule).toMatch(/min-height:\s*28px;/);
    expect(clueHeadingRule).toMatch(/min-height:\s*26px;/);
    expect(26 + 4 + 164).toBeLessThanOrEqual(196);
  });
});
