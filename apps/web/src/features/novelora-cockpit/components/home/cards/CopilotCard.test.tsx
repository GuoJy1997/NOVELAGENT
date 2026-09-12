import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CopilotCard } from './CopilotCard';

describe('CopilotCard', () => {
  it('renders actions and reports picks', async () => {
    const onPick = vi.fn();
    render(<CopilotCard actions={['续写下一章', '优化剧情']} onPick={onPick} />);
    expect(screen.getByRole('region', { name: 'AI 陪写' })).toBeInTheDocument();
    for (const action of ['续写下一章', '优化剧情']) {
      expect(screen.getByRole('button', { name: action })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: action }));
    }
    await userEvent.click(screen.getByRole('button', { name: '开始陪写' }));
    expect(onPick).toHaveBeenCalledWith('续写下一章');
    expect(onPick.mock.calls).toEqual([['续写下一章'], ['优化剧情'], ['续写下一章']]);
  });
});
