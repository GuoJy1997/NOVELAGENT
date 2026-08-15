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

  useEffect(() => {
    let cancelled = false;
    setError(false);
    fetchProject(projectId)
      .then((meta) => { if (!cancelled) setProject(meta); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    fetchChapter(chapterNum, projectId)
      .then((content) => { if (!cancelled) setChapter(content); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [projectId, chapterNum]);

  if (error) {
    return (
      <div className="writing-view" aria-label="Writing workspace">
        <p role="status">写作数据不可用。请检查本地 api 服务。</p>
        <button type="button" onClick={onBack}>返回首页</button>
      </div>
    );
  }

  return (
    <div className="writing-view" aria-label="Writing workspace">
      <header className="writing-view__bar">
        <button type="button" onClick={onBack}>返回首页</button>
        <button
          type="button"
          className="writing-view__delegate"
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
      </header>
      {project ? (
        <ChapterList chapters={project.chapters} selectedNum={chapterNum} onSelect={onSelectChapter} />
      ) : null}
      <section className="writing-view__editor" aria-label="Chapter editor">
        {chapter ? (
          <ChapterEditor
            key={`${projectId}:${chapter.num}`}
            chapterKey={`${projectId}:${chapter.num}`}
            initialContent={chapter.content}
            onSave={(content) => saveChapter(chapter.num, content, projectId)}
          />
        ) : null}
      </section>
      <aside className="writing-view__chat">
        <EchoChat key={`${projectId}:${chapterNum}`} context={chapter ? `Chapter ${chapter.num} "${chapter.title}"\nExcerpt: ${chapter.content.slice(0, 500)}` : 'No chapter selected'} />
      </aside>
    </div>
  );
}
