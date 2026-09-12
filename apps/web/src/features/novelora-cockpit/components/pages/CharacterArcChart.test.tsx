import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CharacterArcChart } from './CharacterArcChart';

describe('CharacterArcChart', () => {
  it('renders an accessible chart with one point for each arc point', () => {
    render(
      <CharacterArcChart
        points={[
          { label: '起点', v: 30 },
          { label: '成长', v: 45 },
          { label: '高峰', v: 90 },
        ]}
      />,
    );

    const chart = screen.getByRole('img', { name: '人物弧光' });
    expect(chart).toBeInTheDocument();
    expect(chart.querySelectorAll('circle')).toHaveLength(3);
  });
});
