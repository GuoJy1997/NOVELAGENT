import { CalendarDays } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import type { HomeDashboardView } from '../../../data/homeDashboardView';

interface CalendarCardProps extends ComponentPropsWithoutRef<'section'> {
  view: HomeDashboardView['calendar'];
}

export function CalendarCard({ className, view, ...sectionProps }: CalendarCardProps) {
  return (
    <section
      {...sectionProps}
      className={['bixin-card', 'bixin-card--calendar', className].filter(Boolean).join(' ')}
      aria-labelledby="bixin-calendar-title"
    >
      <header className="bixin-card__header">
        <CalendarDays aria-hidden="true" />
        <h2 id="bixin-calendar-title">{view.label}</h2>
      </header>
      <div className="bixin-calendar">
        <div className="bixin-calendar__weekdays" aria-hidden="true">
          {view.weekdays.map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="bixin-calendar__days">
          {view.days.map((day, index) => {
            const isActive = day === view.active;
            const isAdjacentMonth = index < 4 || index > 34;
            return (
              <span
                key={`${day}-${index}`}
                className={[
                  isActive ? 'bixin-calendar__day--active' : '',
                  isAdjacentMonth ? 'bixin-calendar__day--adjacent-month' : '',
                ].filter(Boolean).join(' ') || undefined}
                aria-current={isActive ? 'date' : undefined}
              >
                {day}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
