import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetImportSessions } from '../../lib/importSession';
import { CharacterImportPreview } from './CharacterImportPreview';

vi.mock('../../lib/hermesChat', () => ({
  DEFAULT_LLM_MODEL: 'deepseek-v4-flash',
  streamChat: vi.fn(),
}));

import { streamChat } from '../../lib/hermesChat';

const streamChatMock = vi.mocked(streamChat);

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

async function* fakeStream(chunks: string[]) {
  for (const chunk of chunks) yield { content: chunk };
}

const extracted = {
  characters: [
    { id: 'char-1', name: '渔人', role: '误入者', goal: '离开桃花源' },
    { id: 'char-2', name: '村长', role: '守秘者' },
  ],
  relationships: [
    { id: 'rel-1', fromCharacterId: 'char-1', toCharacterId: 'char-2', label: '客人与主人', tension: '村长担心秘密外泄', kind: 'neutral' },
  ],
};

describe('CharacterImportPreview', () => {
  afterEach(() => {
    resetImportSessions();
    vi.unstubAllGlobals();
    streamChatMock.mockReset();
  });

  it('streams extraction, writes characters.json, and presents the result', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (String(url).includes('/file-content') || String(url).startsWith('/api/local-text')) {
        return Promise.resolve(okJson({ content: '晋太元中，武陵人捕鱼为业' }));
      }
      if (String(url).endsWith('/characters') && init?.method === 'PUT') return Promise.resolve(okJson(extracted));
      return Promise.reject(new Error(`unexpected ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);
    streamChatMock.mockReturnValue(fakeStream(['开头介绍\n```json\n', JSON.stringify(extracted), '\n```']) as ReturnType<typeof streamChat>);

    const onSaved = vi.fn();
    render(
      <CharacterImportPreview projectId="p1" filePath="设定/人物.md" onSaved={onSaved} onCancel={() => undefined} />,
    );

    const characters = await screen.findByRole('table', { name: '人物预览' });
    expect(characters).toHaveTextContent('渔人');
    expect(characters).toHaveTextContent('离开桃花源');
    const relationships = screen.getByRole('table', { name: '关系预览' });
    expect(relationships).toHaveTextContent('客人与主人');
    expect(relationships).toHaveTextContent('村长担心秘密外泄');

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(extracted));
    expect(streamChatMock.mock.calls[0]?.[2]).toEqual({ model: 'deepseek-v4-flash' });
    const saveCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith('/characters') && (init as RequestInit | undefined)?.method === 'PUT',
    );
    expect(JSON.parse(String((saveCall?.[1] as RequestInit).body))).toEqual(extracted);
  });

  it('shows thinking while the model has not started the json yet', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({ content: '晋太元中' })));
    streamChatMock.mockImplementation(async function* () {
      yield { reasoning: '先找出人名' };
      await gate;
      yield { content: `\`\`\`json\n${JSON.stringify(extracted)}\n\`\`\`` };
    });

    render(
      <CharacterImportPreview projectId="p1" filePath="设定/人物.md" onSaved={() => undefined} onCancel={() => undefined} />,
    );

    expect(await screen.findByLabelText('提取思考')).toHaveTextContent('先找出人名');
    release();
  });

  it('shows 提取失败 with retry and manual-create exits when parsing fails', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({ content: 'some text' })));
    streamChatMock.mockReturnValue(fakeStream(['无法提取任何内容']) as ReturnType<typeof streamChat>);

    const onCancel = vi.fn();
    render(
      <CharacterImportPreview projectId="p1" filePath="设定/人物.md" onSaved={() => undefined} onCancel={onCancel} />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('提取失败');
    await user.click(screen.getByRole('button', { name: '手动创建' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('regenerates when clicking 重新生成', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (String(url).includes('/file-content')) return Promise.resolve(okJson({ content: 'text' }));
      if (String(url).endsWith('/characters') && init?.method === 'PUT') return Promise.resolve(okJson(extracted));
      return Promise.reject(new Error(`unexpected ${url}`));
    }));
    streamChatMock.mockReturnValue(fakeStream(['```json\n', JSON.stringify(extracted), '\n```']) as ReturnType<typeof streamChat>);

    render(
      <CharacterImportPreview projectId="p1" filePath="设定/人物.md" onSaved={() => undefined} onCancel={() => undefined} />,
    );

    await screen.findByRole('table', { name: '人物预览' });
    await user.click(screen.getByRole('button', { name: '重新生成' }));
    await waitFor(() => expect(streamChatMock).toHaveBeenCalledTimes(2));
  });
});
