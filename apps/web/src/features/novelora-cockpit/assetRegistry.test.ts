import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import {
  appIcon,
  brightCockpitBackground,
  characterPortraits,
  clueNodes,
  inspirationThumbnails,
  logo,
  novaAvatar,
  novaFront,
  paperGrain,
  projectCovers,
} from './assetRegistry';

describe('novelora asset registry', () => {
  it('provides usable image URLs for the cockpit essentials', () => {
    const assets = [
      logo,
      appIcon,
      novaFront,
      novaAvatar,
      ...Object.values(projectCovers),
      ...Object.values(characterPortraits),
      ...Object.values(inspirationThumbnails),
      brightCockpitBackground,
      paperGrain,
      ...Object.values(clueNodes),
    ];

    expect(assets).toHaveLength(23);
    expect(assets.every((asset) => asset.length > 0)).toBe(true);

    render(
      createElement(
        'div',
        undefined,
        assets.map((asset, index) =>
          createElement('img', {
            alt: `Novelora asset ${index + 1}`,
            key: asset,
            src: asset,
          }),
        ),
      ),
    );

    expect(screen.getAllByRole('img')).toHaveLength(assets.length);
    screen.getAllByRole('img').forEach((image, index) => {
      expect(image.getAttribute('src')).toBe(assets[index]);
    });
  });
});
