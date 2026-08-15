import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const tokensCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');
const globalCss = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');
const echoCss = readFileSync(resolve(process.cwd(), 'src/styles/echo.css'), 'utf8');
const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

const stripCssComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '');

const normalizeSelectorGroup = (selector: string) =>
  selector
    .split(',')
    .map((part) => part.trim())
    .join(',');

const ruleBody = (source: string, selector: string) => {
  const css = stripCssComments(source);
  const expectedSelector = normalizeSelectorGroup(selector);
  let cursor = 0;

  while (cursor < css.length) {
    const openingBrace = css.indexOf('{', cursor);
    if (openingBrace < 0) return '';

    const preludeBoundary = Math.max(css.lastIndexOf('}', openingBrace - 1), css.lastIndexOf(';', openingBrace - 1));
    const prelude = css.slice(preludeBoundary + 1, openingBrace).trim();
    let depth = 1;
    let quote = '';
    let closingBrace = openingBrace + 1;

    for (; closingBrace < css.length && depth > 0; closingBrace += 1) {
      const character = css[closingBrace];
      if (quote) {
        if (character === '\\') closingBrace += 1;
        else if (character === quote) quote = '';
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '{') {
        depth += 1;
      } else if (character === '}') {
        depth -= 1;
      }
    }

    if (depth !== 0) return '';
    if (!prelude.startsWith('@') && normalizeSelectorGroup(prelude) === expectedSelector) {
      return css.slice(openingBrace + 1, closingBrace - 1);
    }
    cursor = closingBrace;
  }

  return '';
};

const parseAlpha = (source: string) => {
  const match = source.trim().match(/^(\d*\.?\d+)(%)?$/);
  if (!match) return undefined;
  const value = Number(match[1]);
  return match[2] ? value / 100 : value;
};

const isTranslucentWhiteFunction = (body: string) => {
  const commaParts = body.split(',').map((part) => part.trim());
  if (commaParts.length === 4 && commaParts.slice(0, 3).every((part) => part === '255')) {
    const alpha = parseAlpha(commaParts[3]);
    return alpha !== undefined && alpha < 1;
  }

  const [channelsSource, alphaSource] = body.split('/').map((part) => part.trim());
  const channels = channelsSource.split(/\s+/);
  if (channels.length !== 3 || !channels.every((channel) => channel === '255') || alphaSource === undefined) {
    return false;
  }
  const alpha = parseAlpha(alphaSource);
  return alpha !== undefined && alpha < 1;
};

const hasTranslucentWhiteMask = (source: string) => {
  const declarationValues = Array.from(
    stripCssComments(source).matchAll(/:\s*([^;{}]+);/g),
    ([, value]) => value,
  );

  return declarationValues.some((value) => {
    const hasFunctionalWhite = Array.from(value.matchAll(/rgba?\(([^)]*)\)/gi), ([, body]) => body).some(
      isTranslucentWhiteFunction,
    );
    const hasHexWhite = Array.from(value.matchAll(/#([0-9a-f]{8}|[0-9a-f]{4})\b/gi), ([, hex]) => hex).some(
      (hex) => {
        const color = hex.length === 8 ? hex.slice(0, 6) : hex.slice(0, 3);
        const alpha = hex.length === 8 ? hex.slice(6) : hex.slice(3);
        return /^f+$/i.test(color) && Number.parseInt(alpha, 16) < (alpha.length === 2 ? 255 : 15);
      },
    );
    const mixesWhiteWithTransparency = /color-mix\([^)]*(?:white|#fff(?:fff)?)[^)]*transparent[^)]*\)/i.test(value);
    return hasFunctionalWhite || hasHexWhite || mixesWhiteWithTransparency;
  });
};

interface CssStyleRule {
  declarations: string;
  selector: string;
}

const findRuleDelimiter = (source: string, start: number, end: number) => {
  let brackets = 0;
  let parentheses = 0;
  let quote = '';

  for (let index = start; index < end; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === '\\') index += 1;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '(') parentheses += 1;
    else if (character === ')') parentheses = Math.max(0, parentheses - 1);
    else if (character === '[') brackets += 1;
    else if (character === ']') brackets = Math.max(0, brackets - 1);
    else if (parentheses === 0 && brackets === 0 && (character === '{' || character === ';')) {
      return index;
    }
  }

  return -1;
};

const findClosingBrace = (source: string, openingBrace: number, end: number) => {
  let depth = 1;
  let quote = '';

  for (let index = openingBrace + 1; index < end; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === '\\') index += 1;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
};

const styleRules = (source: string) => {
  const css = stripCssComments(source);
  const rules: CssStyleRule[] = [];

  const visitBlock = (start: number, end: number) => {
    let cursor = start;

    while (cursor < end) {
      while (cursor < end && /\s/.test(css[cursor])) cursor += 1;
      const delimiter = findRuleDelimiter(css, cursor, end);
      if (delimiter < 0) return;
      if (css[delimiter] === ';') {
        cursor = delimiter + 1;
        continue;
      }

      const prelude = css.slice(cursor, delimiter).trim();
      const closingBrace = findClosingBrace(css, delimiter, end);
      if (closingBrace < 0) return;

      if (prelude.startsWith('@')) {
        visitBlock(delimiter + 1, closingBrace);
      } else if (prelude && !prelude.startsWith('@')) {
        rules.push({
          declarations: css.slice(delimiter + 1, closingBrace),
          selector: prelude,
        });
      }
      cursor = closingBrace + 1;
    }
  };

  visitBlock(0, css.length);
  return rules;
};

const splitSelectorList = (selectorList: string) => {
  const selectors: string[] = [];
  let brackets = 0;
  let parentheses = 0;
  let quote = '';
  let start = 0;

  for (let index = 0; index < selectorList.length; index += 1) {
    const character = selectorList[index];
    if (quote) {
      if (character === '\\') index += 1;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '(') parentheses += 1;
    else if (character === ')') parentheses = Math.max(0, parentheses - 1);
    else if (character === '[') brackets += 1;
    else if (character === ']') brackets = Math.max(0, brackets - 1);
    else if (character === ',' && parentheses === 0 && brackets === 0) {
      selectors.push(selectorList.slice(start, index).trim());
      start = index + 1;
    }
  }

  selectors.push(selectorList.slice(start).trim());
  return selectors.filter(Boolean);
};

const rightmostTargetCompound = (selector: string) => {
  let brackets = 0;
  let parentheses = 0;
  let quote = '';
  let start = 0;

  for (let index = 0; index < selector.length; index += 1) {
    const character = selector[index];
    if (quote) {
      if (character === '\\') index += 1;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '(') parentheses += 1;
    else if (character === ')') parentheses = Math.max(0, parentheses - 1);
    else if (character === '[') brackets += 1;
    else if (character === ']') brackets = Math.max(0, brackets - 1);
    else if (
      parentheses === 0 &&
      brackets === 0 &&
      (/\s/.test(character) || character === '>' || character === '+' || character === '~')
    ) {
      start = index + 1;
    }
  }

  return selector.slice(start).trim();
};

