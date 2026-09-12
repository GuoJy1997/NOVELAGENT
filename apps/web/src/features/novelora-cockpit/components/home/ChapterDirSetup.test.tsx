import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChapterDirSetup } from './ChapterDirSetup';

const ok = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const scannedMeta = {
  id: 'p1',
  title: '桃花源',
  currentChapter: 1,
  chapters: [
    { num: 1, title: '忘路之远近', status: 'drafting', words: 100 },
    { num: 2, title: '豁然开朗', status: 'drafting', words: 200 },
  ],
};

describe('ChapterDirSetup', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('picks a folder in Explorer, scans it, and previews chapters before confirming', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith('/workspaces/browse') && init?.method === 'POST') {
        expect(JSON.parse(String(init.body))).toEqual({ title: '选择正文目录' });
        return Promise.resolve(ok({ path: 'D:\\桃园密码\\正文' }));
      }
      if (path.endsWith('/chapters-dir') && init?.method === 'PUT') {
        expect(JSON.parse(String(init.body))).toEqual({ dir: 'D:\\桃园密码\\正文' });
        return Promise.resolve(ok(scannedMeta));
      }
      return Promise.reject(new Error(`unexpected ${path} ${init?.method ?? 'GET'}`));
    });
    vi.stubGlobal('fetch', fetchMock);
    const onComplete = vi.fn();
    render(<ChapterDirSetup projectId="p1" onComplete={onComplete} />);

    expect(screen.queryByRole('list', { name: '目录列表' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '选择正文目录' }));

    const preview = await screen.findByRole('list', { name: '章节预览' });
    expect(preview).toHaveTextContent('1 · 忘路之远近');
    expect(preview).toHaveTextContent('2 · 豁然开朗');

    await user.click(screen.getByRole('button', { name: '确认' }));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('warns and allows re-picking when the scan finds no chapters', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (String(url).endsWith('/workspaces/browse') && init?.method === 'POST') {
        return Promise.resolve(ok({ path: 'D:\\桃园密码\\状态卡' }));
      }
      if (String(url).endsWith('/chapters-dir') && init?.method === 'PUT') {
        return Promise.resolve(ok({ id: 'p1', title: '桃花源', currentChapter: 1, chapters: [] }));
      }
      return Promise.reject(new Error(`unexpected ${url}`));
    }));
    render(<ChapterDirSetup projectId="p1" onComplete={() => undefined} />);

    await user.click(screen.getByRole('button', { name: '选择正文目录' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('没有扫描到章节');
    expect(screen.getByRole('button', { name: '选择正文目录' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: '章节预览' })).not.toBeInTheDocument();
  });

  it('reports picker failures with a Chinese message', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<ChapterDirSetup projectId="p1" onComplete={() => undefined} />);
    await user.click(screen.getByRole('button', { name: '选择正文目录' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('打开系统目录选择器失败');
    });
  });
});
