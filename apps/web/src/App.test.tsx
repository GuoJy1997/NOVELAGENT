import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

afterEach(() => {
  vi.useRealTimers();
});

describe('App', () => {
  it('composes the Echo page in the reference dashboard order', () => {
    const { container } = render(<App />);

    const page = container.querySelector('.echo-page.cockpit-scroll');
    const navigationRail = screen.getByRole('complementary', { name: 'Project navigation' });
    const primaryRow = container.querySelector('.echo-dashboard__primary-row');
    const lowerRow = container.querySelector('.echo-dashboard__lower-row.knowledge-workspace-grid');

    expect(page?.children[0]).toHaveClass('echo-hero-background');
    expect(container.querySelectorAll('img[src*="hero-background-clean"]')).toHaveLength(1);
    expect(within(navigationRail).getAllByRole('img', { name: 'Echo' })).toHaveLength(1);
    expect(screen.queryByText(/Novelora/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Bring your story to life with AI' })).toHaveLength(1);

    expect(primaryRow?.children).toHaveLength(3);
    expect(primaryRow?.children[0]).toBe(screen.getByRole('region', { name: 'Novel Structure Map' }));
    expect(primaryRow?.children[1]).toHaveClass('echo-dashboard__timeline');
    expect(primaryRow?.children[1]).toContainElement(
      screen.getByRole('region', { name: 'Chapter Timeline' }),
    );
    expect(primaryRow?.children[2]).toBe(screen.getByRole('region', { name: 'AI Writing Partner' }));

    expect(lowerRow?.children).toHaveLength(4);
    expect(lowerRow?.children[0]).toBe(screen.getByRole('region', { name: 'Inspiration Vault' }));
    expect(lowerRow?.children[1]).toBe(
      screen.getByRole('region', { name: 'Character Relationship Graph' }),
    );
    expect(lowerRow?.children[2]).toBe(screen.getByRole('region', { name: 'Clue Attribution Flow' }));
    expect(lowerRow?.children[3]).toBe(screen.getByRole('region', { name: 'Memory Layer' }));

    expect(screen.queryByRole('complementary', { name: 'Workspace assistant' })).not.toBeInTheDocument();
    expect(container.querySelector('.cockpit-right-panel')).not.toBeInTheDocument();
  });

  it('keeps the project controls, menu, search, and controlled navigation usable', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('searchbox', { name: 'Search workspace' })).toBeInTheDocument();
    const projectMenu = screen.getByRole('button', { name: /Tides of Embers/i });
    await user.click(projectMenu);
    expect(screen.getByRole('menu', { name: 'Project switcher' })).toBeInTheDocument();

    const navigation = screen.getByRole('navigation', { name: 'Workspace navigation' });
    const home = within(navigation).getByRole('button', { name: 'Home' });
    const structure = within(navigation).getByRole('button', { name: 'Structure' });
    expect(home).toHaveAttribute('aria-pressed', 'true');
    await user.click(structure);
    expect(home).toHaveAttribute('aria-pressed', 'false');
    expect(structure).toHaveAttribute('aria-pressed', 'true');
  });

  it('announces the new-project and hero actions exactly', async () => {
    const user = userEvent.setup();
    render(<App />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).not.toHaveClass('is-visible');

    await user.click(screen.getByRole('button', { name: 'New Project' }));
    expect(status).toHaveTextContent('New project creation is not available in this demo.');
    expect(status).toHaveClass('is-visible');

    await user.click(screen.getByRole('button', { name: /Continue Writing/i }));
    expect(status).toHaveTextContent('Opening the selected chapter draft.');

    await user.click(screen.getByRole('button', { name: /AI Assist/i }));
    expect(status).toHaveTextContent('AI Assist is ready for the selected chapter.');
  });

  it('dismisses action feedback after 3200ms while keeping the live region mounted', () => {
    vi.useFakeTimers();
    render(<App />);

    const status = screen.getByRole('status');
    fireEvent.click(screen.getByRole('button', { name: /Continue Writing/i }));
    expect(status).toHaveTextContent('Opening the selected chapter draft.');
    expect(status).toHaveClass('is-visible');

    act(() => vi.advanceTimersByTime(3199));
    expect(status).toHaveTextContent('Opening the selected chapter draft.');
    expect(status).toHaveClass('is-visible');

    act(() => vi.advanceTimersByTime(1));
    expect(status).toBeInTheDocument();
    expect(status).toBeEmptyDOMElement();
    expect(status).not.toHaveClass('is-visible');
  });

  it('opens agent details from both cards and restores focus for button and Escape closes', async () => {
    const user = userEvent.setup();
    render(<App />);

    const viewAll = screen.getByRole('button', { name: 'View All agent details' });
    await user.click(viewAll);
    expect(screen.getByRole('dialog', { name: 'Agent details' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close agent details' }));
    expect(screen.queryByRole('dialog', { name: 'Agent details' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(viewAll);

    const manage = screen.getByRole('button', { name: 'Manage memory' });
    await user.click(manage);
    expect(screen.getByRole('dialog', { name: 'Agent details' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Agent details' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(manage);
  });

  it('selects the first chapter when the active act changes', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Act I .*The Ash Tide/i }));
    const timeline = screen.getByRole('region', { name: 'Chapter Timeline' });

    expect(within(timeline).getByRole('button', { name: /Chapter 1/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(timeline).getByRole('button', { name: /Chapter 2/i })).toBeInTheDocument();
    expect(within(timeline).queryByRole('button', { name: /Chapter 3/i })).not.toBeInTheDocument();
  });

  it('updates clue attribution when a timeline chapter is selected', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Act I .*The Ash Tide/i }));
    await user.click(
      within(screen.getByRole('region', { name: 'Chapter Timeline' })).getByRole('button', {
        name: /Chapter 2/i,
      }),
    );

    expect(screen.getByText('Evidence connected to Chapter 2.')).toBeInTheDocument();
    expect(screen.getByText('The old tide map')).toBeInTheDocument();
    expect(screen.getByText('The map reveals the only safe approach under black water.')).toBeInTheDocument();
  });

  it('filters inspiration and announces the archive action', async () => {
    const user = userEvent.setup();
    render(<App />);

    const quotesFilter = screen.getByRole('button', { name: 'Quotes' });
    await user.click(quotesFilter);
    expect(quotesFilter).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('The price of a kept vow')).toBeInTheDocument();
    expect(screen.queryByText('Cold lighthouse signal')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View All inspiration' }));
    expect(screen.getByRole('status')).toHaveTextContent(
      'The full inspiration archive is available from Inspiration.',
    );
  });

  it('opens chapter details and restores trigger focus after both close paths', async () => {
    const user = userEvent.setup();
    render(<App />);

    const opener = screen.getByRole('button', { name: 'Open chapter details' });
    await user.click(opener);
    expect(screen.getByRole('dialog', { name: 'Chapter details' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close chapter details' }));
    expect(screen.queryByRole('dialog', { name: 'Chapter details' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(opener);

    await user.click(opener);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Chapter details' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(opener);
  });
});
