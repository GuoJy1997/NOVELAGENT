/// <reference types="node" />

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { closeSync, openSync, readFileSync, readSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as assetRegistry from './assetRegistry';
import {
  actionIcons,
  appIcon,
  bixinAssets,
  characterBanners,
  characterPortraits,
  clueNodes,
  homeProjectCovers,
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

function readAssetPrefix(assetPath: string, length: number) {
  const fileDescriptor = openSync(assetPath, 'r');
  const prefix = new Uint8Array(length);

  try {
    return prefix.subarray(0, readSync(fileDescriptor, prefix, 0, length, 0));
  } finally {
    closeSync(fileDescriptor);
  }
}

function normalizeSvg(contents: Uint8Array) {
  return textDecoder.decode(contents).replace(/[\s"']/g, '');
}

describe('novelora asset registry', () => {
  it('exposes complete non-empty Bixin and character banner runtime registries', () => {
    expect(Object.keys(bixinAssets)).toEqual([
      'appIcon',
      'scene',
      'book',
      'projectCover',
      'heroRobot',
      'homeBackdrop',
      'skyBand',
      'mascotChallenge',
      'mascotCopilot',
      'mascotQuickgen',
      'mascotPro',
      'promoRocket',
      'quill',
      'avatarWriter',
    ]);
    expect(Object.keys(characterBanners)).toEqual([
      'liora',
      'arden',
      'kael',
      'selene',
      'vex',
      'theOrder',
    ]);
    expect(Object.keys(homeProjectCovers)).toEqual([
      'cloudThrone',
      'starseaTraveler',
      'changanNightTales',
      'defaultFantasy',
    ]);

    expect(
      [...Object.values(bixinAssets), ...Object.values(characterBanners)].every(
        (asset) => typeof asset === 'string' && asset.length > 0,
      ),
    ).toBe(true);
  });

  it('maps approved generated Bixin assets to their final filenames', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/features/novelora-cockpit/assetRegistry.ts'),
      'utf8',
    );

    expect(source).toContain(
      "homeBackdrop: new URL('../../assets/bixin/home-sky-backdrop.png', import.meta.url).href",
    );
    expect(source).toContain(
      "skyBand: new URL('../../assets/bixin/scene-sky-band.png', import.meta.url).href",
    );
    expect(source).toContain(
      "heroRobot: new URL('../../assets/bixin/hero-robot-uizip-v3.png', import.meta.url).href",
    );
    expect(source).toContain(
      "avatarWriter: new URL('../../assets/bixin/avatar-writer.png', import.meta.url).href",
    );
  });

  it('maps approved generated character portraits to their final PNG filenames', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/features/novelora-cockpit/assetRegistry.ts'),
      'utf8',
    );

    expect(source).toContain(
      "liora: new URL('../../assets/bixin/uizip-generated/portrait-liora.png', import.meta.url).href",
    );
    expect(source).toContain(
      "arden: new URL('../../assets/bixin/uizip-generated/portrait-arden.png', import.meta.url).href",
    );
    expect(source).toContain(
      "kael: new URL('../../assets/bixin/uizip-generated/portrait-kael.png', import.meta.url).href",
    );
    expect(source).toContain(
      "selene: new URL('../../assets/bixin/uizip-generated/portrait-selene.png', import.meta.url).href",
    );
    expect(source).toContain(
      "vex: new URL('../../assets/bixin/uizip-generated/portrait-vex.png', import.meta.url).href",
    );
    expect(source).toContain(
      "theOrder: new URL('../../assets/bixin/uizip-generated/portrait-the-order.png', import.meta.url).href",
    );
  });

  it('maps each character banner to its supplied generated PNG filename', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/features/novelora-cockpit/assetRegistry.ts'),
      'utf8',
    );

    expect(source).toContain(
      "liora: new URL('../../assets/bixin/uizip-generated/portrait-liora-banner.png', import.meta.url).href",
    );
    expect(source).toContain(
      "arden: new URL('../../assets/bixin/uizip-generated/portrait-arden-banner.png', import.meta.url).href",
    );
    expect(source).toContain(
      "kael: new URL('../../assets/bixin/uizip-generated/portrait-kael-banner.png', import.meta.url).href",
    );
    expect(source).toContain(
      "selene: new URL('../../assets/bixin/uizip-generated/portrait-selene-banner.png', import.meta.url).href",
    );
    expect(source).toContain(
      "vex: new URL('../../assets/bixin/uizip-generated/portrait-vex-banner.png', import.meta.url).href",
    );
    expect(source).toContain(
      "theOrder: new URL('../../assets/bixin/uizip-generated/portrait-the-order-banner.png', import.meta.url).href",
    );
  });

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
      [bixinAssets.appIcon, '../../assets/bixin/bixin-app-icon.png'],
      [bixinAssets.scene, '../../assets/bixin/scene-robot-background.png'],
      [bixinAssets.book, '../../assets/bixin/book-foreground.svg'],
      [bixinAssets.projectCover, '../../assets/bixin/project-cover.png'],
      [bixinAssets.heroRobot, '../../assets/bixin/hero-robot-uizip-v3.png'],
      [bixinAssets.homeBackdrop, '../../assets/bixin/home-sky-backdrop.png'],
      [bixinAssets.skyBand, '../../assets/bixin/scene-sky-band.png'],
      [bixinAssets.mascotChallenge, '../../assets/bixin/mascot-challenge.png'],
      [bixinAssets.mascotCopilot, '../../assets/bixin/mascot-copilot.png'],
      [bixinAssets.mascotQuickgen, '../../assets/bixin/mascot-quickgen.png'],
      [bixinAssets.mascotPro, '../../assets/bixin/mascot-pro.png'],
      [bixinAssets.promoRocket, '../../assets/bixin/promo-rocket.png'],
      [bixinAssets.avatarWriter, '../../assets/bixin/avatar-writer.png'],
      [homeProjectCovers.cloudThrone, '../../assets/bixin/cover-cloud-throne.png'],
      [homeProjectCovers.starseaTraveler, '../../assets/bixin/cover-starsea-traveler.png'],
      [homeProjectCovers.changanNightTales, '../../assets/bixin/cover-changan-night-tales.png'],
      [homeProjectCovers.defaultFantasy, '../../assets/bixin/cover-default-fantasy.png'],
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
      [characterPortraits.liora, '../../assets/bixin/uizip-generated/portrait-liora.png'],
      [characterPortraits.arden, '../../assets/bixin/uizip-generated/portrait-arden.png'],
      [characterPortraits.kael, '../../assets/bixin/uizip-generated/portrait-kael.png'],
      [characterPortraits.selene, '../../assets/bixin/uizip-generated/portrait-selene.png'],
      [characterPortraits.vex, '../../assets/bixin/uizip-generated/portrait-vex.png'],
      [characterPortraits.theOrder, '../../assets/bixin/uizip-generated/portrait-the-order.png'],
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

    expect(assets).toHaveLength(48);
    expect(assets.every(([asset]) => asset.length > 0)).toBe(true);

    assets.forEach(([asset, sourcePath]) => {
      const assetPath = fileURLToPath(new URL(sourcePath, import.meta.url));

      if (assetPath.endsWith('.svg')) {
        const contents = new Uint8Array(readFileSync(assetPath));
        const resolvedContents = readResolvedAsset(asset);

        expect(contents.byteLength).toBeGreaterThan(0);
        expect(resolvedContents.byteLength).toBeGreaterThan(0);
        expect(textDecoder.decode(contents)).toContain('<svg');
        expect(textDecoder.decode(resolvedContents)).toContain('<svg');
        expect(normalizeSvg(resolvedContents)).toBe(normalizeSvg(contents));
      } else {
        const resolvedPath = assetUrlToFilePath(asset);
        const sourcePrefix = readAssetPrefix(assetPath, 24);
        const resolvedPrefix = readAssetPrefix(resolvedPath, 24);

        expect(resolvedPath).toBe(assetPath);
        expect(statSync(assetPath).size).toBeGreaterThan(0);
        expect(sourcePrefix.subarray(0, pngSignature.length)).toEqual(pngSignature);
        expect(resolvedPrefix.subarray(0, pngSignature.length)).toEqual(pngSignature);
        expect(textDecoder.decode(sourcePrefix.subarray(12, 16))).toBe('IHDR');
        expect(textDecoder.decode(resolvedPrefix.subarray(12, 16))).toBe('IHDR');
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
