import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Chip({ children, active = false, className }: { children: ReactNode; active?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium', active ? 'bg-bixin-600 text-white' : 'bg-white/[0.72] text-neutral-600', className)}>
      {children}
    </span>
  );
}
