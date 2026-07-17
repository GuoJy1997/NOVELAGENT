import bookHero from "../../../assets/novelora/visual-stage/cockpit-book-hero.webp";
import mascot from "../../../assets/novelora/visual-stage/cockpit-mascot.webp";
import mintFlow from "../../../assets/novelora/visual-stage/cockpit-mint-flow.webp";

const transparentPixel = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
)}`;

export function CockpitVisualStage() {
  return (
    <div className="cockpit-visual-stage" aria-hidden="true">
      <div className="cockpit-visual-stage__backdrop">
        <div className="cockpit-visual-stage__ambient" />
        <img
          className="cockpit-visual-stage__flow"
          src={mintFlow}
          alt=""
          draggable={false}
        />
      </div>
      <div className="cockpit-visual-stage__book-layer">
        <picture>
          <source media="(max-width: 900px)" srcSet={transparentPixel} />
          <img
            className="cockpit-visual-stage__book"
            src={bookHero}
            alt=""
            draggable={false}
          />
        </picture>
      </div>
      <div className="cockpit-visual-stage__foreground">
        <img
          className="cockpit-visual-stage__mascot"
          src={mascot}
          alt=""
          draggable={false}
        />
      </div>
    </div>
  );
}
