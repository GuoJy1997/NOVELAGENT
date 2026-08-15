import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EchoChat } from './EchoChat';

const sse = (chunks: string[]) => {
  const encoder = new TextEncoder();
  return new Response(new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  }), { status: 200 });
};

describe('EchoChat', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends a message with chapter context and streams the reply', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(sse([
      'data: {"choices":[{"delta":{"content":"Sure"}}]}\n\ndata: [DONE]\n\n',
    ]));
    vi.stubGlobal('fetch', fetchMock);
    render(<EchoChat context='Chapter 3 "Salt Map, Ember Mark"' />);

    await user.type(screen.getByRole('textbox', { name: 'Message Echo' }), 'Review this chapter');
    await user.click(screen.getByRole('button', { name: '发送' }));

    const log = screen.getByRole('log');
    await waitFor(() => expect(log).toHaveTextContent('Sure'));
    expect(log).toHaveTextContent('Review this chapter');
    const body = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit | undefined)?.body));
    expect(body.messages[0].content).toContain('Chapter 3 "Salt Map, Ember Mark"');
    expect(body.messages[0].content).toContain('Review this chapter');
  });

  it('shows an error when hermes is unreachable', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    render(<EchoChat context="Chapter 3" />);
    await user.type(screen.getByRole('textbox', { name: 'Message Echo' }), 'hi');
    await user.click(screen.getByRole('button', { name: '发送' }));
    await waitFor(() => expect(screen.getByRole('log')).toHaveTextContent(/unreachable/i));
  });

  it('recovers automatically when hermes comes back', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const fetchMock = vi.fn()
        .mockRejectedValueOnce(new Error('down'))
        .mockResolvedValue(new Response('{"status":"ok"}', { status: 200 }));
      vi.stubGlobal('fetch', fetchMock);
      render(<EchoChat context="Chapter 3" />);
      await user.type(screen.getByRole('textbox', { name: 'Message Echo' }), 'hi');
      await user.click(screen.getByRole('button', { name: '发送' }));
      await screen.findByRole('alert');
      await act(() => vi.advanceTimersByTimeAsync(16000));
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/back online/i));
      expect(fetchMock).toHaveBeenCalledWith('/hermes/health');
    } finally {
      vi.useRealTimers();
    }
  });
});
