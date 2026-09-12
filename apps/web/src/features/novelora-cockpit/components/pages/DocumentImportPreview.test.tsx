import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetImportSessions } from '../../lib/importSession';
import { DocumentImportPreview } from './DocumentImportPreview';

vi.mock('../../lib/hermesChat', () => ({
  DEFAULT_LLM_MODEL: 'deepseek-v4-flash',
  streamChat: vi.fn(),
}));

import { streamChat } from '../../lib/hermesChat';

const streamChatMock = vi.mocked(streamChat);

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

async function* fakeStream(chunks: Array<{ content?: string; reasoning?: string }>) {
  for (const chunk of chunks) yield chunk;
}

describe('DocumentImportPreview', () => {
  afterEach(() => {
    resetImportSessions();
    vi.unstubAllGlobals();
    streamChatMock.mockReset();
  });

  it('organizes a raw outline file then writes it without a confirm click', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (String(url).startsWith('/api/local-text?path=')) {
        return Promise.resolve(okJson({ content: '卷一：风起 杂记' }));
      }
      if (String(url).includes('/documents/outline') && init?.method === 'PUT') {
        return Promise.resolve(okJson({ content: JSON.parse(String(init.body)).content }));
      }
      return Promise.reject(new Error(`unexpected ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);
    streamChatMock.mockReturnValue(fakeStream([{ content: '# 卷一\n' }, { content: '风起' }]));
    const onImport = vi.fn().mockResolvedValue(undefined);

    render(
      <DocumentImportPreview
        projectId="p1"
        filePath="D:\\桃园密码\\大纲.md"
        documentKind="outline"
        domainLabel="大纲"
        onImport={onImport}
        onCancel={() => undefined}
      />,
    );

    expect(await screen.findByLabelText('整理预览')).toHaveTextContent('# 卷一');
    await waitFor(() => expect(onImport).toHaveBeenCalledWith('# 卷一\n风起'));
    expect(streamChatMock.mock.calls[0]?.[2]).toEqual({ model: 'deepseek-v4-flash' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/p1/documents/outline',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('keeps organizing after unmount and still writes the document', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (String(url).startsWith('/api/local-text?path=')) {
        return Promise.resolve(okJson({ content: '杂记' }));
      }
      if (String(url).includes('/documents/outline') && init?.method === 'PUT') {
        return Promise.resolve(okJson({ content: JSON.parse(String(init.body)).content }));
      }
      return Promise.reject(new Error(`unexpected ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);
    streamChatMock.mockImplementation(async function* () {
      await gate;
      yield { content: '# 卷一' };
    });

    const { unmount } = render(
      <DocumentImportPreview
        projectId="p1"
        filePath="D:\\桃园密码\\大纲.md"
        documentKind="outline"
        domainLabel="大纲"
        onImport={async () => undefined}
        onCancel={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url]) => String(url).startsWith('/api/local-text'))).toBe(true);
    });
    unmount();
    release();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/projects/p1/documents/outline',
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });
});
