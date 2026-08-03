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
    } as const;

    const expectedNames = Object.keys(expectedTokens).map((name) => `--echo-${name}`).sort();
    const declaredNames = Array.from(
      stripCssComments(tokensCss).matchAll(/(--echo-[a-z0-9-]+)\s*:/gi),
      ([, name]) => name,
    ).sort();
    expect(declaredNames).toHaveLength(18);
    expect(declaredNames).toEqual(expectedNames);

    for (const [name, value] of Object.entries(expectedTokens)) {
      const matches = Array.from(tokensCss.matchAll(new RegExp(`--echo-${name}:\\s*([^;]+);`, 'g')));
      expect(matches, `--echo-${name}`).toHaveLength(1);
      expect(matches[0][1].trim()).toBe(value);
    }
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
    expectDeclaration(page, 'min-height', '100svh');
    expectDeclaration(page, 'overflow-x', 'visible');
    expectDeclaration(page, 'isolation', 'isolate');
    expectDeclaration(page, 'background', 'var(--echo-page)');
    expectDeclaration(page, 'color', 'var(--echo-ink)');
  });

  it('renders the hero artwork without filters, blending, or input interception', () => {
    const hero = ruleBody(echoCss, '.echo-hero-background');
    const image = ruleBody(echoCss, '.echo-hero-background__image');

    expectDeclaration(hero, 'position', 'absolute');
    expectDeclaration(hero, 'top', '0');
    expectDeclaration(hero, 'left', '0');
    expectDeclaration(hero, 'z-index', '1');
    expectDeclaration(hero, 'width', '100%');
    expectDeclaration(hero, 'height', 'auto');
    expectDeclaration(hero, 'pointer-events', 'none');
    expectDeclaration(image, 'display', 'block');
    expectDeclaration(image, 'width', '100%');
    expectDeclaration(image, 'height', 'auto');
    expectDeclaration(image, 'object-fit', 'contain');
    expectDeclaration(image, 'object-position', 'center top');
    expectDeclaration(image, 'opacity', '1');
    expectDeclaration(image, 'filter', 'none');
    expectDeclaration(image, 'user-select', 'none');
  });

  it('keeps foreground content and the current cockpit above the hero artwork', () => {
    const foreground = ruleBody(echoCss, '.cockpit-sidebar,\n.cockpit-workspace');
    expectDeclaration(foreground, 'position', 'relative');
    expectDeclaration(foreground, 'z-index', '20');
    expectDeclaration(ruleBody(echoCss, '.cockpit-shell'), 'z-index', '20');
  });

  it('builds occluded panels from solid structural pieces without compositing content', () => {
    const panel = ruleBody(echoCss, '.occluded-panel');
    const surface = ruleBody(echoCss, '.occluded-panel__surface');
    const cap = ruleBody(echoCss, '.occluded-panel__top-cap');
    const leftCap = ruleBody(echoCss, '.occluded-panel__top-cap--left');
    const rightCap = ruleBody(echoCss, '.occluded-panel__top-cap--right');
    const content = ruleBody(echoCss, '.occluded-panel__content');

    expectDeclaration(panel, 'position', 'relative');
    expectDeclaration(panel, 'isolation', 'isolate');
    expectDeclaration(panel, 'min-width', '0');
    expectDeclaration(panel, 'background', 'transparent');

    expectDeclaration(surface, 'position', 'absolute');
    expectDeclaration(surface, 'inset', 'var(--occlusion-depth, 58px) 0 0');
    expectDeclaration(surface, 'z-index', '10');
    expectDeclaration(surface, 'border', '1px solid var(--echo-line)');
    expectDeclaration(surface, 'border-top', '0');
    expectDeclaration(
      surface,
      'border-radius',
      '0 0 var(--echo-radius-panel) var(--echo-radius-panel)',
    );
    expectDeclaration(surface, 'background', 'var(--echo-surface)');
    expectDeclaration(surface, 'box-shadow', 'var(--echo-shadow-card)');
    expectDeclaration(surface, 'pointer-events', 'none');

    expectDeclaration(cap, 'position', 'absolute');
    expectDeclaration(cap, 'top', '0');
    expectDeclaration(cap, 'z-index', '10');
    expectDeclaration(cap, 'display', 'var(--cap-display, block)');
    expectDeclaration(cap, 'height', 'var(--occlusion-depth, 58px)');
    expectDeclaration(cap, 'border-top', '1px solid var(--echo-line)');
    expectDeclaration(cap, 'background', 'var(--echo-surface)');
    expectDeclaration(cap, 'pointer-events', 'none');
    expectDeclaration(leftCap, 'left', '0');
    expectDeclaration(leftCap, 'width', 'var(--left-cap-width, 0)');
    expectDeclaration(rightCap, 'right', '0');
    expectDeclaration(rightCap, 'width', 'var(--right-cap-width, 0)');

    expectDeclaration(content, 'position', 'relative');
    expectDeclaration(content, 'z-index', '20');

    for (const body of [panel, surface, cap, content]) {
      expect(body).not.toMatch(/(?:^|;)\s*opacity\s*:/im);
    }
    expect(content).not.toMatch(
      /(?:^|;)\s*(?:filter|(?:-webkit-)?mask(?:-[a-z-]+)?|clip-path)\s*:/im,
    );
    expect(occludedPanelContractViolations(echoCss)).toEqual([]);
  });

  it('keeps the structure map at reference width without forcing desktop rail overflow', () => {
    const panel = ruleBody(echoCss, '.echo-structure-map');
    const rail = ruleBody(echoCss, '.echo-structure-map__rail');
    const track = ruleBody(echoCss, '.echo-structure-map__track');
    const connectors = ruleBody(echoCss, '.echo-structure-map__connectors');
    const cards = ruleBody(echoCss, '.echo-structure-map__cards');
    const phase = ruleBody(echoCss, '.echo-act-card__body strong');
    const chapterMetric = ruleBody(echoCss, '.echo-act-card__body small');
    const percentage = ruleBody(echoCss, '.echo-act-card__percentage');
    const marker = ruleBody(echoCss, '.echo-act-card__marker');
    const markerRow = ruleBody(echoCss, '.echo-act-card__markers');

    expectDeclaration(panel, 'width', '100%');
    expectDeclaration(panel, 'max-width', '522px');
    expectDeclaration(rail, 'overflow-x', 'auto');
    expectDeclaration(rail, 'padding', '10px 12px 16px');
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
    for (const body of [phase, chapterMetric, percentage, marker]) {
      expect(pixelFontSize(body)).toBeGreaterThanOrEqual(10);
    }
    expectDeclaration(markerRow, 'flex-wrap', 'wrap');
    expectDeclaration(marker, 'overflow-wrap', 'anywhere');
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
    expectDeclaration(panel, 'min-height', '201px');
    expectDeclaration(panel, '--occlusion-depth', '58px');
    expectDeclaration(panel, '--left-cap-width', '176px');
    expectDeclaration(panel, '--right-cap-width', '112px');
    expect(176 + 112).toBeLessThan(547);
    expect(panel).not.toMatch(/(?:^|;)\s*background(?:-[a-z-]+)?\s*:/im);
    expect(heading).not.toMatch(/(?:^|;)\s*background(?:-[a-z-]+)?\s*:/im);

    expectDeclaration(rail, 'overflow-x', 'auto');
    expectDeclaration(cards, 'display', 'flex');
    expectDeclaration(cards, 'width', 'max-content');
    expectDeclaration(cards, 'min-width', '100%');
    expectDeclaration(cards, 'flex-wrap', 'nowrap');
    expectDeclaration(card, 'position', 'relative');
    expectDeclaration(card, 'z-index', '20');
    expectDeclaration(card, 'background', 'var(--echo-surface)');

    expectDeclaration(progress, 'position', 'relative');
    expectDeclaration(progress, 'z-index', '21');
    expectDeclaration(progress, 'width', 'max-content');
    expectDeclaration(progress, 'margin-top', '12px');
    expect(progress).not.toMatch(/(?:^|;)\s*min-width\s*:\s*100%\s*;/im);
    expectDeclaration(progressLine, 'background', 'var(--echo-line)');
    expectDeclaration(completeNode, 'background', 'var(--echo-mint-500)');
    expectDeclaration(laterNode, 'background', 'var(--echo-line)');

    for (const body of [title, beat, meta]) {
      expect(pixelFontSize(body)).toBeGreaterThanOrEqual(10);
    }
    for (const body of [panel, heading, rail, cards, card, progress]) {
      expect(body).not.toMatch(/(?:^|;)\s*transform\s*:\s*[^;]*scale/im);
    }
  });

  it('uses contrast-safe blue for Task 8 controls, state, progress, and focus affordances', () => {
    expectDeclaration(ruleBody(echoCss, '.ai-writing-partner__status'), 'color', 'var(--echo-blue-600)');
    expectDeclaration(ruleBody(echoCss, '.ai-writing-partner__status > span'), 'background', 'var(--echo-blue-600)');
    expectDeclaration(ruleBody(echoCss, '.ai-writing-partner progress'), 'accent-color', 'var(--echo-blue-600)');
    expectDeclaration(
      ruleBody(echoCss, '.ai-writing-partner progress::-webkit-progress-value'),
      'background',
      'var(--echo-blue-600)',
    );
    expectDeclaration(
      ruleBody(echoCss, '.ai-writing-partner progress::-moz-progress-bar'),
      'background',
      'var(--echo-blue-600)',
    );

    const cardActions = ruleBody(
      echoCss,
      '.ai-writing-partner__view-all,\n.memory-layer-card__header button',
    );
    expectDeclaration(cardActions, 'border', '1px solid var(--echo-blue-600)');
    expectDeclaration(cardActions, 'color', 'var(--echo-blue-600)');

    const selectedTag = ruleBody(echoCss, ".memory-layer-card__tags button[aria-pressed='true']");
    expectDeclaration(selectedTag, 'border-color', 'var(--echo-blue-600)');
    expectDeclaration(selectedTag, 'color', 'var(--echo-blue-600)');
    expectDeclaration(selectedTag, 'background', 'var(--echo-mint-50)');

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
    expectDeclaration(image, 'width', '76px');
    expectDeclaration(image, 'height', '76px');
    expectDeclaration(image, 'object-fit', 'contain');
  });

  it('catches panel content compositing and owned pseudo overlays at any rule depth', () => {
    const fixture = `
      /* .occluded-panel__content { opacity: 0.5; } */
      .scope .occluded-panel__content.is-responsive { opacity: 0.8; }
      @media (width >= 900px) {
        @supports (display: grid) {
          .occluded-panel__content { filter: none; mask-image: none; }
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
      .occluded-panel__top-cap--left::after { content: ''; }
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
    expectDeclaration(scroll, 'min-height', '100svh');
    expectDeclaration(scroll, 'overflow-x', 'visible');
    expectDeclaration(shell, 'position', 'relative');
    expectDeclaration(shell, 'display', 'grid');
    expectDeclaration(shell, 'grid-template-columns', '230px minmax(0, 1fr)');
    expectDeclaration(shell, 'width', '100%');
    expectDeclaration(shell, 'min-height', '100svh');
    expectDeclaration(workspace, 'display', 'grid');
    expectDeclaration(workspace, 'grid-template-rows', '96px 386px minmax(0, 1fr)');
    expectDeclaration(workspace, 'min-width', '0');
    expectDeclaration(workspace, 'background', 'transparent');
    expectDeclaration(ruleBody(echoCss, '.cockpit-sidebar'), 'background', 'transparent');
    expect(ruleBody(echoCss, '.cockpit-right-panel')).toBe('');
    expectDeclaration(topbar, 'min-height', '96px');
    expectDeclaration(topbar, 'background', 'transparent');
    expectDeclaration(heroSlot, 'min-width', '0');
    expectDeclaration(heroSlot, 'background', 'transparent');
    expectDeclaration(main, 'min-width', '0');
    expectDeclaration(main, 'padding', '30px 16px 22px 30px');
    expectDeclaration(main, 'background', 'transparent');
    expectDeclaration(topbarContent, 'display', 'flex');
    expectDeclaration(topbarContent, 'align-items', 'center');
    expectDeclaration(topbarContent, 'gap', '16px');
    expectDeclaration(topbarContent, 'width', '100%');
    expectDeclaration(topbarContent, 'flex-wrap', 'nowrap');
    expectDeclaration(actions, 'margin-left', 'auto');
  });

  it('caps the reference dashboard geometry so the exact 1440 boundary remains fluid', () => {
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
    expectDeclaration(timeline, 'height', '201px');
    expectDeclaration(timeline, 'gap', '6px');
    expectDeclaration(chapterButton, 'position', 'absolute');
    expectDeclaration(chapterButton, 'top', '14px');
    expectDeclaration(chapterButton, 'right', '82px');
    expectDeclaration(chapterButton, 'margin', '0');
    expectDeclaration(chapterButton, 'background', 'var(--echo-blue-600)');
    expectDeclaration(aiCard, 'height', '201px');
    expectDeclaration(aiCard, 'overflow-y', 'auto');

    expect(echoGrid).not.toBe('');
    expect(echoChildren).not.toBe('');
    expectDeclaration(echoGrid, 'display', 'grid');
    expectDeclaration(echoGrid, 'grid-template-columns', 'repeat(3, minmax(0, 1fr)) minmax(230px, 295px)');
    expectDeclaration(echoGrid, 'gap', '12px');
    expectDeclaration(echoGrid, 'align-items', 'stretch');
    expectDeclaration(echoGrid, 'width', 'min(1396px, 100%)');
    expectDeclaration(echoGrid, 'height', '220px');
    expectDeclaration(echoGrid, 'min-width', '0');

    expectDeclaration(echoChildren, 'height', '220px');
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

    expectDeclaration(ruleBody(mediaBlock(echoCss, 'max-width: 760px'), '.chapter-detail-drawer,\n.agent-details-drawer'), 'width', '100%');
  });

  it('defines exact responsive media contracts without restoring page overflow or cropped scenery', () => {
    const mediaConditions = Array.from(
      stripCssComments(echoCss).matchAll(/@media\s*\(([^)]+)\)/g),
      ([, condition]) => condition.trim(),
    );
    expect(mediaConditions).toEqual([
      'max-width: 1439px',
      'max-width: 1279px',
      'max-width: 760px',
      'prefers-reduced-motion: reduce',
    ]);
    expect(echoCss).not.toMatch(/(?:\.echo-page|\.cockpit-scroll)[^{]*\{[^}]*min-width\s*:\s*1280px/im);
    expect(echoCss).not.toMatch(/\.echo-hero-background(?:__image)?[^{}]*\{[^}]*(?:background-size\s*:\s*cover|object-fit\s*:\s*cover)/im);
    const documentFrame = ruleBody(globalCss, 'html,\nbody,\n#root');
    expectDeclaration(documentFrame, 'min-width', '100%');
    expectDeclaration(documentFrame, 'overflow-x', 'visible');
    expect(documentFrame).not.toMatch(/(?:^|;)\s*overflow-x\s*:\s*hidden\s*;/im);
    expect(documentFrame).not.toMatch(/(?:^|;)\s*min-width\s*:\s*1280px\s*;/im);

    const compressed = mediaBlock(echoCss, 'max-width: 1439px');
    expectDeclaration(ruleBody(compressed, '.cockpit-shell'), 'grid-template-columns', '190px minmax(0, 1fr)');
    expectDeclaration(ruleBody(compressed, '.echo-dashboard'), 'width', '100%');
    expectDeclaration(ruleBody(compressed, '.echo-dashboard__primary-row'), 'grid-template-columns', 'minmax(0, 1fr) minmax(0, 1.05fr) minmax(230px, 260px)');
    expectDeclaration(ruleBody(compressed, '.echo-structure-map,\n.echo-dashboard__timeline'), 'width', '100%');
    expectDeclaration(ruleBody(compressed, '.cockpit-scroll .echo-dashboard__lower-row'), 'width', '100%');

    const tablet = mediaBlock(echoCss, 'max-width: 1279px');
    expectDeclaration(ruleBody(tablet, '.cockpit-shell'), 'grid-template-columns', '72px minmax(0, 1fr)');
    expectDeclaration(ruleBody(tablet, '.cockpit-workspace'), 'grid-template-rows', '80px max(300px, calc(56.31vw - 80px)) minmax(0, 1fr)');
    expectDeclaration(ruleBody(tablet, '.echo-brand__copy,\n.echo-progress-card'), 'display', 'none');
    expectDeclaration(ruleBody(tablet, '.echo-new-project span:nth-child(2),\n.project-sidebar-content .project-navigation__item span'), 'clip-path', 'inset(50%)');
    expectDeclaration(ruleBody(tablet, '.echo-dashboard__primary-row'), 'grid-template-columns', 'minmax(0, 1fr) minmax(0, 1fr)');
    expectDeclaration(ruleBody(tablet, '.echo-dashboard__primary-row > .ai-writing-partner'), 'grid-column', '1 / -1');
    expectDeclaration(ruleBody(tablet, '.cockpit-scroll .echo-dashboard__lower-row'), 'grid-template-columns', 'repeat(2, minmax(0, 1fr))');
    const tabletTimeline = ruleBody(tablet, '.echo-dashboard__timeline');
    const tabletChapterAction = ruleBody(
      tablet,
      '.echo-dashboard__timeline > .chapter-details-button',
    );
    expectDeclaration(tabletTimeline, 'height', 'auto');
    expectDeclaration(tabletTimeline, 'display', 'grid');
    expectDeclaration(tabletTimeline, 'gap', '10px');
    expectDeclaration(tabletChapterAction, 'position', 'static');
    expectDeclaration(tabletChapterAction, 'justify-self', 'end');
    expectDeclaration(ruleBody(tablet, '.echo-structure-map,\n.chapter-timeline'), '--occlusion-depth', '0px');
    expectDeclaration(ruleBody(tablet, '.echo-structure-map .occluded-panel__top-cap,\n.chapter-timeline .occluded-panel__top-cap'), 'display', 'none');
    expectDeclaration(ruleBody(tablet, '.echo-structure-map .occluded-panel__surface,\n.chapter-timeline .occluded-panel__surface'), 'border-radius', 'var(--echo-radius-panel)');

    const mobile = mediaBlock(echoCss, 'max-width: 760px');
    expectDeclaration(ruleBody(mobile, '.echo-hero-background'), 'position', 'relative');
    expectDeclaration(ruleBody(mobile, '.echo-hero-background__image'), 'width', '100%');
    expectDeclaration(ruleBody(mobile, '.echo-hero-background__image'), 'height', 'auto');
    expectDeclaration(ruleBody(mobile, '.cockpit-shell'), 'display', 'block');
    expectDeclaration(
      ruleBody(mobile, '.project-sidebar-content .project-navigation__item:focus-visible'),
      'outline-offset',
      '-3px',
    );
    expectDeclaration(ruleBody(mobile, '.echo-dashboard__primary-row,\n.cockpit-scroll .echo-dashboard__lower-row'), 'grid-template-columns', 'minmax(0, 1fr)');
    expectDeclaration(ruleBody(mobile, '.echo-dashboard__timeline > .chapter-details-button'), 'position', 'static');
    expectDeclaration(ruleBody(mobile, '.chapter-detail-drawer,\n.agent-details-drawer'), 'width', '100%');

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
      '.echo-structure-map__rail:focus-visible,\n.chapter-timeline__rail:focus-visible,\n.ai-writing-partner:focus-visible,\n.cockpit-scroll .inspiration-vault__grid:focus-visible,\n.cockpit-scroll .character-graph__viewport:focus-visible,\n.cockpit-scroll .character-graph__relationships:focus-visible,\n.cockpit-scroll .clue-attribution-flow__canvas:focus-visible',
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

  it('does not introduce compositing effects or translucent white overlays', () => {
    expect(echoCss).not.toMatch(/(?:^|[;{])\s*(?:-webkit-)?(?:mix-blend-mode|backdrop-filter)\s*:/im);
    expect(echoCss).not.toMatch(/blur\s*\(/i);
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

  it('uses the Echo product title', () => {
    expect(indexHtml).toContain('<title>Echo — AI Writing Studio</title>');
  });
});
