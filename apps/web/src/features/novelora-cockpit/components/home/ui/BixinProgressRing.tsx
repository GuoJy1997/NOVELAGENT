import type { CSSProperties } from 'react';

interface BixinProgressRingProps {
  value: number;
  label: string;
}

export function BixinProgressRing({ value, label }: BixinProgressRingProps) {
  return (
    <div
      className="bixin-progress-ring"
      role="img"
      aria-label={`${label} ${value}%`}
      style={{ '--bixin-progress': `${value * 3.6}deg` } as CSSProperties}
    >
      <span>
        <strong>{value}%</strong>
        <small>{label}</small>
      </span>
    </div>
  );
}
