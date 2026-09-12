import { useState } from 'react';
import { pickWorkspaceFolder, setChaptersDir, type ChapterMeta } from '../../lib/noveloraApi';

interface ChapterDirSetupProps {
  projectId: string;
  onComplete: () => void;
  onCancel?: () => void;
}

type Phase = 'pick' | 'preview';

export function ChapterDirSetup({ projectId, onComplete, onCancel }: ChapterDirSetupProps) {
  const [phase, setPhase] = useState<Phase>('pick');
  const [selectedDir, setSelectedDir] = useState<string | null>(null);
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  function chooseDir(dir: string) {
    setPending(true);
    setMessage('');
    setChaptersDir(dir, projectId)
      .then((meta) => {
        setSelectedDir(dir);
        if (meta.chapters.length === 0) {
          setChapters([]);
          setMessage(`「${dir}」目录下没有扫描到章节，请重新选择。`);
        } else {
          setChapters(meta.chapters);
          setPhase('preview');
        }
      })
      .catch(() => setMessage('扫描正文目录失败，请确认选中的是当前小说目录下的文件夹。'))
      .finally(() => setPending(false));
  }

  function pickDirectory() {
    if (pending) return;
    setPending(true);
    setMessage('');
    pickWorkspaceFolder('选择正文目录')
      .then((path) => {
        if (!path) {
          setPending(false);
          return;
        }
        chooseDir(path);
      })
      .catch(() => {
        setMessage('打开系统目录选择器失败，请确认本地 api 服务正在运行。');
        setPending(false);
      });
  }

  return (
    <section className="bixin-setup" aria-label="正文目录设置">
      <header className="bixin-setup__header">
        <h3>正文目录设置</h3>
        <p>用系统文件夹窗口选择存放正文章节的目录，确认后生成章节列表。</p>
      </header>
      {phase === 'pick' ? (
        <button
          type="button"
          className="bixin-btn bixin-btn--primary"
          disabled={pending}
          onClick={pickDirectory}
        >
          选择正文目录
        </button>
      ) : null}
      {phase === 'preview' ? (
        <div className="bixin-setup__preview">
          <p role="status">{`已从「${selectedDir ?? ''}」扫描到 ${chapters.length} 个章节：`}</p>
          <ul className="bixin-setup__chapters" aria-label="章节预览">
            {chapters.map((chapter) => (
              <li key={chapter.num}>{`${chapter.num} · ${chapter.title}`}</li>
            ))}
          </ul>
          <div className="bixin-setup__actions">
            <button
              type="button"
              className="bixin-btn"
              onClick={() => {
                setPhase('pick');
                setChapters([]);
              }}
            >
              重新选择
            </button>
            <button type="button" className="bixin-btn bixin-btn--primary" onClick={onComplete}>
              确认
            </button>
          </div>
        </div>
      ) : null}
      {message ? <p role="alert">{message}</p> : null}
      {onCancel ? (
        <button type="button" className="bixin-btn" onClick={onCancel}>
          取消
        </button>
      ) : null}
    </section>
  );
}
