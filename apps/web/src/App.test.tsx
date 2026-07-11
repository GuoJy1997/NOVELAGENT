import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('updates the clue attribution flow when a chapter is selected from the swimlane', async () => {
    const user = userEvent.setup();

    render(<App />);

    expect(screen.getByText('Evidence connected to Chapter 3.')).toBeTruthy();
    expect(screen.getByText('The old tide map')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /Act I .*The Ash Tide/i }));
    await user.click(screen.getByRole('button', { name: /Chapter 2/i }));

    expect(screen.getByText('Evidence connected to Chapter 2.')).toBeTruthy();
    expect(screen.getByText('The old tide map')).toBeTruthy();
    expect(screen.getByText('The map reveals the only safe approach under black water.')).toBeTruthy();
    expect(screen.getByText(/Provided by Liora's archive cache/i)).toBeTruthy();
    expect(
      screen.getByText(/Triggered by The ashfall tide mark aligning with harbor stones/i),
    ).toBeTruthy();
    expect(screen.getByText(/Received by Kael/i)).toBeTruthy();
    expect(screen.getByText(/Paid off by The crew reaching the drowned forge/i)).toBeTruthy();
  });

  it('keeps clue attribution scoped to the first chapter in Act III', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /Act III .*Black-Water Forge/i }));
    const chapterFive = within(
      screen.getByRole('region', { name: 'Chapter swimlane' }),
    ).getByRole('button', { name: /Chapter 5/i });
    await user.click(chapterFive);

    expect(chapterFive.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Evidence connected to Chapter 5.')).toBeTruthy();
    expect(screen.getByRole('article', { name: 'The false-harbor sigil' })).toBeTruthy();
    expect(screen.getByText(/Triggered by The beacon flame turning green/i)).toBeTruthy();
    expect(screen.queryByText('The old tide map')).toBeNull();
  });

  it('filters inspiration and toggles Focus Mode through their visible controls', async () => {
    const user = userEvent.setup();

    render(<App />);

    const quotesFilter = screen.getByRole('button', { name: 'Quotes' });
    await user.click(quotesFilter);

    expect(quotesFilter.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('The price of a kept vow')).toBeTruthy();
    expect(screen.queryByText('Cold lighthouse signal')).toBeNull();

    const focusMode = screen.getByRole('button', { name: /Focus Mode/i });
    expect(focusMode.getAttribute('aria-pressed')).toBe('false');
    await user.click(focusMode);

    expect(focusMode.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /Focus Mode/i }).textContent).toContain('On');
  });

  it('opens chapter details from its user-facing trigger and restores trigger focus after each close path', async () => {
    const user = userEvent.setup();

    render(<App />);

    const opener = screen.getByRole('button', { name: 'Open chapter details' });
    await user.click(opener);

    expect(screen.getByRole('dialog', { name: 'Chapter details' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Close chapter details' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);

    await user.click(opener);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});
