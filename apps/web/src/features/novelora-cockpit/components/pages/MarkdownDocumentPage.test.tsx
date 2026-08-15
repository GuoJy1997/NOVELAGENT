import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MarkdownDocumentPage } from './MarkdownDocumentPage';

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('MarkdownDocumentPage', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
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
});
