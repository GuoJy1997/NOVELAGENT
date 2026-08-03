import { bookOriginBackground, writingCompanion } from "../legacyAssetRegistry";

const transparentPixel = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
)}`;

export function CockpitVisualStage() {
  return (
    <div className="cockpit-visual-stage" aria-hidden="true">
      <div className="cockpit-visual-stage__background">
        <img
          className="cockpit-visual-stage__book-background"
          src={bookOriginBackground}
          alt=""
          draggable={false}
        />
      </div>
      <div className="cockpit-visual-stage__midground">
        <img
          className="cockpit-visual-stage__book-midground"
          src={bookOriginBackground}
          alt=""
          draggable={false}
        />
      </div>
      <div className="cockpit-visual-stage__foreground">
        <picture>
          <source media="(max-width: 900px)" srcSet={transparentPixel} />
          <img
            className="cockpit-visual-stage__mascot"
            src={writingCompanion}
            alt=""
            draggable={false}
          />
        </picture>
      </div>
    </div>
  );
}
