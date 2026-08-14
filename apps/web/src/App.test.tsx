import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

afterEach(() => {
  vi.useRealTimers();
});

describe('App', () => {
  it('composes the Echo home dashboard with the Bixin card set', () => {
    const { container } = render(<App />);

    const page = container.querySelector('.echo-page.cockpit-scroll');
    const navigationRail = screen.getByRole('complementary', { name: 'Project navigation' });
    const home = container.querySelector('.echo-home-dashboard');

    expect(page?.children[0]).toHaveClass('echo-hero-background');
    expect(page?.children[1]).toHaveClass('cockpit-shell');
    expect(page?.children[2]).toHaveClass('echo-book-layer');
    expect(container.querySelectorAll('img[src*="scene-robot-background"]')).toHaveLength(1);
    expect(container.querySelectorAll('img[src*="book-foreground"]')).toHaveLength(1);
    expect(within(navigationRail).getAllByRole('img', { name: 'Echo' })).toHaveLength(1);
    expect(screen.queryByText(/Novelora/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Bring your story to life with AI' })).toHaveLength(1);

    expect(home?.children).toHaveLength(5);
    expect(home?.children[0]).toBe(screen.getByRole('region', { name: 'My Project' }));
    expect(home?.children[1]).toBe(screen.getByRole('region', { name: 'Chapter Progress' }));
    expect(home?.children[2]).toBe(screen.getByRole('region', { name: 'Character Network' }));
    expect(home?.children[3]).toBe(screen.getByRole('region', { name: 'Writing Goals' }));
    expect(home?.children[4]).toContainElement(screen.getByRole('region', { name: 'Scene Schedule' }));
    expect(home?.children[4]).toContainElement(screen.getByRole('region', { name: 'Calendar' }));

    expect(screen.queryByRole('region', { name: 'Novel Structure Map' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Chapter Timeline' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'AI Writing Partner' })).not.toBeInTheDocument();
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
    const home = within(navigation).getByRole('button', { name: '首页' });
    const outline = within(navigation).getByRole('button', { name: '大纲' });
    expect(home).toHaveAttribute('aria-pressed', 'true');
    await user.click(outline);
    expect(home).toHaveAttribute('aria-pressed', 'false');
    expect(outline).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('region', { name: '大纲' })).toBeInTheDocument();
  });

  it('announces the new-project and AI assist actions exactly', async () => {
    const user = userEvent.setup();
    render(<App />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).not.toHaveClass('is-visible');

    await user.click(screen.getByRole('button', { name: 'New Project' }));
    expect(status).toHaveTextContent('New project creation is not available in this demo.');
    expect(status).toHaveClass('is-visible');

    await user.click(screen.getByRole('button', { name: /AI Assist/i }));
    expect(status).toHaveTextContent('AI Assist is ready for the selected chapter.');
  });

  it('dismisses action feedback after 3200ms while keeping the live region mounted', () => {
    vi.useFakeTimers();
    render(<App />);

    const status = screen.getByRole('status');
    fireEvent.click(screen.getByRole('button', { name: /AI Assist/i }));
    expect(status).toHaveTextContent('AI Assist is ready for the selected chapter.');
    expect(status).toHaveClass('is-visible');

    act(() => vi.advanceTimersByTime(3199));
    expect(status).toHaveTextContent('AI Assist is ready for the selected chapter.');
    expect(status).toHaveClass('is-visible');

    act(() => vi.advanceTimersByTime(1));
    expect(status).toBeInTheDocument();
    expect(status).toBeEmptyDOMElement();
    expect(status).not.toHaveClass('is-visible');
  });

  it('opens the writing workspace from Continue Writing and returns', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /continue writing/i }));
    expect(screen.getByLabelText('Writing workspace')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /back to dashboard/i }));
    expect(screen.getByRole('main', { name: 'Story workspace' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'My Project' })).toBeInTheDocument();
  });

  it('opens the writing workspace from Open Project', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Open Project' }));
    expect(screen.getByLabelText('Writing workspace')).toBeInTheDocument();
  });

  it('announces schedule add from the home dashboard', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Add entry' }));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Schedule entries are not editable in this demo.',
    );
  });

  it('keeps visible copy free of em-dashes', () => {
    render(<App />);
    expect(document.body.textContent ?? '').not.toMatch(/[—–]/);
  });

  it('exposes the seven Chinese workspace nav items without em-dashes', () => {
    render(<App />);
    const navigation = screen.getByRole('navigation', { name: 'Workspace navigation' });
    const world = within(navigation).getByRole('button', { name: '世界观' });
    const tasks = within(navigation).getByRole('button', { name: '任务' });
    expect(world).toBeInTheDocument();
    expect(tasks).toBeInTheDocument();
    expect(world.textContent ?? '').not.toMatch(/[—–]/);
    expect(tasks.textContent ?? '').not.toMatch(/[—–]/);
  });

  it('opens the writing workspace from 写作 and a labeled placeholder from 世界观', async () => {
    const user = userEvent.setup();
    render(<App />);
    const navigation = screen.getByRole('navigation', { name: 'Workspace navigation' });
    await user.click(within(navigation).getByRole('button', { name: '写作' }));
    expect(screen.getByLabelText('Writing workspace')).toBeInTheDocument();
    await user.click(within(navigation).getByRole('button', { name: '世界观' }));
    expect(screen.getByRole('region', { name: '世界观' })).toBeInTheDocument();
  });
});
