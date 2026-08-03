import { useState } from 'react';
import { inspirationThumbnails } from '../assetRegistry';
import type { InspirationItem, InspirationType } from '../types';

interface InspirationVaultProps {
  inspirations: InspirationItem[];
  onViewAll?: () => void;
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

const noop = () => undefined;

function firstById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function InspirationVault({ inspirations, onViewAll = noop }: InspirationVaultProps) {
  const [filter, setFilter] = useState<InspirationFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filteredInspirations = firstById(inspirations).filter(
    (inspiration) => filter === 'all' || inspiration.type === filter,
  );
  const visibleInspirations = filteredInspirations.slice(0, 3);
  const activeFilterLabel = filters.find(({ value }) => value === filter)?.label ?? 'All';

  return (
    <section className="inspiration-vault" aria-labelledby="inspiration-vault-title">
      <header className="inspiration-vault__heading">
        <h2 id="inspiration-vault-title">Inspiration Vault</h2>
        <button className="inspiration-vault__view-all" type="button" onClick={onViewAll}>
          View All inspiration
        </button>
      </header>

      <div className="inspiration-vault__filters" role="group" aria-label="Inspiration filters">
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

      <div
        className="inspiration-vault__grid"
        role="region"
        tabIndex={0}
        aria-label="Inspiration archive"
      >
        {visibleInspirations.length === 0 ? (
          <p className="inspiration-vault__empty" role="status">
            No inspiration matches {activeFilterLabel}.
          </p>
        ) : (
          visibleInspirations.map((inspiration) => {
            const isSelected = inspiration.id === selectedId;
            const provenance =
              inspiration.relatedChapterIds.length === 0
                ? 'Unlinked'
                : `Ch. ${inspiration.relatedChapterIds
                    .map((chapterId) => chapterId.replace('chapter-', ''))
                    .join(' · ')}`;

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
                  <span className="inspiration-card__provenance">{provenance}</span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
