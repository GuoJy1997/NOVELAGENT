export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2.5 overflow-hidden rounded-full bg-neutral-100 ${className}`}>
      <div className="h-full rounded-full bg-bixin-600" style={{ width: `${safeValue}%` }} />
    </div>
  );
}
