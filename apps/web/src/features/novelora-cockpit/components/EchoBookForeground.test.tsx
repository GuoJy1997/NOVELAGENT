import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EchoBookForeground } from './EchoBookForeground';

describe('EchoBookForeground', () => {
  it('renders the book above the dashboard and ignores pointer events', () => {
    const { container } = render(<EchoBookForeground />);
    const layer = container.querySelector('.echo-book-layer');
    const image = container.querySelector('img');

    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(image).toHaveClass('echo-book-foreground');
    expect(image).toHaveAttribute('src', expect.stringContaining('book-foreground'));
    expect(image).toHaveAttribute('draggable', 'false');
  });
});
