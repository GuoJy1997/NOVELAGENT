import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { marked, Renderer } from 'marked';
import {
  Bold,
  Code2,
  FileText,
  Italic,
  Link2,
  List,
  Quote,
  Strikethrough,
  Underline,
} from 'lucide-react';
import {
  cancelImportJob,
  getImportJob,
  startDocumentImport,
  useImportJob,
} from '../../lib/importSession';
import {
  fetchDocument,
  pickWorkspaceFile,
  saveDocument,
} from '../../lib/noveloraApi';
import { DocumentImportPreview } from './DocumentImportPreview';
import { DomainOnboarding } from './DomainOnboarding';
import { MarkdownOutlineTree } from './MarkdownOutlineTree';
import { parseOutline } from '../../lib/markdownOutline';
import './MarkdownDocumentPage.css';

type SaveStatus = 'saved' | 'saving' | 'error' | 'uninitialized';
type DocumentKind = 'outline' | 'world';
type InfoTab = 'structure' | 'bookmarks';

const escapeMarkup = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

// Preview is inert: embedded HTML is text and links/images cannot fetch or execute.
function renderDocument(content: string) {
  const renderer = new Renderer();
  renderer.html = ({ text }) => escapeMarkup(text);
  renderer.link = ({ text }) => escapeMarkup(text);
  renderer.image = ({ text }) => escapeMarkup(text);
  return marked.parse(content, {
    async: false,
    renderer,
  });
}

interface DocumentPresentation {
  headerTitle: string;
  subtitle: string;
  treeLabel: string;
  treeEmptyLabel: string;
  overviewLabel: string;
  overviewHeading: string;
  progressHeading: string;
  sectionMetric: string;
  nestedHeadingMetric: string;
  structureTab: string;
  bookmarkTab: string;
}

interface MarkdownDocumentPageProps {
  projectId: string;
  document: DocumentKind;
  title: string;
  hint: string;
  onBack?: () => void;
}

const STATUS_LABEL: Record<SaveStatus, string> = {
  saved: '已保存',
  saving: '保存中',
  error: '保存失败',
  uninitialized: '未初始化',
};

const DOCUMENT_PRESENTATION = {
  outline: {
    headerTitle: '大纲',
    subtitle: '长篇小说大纲与结构编辑器',
    treeLabel: '文档目录',
    treeEmptyLabel: '暂无大纲标题',
    overviewLabel: '文档概览',
    overviewHeading: '文档统计',
    progressHeading: '大纲总进度',
    sectionMetric: '章节数量',
    nestedHeadingMetric: '结构节点',
    structureTab: '故事结构',
    bookmarkTab: '引用章节',
  },
  world: {
    headerTitle: '大纲 / 世界观',
    subtitle: '梳理故事脉络，构建完整世界观',
    treeLabel: '世界设定目录',
    treeEmptyLabel: '暂无世界设定标题',
    overviewLabel: '世界观概览',
    overviewHeading: '文档概览',
    progressHeading: '整体进度',
    sectionMetric: '设定章节',
    nestedHeadingMetric: '结构条目',
    structureTab: '世界结构',
    bookmarkTab: '书签',
  },
} as const satisfies Record<DocumentKind, DocumentPresentation>;

function isNotFound(error: unknown) {
  return error instanceof Error && /\b404\b/.test(error.message);
}

