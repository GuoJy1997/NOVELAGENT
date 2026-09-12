import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const writingCss = readFileSync(resolve(process.cwd(), 'src/features/novelora-cockpit/components/writing/WritingView.css'), 'utf8');

describe('Bixin writing CSS contract', () => {
  it('uses Bixin tokens and does not lean on Echo glass', () => {
    expect(writingCss).toMatch(/\.bixin-writing\s*\{/);
    expect(writingCss).toMatch(/var\(--bixin-card\)/);
    expect(writingCss).toMatch(/var\(--bixin-green-600\)/);
    expect(writingCss).toMatch(/var\(--bixin-radius-card/);
    expect(writingCss).not.toMatch(/--echo-/);
    expect(writingCss).not.toMatch(/text-transform:\s*uppercase/);
  });

  it('scopes status badge colors beyond the generic last-child rule', () => {
    expect(writingCss).toMatch(/\.bixin-chapter-list button > \.bixin-chapter-list__badge\[data-status='complete'\]\s*\{[^}]*color:\s*var\(--bixin-green-700\)[^}]*background:\s*var\(--bixin-green-100\)/s);
    expect(writingCss).toMatch(/\.bixin-chapter-list button > \.bixin-chapter-list__badge\[data-status='drafting'\]\s*\{[^}]*color:\s*var\(--bixin-pop-yellow-ink\)[^}]*background:\s*var\(--bixin-pop-yellow-soft\)/s);
    expect(writingCss).toMatch(/\.bixin-chapter-list button > \.bixin-chapter-list__badge\[data-status='revision'\]\s*\{[^}]*color:\s*var\(--bixin-pop-blue\)[^}]*background:\s*var\(--bixin-pop-blue-soft\)/s);
    expect(writingCss).toMatch(/\.bixin-chapter-list button > \.bixin-chapter-list__badge\[data-status='published'\]\s*\{[^}]*color:\s*var\(--bixin-pop-cyan\)[^}]*background:\s*var\(--bixin-pop-cyan-soft\)/s);
  });

  it('reserves a non-clipping 280 / 605 / 372 writing stage at the reference viewport', () => {
    expect(writingCss).toMatch(/\.bixin-writing\s*\{[^}]*width:\s*100%[^}]*max-width:\s*1286px[^}]*grid-template-columns:\s*minmax\(250px,\s*280px\)\s+minmax\(0,\s*605px\)\s+minmax\(320px,\s*372px\)/s);
    expect(writingCss).toMatch(/\.bixin-writing__editor\s*\{[^}]*padding:\s*0[^}]*background:\s*var\(--bixin-surface-solid\)/s);
  });
});
