import { characterPortraits } from '../assetRegistry';
import type { CharacterNode, CharacterRelationship } from '../types';

interface CharacterGraphProps {
  characters: CharacterNode[];
  relationships: CharacterRelationship[];
}

const edgeCoordinates: Record<string, { x1: number; x2: number; y1: number; y2: number }> = {
  'kael-liora': { x1: 185, y1: 44, x2: 219, y2: 44 },
  'liora-arden': { x1: 401, y1: 44, x2: 435, y2: 44 },
  'kael-vex': { x1: 185, y1: 44, x2: 219, y2: 148 },
  'selene-arden': { x1: 525, y1: 120, x2: 525, y2: 72 },
};

export function CharacterGraph({ characters, relationships }: CharacterGraphProps) {
  const characterNamesById = new Map(characters.map((character) => [character.id, character.name]));

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
          <svg className="character-graph__edges" viewBox="0 0 620 255" aria-hidden="true">
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
          <ul className="character-graph__nodes">
            {characters.map((character) => (
              <li
                key={character.id}
                className={`character-graph__node character-graph__node--${character.id}`}
                aria-label={`${character.name}, ${character.role}`}
              >
                <img src={characterPortraits[character.portraitAssetKey]} alt="" />
                <span>
                  <strong>{character.name}</strong>
                  <small>{character.role}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ul className="character-graph__legend" aria-label="Relationship legend">
        {relationships.map((relationship, index) => (
          <li key={relationship.id} className={`character-graph__legend-item character-graph__legend-item--${index % 4}`}>
            <span aria-hidden="true" />
            <strong>
              {characterNamesById.get(relationship.fromCharacterId) ?? relationship.fromCharacterId}
              {' — '}
              {characterNamesById.get(relationship.toCharacterId) ?? relationship.toCharacterId}
              {' · '}
              {relationship.label}
            </strong>
            <small>{relationship.tension}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
