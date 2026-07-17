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

const declaresBackdropFilter = (body: string) => /(?:^|;)\s*(?:-webkit-)?backdrop-filter\s*:/.test(body);

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

  it('defines one white-mint visual language without the retired decorative palette', () => {
    expect(tokensCss).toMatch(/--color-canvas:\s*#f7fbf9;/i);
    expect(tokensCss).toMatch(/--color-surface:\s*#ffffff;/);
    expect(tokensCss).toMatch(/--color-mint-primary:\s*#0aa85b;/i);
    expect(tokensCss).toMatch(/--color-mint-support:\s*#6fddb1;/i);
    expect(tokensCss).toMatch(/--color-mint-soft:\s*#ddf6ea;/i);
    expect(tokensCss).toMatch(/--color-ink:\s*#14261f;/i);
    expect(tokensCss).toMatch(/--color-text-muted:\s*#6c7d75;/i);
    expect(tokensCss).not.toMatch(/#ff6b57|#3a86ff|#8f67ff|Georgia|Times New Roman/i);
    expect(tokensCss).toMatch(/--font-display:\s*var\(--font-ui\);/);
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

  it('uses separate fixed backdrop and foreground layers around readable content', () => {
    const stageRule = cockpitCss.match(/(?:^|})\s*\.cockpit-visual-stage\s*\{([^}]*)\}/s)?.[1] ?? '';
    const sharedLayerRule = cockpitCss.match(/\.cockpit-visual-stage__backdrop,\s*\.cockpit-visual-stage__book-layer,\s*\.cockpit-visual-stage__foreground\s*\{([^}]*)\}/s)?.[1] ?? '';
    const backdropRule = cockpitCss.match(/(?:^|})\s*\.cockpit-visual-stage__backdrop\s*\{([^}]*)\}/s)?.[1] ?? '';
    const bookLayerRule = cockpitCss.match(/(?:^|})\s*\.cockpit-visual-stage__book-layer\s*\{([^}]*)\}/s)?.[1] ?? '';
    const foregroundRule = cockpitCss.match(/(?:^|})\s*\.cockpit-visual-stage__foreground\s*\{([^}]*)\}/s)?.[1] ?? '';
    const drawerBackdropRule = cockpitCss.match(/(?:^|})\s*\.chapter-drawer-backdrop\s*\{([^}]*)\}/s)?.[1] ?? '';

    expect(stageRule).toMatch(/display:\s*contents;/);
    expect(stageRule).not.toMatch(/position:\s*fixed/);
    expect(stageRule).not.toMatch(/(?:z-index|isolation|transform):/);
    expect(sharedLayerRule).toMatch(/position:\s*fixed;/);
    expect(sharedLayerRule).toMatch(/inset:\s*0;/);
    expect(sharedLayerRule).toMatch(/pointer-events:\s*none;/);
    expect(sharedLayerRule).toMatch(/overflow:\s*hidden;/);
    expect(backdropRule).toMatch(/z-index:\s*0;/);
    expect(cockpitCss).toMatch(/\.cockpit-sidebar,\s*\.cockpit-workspace,\s*\.cockpit-right-panel\s*\{[^}]*z-index:\s*3;/s);
    expect(bookLayerRule).toMatch(/z-index:\s*4;/);
    expect(foregroundRule).toMatch(/z-index:\s*5;/);
    expect(drawerBackdropRule).toMatch(/z-index:\s*10;/);
  });

  it('keeps the mint atmosphere visible through a deliberate transparent surface hierarchy', () => {
    const backdropSupport = '@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))';
    const supportedCss = exactAtRuleBody(cockpitCss, backdropSupport);
    const workspaceGlassSelectors = [
      '.structure-map',
      '.chapter-swimlane',
      '.inspiration-vault',
      '.character-graph',
      '.clue-attribution-flow',
    ];
    const rightPanelSurfaceSelectors = [
      '.nova-lead-card',
      '.agent-panel__section',
      '.focus-mode-toggle',
    ];
    const innerCardSelectors = [
      '.act-card',
      '.chapter-card',
      '.chapter-add-card',
      '.clue-flow-card',
      '.character-graph__node',
      '.project-mini-card',
      '.writing-streak',
    ];

    expect(globalCss).not.toContain('bright_cockpit_background.png');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-shell', 'background')).toBe('transparent');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-workspace', 'background')).toBe('transparent');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-sidebar', 'background')).toBe('rgba(255, 255, 255, 0.9)');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-right-panel', 'background')).toBe('rgba(255, 255, 255, 0.9)');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-topbar', 'background')).toBe('rgba(255, 255, 255, 0.54)');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-topbar', '-webkit-backdrop-filter')).toBe('blur(20px)');
    expect(finalTopLevelDeclaration(cockpitCss, '.cockpit-topbar', 'backdrop-filter')).toBe('blur(20px)');

    for (const selector of ['.cockpit-sidebar', '.cockpit-right-panel']) {
      expect(finalTopLevelDeclaration(supportedCss, selector, 'background')).toBe('rgba(255, 255, 255, 0.52)');
      expect(finalTopLevelDeclaration(supportedCss, selector, '-webkit-backdrop-filter')).toBe('blur(22px)');
      expect(finalTopLevelDeclaration(supportedCss, selector, 'backdrop-filter')).toBe('blur(22px)');

      const blurContexts = contextualStyleRules(cockpitCss)
        .filter((rule) => rule.selectors.includes(selector) && declaresBackdropFilter(rule.body))
        .map((rule) => rule.atRules);
      expect(blurContexts).toEqual([[backdropSupport]]);
    }

    for (const selector of [...workspaceGlassSelectors, ...rightPanelSurfaceSelectors]) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'border')).toBe('1px solid rgba(180, 224, 205, 0.72)');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'background')).toBe('rgba(255, 255, 255, 0.64)');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'box-shadow')).toBe('0 16px 44px rgba(31, 112, 79, 0.07)');
    }

    for (const selector of workspaceGlassSelectors) {
      expect(finalTopLevelDeclaration(cockpitCss, selector, '-webkit-backdrop-filter')).toBe('blur(20px)');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'backdrop-filter')).toBe('blur(20px)');
    }

    for (const selector of rightPanelSurfaceSelectors) {
      const blurRules = contextualStyleRules(cockpitCss).filter(
        (rule) => rule.selectors.includes(selector) && declaresBackdropFilter(rule.body),
      );
      expect(blurRules).toEqual([]);
    }

    for (const selector of innerCardSelectors) {
      expect(['1px solid var(--color-line)', '1px solid var(--color-mint-line)']).toContain(
        finalTopLevelDeclaration(cockpitCss, selector, 'border'),
      );
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'background')).toBe('rgba(255, 255, 255, 0.84)');
      expect(finalTopLevelDeclaration(cockpitCss, selector, 'box-shadow')).toBe('0 8px 24px rgba(31, 112, 79, 0.05)');
    }

    const workspaceRules = contextualStyleRules(cockpitCss).filter((rule) => rule.selectors.includes('.cockpit-workspace'));
    expect(workspaceRules).not.toHaveLength(0);
    for (const workspaceRule of workspaceRules) {
      expect(declaresBackdropFilter(workspaceRule.body)).toBe(false);
    }
  });

  it('defines stable visual-stage sizing and motion tokens', () => {
    expect(tokensCss).toMatch(/--visual-stage-flow-opacity:\s*0\.82;/);
    expect(tokensCss).toMatch(/--visual-stage-book-width:\s*clamp\(340px,\s*27vw,\s*430px\);/);
    expect(tokensCss).not.toMatch(/--visual-stage-mascot-width:/);
    expect(tokensCss).toMatch(/--visual-stage-enter:\s*560ms\s+cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\);/);
    expect(tokensCss).toMatch(/--visual-stage-breathe:\s*12s\s+ease-in-out\s+infinite\s+alternate;/);
  });

  it('uses a CSS paper texture behind the app without intercepting input', () => {
    expect(globalCss).not.toContain('paper_grain_overlay.png');
    expect(globalCss).toMatch(/body\s*\{[^}]*isolation:\s*isolate;/s);
    expect(globalCss).toMatch(/#root\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*0;/s);
    expect(globalCss).toMatch(/body::after\s*\{[^}]*z-index:\s*-1;[^}]*pointer-events:\s*none;[^}]*repeating-(?:radial|linear)-gradient/s);
  });

  it('keeps the cockpit responsive without viewport body overflow and honors reduced motion', () => {
    const mediumFlowRule = cockpitCss.match(/@media\s*\(max-width:\s*1180px\)\s*\{[\s\S]*?\.cockpit-visual-stage__flow\s*\{([^}]*)\}/s)?.[1] ?? '';
    const narrowFlowRule = cockpitCss.match(/@media\s*\(max-width:\s*900px\)\s*\{[\s\S]*?\.cockpit-visual-stage__flow\s*\{([^}]*)\}/s)?.[1] ?? '';

    expect(globalCss).toMatch(/html,\s*body,\s*#root\s*\{[^}]*overflow-x:\s*hidden;/s);
    expect(cockpitCss).toMatch(/@media\s*\(max-width:\s*1440px\)\s*\{[\s\S]*?\.knowledge-workspace-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/);
    expect(cockpitCss).toMatch(/@media\s*\(max-width:\s*1180px\)\s*\{[\s\S]*?\.cockpit-shell\s*\{[^}]*min-width:\s*1176px;/);
    expect(cockpitCss).toMatch(/@media\s*\(max-width:\s*1180px\)\s*\{[\s\S]*?\.cockpit-visual-stage__flow\s*\{[^}]*--visual-stage-flow-opacity:\s*0\.48;[^}]*\}/s);
    expect(cockpitCss).toMatch(/@media\s*\(max-width:\s*900px\)\s*\{[\s\S]*?\.cockpit-shell\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[\s\S]*?\.cockpit-sidebar,\s*\.cockpit-right-panel,\s*\.project-sidebar-content\s*\{[^}]*min-height:\s*auto;/s);
    expect(cockpitCss).toMatch(/@media\s*\(max-width:\s*900px\)\s*\{[\s\S]*?\.cockpit-visual-stage__book\s*\{[^}]*display:\s*none;/s);
    expect(cockpitCss).toMatch(/@media\s*\(min-width:\s*901px\)\s*and\s*\(max-width:\s*1175px\)\s*\{[\s\S]*?\.cockpit-visual-stage__mascot\s*\{[^}]*display:\s*none;/s);
    expect(cockpitCss).toMatch(/@media\s*\(max-width:\s*900px\)\s*\{[\s\S]*?\.cockpit-visual-stage__mascot\s*\{[^}]*display:\s*block;[^}]*left:\s*-18px;[^}]*right:\s*auto;[^}]*bottom:\s*-22px;[^}]*width:\s*64px;/s);
    expect(mediumFlowRule).not.toMatch(/(?:^|\s)opacity:/);
    expect(narrowFlowRule).not.toMatch(/(?:^|\s)opacity:/);
    expect(cockpitCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?transition-duration:\s*0\.01ms\s*!important;/s);
    expect(cockpitCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.cockpit-visual-stage__flow,\s*\.cockpit-visual-stage__book,\s*\.cockpit-visual-stage__mascot\s*\{[^}]*animation:\s*none;/s);
  });

  it('uses an opaque canonical sky color for custom cockpit focus outlines', () => {
    const customFocusOutline = cockpitCss.match(
      /\.focus-mode-toggle:focus-visible,\s*\.chapter-details-button:focus-visible,\s*\.chapter-detail-drawer__close:focus-visible\s*\{([^}]*)\}/s,
    )?.[1];

    expect(customFocusOutline).toMatch(/outline:\s*3px\s+solid\s+var\(--color-sky\);/);
    expect(customFocusOutline).not.toMatch(/color-mix|rgba\(|hsla\(|opacity\s*:/);
  });
});
