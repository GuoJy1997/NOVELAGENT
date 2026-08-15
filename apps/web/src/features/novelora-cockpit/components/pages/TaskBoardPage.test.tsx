import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RecipeTask } from '../../lib/noveloraApi';
import { TaskBoardPage } from './TaskBoardPage';

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

function task(partial: Partial<RecipeTask> & Pick<RecipeTask, 'id' | 'recipe' | 'status'>): RecipeTask {
  return {
    step: 'read_context',
    model: 'hermes-agent',
    chapterNums: [1],
    currentIndex: 0,
    log: [],
    createdAt: '2026-08-15T00:00:00.000Z',
    ...partial,
  };
}

const tasks: RecipeTask[] = [
  task({ id: 't-queued', recipe: 'chapter', status: 'queued', chapterNums: [1] }),
  task({ id: 't-running', recipe: 'act', status: 'running', step: 'draft', chapterNums: [2, 3] }),
  task({ id: 't-blocked', recipe: 'chapter', status: 'blocked', step: 'self_check', chapterNums: [5] }),
  task({
    id: 't-accept',
    recipe: 'volume',
    status: 'awaiting_accept',
    step: 'await_accept',
    chapterNums: [1, 2, 3, 4],
    currentIndex: 2,
    log: ['context', 'pause:act'],
  }),
  task({ id: 't-done', recipe: 'chapter', status: 'done', step: 'await_accept', chapterNums: [8] }),
];

function stubTasks(extra?: (url: string, init?: RequestInit) => Response | undefined) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const override = extra?.(url, init);
    if (override) return override;
    return okJson(tasks);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function postBody(fetchMock: ReturnType<typeof vi.fn>, suffix: string) {
  const call = fetchMock.mock.calls.find(
    ([url, init]) => String(url).includes(suffix) && (init as RequestInit | undefined)?.method === 'POST',
  );
  return call ? JSON.parse(String((call[1] as RequestInit).body)) : undefined;
}

describe('TaskBoardPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('accepts the chapter the awaiting_accept card is waiting on', async () => {
    const user = userEvent.setup();
    const fetchMock = stubTasks((url) => {
      if (url.includes('/accept')) return okJson({ ok: true });
      return undefined;
    });

    render(<TaskBoardPage projectId="default-project" />);

    const accept = await screen.findByRole('button', { name: '接受' });
    await user.click(accept);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/projects/default-project/tasks/t-accept/accept',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    expect(postBody(fetchMock, '/accept')).toEqual({ chapterNum: 2 });
  });

  it('places blocked cards in 进行中 with a 已阻塞 badge', async () => {
    stubTasks();
    render(<TaskBoardPage projectId="default-project" />);

    const running = await screen.findByRole('region', { name: '进行中' });
    expect(within(running).getByText('已阻塞')).toBeInTheDocument();
    expect(within(running).getByText('一幕')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '排队' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '待接受' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '完成' })).toBeInTheDocument();
    expect(screen.getAllByText('单章').length).toBeGreaterThan(0);
    expect(screen.getByText('一卷')).toBeInTheDocument();
    expect(document.body.textContent ?? '').not.toMatch(/[—–]/);
  });

  it('continues with POST /run, discards, and stops without deleting drafts', async () => {
    const user = userEvent.setup();
    const fetchMock = stubTasks((url) => {
      if (url.includes('/run')) return okJson(tasks[3]);
      if (url.includes('/discard')) return okJson({ ok: true });
      if (url.includes('/stop')) return okJson({ ...tasks[3], status: 'queued' });
      return undefined;
    });

    render(<TaskBoardPage projectId="default-project" />);

    await user.click(await screen.findByRole('button', { name: '继续' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/projects/default-project/tasks/t-accept/run',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    await user.click(screen.getByRole('button', { name: '丢弃' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/projects/default-project/tasks/t-accept/discard',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    expect(postBody(fetchMock, '/discard')).toEqual({ chapterNum: 2 });

    await user.click(screen.getByRole('button', { name: '停止' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/projects/default-project/tasks/t-accept/stop',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('declares a four-column grid on .task-board', () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'TaskBoardPage.css'), 'utf8');
    expect(css).toMatch(/\.task-board\s*\{[^}]*display:\s*grid/s);
  });
});
