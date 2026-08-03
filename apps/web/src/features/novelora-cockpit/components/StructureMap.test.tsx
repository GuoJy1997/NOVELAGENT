import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clueNodes } from '../assetRegistry';
import { noveloraMockProject } from '../data/noveloraMockProject';
import type { Act } from '../types';
import { StructureMap } from './StructureMap';

const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

afterEach(() => {
  if (originalScrollIntoView) {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: originalScrollIntoView,
    });
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  }
});

function StructureMapHarness({ onSelectAct }: { onSelectAct: (actId: string) => void }) {
  const [selectedActId, setSelectedActId] = useState('act-i');

  return (
    <StructureMap
      acts={noveloraMockProject.acts}
      selectedActId={selectedActId}
      onSelectAct={(actId) => {
        setSelectedActId(actId);
        onSelectAct(actId);
      }}
    />
  );
}

function makeActs(count: number): Act[] {
  return Array.from({ length: count }, (_, index) => ({
    ...(noveloraMockProject.acts[index % noveloraMockProject.acts.length] as Act),
    id: `custom-act-${index + 1}`,
    title: `Custom Act ${index + 1}`,
    chapterIds: [`chapter-${index + 1}`],
    narrativeMarkers: [],
  }));
}

describe('StructureMap', () => {
  it('uses the exact occluded-panel structure for the named novel structure region', () => {
    render(<StructureMapHarness onSelectAct={vi.fn()} />);

    const panel = screen.getByRole('region', { name: 'Novel Structure Map' });

    expect(panel).toHaveClass('occluded-panel', 'echo-structure-map');
    expect(panel).toHaveAttribute('aria-labelledby', 'echo-structure-title');
    expect(panel.children).toHaveLength(4);
    expect(panel.children[0]).toHaveClass('occluded-panel__surface');
    expect(panel.children[1]).toHaveClass(
      'occluded-panel__top-cap',
      'occluded-panel__top-cap--left',
    );
    expect(panel.children[2]).toHaveClass(
      'occluded-panel__top-cap',
      'occluded-panel__top-cap--right',
    );
    expect(panel.children[3]).toHaveClass('occluded-panel__content');
    expect(within(panel).getByRole('heading', { level: 2, name: 'Novel Structure Map' })).toHaveAttribute(
      'id',
      'echo-structure-title',
    );
    expect(panel.querySelector('.echo-panel-heading')).not.toBeNull();
  });

  it('renders four compact solid act cards with the reference labels and metadata', () => {
    render(<StructureMapHarness onSelectAct={vi.fn()} />);

    const panel = screen.getByRole('region', { name: 'Novel Structure Map' });
    const rail = within(panel).getByRole('region', { name: 'Novel structure acts' });
    const buttons = within(rail).getAllByRole('button');
    const expected = [
      ['ACT I', 'Setup', '1 – 25%'],
      ['ACT II', 'Confrontation', '25 – 75%'],
      ['ACT III', 'Resolution', '75 – 100%'],
      ['EPILOGUE', 'Aftermath', '100%+'],
    ];

    expect(buttons).toHaveLength(4);
    for (const [index, button] of buttons.entries()) {
      const [label, phase, percentage] = expected[index] as [string, string, string];
      expect(within(button).getByText(label, { selector: '.echo-act-card__label' })).toBeInTheDocument();
      expect(within(button).getByText(phase)).toBeInTheDocument();
      expect(within(button).getByText(percentage)).toBeInTheDocument();
      expect(button).toHaveClass('echo-act-card', 'echo-solid-card');
      const decorativeIcon = button.querySelector('img[alt=""][aria-hidden="true"]');
      expect(decorativeIcon).not.toBeNull();
      expect(Object.values(clueNodes)).toContain(decorativeIcon?.getAttribute('src'));
    }

    expect(within(panel).getByText('Core Conflict')).toBeVisible();
    expect(within(panel).getByText('Climax')).toBeVisible();
    expect(panel.querySelector('.act-card__summary')).toBeNull();
    expect(panel.querySelector('.act-card__progress')).toBeNull();
  });

  it('draws one connector path between every adjacent act behind the card grid', () => {
    const acts = noveloraMockProject.acts;
    const { container } = render(
      <StructureMap acts={acts} selectedActId="act-iii" onSelectAct={vi.fn()} />,
    );

    const connectors = container.querySelector('.echo-structure-map__connectors');
    const paths = connectors?.querySelectorAll('path') ?? [];

    expect(connectors).toHaveAttribute('viewBox', '0 0 1000 80');
    expect(paths).toHaveLength(acts.length - 1);
    for (const path of paths) {
      expect(path.getAttribute('d')).toMatch(/^M [\d.]+ 40 C [\d.]+ 26, [\d.]+ 54, [\d.]+ 40$/);
    }
    expect(Array.from(paths, (path) => [
      path.getAttribute('data-from-act-id'),
      path.getAttribute('data-to-act-id'),
    ])).toEqual([
      ['act-i', 'act-ii'],
      ['act-ii', 'act-iii'],
      ['act-iii', 'epilogue'],
    ]);
    expect(container.querySelector('.echo-structure-map__cards')).not.toBeNull();
  });

  it.each([
    [2, '218px'],
    [3, '332px'],
    [5, '560px'],
  ])('keeps %i acts in one count-driven track with aligned connectors', (actCount, minWidth) => {
    const acts = makeActs(actCount);
    const { container } = render(
      <StructureMap acts={acts} selectedActId={acts[0]?.id ?? ''} onSelectAct={vi.fn()} />,
    );

    const track = container.querySelector<HTMLElement>('.echo-structure-map__track');
    const cards = track?.querySelector('.echo-structure-map__cards');
    const paths = track?.querySelectorAll('.echo-structure-map__connectors path') ?? [];

    expect(track).not.toBeNull();
    expect(track?.style.getPropertyValue('--structure-act-count')).toBe(String(actCount));
    expect(track?.style.getPropertyValue('--structure-track-min-width')).toBe(minWidth);
    expect(track?.children).toHaveLength(2);
    expect(track?.children[0]).toHaveClass('echo-structure-map__connectors');
    expect(track?.children[1]).toHaveClass('echo-structure-map__cards');
    expect(cards?.children).toHaveLength(actCount);
    expect(paths).toHaveLength(actCount - 1);
    expect(Array.from(paths, (path) => path.getAttribute('data-from-act-id'))).toEqual(
      acts.slice(0, -1).map((act) => act.id),
    );
    expect(Array.from(paths, (path) => path.getAttribute('data-to-act-id'))).toEqual(
      acts.slice(1).map((act) => act.id),
    );
    expect(Array.from(paths, (path) => path.getAttribute('d')).join('')).not.toMatch(/NaN|Infinity/);
  });

  it('bounds curved connector handles inside every dense 12-act segment', () => {
    const acts = makeActs(12);
    const { container } = render(
      <StructureMap acts={acts} selectedActId={acts[0]?.id ?? ''} onSelectAct={vi.fn()} />,
    );
    const paths = container.querySelectorAll('.echo-structure-map__connectors path');

    expect(paths).toHaveLength(acts.length - 1);
    for (const path of paths) {
      const d = path.getAttribute('d') ?? '';
      const coordinates = d.match(
        /^M ([\d.]+) ([\d.]+) C ([\d.]+) ([\d.]+), ([\d.]+) ([\d.]+), ([\d.]+) ([\d.]+)$/,
      );
      expect(coordinates, d).not.toBeNull();
      if (!coordinates) throw new Error(`Invalid connector geometry: ${d}`);

      const [, startXValue, startYValue, controlOneXValue, controlOneYValue,
        controlTwoXValue, controlTwoYValue, endXValue, endYValue] = coordinates;
      const [startX, startY, controlOneX, controlOneY, controlTwoX, controlTwoY, endX, endY] = [
        startXValue,
        startYValue,
        controlOneXValue,
        controlOneYValue,
        controlTwoXValue,
        controlTwoYValue,
        endXValue,
        endYValue,
      ].map(Number);
      const distance = endX - startX;
      const firstHandle = controlOneX - startX;
      const secondHandle = endX - controlTwoX;
      const maximumHandle = distance / 3;

      expect(
        [startX, startY, controlOneX, controlOneY, controlTwoX, controlTwoY, endX, endY]
          .every(Number.isFinite),
      ).toBe(true);
      expect(firstHandle).toBeGreaterThan(0);
      expect(secondHandle).toBeGreaterThan(0);
      expect(firstHandle - maximumHandle).toBeLessThan(1e-10);
      expect(secondHandle - maximumHandle).toBeLessThan(1e-10);
      expect(firstHandle).toBeCloseTo(Math.min(42, maximumHandle), 10);
      expect(secondHandle).toBeCloseTo(Math.min(42, maximumHandle), 10);
      expect(firstHandle).toBeCloseTo(secondHandle, 10);
      expect(firstHandle).toBeLessThan(42);
      expect(controlOneX).toBeLessThan(controlTwoX);
      expect(controlOneX).toBeGreaterThan(startX);
      expect(controlTwoX).toBeLessThan(endX);
      expect(startY).toBe(40);
      expect(controlOneY).not.toBe(40);
      expect(controlTwoY).not.toBe(40);
      expect(endY).toBe(40);
      expect(d).not.toMatch(/NaN|Infinity/);
    }
  });

  it('derives honest phases and percentage ranges for a non-reference act count', () => {
    const acts = makeActs(5);
    render(<StructureMap acts={acts} selectedActId={acts[0]?.id ?? ''} onSelectAct={vi.fn()} />);

    const rail = screen.getByRole('region', { name: 'Novel structure acts' });
    const buttons = within(rail).getAllByRole('button');

    expect(buttons.map((button) => within(button).getByText(/Setup|Confrontation|Resolution/).textContent)).toEqual([
      'Setup',
      'Confrontation',
      'Confrontation',
      'Confrontation',
      'Resolution',
    ]);
    expect(['1 – 20%', '20 – 40%', '40 – 60%', '60 – 80%', '80 – 100%']).toEqual(
      buttons.map((button) => button.querySelector('.echo-act-card__percentage')?.textContent),
    );
    expect(within(rail).queryByText('Aftermath')).not.toBeInTheDocument();
  });

  it('counts nonstandard chapter ids without inventing a numeric chapter range', () => {
    const act: Act = {
      ...makeActs(1)[0] as Act,
      chapterIds: ['scene-alpha', 'chapter-2-extra'],
    };
    render(<StructureMap acts={[act]} selectedActId={act.id} onSelectAct={vi.fn()} />);

    const button = screen.getByRole('button', { name: /^ACT I, Setup,/ });
    expect(within(button).getByText('2 chapters')).toBeInTheDocument();
    expect(button.textContent).not.toContain('Ch.');
  });

  it('selects Act II, reports it, and exposes only its selected state', async () => {
    const user = userEvent.setup();
    const onSelectAct = vi.fn();
    render(<StructureMapHarness onSelectAct={onSelectAct} />);

    const panel = screen.getByRole('region', { name: 'Novel Structure Map' });
    const rail = within(panel).getByRole('region', { name: 'Novel structure acts' });
    const buttons = within(rail).getAllByRole('button');
    const actTwo = within(rail).getByRole('button', {
      name: /^ACT II, Confrontation,.*The Drowned Map.*25 – 75%.*2 chapters/i,
    });

    expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual([
      'true',
      'false',
      'false',
      'false',
    ]);
    await user.click(actTwo);

    expect(actTwo).toHaveAttribute('aria-pressed', 'true');
    expect(onSelectAct).toHaveBeenCalledWith('act-ii');
  });

  it('keeps the overflowing rail keyboard-focusable and scrolls focused cards into view', () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
    render(<StructureMapHarness onSelectAct={vi.fn()} />);

    const panel = screen.getByRole('region', { name: 'Novel Structure Map' });
    const rail = within(panel).getByRole('region', { name: 'Novel structure acts' });
    const epilogue = within(rail).getAllByRole('button')[3] as HTMLButtonElement;

    expect(rail).toHaveAttribute('tabindex', '0');
    epilogue.focus();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
  });

  it('renders an empty structure without buttons, connectors, or invalid geometry', () => {
    const { container } = render(
      <StructureMap acts={[]} selectedActId="" onSelectAct={vi.fn()} />,
    );

    const panel = screen.getByRole('region', { name: 'Novel Structure Map' });
    const rail = within(panel).getByRole('region', { name: 'Novel structure acts' });

    expect(within(rail).queryAllByRole('button')).toHaveLength(0);
    expect(container.querySelectorAll('.echo-structure-map__connectors path')).toHaveLength(0);
    const track = container.querySelector<HTMLElement>('.echo-structure-map__track');
    expect(track?.style.getPropertyValue('--structure-act-count')).toBe('1');
    expect(track?.style.getPropertyValue('--structure-track-min-width')).toBe('104px');
    expect(container.innerHTML).not.toContain('NaN');
    expect(container.innerHTML).not.toContain('Infinity');
  });
});
