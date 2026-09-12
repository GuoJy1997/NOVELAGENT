import type { ReactNode } from 'react';

export function Tag({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-lg border border-white/70 bg-white/[0.65] px-2.5 py-1 text-[12px] text-neutral-600">{children}</span>;
}
