import { Button } from '@/components/ui/Button';
import { hero } from '@/data/home';
import { PenLine, Plus } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative z-20 h-[372px] px-6 pt-8">
      <div className="hero-copy max-w-[410px] pl-11 pt-[28px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-bixin-100 bg-bixin-50/90 px-4 py-2 text-[15px] font-medium text-bixin-700 shadow-soft backdrop-blur-sm">
          ✨ {hero.badge}
        </div>
        <h1 className="mt-7 font-display text-[74px] font-semibold leading-[1.02] tracking-[-0.03em] text-black">
          {hero.titleTop}
          <br />
          {hero.titleBottomPrefix}
          <span className="text-bixin-600">{hero.titleHighlight}</span>
        </h1>
        <p className="mt-5 whitespace-pre-line text-[16px] leading-8 text-neutral-600">{hero.description}</p>
        <div className="mt-7 flex gap-4">
          <Button icon={<PenLine size={20} />}>继续写作</Button>
          <Button variant="secondary" icon={<Plus size={20} />}>新建项目</Button>
        </div>
      </div>
    </section>
  );
}
