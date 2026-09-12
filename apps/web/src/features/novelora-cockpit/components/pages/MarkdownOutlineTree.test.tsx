import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { OutlineNode } from '../../lib/markdownOutline';
import { MarkdownOutlineTree } from './MarkdownOutlineTree';

describe('MarkdownOutlineTree', () => {
  it('renders headings as indented jump buttons', async () => {
    const user = userEvent.setup();
    const onJump = vi.fn();
    const nodes: OutlineNode[] = [
      { level: 1, text: '第一卷', line: 2 },
      { level: 2, text: '第一幕', line: 3 },
    ];
    render(<MarkdownOutlineTree nodes={nodes} onJump={onJump} />);

    expect(screen.getByRole('button', { name: '第一卷' })).toHaveStyle({ paddingLeft: '12px' });
    expect(screen.getByRole('button', { name: '第一幕' })).toHaveStyle({ paddingLeft: '28px' });
    await user.click(screen.getByRole('button', { name: '第一幕' }));
    expect(onJump).toHaveBeenCalledWith(3);
  });

  it('does not create a nested landmark for the page directory', () => {
    render(<MarkdownOutlineTree nodes={[]} onJump={vi.fn()} />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('does not create a nested landmark for the page directory', () => {
    render(<MarkdownOutlineTree nodes={[]} onJump={vi.fn()} />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
