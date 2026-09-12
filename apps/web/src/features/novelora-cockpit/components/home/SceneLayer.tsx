import { bixinAssets } from '../../assetRegistry';

interface SceneLayerProps {
  variant?: 'home' | 'workbench';
}

export function SceneLayer({ variant = 'home' }: SceneLayerProps) {
  return (
    <div
      className={variant === 'workbench' ? 'bixin-scene-layer bixin-scene-layer--workbench' : 'bixin-scene-layer'}
      aria-hidden="true"
    >
      {/* The canonical canvas owns the continuous sky and the single transparent mascot. */}
      <div className="bixin-scene-layer__canvas">
        <img
          className="bixin-scene-layer__base"
          src={variant === 'home' ? bixinAssets.homeBackdrop : bixinAssets.skyBand}
          alt=""
          draggable={false}
          fetchPriority="high"
        />
        {variant === 'home' ? <img className="bixin-scene-layer__mascot" src={bixinAssets.heroRobot} alt="" draggable={false} /> : null}
      </div>
    </div>
  );
}
