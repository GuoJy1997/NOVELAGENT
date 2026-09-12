import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { countWordsLocal } from './wordCount';

type SaveStatus = 'saved' | 'saving' | 'error';

interface ChapterEditorProps {
  chapterKey: string;
  chapterTitle?: string;
  chapterNum?: number;
  initialContent: string;
  preview?: boolean;
  onSave: (content: string) => Promise<{ words: number }>;
  onSaveStatusChange?: (status: string) => void;
  onAiAction: (label: string) => void;
}

export function ChapterEditor({ chapterKey, chapterTitle, chapterNum, initialContent, preview = false, onSave, onSaveStatusChange, onAiAction }: ChapterEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const dirty = useRef(false);
  const keyRef = useRef(chapterKey);
  const saveSeq = useRef(0);
  const contentRef = useRef(content);
  const onSaveRef = useRef(onSave);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const statusLabel = status === 'saved' ? '已保存' : status === 'saving' ? '保存中' : '保存失败';

  useEffect(() => {
    onSaveStatusChange?.(statusLabel);
  }, [onSaveStatusChange, statusLabel]);

  function applyMarkdown(kind: 'bold' | 'italic' | 'underline' | 'quote' | 'list') {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const wrappers = { bold: ['**', '**'], italic: ['*', '*'], underline: ['<u>', '</u>'] } as const;
    let next = content;
    let cursor = start;
    if (kind === 'quote' || kind === 'list') {
      const prefix = kind === 'quote' ? '> ' : '- ';
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      const selectionEnd = end > start ? end : start;
      const lineEndIndex = content.indexOf('\n', selectionEnd);
      const lineEnd = lineEndIndex === -1 ? content.length : lineEndIndex;
      const block = content.slice(lineStart, lineEnd);
      const transformed = block.split('\n').map((line) => `${prefix}${line}`).join('\n');
      next = `${content.slice(0, lineStart)}${transformed}${content.slice(lineEnd)}`;
      cursor = end > start ? start + transformed.length : start + prefix.length;
    } else {
      const [open, close] = wrappers[kind];
      next = `${content.slice(0, start)}${open}${selected}${close}${content.slice(end)}`;
      cursor = selected ? start + open.length + selected.length + close.length : start + open.length;
    }
    dirty.current = true;
    setContent(next);
    requestAnimationFrame(() => textarea.setSelectionRange(cursor, cursor));
  }
  const toolbar = [['撤销', null], ['重做', null], ['加粗', 'bold'], ['斜体', 'italic'], ['下划线', 'underline'], ['引用', 'quote'], ['无序列表', 'list']] as const;
  const aiActions = ['润色', '扩写', '改写', '对话', 'Ask Hermes'];

  return (
    <div className="bixin-editor">
      <div className="bixin-editor__meta">
        {chapterTitle ? <div className="bixin-editor__chapter-heading"><span>第 {chapterNum} 章</span><h2>{chapterTitle}</h2></div> : null}
        <span>字数 {countWordsLocal(content)}</span>
      </div>
      <div className="bixin-editor__toolbar" role="toolbar" aria-label="编辑工具">
        {toolbar.map(([label, kind]) => <button key={label} type="button" aria-label={label} aria-disabled={kind ? undefined : 'true'} onClick={() => kind && applyMarkdown(kind)}>{label}</button>)}
      </div>
      {preview ? (
        <div
          className="bixin-editor__preview"
          aria-label="章节预览"
          dangerouslySetInnerHTML={{ __html: marked.parse(content, { async: false }) }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          aria-label="章节正文"
          value={content}
          onChange={(event) => {
            dirty.current = true;
            setContent(event.target.value);
          }}
        />
      )}
      <div className="bixin-editor__ai-bar">{aiActions.map((label) => <button key={label} type="button" onClick={() => onAiAction(label)}>{label}</button>)}</div>
      <div className="bixin-editor__stats"><span>本章 {countWordsLocal(content)} 字</span><span>预计阅读 {Math.max(1, Math.round(countWordsLocal(content) / 400))} 分钟</span><span role="status">{statusLabel}</span></div>
    </div>
  );
}
