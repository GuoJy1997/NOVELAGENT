import { bixinAssets } from '../../assetRegistry';

export function BookForeground() {
  return (
    <div className="bixin-book-layer" aria-hidden="true">
      <img src={bixinAssets.book} alt="" draggable={false} />
    </div>
  );
}
