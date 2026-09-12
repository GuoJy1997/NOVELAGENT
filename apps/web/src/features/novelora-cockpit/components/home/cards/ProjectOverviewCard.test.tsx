import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { bixinAssets } from '../../../assetRegistry';
import { ProjectOverviewCard } from './ProjectOverviewCard';

describe('ProjectOverviewCard', () => {
  it('uses the provided cover image and falls back when it fails to load', () => {
    const { rerender } = render(
      <ProjectOverviewCard
        coverSrc="/api/projects/taoyuan/cover?v=2"
        onOpenProject={() => undefined}
        view={{
          title: '桃园密码',
          status: '进行中',
          description: '已导入 1 章。',
          metrics: [{ label: '字数', value: '1200' }],
        }}
      />,
    );
    const cover = screen.getByRole('img', { name: /封面/ });
    expect(cover).toHaveAttribute('src', '/api/projects/taoyuan/cover?v=2');

    fireEvent.error(cover);
    expect(cover).toHaveAttribute('src', bixinAssets.projectCover);

    rerender(
      <ProjectOverviewCard
        onOpenProject={() => undefined}
        view={{
          title: '桃园密码',
          status: '进行中',
          description: '已导入 1 章。',
          metrics: [{ label: '字数', value: '1200' }],
        }}
      />,
    );
    expect(screen.getByRole('img', { name: /封面/ })).toHaveAttribute('src', bixinAssets.projectCover);
  });
});
