import { ListChecks } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import type { HomeDashboardView } from '../../../data/homeDashboardView';
import { BixinProgressRing } from '../ui/BixinProgressRing';

interface ChapterProgressCardProps extends ComponentPropsWithoutRef<'section'> {
  view: Pick<HomeDashboardView, 'chapterStages' | 'chapterProgress'>;
}

export function ChapterProgressCard({ className, view, ...sectionProps }: ChapterProgressCardProps) {
  return (
    <section
      {...sectionProps}
      className={['bixin-card', 'bixin-card--chapters', className].filter(Boolean).join(' ')}
      aria-labelledby="bixin-chapters-title"
    >
      <header className="bixin-card__header">
        <ListChecks aria-hidden="true" />
        <h2 id="bixin-chapters-title">章节奋斗</h2>
      </header>
      <div className="bixin-chapters__content">
        <ul className="bixin-chapters__stages">
          {view.chapterStages.map((stage) => (
            <li
              key={stage.label}
              className={'active' in stage && stage.active ? 'bixin-chapters__stage--active' : undefined}
            >
              <span>{stage.label}</span>
              <strong>{stage.value}</strong>
            </li>
          ))}
        </ul>
        <BixinProgressRing value={view.chapterProgress} label="总体进度" />
      </div>
    </section>
  );
}
