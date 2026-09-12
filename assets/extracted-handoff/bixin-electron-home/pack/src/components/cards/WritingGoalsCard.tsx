import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { goalStats } from '@/data/home';
import { BadgeCheck } from 'lucide-react';

export function WritingGoalsCard() {
  return (
    <Card className="h-full p-7">
      <div className="mb-5 flex items-center gap-3 text-[18px] font-semibold text-neutral-900">
        <BadgeCheck size={20} className="text-bixin-600" />
        写作目标
      </div>
      <div className="grid grid-cols-[142px_1fr] gap-6">
        <ProgressRing value={goalStats.progress} subtitle="本月目标" />
        <div className="space-y-5 pt-2">
          {goalStats.items.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-3 text-[14px] text-neutral-600">
                <span>{item.label}</span>
                <span>{item.current}/{item.total}</span>
              </div>
              <div className="h-2.5 rounded-full bg-neutral-100">
                <div className="h-2.5 rounded-full bg-bixin-600" style={{ width: `${item.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
