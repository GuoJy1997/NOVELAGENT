import { BrandHeader } from '@/components/layout/BrandHeader';
import { DashboardGrid } from '@/components/layout/DashboardGrid';
import { HeroSection } from '@/components/layout/HeroSection';
import { SidebarRail } from '@/components/layout/SidebarRail';
import { TopBar } from '@/components/layout/TopBar';
import { BookLayer } from '@/components/scene/BookLayer';
import { SceneLayer } from '@/components/scene/SceneLayer';

export default function App() {
  return (
    <div className="h-full w-full overflow-hidden bg-[#f4f6f3] p-4 font-body text-ink">
      <div className="relative h-full w-full overflow-hidden rounded-[32px] border border-white/80 bg-[#f7faf7] shadow-[0_24px_64px_rgba(43,59,47,0.08)]">
        <SceneLayer />
        <div className="relative z-20 grid h-full grid-cols-[118px_1fr]">
          <SidebarRail />
          <main className="relative h-full overflow-hidden">
            <BrandHeader />
            <TopBar />
            <HeroSection />
            <DashboardGrid />
          </main>
        </div>
        <BookLayer />
      </div>
    </div>
  );
}