export function MarkdownDocumentPage({
  projectId,
  document,
  title,
  hint,
  onBack,
}: MarkdownDocumentPageProps) {
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [infoTab, setInfoTab] = useState<InfoTab>('structure');
  const dirty = useRef(false);
  const saveSeq = useRef(0);
  const contentRef = useRef(content);
  const saveRef = useRef<(value: string) => Promise<unknown>>(async () => undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const structureTabRef = useRef<HTMLButtonElement>(null);
  const bookmarksTabRef = useRef<HTMLButtonElement>(null);
  const job = useImportJob(projectId, document);
  const outline = parseOutline(content);
  const wordCount = content.replace(/\s/g, '').length;
  const presentation = DOCUMENT_PRESENTATION[document];
  const sectionCount = outline.filter((node) => node.level <= 2).length;
  const nestedHeadingCount = outline.filter((node) => node.level > 1).length;
  const readingMinutes = Math.max(1, Math.round(wordCount / 400));
  const progress = content.trim()
    ? Math.min(96, Math.max(12, Math.round((outline.length / Math.max(outline.length + 2, 6)) * 100)))
    : 0;

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    setInfoTab('structure');
  }, [document]);

  useEffect(() => {
    saveRef.current = (value: string) => saveDocument(document, value, projectId);
  }, [document, projectId]);

  useEffect(() => {
    let cancelled = false;
    dirty.current = false;
    setStatus('saved');
    fetchDocument(document, projectId)
      .then((doc) => {
        if (cancelled) return;
        const current = getImportJob(projectId, document);
        if (current?.phase === 'generating' || current?.phase === 'saved') return;
        if (doc.content.trim() === '') {
          setStatus('uninitialized');
        } else {
          setContent(doc.content);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus(isNotFound(error) ? 'uninitialized' : 'error');
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

  useEffect(() => {
    if (job?.phase !== 'saved' || !job.output) return;
    dirty.current = false;
    setContent(job.output);
    setStatus('saved');
  }, [job?.phase, job?.output]);

  function importFromExplorer() {
    if (pending || job?.phase === 'generating') return;
    setPending(true);
    setMessage('');
    pickWorkspaceFile(`选择${title}文件`)
      .then((path) => {
        if (path) void startDocumentImport({ projectId, kind: document, filePath: path });
      })
      .catch(() => setMessage('打开系统文件选择器失败，请确认本地 api 服务正在运行。'))
      .finally(() => setPending(false));
  }

  async function applyImported(text: string) {
    dirty.current = false;
    setContent(text);
    setStatus('saved');
  }

  function finish() {
    if (!onBack || pending) return;
    dirty.current = false;
    saveSeq.current += 1;
    setStatus('saving');
    setPending(true);
    saveDocument(document, content, projectId)
      .then(() => {
        setStatus('saved');
        onBack();
      })
      .catch(() => setStatus('error'))
      .finally(() => setPending(false));
  }

  function jumpToLine(line: number) {
    setPreview(false);
    const textarea = textareaRef.current;
    if (!textarea) return;
    const offset = content.split('\n').slice(0, line).reduce((total, current) => total + current.length + 1, 0);
    window.queueMicrotask(() => {
      textarea.focus();
      textarea.setSelectionRange(offset, offset);
      textarea.scrollTop = Math.max(0, line * 32 - textarea.clientHeight / 2);
    });
  }

  function applyMarkdown(prefix: string, suffix = prefix) {
    setPreview(false);
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = `${content.slice(0, start)}${prefix}${content.slice(start, end)}${suffix}${content.slice(end)}`;
    dirty.current = true;
    setContent(next);
    window.queueMicrotask(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    });
  }

  function selectInfoTab(nextTab: InfoTab, moveFocus = false) {
    setInfoTab(nextTab);
    if (!moveFocus) return;
    window.queueMicrotask(() => {
      const nextButton = nextTab === 'structure' ? structureTabRef.current : bookmarksTabRef.current;
      nextButton?.focus();
    });
  }

  function handleInfoTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentTab: InfoTab) {
    let nextTab: InfoTab | undefined;
    if (event.key === 'Home') nextTab = 'structure';
    if (event.key === 'End') nextTab = 'bookmarks';
    if (event.key === 'ArrowRight') nextTab = currentTab === 'structure' ? 'bookmarks' : 'structure';
    if (event.key === 'ArrowLeft') nextTab = currentTab === 'structure' ? 'bookmarks' : 'structure';
    if (!nextTab) return;
    event.preventDefault();
    selectInfoTab(nextTab, true);
  }

  return (
    <section className="markdown-document-page" aria-label={title} data-document={document}>
      <header className="markdown-document-page__header">
        <div className="markdown-document-page__heading">
          {document === 'world' ? <FileText aria-hidden="true" /> : null}
          <div>
            <h2 aria-label={title}>{presentation.headerTitle}</h2>
            <p>{presentation.subtitle}</p>
            {hint ? <span className="markdown-document-page__source-hint">{hint}</span> : null}
          </div>
        </div>
        <div className="markdown-document-page__actions">
          <button type="button" className="bixin-btn" aria-pressed={preview} onClick={() => setPreview((value) => !value)}>{preview ? '编辑文档' : '文档预览'}</button>
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
        <span role="status">{STATUS_LABEL[status]}</span>
      </header>
      {message ? <p role="alert">{message}</p> : null}
      {job && (job.phase === 'generating' || job.phase === 'error') ? (
        <DocumentImportPreview
          projectId={projectId}
          filePath={job.filePath}
          documentKind={document}
          domainLabel={title}
          onImport={applyImported}
          onCancel={() => {
            cancelImportJob(projectId, document);
            if (!content.trim()) setStatus('uninitialized');
          }}
        />
      ) : status === 'uninitialized' ? (
        <DomainOnboarding
          kind="document"
          documentKind={document}
          projectId={projectId}
          domainLabel={title}
          onImport={applyImported}
          onStartEmpty={() => {
            dirty.current = false;
            setContent('');
            setStatus('saved');
          }}
        />
      ) : (
        <div className="markdown-document-page__body">
          <aside className="markdown-document-page__toc" aria-label={presentation.treeLabel}>
            <MarkdownOutlineTree
              nodes={outline}
              onJump={jumpToLine}
              heading={presentation.treeLabel}
              emptyLabel={presentation.treeEmptyLabel}
            />
          </aside>
          <div className="markdown-document-page__paper">
            <div className="markdown-document-page__toolbar" role="toolbar" aria-label={`${title}编辑工具`}>
              <button type="button" aria-label="加粗" onClick={() => applyMarkdown('**')}><Bold aria-hidden="true" /></button>
              <button type="button" aria-label="斜体" onClick={() => applyMarkdown('*')}><Italic aria-hidden="true" /></button>
              <button type="button" aria-label="下划线" onClick={() => applyMarkdown('<u>', '</u>')}><Underline aria-hidden="true" /></button>
              <button type="button" aria-label="删除线" onClick={() => applyMarkdown('~~')}><Strikethrough aria-hidden="true" /></button>
              <span className="markdown-document-page__toolbar-divider" aria-hidden="true" />
              <button type="button" aria-label="二级标题" onClick={() => applyMarkdown('## ', '')}><span aria-hidden="true">H2</span></button>
              <button type="button" aria-label="引用" onClick={() => applyMarkdown('> ', '')}><Quote aria-hidden="true" /></button>
              <button type="button" aria-label="列表" onClick={() => applyMarkdown('- ', '')}><List aria-hidden="true" /></button>
              <button type="button" aria-label="链接" onClick={() => applyMarkdown('[', '](url)')}><Link2 aria-hidden="true" /></button>
              <button type="button" aria-label="代码" onClick={() => applyMarkdown('`')}><Code2 aria-hidden="true" /></button>
            </div>
            <div className="markdown-document-page__editor" hidden={preview}>
              <textarea
                ref={textareaRef}
                aria-label={title}
                value={content}
                onChange={(event) => {
                  dirty.current = true;
                  setContent(event.target.value);
                }}
              />
            </div>
            {preview ? <article className="markdown-document-page__preview" aria-label={`${title}预览`} dangerouslySetInnerHTML={{ __html: renderDocument(content) }} /> : null}
          </div>
          <aside className="markdown-document-page__info" aria-label={presentation.overviewLabel}>
            <section className="markdown-document-page__card markdown-document-page__card--overview">
              <h3>{presentation.overviewHeading}</h3>
              <dl className="markdown-document-page__overview-metrics">
                {document === 'world' ? (
                  <>
                    <div><dt>总字数</dt><dd>{wordCount}</dd></div>
                    <div><dt>{presentation.sectionMetric}</dt><dd>{sectionCount}</dd></div>
                    <div><dt>预计阅读</dt><dd>{readingMinutes} 分钟</dd></div>
                    <div><dt>{presentation.nestedHeadingMetric}</dt><dd>{nestedHeadingCount}</dd></div>
                  </>
                ) : (
                  <>
                    <div><dt>总字数</dt><dd>{wordCount}</dd></div>
                    <div><dt>预计阅读</dt><dd>{readingMinutes} 分钟</dd></div>
                    <div><dt>{presentation.sectionMetric}</dt><dd>{sectionCount}</dd></div>
                    <div><dt>{presentation.nestedHeadingMetric}</dt><dd>{nestedHeadingCount}</dd></div>
                  </>
                )}
              </dl>
              <div className="markdown-document-page__progress">
                <div>
                  <strong>{presentation.progressHeading}</strong>
                  <span>{progress}%</span>
                </div>
                <progress aria-label={presentation.progressHeading} max="100" value={progress} />
                <p>{outline.length ? `已梳理 ${outline.length} 个标题节点` : '添加标题即可建立结构进度'}</p>
              </div>
            </section>
            {document === 'world' ? (
              <section className="markdown-document-page__card markdown-document-page__card--structure">
                <div className="markdown-document-page__tabs" role="tablist" aria-label="世界观结构视图">
                  <button
                    ref={structureTabRef}
                    type="button"
                    role="tab"
                    aria-selected={infoTab === 'structure'}
                    aria-controls="world-structure-panel"
                    id="world-structure-tab"
                    tabIndex={infoTab === 'structure' ? 0 : -1}
                    onClick={() => selectInfoTab('structure')}
                    onKeyDown={(event) => handleInfoTabKeyDown(event, 'structure')}
                  >
                    {presentation.structureTab}
                  </button>
                  <button
                    ref={bookmarksTabRef}
                    type="button"
                    role="tab"
                    aria-selected={infoTab === 'bookmarks'}
                    aria-controls="world-structure-panel"
                    id="world-bookmarks-tab"
                    tabIndex={infoTab === 'bookmarks' ? 0 : -1}
                    onClick={() => selectInfoTab('bookmarks')}
                    onKeyDown={(event) => handleInfoTabKeyDown(event, 'bookmarks')}
                  >
                    {presentation.bookmarkTab}
                  </button>
                </div>
                <div
                  className="markdown-document-page__structure-panel"
                  id="world-structure-panel"
                  role="tabpanel"
                  aria-labelledby={infoTab === 'structure' ? 'world-structure-tab' : 'world-bookmarks-tab'}
                >
                  {infoTab === 'structure' ? (
                    outline.length ? (
                      <ol>
                        {outline.slice(0, 8).map((node) => (
                          <li key={`${node.line}-${node.text}`} data-level={node.level}>{node.text}</li>
                        ))}
                      </ol>
                    ) : <p>暂无世界结构</p>
                  ) : <p>暂无书签</p>}
                </div>
              </section>
            ) : (
              <>
                <section className="markdown-document-page__card">
                  <h3>AI 建议</h3>
                  <ul>
                    <li>建议在当前幕强化主角的内心冲突，提升转折张力。</li>
                    <li>可以为次要角色补充动机线索，避免工具人化。</li>
                  </ul>
                </section>
                <section className="markdown-document-page__card">
                  <h3>导入说明</h3>
                  <p>使用大纲模板可快速构建完整结构，也可以从本地文档导入。</p>
                </section>
              </>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
