import { Card } from '@/components/ui/Card';
import { schedule } from '@/data/home';
import { CalendarCheck2 } from 'lucide-react';

export function ScheduleCard() {
  return (
    <Card className="h-full p-6">
      <div className="mb-4 flex items-center gap-3 text-[18px] font-semibold text-neutral-900">
        <CalendarCheck2 size={20} className="text-bixin-600" />
        世界观与场景日程
      </div>
      <div className="space-y-3">
        {schedule.map((item) => (
          <div key={item.title} className="rounded-[18px] border border-white/70 bg-white/80 px-4 py-3 shadow-[inset_0_1px_rgba(255,255,255,0.7)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[15px] font-medium text-neutral-900">{item.title}</div>
                <div className="mt-1 text-[13px] text-neutral-500">{item.subtitle}</div>
              </div>
              <span className="rounded-full bg-bixin-100 px-3 py-1 text-[12px] font-medium text-bixin-700">{item.badge}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-4 w-full text-center text-[15px] font-semibold text-bixin-700">＋ 添加条目</button>
    </Card>
  );
}
