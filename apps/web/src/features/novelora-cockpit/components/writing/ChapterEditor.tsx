import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { countWordsLocal } from './wordCount';

type SaveStatus = 'saved' | 'saving' | 'error';

interface ChapterEditorProps {
  chapterKey: string;
  initialContent: string;
  onSave: (content: string) => Promise<{ words: number }>;
}

export function ChapterEditor({ chapterKey, initialContent, onSave }: ChapterEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [preview, setPreview] = useState(false);
  const dirty = useRef(false);
  const keyRef = useRef(chapterKey);
  const saveSeq = useRef(0);
  const contentRef = useRef(content);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    contentRef.current = content;
    onSaveRef.current = onSave;
  }, [content, onSave]);

  useEffect(() => () => {
    if (dirty.current) {
      dirty.current = false;
      saveSeq.current += 1;
      void onSaveRef.current(contentRef.current).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (keyRef.current !== chapterKey) {
      keyRef.current = chapterKey;
      dirty.current = false;
      setContent(initialContent);
      setStatus('saved');
    }
  }, [chapterKey, initialContent]);

  useEffect(() => {
    if (!dirty.current) return undefined;
    setStatus('saving');
    const timer = setTimeout(() => {
      saveSeq.current += 1;
      const seq = saveSeq.current;
      onSave(content)
        .then(() => { if (seq === saveSeq.current) setStatus('saved'); })
        .catch(() => { if (seq === saveSeq.current) setStatus('error'); });
    }, 1500);
    return () => clearTimeout(timer);
  }, [content, onSave]);

  return (
    <div className="chapter-editor">
      <div className="chapter-editor__meta">
        <span role="status">{status === 'saved' ? 'Saved' : status === 'saving' ? 'Saving...' : 'Save failed'}</span>
        <div className="chapter-editor__tools">
          <span>Words: {countWordsLocal(content)}</span>
          <button type="button" aria-label="Preview" aria-pressed={preview} onClick={() => setPreview((value) => !value)}>
            Preview
          </button>
        </div>
      </div>
      {preview ? (
        <div
          className="chapter-editor__preview"
          aria-label="Chapter preview"
          dangerouslySetInnerHTML={{ __html: marked.parse(content, { async: false }) }}
        />
      ) : (
        <textarea
          aria-label="Chapter content"
          value={content}
          onChange={(event) => {
            dirty.current = true;
            setContent(event.target.value);
          }}
        />
      )}
    </div>
  );
}
