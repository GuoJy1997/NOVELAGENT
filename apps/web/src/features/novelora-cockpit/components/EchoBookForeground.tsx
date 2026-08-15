import { echoBookForeground } from '../assetRegistry';

export function EchoBookForeground() {
  return (
    <div className="echo-book-layer" aria-hidden="true">
      <img
        className="echo-book-foreground"
        src={echoBookForeground}
        alt=""
        decoding="async"
        draggable={false}
      />
    </div>
  );
}
