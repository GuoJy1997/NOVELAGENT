import { UserRound } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Avatar({ src, alt = '', fallback, size = 'md', className }: { src?: string; alt?: string; fallback?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'h-8 w-8', md: 'h-11 w-11', lg: 'h-14 w-14' };
  return (
    <div className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-bixin-100 text-bixin-700', sizes[size], className)}>
      {src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : fallback ? <span className="font-semibold">{fallback.slice(0, 1)}</span> : <UserRound size={18} />}
    </div>
  );
}
