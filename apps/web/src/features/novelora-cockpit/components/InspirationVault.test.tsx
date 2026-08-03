import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import type { InspirationItem } from '../types';
import { InspirationVault } from './InspirationVault';

const echoCss = readFileSync(resolve(process.cwd(), 'src/styles/echo.css'), 'utf8');

describe('InspirationVault', () => {
  it('renders a named solid section with filters in the intended order', () => {
    render(<InspirationVault inspirations={noveloraMockProject.inspirations} />);

    expect(screen.getByRole('heading', { name: 'Inspiration Vault' })).toBeTruthy();
    const filters = screen.getByRole('group', { name: 'Inspiration filters' });
    expect(within(filters).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'All',
      'Quotes',
      'Images',
      'Ideas',
      'Refs',
    ]);
    expect(within(filters).getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('caps the first viewport at the first three inspirations in source order', () => {
    render(<InspirationVault inspirations={noveloraMockProject.inspirations} />);

    const archive = screen.getByRole('region', { name: 'Inspiration archive' });
    const entries = within(archive).getAllByRole('button');

    expect(entries).toHaveLength(3);
    expect(entries.map((entry) => within(entry).getByRole('strong').textContent)).toEqual([
      'Cold lighthouse signal',
      'Ashfall tide maps',
      'The price of a kept vow',
    ]);
    expect(screen.queryByText('The drowned forge')).toBeNull();
  });

  it('filters before applying the three-entry cap', async () => {
    const user = userEvent.setup();
    const quoteInspirations: InspirationItem[] = Array.from({ length: 5 }, (_, index) => ({
      ...noveloraMockProject.inspirations[2],
      id: `quote-${index + 1}`,
      title: `Quote ${index + 1}`,
    }));

    render(
      <InspirationVault
        inspirations={[noveloraMockProject.inspirations[0], ...quoteInspirations]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Quotes' }));

    expect(screen.getByRole('button', { name: 'Quotes' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('button', { name: /Quote \d/ })).toHaveLength(3);
    expect(screen.getByRole('button', { name: /Quote 1/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Quote 3/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Quote 4/ })).toBeNull();
  });

  it('preserves item selection and invokes the view-all callback', async () => {
    const user = userEvent.setup();
    const onViewAll = vi.fn();

    render(
      <InspirationVault
        inspirations={noveloraMockProject.inspirations}
        onViewAll={onViewAll}
      />,
    );

    const entry = screen.getByRole('button', { name: /Cold lighthouse signal/ });
    expect(entry).toHaveAttribute('aria-pressed', 'false');
    await user.click(entry);
    expect(entry).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'View All inspiration' }));
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });

  it('shows a safe status when the selected filter has no entries', async () => {
    const user = userEvent.setup();

    render(<InspirationVault inspirations={[noveloraMockProject.inspirations[0]]} />);
    await user.click(screen.getByRole('button', { name: 'Quotes' }));

    expect(screen.getByRole('status')).toHaveTextContent('No inspiration matches Quotes.');
  });

  it('keeps the first inspiration for a duplicate business ID', () => {
    const first = noveloraMockProject.inspirations[0];
    render(
      <InspirationVault
        inspirations={[first, { ...first, title: 'Duplicate should not render' }]}
      />,
    );

    expect(screen.getAllByRole('button', { name: /Cold lighthouse signal/ })).toHaveLength(1);
    expect(screen.queryByText('Duplicate should not render')).toBeNull();
  });

  it('labels inspiration without linked chapters as unlinked', () => {
    render(
      <InspirationVault
        inspirations={[{ ...noveloraMockProject.inspirations[0], relatedChapterIds: [] }]}
      />,
    );

    expect(screen.getByText('Unlinked')).toBeTruthy();
    expect(screen.queryByText('Ch.')).toBeNull();
  });

  it('fits three compact rows into the 127px archive viewport', () => {
    const gridRule = echoCss.match(
      /\.cockpit-scroll \.inspiration-vault__grid\s*\{([^}]*)\}/,
    )?.[1];
    const cardRule = echoCss.match(
      /\.cockpit-scroll \.inspiration-card\s*\{([^}]*)\}/,
    )?.[1];
    const imageRule = echoCss.match(
      /\.cockpit-scroll \.inspiration-card > img\s*\{([^}]*)\}/,
    )?.[1];

    expect(gridRule).toMatch(/gap:\s*5px;/);
    expect(gridRule).toMatch(/padding:\s*0;/);
    expect(cardRule).toMatch(/min-height:\s*39px;/);
    expect(cardRule).toMatch(/padding:\s*3px;/);
    expect(imageRule).toMatch(/width:\s*29px;/);
    expect(imageRule).toMatch(/height:\s*29px;/);
    expect(29 + 2 * 3 + 2).toBeLessThanOrEqual(39);
    expect(3 * 39 + 2 * 5).toBeLessThanOrEqual(127);
  });
});
