import { useEffect, useState } from 'react';
import {
  fetchCharacters,
  saveCharacters,
  type CharacterFile,
  type CharacterRecord,
} from '../../lib/noveloraApi';
import './CharactersPage.css';

type SaveStatus = 'saved' | 'saving' | 'error';

interface CharactersPageProps {
  projectId: string;
}

const STATUS_LABEL: Record<SaveStatus, string> = {
  saved: '已保存',
  saving: '保存中',
  error: '保存失败',
};

export function CharactersPage({ projectId }: CharactersPageProps) {
  const [file, setFile] = useState<CharacterFile | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>('saved');

  useEffect(() => {
    let cancelled = false;
    setStatus('saved');
    fetchCharacters(projectId)
      .then((next) => {
        if (cancelled) return;
        setFile(next);
        setSelectedId(next.characters[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const selected = file?.characters.find((character) => character.id === selectedId);

  function updateSelected(patch: Partial<CharacterRecord>) {
    if (!file || !selectedId) return;
    const next: CharacterFile = {
      ...file,
      characters: file.characters.map((character) =>
        character.id === selectedId ? { ...character, ...patch } : character,
      ),
    };
    setFile(next);
    setStatus('saving');
    saveCharacters(next, projectId)
      .then(() => setStatus('saved'))
      .catch(() => setStatus('error'));
  }

  return (
    <section className="characters-page" aria-label="人物">
      <header className="characters-page__header">
        <h2>人物</h2>
        <span role="status">{STATUS_LABEL[status]}</span>
      </header>
      <ul className="characters-page__list" aria-label="人物列表">
        {file?.characters.map((character) => (
          <li key={character.id}>
            <button
              type="button"
              aria-pressed={character.id === selectedId}
              onClick={() => setSelectedId(character.id)}
            >
              {character.name}
            </button>
          </li>
        ))}
      </ul>
      {selected ? (
        <form
          className="characters-page__form"
          aria-label={`${selected.name} 的资料`}
          onSubmit={(event) => event.preventDefault()}
        >
          <label>
            姓名
            <input
              value={selected.name}
              onChange={(event) => updateSelected({ name: event.target.value })}
            />
          </label>
          <label>
            角色
            <input
              value={selected.role}
              onChange={(event) => updateSelected({ role: event.target.value })}
            />
          </label>
          <label>
            目标
            <input
              value={selected.goal ?? ''}
              onChange={(event) => updateSelected({ goal: event.target.value })}
            />
          </label>
          <label>
            知情
            <input
              value={selected.knows ?? ''}
              onChange={(event) => updateSelected({ knows: event.target.value })}
            />
          </label>
        </form>
      ) : null}
    </section>
  );
}
