import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const globalCss = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');
const cockpitCss = readFileSync(resolve(process.cwd(), 'src/styles/cockpit.css'), 'utf8');
const tokensCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');
const logoSvg = readFileSync(
  resolve(process.cwd(), 'src/assets/novelora/novelora_ui_asset_pack/01_logo/novelora_logo_horizontal.svg'),
  'utf8',
);

const readSvgAttributes = (source: string) =>
  Object.fromEntries(Array.from(source.matchAll(/([\w-]+)="([^"]*)"/g), ([, name, value]) => [name, value]));

type CssBlock = { prelude: string; body: string };
type ContextualStyleRule = CssBlock & { selectors: string[]; atRules: string[] };

const stripCssComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '');

const findClosingBrace = (source: string, openingBrace: number) => {
  let depth = 0;
  let quote = '';

  for (let index = openingBrace; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === '\\') index += 1;
      else if (character === quote) quote = '';
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '{') {
      depth += 1;
    } else if (character === '}' && --depth === 0) {
      return index;
    }
  }

  throw new Error(`Unclosed CSS block at offset ${openingBrace}`);
};

const topLevelBlocks = (source: string) => {
  const css = stripCssComments(source);
  const blocks: CssBlock[] = [];
  let cursor = 0;

  while (cursor < css.length) {
    while (/\s|;/.test(css[cursor] ?? '')) cursor += 1;
    if (cursor >= css.length) break;

    let quote = '';
    let boundary = cursor;
    for (; boundary < css.length; boundary += 1) {
      const character = css[boundary];
      if (quote) {
        if (character === '\\') boundary += 1;
        else if (character === quote) quote = '';
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === ';' || character === '{') {
        break;
      }
    }

    if (css[boundary] === ';') {
      cursor = boundary + 1;
      continue;
    }
    if (css[boundary] !== '{') break;

    const closingBrace = findClosingBrace(css, boundary);
    blocks.push({ prelude: css.slice(cursor, boundary).trim(), body: css.slice(boundary + 1, closingBrace) });
    cursor = closingBrace + 1;
  }

  return blocks;
};

const contextualStyleRules = (source: string, atRules: string[] = []): ContextualStyleRule[] =>
  topLevelBlocks(source).flatMap((block) =>
    block.prelude.startsWith('@')
      ? contextualStyleRules(block.body, [...atRules, block.prelude])
      : [{ ...block, selectors: block.prelude.split(',').map((selector) => selector.trim()), atRules }],
  );

const exactAtRuleBody = (source: string, prelude: string) => {
  const matches = topLevelBlocks(source).filter((block) => block.prelude === prelude);
  if (matches.length !== 1) throw new Error(`Expected one exact CSS at-rule block for: ${prelude}`);
  return matches[0].body;
};

const topLevelRuleBodiesForSelector = (source: string, selector: string) =>
  contextualStyleRules(source)
    .filter((rule) => rule.atRules.length === 0 && rule.selectors.includes(selector))
    .map((rule) => rule.body);

const finalTopLevelDeclaration = (source: string, selector: string, property: string) => {
  const declarations = topLevelRuleBodiesForSelector(source, selector).flatMap((body) =>
    Array.from(body.matchAll(new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+);`, 'g')), ([, value]) => value.trim()),
  );

  return declarations.at(-1);
};

const finalEffectiveBorderBottom = (source: string, selector: string) => {
  const declarations = topLevelRuleBodiesForSelector(source, selector).flatMap((body) =>
    body
      .split(';')
      .map((declaration) => declaration.match(/^\s*(border|border-bottom)\s*:\s*(.+)\s*$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map(([, property, rawValue]) => {
        const important = /\s*!important\s*$/i.test(rawValue);
        return {
          property,
          value: rawValue.replace(/\s*!important\s*$/i, '').trim(),
          important,
        };
      }),
  );

  return declarations.reduce<{ value: string; important: boolean } | undefined>((effective, declaration) => {
    if (declaration.property !== 'border' && declaration.property !== 'border-bottom') return effective;
    if (effective?.important && !declaration.important) return effective;
    return { value: declaration.value, important: declaration.important };
  }, undefined)?.value;
};

const isAbsentBorder = (value: string | undefined) => {
  if (value === undefined || /\bnone\b/i.test(value)) return true;
  const valueWithoutFunctions = value.replace(/\([^)]*\)/g, '');
  return valueWithoutFunctions
    .trim()
    .split(/\s+/)
    .some((component) => /^0(?:[a-z]+|%)?$/i.test(component));
};

const declaresBackdropFilter = (body: string) => /(?:^|;)\s*(?:-webkit-)?backdrop-filter\s*:/.test(body);

const readHexToken = (source: string, token: string) => {
  const value = source.match(new RegExp(`--${token}:\\s*(#[0-9a-f]{6});`, 'i'))?.[1];
  if (!value) throw new Error(`Expected a six-digit hex value for --${token}`);
  return value;
};

const readFunctionalColorAlpha = (value: string | undefined) => {
  const channels = value?.trim().match(/^rgba?\((.*)\)$/i)?.[1];
  if (channels === undefined) return undefined;

  const alphaSource = channels.includes('/')
    ? channels.slice(channels.lastIndexOf('/') + 1).trim()
    : channels.split(',').length === 4
      ? channels.split(',').at(-1)?.trim()
      : undefined;
  if (alphaSource === undefined) return 1;

  const alphaMatch = alphaSource.match(/^(\d*\.?\d+)(%)?$/);
  if (!alphaMatch) return Number.NaN;
  const alpha = Number(alphaMatch[1]);
  return alphaMatch[2] === '%' ? alpha / 100 : alpha;
};

const readColorAlphaToken = (source: string, token: string) => {
  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const value = source.match(new RegExp(`(?:^|[;{])\\s*--${escapedToken}:\\s*([^;]+);`, 'im'))?.[1];
  return readFunctionalColorAlpha(value);
};

const readNumberToken = (source: string, token: string) => {
  const value = source.match(new RegExp(`--${token}:\\s*(\\d+(?:\\.\\d+)?);`, 'i'))?.[1];
  return value === undefined ? undefined : Number(value);
};

const readFilterSaturation = (filter: string | undefined) => {
  const saturationSource = filter?.match(/saturate\(([^)]*)\)/i)?.[1].trim();
  if (saturationSource === undefined) return 1;

  const saturationMatch = saturationSource.match(/^(\d*\.?\d+)(%)?$/);
  if (!saturationMatch) return Number.NaN;
  const saturation = Number(saturationMatch[1]);
  return saturationMatch[2] === '%' ? saturation / 100 : saturation;
};

const splitTopLevelCommas = (source: string) => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === '(') depth += 1;
    else if (source[index] === ')') depth -= 1;
    else if (source[index] === ',' && depth === 0) {
      parts.push(source.slice(start, index).trim());
      start = index + 1;
    }
  }

  parts.push(source.slice(start).trim());
  return parts;
};

