import { Card } from '@/components/ui/Card';
import { month } from '@/data/home';

export function CalendarCard() {
  return (
    <Card className="h-full p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[18px] font-semibold text-neutral-900">{month.label}</div>
        <div className="text-[18px] text-neutral-500">‹  ›</div>
      </div>
      <div className="grid grid-cols-7 gap-y-3 text-center">
        {month.weekdays.map((day) => (
          <div key={day} className="text-[12px] text-neutral-500">{day}</div>
        ))}
        {month.days.flat().map((day, index) => (
          <div key={`${day}-${index}`} className="mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[13px] text-neutral-700">
            {day ? (
              <span className={day === month.active ? 'calendar-day calendar-day-active' : 'calendar-day'}>{day}</span>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
