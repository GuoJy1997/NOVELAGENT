import type { CSSProperties } from 'react';
import { characterPortraits } from '../assetRegistry';
import { KIND_META } from '../types';
import type { CharacterNode, CharacterRelationship, RelationshipKind } from '../types';
import './CharacterGraph.css';

interface CharacterGraphProps {
  characters: CharacterNode[];
  relationships: CharacterRelationship[];
  title?: string;
  onSelectCharacter?: (id: string) => void;
}

const RELATIONSHIP_KINDS = Object.keys(KIND_META) as RelationshipKind[];

interface NodeCoordinate {
  x: number;
  y: number;
}

interface GraphLayout {
  coordinates: Map<string, NodeCoordinate>;
  height: number;
}

const GRAPH_WIDTH = 760;
const GRAPH_HEIGHT = 560;

function firstById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function graphLayout(characters: CharacterNode[]): GraphLayout {
  const coordinates = new Map<string, NodeCoordinate>();
  const centerX = GRAPH_WIDTH / 2;
  const centerY = GRAPH_HEIGHT / 2;

  if (characters.length === 1) {
    coordinates.set(characters[0]?.id ?? '', { x: centerX, y: centerY });
    return { coordinates, height: GRAPH_HEIGHT };
  }

  const ringCount = Math.max(1, characters.length - 1);
  const radiusX = ringCount <= 4 ? 230 : ringCount <= 8 ? 285 : 315;
  const radiusY = ringCount <= 4 ? 150 : ringCount <= 8 ? 190 : 205;
  characters.forEach((character, index) => {
    if (index === 0) {
      coordinates.set(character.id, { x: centerX, y: centerY });
      return;
    }

    const angle = -Math.PI / 2 + ((index - 1) * Math.PI * 2) / ringCount;
    coordinates.set(character.id, {
      x: Math.round((centerX + Math.cos(angle) * radiusX) * 10) / 10,
      y: Math.round((centerY + Math.sin(angle) * radiusY) * 10) / 10,
    });
  });

  return { coordinates, height: GRAPH_HEIGHT };
}

function relationshipPath(
  from: NodeCoordinate,
  to: NodeCoordinate,
  relationshipIndex: number,
) {
  if (from.x === to.x && from.y === to.y) {
    return `M ${from.x} ${from.y} C ${from.x + 34} ${from.y - 32} ${from.x - 34} ${from.y - 32} ${from.x} ${from.y}`;
  }

  const middleX = Math.round(((from.x + to.x) / 2) * 10) / 10;
  const bend = 10 + (relationshipIndex % 3) * 5;
  const firstControlY = Math.round((from.y - bend) * 10) / 10;
  const secondControlY = Math.round((to.y - bend) * 10) / 10;
  return `M ${from.x} ${from.y} C ${middleX} ${firstControlY} ${middleX} ${secondControlY} ${to.x} ${to.y}`;
}

export function CharacterGraph({
  characters,
  relationships,
  title = 'Character Relationship Graph',
  onSelectCharacter,
}: CharacterGraphProps) {
  const uniqueCharacters = firstById(characters);
  const uniqueRelationships = firstById(relationships);
  const layout = graphLayout(uniqueCharacters);
  const charactersById = new Map(uniqueCharacters.map((character) => [character.id, character]));
  const knownRelationships = uniqueRelationships.flatMap((relationship) => {
    const from = charactersById.get(relationship.fromCharacterId);
    const to = charactersById.get(relationship.toCharacterId);
    return from && to ? [{ relationship, from, to }] : [];
  });
  const stageStyle = {
    '--character-graph-height': `${layout.height}px`,
    height: `${layout.height}px`,
  } as CSSProperties;

  return (
    <section className="character-graph" aria-labelledby="character-graph-title">
      <header className="character-graph__heading">
        <h2 id="character-graph-title">{title}</h2>
        <span>{uniqueCharacters.length} characters</span>
      </header>

      <div
        className="character-graph__viewport"
        role="region"
        tabIndex={0}
        aria-label="Character relationship graph"
      >
        <div className="character-graph__stage" style={stageStyle}>
          <svg
            className="character-graph__edges"
            viewBox={`0 0 ${GRAPH_WIDTH} ${layout.height}`}
            aria-hidden="true"
          >
            {knownRelationships.map(({ relationship, from, to }, index) => {
              const fromCoordinate = layout.coordinates.get(from.id);
              const toCoordinate = layout.coordinates.get(to.id);
              if (!fromCoordinate || !toCoordinate) return null;

              return <g key={relationship.id}>
                <path className={`character-graph__edge character-graph__edge--${relationship.kind}`} data-relationship-id={relationship.id} data-relationship-kind={relationship.kind} fill="none" d={relationshipPath(fromCoordinate, toCoordinate, index)} />
                <text className="character-graph__edge-label" x={(fromCoordinate.x + toCoordinate.x) / 2} y={(fromCoordinate.y + toCoordinate.y) / 2}>{relationship.label}</text>
              </g>;
            })}
          </svg>

          <ul className="character-graph__nodes" aria-label="Character nodes">
            {uniqueCharacters.map((character, characterIndex) => {
              const coordinate = layout.coordinates.get(character.id) ?? {
                x: GRAPH_WIDTH / 2,
                y: GRAPH_HEIGHT / 2,
              };
              const nodeStyle = {
                '--character-x': `${coordinate.x}px`,
                '--character-y': `${coordinate.y}px`,
              } as CSSProperties;
              const relatedTensions = uniqueRelationships
                .filter(
                  (relationship) =>
                    relationship.fromCharacterId === character.id ||
                    relationship.toCharacterId === character.id,
                )
                .map((relationship) => relationship.tension)
                .join(' ');

              return (
                <li
                  key={character.id}
                  className={`character-graph__node${characterIndex === 0 ? ' is-protagonist' : ''}`}
                  style={nodeStyle}
                  aria-label={`${character.name}, ${character.role}`}
                title={relatedTensions || undefined}
              >
                <button type="button" aria-label={`${character.name}, ${character.role}`} onClick={() => onSelectCharacter?.(character.id)}>
                  <img src={characterPortraits[character.portraitAssetKey]} alt="" />
                  <span><strong>{character.name}</strong><small>{character.role}</small></span>
                </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <ul className="character-graph__legend" aria-label="关系图例">
        {RELATIONSHIP_KINDS.map((kind) => (
          <li key={kind} className={`character-graph__legend-item character-graph__legend-item--${kind}`}>
            <span aria-hidden="true" />
            {KIND_META[kind].label}
          </li>
        ))}
      </ul>
    </section>
  );
}
