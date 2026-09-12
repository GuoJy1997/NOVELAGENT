import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const tokensCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');

const requiredTokens = {
  '--bixin-pop-purple': '#7c5bd6',
  '--bixin-pop-purple-soft': '#efeafc',
  '--bixin-pop-blue': '#4f7df9',
  '--bixin-pop-blue-soft': '#eaf0fe',
  '--bixin-pop-pink': '#f2789f',
  '--bixin-pop-pink-soft': '#fdeef3',
  '--bixin-pop-orange': '#f08c3a',
  '--bixin-pop-orange-soft': '#fdf3e7',
  '--bixin-pop-yellow': '#f5c542',
  '--bixin-pop-yellow-soft': '#fdf8e3',
  '--bixin-pop-cyan': '#2fb7a5',
  '--bixin-pop-cyan-soft': '#e6f7f4',
  '--bixin-gradient-cta': 'linear-gradient(160deg, #51dfcb, #00b69d 65%)',
  '--bixin-gradient-challenge': 'linear-gradient(135deg, #a77cf3, #e7d8ff 60%, #f4edff)',
  '--bixin-gradient-copilot': 'linear-gradient(140deg, #8edbff, #dff4ff 58%, #f2fbff)',
  '--bixin-shadow-pop': '0 14px 32px rgb(16 20 19 / 10%)',
} as const;

describe('Bixin pop tokens', () => {
  it('defines each required token exactly once', () => {
    for (const [name, value] of Object.entries(requiredTokens)) {
      const declaration = new RegExp(`${name}:\\s*([^;]+);`, 'g');
      const matches = Array.from(tokensCss.matchAll(declaration));
      expect(matches).toHaveLength(1);
      expect(matches[0]?.[1]?.trim()).toBe(value);
    }
  });

  it('does not retain deprecated accent hex values', () => {
    expect(tokensCss).not.toContain('#8f67ff');
    expect(tokensCss).not.toContain('#ff6b57');
    expect(tokensCss).not.toContain('#3a86ff');
  });
});
