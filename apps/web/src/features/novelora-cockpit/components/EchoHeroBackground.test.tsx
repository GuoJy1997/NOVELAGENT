import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EchoHeroBackground } from './EchoHeroBackground';

describe('EchoHeroBackground', () => {
  it('renders the Echo hero image once with eager loading hints', () => {
    const { container } = render(<EchoHeroBackground />);

    expect(container.querySelector('.echo-hero-background')).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(1);

    const image = images[0];
    expect(image).toHaveClass('echo-hero-background__image');
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('decoding', 'async');
    expect(image).toHaveAttribute('fetchpriority', 'high');
    expect(image).toHaveAttribute('draggable', 'false');
    expect(image).toHaveAttribute('src', expect.stringContaining('hero-background-clean'));
  });
});
