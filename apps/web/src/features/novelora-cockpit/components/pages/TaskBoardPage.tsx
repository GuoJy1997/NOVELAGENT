import { useEffect, useState } from 'react';
import {
  acceptTaskDraft,
  discardTaskDraft,
  fetchTasks,
  runTask,
  stopTask,
  type RecipeId,
  type RecipeTask,
} from '../../lib/noveloraApi';
import './TaskBoardPage.css';

interface TaskBoardPageProps {
  projectId: string;
}

type ColumnId = 'queued' | 'running' | 'awaiting_accept' | 'done';

const COLUMNS: { id: ColumnId; label: string; statuses: string[] }[] = [
  { id: 'queued', label: '排队', statuses: ['queued'] },
  { id: 'running', label: '进行中', statuses: ['running', 'blocked'] },
  { id: 'awaiting_accept', label: '待接受', statuses: ['awaiting_accept'] },
  { id: 'done', label: '完成', statuses: ['done'] },
];

const RECIPE_LABEL: Record<RecipeId, string> = {
  chapter: '单章',
  act: '一幕',
  volume: '一卷',
};

const STEPS = ['read_context', 'draft', 'self_check', 'park_draft', 'await_accept'] as const;

const STEP_LABEL: Record<string, string> = {
  read_context: '读上下文',
  draft: '起草',
  self_check: '自检',
  park_draft: '落候选',
  await_accept: '待接受',
};

function waitingChapterNum(task: RecipeTask): number {
  if (task.status === 'awaiting_accept' && task.currentIndex > 0) {
    return task.chapterNums[task.currentIndex - 1];
  }
  return task.chapterNums[task.currentIndex];
}

function chapterRange(nums: number[]): string {
  if (nums.length === 0) return '';
  if (nums.length === 1) return `第 ${nums[0]} 章`;
  return `第 ${nums[0]}-${nums[nums.length - 1]} 章`;
}

function defaultOpenId(tasks: RecipeTask[]): string | null {
  return tasks.find((item) => item.status === 'awaiting_accept')?.id ?? tasks[0]?.id ?? null;
}

export function TaskBoardPage({ projectId }: TaskBoardPageProps) {
  const [tasks, setTasks] = useState<RecipeTask[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  function loadTasks() {
    return fetchTasks(projectId)
      .then((next) => {
        setTasks(next);
        setOpenId((current) => current ?? defaultOpenId(next));
        setError(false);
      })
      .catch(() => setError(true));
  }

  useEffect(() => {
    let cancelled = false;
    fetchTasks(projectId)
      .then((next) => {
        if (cancelled) return;
        setTasks(next);
        setOpenId(defaultOpenId(next));
        setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const openTask = tasks.find((item) => item.id === openId);

  async function runAction(action: () => Promise<unknown>) {
    try {
      await action();
      await loadTasks();
    } catch {
      setError(true);
    }
  }

  async function onAccept() {
    if (!openTask) return;
    await runAction(() => acceptTaskDraft(openTask.id, waitingChapterNum(openTask), projectId));
  }

  async function onDiscard() {
    if (!openTask) return;
    await runAction(() => discardTaskDraft(openTask.id, waitingChapterNum(openTask), projectId));
  }

  async function onContinue() {
    if (!openTask) return;
    await runAction(() => runTask(openTask.id, projectId));
  }

  async function onStop() {
    if (!openTask) return;
    await runAction(() => stopTask(openTask.id, projectId));
  }

  return (
    <section className="task-board-page" aria-label="任务">
      <header className="task-board-page__header">
        <h2>任务</h2>
        {error ? <span role="status">任务数据不可用</span> : null}
      </header>
      <div className="task-board">
        {COLUMNS.map((column) => {
          const cards = tasks.filter((item) => column.statuses.includes(item.status));
          return (
            <section key={column.id} className="task-board__column" aria-label={column.label}>
              <h3>{column.label}</h3>
              <ul className="task-board__list">
                {cards.map((item) => {
                  const open = item.id === openId;
                  return (
                    <li key={item.id}>
                      <article className={`task-board__card${open ? ' is-open' : ''}`}>
                        <button
                          type="button"
                          className="task-board__card-toggle"
                          aria-expanded={open}
                          onClick={() => setOpenId(item.id)}
                        >
                          <span className="task-board__recipe">{RECIPE_LABEL[item.recipe]}</span>
                          <span>{chapterRange(item.chapterNums)}</span>
                          <span>{STEP_LABEL[item.step] ?? item.step}</span>
                          {item.status === 'blocked' ? (
                            <span className="task-board__badge">已阻塞</span>
                          ) : null}
                        </button>
                        {open ? (
                          <div className="task-board__detail">
                            <ol className="task-board__steps">
                              {STEPS.map((step) => (
                                <li
                                  key={step}
                                  className={
                                    step === item.step
                                      ? 'task-board__step is-current'
                                      : 'task-board__step'
                                  }
                                >
                                  <span className="task-board__step-dot" />
                                  <span>{STEP_LABEL[step]}</span>
                                </li>
                              ))}
                            </ol>
                            <ul className="task-board__log">
                              {item.log.map((line, index) => (
                                <li key={`${item.id}-log-${index}`}>{line}</li>
                              ))}
                            </ul>
                            <div className="task-board__actions">
                              <button type="button" onClick={() => void onAccept()}>接受</button>
                              <button type="button" onClick={() => void onDiscard()}>丢弃</button>
                              <button type="button" onClick={() => void onContinue()}>继续</button>
                              <button type="button" onClick={() => void onStop()}>停止</button>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}
