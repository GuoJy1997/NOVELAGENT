import { characterPortraits } from '../assetRegistry';
import type { CharacterNode, CharacterRelationship } from '../types';

interface CharacterGraphProps {
  characters: CharacterNode[];
  relationships: CharacterRelationship[];
}

const edgeCoordinates: Record<string, { x1: number; x2: number; y1: number; y2: number }> = {
  'kael-liora': { x1: 170, y1: 92, x2: 500, y2: 92 },
  'liora-arden': { x1: 500, y1: 92, x2: 825, y2: 92 },
  'kael-vex': { x1: 170, y1: 106, x2: 340, y2: 250 },
  'selene-arden': { x1: 660, y1: 250, x2: 825, y2: 106 },
};

export function CharacterGraph({ characters, relationships }: CharacterGraphProps) {
  return (
    <section className="character-graph" aria-labelledby="character-graph-title">
      <div className="workspace-section-heading">
        <div>
          <p className="workspace-eyebrow">Story dynamics</p>
          <h2 id="character-graph-title">Character constellation</h2>
        </div>
        <p className="workspace-section-note">Read the bonds shaping every chapter.</p>
      </div>

      <div className="character-graph__viewport" tabIndex={0} aria-label="Character relationship graph">
        <div className="character-graph__stage">
          <svg className="character-graph__edges" viewBox="0 0 1000 330" aria-hidden="true">
            {relationships.map((relationship, index) => {
              const coordinates = edgeCoordinates[relationship.id];
              if (!coordinates) return null;

              return (
                <line
                  key={relationship.id}
                  className={`character-graph__edge character-graph__edge--${index % 4}`}
                  {...coordinates}
                />
              );
            })}
          </svg>
          <div className="character-graph__nodes">
            {characters.map((character) => (
              <button
                key={character.id}
                className={`character-graph__node character-graph__node--${character.id}`}
                type="button"
                aria-label={`${character.name}, ${character.role}`}
              >
                <img src={characterPortraits[character.portraitAssetKey]} alt="" />
                <span>
                  <strong>{character.name}</strong>
                  <small>{character.role}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <ul className="character-graph__legend" aria-label="Relationship legend">
        {relationships.map((relationship, index) => (
          <li key={relationship.id} className={`character-graph__legend-item character-graph__legend-item--${index % 4}`}>
            <span aria-hidden="true" />
            <strong>{relationship.label}</strong>
            <small>{relationship.tension}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
