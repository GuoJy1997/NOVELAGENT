import { CalendarCard } from '@/components/cards/CalendarCard';
import { ChapterProgressCard } from '@/components/cards/ChapterProgressCard';
import { CharacterNetworkCard } from '@/components/cards/CharacterNetworkCard';
import { ProjectOverviewCard } from '@/components/cards/ProjectOverviewCard';
import { ScheduleCard } from '@/components/cards/ScheduleCard';
import { WritingGoalsCard } from '@/components/cards/WritingGoalsCard';

export function DashboardGrid() {
  return (
    <section className="relative z-20 -mt-5 grid grid-cols-[1.12fr_1.02fr_1.05fr] gap-4 px-6 pb-6">
      <div className="row-span-2 min-h-[432px]">
        <ProjectOverviewCard />
      </div>
      <div className="min-h-[242px]">
        <ChapterProgressCard />
      </div>
      <div className="min-h-[242px]">
        <CharacterNetworkCard />
      </div>
      <div className="min-h-[224px]">
        <WritingGoalsCard />
      </div>
      <div className="grid grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="min-h-[224px]">
          <ScheduleCard />
        </div>
        <div className="min-h-[224px]">
          <CalendarCard />
        </div>
      </div>
    </section>
  );
}
