import { useEffect, useState } from 'react';
import {
  coverUrl,
  generateCover,
  listProjectFiles,
  listWorkspaces,
  pickWorkspaceFolder,
  registerWorkspace,
  setCover,
  type ProjectMeta,
  type WorkspaceRecord,
} from '../../lib/noveloraApi';
import { ChapterDirSetup } from './ChapterDirSetup';

interface WorkspacePickerProps {
  currentProjectId: string | null;
  onSelect: (projectId: string) => void;
  onClose: () => void;
}

type Phase = 'list' | 'chapters' | 'cover';

export function WorkspacePicker({ currentProjectId, onSelect, onClose }: WorkspacePickerProps) {
  const [phase, setPhase] = useState<Phase>('list');
  const [workspaces, setWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [registered, setRegistered] = useState<ProjectMeta | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [coverVersion, setCoverVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listWorkspaces()
      .then((list) => {
        if (!cancelled) setWorkspaces(list);
      })
      .catch(() => {
        if (!cancelled) setMessage('读取工作区列表失败，请检查本地 api 服务。');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function registerPath(path: string) {
    const trimmed = path.trim();
    if (!trimmed) return Promise.resolve();
    setPending(true);
    setMessage('');
    return registerWorkspace(trimmed)
      .then((meta) => {
        setRegistered(meta);
        if (meta.chapters.length === 0) {
          setPhase('chapters');
        } else {
          enterCoverPhase(meta.id);
        }
      })
      .catch(() => setMessage('无法把该目录注册为工作区，请确认路径存在。'))
      .finally(() => setPending(false));
  }

  function pickNativeDirectory() {
    if (pending) return;
    setPending(true);
    setMessage('');
    pickWorkspaceFolder('选择小说目录')
      .then((path) => {
        if (!path) {
          setPending(false);
          return;
        }
        return registerPath(path);
      })
      .catch(() => {
        setMessage('打开系统目录选择器失败，请确认本地 api 服务正在运行。');
        setPending(false);
      });
  }

  function enterCoverPhase(projectId: string) {
    setPhase('cover');
    listProjectFiles(projectId)
      .then((listing) => setImages(listing.images))
      .catch(() => setImages([]));
  }

  function finish() {
    if (registered) onSelect(registered.id);
  }

  return (
    <div className="bixin-picker" role="dialog" aria-modal="true" aria-label="选择工作区">
      <section className="bixin-picker__panel">
        <header className="bixin-picker__header">
          <h3>选择工作区</h3>
          <p>打开已有小说目录，或在系统窗口中新建文件夹来创建作品。目录名称会作为作品名称。</p>
        </header>

        {phase === 'list' ? (
          <>
            {workspaces.length > 0 ? (
              <ul className="bixin-picker__list" aria-label="已注册工作区">
                {workspaces.map((workspace) => (
                  <li key={workspace.id}>
                    <button
                      type="button"
                      className="bixin-btn"
                      aria-current={workspace.id === currentProjectId ? 'true' : undefined}
                      onClick={() => onSelect(workspace.id)}
                    >
                      {`${workspace.title}（${workspace.rootPath}）`}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p role="status">还没有注册过工作区。</p>
            )}
            <div className="bixin-picker__add">
              <button
                type="button"
                className="bixin-btn bixin-btn--primary"
                disabled={pending}
                onClick={pickNativeDirectory}
              >
                选择小说目录
              </button>
            </div>
          </>
        ) : null}

        {phase === 'chapters' && registered ? (
          <>
            <ChapterDirSetup
              projectId={registered.id}
              onComplete={() => enterCoverPhase(registered.id)}
            />
            <button type="button" className="bixin-btn" onClick={() => enterCoverPhase(registered.id)}>
              暂不导入章节
            </button>
          </>
        ) : null}

        {phase === 'cover' && registered ? (
          <div className="bixin-picker__cover-step">
            <h3>{`为「${registered.title}」设置封面`}</h3>
            {coverVersion > 0 ? (
              <img
                className="bixin-picker__cover-preview"
                src={`${coverUrl(registered.id)}?v=${coverVersion}`}
                alt="封面预览"
                width={120}
                height={120}
              />
            ) : null}
            {images.length > 0 ? (
              <ul className="bixin-picker__images" aria-label="目录内图片">
                {images.map((image) => (
                  <li key={image}>
                    <button
                      type="button"
                      className="bixin-btn"
                      disabled={pending}
                      onClick={() => {
                        setPending(true);
                        setCover(image, registered.id)
                          .then(() => setCoverVersion((version) => version + 1))
                          .catch(() => setMessage('设置封面失败，请重试。'))
                          .finally(() => setPending(false));
                      }}
                    >
                      {image}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="bixin-picker__actions">
              <button
                type="button"
                className="bixin-btn"
                disabled={pending}
                onClick={() => {
                  setPending(true);
                  generateCover(registered.id)
                    .then(() => setCoverVersion((version) => version + 1))
                    .catch(() => setMessage('生成封面失败，请重试。'))
                    .finally(() => setPending(false));
                }}
              >
                自动生成封面
              </button>
              <button type="button" className="bixin-btn bixin-btn--primary" onClick={finish}>
                {coverVersion > 0 ? '完成' : '跳过'}
              </button>
            </div>
          </div>
        ) : null}

        {message ? <p role="alert">{message}</p> : null}
        <button type="button" className="bixin-btn" onClick={onClose}>
          关闭
        </button>
      </section>
    </div>
  );
}
