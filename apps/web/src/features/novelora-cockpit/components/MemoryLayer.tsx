import { useId, useState } from 'react';
import type { MemorySource } from '../types';

export interface MemoryLayerProps {
  sources: MemorySource[];
  onManage: () => void;
}

const memoryTags = [
  'Core Memory',
  'World Lore',
  'Timeline',
  'Locations',
  'Characters',
  'Clues',
] as const;

type MemoryTag = (typeof memoryTags)[number];

export function MemoryLayer({ sources, onManage }: MemoryLayerProps) {
  const [selectedTag, setSelectedTag] = useState<MemoryTag>('Core Memory');
  const titleId = useId();

  return (
    <section className="memory-layer-card" aria-labelledby={titleId}>
      <div className="memory-layer-card__header">
        <div>
          <p className="memory-layer-card__eyebrow">Story context</p>
          <h2 id={titleId}>Memory Layer</h2>
        </div>
        <button type="button" onClick={onManage}>Manage memory</button>
      </div>

      <p className="memory-layer-card__summary">
        {sources.length === 0
          ? 'No memory sources available'
          : `${sources.length} sources available`}
      </p>
      <div className="memory-layer-card__tags" aria-label="Memory categories">
        {memoryTags.map((tag) => (
          <button
            key={tag}
            type="button"
            aria-pressed={selectedTag === tag}
            onClick={() => setSelectedTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <p className="memory-layer-card__selection">Selected: {selectedTag}</p>
    </section>
  );
}