const topLevelClassNames = (compound: string) => {
  const classNames: string[] = [];
  let brackets = 0;
  let parentheses = 0;
  let quote = '';

  for (let index = 0; index < compound.length; index += 1) {
    const character = compound[index];
    if (quote) {
      if (character === '\\') index += 1;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '(') parentheses += 1;
    else if (character === ')') parentheses = Math.max(0, parentheses - 1);
    else if (character === '[') brackets += 1;
    else if (character === ']') brackets = Math.max(0, brackets - 1);
    else if (character === '.' && parentheses === 0 && brackets === 0) {
      const match = compound.slice(index + 1).match(/^[a-z0-9_-]+/i);
      if (match) {
        classNames.push(match[0]);
        index += match[0].length;
      }
    }
  }

  return classNames;
};

const findClosingParenthesis = (source: string, openingParenthesis: number) => {
  let depth = 1;
  let quote = '';

  for (let index = openingParenthesis + 1; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === '\\') index += 1;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '(') depth += 1;
    else if (character === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
};

const targetPreservingPseudoArguments = (compound: string) => {
  const argumentLists: string[] = [];
  let brackets = 0;
  let parentheses = 0;
  let quote = '';

  for (let index = 0; index < compound.length; index += 1) {
    const character = compound[index];
    if (quote) {
      if (character === '\\') index += 1;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '[') brackets += 1;
    else if (character === ']') brackets = Math.max(0, brackets - 1);
    else if (character === '(') parentheses += 1;
    else if (character === ')') parentheses = Math.max(0, parentheses - 1);
    else if (character === ':' && parentheses === 0 && brackets === 0) {
      const match = compound.slice(index).match(/^:(?:is|where)\(/i);
      if (!match) continue;
      const openingParenthesis = index + match[0].length - 1;
      const closingParenthesis = findClosingParenthesis(compound, openingParenthesis);
      if (closingParenthesis < 0) continue;
      argumentLists.push(compound.slice(openingParenthesis + 1, closingParenthesis));
      index = closingParenthesis;
    }
  }

  return argumentLists;
};

const targetsOccludedPanelContent = (compound: string): boolean => {
  if (
    topLevelClassNames(compound).some(
      (className) => className === 'occluded-panel' || className === 'occluded-panel__content',
    )
  ) {
    return true;
  }

  return targetPreservingPseudoArguments(compound).some((argumentList) =>
    splitSelectorList(argumentList).some((alternative) =>
      targetsOccludedPanelContent(rightmostTargetCompound(alternative)),
    ),
  );
};

const hasOwnedPseudoElement = (compound: string) => {
  let brackets = 0;
  let parentheses = 0;
  let quote = '';

  for (let index = 0; index < compound.length; index += 1) {
    const character = compound[index];
    if (quote) {
      if (character === '\\') index += 1;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '(') parentheses += 1;
    else if (character === ')') parentheses = Math.max(0, parentheses - 1);
    else if (character === '[') brackets += 1;
    else if (character === ']') brackets = Math.max(0, brackets - 1);
    else if (
      parentheses === 0 &&
      brackets === 0 &&
      /^::(?:before|after)\b/i.test(compound.slice(index))
    ) {
      return true;
    }
  }

  return false;
};

const declarationPropertyNames = (declarations: string) => {
  const properties: string[] = [];
  let parentheses = 0;
  let quote = '';
  let start = 0;

  const appendProperty = (end: number) => {
    const match = declarations.slice(start, end).match(/^\s*(-?[a-z][a-z0-9-]*)\s*:/i);
    if (match) properties.push(match[1].toLowerCase());
  };

  for (let index = 0; index < declarations.length; index += 1) {
    const character = declarations[index];
    if (quote) {
      if (character === '\\') index += 1;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '(') parentheses += 1;
    else if (character === ')') parentheses = Math.max(0, parentheses - 1);
    else if (character === ';' && parentheses === 0) {
      appendProperty(index);
      start = index + 1;
    }
  }
  appendProperty(declarations.length);
  return properties;
};

const occludedPanelContractViolations = (source: string) => {
  const forbiddenCompositingProperty = (property: string) =>
    property === 'opacity' ||
    property === 'filter' ||
    property === '-webkit-filter' ||
    property === 'backdrop-filter' ||
    property === '-webkit-backdrop-filter' ||
    property === 'clip-path' ||
    /^(?:-webkit-)?mask(?:-|$)/.test(property);
  const pseudoCoveringProperties = new Set(['background', 'background-color', 'background-image']);
  const violations: string[] = [];

  for (const rule of styleRules(source)) {
    const properties = declarationPropertyNames(rule.declarations);
    for (const selector of splitSelectorList(rule.selector)) {
      const target = rightmostTargetCompound(selector);
      if (!targetsOccludedPanelContent(target)) continue;

      const ownsPseudoElement = hasOwnedPseudoElement(target);
      for (const property of properties) {
        if (
          forbiddenCompositingProperty(property) ||
          (ownsPseudoElement && pseudoCoveringProperties.has(property))
        ) {
          violations.push(`${selector} -> ${property}`);
        }
      }
    }
  }

  return violations;
};

const expectDeclaration = (body: string, property: string, value: string) => {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\ /g, '\\s+');
  expect(body).toMatch(new RegExp(`(?:^|;)\\s*${escapedProperty}\\s*:\\s*${escapedValue}\\s*;`, 'm'));
};

