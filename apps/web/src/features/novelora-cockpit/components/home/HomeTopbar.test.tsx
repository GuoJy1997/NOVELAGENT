import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HomeTopbar } from './HomeTopbar';

describe('HomeTopbar', () => {
  it('focuses search with Meta+K and prevents browser handling', () => {
    const onShowMessage = vi.fn();
    render(<HomeTopbar onShowMessage={onShowMessage} />);

    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, cancelable: true });
    window.dispatchEvent(event);

    expect(screen.getByRole('searchbox', { name: '搜索项目' })).toHaveFocus();
    expect(event.defaultPrevented).toBe(true);
  });

  it('focuses search with Ctrl+K and prevents browser handling', () => {
    const onShowMessage = vi.fn();
    render(<HomeTopbar onShowMessage={onShowMessage} />);

    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });
    window.dispatchEvent(event);

    expect(screen.getByRole('searchbox', { name: '搜索项目' })).toHaveFocus();
    expect(event.defaultPrevented).toBe(true);
  });

  it('removes the shortcut listener on unmount', () => {
    const onShowMessage = vi.fn();
    const { unmount } = render(<HomeTopbar onShowMessage={onShowMessage} />);

    unmount();
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('reports unavailable notification and search actions', async () => {
    const user = userEvent.setup();
    const onShowMessage = vi.fn();
    render(<HomeTopbar onShowMessage={onShowMessage} />);

    await user.click(screen.getByRole('button', { name: '查看通知' }));
    await user.type(screen.getByRole('searchbox', { name: '搜索项目' }), '天空之冠');
    await user.keyboard('{Enter}');

    expect(onShowMessage.mock.calls).toEqual([
      ['通知中心暂未在演示版开放。'],
      ['搜索功能暂未在演示版开放。'],
    ]);
  });

  it('reports unavailable energy and Pro actions', async () => {
    const user = userEvent.setup();
    const onShowMessage = vi.fn();
    render(<HomeTopbar onShowMessage={onShowMessage} />);

    await user.click(screen.getByRole('button', { name: '创作能量 999+' }));
    await user.click(screen.getByRole('button', { name: '开通笔心Pro' }));

    expect(onShowMessage.mock.calls).toEqual([
      ['创作能量暂未在演示版开放。'],
      ['笔心 Pro 暂未在演示版开放。'],
    ]);
  });
});
