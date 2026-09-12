import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/features/novelora-cockpit/components/pages/WorkflowCanvasPage.css'), 'utf8');
const tokens = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');

describe('WorkflowCanvasPage visual contracts', () => {
  it('uses the approved tone tokens and selected shadow token', () => {
    const tones = { blue: 'blue', purple: 'purple', cyan: 'cyan', yellow: 'yellow', orange: 'orange' };
    for (const [tone, token] of Object.entries(tones)) {
      expect(css).toMatch(new RegExp(`\\.workflow-node\\[data-tone=['"]${tone}['"]\\][^{]*\\{[^}]*border-left: 4px solid var\\(--bixin-pop-${token}\\);[^}]*background: var\\(--bixin-pop-${token}-soft\\);`, 's'));
    }
    expect(css).toMatch(/\.workflow-canvas-page__edges path\s*\{[^}]*fill:\s*none;[^}]*stroke:\s*var\(--bixin-green-600\);/s);
    expect(css).toMatch(/\.workflow-canvas-page__edges path\.is-loop\s*\{[^}]*stroke:\s*var\(--color-state-danger\);[^}]*stroke-dasharray:\s*6 4;/s);
    expect(css).toMatch(/\.workflow-canvas-page__edges text\s*\{[^}]*fill:\s*var\(--bixin-muted\);/s);
    expect(css).toContain('box-shadow: var(--bixin-shadow-node-selected)');
    expect(css).toMatch(/\.workflow-node\.is-selected[^{]*\{[^}]*box-shadow:\s*var\(--bixin-shadow-node-selected\)/s);
    expect(tokens).toMatch(/--bixin-shadow-node-selected:\s*0 0 0 2px var\(--bixin-green-600\);/);
    expect(css).not.toMatch(/#[0-9a-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(/i);
    expect(css).not.toMatch(/border-radius:\s*\d+(?:px|%)/);
    expect(Array.from(css.matchAll(/box-shadow:\s*([^;}]+)/g)).every((match) => match[1].trim().startsWith('var('))).toBe(true);
    expect(css).not.toMatch(/(?:transition|animation(?:-duration)?):[^;]*(?:\d+ms|\d+s)/);
  });

  it('keeps the three-column canvas layout and accessible focus/reduced motion hooks', () => {
    expect(css).toMatch(/grid-template-columns:\s*128px minmax\(0, 1fr\) 248px/);
    expect(css).toMatch(/:focus-visible/);
    expect(css).toMatch(/prefers-reduced-motion/);
  });
});