const tokenHex = (name: string) => {
  const match = tokensCss.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})\\s*;`, 'i'));
  expect(match, `expected --${name} to resolve to a six-digit hex color`).not.toBeNull();
  return match?.[1] ?? '#000000';
};

const relativeLuminance = (hexColor: string) => {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hexColor.slice(offset, offset + 2), 16) / 255);
  const linearChannels = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * linearChannels[0] + 0.7152 * linearChannels[1] + 0.0722 * linearChannels[2];
};

const contrastRatio = (firstColor: string, secondColor: string) => {
  const firstLuminance = relativeLuminance(firstColor);
  const secondLuminance = relativeLuminance(secondColor);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
};

const pixelFontSize = (body: string) => {
  const match = body.match(/(?:^|;)\s*font-size\s*:\s*(\d+(?:\.\d+)?)px\s*;/m);
  expect(match, 'expected a pixel font-size declaration').not.toBeNull();
  return Number(match?.[1]);
};

const mediaBlock = (source: string, condition: string) => {
  const css = stripCssComments(source);
  const escapedCondition = condition.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const mediaPattern = new RegExp(`@media\\s*\\(\\s*${escapedCondition}\\s*\\)\\s*\\{`, 'g');
  const match = mediaPattern.exec(css);
  expect(match, `expected @media (${condition})`).not.toBeNull();
  if (!match) return '';

  const openingBrace = css.indexOf('{', match.index);
  const closingBrace = findClosingBrace(css, openingBrace, css.length);
  expect(closingBrace, `expected @media (${condition}) to close`).toBeGreaterThan(openingBrace);
  return css.slice(openingBrace + 1, closingBrace);
};

describe('Echo visual foundation', () => {
  it('does not resolve prefixed selectors or commented rules as exact selector blocks', () => {
    const fixture = `
      /* .echo-page { color: polluted; } */
      .legacy-echo-page { color: polluted; }
      .echo-sidebar-extra,
      .echo-main-stage { z-index: 99; }
    `;

    expect(ruleBody(fixture, '.echo-page')).toBe('');
    expect(ruleBody(fixture, '.echo-sidebar,\n.echo-main-stage')).toBe('');
  });

  it('defines the stable Echo design tokens', () => {
    const expectedTokens = {
      page: '#ffffff',
      surface: '#ffffff',
      'surface-soft': '#f8fffc',
      'mint-50': '#effdf8',
      'mint-100': '#dff8ef',
      'mint-300': '#7ee5c0',
      'mint-500': '#09c779',
      'mint-600': '#05ae68',
      'cyan-500': '#18cbe8',
      'blue-600': '#3458b9',
      ink: '#101613',
      muted: '#61706a',
      line: '#edf2f0',
      danger: '#ff4a4a',
      'radius-panel': '18px',
      'radius-card': '13px',
      'shadow-card': '0 12px 32px rgb(30 100 75 / 7%)',
      'shadow-action': '0 10px 24px rgb(0 190 110 / 20%)',
      'glass-border': 'rgb(255 255 255 / 65%)',
      'glass-highlight': 'inset 0 1px 0 rgb(255 255 255 / 60%)',
      'shadow-mint-sm': '0 2px 8px rgb(9 160 110 / 6%)',
      'shadow-mint-md': '0 10px 28px rgb(9 160 110 / 10%)',
      'shadow-mint-lg': '0 18px 48px rgb(9 160 110 / 14%)',
      'teal-500': '#14c2c0',
      'aqua-400': '#4fd8e8',
      'gradient-accent': 'linear-gradient(135deg, var(--echo-mint-500), var(--echo-teal-500))',
      'gradient-action': 'linear-gradient(135deg, #068051, #0b7f7a)',
    } as const;

    const reducedTransparencyTokens = ['--echo-glass-pill', '--echo-glass-panel', '--echo-glass-card'];
    const expectedNames = [
      ...Object.keys(expectedTokens).map((name) => `--echo-${name}`),
      ...reducedTransparencyTokens,
    ].sort();
    const declaredNames = Array.from(
      ruleBody(tokensCss, ':root').matchAll(/(--echo-[a-z0-9-]+)\s*:/gi),
      ([, name]) => name,
    ).sort();
    expect(declaredNames).toHaveLength(30);
    expect(declaredNames).toEqual(expectedNames);

    for (const [name, value] of Object.entries(expectedTokens)) {
      const matches = Array.from(tokensCss.matchAll(new RegExp(`--echo-${name}:\\s*([^;]+);`, 'g')));
      expect(matches, `--echo-${name}`).toHaveLength(1);
      expect(matches[0][1].trim()).toBe(value);
    }
  });

  it('defines the illustration-matched glass token system with a solid fallback', () => {
    const root = ruleBody(tokensCss, ':root');
    for (const token of [
      '--echo-glass-pill',
      '--echo-glass-panel',
      '--echo-glass-card',
      '--echo-glass-border',
      '--echo-glass-highlight',
      '--echo-shadow-mint-sm',
      '--echo-shadow-mint-md',
      '--echo-shadow-mint-lg',
      '--echo-teal-500',
      '--echo-aqua-400',
      '--echo-gradient-accent',
    ]) {
      expect(root).toContain(token);
    }
    const fallback = mediaBlock(tokensCss, 'prefers-reduced-transparency: reduce');
    expect(fallback).toContain('--echo-glass-panel');
    expect(fallback).toMatch(/--echo-glass-panel\s*:\s*var\(--echo-surface\)/);
  });

  it('uses the Echo stylesheet and a plain white page foundation', () => {
    expect(globalCss.indexOf("@import './echo.css';")).toBeGreaterThan(globalCss.indexOf("@import './tokens.css';"));
    expect(globalCss).not.toContain('body::after');
    const body = ruleBody(globalCss, 'body');
    expectDeclaration(body, 'background', 'var(--echo-page)');
    expectDeclaration(body, 'color', 'var(--echo-ink)');
  });

  it('defines the complete isolated Echo page base', () => {
    const page = ruleBody(echoCss, '.echo-page');

    expectDeclaration(page, 'position', 'relative');
    expectDeclaration(page, 'min-width', '0');
    expectDeclaration(page, 'width', '1728px');
    expectDeclaration(page, 'height', '972px');
    expectDeclaration(page, 'min-height', '972px');
    expectDeclaration(page, 'overflow', 'hidden');
    expectDeclaration(page, 'isolation', 'isolate');
    expectDeclaration(page, 'background', 'var(--echo-page)');
    expectDeclaration(page, 'color', 'var(--echo-ink)');
  });

  it('renders the hero artwork without filters, blending, or input interception', () => {
    const hero = ruleBody(echoCss, '.echo-hero-background');
    const image = ruleBody(echoCss, '.echo-hero-background__image');

    expectDeclaration(hero, 'position', 'absolute');
    expectDeclaration(hero, 'top', '0');
    expectDeclaration(hero, 'left', '168px');
    expectDeclaration(hero, 'z-index', '10');
    expectDeclaration(hero, 'right', '0');
    expectDeclaration(hero, 'height', '700px');
    expectDeclaration(hero, 'pointer-events', 'none');
    expectDeclaration(image, 'display', 'block');
    expectDeclaration(image, 'width', '100%');
    expectDeclaration(image, 'height', '100%');
    expectDeclaration(image, 'object-fit', 'cover');
    expectDeclaration(image, 'object-position', 'center top');
    expectDeclaration(image, 'opacity', '1');
    expectDeclaration(image, 'filter', 'none');
    expectDeclaration(image, 'user-select', 'none');
  });

  it('places the book on the sky-card split above the character network', () => {
    const layer = ruleBody(echoCss, '.echo-book-layer');
    const book = ruleBody(echoCss, '.echo-book-foreground');

    expectDeclaration(layer, 'position', 'absolute');
    expectDeclaration(layer, 'left', '168px');
    expectDeclaration(layer, 'right', '0');
    expectDeclaration(layer, 'top', '0');
    expectDeclaration(layer, 'z-index', '30');
    expectDeclaration(layer, 'height', '820px');
    expectDeclaration(layer, 'overflow', 'visible');
    expectDeclaration(layer, 'pointer-events', 'none');
    expectDeclaration(book, 'position', 'absolute');
    expectDeclaration(book, 'top', '492px');
    expectDeclaration(book, 'right', '272px');
    expectDeclaration(book, 'width', '430px');
    expectDeclaration(book, 'pointer-events', 'none');
  });

  it('keeps foreground content and the current cockpit above the hero artwork', () => {
    const foreground = ruleBody(echoCss, '.cockpit-sidebar,\n.cockpit-workspace');
    expectDeclaration(foreground, 'position', 'relative');
    expectDeclaration(foreground, 'z-index', '20');
    expectDeclaration(ruleBody(echoCss, '.cockpit-shell'), 'z-index', '20');
  });

  it('builds occluded panels from a liquid glass surface without compositing content', () => {
    const panel = ruleBody(echoCss, '.occluded-panel');
    const surface = ruleBody(echoCss, '.occluded-panel__surface');
    const content = ruleBody(echoCss, '.occluded-panel__content');

    expectDeclaration(panel, 'position', 'relative');
    expectDeclaration(panel, 'isolation', 'isolate');
    expectDeclaration(panel, 'min-width', '0');
    expectDeclaration(panel, 'background', 'transparent');

    expectDeclaration(surface, 'position', 'absolute');
    expectDeclaration(surface, 'inset', '0');
    expectDeclaration(surface, 'z-index', '10');
    expectDeclaration(surface, 'border', '1px solid var(--echo-glass-border)');
    expectDeclaration(surface, 'border-radius', 'var(--echo-radius-panel)');
    expectDeclaration(surface, 'background', 'var(--echo-glass-panel)');
    expectDeclaration(
      surface,
      'box-shadow',
      'var(--echo-glass-highlight), var(--echo-shadow-mint-md)',
    );
    expectDeclaration(surface, 'pointer-events', 'none');

    expectDeclaration(content, 'position', 'relative');
    expectDeclaration(content, 'z-index', '20');

    for (const body of [panel, surface, content]) {
      expect(body).not.toMatch(/(?:^|;)\s*opacity\s*:/im);
    }
    expect(content).not.toMatch(
      /(?:^|;)\s*(?:filter|(?:-webkit-)?mask(?:-[a-z-]+)?|clip-path)\s*:/im,
    );
    expect(occludedPanelContractViolations(echoCss)).toEqual([]);
  });

  it('renders panel surfaces as liquid glass over the hero art', () => {
    const surface = ruleBody(echoCss, '.occluded-panel__surface');
    expectDeclaration(surface, 'background', 'var(--echo-glass-panel)');
    expectDeclaration(surface, 'border', '1px solid var(--echo-glass-border)');
    expect(surface).toMatch(/backdrop-filter\s*:\s*blur\(18px\) saturate\(150%\)/);
    expect(surface).toContain('var(--echo-shadow-mint-md)');
    expectDeclaration(surface, 'border-radius', 'var(--echo-radius-panel)');
  });

  it('separates the dashboard below the hero book without occlusion geometry', () => {
    const workspace = ruleBody(echoCss, '.cockpit-workspace');
    expectDeclaration(workspace, 'grid-template-rows', '672px 300px');
    expect(echoCss).not.toMatch(/\.echo-dashboard__book-edge/im);
    expect(echoCss).not.toMatch(/\.occluded-panel__(?:top-cap|hero-foreground)/im);
    expect(echoCss).not.toMatch(/--(?:occlusion-depth|left-cap-width|right-cap-width|cap-display)\s*:/im);
  });

  it('keeps the structure map at reference width without forcing desktop rail overflow', () => {
    const panel = ruleBody(echoCss, '.echo-structure-map');
    const rail = ruleBody(echoCss, '.echo-structure-map__rail');
    const track = ruleBody(echoCss, '.echo-structure-map__track');
    const connectors = ruleBody(echoCss, '.echo-structure-map__connectors');
    const cards = ruleBody(echoCss, '.echo-structure-map__cards');
    const phase = ruleBody(echoCss, '.echo-act-card__phase');
    const chapterMetric = ruleBody(echoCss, '.echo-act-card__metric');
    const percentage = ruleBody(echoCss, '.echo-act-card__percentage');
    const legend = ruleBody(echoCss, '.echo-structure-map__legend');

    expectDeclaration(panel, 'width', '100%');
    expectDeclaration(panel, 'max-width', '522px');
    expectDeclaration(rail, 'overflow-x', 'auto');
    expectDeclaration(rail, 'padding', '8px 10px 10px');
    expectDeclaration(track, 'position', 'relative');
    expectDeclaration(track, 'width', 'max(100%, var(--structure-track-min-width))');
    expectDeclaration(track, 'min-width', 'var(--structure-track-min-width)');
    expectDeclaration(connectors, 'left', '0');
    expectDeclaration(connectors, 'width', '100%');
    expectDeclaration(connectors, 'min-width', '0');
    expectDeclaration(cards, 'width', '100%');
    expectDeclaration(cards, 'min-width', '0');
    expectDeclaration(
      cards,
      'grid-template-columns',
      'repeat(var(--structure-act-count), minmax(104px, 1fr))',
    );
    expectDeclaration(cards, 'gap', '10px');
    expect(phase).not.toMatch(/(?:^|;)\s*(?:overflow|text-overflow)\s*:/im);
    expect(phase).not.toMatch(/(?:^|;)\s*white-space\s*:\s*nowrap/im);
    for (const body of [phase, chapterMetric, percentage, legend]) {
      expect(pixelFontSize(body)).toBeGreaterThanOrEqual(10);
    }
    expectDeclaration(legend, 'color', 'var(--echo-mint-600)');
  });

  it('builds the compact chapter timeline with open-cap geometry and solid foreground cards', () => {
    const panel = ruleBody(echoCss, '.chapter-timeline');
    const heading = ruleBody(echoCss, '.chapter-timeline__heading');
    const rail = ruleBody(echoCss, '.chapter-timeline__rail');
    const cards = ruleBody(echoCss, '.chapter-timeline__cards');
    const card = ruleBody(echoCss, '.chapter-timeline__card');
    const progress = ruleBody(echoCss, '.chapter-timeline__progress');
    const progressLine = ruleBody(echoCss, '.chapter-timeline__progress-line');
    const completeNode = ruleBody(echoCss, '.chapter-timeline__progress-node.is-complete');
    const laterNode = ruleBody(echoCss, '.chapter-timeline__progress-node.is-later');
    const title = ruleBody(echoCss, '.chapter-timeline__card strong');
    const beat = ruleBody(echoCss, '.chapter-timeline__beat');
    const meta = ruleBody(echoCss, '.chapter-timeline__meta');

    expectDeclaration(panel, 'width', '100%');
    expectDeclaration(panel, 'max-width', '547px');
    expectDeclaration(panel, 'min-height', '190px');
    expect(panel).not.toMatch(/(?:^|;)\s*background(?:-[a-z-]+)?\s*:/im);
    expect(heading).not.toMatch(/(?:^|;)\s*background(?:-[a-z-]+)?\s*:/im);

    expectDeclaration(rail, 'overflow-x', 'auto');
    expectDeclaration(cards, 'display', 'flex');
    expectDeclaration(cards, 'width', 'max-content');
    expectDeclaration(cards, 'min-width', '100%');
    expectDeclaration(cards, 'flex-wrap', 'nowrap');
    expectDeclaration(card, 'position', 'relative');
    expectDeclaration(card, 'z-index', '20');
    expectDeclaration(card, 'background', 'var(--echo-glass-card)');

    expectDeclaration(progress, 'position', 'relative');
    expectDeclaration(progress, 'z-index', '21');
    expectDeclaration(progress, 'width', 'max-content');
    expectDeclaration(progress, 'margin-top', '12px');
    expect(progress).not.toMatch(/(?:^|;)\s*min-width\s*:\s*100%\s*;/im);
    expectDeclaration(progressLine, 'height', '2px');
    expect(progressLine).not.toMatch(/(?:^|;)\s*background(?:-[a-z-]+)?\s*:/im);
    expectDeclaration(completeNode, 'background', 'var(--echo-mint-500)');
    expectDeclaration(laterNode, 'background', 'var(--echo-line)');

    for (const body of [title, beat, meta]) {
      expect(pixelFontSize(body)).toBeGreaterThanOrEqual(10);
    }
    for (const body of [panel, heading, rail, cards, card, progress]) {
      expect(body).not.toMatch(/(?:^|;)\s*transform\s*:\s*[^;]*scale/im);
    }
  });

  it('marks selected act and chapter cards with a gradient border and lift', () => {
    const act = ruleBody(echoCss, '.echo-act-card.is-selected');
    expect(act).toContain('var(--echo-gradient-accent) border-box');
    expect(act).toContain('var(--echo-shadow-mint-md)');
    const chapter = ruleBody(echoCss, '.chapter-timeline__card.is-selected');
    expect(chapter).toContain('var(--echo-gradient-accent) border-box');
    const hover = ruleBody(echoCss, '.echo-act-card:hover');
    expect(hover).toMatch(/transform\s*:\s*translateY\(-2px\)/);
  });

  it('uses reference accents for Task 8 controls, state, progress, and focus affordances', () => {
    expectDeclaration(ruleBody(echoCss, '.ai-writing-partner__status'), 'color', 'var(--echo-blue-600)');
    expectDeclaration(ruleBody(echoCss, '.ai-writing-partner__status > span'), 'background', 'var(--echo-blue-600)');
    expectDeclaration(ruleBody(echoCss, '.ai-writing-partner progress'), 'accent-color', 'var(--echo-mint-500)');
    expectDeclaration(
      ruleBody(echoCss, '.ai-writing-partner progress::-webkit-progress-value'),
      'background',
      'var(--echo-mint-500)',
    );
    expectDeclaration(
      ruleBody(echoCss, '.ai-writing-partner progress::-moz-progress-bar'),
      'background',
      'var(--echo-mint-500)',
    );

    for (const selector of ['.ai-writing-partner__view-all', '.memory-layer-card__header button']) {
      const cardAction = ruleBody(echoCss, selector);
      expectDeclaration(cardAction, 'border', '0');
      expectDeclaration(cardAction, 'color', 'var(--echo-mint-600)');
    }

    const selectedTag = ruleBody(echoCss, ".memory-layer-card__tags button[aria-pressed='true']");
    expectDeclaration(selectedTag, 'border-color', 'var(--echo-mint-500)');
    expectDeclaration(selectedTag, 'color', 'var(--echo-surface)');
    expectDeclaration(selectedTag, 'background', 'var(--echo-mint-500)');

    expectDeclaration(ruleBody(echoCss, '.agent-details-drawer__avatar'), 'color', 'var(--echo-blue-600)');
    const focusMode = ruleBody(
      echoCss,
      ".agent-details-drawer__focus-mode button[aria-pressed='true']",
    );
    expectDeclaration(focusMode, 'border-color', 'var(--echo-blue-600)');
    expectDeclaration(focusMode, 'color', 'var(--echo-blue-600)');
    expectDeclaration(focusMode, 'background', 'var(--echo-mint-50)');

    const taskEightFocus = ruleBody(
      echoCss,
      '.ai-writing-partner button:focus-visible,\n.memory-layer-card button:focus-visible,\n.agent-details-drawer button:focus-visible',
    );
    expectDeclaration(taskEightFocus, 'outline', '3px solid var(--echo-blue-600)');

    const blue = tokenHex('echo-blue-600');
    const white = tokenHex('echo-surface');
    const line = tokenHex('echo-line');
    expect(contrastRatio(blue, white)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(blue, line)).toBeGreaterThanOrEqual(3);
  });

  it('keeps the optimized Echo card image contained at its display size', () => {
    const image = ruleBody(echoCss, '.ai-writing-partner__intro img');
    expectDeclaration(image, 'width', '56px');
    expectDeclaration(image, 'height', '56px');
    expectDeclaration(image, 'object-fit', 'contain');
  });

  it('catches panel content compositing and owned pseudo overlays at any rule depth', () => {
    const fixture = `
      /* .occluded-panel__content { opacity: 0.5; } */
      .scope .occluded-panel__content.is-responsive { opacity: 0.8; }
      @media (width >= 900px) {
        @supports (display: grid) {
          .occluded-panel__content { filter: none; mask-image: none; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
        }
      }
      :is(.occluded-panel__content) { opacity: 0.5; }
      :where(.occluded-panel)::before { background: white; }
      .scope :is(.occluded-panel__content, .other) { -webkit-filter: none; }
      .unrelated,
      .occluded-panel:is(.wide, .narrow)::before { background: white; }
    `;

    expect(occludedPanelContractViolations(fixture)).toEqual([
      '.scope .occluded-panel__content.is-responsive -> opacity',
      '.occluded-panel__content -> filter',
      '.occluded-panel__content -> mask-image',
      '.occluded-panel__content -> backdrop-filter',
      '.occluded-panel__content -> -webkit-backdrop-filter',
      ':is(.occluded-panel__content) -> opacity',
      ':where(.occluded-panel)::before -> background',
      '.scope :is(.occluded-panel__content, .other) -> -webkit-filter',
      '.occluded-panel:is(.wide, .narrow)::before -> background',
    ]);
  });

  it('allows nested panel mentions and decorative surface pseudo elements', () => {
    const fixture = `
      /* .occluded-panel::after { background: white; } */
      .wrapper:has(.occluded-panel)::before { background: white; opacity: 0.5; }
      .wrapper:not(.occluded-panel)::after { background: white; filter: none; }
      .occluded-panel__surface::before { content: ''; }
      .occluded-panel__surface::after { content: ''; }
    `;

    expect(occludedPanelContractViolations(fixture)).toEqual([]);
  });

  it('pins the reference two-column shell, vertical anchors, and transparent workspace', () => {
    const scroll = ruleBody(echoCss, '.cockpit-scroll');
    const shell = ruleBody(echoCss, '.cockpit-shell');
    const workspace = ruleBody(echoCss, '.cockpit-workspace');
    const topbar = ruleBody(echoCss, '.cockpit-topbar');
    const heroSlot = ruleBody(echoCss, '.echo-hero-slot');
    const main = ruleBody(echoCss, '.cockpit-main');
    const topbarContent = ruleBody(echoCss, '.workspace-topbar-content');
    const actions = ruleBody(echoCss, '.workspace-topbar-content .workspace-actions');

    expectDeclaration(scroll, 'position', 'relative');
    expectDeclaration(scroll, 'min-width', '0');
    expectDeclaration(scroll, 'min-height', '972px');
    expectDeclaration(scroll, 'overflow', 'hidden');
    expectDeclaration(shell, 'position', 'relative');
    expectDeclaration(shell, 'display', 'grid');
    expectDeclaration(shell, 'grid-template-columns', '168px minmax(0, 1fr)');
    expectDeclaration(shell, 'width', '100%');
    expectDeclaration(shell, 'min-height', '972px');
    expectDeclaration(workspace, 'display', 'grid');
    expectDeclaration(workspace, 'grid-template-rows', '672px 300px');
    expectDeclaration(workspace, 'min-width', '0');
    expectDeclaration(workspace, 'background', 'transparent');
    expectDeclaration(ruleBody(echoCss, '.cockpit-sidebar'), 'background', 'transparent');
    expect(ruleBody(echoCss, '.cockpit-right-panel')).toBe('');
    expectDeclaration(topbar, 'position', 'absolute');
    expectDeclaration(topbar, 'min-height', '56px');
    expectDeclaration(topbar, 'background', 'transparent');
    expectDeclaration(heroSlot, 'min-width', '0');
    expectDeclaration(heroSlot, 'background', 'transparent');
    expectDeclaration(main, 'min-width', '0');
    expectDeclaration(main, 'padding', '0 24px 24px');
    expectDeclaration(main, 'background', 'transparent');
    expectDeclaration(topbarContent, 'display', 'flex');
    expectDeclaration(topbarContent, 'align-items', 'center');
    expectDeclaration(topbarContent, 'gap', '16px');
    expectDeclaration(topbarContent, 'width', '100%');
    expectDeclaration(topbarContent, 'flex-wrap', 'nowrap');
    expectDeclaration(actions, 'margin-left', 'auto');
  });

  it('unifies topbar controls as glass pills', () => {
    const search = ruleBody(echoCss, '.workspace-topbar-content .workspace-search');
    expectDeclaration(search, 'background', 'var(--echo-glass-pill)');
    expectDeclaration(search, 'border', '1px solid var(--echo-glass-border)');
    expectDeclaration(search, 'border-radius', '999px');
    expect(search).toMatch(/backdrop-filter\s*:\s*blur\(18px\) saturate\(160%\)/);
    expect(search).toContain('var(--echo-shadow-mint-sm)');
    const iconButton = ruleBody(echoCss, '.workspace-topbar-content .topbar-icon-button');
    expectDeclaration(iconButton, 'background', 'var(--echo-glass-pill)');
    expectDeclaration(iconButton, 'border-radius', '999px');
  });

  it('gives sidebar navigation a liquid mint active state', () => {
    const active = ruleBody(echoCss, '.project-sidebar-content .project-navigation__item.is-active');
    expectDeclaration(active, 'background', 'var(--echo-glass-pill)');
    expect(active).toContain('var(--echo-shadow-mint-sm)');
    const indicator = ruleBody(echoCss, '.project-sidebar-content .project-navigation__item.is-active::before');
    expectDeclaration(indicator, 'background', 'var(--echo-gradient-accent)');
    const hover = ruleBody(echoCss, '.project-sidebar-content .project-navigation__item:hover');
    expectDeclaration(hover, 'background', 'var(--echo-mint-50)');
  });

  it('paints the new project button with the AA-compliant action gradient', () => {
    const button = ruleBody(echoCss, '.echo-new-project');
    expectDeclaration(button, 'background', 'var(--echo-gradient-action)');
    expectDeclaration(button, 'color', 'var(--echo-surface)');
  });

  it('caps the reference dashboard geometry inside the locked 1672px canvas', () => {
    const dashboard = ruleBody(echoCss, '.echo-dashboard');
    const primary = ruleBody(echoCss, '.echo-dashboard__primary-row');
    const timeline = ruleBody(echoCss, '.echo-dashboard__timeline');
    const chapterButton = ruleBody(echoCss, '.echo-dashboard__timeline > .chapter-details-button');
    const aiCard = ruleBody(echoCss, '.echo-dashboard__primary-row > .ai-writing-partner');
    const echoGridSelector = '.cockpit-scroll .echo-dashboard__lower-row';
    const echoChildrenSelector =
      '.cockpit-scroll .echo-dashboard__lower-row > .inspiration-vault,\n' +
      '.cockpit-scroll .echo-dashboard__lower-row > .character-graph,\n' +
      '.cockpit-scroll .echo-dashboard__lower-row > .clue-attribution-flow,\n' +
      '.cockpit-scroll .echo-dashboard__lower-row > .memory-layer-card';
    const echoGrid = ruleBody(echoCss, echoGridSelector);
    const echoChildren = ruleBody(echoCss, echoChildrenSelector);

    expectDeclaration(dashboard, 'display', 'grid');
    expectDeclaration(dashboard, 'width', 'min(1396px, 100%)');
    expectDeclaration(dashboard, 'gap', '8px');
    expectDeclaration(dashboard, 'background', 'transparent');
    expectDeclaration(primary, 'display', 'grid');
    expectDeclaration(primary, 'grid-template-columns', 'minmax(0, 522fr) minmax(0, 547fr) minmax(230px, 295fr)');
    expectDeclaration(primary, 'gap', '16px');
    expectDeclaration(primary, 'height', 'auto');
    expectDeclaration(primary, 'background', 'transparent');
    expectDeclaration(timeline, 'position', 'relative');
    expectDeclaration(timeline, 'display', 'grid');
    expectDeclaration(timeline, 'width', '100%');
    expectDeclaration(timeline, 'max-width', '547px');
    expectDeclaration(timeline, 'height', '190px');
    expectDeclaration(timeline, 'gap', '6px');
    expectDeclaration(chapterButton, 'position', 'absolute');
    expectDeclaration(chapterButton, 'top', '14px');
    expectDeclaration(chapterButton, 'right', '82px');
    expectDeclaration(chapterButton, 'margin', '0');
    expectDeclaration(chapterButton, 'background', 'var(--echo-blue-600)');
    expectDeclaration(aiCard, 'height', '250px');
    expectDeclaration(aiCard, 'overflow-y', 'auto');

    expect(echoGrid).not.toBe('');
    expect(echoChildren).not.toBe('');
    expectDeclaration(echoGrid, 'display', 'grid');
    expectDeclaration(echoGrid, 'grid-template-columns', 'repeat(3, minmax(0, 1fr)) minmax(230px, 295px)');
    expectDeclaration(echoGrid, 'gap', '12px');
    expectDeclaration(echoGrid, 'align-items', 'stretch');
    expectDeclaration(echoGrid, 'width', 'min(1396px, 100%)');
    expectDeclaration(echoGrid, 'height', '250px');
    expectDeclaration(echoGrid, 'min-width', '0');

    expectDeclaration(echoChildren, 'height', '250px');
    expectDeclaration(echoChildren, 'overflow', 'hidden');
    expectDeclaration(echoChildren, 'grid-column', 'auto');
    expectDeclaration(echoChildren, 'max-width', 'none');

    const availableAt1440 = 1440 - 230 - 30 - 16;
    expect(availableAt1440).toBe(1164);
    for (const body of [dashboard, primary, timeline, echoGrid]) {
      expect(body).not.toMatch(/(?:^|;)\s*width\s*:\s*1396px\s*;/im);
    }
  });

  it('owns the active chapter drawer overlay and complete solid drawer foundation', () => {
    const backdrop = ruleBody(echoCss, '.chapter-drawer-backdrop');
    const drawer = ruleBody(echoCss, '.chapter-detail-drawer');
    const header = ruleBody(echoCss, '.chapter-detail-drawer__header');
    const facts = ruleBody(echoCss, '.chapter-detail-facts');
    const summary = ruleBody(echoCss, '.chapter-detail-summary');
    const tagsAndClues = ruleBody(
      echoCss,
      '.chapter-detail-tags,\n.chapter-detail-clue-list',
    );
    const closeFocus = ruleBody(echoCss, '.chapter-detail-drawer__close:focus-visible');

    expectDeclaration(backdrop, 'position', 'fixed');
    expectDeclaration(backdrop, 'inset', '0');
    expectDeclaration(backdrop, 'z-index', '100');
    expectDeclaration(backdrop, 'display', 'flex');
    expectDeclaration(backdrop, 'justify-content', 'flex-end');
    expectDeclaration(backdrop, 'background', 'var(--echo-line)');

    expectDeclaration(drawer, 'width', 'min(430px, 100%)');
    expectDeclaration(drawer, 'height', '100%');
    expectDeclaration(drawer, 'min-height', '100%');
    expectDeclaration(drawer, 'padding', '26px');
    expectDeclaration(drawer, 'overflow-y', 'auto');
    expectDeclaration(drawer, 'border-left', '1px solid var(--echo-line)');
    expectDeclaration(drawer, 'color', 'var(--echo-ink)');
    expectDeclaration(drawer, 'background', 'var(--echo-surface)');
    expectDeclaration(drawer, 'box-shadow', 'var(--echo-shadow-card)');

    expectDeclaration(header, 'display', 'flex');
    expectDeclaration(header, 'justify-content', 'space-between');
    expectDeclaration(facts, 'display', 'grid');
    expectDeclaration(facts, 'grid-template-columns', 'repeat(2, minmax(0, 1fr))');
    expectDeclaration(summary, 'color', 'var(--echo-muted)');
    expectDeclaration(tagsAndClues, 'display', 'grid');
    expectDeclaration(tagsAndClues, 'list-style', 'none');
    expectDeclaration(closeFocus, 'outline', '3px solid var(--echo-blue-600)');
    expectDeclaration(closeFocus, 'outline-offset', '3px');
  });

  it('locks the layout to the 1728 by 972 design canvas with uniform scaling and reduced motion only', () => {
    const mediaConditions = Array.from(
      stripCssComments(echoCss).matchAll(/@media\s*\(([^)]+)\)/g),
      ([, condition]) => condition.trim(),
    );
    expect(mediaConditions).toEqual([
      'prefers-reduced-motion: no-preference',
      'prefers-reduced-motion: reduce',
    ]);
    expect(echoCss).not.toMatch(/(?:\.echo-page|\.cockpit-scroll)[^{]*\{[^}]*min-width\s*:\s*1280px/im);
    const documentFrame = ruleBody(globalCss, 'html,\nbody,\n#root');
    expectDeclaration(documentFrame, 'min-width', '100%');
    expectDeclaration(documentFrame, 'height', '100%');
    expectDeclaration(documentFrame, 'overflow-x', 'visible');
    expect(documentFrame).not.toMatch(/(?:^|;)\s*overflow-x\s*:\s*hidden\s*;/im);
    expect(documentFrame).not.toMatch(/(?:^|;)\s*min-width\s*:\s*1280px\s*;/im);

    const scaleViewport = ruleBody(echoCss, '.echo-scale-viewport');
    const scaleRoot = ruleBody(echoCss, '.echo-scale-root');
    expectDeclaration(scaleViewport, 'width', '100%');
    expectDeclaration(scaleViewport, 'height', '100%');
    expectDeclaration(scaleRoot, 'width', '1728px');
    expectDeclaration(scaleRoot, 'height', '972px');
    expectDeclaration(scaleRoot, 'transform', 'scale(var(--echo-scale, 1))');
    expectDeclaration(scaleRoot, 'transform-origin', 'top left');

    const reducedMotion = mediaBlock(echoCss, 'prefers-reduced-motion: reduce');
    const motionTargets = ruleBody(reducedMotion, '.echo-page,\n.echo-page *');
    expectDeclaration(motionTargets, 'scroll-behavior', 'auto');
    expectDeclaration(motionTargets, 'animation', 'none');
    expectDeclaration(motionTargets, 'transition', 'none');
    expect(motionTargets).not.toMatch(/(?:^|;)\s*transform\s*:/im);
  });

  it('keeps keyboard focus visible inside every Echo scroll region', () => {
    const scrollFocus = ruleBody(
      echoCss,
      '.echo-structure-map__rail:focus-visible,\n.chapter-timeline__rail:focus-visible,\n.ai-writing-partner:focus-visible,\n.cockpit-scroll .inspiration-vault__grid:focus-visible,\n.cockpit-scroll .character-graph__viewport:focus-visible,\n.cockpit-scroll .clue-attribution-flow__canvas:focus-visible',
    );
    expectDeclaration(scrollFocus, 'outline', '3px solid var(--echo-blue-600)');
    expectDeclaration(scrollFocus, 'outline-offset', '-3px');

    for (const selector of ['.chapter-drawer-backdrop', '.agent-details-drawer-backdrop', '.echo-action-feedback']) {
      const body = ruleBody(echoCss, selector);
      const match = body.match(/(?:^|;)\s*z-index\s*:\s*(\d+)\s*;/m);
      expect(Number(match?.[1]), selector).toBeGreaterThanOrEqual(100);
    }
  });

  it('keeps the permanently mounted action live region hidden until it becomes a solid toast', () => {
    const feedback = ruleBody(echoCss, '.echo-action-feedback');
    const visibleFeedback = ruleBody(echoCss, '.echo-action-feedback.is-visible');

    expectDeclaration(feedback, 'position', 'fixed');
    expectDeclaration(feedback, 'right', '24px');
    expectDeclaration(feedback, 'bottom', '24px');
    expectDeclaration(feedback, 'z-index', '120');
    expectDeclaration(feedback, 'pointer-events', 'none');
    expectDeclaration(feedback, 'opacity', '0');
    expectDeclaration(feedback, 'border', '1px solid var(--echo-line)');
    expectDeclaration(feedback, 'border-radius', 'var(--echo-radius-card)');
    expectDeclaration(feedback, 'color', 'var(--echo-surface)');
    expectDeclaration(feedback, 'background', 'var(--echo-ink)');
    expectDeclaration(feedback, 'box-shadow', 'var(--echo-shadow-card)');
    expectDeclaration(feedback, 'font-size', '11px');

    expectDeclaration(visibleFeedback, 'opacity', '1');
    expect(feedback).not.toMatch(/(?:^|;)\s*(?:display|visibility)\s*:/im);
    expect(visibleFeedback).not.toMatch(/(?:^|;)\s*(?:display|visibility)\s*:/im);
    expect(echoCss).not.toMatch(/\.echo-action-feedback[^{}]*\{[^}]*aria-hidden/im);
  });

  it('does not introduce blend modes or translucent white overlays', () => {
    expect(echoCss).not.toMatch(/(?:^|[;{])\s*(?:-webkit-)?mix-blend-mode\s*:/im);
    expect(hasTranslucentWhiteMask(echoCss)).toBe(false);
  });

  it('detects translucent white colors nested inside declaration functions', () => {
    for (const value of [
      'linear-gradient(rgb(255 255 255 / 50%), transparent)',
      'linear-gradient(to bottom, rgba(255, 255, 255, 0.5), #000)',
      'linear-gradient(#fff8, #000)',
      'drop-shadow(0 1px 2px #ffffff80)',
      'color-mix(in srgb, white 80%, transparent)',
    ]) {
      expect(hasTranslucentWhiteMask(`.mask { background: ${value}; }`), value).toBe(true);
    }
    for (const value of ['#fff', '#ffffff', '#ffff', '#ffffffff', 'rgb(255 255 255)', 'rgba(255, 255, 255, 1)']) {
      expect(hasTranslucentWhiteMask(`.solid { background: ${value}; }`), value).toBe(false);
    }
  });

  it('places home cards in the three-column desktop grid from the reference', () => {
    const grid = ruleBody(echoCss, '.echo-home-dashboard');
    expectDeclaration(grid, 'display', 'grid');
    expectDeclaration(grid, 'grid-template-columns', '1.12fr 1.02fr 1.05fr');
    expectDeclaration(grid, 'grid-template-rows', 'minmax(0, 1fr) minmax(0, 1fr)');
    expectDeclaration(grid, 'gap', '8px');
    expectDeclaration(grid, 'width', '100%');
    expectDeclaration(grid, 'height', '100%');
    expectDeclaration(ruleBody(echoCss, '.echo-home-card--project'), 'grid-column', '1');
    expectDeclaration(ruleBody(echoCss, '.echo-home-card--project'), 'grid-row', '1 / span 2');
    expectDeclaration(ruleBody(echoCss, '.echo-home-card--chapters'), 'grid-column', '2');
    expectDeclaration(ruleBody(echoCss, '.echo-home-card--chapters'), 'grid-row', '1');
    expectDeclaration(ruleBody(echoCss, '.echo-home-card--network'), 'grid-column', '3');
    expectDeclaration(ruleBody(echoCss, '.echo-home-card--network'), 'grid-row', '1');
    expectDeclaration(ruleBody(echoCss, '.echo-home-card--goals'), 'grid-column', '2');
    expectDeclaration(ruleBody(echoCss, '.echo-home-card--goals'), 'grid-row', '2');
    expectDeclaration(ruleBody(echoCss, '.echo-home-dashboard__pair'), 'grid-column', '3');
    expectDeclaration(ruleBody(echoCss, '.echo-home-dashboard__pair'), 'grid-row', '2');
  });

  it('pins the sidebar footer to the same baseline as the home cards', () => {
    const sidebar = ruleBody(echoCss, '.cockpit-sidebar .project-sidebar-content');
    const utilities = ruleBody(echoCss, '.echo-sidebar-utilities');
    const main = ruleBody(echoCss, '.cockpit-main');

    expectDeclaration(sidebar, 'display', 'flex');
    expectDeclaration(sidebar, 'flex-direction', 'column');
    expectDeclaration(sidebar, 'height', '972px');
    expectDeclaration(sidebar, 'padding', '18px 10px 24px');
    expectDeclaration(utilities, 'margin-top', 'auto');
    expectDeclaration(main, 'padding', '0 24px 24px');
  });

  it('lays out the writing workspace as a three-column workbench', () => {
    const view = ruleBody(echoCss, '.writing-view');
    expectDeclaration(view, 'display', 'grid');
    expectDeclaration(view, 'grid-template-columns', '240px minmax(0, 1fr) 320px');
    expectDeclaration(ruleBody(echoCss, '.writing-view__editor'), 'min-width', '0');
    expectDeclaration(ruleBody(echoCss, '.echo-chat'), 'display', 'flex');
    expectDeclaration(ruleBody(echoCss, '.echo-chat'), 'flex-direction', 'column');
    expectDeclaration(ruleBody(echoCss, '.echo-chat__log'), 'overflow-y', 'auto');
    const composer = ruleBody(echoCss, '.echo-chat__composer-card');
    expectDeclaration(composer, 'border-radius', '16px');
    expectDeclaration(composer, 'background', 'var(--echo-glass-card)');
    expectDeclaration(ruleBody(echoCss, '.echo-chat__send'), 'background', 'var(--echo-gradient-action)');
    expectDeclaration(ruleBody(echoCss, '.echo-chat__attach'), 'border-radius', '999px');
  });

  it('styles the writing workspace with the glass system and a paper editor', () => {
    const editor = ruleBody(echoCss, '.writing-view__editor');
    expectDeclaration(editor, 'background', 'var(--echo-glass-card)');
    const chat = ruleBody(echoCss, '.writing-view__chat');
    expectDeclaration(chat, 'background', 'var(--echo-glass-panel)');
    expect(chat).toContain('var(--echo-shadow-mint-md)');
    const selected = ruleBody(echoCss, ".chapter-list button[aria-pressed='true']");
    expect(selected).toContain('var(--echo-gradient-accent) border-box');
  });

  it('connects agent tasks with a vertical flow line', () => {
    const flow = ruleBody(echoCss, '.agent-task-flow');
    expectDeclaration(flow, 'list-style', 'none');
    const connector = ruleBody(echoCss, '.agent-task-flow li::before');
    expect(connector).toMatch(/border-left|background/);
    expect(connector).toContain("content: ''");
  });

  it('uses the Echo product title', () => {
    expect(indexHtml).toContain('<title>Echo — AI Writing Studio</title>');
  });
});
