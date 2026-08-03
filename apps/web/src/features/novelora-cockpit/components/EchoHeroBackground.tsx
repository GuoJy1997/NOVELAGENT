import { echoHeroBackground } from '../assetRegistry';

export function EchoHeroBackground() {
  return (
    <div className="echo-hero-background" aria-hidden="true">
      <img
        className="echo-hero-background__image"
        src={echoHeroBackground}
        alt=""
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />
    </div>
  );
}
