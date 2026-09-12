import { ArrowRight, WandSparkles } from 'lucide-react';
import type { NavId } from '../../../nav';
import type { HomeQuickAction } from '../../../data/bixinHomeContent';
import { bixinAssets } from '../../../assetRegistry';

export function QuickGenCard({ actions, onNavigate }: { actions: HomeQuickAction[]; onNavigate: (nav: NavId) => void }) {
  return (
    <section className="bixin-dashboard-card bixin-dashboard-card--quick" aria-label="快速生成">
      <header><span><WandSparkles aria-hidden="true" /> 快速生成</span></header>
      <p className="bixin-card-subtitle">一键生成，高效起稿</p>
      <img src={bixinAssets.mascotQuickgen} alt="" aria-hidden="true" />
      <div>
        {actions.map((item) => (
          <button type="button" key={item.id} onClick={() => onNavigate(item.nav)}>
            {item.label}<ArrowRight aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
