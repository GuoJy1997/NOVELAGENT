interface ProgressRingProps {
  value: number;
  subtitle: string;
}

export function ProgressRing({ value, subtitle }: ProgressRingProps) {
  const size = 124;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * (value / 100);

  return (
    <div className="echo-progress-ring" role="img" aria-label={`${value} percent ${subtitle}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="echo-progress-ring__track" cx="62" cy="62" r={radius} />
        <circle
          className="echo-progress-ring__value"
          cx="62"
          cy="62"
          r={radius}
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="echo-progress-ring__label">
        <strong>{value}%</strong>
        <span>{subtitle}</span>
      </div>
    </div>
  );
}
