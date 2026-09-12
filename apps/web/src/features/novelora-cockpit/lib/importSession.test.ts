import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./hermesChat', () => ({
  DEFAULT_LLM_MODEL: 'deepseek-v4-flash',
  streamChat: vi.fn(),
}));

import { streamChat } from './hermesChat';
import {
  getImportJob,
  parseCharacterFile,
  resetImportSessions,
  startCharacterImport,
  startDocumentImport,
} from './importSession';

const streamChatMock = vi.mocked(streamChat);

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

function stubImportFetch(routes: (url: string, init?: RequestInit) => Promise<Response> | undefined) {
  return vi.fn((url: string, init?: RequestInit) => {
    if (url === '/api/projects/p1') {
      return Promise.resolve(okJson({
        id: 'p1',
        title: '桃园密码',
        currentChapter: 1,
        chapters: [],
        rootPath: 'D:\\桃园密码',
      }));
    }
    const hit = routes(String(url), init);
    if (hit) return hit;
    return Promise.reject(new Error(`unexpected ${url}`));
  });
}

async function* fakeStream(chunks: Array<{ content?: string; reasoning?: string }>) {
  for (const chunk of chunks) yield chunk;
}

describe('importSession', () => {
  afterEach(() => {
    resetImportSessions();
    vi.unstubAllGlobals();
    streamChatMock.mockReset();
  });

  it('reads the picked outline file, organizes it, and writes outline.md without a mounted page', async () => {
    const fetchMock = stubImportFetch((url, init) => {
      if (url.startsWith('/api/local-text?path=')) {
        return Promise.resolve(okJson({ content: '卷一：风起 杂记' }));
      }
      if (url.includes('/documents/outline') && init?.method === 'PUT') {
        return Promise.resolve(okJson({ content: JSON.parse(String(init.body)).content }));
      }
      return undefined;
    });
    vi.stubGlobal('fetch', fetchMock);
    streamChatMock.mockReturnValue(fakeStream([{ content: '# 卷一\n' }, { content: '风起' }]));

    await startDocumentImport({
      projectId: 'p1',
      kind: 'outline',
      filePath: 'D:\\桃园密码\\大纲.md',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/p1/documents/outline',
      expect.objectContaining({ method: 'PUT' }),
    );
    const put = fetchMock.mock.calls.find(
      ([url, init]) => String(url).includes('/documents/outline') && init?.method === 'PUT',
    );
    expect(JSON.parse(String((put?.[1] as RequestInit).body))).toEqual({ content: '# 卷一\n风起' });
    expect(getImportJob('p1', 'outline')).toMatchObject({
      phase: 'saved',
      output: '# 卷一\n风起',
    });
    expect(streamChatMock.mock.calls[0]?.[2]).toEqual({ model: 'deepseek-v4-flash', cwd: 'D:\\桃园密码' });
  });

  it('saves world.md from reasoning when the model only streams thinking', async () => {
    const fetchMock = stubImportFetch((url, init) => {
      if (url.startsWith('/api/local-text?path=')) {
        return Promise.resolve(okJson({ content: '潮不可直呼其名' }));
      }
      if (url.includes('/documents/world') && init?.method === 'PUT') {
        return Promise.resolve(okJson({ content: JSON.parse(String(init.body)).content }));
      }
      return undefined;
    });
    vi.stubGlobal('fetch', fetchMock);
    streamChatMock.mockReturnValue(fakeStream([{ reasoning: '## 规则\n潮不可直呼其名' }]));

    await startDocumentImport({
      projectId: 'p1',
      kind: 'world',
      filePath: 'D:\\桃园密码\\世界观.md',
    });

    const put = fetchMock.mock.calls.find(
      ([url, init]) => String(url).includes('/documents/world') && init?.method === 'PUT',
    );
    expect(JSON.parse(String((put?.[1] as RequestInit).body))).toEqual({
      content: '## 规则\n潮不可直呼其名',
    });
    expect(getImportJob('p1', 'world')?.phase).toBe('saved');
  });

  it('finishes organizing with no page subscribed, then writes the document', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetchMock = stubImportFetch((url, init) => {
      if (url.startsWith('/api/local-text?path=')) {
        return Promise.resolve(okJson({ content: '杂记' }));
      }
      if (url.includes('/documents/outline') && init?.method === 'PUT') {
        return Promise.resolve(okJson({ content: JSON.parse(String(init.body)).content }));
      }
      return undefined;
    });
    vi.stubGlobal('fetch', fetchMock);
    streamChatMock.mockImplementation(async function* () {
      await gate;
      yield { content: '# 卷一' };
    });

    const done = startDocumentImport({
      projectId: 'p1',
      kind: 'outline',
      filePath: 'D:\\桃园密码\\大纲.md',
    });
    expect(getImportJob('p1', 'outline')?.phase).toBe('generating');
    release();
    await done;

    expect(getImportJob('p1', 'outline')).toMatchObject({ phase: 'saved', output: '# 卷一' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/p1/documents/outline',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('extracts characters.json from a picked file and writes it without waiting for confirm', async () => {
    const extracted = {
      characters: [{ id: 'char-1', name: '渔人', role: '误入者' }],
      relationships: [
        {
          id: 'rel-1',
          fromCharacterId: 'char-1',
          toCharacterId: 'char-2',
          label: '客人与主人',
          tension: '村长担心秘密外泄',
          kind: 'neutral',
        },
      ],
    };
    const fetchMock = stubImportFetch((url, init) => {
      if (url.startsWith('/api/local-text?path=')) {
        return Promise.resolve(okJson({ content: '晋太元中，武陵人捕鱼为业' }));
      }
      if (url.endsWith('/characters') && init?.method === 'PUT') {
        return Promise.resolve(okJson(extracted));
      }
      return undefined;
    });
    vi.stubGlobal('fetch', fetchMock);
    streamChatMock.mockReturnValue(
      fakeStream([{ content: '```json\n' }, { content: JSON.stringify(extracted) }, { content: '\n```' }]),
    );

    await startCharacterImport({
      projectId: 'p1',
      filePath: 'D:\\桃园密码\\设定\\人物.md',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/p1/characters',
      expect.objectContaining({ method: 'PUT' }),
    );
    expect(getImportJob('p1', 'characters')).toMatchObject({
      phase: 'saved',
      result: extracted,
    });
  });

  it('parses a characters array even when relationships is omitted', () => {
    expect(
      parseCharacterFile('```json\n{"characters":[{"id":"char-1","name":"渔人","role":"误入者"}]}\n```'),
    ).toEqual({
      characters: [{ id: 'char-1', name: '渔人', role: '误入者' }],
      relationships: [],
    });
  });

  it('saves characters.json from a dropped stream if JSON already arrived', async () => {
    const extracted = {
      characters: [{ id: 'char-1', name: '渔人', role: '误入者' }],
      relationships: [],
    };
    const fetchMock = stubImportFetch((url, init) => {
      if (url.startsWith('/api/local-text?path=')) {
        return Promise.resolve(okJson({ content: '晋太元中，武陵人捕鱼为业' }));
      }
      if (url.endsWith('/characters') && init?.method === 'PUT') {
        return Promise.resolve(okJson(extracted));
      }
      return undefined;
    });
    vi.stubGlobal('fetch', fetchMock);
    streamChatMock.mockImplementation(async function* () {
      yield { content: `\`\`\`json\n${JSON.stringify(extracted)}\n\`\`\`` };
      throw new Error('ECONNRESET');
    });

    await startCharacterImport({
      projectId: 'p1',
      filePath: 'D:\\桃园密码\\人物小传.md',
    });

    expect(getImportJob('p1', 'characters')).toMatchObject({
      phase: 'saved',
      result: extracted,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/p1/characters',
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});
