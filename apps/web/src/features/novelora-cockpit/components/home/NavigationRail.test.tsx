import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NavigationRail } from './NavigationRail';

describe('NavigationRail', () => {
  it('starts a new project and reports the Pro promo action', async () => {
    const user = userEvent.setup();
    const onNewProject = vi.fn();
    const onShowMessage = vi.fn();
    render(<NavigationRail activeItem="home" onSelectItem={vi.fn()} onNewProject={onNewProject} onShowMessage={onShowMessage} />);

    await user.click(screen.getByRole('button', { name: '新建作品' }));
    await user.click(screen.getByRole('button', { name: '立即开通' }));

    expect(onNewProject).toHaveBeenCalledOnce();
    expect(onShowMessage).toHaveBeenCalledWith('笔心 Pro 暂未在演示版开放。');
  });

  it('keeps eight navigation buttons and pressed state', () => {
    render(<NavigationRail activeItem="writing" onSelectItem={vi.fn()} onNewProject={vi.fn()} onShowMessage={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.filter((button) => button.className.includes('bixin-navigation-rail__item'))).toHaveLength(8);
    expect(screen.getByRole('button', { name: '写作' })).toHaveAttribute('aria-pressed', 'true');
  });
});
