import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetImportSessions } from '../../lib/importSession';
import { CharactersPage } from './CharactersPage';

vi.mock('../../lib/hermesChat', () => ({
  DEFAULT_LLM_MODEL: 'deepseek-v4-flash',
  streamChat: vi.fn(),
}));

import { streamChat } from '../../lib/hermesChat';

const streamChatMock = vi.mocked(streamChat);

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

const characterFile = {
  characters: [
    {
      id: 'kael',
      name: 'Kael',
      role: 'Exiled tide-runner',
      goal: 'Find the drowned route',
      knows: 'Salt map fragments',
      x: 24,
      y: 58,
    },
  ],
  relationships: [
    {
      id: 'kael-liora',
      fromCharacterId: 'kael',
      toCharacterId: 'liora',
      label: 'uneasy allies',
      tension: 'Liora trusts Kael with the map but not its final destination.',
      kind: 'ally',
    },
  ],
};

const characterSearchFile = {
  ...characterFile,
  characters: [
    ...characterFile.characters,
    {
      id: 'liora',
      name: 'Liora',
      role: 'Cartographer',
      goal: 'Chart the storm paths',
      knows: 'The sea gate is open',
    },
  ],
};

function putBodies(fetchMock: ReturnType<typeof vi.fn<(url: string, init?: RequestInit) => Promise<Response>>>) {
  return fetchMock.mock.calls
    .filter(([url, init]) => String(url).includes('/characters') && init?.method === 'PUT')
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)));
}

describe('CharactersPage', () => {
  afterEach(() => {
    resetImportSessions();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    streamChatMock.mockReset();
  });

  it('saves an edited role on PUT /characters and keeps existing coordinates', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => okJson(characterFile));
    vi.stubGlobal('fetch', fetchMock);

    render(<CharactersPage projectId="default-project" />);

    const role = await screen.findByRole('textbox', { name: '角色' });
    expect(role).toHaveValue('Exiled tide-runner');

    await user.clear(role);
    await user.type(role, '新向导');
    expect(putBodies(fetchMock)).toHaveLength(0);

    await act(() => vi.advanceTimersByTimeAsync(1600));

    await waitFor(() => {
      const bodies = putBodies(fetchMock);
      expect(bodies.at(-1)).toMatchObject({
        characters: [{ id: 'kael', role: '新向导', x: 24, y: 58 }],
        relationships: [{ id: 'kael-liora', label: 'uneasy allies' }],
      });
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/default-project/characters',
      expect.objectContaining({ method: 'PUT' }),
    );
    expect(document.body.textContent ?? '').not.toMatch(/[—–]/);
  });

  it('lists loaded characters for selection', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url: string, _init?: RequestInit) => okJson(characterFile)));

    render(<CharactersPage projectId="default-project" />);

    const list = await screen.findByRole('list', { name: '人物列表' });
    expect(within(list).getByRole('button', { name: 'Kael' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '人物' })).toBeInTheDocument();
  });

  it('filters the searchable character rail before selecting the matching profile', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn(async () => okJson(characterSearchFile)));

    render(<CharactersPage projectId="default-project" />);

    const search = await screen.findByRole('searchbox', { name: '搜索角色' });
    await user.type(search, 'liora');

    const list = screen.getByRole('list', { name: '人物列表' });
    expect(within(list).queryByRole('button', { name: 'Kael' })).not.toBeInTheDocument();
    await user.click(within(list).getByRole('button', { name: 'Liora' }));
    expect(screen.getByRole('heading', { name: 'Liora', level: 3 })).toBeInTheDocument();
  });

  it('shows the selected character name as a banner heading beside the editable input', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okJson(characterFile)));
    const user = userEvent.setup();
    render(<CharactersPage projectId="default-project" />);
    const banner = await screen.findByRole('heading', { name: 'Kael', level: 3 });
    const container = banner.closest('.characters-page__banner');
    expect(container).toContainElement(screen.getByRole('textbox', { name: '编辑姓名' }));
    expect(container?.querySelectorAll('input')).toHaveLength(1);
    const editor = screen.getByRole('textbox', { name: '编辑姓名' });
    await user.clear(editor);
    await user.type(editor, 'Nova');
    expect(screen.getByRole('heading', { name: 'Nova', level: 3 })).toBeInTheDocument();
  });

  it('does not apply an older save result after a newer save fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    let finishOlder: ((value: Response) => void) | undefined;
    const olderSave = new Promise<Response>((resolve) => {
      finishOlder = resolve;
    });
    let puts = 0;
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        puts += 1;
        if (puts === 1) return olderSave;
        return Promise.reject(new Error('down'));
      }
      return Promise.resolve(okJson(characterFile));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<CharactersPage projectId="default-project" />);
    const role = await screen.findByRole('textbox', { name: '角色' });
    await user.type(role, 'A');
    await act(() => vi.advanceTimersByTimeAsync(1600));
    expect(screen.getByRole('status')).toHaveTextContent('保存中');
    await user.type(role, 'B');
    await act(() => vi.advanceTimersByTimeAsync(1600));
    expect(await screen.findByRole('status')).toHaveTextContent('保存失败');

    await act(async () => {
      finishOlder?.(okJson(characterFile));
    });
    expect(screen.getByRole('status')).toHaveTextContent('保存失败');
  });

  it('lets 暂不存在 then 完成 save and return home', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (String(url).includes('/characters') && init?.method === 'PUT') {
        return Promise.resolve(okJson({ characters: [], relationships: [] }));
      }
      return Promise.resolve(okJson({ characters: [], relationships: [] }));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<CharactersPage projectId="default-project" onBack={onBack} />);

    await user.click(await screen.findByRole('button', { name: /暂不存在/ }));
    expect(screen.queryByRole('region', { name: '人物初始化' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '完成' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/projects/default-project/characters',
        expect.objectContaining({ method: 'PUT' }),
      );
      expect(onBack).toHaveBeenCalledOnce();
    });
  });

  it('opens Explorer from 从文件导入 then shows extracted characters on the page', async () => {
    const user = userEvent.setup();
    const extracted = {
      characters: [{ id: 'char-1', name: '渔人', role: '误入者', goal: '离开桃花源' }],
      relationships: [],
    };
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith('/workspaces/browse-file') && init?.method === 'POST') {
        expect(JSON.parse(String(init.body))).toEqual({ title: '选择人物文件' });
        return Promise.resolve(okJson({ path: 'D:\\桃园密码\\设定\\人物.md' }));
      }
      if (path.startsWith('/api/local-text?path=')) {
        return Promise.resolve(okJson({ content: '渔人误入桃园' }));
      }
      if (path.endsWith('/characters') && init?.method === 'PUT') {
        return Promise.resolve(okJson(extracted));
      }
      return Promise.resolve(okJson({ characters: [], relationships: [] }));
    });
    vi.stubGlobal('fetch', fetchMock);
    streamChatMock.mockImplementation(async function* () {
      yield { content: `\`\`\`json\n${JSON.stringify(extracted)}\n\`\`\`` };
    });

    render(<CharactersPage projectId="default-project" onBack={() => undefined} />);

    await user.click(await screen.findByRole('button', { name: /暂不存在/ }));
    await user.click(screen.getByRole('button', { name: '批量导入' }));

    const list = await screen.findByRole('list', { name: '人物列表' });
    expect(within(list).getByRole('button', { name: '渔人' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '角色' })).toHaveValue('误入者');
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/workspaces/browse-file'))).toBe(true);
  });
});
