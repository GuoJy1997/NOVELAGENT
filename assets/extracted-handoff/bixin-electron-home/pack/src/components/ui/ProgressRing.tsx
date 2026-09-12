export function ProgressRing({ value, size = 124, subtitle = '整体进度' }: { value: number; size?: number; subtitle?: string }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * (value / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e7ece8" strokeWidth="8" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#19a34a"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-[26px] font-semibold text-neutral-900">{value}%</div>
        <div className="mt-1 text-[13px] text-neutral-500">{subtitle}</div>
      </div>
    </div>
  );
}
