import { useEffect, useRef, useState } from 'react';
import { characterBanners, characterPortraits } from '../../assetRegistry';
import {
  cancelImportJob,
  getImportJob,
  startCharacterImport,
  useImportJob,
} from '../../lib/importSession';
import {
  fetchCharacters,
  pickWorkspaceFile,
  saveCharacters,
  type CharacterFile,
  type CharacterRecord,
} from '../../lib/noveloraApi';
import { CharacterImportPreview } from './CharacterImportPreview';
import { DomainOnboarding } from './DomainOnboarding';
import { CharacterArcChart } from './CharacterArcChart';
import { portraitKey } from '../../lib/portraitKey';
import './CharactersPage.css';

type SaveStatus = 'saved' | 'saving' | 'error';

interface CharactersPageProps {
  projectId: string;
  onBack?: () => void;
  onOpenRelations?: () => void;
}

const STATUS_LABEL: Record<SaveStatus, string> = {
  saved: '已保存',
  saving: '保存中',
  error: '保存失败',
};

const ARC_POINTS = [
  { label: '起点', v: 30 },
  { label: '成长', v: 45 },
  { label: '转折', v: 60 },
  { label: '低谷', v: 35 },
  { label: '顿悟', v: 70 },
  { label: '高峰', v: 90 },
];

