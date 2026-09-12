import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChallengeCard } from './ChallengeCard';

describe('ChallengeCard', () => {
  it('renders the challenge and reports starting it', async () => {
    const onStart = vi.fn();
    render(<ChallengeCard challenge={{ topic: '命运的转折点', description: '描述', reward: '创作能量 +80', participants: '1234 人正在参与挑战' }} onStart={onStart} />);
    expect(screen.getByRole('region', { name: '今日创作挑战' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '立即挑战' }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
