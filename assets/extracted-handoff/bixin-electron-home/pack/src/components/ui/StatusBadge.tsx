import { cn } from '@/lib/cn';

const tones = {
  success: 'bg-bixin-100 text-bixin-700',
  neutral: 'bg-neutral-100 text-neutral-600',
  warning: 'bg-amber-50 text-amber-700',
  info: 'bg-sky-50 text-sky-700'
};

export function StatusBadge({ label, tone = 'success', className }: { label: string; tone?: keyof typeof tones; className?: string }) {
  return <span className={cn('inline-flex rounded-full px-3 py-1 text-[12px] font-semibold', tones[tone], className)}>{label}</span>;
}
