import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChapterEditor } from './ChapterEditor';

describe('ChapterEditor', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => { vi.runOnlyPendingTimers(); vi.useRealTimers(); });

  it('autosaves 1.5s after typing stops and reports status', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSave = vi.fn().mockResolvedValue({ words: 10 });
    render(<ChapterEditor chapterKey="p:3" initialContent="# Draft" onSave={onSave} onAiAction={vi.fn()} />);

    const textarea = screen.getByRole('textbox', { name: '章节正文' }) as HTMLTextAreaElement;
    expect(screen.getByRole('status')).toHaveTextContent('已保存');
    await user.type(textarea, 'abc');
    expect(onSave).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1600));
    expect(onSave).toHaveBeenCalledWith('# Draftabc');
    expect(await screen.findByRole('status')).toHaveTextContent('已保存');
  });

  it('shows Save failed when the save rejects', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSave = vi.fn().mockRejectedValue(new Error('down'));
    render(<ChapterEditor chapterKey="p:3" initialContent="x" onSave={onSave} onAiAction={vi.fn()} />);
    await user.type(screen.getByRole('textbox', { name: '章节正文' }), 'y');
    await act(() => vi.advanceTimersByTimeAsync(1600));
    expect(await screen.findByRole('status')).toHaveTextContent('保存失败');
  });

  it('ignores a late rejection from an out-of-order earlier save', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    let rejectFirst: (error: Error) => void = () => undefined;
    const first = new Promise<{ words: number }>((_, reject) => { rejectFirst = reject; });
    const onSave = vi.fn()
      .mockImplementationOnce(() => first)
      .mockResolvedValue({ words: 5 });
    render(<ChapterEditor chapterKey="p:3" initialContent="x" onSave={onSave} onAiAction={vi.fn()} />);
    const textarea = screen.getByRole('textbox', { name: '章节正文' });

    await user.type(textarea, 'a');
    await act(() => vi.advanceTimersByTimeAsync(1600));
    expect(onSave).toHaveBeenCalledTimes(1);

    await user.type(textarea, 'b');
    await act(() => vi.advanceTimersByTimeAsync(1600));
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('status')).toHaveTextContent('已保存');

    await act(async () => {
      rejectFirst(new Error('late'));
      await Promise.resolve();
    });
    expect(screen.getByRole('status')).toHaveTextContent('已保存');
  });

  it('flushes the pending save when unmounted before the debounce fires', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSave = vi.fn().mockResolvedValue({ words: 12 });
    const { unmount } = render(<ChapterEditor chapterKey="p:3" initialContent="# Draft" onSave={onSave} onAiAction={vi.fn()} />);
    await user.type(screen.getByRole('textbox', { name: '章节正文' }), 'abc');
    expect(onSave).not.toHaveBeenCalled();
    unmount();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('# Draftabc');
  });

  it('counts words live', () => {
    render(<ChapterEditor chapterKey="p:3" initialContent="两个 words" onSave={vi.fn()} onAiAction={vi.fn()} />);
    expect(screen.getByText('字数 3')).toBeInTheDocument();
  });

  it('renders markdown preview from the controlled route state without its own preview control', () => {
    render(<ChapterEditor chapterKey="p:3" initialContent="# Title\n\nsome text" onSave={vi.fn()} onAiAction={vi.fn()} preview />);
    const preview = screen.getByLabelText('章节预览');
    expect(preview.querySelector('h1')).toHaveTextContent('Title');
    expect(screen.queryByRole('textbox', { name: '章节正文' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '预览' })).not.toBeInTheDocument();
  });

  it('wraps a selected passage with markdown and sends AI actions', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onAiAction = vi.fn();
    render(<ChapterEditor chapterKey="p:3" initialContent="selected" onSave={vi.fn().mockResolvedValue({ words: 1 })} onAiAction={onAiAction} />);
    const textarea = screen.getByRole('textbox', { name: '章节正文' }) as HTMLTextAreaElement;
    textarea.setSelectionRange(0, 8);
    await user.click(screen.getByRole('button', { name: '加粗' }));
    expect(textarea).toHaveValue('**selected**');
    await user.click(screen.getByRole('button', { name: '润色' }));
    for (const label of ['扩写', '改写', '对话', 'Ask Hermes']) await user.click(screen.getByRole('button', { name: label }));
    expect(onAiAction).toHaveBeenCalledWith('润色');
    expect(onAiAction.mock.calls.map(([label]) => label)).toEqual(['润色', '扩写', '改写', '对话', 'Ask Hermes']);
  });

  it('prefixes every selected line for quote and unordered list', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSave = vi.fn().mockResolvedValue({ words: 1 });
    const noop = vi.fn();
    const { rerender } = render(<ChapterEditor chapterKey="p:3" initialContent={'one\ntwo\nthree'} onSave={onSave} onAiAction={noop} />);
    const textarea = screen.getByRole('textbox', { name: '章节正文' }) as HTMLTextAreaElement;
    textarea.setSelectionRange(0, 7);
    await user.click(screen.getByRole('button', { name: '引用' }));
    expect(textarea).toHaveValue('> one\n> two\nthree');
    rerender(<ChapterEditor chapterKey="p:4" initialContent={'one\ntwo\nthree'} onSave={onSave} onAiAction={noop} />);
    const next = screen.getByRole('textbox', { name: '章节正文' }) as HTMLTextAreaElement;
    next.setSelectionRange(0, 7);
    await user.click(screen.getByRole('button', { name: '无序列表' }));
    expect(next).toHaveValue('- one\n- two\nthree');
  });
});
