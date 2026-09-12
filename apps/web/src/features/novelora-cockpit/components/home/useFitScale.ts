import { useCallback, useLayoutEffect, useRef } from 'react';

export const FIT_DESIGN_WIDTH = 1672;
export const FIT_DESIGN_HEIGHT = 941;

/** Preserve horizontal proportions while letting the interface fill viewport height.
 * Short windows scroll vertically rather than centering a smaller composition.
 */
export function computeViewportLayout(
  containerWidth: number,
  containerHeight: number,
  designWidth = FIT_DESIGN_WIDTH,
  designHeight = FIT_DESIGN_HEIGHT,
) {
  const measurable = Number.isFinite(containerWidth) && Number.isFinite(containerHeight)
    && containerWidth > 0 && containerHeight > 0;
  const scale = measurable ? containerWidth / designWidth : 1;
  return {
    scale,
    width: designWidth,
    height: measurable ? Math.max(designHeight, containerHeight / scale) : designHeight,
  };
}

interface FitScaleProfile {
  designWidth?: number;
  designHeight?: number;
}

export function useFitScale({ designWidth = FIT_DESIGN_WIDTH, designHeight = FIT_DESIGN_HEIGHT }: FitScaleProfile = {}) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const apply = useCallback((element: HTMLDivElement) => {
    // Measure the viewport, not the content: otherwise a tall layout cannot shrink.
    const viewport = element.parentElement;
    if (!viewport) return;
    const layout = computeViewportLayout(viewport.clientWidth, viewport.clientHeight, designWidth, designHeight);
    element.style.setProperty('--bixin-fit-scale', String(layout.scale));
    element.style.setProperty('--bixin-layout-height', `${layout.height}px`);
  }, [designHeight, designWidth]);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element || !element.parentElement) return;
    apply(element);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => apply(element));
    observer.observe(element.parentElement);
    return () => observer.disconnect();
  }, [apply]);

  return elementRef;
}
