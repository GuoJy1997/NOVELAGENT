import { FileCheck, GitBranch, Globe2, Lightbulb, Plus, UserRound } from 'lucide-react';
import { bixinHomeContent } from '../../data/bixinHomeContent';

interface HeroSectionProps {
  onContinueWriting: () => void;
  onNewProject: () => void;
}

export function HeroSection({ onContinueWriting, onNewProject }: HeroSectionProps) {
  return (
    <section className="bixin-hero-section" aria-labelledby="bixin-hero-heading">
      <div className="bixin-hero__copy">
        <span className="bixin-hero__bubble">{bixinHomeContent.heroBubble}</span>
        <h1 id="bixin-hero-heading">
          {bixinHomeContent.heroTitleLines.map((line, index) => (
            <span key={line} className={index === 1 ? 'bixin-hero__accent' : undefined}>
              {line}
            </span>
          ))}
        </h1>
        <p className="bixin-hero__subtitle">{bixinHomeContent.heroSubtitle}</p>
        <div className="bixin-hero__actions">
          <button type="button" onClick={onContinueWriting}>继续写作</button>
          <button type="button" onClick={onNewProject}>
            <Plus aria-hidden="true" />
            新建作品
          </button>
        </div>
        <ul className="bixin-hero__chips">
          {bixinHomeContent.featureChips.map((chip, index) => {
            const Icon = [Lightbulb, UserRound, GitBranch, Globe2, FileCheck][index];
            return <li key={chip}><Icon aria-hidden="true" />{chip}</li>;
          })}
        </ul>
      </div>
    </section>
  );
}
