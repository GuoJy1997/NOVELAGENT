import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const globalCss = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');
const cockpitCss = readFileSync(resolve(process.cwd(), 'src/styles/cockpit.css'), 'utf8');
const tokensCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');

describe('global cockpit texture', () => {
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

  it('provides opaque reading-plane fallbacks before enabling supported blur', () => {
    const sideFallback = cockpitCss.match(/\.cockpit-sidebar,\s*\.cockpit-right-panel\s*\{([^}]*)\}/s)?.[1] ?? '';
    const workspaceFallback = cockpitCss.match(/(?:^|})\s*\.cockpit-workspace\s*\{([^}]*)\}/s)?.[1] ?? '';
    const supportsStart = cockpitCss.indexOf('@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))');

    expect(sideFallback).toMatch(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.9\d*\);/);
    expect(sideFallback).not.toMatch(/backdrop-filter/);
    expect(workspaceFallback).toMatch(/background:\s*linear-gradient\(/);
    expect(workspaceFallback.match(/rgba\([^)]*,\s*(0\.\d+)\)/g)).toHaveLength(2);
    for (const alpha of workspaceFallback.matchAll(/rgba\([^)]*,\s*(0\.\d+)\)/g)) {
      expect(Number(alpha[1])).toBeGreaterThanOrEqual(0.9);
    }
    expect(workspaceFallback).not.toMatch(/backdrop-filter/);
    expect(supportsStart).toBeGreaterThan(cockpitCss.indexOf('.cockpit-workspace'));
    expect(cockpitCss).toMatch(/@supports[\s\S]*?\.cockpit-workspace\s*\{[^}]*rgba\(255,\s*255,\s*255,\s*0\.34\)[^}]*rgba\(247,\s*252,\s*249,\s*0\.52\)[^}]*backdrop-filter:\s*blur\(/s);
    expect(cockpitCss).toMatch(/@supports[\s\S]*?\.cockpit-sidebar,\s*\.cockpit-right-panel\s*\{[^}]*rgba\(255,\s*255,\s*255,\s*0\.72\)[^}]*backdrop-filter:\s*blur\(/s);
  });

  it('defines stable visual-stage sizing and motion tokens', () => {
    expect(tokensCss).toMatch(/--visual-stage-flow-opacity:\s*0\.62;/);
    expect(tokensCss).toMatch(/--visual-stage-book-width:\s*clamp\(430px,\s*34vw,\s*650px\);/);
    expect(tokensCss).not.toMatch(/--visual-stage-mascot-width:/);
    expect(tokensCss).toMatch(/--visual-stage-enter:\s*620ms\s+cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\);/);
    expect(tokensCss).toMatch(/--visual-stage-breathe:\s*10s\s+ease-in-out\s+infinite\s+alternate;/);
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
