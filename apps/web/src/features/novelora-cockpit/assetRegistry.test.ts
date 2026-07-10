/// <reference types="node" />

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
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

const pngSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const textDecoder = new TextDecoder();

function assetUrlToFilePath(assetUrl: string) {
  const url = new URL(assetUrl);

  if (url.protocol === 'file:') {
    return fileURLToPath(url);
  }

  return resolve(process.cwd(), decodeURIComponent(url.pathname).replace(/^\/+/, ''));
}

function readResolvedAsset(assetUrl: string) {
  if (!assetUrl.startsWith('data:')) {
    return new Uint8Array(readFileSync(assetUrlToFilePath(assetUrl)));
  }

  const separatorIndex = assetUrl.indexOf(',');
  const mediaType = assetUrl.slice(0, separatorIndex);
  const encodedContents = assetUrl.slice(separatorIndex + 1);

  if (mediaType.endsWith(';base64')) {
    return Uint8Array.from(atob(encodedContents), (character) => character.charCodeAt(0));
  }

  return new TextEncoder().encode(decodeURIComponent(encodedContents));
}

function normalizeSvg(contents: Uint8Array) {
  return textDecoder.decode(contents).replace(/[\s"']/g, '');
}

describe('novelora asset registry', () => {
  it('resolves every cockpit asset URL to a valid, non-empty image file', () => {
    const assets = [
      [logo, '../../assets/novelora/novelora_ui_asset_pack/01_logo/novelora_logo_horizontal.svg'],
      [appIcon, '../../assets/novelora/novelora_ui_asset_pack/01_logo/app_icon_star.svg'],
      [novaFront, '../../assets/novelora/novelora_ui_asset_pack/02_mascot/mascot_nova_front.svg'],
      [novaAvatar, '../../assets/novelora/novelora_ui_asset_pack/02_mascot/mascot_nova_avatar.svg'],
      [projectCovers.eclipseOfEchoes, '../../assets/novelora/novelora_ui_asset_pack/05_project_covers/cover_eclipse_of_echoes.svg'],
      [projectCovers.whispersVale, '../../assets/novelora/novelora_ui_asset_pack/05_project_covers/cover_whispers_vale.svg'],
      [projectCovers.chroniclesLumin, '../../assets/novelora/novelora_ui_asset_pack/05_project_covers/cover_chronicles_lumin.svg'],
      [characterPortraits.liora, '../../assets/novelora/novelora_ui_asset_pack/06_character_portraits/portrait_liora.svg'],
      [characterPortraits.arden, '../../assets/novelora/novelora_ui_asset_pack/06_character_portraits/portrait_arden.svg'],
      [characterPortraits.kael, '../../assets/novelora/novelora_ui_asset_pack/06_character_portraits/portrait_kael.svg'],
      [characterPortraits.selene, '../../assets/novelora/novelora_ui_asset_pack/06_character_portraits/portrait_selene.svg'],
      [characterPortraits.vex, '../../assets/novelora/novelora_ui_asset_pack/06_character_portraits/portrait_vex.svg'],
      [inspirationThumbnails.moonQuote, '../../assets/novelora/novelora_ui_asset_pack/07_inspiration_thumbnails/inspiration_moon_quote.svg'],
      [inspirationThumbnails.observatory, '../../assets/novelora/novelora_ui_asset_pack/07_inspiration_thumbnails/inspiration_observatory.svg'],
      [inspirationThumbnails.ruins, '../../assets/novelora/novelora_ui_asset_pack/07_inspiration_thumbnails/inspiration_ruins.svg'],
      [inspirationThumbnails.portal, '../../assets/novelora/novelora_ui_asset_pack/07_inspiration_thumbnails/inspiration_portal.svg'],
      [brightCockpitBackground, '../../assets/novelora/novelora_ui_asset_pack/09_textures_backgrounds/bright_cockpit_background.png'],
      [paperGrain, '../../assets/novelora/novelora_ui_asset_pack/09_textures_backgrounds/paper_grain_overlay.png'],
      [clueNodes.origin, '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_clue_origin.svg'],
      [clueNodes.trigger, '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_trigger.svg'],
      [clueNodes.receiver, '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_receiver.svg'],
      [clueNodes.payoff, '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_payoff.svg'],
      [clueNodes.memory, '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_memory.svg'],
    ];

    expect(assets).toHaveLength(23);
    expect(assets.every(([asset]) => asset.length > 0)).toBe(true);

    assets.forEach(([asset, sourcePath]) => {
      const assetPath = fileURLToPath(new URL(sourcePath, import.meta.url));
      const contents = new Uint8Array(readFileSync(assetPath));

      expect(contents.byteLength).toBeGreaterThan(0);
      const resolvedContents = readResolvedAsset(asset);

      expect(resolvedContents.byteLength).toBeGreaterThan(0);

      if (assetPath.endsWith('.svg')) {
        expect(textDecoder.decode(contents)).toContain('<svg');
        expect(textDecoder.decode(resolvedContents)).toContain('<svg');
        expect(normalizeSvg(resolvedContents)).toBe(normalizeSvg(contents));
      } else {
        expect(contents.subarray(0, pngSignature.length)).toEqual(pngSignature);
        expect(resolvedContents.subarray(0, pngSignature.length)).toEqual(pngSignature);
      }
    });

    render(
      createElement(
        'div',
        undefined,
        assets.map(([asset], index) =>
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
      expect(image.getAttribute('src')).toBe(assets[index][0]);
    });
  });
});
