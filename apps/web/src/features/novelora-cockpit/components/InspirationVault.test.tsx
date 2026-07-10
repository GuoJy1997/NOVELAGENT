import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import { InspirationVault } from './InspirationVault';

describe('InspirationVault', () => {
  it('filters image-only cards from the Ideas tab', async () => {
    const user = userEvent.setup();

    render(<InspirationVault inspirations={noveloraMockProject.inspirations} />);

    await user.click(screen.getByRole('button', { name: 'Ideas' }));

    expect(screen.getByRole('button', { name: 'Ideas' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('The drowned forge')).toBeTruthy();
    expect(screen.queryByText('Cold lighthouse signal')).toBeNull();
  });
});
