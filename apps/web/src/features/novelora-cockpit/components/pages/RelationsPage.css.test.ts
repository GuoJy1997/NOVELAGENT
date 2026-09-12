import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/features/novelora-cockpit/components/pages/RelationsPage.css'), 'utf8');

describe('RelationsPage CSS contract', () => {
  it('defines the two-column relation workspace and its surfaces', () => {
    expect(css).toMatch(/\.relations-page__body\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) minmax\(340px, 380px\)/s);
    for (const selector of ['.relations-page__canvas', '.relations-page__canvas-inner', '.relations-page__controls', '.relations-page__detail']) expect(css).toContain(selector);
  });

  it('uses Bixin tokens and reduced-motion behavior', () => {
    expect(css).toContain('transition: transform var(--bixin-motion-fast)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toMatch(/\.relations-page__canvas-inner\s*\{[^}]*transition:\s*transform var\(--bixin-motion-fast\)/s);
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/transition:\s*transform\s+\d/);
  });
});
