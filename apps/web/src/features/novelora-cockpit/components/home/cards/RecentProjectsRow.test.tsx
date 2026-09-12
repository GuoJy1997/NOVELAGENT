import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { homeProjectCovers } from '../../../assetRegistry';
import { RecentProjectsRow } from './RecentProjectsRow';

describe('RecentProjectsRow', () => {
  it('renders project titles and reports opening', async () => {
    const onOpen = vi.fn();
    const onNew = vi.fn();
    render(<RecentProjectsRow coverSrc="/cover.png" projects={[{ id: 'p1', genre: '奇幻', title: '云上王座', latestChapter: '更新至 第三十五章', words: '12.8万字', progressPercent: 68 }, { id: 'p2', genre: '科幻', title: '星海旅人', latestChapter: '更新至 第十八章', words: '8.7万字', progressPercent: 42 }, { id: 'p3', genre: '古风', title: '长安夜话录', latestChapter: '更新至 第二十章', words: '9.3万字', progressPercent: 55 }]} onOpen={onOpen} onNew={onNew} />);
    expect(screen.getByRole('region', { name: '最近项目' })).toBeInTheDocument();
    for (const title of ['云上王座', '星海旅人', '长安夜话录']) expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '云上王座封面' })).toHaveAttribute('src', '/cover.png');
    expect(screen.getByRole('img', { name: '星海旅人封面' })).toHaveAttribute('src', homeProjectCovers.starseaTraveler);
    expect(screen.getByRole('img', { name: '长安夜话录封面' })).toHaveAttribute('src', homeProjectCovers.changanNightTales);
    expect(document.querySelector('.bixin-recent-card__track span')).toHaveStyle({ width: '68%' });
    await userEvent.click(screen.getByRole('button', { name: /云上王座/ }));
    expect(onOpen).toHaveBeenCalledWith('p1');
    await userEvent.click(screen.getByRole('button', { name: '新建作品' }));
    expect(onNew).toHaveBeenCalledOnce();
  });
});
