import { useEffect, useRef } from 'react';
import {
  startDocumentImport,
  useImportJob,
} from '../../lib/importSession';

type DocumentKind = 'outline' | 'world';

interface DocumentImportPreviewProps {
  projectId: string;
  filePath: string;
  documentKind: DocumentKind;
  domainLabel: string;
  onImport: (content: string) => Promise<void>;
  onCancel: () => void;
}

export function DocumentImportPreview({
  projectId,
  filePath,
  documentKind,
  domainLabel,
  onImport,
  onCancel,
}: DocumentImportPreviewProps) {
  const job = useImportJob(projectId, documentKind);
  const applied = useRef('');

  useEffect(() => {
    void startDocumentImport({ projectId, kind: documentKind, filePath });
  }, [projectId, documentKind, filePath]);

  useEffect(() => {
    if (job?.phase !== 'saved' || !job.output) return;
    const token = `${job.filePath}:${job.output}`;
    if (applied.current === token) return;
    applied.current = token;
    void onImport(job.output);
  }, [job, onImport]);

  const phase = job?.phase ?? 'generating';
  const output = job?.output ?? '';
  const reasoning = job?.reasoning ?? '';
  const preview = output || (phase === 'saved' ? reasoning : '');

  return (
    <section className="bixin-import" aria-label={`${domainLabel}整理预览`}>
      <header className="bixin-import__header">
        <h3>{`从「${job?.filePath ?? filePath}」整理${domainLabel}`}</h3>
      </header>
      {phase === 'generating' ? <p role="status">正在整理为可用的设定…</p> : null}
      {phase === 'error' ? (
        <div className="bixin-import__error">
          <p role="alert">整理失败，请重试或改为手动编辑。</p>
          <button
            type="button"
            className="bixin-btn"
            onClick={() => void startDocumentImport({ projectId, kind: documentKind, filePath })}
          >
            重试
          </button>
          <button type="button" className="bixin-btn" onClick={onCancel}>
            手动创建
          </button>
        </div>
      ) : null}
      {preview ? (
        <div className="bixin-import__preview">
          <pre className="bixin-onboarding__excerpt" aria-label="整理预览">
            {preview}
          </pre>
          {phase === 'generating' || phase === 'saved' ? (
            <div className="bixin-import__actions">
              <button
                type="button"
                className="bixin-btn"
                onClick={() => void startDocumentImport({ projectId, kind: documentKind, filePath, force: true })}
              >
                重新生成
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
      {phase === 'generating' && reasoning && !output ? (
        <pre className="bixin-import__stream" aria-label="整理思考">{reasoning}</pre>
      ) : null}
    </section>
  );
}
