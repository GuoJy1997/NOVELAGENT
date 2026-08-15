/// <reference types="node" />

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as assetRegistry from './assetRegistry';
import {
  actionIcons,
  appIcon,
  characterPortraits,
  clueNodes,
  echoAssistantCard,
  echoHeroBackground,
  inspirationThumbnails,
  logo,
  navigationIcons,
  novaAvatar,
  novaFront,
  projectCovers,
} from './assetRegistry';

const pngSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const textDecoder = new TextDecoder();
const approvedRuntimeUiPalette = new Set([
  '#0AA85B',
  '#6FDDB1',
  '#14261F',
  '#60726A',
  '#DDF6EA',
  '#CFE8DD',
  '#F7FBF9',
]);
const navigationSourcePaths = [
  '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/home.svg',
  '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/characters.svg',
  '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/inspiration.svg',
  '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/projects.svg',
  '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/review.svg',
  '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/structure.svg',
  '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/worldbuilding.svg',
] as const;

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
  it('registers typed navigation and action icon groups as local SVG assets', () => {
    expect(Object.keys(navigationIcons)).toEqual([
      'home',
      'structure',
      'characters',
      'worldbuilding',
      'inspiration',
      'review',
      'projects',
    ]);
    expect(Object.keys(actionIcons)).toEqual(['search', 'bell']);

    for (const asset of [...Object.values(navigationIcons), ...Object.values(actionIcons)]) {
      expect(asset).toMatch(/^(?:data:image\/svg\+xml.*|.*\.svg(?:\?.*)?)$/);
      expect(textDecoder.decode(readResolvedAsset(asset))).toContain('<svg');
    }
  });

  it('registers the approved Echo hero background', () => {
    expect(echoHeroBackground).toContain('hero-background-clean');
    expect(echoHeroBackground).toMatch(/\.png(?:\?|$)/);
  });

  it('registers a compact 192 square Echo assistant card raster', () => {
    const sourcePath = '../../assets/echo/echo-assistant-card.png';
    const assetPath = fileURLToPath(new URL(sourcePath, import.meta.url));
    const sourceContents = new Uint8Array(readFileSync(assetPath));
    const resolvedContents = readResolvedAsset(echoAssistantCard);
    const dimensions = new DataView(
      sourceContents.buffer,
      sourceContents.byteOffset,
      sourceContents.byteLength,
    );

    expect(echoAssistantCard).toMatch(/echo-assistant-card.*\.png$/);
    expect(sourceContents.subarray(0, pngSignature.length)).toEqual(pngSignature);
    expect(textDecoder.decode(sourceContents.subarray(12, 16))).toBe('IHDR');
    expect(dimensions.getUint32(16)).toBe(192);
    expect(dimensions.getUint32(20)).toBe(192);
    expect(sourceContents.byteLength).toBeLessThanOrEqual(200 * 1024);
    expect(Buffer.compare(resolvedContents, sourceContents)).toBe(0);
  });

  it('keeps legacy book-origin rasters out of the active registry module', () => {
    const registrySource = readFileSync(
      resolve(process.cwd(), 'src/features/novelora-cockpit/assetRegistry.ts'),
      'utf8',
    );

    expect(assetRegistry).not.toHaveProperty('bookOriginBackground');
    expect(assetRegistry).not.toHaveProperty('writingCompanion');
    expect(registrySource).not.toContain('book_background.png');
    expect(registrySource).not.toContain('writing_companion.png');
  });

  it('keeps the runtime navigation and clue-node SVGs inside the white-mint palette', () => {
    const clueNodeAssets = [
      [clueNodes.origin, '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_clue_origin.svg'],
      [clueNodes.trigger, '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_trigger.svg'],
      [clueNodes.receiver, '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_receiver.svg'],
      [clueNodes.payoff, '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_payoff.svg'],
      [clueNodes.memory, '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_memory.svg'],
    ] as const;
    const runtimeSvgSources = [
      ...navigationSourcePaths.map((sourcePath) => ({ asset: undefined, sourcePath })),
      ...clueNodeAssets.map(([asset, sourcePath]) => ({ asset, sourcePath })),
    ];

    expect(navigationSourcePaths).toHaveLength(7);
    expect(clueNodeAssets).toHaveLength(5);

    runtimeSvgSources.forEach(({ asset, sourcePath }) => {
      const sourceContents = readFileSync(fileURLToPath(new URL(sourcePath, import.meta.url)), 'utf8');
      const hexColors = sourceContents.match(/#[0-9a-f]{6}\b/gi) ?? [];

      expect(sourceContents).toContain('<svg');
      expect(hexColors.length).toBeGreaterThan(0);
      expect(
        hexColors.filter((color) => !approvedRuntimeUiPalette.has(color.toUpperCase())),
        `${sourcePath} contains colors outside the approved runtime UI palette`,
      ).toEqual([]);

      if (asset) {
        expect(normalizeSvg(readResolvedAsset(asset))).toBe(
          normalizeSvg(new TextEncoder().encode(sourceContents)),
        );
      }
    });
  });

  it('resolves every cockpit asset URL to a valid, non-empty image file', () => {
    const assets = [
      [logo, '../../assets/novelora/novelora_ui_asset_pack/01_logo/novelora_logo_horizontal.svg'],
      [appIcon, '../../assets/novelora/novelora_ui_asset_pack/01_logo/app_icon_star.svg'],
      [echoAssistantCard, '../../assets/echo/echo-assistant-card.png'],
      [echoHeroBackground, '../../assets/echo/hero-background-clean.png'],
      [novaFront, '../../assets/novelora/novelora_ui_asset_pack/02_mascot/mascot_nova_front.svg'],
      [novaAvatar, '../../assets/novelora/novelora_ui_asset_pack/02_mascot/mascot_nova_avatar.svg'],
      [navigationIcons.home, '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/home.svg'],
      [navigationIcons.structure, '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/structure.svg'],
      [navigationIcons.characters, '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/characters.svg'],
      [navigationIcons.worldbuilding, '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/worldbuilding.svg'],
      [navigationIcons.inspiration, '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/inspiration.svg'],
      [navigationIcons.review, '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/review.svg'],
      [navigationIcons.projects, '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/projects.svg'],
      [actionIcons.search, '../../assets/novelora/novelora_ui_asset_pack/03_icons/actions/search.svg'],
      [actionIcons.bell, '../../assets/novelora/novelora_ui_asset_pack/03_icons/actions/bell.svg'],
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
      [clueNodes.origin, '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_clue_origin.svg'],
      [clueNodes.trigger, '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_trigger.svg'],
      [clueNodes.receiver, '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_receiver.svg'],
      [clueNodes.payoff, '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_payoff.svg'],
      [clueNodes.memory, '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_memory.svg'],
    ];

    expect(assets).toHaveLength(32);
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

        if (sourcePath === '../../assets/echo/hero-background-clean.png') {
          expect(Buffer.compare(resolvedContents, contents)).toBe(0);
          expect(createHash('sha256').update(contents).digest('hex')).toBe(
            'abe1dd54dc4f5c587c406c8e567593f5b63fda0672568621e2320b9f2d3be9df',
          );
        }
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

  it('keeps the supplied paper grain auditable without turning it into a runtime Vite URL', () => {
    const registry = assetRegistry as { paperGrainSourcePath?: string };
    const expectedSourcePath = '../../assets/novelora/novelora_ui_asset_pack/09_textures_backgrounds/paper_grain_overlay.png';
    const registrySource = readFileSync(
      resolve(process.cwd(), 'src/features/novelora-cockpit/assetRegistry.ts'),
      'utf8',
    );

    expect(registry.paperGrainSourcePath).toBe(expectedSourcePath);
    expect(registrySource).not.toMatch(/new URL\(\s*['"][^'"]*paper_grain_overlay\.png/);

    const paperGrainSource = fileURLToPath(new URL(expectedSourcePath, import.meta.url));
    const contents = new Uint8Array(readFileSync(paperGrainSource));

    expect(contents.byteLength).toBeGreaterThan(0);
    expect(contents.subarray(0, pngSignature.length)).toEqual(pngSignature);
  });

  it('keeps the bright cockpit background auditable without turning it into a runtime Vite URL', () => {
    const registry = assetRegistry as {
      brightCockpitBackground?: string;
      brightCockpitBackgroundSourcePath?: string;
    };
    const expectedSourcePath = '../../assets/novelora/novelora_ui_asset_pack/09_textures_backgrounds/bright_cockpit_background.png';
    const registrySource = readFileSync(
      resolve(process.cwd(), 'src/features/novelora-cockpit/assetRegistry.ts'),
      'utf8',
    );

    expect(registry.brightCockpitBackground).toBeUndefined();
    expect(registry.brightCockpitBackgroundSourcePath).toBe(expectedSourcePath);
    expect(registrySource).not.toMatch(/new URL\(\s*['"][^'"]*bright_cockpit_background\.png/);

    const backgroundSource = fileURLToPath(new URL(expectedSourcePath, import.meta.url));
    const contents = new Uint8Array(readFileSync(backgroundSource));

    expect(contents.byteLength).toBeGreaterThan(0);
    expect(contents.subarray(0, pngSignature.length)).toEqual(pngSignature);
  });
});
