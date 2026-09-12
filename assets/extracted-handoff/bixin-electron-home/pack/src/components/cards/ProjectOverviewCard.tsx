import { Card } from '@/components/ui/Card';
import { project } from '@/data/home';
import { Bookmark, ChevronRight, MoreHorizontal } from 'lucide-react';

export function ProjectOverviewCard() {
  return (
    <Card className="flex h-full flex-col p-7">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[18px] font-semibold text-neutral-900">
          <Bookmark size={20} className="text-bixin-600" />
          我的项目
        </div>
        <MoreHorizontal size={22} className="text-neutral-500" />
      </div>

      <div className="flex gap-6">
        <img src={project.cover} alt={project.title} className="h-[160px] w-[160px] rounded-[20px] object-cover shadow-soft" />
        <div className="pt-1">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-[28px] font-semibold text-black">{project.title}</h3>
            <span className="rounded-full bg-bixin-100 px-3 py-1 text-[13px] font-medium text-bixin-700">{project.status}</span>
          </div>
          <p className="mt-4 max-w-[305px] text-[16px] leading-8 text-neutral-600">{project.description}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 overflow-hidden rounded-[18px] border border-neutral-100 bg-white/70">
        {project.metrics.map((metric, index) => (
          <div key={metric.label} className={`px-5 py-4 ${index !== project.metrics.length - 1 ? 'border-r border-neutral-100' : ''}`}>
            <div className="text-[15px] text-neutral-500">{metric.label}</div>
            <div className="mt-2 text-[20px] font-semibold text-neutral-900">{metric.value}</div>
          </div>
        ))}
      </div>

      <button className="mt-auto flex h-[60px] items-center justify-between rounded-[18px] bg-bixin-600 px-6 text-[18px] font-semibold text-white shadow-soft transition hover:bg-bixin-700">
        <span>打开项目</span>
        <ChevronRight size={22} />
      </button>
    </Card>
  );
}
