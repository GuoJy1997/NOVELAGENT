import type { ReactNode } from 'react';

interface OccludedPanelProps {
  children: ReactNode;
  className?: string;
  labelledBy: string;
}

export function OccludedPanel({ children, className, labelledBy }: OccludedPanelProps) {
  const panelClassName = ['occluded-panel', className].filter(Boolean).join(' ');

  return (
    <section className={panelClassName} aria-labelledby={labelledBy}>
      <div className="occluded-panel__surface" aria-hidden="true" />
      <div
        className="occluded-panel__top-cap occluded-panel__top-cap--left"
        aria-hidden="true"
      />
      <div
        className="occluded-panel__top-cap occluded-panel__top-cap--right"
        aria-hidden="true"
      />
      <div className="occluded-panel__content">{children}</div>
    </section>
  );
}
