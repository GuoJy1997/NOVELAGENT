import { Sparkles } from 'lucide-react';
import { bixinAssets } from '../../../assetRegistry';

export function CopilotCard({ actions, onPick }: { actions: readonly string[]; onPick: (action: string) => void }) {
  return (
    <section className="bixin-dashboard-card bixin-dashboard-card--copilot" aria-label="AI 陪写">
      <header><span><Sparkles aria-hidden="true" /> AI 陪写</span></header>
      <img src={bixinAssets.mascotCopilot} alt="" aria-hidden="true" />
      <p className="bixin-card-subtitle">你的专属创作伙伴</p>
      <span>需要我帮你：</span>
      <div>
        {actions.map((action) => (
          <button type="button" key={action} onClick={() => onPick(action)}>{action}</button>
        ))}
      </div>
      <button type="button" onClick={() => onPick('续写下一章')}>开始陪写</button>
    </section>
  );
}
