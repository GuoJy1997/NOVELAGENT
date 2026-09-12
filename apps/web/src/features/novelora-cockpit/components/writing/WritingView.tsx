import { useEffect, useState } from 'react';
import {
  createTask,
  fetchChapter,
  fetchProject,
  runTask,
  saveChapter,
  type ChapterContent,
  type ProjectMeta,
} from '../../lib/noveloraApi';
import { ChapterDirSetup } from '../home/ChapterDirSetup';
import { CandidateReview } from './CandidateReview';
import { ChapterEditor } from './ChapterEditor';
import { ChapterList } from './ChapterList';
import { EchoChat } from './EchoChat';
import './WritingView.css';

interface WritingViewProps {
  projectId: string;
  chapterNum: number;
  onSelectChapter: (num: number) => void;
  onBack: () => void;
}

export function WritingView({ projectId, chapterNum, onSelectChapter, onBack }: WritingViewProps) {
  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [chapter, setChapter] = useState<ChapterContent | null>(null);
  const [error, setError] = useState(false);
  const [delegateStatus, setDelegateStatus] = useState('');
  const [candidateRefreshKey, setCandidateRefreshKey] = useState(0);
  const [toast, setToast] = useState('');
  const [saveStatus, setSaveStatus] = useState('已保存');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    fetchProject(projectId)
      .then((meta) => { if (!cancelled) setProject(meta); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    if (!project || project.chapters.length === 0) return undefined;
    let cancelled = false;
    fetchChapter(chapterNum, projectId)
      .then((content) => { if (!cancelled) setChapter(content); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [project, projectId, chapterNum]);

  useEffect(() => {
    setPreview(false);
  }, [projectId, chapterNum]);

  function refetchChapter() {
    fetchChapter(chapterNum, projectId)
      .then((content) => setChapter(content))
      .catch(() => setError(true));
  }

  if (error) {
    return (
      <div className="bixin-writing" aria-label="写作工作台">
        <p role="status">写作数据不可用。请检查本地 api 服务。</p>
        <button type="button" className="bixin-btn" onClick={onBack}>返回首页</button>
      </div>
    );
  }

  if (project && project.chapters.length === 0) {
    return (
      <div className="bixin-writing" aria-label="写作工作台">
        <ChapterDirSetup
          projectId={projectId}
          onComplete={() => {
            fetchProject(projectId)
              .then((meta) => setProject(meta))
              .catch(() => setError(true));
          }}
          onCancel={onBack}
        />
      </div>
    );
  }

  return (
    <div className="bixin-writing" aria-label="写作工作台">
      <header className="bixin-writing__bar">
        <div className="bixin-writing__identity">
          <div className="bixin-writing__title-row">
            <h1>写作</h1>
            <strong>{project?.title ?? '加载作品…'}</strong>
          </div>
          <p>第 {chapterNum} 章{chapter ? ` · ${chapter.title}` : ''}</p>
        </div>
        <div className="bixin-writing__actions">
          <span className="bixin-writing__save-status" role="status" aria-label="保存状态">{saveStatus}</span>
          <button type="button" className="bixin-btn" onClick={onBack}>返回首页</button>
          <button
            type="button"
            className="bixin-btn"
            aria-label="预览"
            aria-pressed={preview}
            onClick={() => setPreview((value) => !value)}
          >
            预览
          </button>
          <button
            type="button"
            className="bixin-btn bixin-btn--primary"
            onClick={() => {
              setDelegateStatus('委派中');
              createTask({ recipe: 'chapter', chapterNums: [chapterNum] }, projectId)
                .then((created) => runTask(created.id, projectId))
                .then(() => setDelegateStatus('已委派'))
                .catch(() => setDelegateStatus('委派失败'));
            }}
          >
            委派本章
          </button>
          {delegateStatus ? <span role="status">{delegateStatus}</span> : null}
          <button type="button" className="bixin-btn" onClick={() => { setToast('更多操作暂未在演示版开放。'); window.setTimeout(() => setToast(''), 2500); }}>更多</button>
          {toast ? <span role="status">{toast}</span> : null}
        </div>
      </header>
      {project ? (
        <div className="bixin-writing__chapters">
          <ChapterList chapters={project.chapters} selectedNum={chapterNum} onSelect={onSelectChapter} />
        </div>
      ) : null}
      <section className="bixin-writing__editor" aria-label="章节编辑">
        {chapter ? (
          <ChapterEditor
            key={`editor:${projectId}:${chapter.num}`}
            chapterKey={`${projectId}:${chapter.num}`}
            chapterTitle={chapter.title}
            chapterNum={chapter.num}
            initialContent={chapter.content}
            preview={preview}
            onSave={(content) => saveChapter(chapter.num, content, projectId)}
            onSaveStatusChange={setSaveStatus}
            onAiAction={(label) => { setToast(`「${label}」请在右侧 Hermes 面板使用。`); window.setTimeout(() => setToast(''), 2500); }}
          />
        ) : null}
        <CandidateReview
          key={`review:${projectId}:${chapterNum}`}
          projectId={projectId}
          chapterNum={chapterNum}
          refreshKey={candidateRefreshKey}
          onAccepted={refetchChapter}
        />
      </section>
      <aside className="bixin-writing__chat">
        <EchoChat
          key={projectId}
          context={chapter ? `Chapter ${chapter.num} "${chapter.title}"\nExcerpt: ${chapter.content.slice(0, 500)}` : 'No chapter selected'}
          chapterNum={chapterNum}
          projectId={projectId}
          cwd={project?.rootPath}
          onCandidatesChanged={() => setCandidateRefreshKey((key) => key + 1)}
        />
      </aside>
    </div>
  );
}
