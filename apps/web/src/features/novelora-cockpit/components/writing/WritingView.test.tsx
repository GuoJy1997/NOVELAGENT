import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WritingView } from './WritingView';

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

const project = {
  id: 'default-project', title: 'Tides of Embers', currentChapter: 3,
  chapters: [
    { num: 1, title: 'Ash on the Morning Tide', status: 'complete', words: 2275 },
    { num: 3, title: 'Salt Map, Ember Mark', status: 'drafting', words: 3614 },
  ],
};

describe('WritingView', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads chapters, selects from the list, and goes back', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/chapters/')) return Promise.resolve(okJson({ num: 3, title: 'Salt Map, Ember Mark', content: '# Draft' }));
      return Promise.resolve(okJson(project));
    }));
    const onSelect = vi.fn();
    const onBack = vi.fn();
    render(<WritingView projectId="default-project" chapterNum={3} onSelectChapter={onSelect} onBack={onBack} />);

    expect(screen.getByLabelText('Writing workspace')).toBeInTheDocument();
    const list = await screen.findByRole('navigation', { name: 'Chapter list' });
    expect(list).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Ash on the Morning Tide/ }));
    expect(onSelect).toHaveBeenCalledWith(1);
    await user.click(screen.getByRole('button', { name: /back to dashboard/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows an error state when the api is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<WritingView projectId="default-project" chapterNum={3} onSelectChapter={() => undefined} onBack={() => undefined} />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/unavailable/i));
  });

  it('delegates the current chapter as a chapter recipe', async () => {
    const user = userEvent.setup();
    const created = {
      id: 't-delegate',
      recipe: 'chapter',
      status: 'queued',
      step: 'read_context',
      model: 'hermes-agent',
      chapterNums: [3],
      currentIndex: 0,
      log: [],
      createdAt: '2026-08-15T00:00:00.000Z',
    };
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('/chapters/')) {
        return Promise.resolve(okJson({ num: 3, title: 'Salt Map, Ember Mark', content: '# Draft' }));
      }
      if (url.includes('/tasks') && init?.method === 'POST') {
        return Promise.resolve(okJson(created));
      }
      return Promise.resolve(okJson(project));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(
      <WritingView
        projectId="default-project"
        chapterNum={3}
        onSelectChapter={() => undefined}
        onBack={() => undefined}
      />,
    );

    await screen.findByRole('navigation', { name: 'Chapter list' });
    await user.click(screen.getByRole('button', { name: '委派本章' }));

    await waitFor(() => {
      const createCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url) === '/api/projects/default-project/tasks' &&
          (init as RequestInit | undefined)?.method === 'POST',
      );
      expect(createCall).toBeDefined();
      const body = createCall?.[1] ? JSON.parse(String((createCall[1] as RequestInit).body)) : null;
      expect(body).toMatchObject({
        recipe: 'chapter',
        chapterNums: [3],
      });
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/default-project/tasks/t-delegate/run',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

