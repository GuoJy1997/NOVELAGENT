import { bixinAssets } from '../../assetRegistry';

export function BrandHeader() {
  return (
    <header className="bixin-brand-header">
      <img src={bixinAssets.appIcon} alt="" draggable={false} />
      <div>
        <p>笔心</p>
        <span>AI写作工作室</span>
      </div>
    </header>
  );
}
