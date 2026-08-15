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
    render(<ChapterEditor chapterKey="p:3" initialContent="# Draft" onSave={onSave} />);

    const textarea = screen.getByRole('textbox', { name: 'Chapter content' });
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    await user.type(textarea, 'abc');
    expect(onSave).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1600));
    expect(onSave).toHaveBeenCalledWith('# Draftabc');
    expect(await screen.findByRole('status')).toHaveTextContent('Saved');
  });

  it('shows Save failed when the save rejects', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSave = vi.fn().mockRejectedValue(new Error('down'));
    render(<ChapterEditor chapterKey="p:3" initialContent="x" onSave={onSave} />);
    await user.type(screen.getByRole('textbox', { name: 'Chapter content' }), 'y');
    await act(() => vi.advanceTimersByTimeAsync(1600));
    expect(await screen.findByRole('status')).toHaveTextContent('Save failed');
  });

  it('ignores a late rejection from an out-of-order earlier save', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    let rejectFirst: (error: Error) => void = () => undefined;
    const first = new Promise<{ words: number }>((_, reject) => { rejectFirst = reject; });
    const onSave = vi.fn()
      .mockImplementationOnce(() => first)
      .mockResolvedValue({ words: 5 });
    render(<ChapterEditor chapterKey="p:3" initialContent="x" onSave={onSave} />);
    const textarea = screen.getByRole('textbox', { name: 'Chapter content' });

    await user.type(textarea, 'a');
    await act(() => vi.advanceTimersByTimeAsync(1600));
    expect(onSave).toHaveBeenCalledTimes(1);

    await user.type(textarea, 'b');
    await act(() => vi.advanceTimersByTimeAsync(1600));
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('status')).toHaveTextContent('Saved');

    await act(async () => {
      rejectFirst(new Error('late'));
      await Promise.resolve();
    });
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('flushes the pending save when unmounted before the debounce fires', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSave = vi.fn().mockResolvedValue({ words: 12 });
    const { unmount } = render(<ChapterEditor chapterKey="p:3" initialContent="# Draft" onSave={onSave} />);
    await user.type(screen.getByRole('textbox', { name: 'Chapter content' }), 'abc');
    expect(onSave).not.toHaveBeenCalled();
    unmount();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('# Draftabc');
  });

  it('counts words live', () => {
    render(<ChapterEditor chapterKey="p:3" initialContent="两个 words" onSave={vi.fn()} />);
    expect(screen.getByText('Words: 3')).toBeInTheDocument();
  });

  it('toggles a rendered markdown preview', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChapterEditor chapterKey="p:3" initialContent="# Title\n\nsome text" onSave={vi.fn()} />);
    const toggle = screen.getByRole('button', { name: 'Preview' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    const preview = screen.getByLabelText('Chapter preview');
    expect(preview.querySelector('h1')).toHaveTextContent('Title');
    expect(screen.queryByRole('textbox', { name: 'Chapter content' })).not.toBeInTheDocument();
  });
});
