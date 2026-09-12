import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as noveloraApi from '../../lib/noveloraApi';
import { resetChatSessions } from '../../lib/chatSession';
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

const modelsJson = {
  object: 'list',
  data: [
    { id: 'deepseek-v4-flash', object: 'model', owned_by: 'deepseek' },
    { id: 'deepseek-v4-pro', object: 'model', owned_by: 'deepseek' },
  ],
};

function okJson(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function stubChatFetch(chat: (url: string, init?: RequestInit) => Promise<Response>) {
  return vi.fn((url: string, init?: RequestInit) => {
    if (url === '/hermes/v1/skills' || url === '/hermes/v1/capabilities') {
      return Promise.resolve(new Response('no', { status: 404 }));
    }
    if (url === '/hermes/v1/models' || url === '/api/llm/models') {
      return Promise.resolve(okJson(modelsJson));
    }
    if (url === '/hermes/v1/chat/completions') return chat(url, init);
    return Promise.reject(new Error(`unexpected ${url}`));
  });
}

describe('EchoChat', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    resetChatSessions();
  });

  it('shows context chips and quick abilities', () => {
    render(<EchoChat context="Chapter 3" chapterNum={3} projectId="default-project" />);
    expect(screen.getByLabelText('当前上下文')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '续写下一段' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '润色选中内容' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '检查人物OOC' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '检查世界观冲突' })).toBeInTheDocument();
  });

  it('sends a message with chapter context and streams the reply', async () => {
    const user = userEvent.setup();
    const fetchMock = stubChatFetch(() => Promise.resolve(sse([
      'data: {"choices":[{"delta":{"content":"Sure"}}]}\n\ndata: [DONE]\n\n',
    ])));
    vi.stubGlobal('fetch', fetchMock);
    render(<EchoChat context='Chapter 3 "Salt Map, Ember Mark"' chapterNum={3} projectId="default-project" cwd={'D:\\桃园密码'} />);

    await user.type(screen.getByRole('textbox', { name: '给 Hermes 的消息' }), 'Review this chapter');
    await user.click(screen.getByRole('button', { name: '发送' }));

    const log = screen.getByRole('log');
    await waitFor(() => expect(log).toHaveTextContent('Sure'));
    expect(log).toHaveTextContent('Review this chapter');
    expect(log).not.toHaveTextContent('不要把 characters.json');
    expect(log).not.toHaveTextContent('Excerpt:');
    const chatCall = fetchMock.mock.calls.find(([url]) => url === '/hermes/v1/chat/completions');
    const body = JSON.parse(String((chatCall?.[1] as RequestInit | undefined)?.body));
    expect(body.model).toBe('deepseek-v4-flash');
    expect(body.cwd).toBe('D:\\桃园密码');
    expect(body.messages[0].content).toContain('Chapter 3 "Salt Map, Ember Mark"');
    expect(body.messages[0].content).toContain('D:\\桃园密码');
    expect(body.messages[0].content).toContain('Review this chapter');
    expect(body.messages[0].content).toContain('不要把 characters.json');
  });

  it('shows a Chinese error when the model service is unreachable', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', stubChatFetch(() => Promise.reject(new Error('down'))));
    render(<EchoChat context="Chapter 3" chapterNum={3} projectId="default-project" />);
    await user.type(screen.getByRole('textbox', { name: '给 Hermes 的消息' }), 'hi');
    await user.click(screen.getByRole('button', { name: '发送' }));
    await waitFor(() => expect(screen.getByRole('log')).toHaveTextContent('Hermes 离线。请确认本机网关已启动。'));
  });

  it('recovers automatically when the model service comes back', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const fetchMock = vi.fn((url: string) => {
        if (url === '/hermes/v1/skills' || url === '/hermes/v1/capabilities') {
          return Promise.resolve(new Response('no', { status: 404 }));
        }
        if (url === '/hermes/v1/models' || url === '/api/llm/models') {
          return Promise.resolve(okJson(modelsJson));
        }
        if (url === '/hermes/v1/chat/completions') return Promise.reject(new Error('down'));
        return Promise.reject(new Error(`unexpected ${url}`));
      });
      vi.stubGlobal('fetch', fetchMock);
      render(<EchoChat context="Chapter 3" chapterNum={3} projectId="default-project" />);
      await user.type(screen.getByRole('textbox', { name: '给 Hermes 的消息' }), 'hi');
      await user.click(screen.getByRole('button', { name: '发送' }));
      await screen.findByRole('alert');
      await act(() => vi.advanceTimersByTimeAsync(16000));
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Hermes 已恢复'));
      expect(fetchMock).toHaveBeenCalledWith(
        '/hermes/v1/models',
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer novelora-dev-key' }) }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('ingests a fenced chapter draft as a candidate after a successful turn', async () => {
    const user = userEvent.setup();
    const fetchMock = stubChatFetch(() => Promise.resolve(sse([
      'data: {"choices":[{"delta":{"content":"intro\\n```markdown\\n# 第三章\\n```\\n"}}]}\n\ndata: [DONE]\n\n',
    ])));
    vi.stubGlobal('fetch', fetchMock);
    const createCandidateSpy = vi.spyOn(noveloraApi, 'createCandidate').mockResolvedValue({
      id: 'cand-1',
      runId: 'session-1',
      targetPath: 'chapters/ch_03.md',
      source: 'dialog',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    render(<EchoChat context="Chapter 3" chapterNum={3} projectId="default-project" />);
    await user.type(screen.getByRole('textbox', { name: '给 Hermes 的消息' }), 'draft it');
    await user.click(screen.getByRole('button', { name: '发送' }));

    await waitFor(() => expect(createCandidateSpy).toHaveBeenCalled());
    expect(createCandidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ targetPath: 'chapters/ch_03.md', source: 'dialog', content: '# 第三章\n' }),
      'default-project',
    );
  });

  it('tells the author when a fenced draft cannot be saved as a candidate', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', stubChatFetch(() => Promise.resolve(sse([
      'data: {"choices":[{"delta":{"content":"```markdown\\n# 第三章\\n```"}}]}\n\ndata: [DONE]\n\n',
    ]))));
    vi.spyOn(noveloraApi, 'createCandidate').mockRejectedValue(new Error('API 500'));

    render(<EchoChat context="Chapter 3" chapterNum={3} projectId="default-project" />);
    await user.type(screen.getByRole('textbox', { name: '给 Hermes 的消息' }), 'draft it');
    await user.click(screen.getByRole('button', { name: '发送' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('候选未能保存。请稍后重试。'));
  });

  it('shows thinking tokens before the visible answer', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', stubChatFetch(() => Promise.resolve(sse([
      'data: {"choices":[{"delta":{"reasoning_content":"先想"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"正文"}}]}\n\ndata: [DONE]\n\n',
    ]))));
    render(<EchoChat context="Chapter 3" chapterNum={3} projectId="default-project" />);
    await user.type(screen.getByRole('textbox', { name: '给 Hermes 的消息' }), 'hi');
    await user.click(screen.getByRole('button', { name: '发送' }));
    const log = screen.getByRole('log');
    await waitFor(() => expect(log).toHaveTextContent('正文'));
    expect(log).toHaveTextContent('先想');
  });

  it('keeps the conversation and continues streaming after leaving and returning', async () => {
    const user = userEvent.setup();
    const encoder = new TextEncoder();
    let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
    const body = new ReadableStream<Uint8Array>({
      start(next) {
        controller = next;
      },
    });
    vi.stubGlobal('fetch', stubChatFetch(() => Promise.resolve(new Response(body, { status: 200 }))));

    const first = render(
      <EchoChat context="Chapter 3" chapterNum={3} projectId="session-project" />,
    );
    await user.type(screen.getByRole('textbox', { name: '给 Hermes 的消息' }), '继续写');
    await user.click(screen.getByRole('button', { name: '发送' }));
    await waitFor(() => expect(controller).toBeDefined());
    act(() => {
      controller?.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"先"}}]}\n\n'));
    });
    await waitFor(() => expect(screen.getByRole('log')).toHaveTextContent('先'));

    first.unmount();
    expect(screen.queryByRole('log')).not.toBeInTheDocument();

    act(() => {
      controller?.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"后"}}]}\n\ndata: [DONE]\n\n'));
      controller?.close();
    });

    render(<EchoChat context="Chapter 36" chapterNum={36} projectId="session-project" />);
    const log = screen.getByRole('log');
    expect(log).toHaveTextContent('继续写');
    await waitFor(() => expect(log).toHaveTextContent('先后'));
  });
});
