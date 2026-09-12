import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QuickGenCard } from './QuickGenCard';

describe('QuickGenCard', () => {
  it('renders quick actions and navigates', async () => {
    const onNavigate = vi.fn();
    const actions = [{ id: 'outline', label: '小说大纲', nav: 'outline' as const }, { id: 'chapter', label: '章节提纲', nav: 'writing' as const }, { id: 'character', label: '角色设定', nav: 'characters' as const }, { id: 'world', label: '世界设定', nav: 'world' as const }];
    render(<QuickGenCard actions={actions} onNavigate={onNavigate} />);
    expect(screen.getByRole('region', { name: '快速生成' })).toBeInTheDocument();
    for (const action of actions) await userEvent.click(screen.getByRole('button', { name: action.label }));
    expect(onNavigate.mock.calls.map(([nav]) => nav)).toEqual(['outline', 'writing', 'characters', 'world']);
  });
});