export function CharactersPage({ projectId, onBack, onOpenRelations }: CharactersPageProps) {
  const [file, setFile] = useState<CharacterFile | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const saveSeq = useRef(0);
  const dirty = useRef(false);
  const fileRef = useRef(file);
  const projectIdRef = useRef(projectId);
  const job = useImportJob(projectId, 'characters');

  useEffect(() => {
    fileRef.current = file;
  }, [file]);

  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    dirty.current = false;
    setStatus('saved');
    setNeedsOnboarding(false);
    fetchCharacters(projectId)
      .then((next) => {
        if (cancelled) return;
        const current = getImportJob(projectId, 'characters');
        if (current?.phase === 'generating' || current?.phase === 'saved') return;
        if (next.characters.length === 0) {
          setNeedsOnboarding(true);
          return;
        }
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

  useEffect(() => () => {
    if (dirty.current && fileRef.current) {
      dirty.current = false;
      saveSeq.current += 1;
      void saveCharacters(fileRef.current, projectIdRef.current).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!dirty.current || !file) return undefined;
    setStatus('saving');
    const timer = window.setTimeout(() => {
      saveSeq.current += 1;
      const seq = saveSeq.current;
      saveCharacters(file, projectId)
        .then(() => {
          if (seq === saveSeq.current) setStatus('saved');
        })
        .catch(() => {
          if (seq === saveSeq.current) setStatus('error');
        });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [file, projectId]);

  const selected = file?.characters.find((character) => character.id === selectedId);
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase();
  const visibleCharacters = file?.characters.filter((character) => {
    if (!normalizedSearchQuery) return true;
    return [character.name, character.role, character.goal, character.knows].some((field) =>
      field?.toLocaleLowerCase().includes(normalizedSearchQuery),
    );
  });

  function updateSelected(patch: Partial<CharacterRecord>) {
    if (!file || !selectedId) return;
    const next: CharacterFile = {
      ...file,
      characters: file.characters.map((character) =>
        character.id === selectedId ? { ...character, ...patch } : character,
      ),
    };
    setFile(next);
    dirty.current = true;
  }

  useEffect(() => {
    if (job?.phase !== 'saved' || !job.result) return;
    setNeedsOnboarding(false);
    setFile(job.result);
    setSelectedId(job.result.characters[0]?.id ?? null);
  }, [job?.phase, job?.result]);

  function importFromExplorer() {
    if (pending || job?.phase === 'generating') return;
    setPending(true);
    setMessage('');
    pickWorkspaceFile('选择人物文件')
      .then((path) => {
        if (path) void startCharacterImport({ projectId, filePath: path });
      })
      .catch(() => setMessage('打开系统文件选择器失败，请确认本地 api 服务正在运行。'))
      .finally(() => setPending(false));
  }

  function finish() {
    if (!onBack || pending) return;
    const payload = file ?? { characters: [], relationships: [] };
    dirty.current = false;
    saveSeq.current += 1;
    setStatus('saving');
    setPending(true);
    saveCharacters(payload, projectId)
      .then(() => {
        setStatus('saved');
        onBack();
      })
      .catch(() => setStatus('error'))
      .finally(() => setPending(false));
  }

  function createCharacter() {
    const nextCharacter: CharacterRecord = { id: `char-${Date.now()}`, name: '新角色', role: '配角' };
    const next: CharacterFile = {
      ...(file ?? { characters: [], relationships: [] }),
      characters: [...(file?.characters ?? []), nextCharacter],
    };
    setFile(next);
    setNeedsOnboarding(false);
    setSelectedId(nextCharacter.id);
    dirty.current = true;
  }

  return (
    <section className="characters-page" aria-label="人物">
      <header className="characters-page__header">
        <div>
          <h2>人物档案</h2>
          <h3 className="sr-only">人物</h3>
          <p>管理你的角色，构建生动立体的人物群像</p>
        </div>
        {job && (job.phase === 'generating' || job.phase === 'error') ? null : (
          <div className="characters-page__actions">
            <button
              type="button"
              className="bixin-btn"
              disabled={pending}
              onClick={importFromExplorer}
            >
              批量导入
            </button>
            <button type="button" className="bixin-btn bixin-btn--primary" disabled={pending} onClick={createCharacter}>
              新建角色
            </button>
            {onBack ? (
              <button
                type="button"
                className="bixin-btn bixin-btn--primary"
                disabled={pending}
                onClick={finish}
              >
                完成
              </button>
            ) : null}
          </div>
        )}
        <span role="status">{STATUS_LABEL[status]}</span>
      </header>
      {message ? <p role="alert">{message}</p> : null}
      {job && (job.phase === 'generating' || job.phase === 'error') ? (
        <CharacterImportPreview
          projectId={projectId}
          filePath={job.filePath}
          onSaved={(saved) => {
            setNeedsOnboarding(false);
            setFile(saved);
            setSelectedId(saved.characters[0]?.id ?? null);
          }}
          onCancel={() => {
            cancelImportJob(projectId, 'characters');
            if (!file || file.characters.length === 0) setNeedsOnboarding(true);
          }}
        />
      ) : needsOnboarding ? (
        <DomainOnboarding
          kind="characters"
          projectId={projectId}
          domainLabel="人物"
          onSaved={(saved) => {
            setNeedsOnboarding(false);
            setFile(saved);
            setSelectedId(saved.characters[0]?.id ?? null);
          }}
          onStartEmpty={() => {
            setNeedsOnboarding(false);
            setFile({ characters: [], relationships: [] });
          }}
        />
      ) : null}
      {job && (job.phase === 'generating' || job.phase === 'error') || needsOnboarding ? null : (
        <div className="characters-page__body">
          <aside className="characters-page__list" aria-label="角色列表">
            <label className="characters-page__search">
              <span className="sr-only">搜索角色</span>
              <input
                type="search"
                value={searchQuery}
                placeholder="搜索角色..."
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <ul aria-label="人物列表">
              {visibleCharacters?.map((character) => (
                <li key={character.id}>
                  <button aria-label={character.name} type="button" aria-pressed={character.id === selectedId} onClick={() => setSelectedId(character.id)}>
                    <img src={characterPortraits[portraitKey(character.id)]} alt="" />
                    <strong>{character.name}</strong>
                    <span>{character.role}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          {selected ? (
            <div className="characters-page__detail">
              <div className="characters-page__banner">
                <div className="characters-page__banner-portrait">
                  <img src={characterBanners[portraitKey(selected.id)]} alt="" />
                </div>
                <div className="characters-page__banner-copy">
                  <div className="characters-page__banner-title">
                    <h3 aria-label={selected.name}>
                      <label>
                        <span className="sr-only">编辑姓名</span>
                        <input value={selected.name} onChange={(event) => updateSelected({ name: event.target.value })} />
                      </label>
                    </h3>
                    <span className="characters-page__badge">{selected.role}</span>
                  </div>
                  <p>{selected.goal || '尚未填写目标'}</p>
                </div>
              </div>
              <div className="characters-page__tabs" role="tablist" aria-label="角色资料">
                {['档案', '关系', '经历', '笔记', '语音', '设定历史'].map((tab, index) => (
                  <button key={tab} type="button" role="tab" aria-selected={index === 0} disabled={index !== 0} aria-disabled={index !== 0}>{tab}</button>
                ))}
              </div>
              <div className="characters-page__grid">
                <form className="characters-page__form characters-page__form--profile" aria-label={`${selected.name} 的资料`} onSubmit={(event) => event.preventDefault()}>
                  <h3>基础信息</h3>
                  <label>角色<input value={selected.role} onChange={(event) => updateSelected({ role: event.target.value })} /></label>
                  <label>目标<input value={selected.goal ?? ''} onChange={(event) => updateSelected({ goal: event.target.value })} /></label>
                  <label>知情<textarea value={selected.knows ?? ''} onChange={(event) => updateSelected({ knows: event.target.value })} /></label>
                </form>
                <article className="characters-page__card characters-page__card--arc"><h3>人物弧光</h3><CharacterArcChart points={ARC_POINTS} /></article>
                <article className="characters-page__card characters-page__card--goal"><h3>目标与动机</h3><p>{selected.goal || '尚未填写'}</p></article>
                <article className="characters-page__card characters-page__card--knows"><h3>已知信息</h3><p>{selected.knows || '尚未填写'}</p></article>
                <article className="characters-page__card characters-page__card--relationships"><h3>人物关系</h3><div className="characters-page__relationships">
                  {(file?.relationships ?? []).filter((relationship) => relationship.fromCharacterId === selected.id || relationship.toCharacterId === selected.id).map((relationship) => {
                    const partnerId = relationship.fromCharacterId === selected.id ? relationship.toCharacterId : relationship.fromCharacterId;
                    const partner = file?.characters.find((character) => character.id === partnerId);
                    if (!partner) return null;
                    return <button type="button" key={relationship.id} onClick={onOpenRelations}><img src={characterPortraits[portraitKey(partner.id)]} alt="" /><span>{partner.name}</span></button>;
                  })}
                </div></article>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
