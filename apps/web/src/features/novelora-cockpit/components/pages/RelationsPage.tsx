import { useEffect, useRef, useState } from 'react';
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
  type RelationshipRecord,
} from '../../lib/noveloraApi';
import { KIND_META } from '../../types';
import type { CharacterNode, CharacterRelationship, RelationshipKind } from '../../types';
import { portraitKey } from '../../lib/portraitKey';
import { CharacterGraph } from '../CharacterGraph';
import { characterPortraits } from '../../assetRegistry';
import { CharacterImportPreview } from './CharacterImportPreview';
import { DomainOnboarding } from './DomainOnboarding';
import './RelationsPage.css';

interface RelationsPageProps {
  projectId: string;
  onBack?: () => void;
}

type SaveStatus = 'saved' | 'saving' | 'error';

const STATUS_LABEL: Record<SaveStatus, string> = {
  saved: '已保存',
  saving: '保存中',
  error: '保存失败',
};

const RELATIONSHIP_KINDS: readonly RelationshipKind[] = ['ally', 'neutral', 'rival', 'unknown', 'friend', 'deal', 'kin', 'mentor'];
function clampScale(value: number) { return Math.round(Math.min(2, Math.max(0.6, value)) * 10) / 10; }
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

function relationshipKind(kind: string): RelationshipKind {
  return RELATIONSHIP_KINDS.includes(kind as RelationshipKind) ? kind as RelationshipKind : 'unknown';
}

