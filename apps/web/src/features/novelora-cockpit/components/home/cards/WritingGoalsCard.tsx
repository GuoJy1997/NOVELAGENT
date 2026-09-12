import { Target } from 'lucide-react';
import type { ComponentPropsWithoutRef, CSSProperties } from 'react';
import type { HomeDashboardView } from '../../../data/homeDashboardView';
import { BixinProgressRing } from '../ui/BixinProgressRing';

interface WritingGoalsCardProps extends ComponentPropsWithoutRef<'section'> {
  view: HomeDashboardView['writingGoals'];
}

export function WritingGoalsCard({ className, view, ...sectionProps }: WritingGoalsCardProps) {
  return (
    <section
      {...sectionProps}
      className={['bixin-card', 'bixin-card--goals', className].filter(Boolean).join(' ')}
      aria-labelledby="bixin-goals-title"
    >
      <header className="bixin-card__header">
        <Target aria-hidden="true" />
        <h2 id="bixin-goals-title">写作目标</h2>
      </header>
      <div className="bixin-goals__content">
        <BixinProgressRing value={view.progress} label="目标完成度" />
        <ul className="bixin-goals__list">
          {view.items.map((item) => (
            <li key={item.label}>
              <div className="bixin-goals__label">
                <span>{item.label}</span>
                <span>{item.current}/{item.total}</span>
              </div>
              <div
                className="bixin-goals__track"
                role="progressbar"
                aria-label={item.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={item.percent}
              >
                <span
                  className="bixin-goals__fill"
                  style={{ '--bixin-goal-progress': `${item.percent}%` } as CSSProperties}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
