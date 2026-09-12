import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import { InspirationVault } from './InspirationVault';

describe('InspirationVault', () => {
  it('renders a named section with a text view-all action and no filter pills', () => {
    render(<InspirationVault inspirations={noveloraMockProject.inspirations} />);

    expect(screen.getByRole('heading', { name: 'Inspiration Vault' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'View All inspiration' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Inspiration filters' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Quotes' })).toBeNull();
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

    expect(screen.getByText(/Unlinked/)).toBeTruthy();
    expect(screen.queryByText(/Ch\./)).toBeNull();
  });
});
