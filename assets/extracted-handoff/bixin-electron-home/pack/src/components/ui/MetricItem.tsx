import type { ReactNode } from 'react';

export function MetricItem({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {icon ? <span className="text-bixin-600">{icon}</span> : null}
      <div>
        <div className="text-[19px] font-semibold text-neutral-900">{value}</div>
        <div className="mt-1 text-[12px] text-neutral-500">{label}</div>
      </div>
    </div>
  );
}
