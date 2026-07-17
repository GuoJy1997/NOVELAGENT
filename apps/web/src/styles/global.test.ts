import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const globalCss = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');
const cockpitCss = readFileSync(resolve(process.cwd(), 'src/styles/cockpit.css'), 'utf8');
const tokensCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');

describe('global cockpit texture', () => {
  it('keeps the visual stage out of the cockpit grid and input flow', () => {
    const visualStageRule =
      cockpitCss.match(/\.cockpit-visual-stage\s*\{([^}]*)\}/s)?.[1] ?? '';

    expect(visualStageRule).toMatch(/position:\s*fixed;/);
    expect(visualStageRule).toMatch(/inset:\s*0;/);
    expect(visualStageRule).toMatch(/pointer-events:\s*none;/);
    expect(visualStageRule).toMatch(/overflow:\s*hidden;/);
  });

  it('layers visual-stage art around the readable cockpit planes', () => {
    const ambientRule = cockpitCss.match(/(?:^|})\s*\.cockpit-visual-stage__ambient\s*\{([^}]*)\}/s)?.[1] ?? '';
    const flowRule = cockpitCss.match(/(?:^|})\s*\.cockpit-visual-stage__flow\s*\{([^}]*)\}/s)?.[1] ?? '';
    const bookRule = cockpitCss.match(/(?:^|})\s*\.cockpit-visual-stage__book\s*\{([^}]*)\}/s)?.[1] ?? '';
    const mascotRule = cockpitCss.match(/(?:^|})\s*\.cockpit-visual-stage__mascot\s*\{([^}]*)\}/s)?.[1] ?? '';
    const drawerBackdropRule = cockpitCss.match(/(?:^|})\s*\.chapter-drawer-backdrop\s*\{([^}]*)\}/s)?.[1] ?? '';

    expect(ambientRule).toMatch(/z-index:\s*0;/);
    expect(flowRule).toMatch(/z-index:\s*1;/);
    expect(bookRule).toMatch(/z-index:\s*2;/);
    expect(mascotRule).toMatch(/z-index:\s*5;/);
    expect(cockpitCss).toMatch(/\.cockpit-sidebar,\s*\.cockpit-workspace,\s*\.cockpit-right-panel\s*\{[^}]*z-index:\s*3;/s);
    expect(drawerBackdropRule).toMatch(/z-index:\s*10;/);
  });

  it('uses the approved visual-stage motion and reading-plane recipe', () => {
    const flowRule = cockpitCss.match(/(?:^|})\s*\.cockpit-visual-stage__flow\s*\{([^}]*)\}/s)?.[1] ?? '';
    const bookRule = cockpitCss.match(/(?:^|})\s*\.cockpit-visual-stage__book\s*\{([^}]*)\}/s)?.[1] ?? '';
    const mascotRule = cockpitCss.match(/(?:^|})\s*\.cockpit-visual-stage__mascot\s*\{([^}]*)\}/s)?.[1] ?? '';
    const workspaceRule = cockpitCss.match(/(?:^|})\s*\.cockpit-workspace\s*\{([^}]*)\}/s)?.[1] ?? '';

    expect(flowRule).toMatch(/cockpit-flow-breathe\s+var\(--visual-stage-breathe\)\s+700ms;/);
    expect(bookRule).toMatch(/filter:\s*drop-shadow\(0\s+30px\s+32px\s+rgba\(39,\s*104,\s*78,\s*0\.18\)\);/);
    expect(bookRule).toMatch(/animation:\s*cockpit-book-enter\s+var\(--visual-stage-enter\)\s+90ms\s+both;/);
    expect(mascotRule).toMatch(/filter:\s*drop-shadow\(0\s+28px\s+32px\s+rgba\(38,\s*97,\s*76,\s*0\.2\)\);/);
    expect(mascotRule).toMatch(/animation:\s*cockpit-mascot-enter\s+var\(--visual-stage-enter\)\s+150ms\s+both;/);
    expect(workspaceRule).toMatch(/background:\s*linear-gradient\(180deg,\s*rgba\(255,\s*255,\s*255,\s*0\.34\),\s*rgba\(247,\s*252,\s*249,\s*0\.52\)\);/);
    expect(workspaceRule).toMatch(/backdrop-filter:\s*blur\(6px\);/);
  });

  it('defines stable visual-stage sizing and motion tokens', () => {
    expect(tokensCss).toMatch(/--visual-stage-flow-opacity:\s*0\.62;/);
    expect(tokensCss).toMatch(/--visual-stage-book-width:\s*clamp\(430px,\s*34vw,\s*650px\);/);
    expect(tokensCss).toMatch(/--visual-stage-mascot-width:\s*clamp\(250px,\s*20vw,\s*380px\);/);
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
    expect(globalCss).toMatch(/html,\s*body,\s*#root\s*\{[^}]*overflow-x:\s*hidden;/s);
    expect(cockpitCss).toMatch(/@media\s*\(max-width:\s*1440px\)\s*\{[\s\S]*?\.knowledge-workspace-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/);
    expect(cockpitCss).toMatch(/@media\s*\(max-width:\s*1180px\)\s*\{[\s\S]*?\.cockpit-shell\s*\{[^}]*min-width:\s*1176px;/);
    expect(cockpitCss).toMatch(/@media\s*\(max-width:\s*900px\)\s*\{[\s\S]*?\.cockpit-shell\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[\s\S]*?\.cockpit-sidebar,\s*\.cockpit-right-panel,\s*\.project-sidebar-content\s*\{[^}]*min-height:\s*auto;/s);
    expect(cockpitCss).toMatch(/@media\s*\(max-width:\s*900px\)\s*\{[\s\S]*?\.cockpit-visual-stage__book\s*\{[^}]*display:\s*none;/s);
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
