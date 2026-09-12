import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetImportSessions } from '../../lib/importSession';
import { MarkdownDocumentPage } from './MarkdownDocumentPage';

vi.mock('../../lib/hermesChat', () => ({
  DEFAULT_LLM_MODEL: 'deepseek-v4-flash',
  streamChat: vi.fn(),
}));

import { streamChat } from '../../lib/hermesChat';

const streamChatMock = vi.mocked(streamChat);

async function* fakeStream(chunks: string[]) {
  for (const chunk of chunks) yield { content: chunk };
}

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('MarkdownDocumentPage', () => {
  it('previews document headings and tables without changing the saved source or enabling embedded HTML', async () => {
    const source = '# Story\n\n| Act | Theme |\n| --- | --- |\n| One | Hope |\n\n<img src=x onerror=alert(1)>\n\n[unsafe](javascript:alert(1))';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({ content: source })));
    render(<MarkdownDocumentPage projectId="default-project" document="outline" title="大纲" hint="" />);
    await screen.findByDisplayValue(/# Story/);
    await userEvent.click(screen.getByRole('button', { name: '文档预览' }));
    expect(screen.getByRole('heading', { name: 'Story' })).toBeVisible();
    expect(screen.getByRole('table')).toHaveTextContent('Hope');
    expect(document.querySelector('.markdown-document-page__preview img')).toBeNull();
    expect(document.querySelector('.markdown-document-page__preview a')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: '编辑文档' }));
    expect(screen.getByRole('textbox', { name: '大纲' })).toHaveValue(source);
    await userEvent.click(screen.getByRole('button', { name: '文档预览' }));
    await userEvent.click(screen.getByRole('button', { name: '加粗' }));
    expect(screen.getByRole('textbox', { name: '大纲' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: '大纲' })).toHaveFocus();
  });
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => {
    resetImportSessions();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    streamChatMock.mockReset();
  });

  it('loads and saves world.md without calling hermes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okJson({ content: '规则：潮不可直呼其名' }))
      .mockResolvedValueOnce(okJson({ content: '新规则' }));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MarkdownDocumentPage
        projectId="default-project"
        document="world"
        title="世界观"
        hint="这是设定编辑，不会召唤 Agent。"
      />,
    );

    expect(await screen.findByDisplayValue(/潮不可直呼其名/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '世界观' })).toBeInTheDocument();
    expect(screen.getByText('这是设定编辑，不会召唤 Agent。')).toBeInTheDocument();
    expect(document.body.textContent ?? '').not.toMatch(/[—–]/);

    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), '新规则');
    await act(() => vi.advanceTimersByTimeAsync(1600));

    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('/hermes'))).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/default-project/documents/world',
      expect.objectContaining({ method: 'PUT' }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('已保存');
  });

  it('presents world content with its own hierarchy, overview, progress, and structure tabs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({
      content: '# 世界观设定\n## 势力与组织\n### 星穹议会\n## 时间线',
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MarkdownDocumentPage
        projectId="default-project"
        document="world"
        title="世界观"
        hint="这是设定编辑，不会召唤 Agent。"
      />,
    );

    expect(await screen.findByRole('textbox', { name: '世界观' })).toBeInTheDocument();
    expect(screen.getByText('大纲 / 世界观')).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: '世界设定目录' })).toHaveTextContent('世界设定目录');
    expect(screen.getByRole('complementary', { name: '世界观概览' })).toHaveTextContent('文档概览');
    expect(screen.getByRole('complementary', { name: '世界观概览' })).toHaveTextContent('整体进度');
    expect(screen.getByRole('complementary', { name: '世界观概览' })).toHaveTextContent('结构条目');
    expect(screen.getByRole('complementary', { name: '世界观概览' })).not.toHaveTextContent('关联条目');
    expect(screen.getByRole('tab', { name: '世界结构' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '书签' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.queryByText('AI 建议')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: '书签' }));
    expect(screen.getByRole('tab', { name: '书签' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('暂无书签')).toBeInTheDocument();
  });

  it('moves world tab selection and focus with horizontal arrow keys', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({ content: '# 世界观设定' })));

    render(
      <MarkdownDocumentPage
        projectId="default-project"
        document="world"
        title="世界观"
        hint=""
      />,
    );

    await screen.findByRole('textbox', { name: '世界观' });
    const structureTab = screen.getByRole('tab', { name: '世界结构' });
    const bookmarksTab = screen.getByRole('tab', { name: '书签' });
    expect(structureTab).toHaveAttribute('tabindex', '0');
    expect(bookmarksTab).toHaveAttribute('tabindex', '-1');

    structureTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(bookmarksTab).toHaveFocus();
    expect(bookmarksTab).toHaveAttribute('aria-selected', 'true');
    expect(bookmarksTab).toHaveAttribute('tabindex', '0');
    expect(structureTab).toHaveAttribute('tabindex', '-1');

    await user.keyboard('{ArrowRight}');
    expect(structureTab).toHaveFocus();
    expect(structureTab).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowLeft}');
    expect(bookmarksTab).toHaveFocus();
    expect(bookmarksTab).toHaveAttribute('aria-selected', 'true');
  });

  it('moves world tab selection and focus to the first or last tab with Home and End', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({ content: '# 世界观设定' })));

    render(
      <MarkdownDocumentPage
        projectId="default-project"
        document="world"
        title="世界观"
        hint=""
      />,
    );

    await screen.findByRole('textbox', { name: '世界观' });
    const structureTab = screen.getByRole('tab', { name: '世界结构' });
    const bookmarksTab = screen.getByRole('tab', { name: '书签' });

    structureTab.focus();
    await user.keyboard('{End}');
    expect(bookmarksTab).toHaveFocus();
    expect(bookmarksTab).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Home}');
    expect(structureTab).toHaveFocus();
    expect(structureTab).toHaveAttribute('aria-selected', 'true');
  });

  it('offers an accessible editor toolbar that applies markdown to the current selection', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.fn().mockResolvedValue(okJson({ content: '# 故事概述\n命运主题' }));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MarkdownDocumentPage
        projectId="default-project"
        document="outline"
        title="大纲"
        hint=""
      />,
    );

    const textarea = await screen.findByRole('textbox', { name: '大纲' }) as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(7, 11);
    await user.click(screen.getByRole('button', { name: '加粗' }));

    expect(screen.getByRole('toolbar', { name: '大纲编辑工具' })).toBeInTheDocument();
    expect(textarea).toHaveValue('# 故事概述\n**命运主题**');
    expect(textarea.selectionStart).toBe(9);
    expect(textarea.selectionEnd).toBe(13);
    expect(screen.getByRole('status')).toHaveTextContent('保存中');
  });

  it('loads outline.md and reports 保存失败 when save rejects', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okJson({ content: '# 卷一' }))
      .mockRejectedValueOnce(new Error('down'));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MarkdownDocumentPage
        projectId="default-project"
        document="outline"
        title="大纲"
        hint=""
      />,
    );

    expect(await screen.findByDisplayValue(/卷一/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '大纲' })).toBeInTheDocument();
    await user.type(screen.getByRole('textbox'), 'x');
    expect(screen.getByRole('status')).toHaveTextContent('保存中');
    await act(() => vi.advanceTimersByTimeAsync(1600));
    expect(await screen.findByRole('status')).toHaveTextContent('保存失败');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/default-project/documents/outline',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('lets 暂不存在 enter the editor then 完成 saves and returns home', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onBack = vi.fn();
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (String(url).includes('/documents/outline') && init?.method === 'PUT') {
        return Promise.resolve(okJson({ content: JSON.parse(String(init.body)).content }));
      }
      return Promise.resolve(new Response('missing', { status: 404 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MarkdownDocumentPage
        projectId="default-project"
        document="outline"
        title="大纲"
        hint=""
        onBack={onBack}
      />,
    );

    await user.click(await screen.findByRole('button', { name: /暂不存在/ }));
    expect(screen.getByRole('textbox', { name: '大纲' })).toHaveValue('');
    await user.type(screen.getByRole('textbox', { name: '大纲' }), '卷一');
    await user.click(screen.getByRole('button', { name: '完成' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/projects/default-project/documents/outline',
        expect.objectContaining({ method: 'PUT' }),
      );
      expect(onBack).toHaveBeenCalledOnce();
    });
    const put = fetchMock.mock.calls.find(
      ([url, init]) => String(url).includes('/documents/outline') && init?.method === 'PUT',
    );
    expect(put).toBeDefined();
    expect(JSON.parse(String((put?.[1] as RequestInit | undefined)?.body ?? '{}'))).toEqual({
      content: '卷一',
    });
  });

  it('opens Explorer from 从文件导入 then shows organized markdown on the outline page', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith('/workspaces/browse-file') && init?.method === 'POST') {
        expect(JSON.parse(String(init.body))).toEqual({ title: '选择大纲文件' });
        return Promise.resolve(okJson({ path: 'D:\\桃园密码\\大纲.md' }));
      }
      if (path.startsWith('/api/local-text?path=')) {
        return Promise.resolve(okJson({ content: '导入的大纲 杂记' }));
      }
      if (path.includes('/documents/outline') && init?.method === 'PUT') {
        return Promise.resolve(okJson({ content: JSON.parse(String(init.body)).content }));
      }
      return Promise.resolve(okJson({ content: '# 卷一' }));
    });
    vi.stubGlobal('fetch', fetchMock);
    streamChatMock.mockReturnValue(
      fakeStream(['# 整理大纲']) as ReturnType<typeof streamChat>,
    );

    render(
      <MarkdownDocumentPage
        projectId="default-project"
        document="outline"
        title="大纲"
        hint=""
        onBack={() => undefined}
      />,
    );

    expect(await screen.findByDisplayValue(/卷一/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '从文件导入' }));
    expect(await screen.findByDisplayValue('# 整理大纲')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('导入的大纲 杂记')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/workspaces/browse-file'))).toBe(true);
  });

  it('shows outline buttons and updates document statistics as content changes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.fn().mockResolvedValue(okJson({ content: '' }));
    vi.stubGlobal('fetch', fetchMock);
    render(
      <MarkdownDocumentPage
        projectId="default-project"
        document="outline"
        title="大纲"
        hint=""
      />,
    );

    await user.click(await screen.findByRole('button', { name: /暂不存在/ }));
    const textarea = screen.getByRole('textbox', { name: '大纲' }) as HTMLTextAreaElement;
    const value = '# 第一卷\n## 第一幕\n### 场景一\n' + '长'.repeat(900);
    fireEvent.change(textarea, { target: { value } });
    expect(screen.getByRole('complementary', { name: '文档目录' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '第一卷' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '第一幕' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: '文档概览' })).toHaveTextContent('总字数');
    const info = screen.getByRole('complementary', { name: '文档概览' });
    expect(info).toHaveTextContent('总字数');
    expect(info).toHaveTextContent('预计阅读');
    expect(info).toHaveTextContent('章节数');
    const expectedWords = value.replace(/\s/g, '').length;
    expect(expectedWords).toBeGreaterThan(800);
    expect(info.querySelector('dl div:nth-child(1) dd')).toHaveTextContent(String(expectedWords));
    expect(info.querySelector('dl div:nth-child(2) dd')).toHaveTextContent('2 分钟');
    expect(info.querySelector('dl div:nth-child(3) dd')).toHaveTextContent('2');

    await user.click(screen.getByRole('button', { name: '第一幕' }));
    expect(textarea.selectionStart).toBe(6);
    expect(textarea.selectionEnd).toBe(6);
    expect(document.activeElement).toBe(textarea);
  });
});

