import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HomeDashboard } from './HomeDashboard';

const props = () => ({
  onOpenProject: vi.fn(), onNewProject: vi.fn(), onNavigate: vi.fn(), onStartWriting: vi.fn(), onShowMessage: vi.fn(),
});
describe('HomeDashboard', () => {
  it('renders the five new home sections', () => {
    render(<HomeDashboard {...props()} />);
    for (const name of ['今日创作挑战', 'AI 陪写', '快速生成', '最近项目', 'AI 建议']) {
      expect(screen.getByRole('region', { name })).toBeVisible();
    }
  });
  it('routes quick generation and starts writing', async () => {
    const p = props();
    render(<HomeDashboard {...p} />);
    await userEvent.click(screen.getByRole('button', { name: '小说大纲' }));
    await userEvent.click(screen.getByRole('button', { name: '开始陪写' }));
    expect(p.onNavigate).toHaveBeenCalledWith('outline');
    expect(p.onStartWriting).toHaveBeenCalledOnce();
  });
  it('wires challenge, project, and new-project actions', async () => {
    const p = props();
    render(<HomeDashboard {...p} />);
    await userEvent.click(screen.getByRole('button', { name: '立即挑战' }));
    await userEvent.click(screen.getByRole('button', { name: /星海旅人/ }));
    await userEvent.click(within(screen.getByRole('region', { name: '最近项目' })).getByRole('button', { name: '新建作品' }));
    await userEvent.click(screen.getByRole('button', { name: /云上王座/ }));
    expect(p.onShowMessage).toHaveBeenNthCalledWith(1, '创作挑战暂未在演示版开放。');
    expect(p.onShowMessage).toHaveBeenNthCalledWith(2, '该演示项目暂未开放。');
    expect(p.onNewProject).toHaveBeenCalledOnce();
    expect(p.onOpenProject).toHaveBeenCalledOnce();
  });
});
