import type { CSSProperties } from 'react';
import { characterPortraits } from '../assetRegistry';
import type { CharacterNode, CharacterRelationship } from '../types';

interface CharacterGraphProps {
  characters: CharacterNode[];
  relationships: CharacterRelationship[];
  title?: string;
}

interface NodeCoordinate {
  x: number;
  y: number;
}

interface GraphLayout {
  coordinates: Map<string, NodeCoordinate>;
  height: number;
}

const GRAPH_WIDTH = 320;
const COMPACT_GRAPH_HEIGHT = 180;
const GRID_COLUMNS = [50, 160, 270] as const;
const GRID_ROW_PITCH = 48;

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

  if (characters.length >= 6) {
    characters.forEach((character, index) => {
      coordinates.set(character.id, {
        x: GRID_COLUMNS[index % GRID_COLUMNS.length],
        y: 30 + Math.floor(index / GRID_COLUMNS.length) * GRID_ROW_PITCH,
      });
    });
    return {
      coordinates,
      height: Math.max(
        COMPACT_GRAPH_HEIGHT,
        Math.ceil(characters.length / GRID_COLUMNS.length) * GRID_ROW_PITCH,
      ),
    };
  }

  if (characters.length === 1) {
    coordinates.set(characters[0]?.id ?? '', { x: GRAPH_WIDTH / 2, y: COMPACT_GRAPH_HEIGHT / 2 });
    return { coordinates, height: COMPACT_GRAPH_HEIGHT };
  }

  const centerX = GRAPH_WIDTH / 2;
  const centerY = COMPACT_GRAPH_HEIGHT / 2;
  characters.forEach((character, index) => {
    if (index === 0) {
      coordinates.set(character.id, { x: centerX, y: centerY });
      return;
    }

    const angle = -Math.PI / 2 + ((index - 1) * Math.PI * 2) / (characters.length - 1);
    coordinates.set(character.id, {
      x: Math.round((centerX + Math.cos(angle) * 112) * 10) / 10,
      y: Math.round((centerY + Math.sin(angle) * 60) * 10) / 10,
    });
  });

  return { coordinates, height: COMPACT_GRAPH_HEIGHT };
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
            {knownRelationships.map(({ relationship }, index) => {
              const from = layout.coordinates.get(relationship.fromCharacterId);
              const to = layout.coordinates.get(relationship.toCharacterId);
              if (!from || !to) return null;

              return (
                <path
                  key={relationship.id}
                  className={`character-graph__edge character-graph__edge--${relationship.kind}`}
                  data-relationship-id={relationship.id}
                  data-relationship-kind={relationship.kind}
                  d={relationshipPath(from, to, index)}
                />
              );
            })}
          </svg>

          <ul className="character-graph__nodes" aria-label="Character nodes">
            {uniqueCharacters.map((character, characterIndex) => {
              const coordinate = layout.coordinates.get(character.id) ?? {
                x: GRAPH_WIDTH / 2,
                y: COMPACT_GRAPH_HEIGHT / 2,
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
                  <img src={characterPortraits[character.portraitAssetKey]} alt="" />
                  <span>
                    <strong>{character.name}</strong>
                    <small>{character.role}</small>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <ul className="character-graph__legend" aria-label="Relationship kinds">
        {(['ally', 'neutral', 'rival', 'unknown'] as const).map((kind) => (
          <li key={kind} className={`character-graph__legend-item character-graph__legend-item--${kind}`}>
            <span aria-hidden="true" />
            {kind.charAt(0).toUpperCase() + kind.slice(1)}
          </li>
        ))}
      </ul>
    </section>
  );
}
