import { describe, expect, it } from 'vitest';
import { computeViewportLayout } from './useFitScale';

describe('viewport layout', () => {
  it.each([[978, 832], [1254, 900], [1672, 1200], [1920, 1400]])('fills a taller %i by %i window without letterboxing', (width, height) => {
    const layout = computeViewportLayout(width, height);
    expect(layout.width * layout.scale).toBeCloseTo(width);
    expect(layout.height * layout.scale).toBeCloseTo(height);
  });
  it.each([[1672, 941, 1672, 941], [1536, 1024, 1536, 1024]])('preserves native reference geometry', (width, height, designWidth, designHeight) => {
    expect(computeViewportLayout(width, height, designWidth, designHeight)).toEqual({ scale: 1, width, height });
  });
  it('allows vertical scrolling in short windows instead of horizontal gutters', () => {
    expect(computeViewportLayout(1672, 650)).toEqual({ scale: 1, width: 1672, height: 941 });
  });
  it('recomputes height when the same window becomes shorter', () => {
    expect(computeViewportLayout(978, 1200).height).toBeGreaterThan(computeViewportLayout(978, 832).height);
  });
  it('uses safe dimensions before the viewport is measurable', () => {
    expect(computeViewportLayout(0, 0)).toEqual({ scale: 1, width: 1672, height: 941 });
    expect(computeViewportLayout(Number.NaN, -1)).toEqual({ scale: 1, width: 1672, height: 941 });
  });
});
