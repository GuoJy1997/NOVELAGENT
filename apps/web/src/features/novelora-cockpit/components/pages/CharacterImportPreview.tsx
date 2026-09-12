import { useEffect, useRef } from 'react';
import {
  startCharacterImport,
  useImportJob,
} from '../../lib/importSession';
import type { CharacterFile } from '../../lib/noveloraApi';

interface CharacterImportPreviewProps {
  projectId: string;
  filePath: string;
  onSaved: (file: CharacterFile) => void;
  onCancel: () => void;
}

export function CharacterImportPreview({
  projectId,
  filePath,
  onSaved,
  onCancel,
}: CharacterImportPreviewProps) {
  const job = useImportJob(projectId, 'characters');
  const applied = useRef('');

  useEffect(() => {
    void startCharacterImport({ projectId, filePath });
  }, [filePath, projectId]);

  useEffect(() => {
    if (job?.phase !== 'saved' || !job.result) return;
    const token = `${job.filePath}:${job.result.characters.map((character) => character.id).join(',')}`;
    if (applied.current === token) return;
    applied.current = token;
    onSaved(job.result);
  }, [job, onSaved]);

  const phase = job?.phase ?? 'generating';
  const output = job?.output ?? '';
  const reasoning = job?.reasoning ?? '';
  const result = job?.result ?? null;

  return (
    <section className="bixin-import" aria-label="人物提取预览">
      <header className="bixin-import__header">
        <h3>从「{job?.filePath ?? filePath}」提取人物与关系</h3>
      </header>
      {phase === 'generating' ? (
        <p role="status">正在提取人物与关系…</p>
      ) : null}
      {phase === 'error' ? (
        <div className="bixin-import__error">
          <p role="alert">提取失败，请重试或手动创建。</p>
          <button
            type="button"
            className="bixin-btn"
            onClick={() => void startCharacterImport({ projectId, filePath })}
          >
            重试
          </button>
          <button type="button" className="bixin-btn" onClick={onCancel}>
            手动创建
          </button>
        </div>
      ) : null}
      {result ? (
        <div className="bixin-import__preview">
          <table className="bixin-import__table" aria-label="人物预览">
            <thead>
              <tr><th>姓名</th><th>角色</th><th>目标</th></tr>
            </thead>
            <tbody>
              {result.characters.map((character) => (
                <tr key={character.id}>
                  <td>{character.name}</td>
                  <td>{character.role}</td>
                  <td>{character.goal ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="bixin-import__table" aria-label="关系预览">
            <thead>
              <tr><th>从</th><th>到</th><th>关系</th><th>张力</th></tr>
            </thead>
            <tbody>
              {result.relationships.map((relationship) => (
                <tr key={relationship.id}>
                  <td>{relationship.fromCharacterId}</td>
                  <td>{relationship.toCharacterId}</td>
                  <td>{relationship.label}</td>
                  <td>{relationship.tension}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bixin-import__actions">
            <button
              type="button"
              className="bixin-btn"
              onClick={() => void startCharacterImport({ projectId, filePath, force: true })}
            >
              重新生成
            </button>
          </div>
        </div>
      ) : null}
      {phase === 'generating' && reasoning && !output ? (
        <pre className="bixin-import__stream" aria-label="提取思考">{reasoning}</pre>
      ) : null}
      {phase === 'generating' && output ? (
        <pre className="bixin-import__stream" aria-label="提取输出">{output}</pre>
      ) : null}
    </section>
  );
}
