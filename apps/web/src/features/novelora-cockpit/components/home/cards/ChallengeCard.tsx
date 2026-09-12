import { Trophy } from 'lucide-react';
import { bixinAssets } from '../../../assetRegistry';
import type { HomeChallenge } from '../../../data/bixinHomeContent';

export function ChallengeCard({ challenge, onStart }: { challenge: HomeChallenge; onStart: () => void }) {
  return (
    <section className="bixin-dashboard-card bixin-dashboard-card--challenge" aria-label="今日创作挑战">
      <header>
        <span><Trophy aria-hidden="true" /> 今日创作挑战</span>
        <span className="bixin-status-pill">挑战中</span>
      </header>
      <div className="bixin-challenge__brief"><strong>主题：{challenge.topic}</strong>
      <p>{challenge.description}</p>
      <span>奖励：{challenge.reward}</span>
      <button type="button" onClick={onStart}>立即挑战</button>
      </div><img src={bixinAssets.mascotChallenge} alt="" aria-hidden="true" /><small>{challenge.participants}</small>
    </section>
  );
}