const linearGradientArguments = (gradient: string | undefined) => {
  if (gradient === undefined) return undefined;
  const opening = gradient.search(/linear-gradient\(/i);
  if (opening < 0) return undefined;

  const bodyStart = gradient.indexOf('(', opening) + 1;
  let depth = 1;
  for (let index = bodyStart; index < gradient.length; index += 1) {
    if (gradient[index] === '(') depth += 1;
    else if (gradient[index] === ')' && --depth === 0) {
      return splitTopLevelCommas(gradient.slice(bodyStart, index));
    }
  }

  return undefined;
};

const gradientStopAlpha = (stop: string) => {
  if (/\btransparent\b/i.test(stop)) return 0;
  const functionalColor = stop.match(/rgba?\([^)]*\)/i)?.[0];
  const functionalAlpha = readFunctionalColorAlpha(functionalColor);
  if (functionalAlpha !== undefined) return functionalAlpha;

  const hex = stop.match(/#([0-9a-f]{3,8})\b/i)?.[1];
  if (hex?.length === 4) return Number.parseInt(hex[3], 16) / 15;
  if (hex?.length === 8) return Number.parseInt(hex.slice(6), 16) / 255;
  if (hex?.length === 3 || hex?.length === 6 || /\b(?:black|white)\b/i.test(stop)) return 1;
  return undefined;
};

const gradientHasDownwardFade = (gradient: string | undefined) => {
  const parts = linearGradientArguments(gradient);
  if (!parts || !/^(?:to\s+bottom|180deg)$/i.test(parts[0])) return false;

  const stops = parts.slice(1);
  const firstAlpha = stops.map(gradientStopAlpha).find((alpha) => alpha !== undefined);
  const lastAlpha = stops.map(gradientStopAlpha).findLast((alpha) => alpha !== undefined);
  const transparentAtEnd = /\btransparent\b/i.test(stops.at(-1) ?? '') &&
    stops.slice(0, -1).some((stop) => !/\btransparent\b/i.test(stop));

  return transparentAtEnd ||
    (firstAlpha !== undefined && lastAlpha !== undefined && lastAlpha < firstAlpha);
};

type SrgbColor = string | readonly [number, number, number];

const srgbChannels = (color: SrgbColor): [number, number, number] => {
  if (typeof color !== 'string') return [...color];
  const channels = color.slice(1).match(/.{2}/g)?.map((channel) => Number.parseInt(channel, 16));
  if (!channels || channels.length !== 3) throw new Error(`Invalid hex color: ${color}`);
  return channels as [number, number, number];
};

const mixSrgb = (first: SrgbColor, firstWeight: number, second: SrgbColor): [number, number, number] => {
  const firstChannels = srgbChannels(first);
  const secondChannels = srgbChannels(second);
  return firstChannels.map(
    (channel, index) => channel * firstWeight + secondChannels[index] * (1 - firstWeight),
  ) as [number, number, number];
};

const relativeLuminance = (color: SrgbColor) => {
  const channels = srgbChannels(color)
    .map((channel) => channel / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrastRatio = (first: SrgbColor, second: SrgbColor) => {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
};

describe('global cockpit texture', () => {
  it('queries declarations only within their explicit CSS condition context', () => {
    const fixture = `
      /* .surface { background: polluted; } */
      .surface { background: white; }
      @media (max-width: 800px) { .surface { background: black; } }
      @supports (backdrop-filter: blur(1px)) {
        /* selector context */
        .surface { backdrop-filter: blur(20px); }
      }
    `;
    const supportBody = exactAtRuleBody(fixture, '@supports (backdrop-filter: blur(1px))');

    expect(finalTopLevelDeclaration(fixture, '.surface', 'background')).toBe('white');
    expect(finalTopLevelDeclaration(supportBody, '.surface', 'backdrop-filter')).toBe('blur(20px)');
    expect(contextualStyleRules(fixture).find((rule) => rule.body.includes('background: black'))?.atRules).toEqual([
      '@media (max-width: 800px)',
    ]);
  });

  it('parses legacy and modern alpha syntax plus explicit saturation units', () => {
    const fixture = `
      :root {
        --legacy-alpha: rgba(255, 255, 255, 0.28);
        --modern-alpha: rgb(255 255 255 / 28%);
      }
    `;

    expect(readColorAlphaToken(fixture, 'legacy-alpha')).toBe(0.28);
    expect(readColorAlphaToken(fixture, 'modern-alpha')).toBe(0.28);
    expect(readFilterSaturation(undefined)).toBe(1);
    expect(readFilterSaturation('brightness(1.02)')).toBe(1);
    expect(readFilterSaturation('saturate(0.85)')).toBe(0.85);
    expect(readFilterSaturation('saturate(85%)')).toBe(0.85);
    expect(Number.isNaN(readFilterSaturation('saturate(var(--stage-saturation))'))).toBe(true);
    expect(gradientHasDownwardFade('linear-gradient(to bottom, black, transparent)')).toBe(true);
    expect(
      gradientHasDownwardFade('linear-gradient(180deg, rgb(0 0 0 / 80%), rgb(0 0 0 / 0%))'),
    ).toBe(true);
    expect(gradientHasDownwardFade('linear-gradient(to top, black, transparent)')).toBe(false);
    expect(gradientHasDownwardFade('linear-gradient(to bottom, transparent, black)')).toBe(false);
    expect(gradientHasDownwardFade('linear-gradient(to bottom, #000, #fff)')).toBe(false);
  });

  it('resolves border shorthand and longhand in source order', () => {
    const fixture = `
      .shorthand-only { border: 0; }
      .bottom-override { border: 1px solid red; border-bottom: 0; }
      .bottom-regression { border: 0; border-bottom: 1px solid red; }
      .important-override { border-bottom: 0 !important; border: 1px solid red; }
      .important-regression { border: 0; border-bottom: 1px solid red !important; }
      .transparent-color { border: 1px solid rgba(0, 0, 0, 0); }
      .zero-width { border-bottom: solid 0px transparent; }
    `;

    expect(isAbsentBorder(finalEffectiveBorderBottom(fixture, '.shorthand-only'))).toBe(true);
    expect(isAbsentBorder(finalEffectiveBorderBottom(fixture, '.bottom-override'))).toBe(true);
    expect(isAbsentBorder(finalEffectiveBorderBottom(fixture, '.bottom-regression'))).toBe(false);
    expect(isAbsentBorder(finalEffectiveBorderBottom(fixture, '.important-override'))).toBe(true);
    expect(isAbsentBorder(finalEffectiveBorderBottom(fixture, '.important-regression'))).toBe(false);
    expect(isAbsentBorder(finalEffectiveBorderBottom(fixture, '.transparent-color'))).toBe(false);
    expect(isAbsentBorder(finalEffectiveBorderBottom(fixture, '.zero-width'))).toBe(true);
  });

  it('defines one white-mint visual language without the retired decorative palette', () => {
    expect(tokensCss).toMatch(/--color-canvas:\s*#f7fbf9;/i);
    expect(tokensCss).toMatch(/--color-surface:\s*#ffffff;/);
    expect(tokensCss).toMatch(/--color-mint-primary:\s*#0aa85b;/i);
    expect(tokensCss).toMatch(/--color-mint-support:\s*#6fddb1;/i);
    expect(tokensCss).toMatch(/--color-mint-soft:\s*#ddf6ea;/i);
    expect(tokensCss).toMatch(/--color-ink:\s*#14261f;/i);
    expect(tokensCss).toMatch(/--color-text-muted:\s*#6c7d75;/i);
    expect(tokensCss).toMatch(/--color-text-subtle:\s*#60726a;/i);
    expect(tokensCss).toMatch(/--color-focus-ring:\s*#087a44;/i);
    expect(tokensCss).toMatch(/--color-text-secondary:\s*var\(--color-text-subtle\);/i);
    expect(tokensCss).not.toMatch(/#ff6b57|#3a86ff|#8f67ff|Georgia|Times New Roman/i);
    expect(tokensCss).toMatch(/--font-display:\s*var\(--font-ui\);/);
  });

  it('scales green interaction treatments by hierarchy and reserves warm colors for semantic states', () => {
    for (const selector of ['.chapter-details-button', '.focus-mode-toggle.is-active']) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'border-color')).toBe('var(--color-mint-primary)');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'color')).toBe('#087a44');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'background')).toBe(
        'color-mix(in srgb, var(--color-mint-soft) 78%, white)',
      );
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'box-shadow')).toBe('0 10px 26px rgba(10, 168, 91, .12)');
    }

    expect(finalTopLevelDeclaration(cockpitCss, '.project-navigation__item.is-active', 'border-color')).toBe(
      'transparent',
    );
    expect(finalTopLevelDeclaration(cockpitCss, '.project-navigation__item.is-active', 'background')).toBe(
      'color-mix(in srgb, var(--color-mint-soft) 58%, transparent)',
    );
    expect(finalTopLevelDeclaration(cockpitCss, '.project-navigation__item.is-active', 'box-shadow')).toBe('none');

    for (const selector of [
      '.structure-map .act-card.is-selected',
      '.chapter-swimlane .chapter-card.is-selected',
    ]) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'border-color')).toBe('var(--color-mint-primary)');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'color')).toBe('var(--color-ink)');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'background')).toBe(
        'color-mix(in srgb, var(--surface-inner-card) 88%, var(--color-mint-soft))',
      );
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'box-shadow')).toBe('var(--shadow-inner-card)');
    }

    expect(cockpitCss).not.toMatch(/\.act-card--(?:coral|mint|sky|amber)\.is-selected/);
    expect(cockpitCss).not.toMatch(/var\(--color-(?:coral|sky|lilac)\)/);
    expect(cockpitCss).not.toMatch(/#ff6b57|#3a86ff|#8f67ff|#ffe5dd/i);

    expect(finalTopLevelDeclaration(cockpitCss, '.agent-status-chip--queued', 'color')).toBe('#875f19');
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-status-chip--queued', 'background')).toBe('#fff3d9');
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-status-chip--queued', 'border-color')).toBe(
      'var(--color-state-warning)',
    );
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-status-chip--running', 'color')).toBe('#28765b');
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-status-chip--running', 'background')).toBe('#def4e9');
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-status-chip--done', 'color')).toBe('#087a44');
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-status-chip--done', 'background')).toBe('var(--color-mint-soft)');
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-status-chip--blocked', 'color')).toBe('#a6413b');
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-status-chip--blocked', 'background')).toBe(
      'color-mix(in srgb, var(--color-state-danger) 14%, white)',
    );

    expect(finalTopLevelDeclaration(cockpitCss, '.agent-task-progress', 'accent-color')).toBe(
      'var(--color-mint-primary)',
    );
    expect(finalTopLevelDeclaration(cockpitCss, '.memory-health-meter span', 'background')).toBe(
      'var(--color-mint-primary)',
    );
  });

  it('double-encodes graph relationships with opaque contrasting colors, lines, and shapes', () => {
    const white = readHexToken(tokensCss, 'color-surface');
    const canvas = readHexToken(tokensCss, 'color-canvas');
    const glass = mixSrgb(white, 0.64, canvas);
    const relationColors = ['#087a44', '#146b5c', '#3b7655', '#596f4d'];
    const dashPatterns: string[] = [];
    const markerShapes: string[] = [];

    expect(finalTopLevelDeclaration(cockpitCss, '.character-graph__edge', 'opacity')).toBeUndefined();

    for (let index = 0; index < 4; index += 1) {
      const token = `color-relation-${index + 1}`;
      const color = readHexToken(tokensCss, token);
      const edgeSelector = `.character-graph__edge--${index}`;
      const markerSelector = `.character-graph__legend-item--${index} > span`;

      expect(color).toBe(relationColors[index]);
      expect(contrastRatio(color, white)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(color, glass)).toBeGreaterThanOrEqual(3);
      expect(finalTopLevelDeclaration(cockpitCss, edgeSelector, 'stroke')).toBe(`var(--${token})`);
      expect(finalTopLevelDeclaration(cockpitCss, markerSelector, 'background')).toBe(`var(--${token})`);

      dashPatterns.push(finalTopLevelDeclaration(cockpitCss, edgeSelector, 'stroke-dasharray') ?? '');
      markerShapes.push(finalTopLevelDeclaration(cockpitCss, markerSelector, 'border-radius') ?? '');
    }

    expect(dashPatterns).not.toContain('');
    expect(dashPatterns).toContain('none');
    expect(new Set(dashPatterns).size).toBe(4);
    expect(markerShapes).not.toContain('');
    expect(new Set(markerShapes).size).toBe(4);
  });

  it('keeps subtle text and focus indicators above their WCAG contrast thresholds', () => {
    const white = readHexToken(tokensCss, 'color-surface');
    const canvas = readHexToken(tokensCss, 'color-canvas');
    const mintSoft = readHexToken(tokensCss, 'color-mint-soft');
    const subtle = readHexToken(tokensCss, 'color-text-subtle');
    const focusRing = readHexToken(tokensCss, 'color-focus-ring');
    const activeBackground = mixSrgb(mintSoft, 0.78, white);

    expect(contrastRatio(subtle, white)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(subtle, canvas)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(subtle, activeBackground)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(focusRing, white)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(focusRing, canvas)).toBeGreaterThanOrEqual(3);
    expect(globalCss).toMatch(/:focus-visible\s*\{[^}]*outline:\s*3px\s+solid\s+var\(--color-focus-ring\);/s);
    expect(cockpitCss).not.toContain('var(--color-text-muted)');
  });

  it('uses an opaque focus ring for the actual search focus indicator', () => {
    expect(finalTopLevelDeclaration(cockpitCss, '.workspace-search:focus-within', 'border-color')).toBe(
      'var(--color-focus-ring)',
    );
    expect(finalTopLevelDeclaration(cockpitCss, '.workspace-search:focus-within', 'outline')).toBe(
      '3px solid var(--color-focus-ring)',
    );
    expect(finalTopLevelDeclaration(cockpitCss, '.workspace-search:focus-within', 'outline-offset')).toBe('2px');
    expect(finalTopLevelDeclaration(cockpitCss, '.workspace-search:focus-within', 'box-shadow')).toBeUndefined();
    expect(topLevelRuleBodiesForSelector(cockpitCss, '.workspace-search:focus-within').join('\n')).not.toMatch(
      /color-mix|rgba\(|hsla\(|opacity\s*:/,
    );
  });

  it('documents legacy color aliases as migration-only before their declarations', () => {
    const migrationNoteIndex = tokensCss.search(/\/\*[^*]*migration[^*]*remove[^*]*\*\//i);

    expect(migrationNoteIndex).toBeGreaterThan(-1);
    expect(migrationNoteIndex).toBeLessThan(tokensCss.indexOf('--color-coral:'));
  });

  it('preserves the contracted white-mint logo asset', () => {
    const stops = Array.from(logoSvg.matchAll(/<stop\b([^>]*)\/>/g), ([, attributes]) =>
      readSvgAttributes(attributes),
    );
    const rect = readSvgAttributes(logoSvg.match(/<rect\b([^>]*)\/>/)?.[1] ?? '');
    const circle = readSvgAttributes(logoSvg.match(/<circle\b([^>]*)\/>/)?.[1] ?? '');
    const texts = Array.from(logoSvg.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g), ([, attributes, content]) => ({
      ...readSvgAttributes(attributes),
      content,
    }));

    expect(stops).toEqual([
      { 'stop-color': '#0AA85B' },
      { offset: '.58', 'stop-color': '#6FDDB1' },
      { offset: '1', 'stop-color': '#C7F2DE' },
    ]);
    expect(rect).toMatchObject({ fill: '#F7FBF9', stroke: '#CFE8DD' });
    expect(circle).toMatchObject({ fill: '#F7FBF9' });
    expect(texts).toEqual([
      expect.objectContaining({ content: 'NOVELORA', 'font-family': 'Inter,Arial,sans-serif', fill: '#14261F' }),
      expect.objectContaining({ content: 'AI WRITING STUDIO', 'font-family': 'Inter,Arial,sans-serif', fill: '#0AA85B' }),
    ]);
    expect(logoSvg).not.toMatch(/#ff6b57|#3a86ff|#8f67ff|Georgia|Times New Roman/i);
    expect(logoSvg).not.toMatch(/(?:^|[,\s"])serif(?:[,\s"]|$)/i);
  });

  it('sandwiches structural frames between the base artwork and midground energy', () => {
    const stageRule = cockpitCss.match(/(?:^|})\s*\.cockpit-visual-stage\s*\{([^}]*)\}/s)?.[1] ?? '';
    const sharedLayerRule = cockpitCss.match(/\.cockpit-visual-stage__background,\s*\.cockpit-visual-stage__midground,\s*\.cockpit-visual-stage__foreground\s*\{([^}]*)\}/s)?.[1] ?? '';
    const backgroundRule = cockpitCss.match(/(?:^|})\s*\.cockpit-visual-stage__background\s*\{([^}]*)\}/s)?.[1] ?? '';
    const midgroundRule = cockpitCss.match(/(?:^|})\s*\.cockpit-visual-stage__midground\s*\{([^}]*)\}/s)?.[1] ?? '';
    const foregroundRule = cockpitCss.match(/(?:^|})\s*\.cockpit-visual-stage__foreground\s*\{([^}]*)\}/s)?.[1] ?? '';
    const drawerBackdropRule = cockpitCss.match(/(?:^|})\s*\.chapter-drawer-backdrop\s*\{([^}]*)\}/s)?.[1] ?? '';

    expect(stageRule).toMatch(/display:\s*contents;/);
    expect(stageRule).not.toMatch(/position:\s*fixed/);
    expect(stageRule).not.toMatch(/(?:z-index|isolation|transform):/);
    expect(sharedLayerRule).toMatch(/position:\s*fixed;/);
    expect(sharedLayerRule).toMatch(/inset:\s*0;/);
    expect(sharedLayerRule).toMatch(/pointer-events:\s*none;/);
    expect(sharedLayerRule).toMatch(/overflow:\s*hidden;/);
    expect(backgroundRule).toMatch(/z-index:\s*0;/);
    expect(midgroundRule).toMatch(/z-index:\s*2;/);
    for (const selector of ['.cockpit-sidebar', '.cockpit-workspace', '.cockpit-right-panel']) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'z-index')).toBeUndefined();
    }
    expect(foregroundRule).toMatch(/z-index:\s*4;/);
    expect(drawerBackdropRule).toMatch(/z-index:\s*10;/);
  });

  it('aligns the multiply-blended midground pass with the base artwork', () => {
    for (const selector of [
      '.cockpit-visual-stage__book-background',
      '.cockpit-visual-stage__book-midground',
    ]) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'inset')).toBe('0');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'width')).toBe('100%');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'height')).toBe('100%');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'object-fit')).toBe('cover');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'object-position')).toBe('left bottom');
    }
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-visual-stage__book-midground', 'mix-blend-mode')).toBe(
      'multiply',
    );
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-visual-stage__book-midground', 'opacity')).toBe(
      'var(--book-origin-midground-opacity)',
    );
    expect(tokensCss).toMatch(/--book-origin-midground-opacity:\s*0\.\d+;/);
  });

  it('does not rebuild the approved book or energy artwork with legacy decorative layers', () => {
    for (const selector of [
      '.cockpit-visual-stage__ambient',
      '.cockpit-visual-stage__wash',
      '.cockpit-visual-stage__filaments',
      '.cockpit-visual-stage__flow',
      '.cockpit-visual-stage__book',
      '.cockpit-visual-stage__book-layer',
      '.cockpit-visual-stage__foreground::before',
    ]) {
      expect(topLevelRuleBodiesForSelector(cockpitCss, selector)).toHaveLength(0);
    }
  });

  it('anchors the book-origin background and independent mascot at the lower left', () => {
    const mascotRule = topLevelRuleBodiesForSelector(cockpitCss, '.cockpit-visual-stage__mascot').at(-1) ?? '';

    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-visual-stage__book-background', 'inset')).toBe('0');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-visual-stage__book-background', 'width')).toBe('100%');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-visual-stage__book-background', 'height')).toBe('100%');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-visual-stage__book-background', 'object-fit')).toBe('cover');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-visual-stage__book-background', 'object-position')).toBe(
      'left bottom',
    );
    expect(mascotRule).toMatch(/display:\s*block;/);
    expect(mascotRule).toMatch(/left:\s*[^;]+;/);
    expect(mascotRule).toMatch(/right:\s*auto;/);
    expect(mascotRule).toMatch(/bottom:\s*[^;]+;/);
    expect(mascotRule).not.toMatch(/right:\s*(?:-?\d|clamp|var)/);
  });

  it('crops the shared 3D Nova artwork inside a dedicated portrait frame', () => {
    const portraitRule = topLevelRuleBodiesForSelector(cockpitCss, '.nova-lead-card__portrait').at(-1) ?? '';
    const portraitImageRule = topLevelRuleBodiesForSelector(cockpitCss, '.nova-lead-card__portrait img').at(-1) ?? '';

    expect(portraitRule).toMatch(/overflow:\s*hidden;/);
    expect(portraitRule).toMatch(/align-self:\s*(?:start|flex-start);/);
    expect(portraitRule).toMatch(/border:\s*1px solid var\(--surface-border-whisper\);/);
    expect(portraitImageRule).toMatch(/max-width:\s*none;/);
    expect(portraitImageRule).toMatch(/object-fit:\s*contain;/);
  });

  it('keeps columns transparent while structural frames sit beneath the midground pass', () => {
    const workspaceGlassSelectors = [
      '.structure-map',
      '.chapter-swimlane',
      '.inspiration-vault',
      '.character-graph',
      '.clue-attribution-flow',
    ];
    const rightPanelSurfaceSelectors = [
      '.nova-lead-card',
      '.focus-mode-toggle',
    ];
    const innerCardSelectors = [
      '.act-card',
      '.chapter-card',
      '.chapter-add-card',
      '.inspiration-card',
      '.clue-flow-card',
      '.character-graph__node',
      '.project-mini-card',
      '.writing-streak',
    ];

    expect(globalCss).not.toContain('bright_cockpit_background.png');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-shell', 'background')).toBe('transparent');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-workspace', 'background')).toBe('transparent');
    for (const selector of ['.cockpit-sidebar', '.cockpit-topbar', '.cockpit-right-panel']) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'background')).toBe('transparent');
      const blurRules = contextualStyleRules(cockpitCss).filter(
        (rule) => rule.selectors.includes(selector) && declaresBackdropFilter(rule.body),
      );
      expect(blurRules).toEqual([]);
    }

    for (const selector of rightPanelSurfaceSelectors) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'border')).toBe(
        '1px solid var(--surface-border-whisper)',
      );
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'border-radius')).toBe('var(--radius-panel)');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'background')).toBe('var(--surface-inner-card)');
    }

    for (const selector of workspaceGlassSelectors) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'background')).toBe(
        'var(--surface-structural-frame)',
      );
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'box-shadow')).toBe('none');
      const blurRules = contextualStyleRules(cockpitCss).filter(
        (rule) => rule.selectors.includes(selector) && declaresBackdropFilter(rule.body),
      );
      expect(blurRules).toEqual([]);
    }

    for (const selector of rightPanelSurfaceSelectors) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'box-shadow')).toBe('var(--shadow-inner-card)');
      const blurRules = contextualStyleRules(cockpitCss).filter(
        (rule) => rule.selectors.includes(selector) && declaresBackdropFilter(rule.body),
      );
      expect(blurRules).toEqual([]);
    }

    expect(finalTopLevelDeclaration(cockpitCss, '.agent-panel__section', 'border')).toBe('0');
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-panel__section', 'border-top')).toBe(
      '1px solid color-mix(in srgb, var(--color-line) 72%, transparent)',
    );
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-panel__section', 'background')).toBe('transparent');
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-panel__section', 'box-shadow')).toBe('none');

    for (const selector of innerCardSelectors) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'border')).toBe(
        '1px solid var(--surface-inner-border)',
      );
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'background')).toBe('var(--surface-inner-card)');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'box-shadow')).toBe('var(--shadow-inner-card)');
    }
    expect(finalTopLevelDeclaration(cockpitCss, '.inspiration-card', 'border-radius')).toBe(
      'var(--radius-card)',
    );

    const workspaceRules = contextualStyleRules(cockpitCss).filter((rule) => rule.selectors.includes('.cockpit-workspace'));
    expect(workspaceRules).not.toHaveLength(0);
    for (const workspaceRule of workspaceRules) {
      expect(declaresBackdropFilter(workspaceRule.body)).toBe(false);
    }
    expect(tokensCss).not.toMatch(/--surface-glass-soft:/);
    expect(cockpitCss).not.toContain('var(--surface-glass-soft)');
  });

  it('raises only functional content above the midground artwork', () => {
    for (const selector of [
      '.project-sidebar-content',
      '.workspace-topbar-content',
      '.agent-panel',
      '.workspace-section-heading',
      '.structure-map__scroll',
      '.chapter-swimlane__scroll',
      '.inspiration-vault__grid',
      '.character-graph__viewport',
      '.character-graph__legend',
      '.clue-attribution-flow__list',
    ]) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'position')).toBe('relative');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'z-index')).toBe('3');
    }
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-selection-actions', 'position')).toBe('absolute');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-selection-actions', 'z-index')).toBe('3');
  });

  it('dissolves the topbar frame into the native scene', () => {
    const effectiveBorderBottom = finalEffectiveBorderBottom(cockpitCss, '.cockpit-topbar');
    const background = finalTopLevelDeclaration(cockpitCss, '.cockpit-topbar', 'background');

    expect(isAbsentBorder(effectiveBorderBottom)).toBe(true);
    expect(background).toBe('transparent');
  });

  it('does not turn the navigation column into a separate visual layer', () => {
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-sidebar', 'border-right')).toBe('0');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-sidebar', 'background')).toBe('transparent');
    expect(topLevelRuleBodiesForSelector(cockpitCss, '.cockpit-sidebar::after')).toHaveLength(0);
  });

  it('uses faint structural frames that the midground artwork can mask', () => {
    const borderAlpha = readColorAlphaToken(tokensCss, 'surface-border-whisper');
    const frameAlpha = readColorAlphaToken(tokensCss, 'surface-structural-frame');

    expect(borderAlpha).toBeDefined();
    if (borderAlpha !== undefined) expect(borderAlpha).toBeLessThan(0.5);
    expect(frameAlpha).toBeDefined();
    if (frameAlpha !== undefined) {
      expect(frameAlpha).toBeGreaterThanOrEqual(0.2);
      expect(frameAlpha).toBeLessThanOrEqual(0.4);
    }

    for (const selector of [
      '.structure-map',
      '.chapter-swimlane',
      '.inspiration-vault',
      '.character-graph',
      '.clue-attribution-flow',
    ]) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'border')).toContain(
        'var(--surface-border-whisper)',
      );
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'background')).toBe(
        'var(--surface-structural-frame)',
      );
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'border-radius')).toBe('var(--radius-panel)');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'box-shadow')).toBe('none');
    }
  });

  it('defines near-white content islands above transparent structural space', () => {
    const whisperBorderAlpha = readColorAlphaToken(tokensCss, 'surface-border-whisper');
    const innerBorderAlpha = readColorAlphaToken(tokensCss, 'surface-inner-border');
    const innerSurfaceAlpha = readColorAlphaToken(tokensCss, 'surface-inner-card');

    expect(innerBorderAlpha).toBeDefined();
    expect(innerSurfaceAlpha).toBeDefined();
    if (whisperBorderAlpha !== undefined && innerBorderAlpha !== undefined) {
      expect(innerBorderAlpha).toBeGreaterThan(whisperBorderAlpha);
      expect(innerBorderAlpha).toBeLessThan(0.25);
    }
    expect(innerSurfaceAlpha).toBe(0.96);
    expect(tokensCss).toMatch(/--shadow-inner-card:\s*[^;]+;/);
  });

  it('lets the assistant and sidebar project surfaces dissolve into the visual stage', () => {
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-right-panel', 'border-left')).toBe('0');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-right-panel', 'background')).toBe('transparent');

    for (const selector of ['.project-mini-card', '.writing-streak', '.nova-lead-card', '.focus-mode-toggle']) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'border-radius')).toBe('var(--radius-panel)');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'background')).toBe('var(--surface-inner-card)');
    }
  });

  it('keeps compact surface rules free of adjacent and repeated selector duplication', () => {
    const topLevelRules = contextualStyleRules(cockpitCss).filter((rule) => rule.atRules.length === 0);
    const standaloneSidebarRules = topLevelRules.filter(
      (rule) => rule.selectors.length === 1 && rule.selectors[0] === '.cockpit-sidebar',
    );
    const chapterButtonGeometryRule = topLevelRules.find((rule) =>
      rule.body.includes('padding: 8px 11px'),
    );

    expect(standaloneSidebarRules).toHaveLength(1);
    expect(chapterButtonGeometryRule?.selectors).toEqual(['.chapter-details-button']);
  });

  it('keeps wide knowledge surfaces on the same maskable structural frame', () => {
    const wideDesktopCss = exactAtRuleBody(cockpitCss, '@media (min-width: 1280px)');

    for (const selector of ['.inspiration-vault', '.character-graph', '.clue-attribution-flow']) {
      const background = finalTopLevelDeclaration(wideDesktopCss, selector, 'background');
      expect(background).toBe('var(--surface-structural-frame)');
    }
  });

  it('uses the approved artwork as a restrained background rather than a CSS recreation', () => {
    const backgroundOpacity = readNumberToken(tokensCss, 'book-origin-background-opacity');
    const backgroundFilter = finalTopLevelDeclaration(
      cockpitCss,
      '.cockpit-visual-stage__book-background',
      'filter',
    );

    expect(backgroundOpacity).toBeDefined();
    if (backgroundOpacity !== undefined) {
      expect(backgroundOpacity).toBeGreaterThanOrEqual(0.72);
      expect(backgroundOpacity).toBeLessThanOrEqual(1);
    }
    expect(readFilterSaturation(backgroundFilter)).toBeLessThanOrEqual(1.05);
    expect(tokensCss).not.toMatch(/--visual-stage-flow-opacity:|--visual-stage-book-width:/);
  });

  it('uses compact, determinate agent-console geometry', () => {
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-panel', 'gap')).toBe('10px');
    expect(finalTopLevelDeclaration(cockpitCss, '.nova-lead-card', 'padding')).toBe('10px');
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-panel__section', 'padding')).toBe('10px 2px 0');
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-panel__heading', 'margin-bottom')).toBe('8px');
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-task-row', 'padding')).toBe('7px 0');
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-status-chip', 'padding')).toBe('2px 5px');
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-task-progress', 'height')).toBe('3px');
    expect(finalTopLevelDeclaration(cockpitCss, '.agent-task-progress', 'appearance')).toBe('none');
  });

  it('defines stable visual-stage sizing and motion tokens', () => {
    expect(tokensCss).toMatch(/--book-origin-background-opacity:\s*0\.\d+;/);
    expect(tokensCss).toMatch(/--book-origin-midground-opacity:\s*0\.\d+;/);
    expect(tokensCss).toMatch(/--book-origin-mascot-width:\s*clamp\(300px,\s*24vw,\s*390px\);/);
    expect(tokensCss).toMatch(/--book-origin-drift:\s*24s\s+ease-in-out\s+infinite\s+alternate;/);
    expect(tokensCss).toMatch(/--book-origin-idle:\s*6s\s+ease-in-out\s+infinite\s+alternate;/);
  });

  it('creates progressive desktop setbacks that preserve the lower-left book scene', () => {
    const wideDesktopCss = exactAtRuleBody(cockpitCss, '@media (min-width: 1280px)');
    const compactDesktopCss = exactAtRuleBody(cockpitCss, '@media (max-width: 1279px)');

    expect(tokensCss).toMatch(
      /--book-origin-chapter-inset:\s*clamp\(48px,\s*4vw,\s*64px\);/,
    );
    expect(tokensCss).toMatch(
      /--book-origin-knowledge-inset:\s*clamp\(96px,\s*7vw,\s*112px\);/,
    );
    expect(
      finalTopLevelDeclaration(wideDesktopCss, '.chapter-workspace-stage', 'margin-inline-start'),
    ).toBe('var(--book-origin-chapter-inset)');
    expect(
      finalTopLevelDeclaration(wideDesktopCss, '.knowledge-workspace-grid', 'margin-inline-start'),
    ).toBe('var(--book-origin-knowledge-inset)');
    expect(
      finalTopLevelDeclaration(compactDesktopCss, '.chapter-workspace-stage', 'margin-inline-start'),
    ).toBe('0');
    expect(
      finalTopLevelDeclaration(compactDesktopCss, '.knowledge-workspace-grid', 'margin-inline-start'),
    ).toBe('0');
  });

  it('matches the reference density with a compact wide chapter lane and expanded scenic sidebar', () => {
    const wideDesktopCss = exactAtRuleBody(cockpitCss, '@media (min-width: 1280px)');
    const referenceDesktopCss =
      topLevelBlocks(cockpitCss).find((block) => block.prelude === '@media (min-width: 1441px)')?.body ?? '';

    expect(
      finalTopLevelDeclaration(referenceDesktopCss, '.cockpit-shell', '--cockpit-sidebar-width'),
    ).toBe('272px');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.chapter-swimlane', 'height')).toBe('140px');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.chapter-card', 'width')).toBe('168px');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.chapter-card', 'height')).toBe('82px');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.chapter-card', 'flex')).toBe('0 0 168px');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.chapter-card__summary', 'display')).toBe('none');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.chapter-card__footer', 'display')).toBe('none');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.chapter-add-card', 'width')).toBe('94px');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.chapter-add-card', 'height')).toBe('82px');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.chapter-chain-link', 'top')).toBe('41px');
  });

  it('removes the obsolete outer-glass token and keeps content islands near-white', () => {
    expect(tokensCss).not.toMatch(/--surface-glass-soft:/);
    expect(readColorAlphaToken(tokensCss, 'surface-inner-card')).toBe(0.96);
  });

  it('defines the compact cockpit geometry used by the first viewport', () => {
    expect(tokensCss).toMatch(/--cockpit-sidebar-width:\s*232px;/);
    expect(tokensCss).toMatch(/--cockpit-assistant-width:\s*296px;/);
    expect(tokensCss).toMatch(/--cockpit-topbar-height:\s*76px;/);
    expect(tokensCss).toMatch(/--cockpit-section-gap:\s*14px;/);
    expect(tokensCss).toMatch(/--book-origin-mascot-width:\s*clamp\([^)]+\);/);
  });

  it('fits the desktop cockpit into a compact reference-aligned grid', () => {
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-shell', 'grid-template-columns')).toBe(
      'var(--cockpit-sidebar-width) minmax(0, 1fr) var(--cockpit-assistant-width)',
    );
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-topbar', 'min-height')).toBe(
      'var(--cockpit-topbar-height)',
    );
    expect(finalTopLevelDeclaration(cockpitCss, '.story-workspace', 'gap')).toBe('var(--cockpit-section-gap)');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-main', 'padding')).toBe('18px 20px 22px');
  });

  it('composes a three-column knowledge deck in the wide desktop cockpit', () => {
    const wideDesktopCss = exactAtRuleBody(cockpitCss, '@media (min-width: 1280px)');

    expect(finalTopLevelDeclaration(wideDesktopCss, '.knowledge-workspace-grid', 'grid-template-columns')).toBe(
      'repeat(3, minmax(0, 1fr))',
    );
  });

  it('overlays chapter actions without adding a separate workspace row', () => {
    const desktopChapterCss = exactAtRuleBody(cockpitCss, '@media (min-width: 901px)');

    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-workspace-stage', 'position')).toBe('relative');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-selection-actions', 'position')).toBe('absolute');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-selection-actions', 'height')).toBe('0');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-selection-actions', 'align-items')).toBe('flex-start');
    expect(
      finalTopLevelDeclaration(cockpitCss, '.chapter-selection-actions .chapter-details-button', 'min-height'),
    ).toBe('32px');
    expect(
      finalTopLevelDeclaration(desktopChapterCss, '.chapter-workspace-stage .workspace-section-heading', 'padding-right'),
    ).toBe('164px');
  });

  it('draws the wide clue lane as a locally scrollable mint trajectory', () => {
    const wideDesktopCss = exactAtRuleBody(cockpitCss, '@media (min-width: 1280px)');

    expect(finalTopLevelDeclaration(wideDesktopCss, '.clue-attribution-flow__list', 'overflow-y')).toBe('auto');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.clue-attribution-flow__list', 'overflow-x')).toBe('hidden');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.clue-flow-card__stages', 'position')).toBe('relative');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.clue-flow-card__stages', 'height')).toBe('146px');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.clue-flow-card__stages', 'overflow-x')).toBe('auto');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.clue-flow-card__stages', 'overflow-y')).toBe('hidden');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.clue-flow-card__stages::before', 'border-top')).toBe(
      '1px solid var(--color-mint-support)',
    );
  });

  it('chains compact vertical scrollports back to the page at their edges', () => {
    const wideDesktopCss = exactAtRuleBody(cockpitCss, '@media (min-width: 1280px)');

    for (const selector of [
      '.inspiration-vault__grid',
      '.character-graph__legend',
      '.clue-attribution-flow__list',
    ]) {
      expect(finalTopLevelDeclaration(wideDesktopCss, selector, 'overscroll-behavior-block')).toBe('auto');
    }
  });

  it('keeps bottom-deck focus rings inset inside their fixed glass surfaces', () => {
    for (const selector of [
      '.inspiration-vault__grid:focus-visible',
      '.character-graph__viewport:focus-visible',
      '.character-graph__legend:focus-visible',
      '.clue-attribution-flow__list:focus-visible',
      '.clue-flow-card__stages:focus-visible',
    ]) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'outline')).toBe(
        '3px solid var(--color-focus-ring)',
      );
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'outline-offset')).toBe('-3px');
    }
  });

  it('keeps every character relationship reachable inside the compact legend', () => {
    const wideDesktopCss = exactAtRuleBody(cockpitCss, '@media (min-width: 1280px)');

    expect(finalTopLevelDeclaration(wideDesktopCss, '.character-graph__legend', 'max-height')).toBe('42px');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.character-graph__legend', 'overflow-y')).toBe('auto');
    expect(finalTopLevelDeclaration(wideDesktopCss, '.character-graph__legend', 'scrollbar-width')).toBe('thin');
  });

  it('keeps the approved book background pinned to the full visual canvas', () => {
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-visual-stage__book-background', 'inset')).toBe('0');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-visual-stage__book-background', 'width')).toBe('100%');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-visual-stage__book-background', 'height')).toBe('100%');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-visual-stage__book-background', 'object-fit')).toBe('cover');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-visual-stage__book-background', 'object-position')).toBe(
      'left bottom',
    );
  });

  it('keeps the responsive grid independent from the full-canvas background artwork', () => {
    const fluidDesktopCss = exactAtRuleBody(cockpitCss, '@media (max-width: 1440px)');
    const mediumDesktopCss = exactAtRuleBody(cockpitCss, '@media (max-width: 1180px)');

    expect(
      finalTopLevelDeclaration(cockpitCss, '.cockpit-shell', '--cockpit-stage-safe-width'),
    ).toBe('var(--cockpit-sidebar-width)');
    expect(
      finalTopLevelDeclaration(fluidDesktopCss, '.cockpit-shell', '--cockpit-stage-safe-width'),
    ).toBe('clamp(184px, calc(10vw + 88px), var(--cockpit-sidebar-width))');
    expect(
      finalTopLevelDeclaration(
        fluidDesktopCss,
        '.cockpit-shell',
        'grid-template-columns',
      )?.replace(/\s+/g, ' '),
    ).toBe(
      'var(--cockpit-stage-safe-width) minmax(0, 1fr) clamp(248px, calc(10vw + 152px), var(--cockpit-assistant-width))',
    );
    expect(finalTopLevelDeclaration(mediumDesktopCss, '.cockpit-visual-stage__book-background', 'display')).not.toBe(
      'none',
    );
    expect(finalTopLevelDeclaration(mediumDesktopCss, '.cockpit-visual-stage__mascot', 'width')).toContain(
      'var(--book-origin-mascot-width)',
    );
  });

  it('contains wide clue stages inside their local horizontal scrollport', () => {
    for (const selector of ['.clue-attribution-flow', '.clue-attribution-flow__list', '.clue-flow-card']) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'min-width')).toBe('0');
    }

    expect(finalTopLevelDeclaration(cockpitCss, '.clue-flow-card__stages', 'min-width')).toBe('0');
    expect(finalTopLevelDeclaration(cockpitCss, '.clue-flow-card__stages', 'width')).toBe('100%');
    expect(finalTopLevelDeclaration(cockpitCss, '.clue-flow-card__stages', 'overflow-x')).toBe('auto');
    expect(finalTopLevelDeclaration(cockpitCss, '.clue-flow-card__stages', 'grid-template-columns')).toBe(
      'repeat(4, minmax(150px, 1fr))',
    );
  });

  it('reserves visible focus-ring clearance inside the chapter lane', () => {
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-swimlane__scroll', 'padding')).toBe('8px 6px');
  });

  it('contains a compact chapter chain inside its local horizontal scrollport', () => {
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-swimlane', 'overflow')).toBe('hidden');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-swimlane__scroll', 'max-width')).toBe('100%');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-swimlane__scroll', 'overflow-x')).toBe('auto');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-swimlane__rail', 'position')).toBe('relative');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-swimlane__rail', 'min-width')).toBe('max-content');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-swimlane__rail', 'align-items')).toBe('flex-start');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-chain-link', 'position')).toBe('absolute');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-chain-link', 'pointer-events')).toBe('none');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-chain-link', 'left')).toBe('107px');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-chain-link', 'right')).toBe('69px');
    expect(
      finalTopLevelDeclaration(cockpitCss, '.chapter-swimlane__rail.is-empty .chapter-chain-link', 'display'),
    ).toBe('none');

    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card', 'width')).toBe('198px');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card', 'height')).toBe('158px');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card', 'flex')).toBe('0 0 198px');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-add-card', 'width')).toBe('122px');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-add-card', 'height')).toBe('158px');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-add-card', 'flex')).toBe('0 0 122px');

    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card strong', 'overflow')).toBe('hidden');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card strong', '-webkit-line-clamp')).toBe('2');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card__beat', 'overflow')).toBe('hidden');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card__summary', '-webkit-line-clamp')).toBe('1');

    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card', 'grid-template-rows')).toBe(
      '22px 44px 16px 18px 25px',
    );
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card', 'align-content')).toBe('center');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card', 'gap')).toBe('3px 8px');

    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card strong', 'font-size')).toBe('17px');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card strong', 'line-height')).toBe('22px');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card strong', 'block-size')).toBe('44px');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card strong', 'max-block-size')).toBe('44px');

    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card__beat', 'line-height')).toBe('14px');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card__beat', 'block-size')).toBe('22px');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card__beat', 'max-block-size')).toBe('22px');

    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card__summary', 'line-height')).toBe('16px');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card__summary', 'block-size')).toBe('16px');
    expect(finalTopLevelDeclaration(cockpitCss, '.chapter-card__summary', 'max-block-size')).toBe('16px');
  });

  it('reserves focus-ring clearance around the scrollable structure map', () => {
    expect(finalTopLevelDeclaration(cockpitCss, '.structure-map__scroll', 'padding')).toBe('8px 6px 6px');
    expect(finalTopLevelDeclaration(cockpitCss, '.structure-map__scroll', 'overflow-x')).toBe('auto');
  });

  it('uses one dynamic, gapless column geometry for structure nodes, markers, and cards', () => {
    for (const selector of ['.structure-map__markers', '.structure-map__cards']) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'grid-template-columns')).toBe(
        'repeat(var(--structure-act-count), minmax(0, 1fr))',
      );
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'gap')).toBe('0');
    }
  });

  it('scales desktop side columns continuously through compact breakpoints', () => {
    const fluidDesktopCss = exactAtRuleBody(cockpitCss, '@media (max-width: 1440px)');
    const compactDesktopCss = exactAtRuleBody(cockpitCss, '@media (max-width: 1180px)');

    expect(
      finalTopLevelDeclaration(fluidDesktopCss, '.cockpit-shell', 'grid-template-columns')?.replace(/\s+/g, ' '),
    ).toBe(
      'var(--cockpit-stage-safe-width) minmax(0, 1fr) clamp(248px, calc(10vw + 152px), var(--cockpit-assistant-width))',
    );
    expect(finalTopLevelDeclaration(compactDesktopCss, '.cockpit-shell', 'grid-template-columns')).toBeUndefined();
  });

  it('uses the plain white Echo page foundation without a texture layer', () => {
    expect(globalCss).not.toContain('paper_grain_overlay.png');
    expect(globalCss).toMatch(/body\s*\{[^}]*isolation:\s*isolate;/s);
    expect(finalTopLevelDeclaration(globalCss, 'body', 'background')).toBe('var(--echo-page)');
    expect(globalCss).toMatch(/#root\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*0;/s);
    expect(globalCss).not.toContain('body::after');
  });

  it('keeps page roots intrinsically overflow-free without clipping and honors reduced motion', () => {
    const fluidDesktopCss = exactAtRuleBody(cockpitCss, '@media (max-width: 1440px)');
    const wideDesktopCss = exactAtRuleBody(cockpitCss, '@media (min-width: 1280px)');
    const compactDesktopCss = exactAtRuleBody(cockpitCss, '@media (max-width: 1279px)');
    const mediumDesktopCss = exactAtRuleBody(cockpitCss, '@media (max-width: 1180px)');
    const mobileCss = exactAtRuleBody(cockpitCss, '@media (max-width: 900px)');

    const documentRootRule = globalCss.match(/html,\s*body,\s*#root\s*\{([^}]*)\}/s)?.[1];
    expect(documentRootRule).toMatch(/overflow-x:\s*visible;/);
    expect(documentRootRule).not.toMatch(/overflow-x:\s*hidden;/);
    expect(globalCss).not.toMatch(/@import\s+['"]\.\/cockpit\.css['"]/);
    const legacyRootOverflowValues = contextualStyleRules(cockpitCss)
      .filter((rule) => rule.selectors.includes('.cockpit-scroll'))
      .flatMap((rule) => (
        Array.from(
          rule.body.matchAll(/(?:^|;)\s*overflow-x\s*:\s*([^;]+);/g),
          ([, value]) => value.trim(),
        )
      ));
    expect(legacyRootOverflowValues).not.toContain('hidden');
    expect(legacyRootOverflowValues).toEqual(['visible', 'visible', 'visible']);
    expect(finalTopLevelDeclaration(fluidDesktopCss, '.knowledge-workspace-grid', 'grid-template-columns')).toBeUndefined();
    expect(finalTopLevelDeclaration(wideDesktopCss, '.knowledge-workspace-grid', 'grid-template-columns')).toBe(
      'repeat(3, minmax(0, 1fr))',
    );
    expect(finalTopLevelDeclaration(compactDesktopCss, '.knowledge-workspace-grid', 'grid-template-columns')).toBe(
      'repeat(2, minmax(0, 1fr))',
    );
    expect(cockpitCss).not.toMatch(/min-width:\s*1176px;/);
    expect(cockpitCss).toMatch(/@media\s*\(max-width:\s*900px\)\s*\{[\s\S]*?\.cockpit-shell\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[\s\S]*?\.cockpit-sidebar,\s*\.cockpit-right-panel,\s*\.project-sidebar-content\s*\{[^}]*min-height:\s*auto;/s);
    expect(cockpitCss).toMatch(/@media\s*\(max-width:\s*480px\)\s*\{[\s\S]*?\.project-navigation\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s);
    expect(finalTopLevelDeclaration(mobileCss, '.cockpit-visual-stage__book-background', 'display')).not.toBe('none');
    expect(finalTopLevelDeclaration(mobileCss, '.cockpit-visual-stage__book-midground', 'display')).toBe('none');
    expect(finalTopLevelDeclaration(mobileCss, '.cockpit-visual-stage__mascot', 'display')).toBe('none');
    expect(finalTopLevelDeclaration(mediumDesktopCss, '.cockpit-visual-stage__mascot', 'display')).not.toBe('none');
    expect(cockpitCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?transition-duration:\s*0\.01ms\s*!important;/s);
    expect(cockpitCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.cockpit-visual-stage__book-background,\s*\.cockpit-visual-stage__book-midground,\s*\.cockpit-visual-stage__mascot\s*\{[^}]*animation:\s*none;/s);
  });

  it('uses the accessible focus-ring token for custom cockpit focus outlines', () => {
    const customFocusOutline = cockpitCss.match(
      /\.focus-mode-toggle:focus-visible,\s*\.chapter-details-button:focus-visible,\s*\.chapter-detail-drawer__close:focus-visible\s*\{([^}]*)\}/s,
    )?.[1];

    expect(customFocusOutline).toMatch(/outline:\s*3px\s+solid\s+var\(--color-focus-ring\);/);
    expect(customFocusOutline).not.toMatch(/color-mix|rgba\(|hsla\(|opacity\s*:/);
  });
});
