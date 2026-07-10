import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../../App';
import { noveloraMockProject } from '../data/noveloraMockProject';

describe('Novelora cockpit shell', () => {
  it('renders the accessible project workspace entry points', () => {
    render(<App />);

    expect(screen.getByRole('img', { name: 'Novelora' })).toBeTruthy();

    const navigation = screen.getByRole('navigation', { name: 'Workspace navigation' });
    expect(within(navigation).getAllByRole('button')).toHaveLength(7);
    expect(
      within(navigation).getByRole('button', { name: 'Story Map' }).getAttribute('aria-pressed'),
    ).toBe('true');

    expect(screen.getAllByText(noveloraMockProject.title)).not.toHaveLength(0);
    expect(screen.getByRole('searchbox', { name: 'Search workspace' })).toBeTruthy();
    expect(screen.getByRole('complementary', { name: 'Workspace assistant' })).toBeTruthy();
  });
});
