import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/features/novelora-cockpit/components/pages/MarkdownDocumentPage.css', 'utf8');

describe('MarkdownDocumentPage CSS contract', () => {
  it('locks the roomy minmax three-column workbench and required regions', () => {
    expect(css).toContain('grid-template-columns: var(--document-tree-column) minmax(0, 2.2fr) var(--document-info-column)');
    expect(css).toContain('--document-tree-column: minmax(236px, 0.82fr)');
    expect(css).toContain('--document-info-column: minmax(252px, 0.96fr)');
    expect(css).toContain(".markdown-document-page[data-document='world']");
    expect(css).toContain('--document-info-column: minmax(292px, 1.12fr)');
    expect(css).toContain('overflow: hidden');
    for (const selector of ['.markdown-document-page__toc', '.markdown-document-page__paper', '.markdown-document-page__info', '.markdown-document-page__card', '.markdown-outline-tree']) {
      expect(css).toContain(selector);
    }
  });

  it('defines the dense editor toolbar and overview progress treatment', () => {
    for (const selector of ['.markdown-document-page__toolbar', '.markdown-document-page__overview-metrics', '.markdown-document-page__progress', '.markdown-document-page__tabs']) {
      expect(css).toContain(selector);
    }
  });

  it('uses Bixin tokens for visual values and preserves reduced motion', () => {
    expect(css).toContain('var(--bixin-card-border)');
    expect(css).toContain('var(--bixin-radius-card)');
    expect(css).toContain('var(--bixin-shadow-card)');
    expect(css).toContain('var(--bixin-motion-fast)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).not.toMatch(/(?:color|background(?:-color)?|border-color)\s*:\s*#[0-9a-f]+/i);
    expect(css).not.toMatch(/border-radius\s*:\s*(?:\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw)|\d+%)/i);
    const boxShadows = [...css.matchAll(/box-shadow\s*:\s*([^;]+);/gi)].map((match) => match[1].trim());
    expect(boxShadows.every((value) => value.startsWith('var('))).toBe(true);
    expect(css).not.toMatch(/(?:transition|animation(?:-duration)?)\s*:[^;]*(?:\d+(?:\.\d+)?)(?:ms|s)/i);
  });

  it('defines a visible tokenized textarea focus state', () => {
    expect(css).toContain('.markdown-document-page textarea:focus-visible');
    expect(css).toContain('outline: 2px solid var(--bixin-green-600)');
    expect(css).not.toContain('outline: none');
  });
});
