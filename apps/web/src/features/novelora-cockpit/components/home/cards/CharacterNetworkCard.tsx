import { UsersRound } from 'lucide-react';
import type { ComponentPropsWithoutRef, CSSProperties } from 'react';
import { characterPortraits } from '../../../assetRegistry';
import type { HomeDashboardView } from '../../../data/homeDashboardView';

interface CharacterNetworkCardProps extends ComponentPropsWithoutRef<'section'> {
  view: HomeDashboardView['characters'];
}

const relationLegend = [
  { key: 'ally', label: '盟友' },
  { key: 'conflict', label: '对立' },
  { key: 'mentor', label: '导师' },
  { key: 'love', label: '爱慕' },
  { key: 'unknown', label: '未知' },
] as const;

export function CharacterNetworkCard({ className, view, ...sectionProps }: CharacterNetworkCardProps) {
  const { center, nodes } = view;
  const centerX = 58;

  return (
    <section
      {...sectionProps}
      className={['bixin-card', 'bixin-card--characters', className].filter(Boolean).join(' ')}
      aria-labelledby="bixin-characters-title"
    >
      <header className="bixin-card__header">
        <UsersRound aria-hidden="true" />
        <h2 id="bixin-characters-title">人物关系网</h2>
      </header>
      {view.empty ? (
        <p role="status">{view.emptyHint}</p>
      ) : (
        <div className="bixin-network">
          <svg className="bixin-network__lines" viewBox="0 0 100 100" aria-hidden="true">
            {nodes.map((character) => (
              <line
                key={character.name}
                className={`bixin-network__line bixin-network__line--${character.relation}`}
                x1={centerX}
                y1="46"
                x2={character.x}
                y2={character.y}
              />
            ))}
          </svg>
          {nodes.map((character) => (
            <div
              key={character.name}
              className="bixin-network__node"
              style={{ left: `${character.x}%`, top: `${character.y}%` } as CSSProperties}
            >
              <img
                src={characterPortraits[character.portraitAssetKey]}
                alt={character.name}
                width={48}
                height={48}
              />
              <strong>{character.name}</strong>
              <small>{character.role}</small>
            </div>
          ))}
          <div className="bixin-network__node bixin-network__node--center">
            <img
              src={characterPortraits[center.portraitAssetKey]}
              alt={center.name}
              width={56}
              height={56}
            />
            <strong>{center.name}</strong>
            <small>{center.role}</small>
          </div>
        </div>
      )}
      <ul className="bixin-network__legend" aria-label="人物关系图例">
        {relationLegend.map((relation) => (
          <li key={relation.key} className={`bixin-network__legend-item--${relation.key}`}>
            <span aria-hidden="true" />
            {relation.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
