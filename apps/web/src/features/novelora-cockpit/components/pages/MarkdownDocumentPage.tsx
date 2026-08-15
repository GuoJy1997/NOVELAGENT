import { useEffect, useRef, useState } from 'react';
import { fetchDocument, saveDocument } from '../../lib/noveloraApi';
import './MarkdownDocumentPage.css';

type SaveStatus = 'saved' | 'saving' | 'error';
type DocumentKind = 'outline' | 'world';

interface MarkdownDocumentPageProps {
  projectId: string;
  document: DocumentKind;
  title: string;
  hint: string;
}

const STATUS_LABEL: Record<SaveStatus, string> = {
  saved: '已保存',
  saving: '保存中',
  error: '保存失败',
};

export function MarkdownDocumentPage({
  projectId,
  document,
  title,
  hint,
}: MarkdownDocumentPageProps) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<SaveStatus>('saved');
  const dirty = useRef(false);
  const saveSeq = useRef(0);
  const contentRef = useRef(content);
  const saveRef = useRef<(value: string) => Promise<unknown>>(async () => undefined);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    saveRef.current = (value: string) => saveDocument(document, value, projectId);
  }, [document, projectId]);

  useEffect(() => {
    let cancelled = false;
    dirty.current = false;
    setStatus('saved');
    fetchDocument(document, projectId)
      .then((doc) => {
        if (!cancelled) setContent(doc.content);
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [document, projectId]);

  useEffect(() => () => {
    if (dirty.current) {
      dirty.current = false;
      saveSeq.current += 1;
      void saveRef.current(contentRef.current).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!dirty.current) return undefined;
    setStatus('saving');
    const timer = window.setTimeout(() => {
      saveSeq.current += 1;
      const seq = saveSeq.current;
      saveRef.current(content)
        .then(() => {
          if (seq === saveSeq.current) setStatus('saved');
        })
        .catch(() => {
          if (seq === saveSeq.current) setStatus('error');
        });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [content]);

  return (
    <section className="markdown-document-page" aria-label={title}>
      <header className="markdown-document-page__header">
        <h2>{title}</h2>
        {hint ? <p>{hint}</p> : null}
        <span role="status">{STATUS_LABEL[status]}</span>
      </header>
      <div className="writing-view__editor">
        <div className="chapter-editor">
          <textarea
            aria-label={title}
            value={content}
            onChange={(event) => {
              dirty.current = true;
              setContent(event.target.value);
            }}
          />
        </div>
      </div>
    </section>
  );
}
