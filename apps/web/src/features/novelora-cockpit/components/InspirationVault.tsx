import { useState } from 'react';
import { inspirationThumbnails } from '../assetRegistry';
import type { InspirationItem, InspirationType } from '../types';

interface InspirationVaultProps {
  inspirations: InspirationItem[];
  onViewAll?: () => void;
}

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const visibleInspirations = firstById(inspirations).slice(0, 3);

  return (
    <section className="inspiration-vault" aria-labelledby="inspiration-vault-title">
      <header className="inspiration-vault__heading">
        <h2 id="inspiration-vault-title">Inspiration Vault</h2>
        <button
          className="inspiration-vault__view-all"
          type="button"
          aria-label="View All inspiration"
          onClick={onViewAll}
        >
          View All
        </button>
      </header>

      <div
        className="inspiration-vault__grid"
        role="region"
        tabIndex={0}
        aria-label="Inspiration archive"
      >
        {visibleInspirations.length === 0 ? (
          <p className="inspiration-vault__empty" role="status">
            No inspiration available yet.
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
                  <strong>{inspiration.title}</strong>
                  <span className="inspiration-card__meta">
                    {`${typeLabels[inspiration.type]} • ${provenance}`}
                  </span>
                  <span className="sr-only">{inspiration.note}</span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
