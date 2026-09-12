import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
  className?: string;
};

export function Button({ children, variant = 'primary', icon, className }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-14 items-center gap-3 rounded-[18px] px-7 text-[16px] font-semibold transition-all duration-200',
        variant === 'primary'
          ? 'bg-bixin-600 text-white shadow-soft hover:bg-bixin-700'
          : 'border border-white/75 bg-white/[0.84] text-ink shadow-soft backdrop-blur hover:bg-white',
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
