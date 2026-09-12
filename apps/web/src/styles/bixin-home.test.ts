import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const homeCss = readFileSync(resolve(process.cwd(), 'src/styles/bixin-home.css'), 'utf8');
const globalCss = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');
const tokensCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');

describe('Bixin home CSS contract', () => {
  it('fits the dashboard into one primary row and one shared lower row', () => {
    const style = document.createElement('style');
    const fixture = document.createElement('div');
    style.textContent = homeCss;
    fixture.innerHTML = `
      <div class="bixin-home__stage">
        <main class="bixin-home__dashboard">
          <div class="bixin-dashboard">
            <div class="bixin-dashboard__cards-row"></div>
            <article class="bixin-dashboard-card bixin-dashboard-card--recent"></article>
            <article class="bixin-dashboard-card bixin-dashboard-card--suggestions"></article>
          </div>
        </main>
      </div>
    `;
    document.head.append(style);
    document.body.append(fixture);

    const stage = fixture.querySelector<HTMLElement>('.bixin-home__stage');
    const dashboard = fixture.querySelector<HTMLElement>('.bixin-dashboard');
    const primaryRow = fixture.querySelector<HTMLElement>('.bixin-dashboard__cards-row');
    const recent = fixture.querySelector<HTMLElement>('.bixin-dashboard-card--recent');
    const suggestions = fixture.querySelector<HTMLElement>('.bixin-dashboard-card--suggestions');

    expect(getComputedStyle(stage!).gridTemplateRows).toBe('calc(465px + var(--bixin-hero-extra, 0px)) minmax(0, 1fr)');
    expect(getComputedStyle(dashboard!).gridTemplateRows).toBe('238px minmax(0, 1fr)');
    expect(getComputedStyle(dashboard!).gridTemplateColumns).toBe('minmax(0, 1.85fr) minmax(0, 1fr)');
    expect(getComputedStyle(dashboard!).height).toBe('100%');
    expect(getComputedStyle(primaryRow!).gridColumn).toBe('1 / -1');
    expect(getComputedStyle(primaryRow!).gridRow).toBe('1');
    expect(getComputedStyle(recent!).gridColumn).toBe('1');
    expect(getComputedStyle(recent!).gridRow).toBe('2');
    expect(getComputedStyle(suggestions!).gridColumn).toBe('2');
    expect(getComputedStyle(suggestions!).gridRow).toBe('2');

    fixture.remove();
    style.remove();
  });

  it('keeps one canonical transparent hero cascade', () => {
    expect(homeCss.match(/\.bixin-dashboard\s*\{/g)).toHaveLength(1);
    expect(homeCss.match(/\.bixin-hero-section\s*\{/g)).toHaveLength(1);
    expect(homeCss).toMatch(/\.bixin-hero-section\s*\{[^}]*position:\s*relative;[^}]*height:\s*420px;[^}]*background:\s*transparent;/s);
    expect(homeCss).toMatch(/#bixin-hero-heading\s*\{[^}]*font-size:\s*96px;[^}]*line-height:\s*1\.08;[^}]*font-weight:\s*900;/s);
    expect(homeCss).toMatch(/\.bixin-hero__copy\s*\{[^}]*display:\s*block;/s);
  });

  it('keeps the Task 3 dashboard cards readable and token-backed', () => {
    expect(homeCss).toMatch(
      /\.bixin-dashboard-card\s*\{[^}]*position:\s*relative;[^}]*min-width:\s*0;[^}]*overflow:\s*hidden;[^}]*padding:\s*16px;[^}]*border-radius:\s*var\(--bixin-radius-card\);[^}]*background:\s*var\(--bixin-card\);[^}]*box-shadow:\s*var\(--bixin-shadow-card\);/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-dashboard-card--challenge\s*\{[^}]*color:\s*var\(--bixin-surface-solid\);[^}]*background:\s*var\(--bixin-gradient-challenge\);/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-dashboard-card--copilot\s*\{[^}]*background:\s*var\(--bixin-gradient-copilot\);/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-dashboard-card--quick\s*\{[^}]*background:\s*var\(--bixin-pop-orange-soft\);/s,
    );

    expect(homeCss).toMatch(
      /\.bixin-dashboard-card--challenge > img,\s*\.bixin-dashboard-card--copilot > img,\s*\.bixin-dashboard-card--quick > img\s*\{[^}]*position:\s*absolute;[^}]*right:\s*12px;[^}]*bottom:\s*12px;[^}]*width:\s*76px;[^}]*height:\s*76px;[^}]*object-fit:\s*contain;/s,
    );

    expect(homeCss).toMatch(
      /\.bixin-dashboard-card--recent \.bixin-recent-projects\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-recent-card\s*\{[^}]*border:\s*1px solid var\(--bixin-card-border\);[^}]*border-radius:\s*var\(--bixin-radius-card-compact\);[^}]*background:\s*var\(--bixin-surface-74\);/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-recent-card > img\s*\{[^}]*width:\s*100%;[^}]*height:\s*60px;[^}]*object-fit:\s*cover;[^}]*border-radius:\s*var\(--bixin-radius-medium\);/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-recent-card__track\s*\{[^}]*overflow:\s*hidden;[^}]*border-radius:\s*var\(--bixin-radius-pill\);[^}]*background:\s*var\(--bixin-ink-06\);/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-recent-card__track span\s*\{[^}]*display:\s*block;[^}]*height:\s*100%;[^}]*border-radius:\s*inherit;[^}]*background:\s*var\(--bixin-green-600\);/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-recent-card--new\s*\{[^}]*place-items:\s*center;[^}]*min-height:\s*130px;[^}]*border-style:\s*dashed;[^}]*text-align:\s*center;/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-dashboard-card--suggestions ul\s*\{[^}]*display:\s*grid;[^}]*gap:\s*5px;[^}]*margin:\s*8px\s+0\s+0;[^}]*padding-left:\s*20px;/s,
    );
  });
  it('fills viewport height in normal flow without a centered fixed-height interface', () => {
    expect(homeCss).toMatch(/\.bixin-home\s*\{[^}]*height:\s*100dvh;[^}]*overflow:\s*auto;/s);
    expect(homeCss).toMatch(/\.bixin-home__frame\s*\{[^}]*position:\s*relative;[^}]*min-height:\s*100%;/s);
    expect(homeCss).toMatch(/\.bixin-scene-layer__canvas,\s*\.bixin-home__interface\s*\{[^}]*height:\s*var\(--bixin-layout-height,[^}]*zoom:\s*var\(--bixin-fit-scale/s);
    expect(homeCss).toMatch(/\.bixin-home__interface\s*\{[^}]*position:\s*relative;/s);
    expect(homeCss).not.toContain('.bixin-scene-layer__ambient');
    expect(homeCss).toMatch(/\.bixin-home\s*\{[^}]*scrollbar-gutter:\s*stable;/s);
  });

  it('locks the scene, interface, and book layers', () => {
    expect(homeCss).toMatch(/\.bixin-scene-layer\s*\{[^}]*inset:\s*0;[^}]*z-index:\s*10;/s);
    expect(homeCss).toMatch(/\.bixin-home__interface\s*\{[^}]*z-index:\s*20;/s);
    expect(homeCss).toMatch(/\.bixin-book-layer\s*\{[^}]*z-index:\s*30;[^}]*pointer-events:\s*none;/s);
  });

  it('uses one uncopied scene image across the canonical canvas', () => {
    expect(homeCss).toMatch(/\.bixin-dashboard__cards-row\s*\{[^}]*grid-template-columns:\s*1\.32fr\s+1fr\s+1fr/s);
    expect(homeCss).toMatch(/\.bixin-scene-layer__base\s*\{[^}]*inset:\s*0;[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*cover;/s);
    expect(homeCss).not.toContain('.bixin-scene-layer__subject');
    expect(homeCss).not.toMatch(/scaleX\(-1\)|rotateY\(180deg\)/);
    expect(homeCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  it('fogs the single scene on workbench pages', () => {
    expect(homeCss).toMatch(/\.bixin-scene-layer--workbench \.bixin-scene-layer__base\s*\{[^}]*filter:/s);
  });

  it('places the book at its fixed overlap onto the dashboard', () => {
    expect(homeCss).toMatch(
      /\.bixin-book-layer img\s*\{[^}]*top:\s*238px;[^}]*left:\s*53%;[^}]*width:\s*520px;/s,
    );
  });

  it('gives workbench pages a frosted panel system', () => {
    expect(homeCss).toMatch(/\.bixin-workbench-page\s*\{/);
    expect(homeCss).toMatch(
      /\.bixin-panel\s*\{[^}]*background:\s*var\(--bixin-card\);[^}]*backdrop-filter:\s*blur\(8px\);/s,
    );
  });

  it('imports Bixin styles and avoids Echo glass dependencies', () => {
    expect(globalCss).toContain("@import './bixin-home.css';");
    expect(homeCss).not.toMatch(/--echo-glass-|--echo-gradient-/);
    expect(tokensCss).toContain('--bixin-green-600: #00b69d;');
  });

  it('restores a visible keyboard focus indicator on the search input', () => {
    expect(homeCss).toMatch(
      /\.bixin-home-topbar input:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--color-focus-ring\);[^}]*outline-offset:\s*3px;/s,
    );
  });

  it('preserves 44px interactive targets and a home-wide focus indicator', () => {
    expect(homeCss).toMatch(
      /\.bixin-navigation-rail__item,\s*\.bixin-home-topbar > button,\s*\.bixin-hero-section button,\s*\.bixin-card button,\s*\.bixin-btn\s*\{[^}]*min-height:\s*44px;/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-home :focus-visible\s*\{[^}]*outline:\s*3px solid var\(--color-focus-ring\);[^}]*outline-offset:\s*3px;/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-card--schedule \.bixin-card__action\s*\{[^}]*min-height:\s*44px;/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-home-topbar > button\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/s,
    );
  });

  it('keeps the profile-selected navigation rail inside the fixed canvas without a visible scrollbar', () => {
    expect(homeCss).toMatch(
      /\.bixin-home__interface\s*\{[^}]*grid-template-columns:\s*var\(--bixin-rail-width\)\s+minmax\(0,\s*1fr\);/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-navigation-rail\s*\{[^}]*gap:\s*4px;[^}]*padding:\s*20px\s+20px\s+16px;[^}]*overflow:\s*hidden;/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-navigation-rail__item\s*\{[^}]*min-height:\s*44px;/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-navigation-rail__promo\s*\{[^}]*margin:\s*6px\s+0\s+0;/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-navigation-rail__stats\s*\{[^}]*margin:\s*6px\s+0\s+0;/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-navigation-rail__footer\s*\{[^}]*gap:\s*10px;/s,
    );
  });

  it('positions the homepage header and transparent hero on the reference stage', () => {
    expect(homeCss).toMatch(
      /\.bixin-home__stage\s*\{[^}]*grid-template-rows:\s*calc\(465px \+ var\(--bixin-hero-extra, 0px\)\)\s+minmax\(0,\s*1fr\);[^}]*padding:\s*0\s+var\(--bixin-workbench-inset-end\)\s+var\(--bixin-workbench-bottom\)\s+var\(--bixin-workbench-inset-start\);/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-home-topbar\s*\{[^}]*top:\s*var\(--bixin-topbar-top\);[^}]*left:\s*var\(--bixin-topbar-left\);[^}]*right:\s*var\(--bixin-topbar-right\);/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-home-topbar label\s*\{[^}]*width:\s*100%;[^}]*height:\s*52px;/s,
    );
    expect(homeCss).toMatch(/\.bixin-home-topbar form\s*\{[^}]*flex:\s*0 1 var\(--bixin-topbar-search-width\);/s);
    expect(homeCss).not.toContain('.bixin-hero__backdrop');
    expect(homeCss).not.toContain('.bixin-hero__robot');
  });

  it('defines a native writing profile without changing the canonical home geometry', () => {
    expect(homeCss).toMatch(
      /\.bixin-home\s*\{[^}]*--bixin-design-width:\s*1672px;[^}]*--bixin-design-height:\s*941px;[^}]*--bixin-rail-width:\s*272px;/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-home--writing\s*\{[^}]*--bixin-design-width:\s*1536px;[^}]*--bixin-design-height:\s*1024px;[^}]*--bixin-rail-width:\s*228px;[^}]*--bixin-workbench-inset-start:\s*12px;[^}]*--bixin-workbench-inset-end:\s*12px;[^}]*--bixin-workbench-top:\s*136px;[^}]*--bixin-workbench-bottom:\s*14px;/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-home--writing \.bixin-home-topbar\s*\{[^}]*--bixin-topbar-top:\s*24px;[^}]*--bixin-topbar-left:\s*255px;[^}]*--bixin-topbar-search-width:\s*456px;/s,
    );
  });

  it('styles the workspace picker, chapter setup, and domain onboarding', () => {
    expect(homeCss).toMatch(
      /\.bixin-picker\s*\{[^}]*background:\s*var\(--bixin-surface-58\);/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-picker__panel\s*\{[^}]*background:\s*var\(--bixin-surface-solid\);[^}]*box-shadow:\s*var\(--bixin-shadow-frame\);[^}]*border-radius:\s*var\(--bixin-radius-card\);/s,
    );
    expect(homeCss).toMatch(/\.bixin-setup(?:\s*,\s*\.bixin-onboarding)?\s*\{/);
    expect(homeCss).toMatch(/\.bixin-onboarding\s*\{/);
  });

  it('exposes shared Bixin buttons for workbench pages', () => {
    expect(homeCss).toMatch(
      /\.bixin-btn--primary\s*\{[^}]*background:\s*var\(--bixin-green-600\);/s,
    );
    expect(homeCss).not.toMatch(/\.bixin-btn[^{]*\{[^}]*--echo-/s);
  });

  it('gives non-home workbench pages a scrollable stage below the chrome', () => {
    expect(homeCss).toMatch(
      /\.bixin-home__workbench\s*\{[^}]*min-height:\s*0;[^}]*height:\s*100%;[^}]*overflow:\s*auto;/s,
    );
    const workbenchStageRule = homeCss.match(/\.bixin-home__stage--workbench\s*\{[^}]*\}/s)?.[0] ?? '';
    expect(workbenchStageRule).toMatch(/grid-template-rows:\s*minmax\(0,\s*1fr\);/);
    expect(workbenchStageRule).toMatch(/padding-top:\s*var\(--bixin-workbench-top\);/);
    expect(workbenchStageRule).not.toMatch(/465px/);
  });

  it('keeps Bixin visual decisions token-first', () => {
    const declarations = homeCss.split('\n').map((line) => line.trim());
    const rawColors = declarations.filter(
      (line) =>
        /#[0-9a-f]{3,8}\b|rgba?\(|:\s*white\s*;/i.test(line) &&
        !(line.includes('mask-image:') && line.includes('#000')),
    );
    const rawShadows = declarations.filter(
      (line) =>
        line.startsWith('box-shadow:') &&
        !/box-shadow:\s*(?:var\(--bixin-|none;)/.test(line),
    );
    const rawRadii = declarations.filter(
      (line) =>
        line.startsWith('border-radius:') &&
        !/border-radius:\s*(?:var\(--bixin-|inherit;)/.test(line),
    );
    const rawMotion = declarations.filter(
      (line) => /\b\d+ms\b|\bease(?:-in|-out|-in-out)?\b/.test(line),
    );

    expect(rawColors).toEqual([]);
    expect(rawShadows).toEqual([]);
    expect(rawRadii).toEqual([]);
    expect(rawMotion).toEqual([]);
  });

  it('uses a token for chart bars and the topbar avatar radius', () => {
    expect(tokensCss).toContain('--bixin-radius-chart-bar: 2px;');
    expect(homeCss).toMatch(
      /\.bixin-navigation-rail__bars span\s*\{[^}]*border-radius:\s*var\(--bixin-radius-chart-bar\);/s,
    );
    expect(homeCss).toMatch(
      /\.bixin-home-topbar__avatar img\s*\{[^}]*border-radius:\s*var\(--bixin-radius-circle\);/s,
    );
    expect(homeCss).not.toMatch(/\.bixin-navigation-rail__bars span\s*\{[^}]*border-radius:\s*2px/s);
    expect(homeCss).not.toMatch(/\.bixin-home-topbar__avatar img\s*\{[^}]*border-radius:\s*50%/s);
  });
});
