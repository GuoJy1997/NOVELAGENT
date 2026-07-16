import bookHero from "../../../assets/novelora/visual-stage/cockpit-book-hero.png";
import mascot from "../../../assets/novelora/visual-stage/cockpit-mascot.png";
import mintFlow from "../../../assets/novelora/visual-stage/cockpit-mint-flow.png";

export function CockpitVisualStage() {
  return (
    <div className="cockpit-visual-stage" aria-hidden="true">
      <div className="cockpit-visual-stage__ambient" />
      <img
        className="cockpit-visual-stage__flow"
        src={mintFlow}
        alt=""
        draggable={false}
      />
      <img
        className="cockpit-visual-stage__book"
        src={bookHero}
        alt=""
        draggable={false}
      />
      <img
        className="cockpit-visual-stage__mascot"
        src={mascot}
        alt=""
        draggable={false}
      />
    </div>
  );
}
