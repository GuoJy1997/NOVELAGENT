import { useEffect, useState } from 'react';
import { characterPortraits } from '../../assetRegistry';
import {
  fetchCharacters,
  saveCharacters,
  type CharacterFile,
  type CharacterRecord,
  type RelationshipRecord,
} from '../../lib/noveloraApi';
import type { CharacterNode, CharacterRelationship, RelationshipKind } from '../../types';
import { CharacterGraph } from '../CharacterGraph';
import './RelationsPage.css';

interface RelationsPageProps {
  projectId: string;
}

const RELATIONSHIP_KINDS: readonly RelationshipKind[] = ['ally', 'neutral', 'rival', 'unknown'];
const FALLBACK_PORTRAIT: CharacterNode['portraitAssetKey'] = 'kael';

function portraitKey(id: string): CharacterNode['portraitAssetKey'] {
  return id in characterPortraits ? (id as CharacterNode['portraitAssetKey']) : FALLBACK_PORTRAIT;
}

function toCharacterNode(character: CharacterRecord): CharacterNode {
  return {
    id: character.id,
    name: character.name,
    role: character.role,
    portraitAssetKey: portraitKey(character.id),
  };
}

function toRelationship(relationship: RelationshipRecord): CharacterRelationship {
  return {
    id: relationship.id,
    fromCharacterId: relationship.fromCharacterId,
    toCharacterId: relationship.toCharacterId,
    label: relationship.label,
    tension: relationship.tension,
    kind: RELATIONSHIP_KINDS.includes(relationship.kind as RelationshipKind)
      ? (relationship.kind as RelationshipKind)
      : 'unknown',
  };
}

function partnerName(file: CharacterFile, id: string) {
  return file.characters.find((character) => character.id === id)?.name ?? id;
}

export function RelationsPage({ projectId }: RelationsPageProps) {
  const [file, setFile] = useState<CharacterFile | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCharacters(projectId)
      .then((next) => {
        if (!cancelled) setFile(next);
      })
      .catch(() => {
        if (!cancelled) setFile({ characters: [], relationships: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  function updateLabel(relationshipId: string, label: string) {
    if (!file) return;
    const next: CharacterFile = {
      ...file,
      relationships: file.relationships.map((relationship) =>
        relationship.id === relationshipId ? { ...relationship, label } : relationship,
      ),
    };
    setFile(next);
    void saveCharacters(next, projectId).catch(() => {});
  }

  return (
    <section className="relations-page" aria-label="关系">
      <header className="relations-page__header">
        <h2>关系</h2>
      </header>
      {file ? (
        <CharacterGraph
          characters={file.characters.map(toCharacterNode)}
          relationships={file.relationships.map(toRelationship)}
        />
      ) : null}
      {file && file.relationships.length > 0 ? (
        <ul className="relations-page__labels" aria-label="关系标签">
          {file.relationships.map((relationship) => (
            <li key={relationship.id}>
              <label>
                {`${partnerName(file, relationship.fromCharacterId)} 与 ${partnerName(file, relationship.toCharacterId)}`}
                <input
                  value={relationship.label}
                  onChange={(event) => updateLabel(relationship.id, event.target.value)}
                />
              </label>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
