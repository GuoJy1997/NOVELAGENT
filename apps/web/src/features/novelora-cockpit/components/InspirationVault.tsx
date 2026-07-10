import { useState } from 'react';
import { inspirationThumbnails } from '../assetRegistry';
import type { InspirationItem, InspirationType } from '../types';

interface InspirationVaultProps {
  inspirations: InspirationItem[];
}

type InspirationFilter = 'all' | InspirationType;

const filters: Array<{ label: string; value: InspirationFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Quotes', value: 'quote' },
  { label: 'Images', value: 'image' },
  { label: 'Ideas', value: 'location' },
  { label: 'Refs', value: 'research' },
];

const typeLabels: Record<InspirationType, string> = {
  image: 'Image',
  quote: 'Quote',
  location: 'Idea',
  research: 'Reference',
};

export function InspirationVault({ inspirations }: InspirationVaultProps) {
  const [filter, setFilter] = useState<InspirationFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const visibleInspirations = inspirations.filter((inspiration) => filter === 'all' || inspiration.type === filter);

  return (
    <section className="inspiration-vault" aria-labelledby="inspiration-vault-title">
      <div className="workspace-section-heading inspiration-vault__heading">
        <div>
          <p className="workspace-eyebrow">Creative memory</p>
          <h2 id="inspiration-vault-title">Inspiration vault</h2>
        </div>
        <div className="inspiration-vault__filters" aria-label="Inspiration filters">
          {filters.map(({ label, value }) => (
            <button
              key={value}
              className={`inspiration-filter${filter === value ? ' is-selected' : ''}`}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="inspiration-vault__grid">
        {visibleInspirations.map((inspiration) => {
          const isSelected = inspiration.id === selectedId;

          return (
            <button
              key={inspiration.id}
              className={`inspiration-card${isSelected ? ' is-selected' : ''}`}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedId(inspiration.id)}
            >
              <img src={inspirationThumbnails[inspiration.assetKey]} alt="" />
              <span className="inspiration-card__content">
                <span className="inspiration-card__meta">{typeLabels[inspiration.type]}</span>
                <strong>{inspiration.title}</strong>
                <span className="inspiration-card__note">{inspiration.note}</span>
                <span className="inspiration-card__provenance">
                  {`Ch. ${inspiration.relatedChapterIds.map((chapterId) => chapterId.replace('chapter-', '')).join(' · ')}`}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
