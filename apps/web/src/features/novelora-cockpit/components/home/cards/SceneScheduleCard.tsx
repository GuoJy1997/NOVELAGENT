import { MapPinned, Plus } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import type { HomeDashboardView } from '../../../data/homeDashboardView';

interface SceneScheduleCardProps extends ComponentPropsWithoutRef<'section'> {
  onAddSchedule: () => void;
  view: HomeDashboardView['schedule'];
}

export function SceneScheduleCard({
  className,
  onAddSchedule,
  view,
  ...sectionProps
}: SceneScheduleCardProps) {
  return (
    <section
      {...sectionProps}
      className={['bixin-card', 'bixin-card--schedule', className].filter(Boolean).join(' ')}
      aria-labelledby="bixin-schedule-title"
    >
      <header className="bixin-card__header">
        <MapPinned aria-hidden="true" />
        <h2 id="bixin-schedule-title">世界观与场景日程</h2>
      </header>
      <ul className="bixin-schedule__list">
        {view.map((item) => (
          <li key={item.title}>
            <div>
              <strong>{item.title}</strong>
              <span>{item.subtitle}</span>
            </div>
            <span className="bixin-status-pill">{item.badge}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="bixin-card__action" onClick={onAddSchedule}>
        <Plus aria-hidden="true" />
        打开世界观
      </button>
    </section>
  );
}
