import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HomeDashboard } from './HomeDashboard';

describe('HomeDashboard', () => {
  it('renders the six home cards in the Bixin grid order', () => {
    const { container } = render(
      <HomeDashboard onOpenProject={() => undefined} onAddSchedule={() => undefined} />,
    );

    const grid = container.querySelector('.echo-home-dashboard');
    expect(grid?.children).toHaveLength(5);
    expect(grid?.children[0]).toHaveClass('echo-home-card--project');
    expect(grid?.children[1]).toHaveClass('echo-home-card--chapters');
    expect(grid?.children[2]).toHaveClass('echo-home-card--network');
    expect(grid?.children[3]).toHaveClass('echo-home-card--goals');
    expect(grid?.children[4]).toHaveClass('echo-home-dashboard__pair');
    expect(screen.getByRole('heading', { name: '我的项目' })).toBeVisible();
    expect(screen.getByRole('heading', { name: '章节进度' })).toBeVisible();
    expect(screen.getByRole('heading', { name: '人物关系' })).toBeVisible();
    expect(screen.getByRole('heading', { name: '写作目标' })).toBeVisible();
    expect(screen.getByRole('heading', { name: '场景日程' })).toBeVisible();
    expect(screen.getByRole('heading', { name: '2024 年 5 月' })).toBeVisible();
    expect(screen.getByText('Tides of Embers')).toBeVisible();
    expect(screen.getByText('Kael')).toBeVisible();
    expect(screen.getByText('Liora')).toBeVisible();
    expect(document.body.textContent ?? '').not.toMatch(/[—–]/);
  });

  it('reports 打开项目 and 添加日程 actions', async () => {
    const user = userEvent.setup();
    const onOpenProject = vi.fn();
    const onAddSchedule = vi.fn();
    render(<HomeDashboard onOpenProject={onOpenProject} onAddSchedule={onAddSchedule} />);

    await user.click(screen.getByRole('button', { name: '打开项目' }));
    await user.click(screen.getByRole('button', { name: '添加日程' }));

    expect(onOpenProject).toHaveBeenCalledOnce();
    expect(onAddSchedule).toHaveBeenCalledOnce();
  });

  it('marks the active calendar day without using color alone', () => {
    render(<HomeDashboard onOpenProject={() => undefined} onAddSchedule={() => undefined} />);
    const calendar = screen.getByRole('region', { name: '日历' });
    expect(within(calendar).getByText('17')).toHaveAttribute('aria-current', 'date');
  });
});
