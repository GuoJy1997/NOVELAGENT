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

    expect(page?.children).toHaveLength(2);
    expect(page?.children[0]).toHaveClass('echo-hero-background');
    expect(page?.children[1]).toHaveClass('cockpit-shell');
    expect(container.querySelectorAll('img[src*="hero-background-clean"]')).toHaveLength(1);
    expect(container.querySelector('.echo-book-layer')).not.toBeInTheDocument();
    expect(container.querySelector('.echo-scale-viewport')).not.toBeInTheDocument();
    expect(within(navigationRail).getAllByRole('img', { name: 'Echo' })).toHaveLength(1);
    expect(screen.queryByText(/Novelora/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Bring your story to life with AI' })).toHaveLength(1);

    expect(home?.children).toHaveLength(5);
    expect(home?.children[0]).toBe(screen.getByRole('region', { name: '我的项目' }));
    expect(home?.children[1]).toBe(screen.getByRole('region', { name: '章节进度' }));
    expect(home?.children[2]).toBe(screen.getByRole('region', { name: '人物关系' }));
    expect(home?.children[3]).toBe(screen.getByRole('region', { name: '写作目标' }));
    expect(home?.children[4]).toContainElement(screen.getByRole('region', { name: '场景日程' }));
    expect(home?.children[4]).toContainElement(screen.getByRole('region', { name: '日历' }));

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
    expect(screen.getByRole('heading', { name: '大纲' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '大纲' })).toBeInTheDocument();
  });

  it('announces the new-project and AI assist actions exactly', async () => {
    const user = userEvent.setup();
    render(<App />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).not.toHaveClass('is-visible');

    await user.click(screen.getByRole('button', { name: 'New Project' }));
    expect(status).toHaveTextContent('演示中无法新建项目。');
    expect(status).toHaveClass('is-visible');

    await user.click(screen.getByRole('button', { name: /AI Assist/i }));
    expect(status).toHaveTextContent('AI 助手已就绪，可用于当前章节。');
  });

  it('dismisses action feedback after 3200ms while keeping the live region mounted', () => {
    vi.useFakeTimers();
    render(<App />);

    const status = screen.getByRole('status');
    fireEvent.click(screen.getByRole('button', { name: /AI Assist/i }));
    expect(status).toHaveTextContent('AI 助手已就绪，可用于当前章节。');
    expect(status).toHaveClass('is-visible');

    act(() => vi.advanceTimersByTime(3199));
    expect(status).toHaveTextContent('AI 助手已就绪，可用于当前章节。');
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
    await user.click(screen.getByRole('button', { name: '返回首页' }));
    expect(screen.getByRole('main', { name: 'Story workspace' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '我的项目' })).toBeInTheDocument();
  });

  it('opens the writing workspace from 打开项目', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '打开项目' }));
    expect(screen.getByLabelText('Writing workspace')).toBeInTheDocument();
  });

  it('announces schedule add from the home dashboard', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '添加日程' }));
    expect(screen.getByRole('status')).toHaveTextContent(
      '演示中无法编辑日程。',
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
    expect(screen.getByRole('heading', { name: '世界观' })).toBeInTheDocument();
    expect(screen.getByText('这是设定编辑，不会召唤 Agent。')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '世界观' })).toBeInTheDocument();
  });
});
