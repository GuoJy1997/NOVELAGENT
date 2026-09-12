import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/features/novelora-cockpit/components/pages/CharactersPage.css'), 'utf8');

describe('CharactersPage CSS contract', () => {
  it('keeps the reference-sized searchable rail and asymmetric detail grid', () => {
    expect(css).toMatch(/grid-template-columns:\s*325px\s+minmax\(0,\s*1fr\)/);
    expect(css).toContain('grid-template-areas:');
    expect(css).toContain('"profile arc goal"');
    expect(css).toContain('var(--bixin-radius-circle)');
    expect(css).not.toMatch(/border-radius:\s*50%/);
  });

  it('defines required surfaces without raw visual values', () => {
    for (const selector of ['.characters-page__banner', '.characters-page__list', '.characters-page__grid', '.character-arc-chart', '.characters-page__card']) expect(css).toContain(selector);
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/border-radius:\s*\d/);
    expect(css.split('\n').filter((line) => line.includes('box-shadow:')).every((line) => line.includes('box-shadow: var('))).toBe(true);
  });
});