export function RelationsPage({ projectId, onBack }: RelationsPageProps) {
  const [file, setFile] = useState<CharacterFile | null>(null);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [focusId, setFocusId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const saveSeq = useRef(0);
  const dirty = useRef(false);
  const fileRef = useRef(file);
  const projectIdRef = useRef(projectId);
  const job = useImportJob(projectId, 'characters');

  useEffect(() => {
    fileRef.current = file;
    if (file && (!focusId || !file.characters.some((character) => character.id === focusId))) setFocusId(file.characters[0]?.id ?? null);
  }, [file, focusId]);

  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    dirty.current = false;
    setNeedsOnboarding(false);
    fetchCharacters(projectId)
      .then((next) => {
        if (cancelled) return;
        const current = getImportJob(projectId, 'characters');
        if (current?.phase === 'generating' || current?.phase === 'saved') return;
        if (next.characters.length === 0) {
          setNeedsOnboarding(true);
          setFile({ characters: [], relationships: [] });
          return;
        }
        setFile(next);
        setFocusId(next.characters[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setNeedsOnboarding(true);
          setFile({ characters: [], relationships: [] });
        }
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

  useEffect(() => {
    if (job?.phase !== 'saved' || !job.result) return;
    setNeedsOnboarding(false);
    setFile(job.result);
    setFocusId(job.result.characters[0]?.id ?? null);
  }, [job?.phase, job?.result]);

  function updateLabel(relationshipId: string, label: string) {
    if (!file) return;
    const next: CharacterFile = {
      ...file,
      relationships: file.relationships.map((relationship) =>
        relationship.id === relationshipId ? { ...relationship, label } : relationship,
      ),
    };
    setFile(next);
    dirty.current = true;
  }

  function importFromExplorer() {
    if (pending || job?.phase === 'generating') return;
    setPending(true);
    setMessage('');
    pickWorkspaceFile('选择关系文件')
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

  return (
    <section className="relations-page" aria-label="关系">
      <header className="relations-page__header">
        <div><h2>人物关系网</h2><p>可视化角色关系，洞察故事脉络</p></div>
        {job && (job.phase === 'generating' || job.phase === 'error') ? null : (
          <div className="relations-page__actions">
            <button
              type="button"
              className="bixin-btn"
              disabled={pending}
              onClick={importFromExplorer}
            >
              从文件导入
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
            setFocusId(saved.characters[0]?.id ?? null);
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
          domainLabel="关系"
          onSaved={(saved) => {
            setNeedsOnboarding(false);
            setFile(saved);
            setFocusId(saved.characters[0]?.id ?? null);
          }}
          onStartEmpty={() => {
            setNeedsOnboarding(false);
            setFile({ characters: [], relationships: [] });
          }}
        />
      ) : null}
      {job && (job.phase === 'generating' || job.phase === 'error') || needsOnboarding ? null : (
        <>
          {file ? (
            <div className="relations-page__body">
              <div className="relations-page__canvas">
                <div className="relations-page__canvas-inner">
                  <div className="relations-page__graph-content" style={{ zoom: scale }}>
                  <CharacterGraph characters={file.characters.map(toCharacterNode)} relationships={file.relationships.map(toRelationship)} title="人物关系图" onSelectCharacter={setFocusId} />
                  </div>
                </div>
                <div className="relations-page__controls">
                  <button type="button" className="bixin-btn" onClick={() => setScale((value) => clampScale(value + 0.2))}>放大</button>
                  <button type="button" className="bixin-btn" onClick={() => setScale((value) => clampScale(value - 0.2))}>缩小</button>
                  <button type="button" className="bixin-btn" onClick={() => setScale(1)}>居中</button>
                </div>
              </div>
              <aside className="relations-page__detail" aria-label="关系详情">
                {!focusId ? <p>点击图中角色查看关系详情</p> : (() => {
                  const focus = file.characters.find((character) => character.id === focusId);
                  if (!focus) return <p>点击图中角色查看关系详情</p>;
                  const relations = file.relationships.filter((relationship) => relationship.fromCharacterId === focus.id || relationship.toCharacterId === focus.id);
                  const counts = relations.reduce<Record<RelationshipKind, number>>((result, relationship) => {
                    const kind = relationshipKind(relationship.kind);
                    result[kind] = (result[kind] ?? 0) + 1;
                    return result;
                  }, {} as Record<RelationshipKind, number>);
                  return <>
                    <div className="relations-page__detail-person"><img src={characterPortraits[portraitKey(focus.id)]} alt="" /><div><h3>{focus.name}</h3><span>{focus.role}</span></div></div>
                    <h4>关系概览</h4>
                    <ul className="relations-page__summary-list" aria-label="关系概览">
                      {Object.entries(counts).map(([kind, count]) => {
                        const typedKind = kind as RelationshipKind;
                        return <li key={typedKind} className={`relations-page__summary-card relations-page__summary-card--${typedKind}`} aria-label={`${KIND_META[typedKind].label} ${count}`}>
                          <span>{KIND_META[typedKind].label}</span><strong>{count}</strong>
                        </li>;
                      })}
                    </ul>
                    {relations.length > 0 ? <><h4>关键关系</h4><ul className="relations-page__key-list" aria-label="关系标签">{relations.map((relationship) => {
                      const otherId = relationship.fromCharacterId === focus.id ? relationship.toCharacterId : relationship.fromCharacterId;
                      const kind = relationshipKind(relationship.kind);
                      const other = file.characters.find((character) => character.id === otherId);
                      const otherName = partnerName(file, otherId);
                      return <li key={relationship.id} aria-label={`${otherName} · ${KIND_META[kind].label}`}>
                        {other ? <img src={characterPortraits[portraitKey(other.id)]} alt="" /> : null}
                        <div><span className="relations-page__key-context">{focus.name} 与 {otherName}</span><strong>{otherName}</strong><span>{KIND_META[kind].label}</span></div>
                        <input aria-label={`${partnerName(file, relationship.fromCharacterId)} 与 ${partnerName(file, relationship.toCharacterId)}`} value={relationship.label} onChange={(event) => updateLabel(relationship.id, event.target.value)} />
                      </li>;
                    })}</ul></> : null}
                  </>;
                })()}
              </aside>
            </div>
          ) : null}
          {file && file.characters.length > 0 && file.relationships.length === 0 ? (
            <p className="relations-page__empty" role="status" aria-label="还没有关系">
              已有人物，但还没有关系。人物和关系共用一份档案，可以再导入含关系的资料。
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
