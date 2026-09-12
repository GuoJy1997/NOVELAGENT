import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkspacePicker } from './WorkspacePicker';

const okJson = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const emptyProject = {
  id: 'taoyuan',
  title: '桃园密码',
  currentChapter: 1,
  chapters: [] as Array<{ num: number; title: string; status: string; words: number }>,
};

const scannedProject = {
  ...emptyProject,
  chapters: [{ num: 1, title: '忘路之远近', status: 'drafting', words: 100 }],
};

describe('WorkspacePicker', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('allows a new empty novel to finish setup without existing chapters', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith('/browse')) return Promise.resolve(okJson({ path: 'D:/NewNovel' }));
      if (url.endsWith('/workspaces')) return Promise.resolve(okJson(init?.method === 'POST' ? emptyProject : []));
      if (url.endsWith('/files')) return Promise.resolve(okJson({ dirs: [], files: [], images: [] }));
      return Promise.reject(new Error(`unexpected ${url}`));
    }));
    const onSelect = vi.fn();
    render(<WorkspacePicker currentProjectId={null} onSelect={onSelect} onClose={() => undefined} />);
    await user.click(screen.getByRole('button', { name: '选择小说目录' }));
    await user.click(await screen.findByRole('button', { name: '暂不导入章节' }));
    await user.click(await screen.findByRole('button', { name: '跳过' }));
    expect(onSelect).toHaveBeenCalledWith(emptyProject.id);
  });

  it('selects an already registered workspace', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (String(url).endsWith('/workspaces') || String(url).includes('/workspaces?')) {
          return Promise.resolve(
            okJson([
              {
                id: 'taoyuan',
                title: '桃园密码',
                rootPath: 'D:\\桃园密码',
                addedAt: '2026-08-16T00:00:00.000Z',
              },
            ]),
          );
        }
        return Promise.reject(new Error(`unexpected ${url}`));
      }),
    );
    const onSelect = vi.fn();
    render(
      <WorkspacePicker currentProjectId="default-project" onSelect={onSelect} onClose={() => undefined} />,
    );

    await user.click(await screen.findByRole('button', { name: '桃园密码（D:\\桃园密码）' }));
    expect(onSelect).toHaveBeenCalledWith('taoyuan');
  });

  it('registers a picked folder, sets the chapters directory, then picks a cover image', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith('/workspaces/browse') && init?.method === 'POST') {
        const title = JSON.parse(String(init.body ?? '{}')).title as string | undefined;
        if (title === '选择正文目录') {
          return Promise.resolve(okJson({ path: 'D:\\桃园密码\\正文' }));
        }
        return Promise.resolve(okJson({ path: 'D:\\桃园密码' }));
      }
      if (path.endsWith('/workspaces') && init?.method === 'POST') {
        return Promise.resolve(okJson(emptyProject, 201));
      }
      if (path.endsWith('/workspaces')) {
        return Promise.resolve(okJson([]));
      }
      if (path.endsWith('/files')) {
        return Promise.resolve(okJson({ dirs: ['正文', '状态卡'], files: [], images: ['封面.png'] }));
      }
      if (path.endsWith('/chapters-dir') && init?.method === 'PUT') {
        return Promise.resolve(okJson(scannedProject));
      }
      if (path.endsWith('/cover') && init?.method === 'PUT') {
        return Promise.resolve(okJson({ ...scannedProject, cover: '封面.png' }));
      }
      return Promise.reject(new Error(`unexpected ${path} ${init?.method ?? 'GET'}`));
    });
    vi.stubGlobal('fetch', fetchMock);
    const onSelect = vi.fn();
    render(
      <WorkspacePicker currentProjectId={null} onSelect={onSelect} onClose={() => undefined} />,
    );

    await screen.findByRole('status');
    expect(screen.queryByLabelText('小说目录路径')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '选择小说目录' }));

    await user.click(await screen.findByRole('button', { name: '选择正文目录' }));
    expect(await screen.findByRole('list', { name: '章节预览' })).toHaveTextContent('1 · 忘路之远近');
    await user.click(screen.getByRole('button', { name: '确认' }));

    await user.click(await screen.findByRole('button', { name: '封面.png' }));
    await user.click(await screen.findByRole('button', { name: '完成' }));
    expect(onSelect).toHaveBeenCalledWith('taoyuan');
  });

  it('skips chapter setup when the project already has chapters and generates a cover', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith('/workspaces/browse') && init?.method === 'POST') {
        return Promise.resolve(okJson({ path: 'D:\\桃园密码' }));
      }
      if (path.endsWith('/workspaces') && init?.method === 'POST') {
        return Promise.resolve(okJson(scannedProject, 201));
      }
      if (path.endsWith('/workspaces')) {
        return Promise.resolve(okJson([]));
      }
      if (path.endsWith('/files')) {
        return Promise.resolve(okJson({ dirs: ['正文'], files: [], images: [] }));
      }
      if (path.endsWith('/cover/generate') && init?.method === 'POST') {
        return Promise.resolve(okJson({ ...scannedProject, cover: 'cover.svg' }));
      }
      return Promise.reject(new Error(`unexpected ${path} ${init?.method ?? 'GET'}`));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(
      <WorkspacePicker currentProjectId={null} onSelect={() => undefined} onClose={() => undefined} />,
    );

    await user.click(await screen.findByRole('button', { name: '选择小说目录' }));
    await user.click(await screen.findByRole('button', { name: '自动生成封面' }));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/taoyuan/cover/generate',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('shows a Chinese alert when registration is rejected', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (String(url).endsWith('/workspaces/browse') && init?.method === 'POST') {
          return Promise.resolve(okJson({ path: 'D:\\missing' }));
        }
        if (String(url).endsWith('/workspaces') && init?.method === 'POST') {
          return Promise.resolve(new Response('bad path', { status: 400 }));
        }
        if (String(url).endsWith('/workspaces')) {
          return Promise.resolve(okJson([]));
        }
        return Promise.reject(new Error(`unexpected ${url}`));
      }),
    );
    render(
      <WorkspacePicker currentProjectId={null} onSelect={() => undefined} onClose={() => undefined} />,
    );

    await user.click(await screen.findByRole('button', { name: '选择小说目录' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('无法把该目录注册为工作区');
    });
  });
});
