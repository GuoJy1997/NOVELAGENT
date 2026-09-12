import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { chapterProgress, chapterSummary } from '@/data/home';
import { Funnel } from 'lucide-react';

export function ChapterProgressCard() {
  return (
    <Card className="h-full p-7">
      <div className="mb-6 flex items-center gap-3 text-[18px] font-semibold text-neutral-900">
        <Funnel size={20} className="text-bixin-600" />
        章节奋斗
      </div>
      <div className="flex items-center gap-6">
        <div className="min-w-0 flex-1 space-y-3">
          {chapterProgress.map((item) => (
            <div
              key={item.label}
              className={item.highlight ? 'progress-pill progress-pill-active' : 'progress-pill progress-pill-idle'}
            >
              <span>{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
          <div className="pt-2 text-[14px] text-neutral-500">✦ {chapterSummary.join('　')}</div>
        </div>
        <ProgressRing value={35} />
      </div>
    </Card>
  );
}
