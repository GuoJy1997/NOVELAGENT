import { RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { HomeSuggestion } from '../../../data/bixinHomeContent';

export function AiSuggestionsCard({ suggestions }: { suggestions: HomeSuggestion[] }) {
  const [start, setStart] = useState(0);
  const ordered = suggestions.map((_, i) => suggestions[(start + i) % suggestions.length]).filter(Boolean);
  return (
    <section className="bixin-dashboard-card bixin-dashboard-card--suggestions" aria-label="AI 建议">
      <header>
        <h2><Sparkles aria-hidden="true" /> AI 建议</h2>
        <button type="button" onClick={() => setStart((start + 1) % suggestions.length)}>
          <RefreshCw aria-hidden="true" /> 换一换
        </button>
      </header>
      <ul>{ordered.map((item) => <li key={item.id}>{item.text}</li>)}</ul>
    </section>
  );
}
