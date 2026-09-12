import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  label: string;
};

export function IconButton({ icon, label, className, ...props }: Props) {
  return (
    <button aria-label={label} title={label} className={cn('icon-chip', className)} {...props}>
      {icon}
    </button>
  );
}
