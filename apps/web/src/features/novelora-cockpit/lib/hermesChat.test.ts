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
      if (part.content) parts.push(part.content);
    }
    expect(parts).toEqual(['Hel', 'lo']);
    expect(fetchMock).toHaveBeenCalledWith(
      '/hermes/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(requestBody(fetchMock)).toMatchObject({ model: 'hermes-agent', stream: true });
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.headers).toMatchObject({
      Authorization: 'Bearer novelora-dev-key',
      'X-Hermes-Session-Id': expect.any(String),
    });
  });

  it('sends the book folder as Hermes cwd', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => sse([
      'data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n',
    ]));
    vi.stubGlobal('fetch', fetchMock);
    for await (const _delta of streamChat(
      [{ role: 'user', content: 'hi' }],
      new AbortController().signal,
      { cwd: 'D:\\桃园密码' },
    )) {
      void _delta;
    }
    expect(requestBody(fetchMock)).toMatchObject({ cwd: 'D:\\桃园密码' });
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

  it('yields reasoning_content while the model is thinking', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => sse([
      'data: {"choices":[{"delta":{"reasoning_content":"先"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"好"}}]}\n\ndata: [DONE]\n\n',
    ]));
    vi.stubGlobal('fetch', fetchMock);
    const parts: Array<{ content?: string; reasoning?: string }> = [];
    for await (const part of streamChat([{ role: 'user', content: 'hi' }], new AbortController().signal)) {
      parts.push(part);
    }
    expect(parts).toEqual([{ reasoning: '先' }, { content: '好' }]);
  });
});
