import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChapterList } from './ChapterList';

const chapters = [
  { num: 1, title: 'Ash Morning', status: 'complete', words: 200 },
  { num: 2, title: 'Salt Map', status: 'drafting', words: 300 },
  { num: 3, title: 'Night Tide', status: 'revision', words: 400 },
];

describe('ChapterList', () => {
  it('filters chapter rows by title and preserves pressed state', async () => {
    const user = userEvent.setup();
    render(<ChapterList chapters={chapters} selectedNum={2} onSelect={vi.fn()} />);
    expect(screen.getByText('3 章')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salt Map/ })).toHaveAttribute('aria-pressed', 'true');
    await user.type(screen.getByRole('searchbox', { name: '搜索章节' }), 'night');
    expect(screen.queryByRole('button', { name: /Salt Map/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Night Tide/ })).toBeInTheDocument();
  });
});
