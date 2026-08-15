import { afterEach, describe, expect, it, vi } from 'vitest';
import { streamChat } from './hermesChat';

const sse = (chunks: string[]) => {
  const encoder = new TextEncoder();
  return new Response(new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  }), { status: 200 });
};

function requestBody(fetchMock: ReturnType<typeof vi.fn>): unknown {
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
  return JSON.parse(String(init?.body));
}

describe('streamChat', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('yields delta content from SSE frames', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => sse([
      'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"lo"}}]}\n\ndata: [DONE]\n\n',
    ]));
    vi.stubGlobal('fetch', fetchMock);
    const parts: string[] = [];
    for await (const part of streamChat([{ role: 'user', content: 'hi' }], new AbortController().signal)) {
      parts.push(part);
    }
    expect(parts).toEqual(['Hel', 'lo']);
    expect(fetchMock).toHaveBeenCalledWith(
      '/hermes/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(requestBody(fetchMock)).toMatchObject({ model: 'hermes-agent' });
  });

  it('sends the requested model id', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => sse([
      'data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n',
    ]));
    vi.stubGlobal('fetch', fetchMock);
    for await (const _delta of streamChat(
      [{ role: 'user', content: 'hi' }],
      new AbortController().signal,
      { model: 'gpt-4.1' },
    )) {
      void _delta;
    }
    expect(requestBody(fetchMock)).toMatchObject({ model: 'gpt-4.1' });
  });
});
