import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WritingView } from './WritingView';

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

const project = {
  id: 'default-project', title: 'Tides of Embers', currentChapter: 3,
  rootPath: 'D:\\桃园密码',
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

    expect(screen.getByLabelText('写作工作台')).toBeInTheDocument();
    const list = await screen.findByRole('navigation', { name: '章节列表' });
    expect(list).toBeInTheDocument();
    expect(within(list).getByText('第 1 章')).toBeInTheDocument();
    expect(within(list).getByText('第 3 章')).toBeInTheDocument();
    expect(within(list).getByText(/起草中/)).toBeInTheDocument();
    expect(document.querySelector('.bixin-writing')).toBeInTheDocument();
    expect(document.querySelector('.echo-chat')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Ash on the Morning Tide/ }));
    expect(onSelect).toHaveBeenCalledWith(1);
    await user.click(screen.getByRole('button', { name: '返回首页' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('surfaces the work, current chapter, and save state in the route header', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/chapters/')) {
        return Promise.resolve(okJson({ num: 3, title: 'Salt Map, Ember Mark', content: '# Draft' }));
      }
      return Promise.resolve(okJson(project));
    }));

    render(
      <WritingView
        projectId="default-project"
        chapterNum={3}
        onSelectChapter={() => undefined}
        onBack={() => undefined}
      />,
    );

    await screen.findByRole('textbox', { name: '章节正文' });
    const header = screen.getByLabelText('写作工作台').querySelector<HTMLElement>('.bixin-writing__bar');
    expect(header).not.toBeNull();
    expect(header).toHaveTextContent('Tides of Embers');
    expect(header).toHaveTextContent('第 3 章 · Salt Map, Ember Mark');
    expect(screen.getByRole('status', { name: '保存状态' })).toHaveTextContent('已保存');
  });

  it('uses the route header as the only preview control', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/chapters/')) {
        return Promise.resolve(okJson({ num: 3, title: 'Salt Map, Ember Mark', content: '# Preview title' }));
      }
      return Promise.resolve(okJson(project));
    }));

    render(<WritingView projectId="default-project" chapterNum={3} onSelectChapter={() => undefined} onBack={() => undefined} />);

    await screen.findByRole('textbox', { name: '章节正文' });
    const header = screen.getByLabelText('写作工作台').querySelector<HTMLElement>('.bixin-writing__bar');
    const editor = screen.getByRole('region', { name: '章节编辑' });
    expect(header).not.toBeNull();
    const toggle = within(header!).getByRole('button', { name: '预览' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(within(editor).queryByRole('button', { name: '预览' })).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('章节预览').querySelector('h1')).toHaveTextContent('Preview title');
  });

  it('keeps editor and candidate review sibling keys distinct', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/chapters/')) {
        return Promise.resolve(okJson({ num: 3, title: 'Salt Map, Ember Mark', content: '# Draft' }));
      }
      return Promise.resolve(okJson(project));
    }));

    render(
      <WritingView
        projectId="default-project"
        chapterNum={3}
        onSelectChapter={() => undefined}
        onBack={() => undefined}
      />,
    );

    expect(await screen.findByRole('textbox', { name: '章节正文' })).toBeInTheDocument();
    const duplicateKeyWarnings = consoleError.mock.calls.filter(([message]) =>
      String(message).includes('Encountered two children with the same key'),
    );
    expect(duplicateKeyWarnings).toEqual([]);
    consoleError.mockRestore();
  });

  it('asks for a chapters directory when the project has no chapters yet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (String(url).endsWith('/files')) {
          return Promise.resolve(okJson({ dirs: ['正文'], files: [], images: [] }));
        }
        if (String(url).includes('/chapters/')) {
          return Promise.reject(new Error('should not fetch a chapter yet'));
        }
        return Promise.resolve(
          okJson({ id: 'taoyuan', title: '桃园密码', currentChapter: 1, chapters: [] }),
        );
      }),
    );
    render(
      <WritingView
        projectId="taoyuan"
        chapterNum={1}
        onSelectChapter={() => undefined}
        onBack={() => undefined}
      />,
    );
    expect(await screen.findByRole('region', { name: '正文目录设置' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '选择正文目录' })).toBeInTheDocument();
    expect(screen.queryByText('写作数据不可用。请检查本地 api 服务。')).not.toBeInTheDocument();
    expect(screen.getByLabelText('写作工作台')).toBeInTheDocument();
  });

  it('shows an error state when the api is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<WritingView projectId="default-project" chapterNum={3} onSelectChapter={() => undefined} onBack={() => undefined} />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('写作数据不可用。请检查本地 api 服务。'));
    expect(screen.getByRole('button', { name: '返回首页' })).toBeInTheDocument();
    expect(document.body.textContent ?? '').not.toMatch(/[—–]/);
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

    await screen.findByRole('navigation', { name: '章节列表' });
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
