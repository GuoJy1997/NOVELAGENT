interface EchoHeroCopyProps {
  onContinueWriting: () => void;
  onAIAssist: () => void;
}

export function EchoHeroCopy({ onContinueWriting, onAIAssist }: EchoHeroCopyProps) {
  return (
    <div className="echo-hero-copy">
      <h1 aria-label="Bring your story to life with AI">
        Bring your story
        <br />
        to life with <span className="echo-hero-copy__accent">AI</span>
      </h1>
      <p>
        Your intelligent writing partner that helps you craft compelling stories, one chapter at a time.
      </p>
      <div className="echo-hero-actions">
        <button type="button" onClick={onContinueWriting}>
          Continue Writing <span aria-hidden="true">→</span>
        </button>
        <button type="button" onClick={onAIAssist}>
          <span className="echo-hero-actions__sparkle" aria-hidden="true">✣</span>
          AI Assist <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}
