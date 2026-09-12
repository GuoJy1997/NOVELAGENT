import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetImportSessions } from '../../lib/importSession';
import { RelationsPage } from './RelationsPage';

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
    { id: 'kael', name: 'Kael', role: 'Exiled tide-runner', x: 24, y: 58 },
    { id: 'liora', name: 'Liora', role: 'Lighthouse archivist', x: 72, y: 42 },
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

function fetchPaths(fetchMock: ReturnType<typeof vi.fn<(url: string, init?: RequestInit) => Promise<Response>>>) {
  return fetchMock.mock.calls.map(([url]) => String(url));
}

describe('RelationsPage', () => {
  afterEach(() => {
    resetImportSessions();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    streamChatMock.mockReset();
  });

  it('renders two character nodes and never requests relations.md', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => okJson(characterFile));
    vi.stubGlobal('fetch', fetchMock);

    render(<RelationsPage projectId="default-project" />);

    const nodes = await screen.findByRole('list', { name: 'Character nodes' });
    expect(within(nodes).getAllByRole('listitem')).toHaveLength(2);
    expect(within(nodes).getByRole('listitem', { name: 'Kael, Exiled tide-runner' })).toBeInTheDocument();
    expect(within(nodes).getByRole('listitem', { name: 'Liora, Lighthouse archivist' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '人物关系网' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '人物关系图' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Character Relationship Graph' })).not.toBeInTheDocument();
    expect(screen.getByText('可视化角色关系，洞察故事脉络')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '放大' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '缩小' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '居中' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kael' })).toBeInTheDocument();

    expect(fetchPaths(fetchMock).every((path) => !path.includes('/documents/relations'))).toBe(true);
    expect(document.body.textContent ?? '').not.toMatch(/[—–]/);
  });

  it('shows a selected character’s relationship categories and key connection', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okJson(characterFile)));

    render(<RelationsPage projectId="default-project" />);

    const overview = await screen.findByRole('list', { name: '关系概览' });
    expect(within(overview).getByRole('listitem', { name: '亲密 / 信任 1' })).toBeInTheDocument();

    const keyRelations = screen.getByRole('list', { name: '关系标签' });
    expect(within(keyRelations).getByRole('listitem', { name: /Liora.*亲密 \/ 信任/ })).toBeInTheDocument();
    expect(within(keyRelations).getByRole('textbox', { name: 'Kael 与 Liora' })).toHaveValue('uneasy allies');
  });

  it('adjusts zoom in rounded increments, clamps, and centers', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn(async () => okJson(characterFile)));
    render(<RelationsPage projectId="default-project" />);
    await screen.findByRole('list', { name: 'Character nodes' });
    const inner = () => screen.getByRole('list', { name: 'Character nodes' }).closest('.relations-page__graph-content');
    expect(inner()).toHaveStyle({ zoom: '1' });
    await user.click(screen.getByRole('button', { name: '放大' }));
    expect(inner()).toHaveStyle({ zoom: '1.2' });
    for (let i = 0; i < 10; i += 1) await user.click(screen.getByRole('button', { name: '放大' }));
    expect(inner()).toHaveStyle({ zoom: '2' });
    for (let i = 0; i < 10; i += 1) await user.click(screen.getByRole('button', { name: '缩小' }));
    expect(inner()).toHaveStyle({ zoom: '0.6' });
    await user.click(screen.getByRole('button', { name: '居中' }));
    expect(inner()).toHaveStyle({ zoom: '1' });
  });

  it('saves an edited relationship label without requesting relations.md', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => okJson(characterFile));
    vi.stubGlobal('fetch', fetchMock);

    render(<RelationsPage projectId="default-project" />);

    const label = await screen.findByRole('textbox', { name: 'Kael 与 Liora' });
    expect(label).toHaveValue('uneasy allies');

    await user.clear(label);
    await user.type(label, '旧日盟友');
    const putsBefore = fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT');
    expect(putsBefore).toHaveLength(0);

    await act(() => vi.advanceTimersByTimeAsync(1600));

    await waitFor(() => {
      const puts = fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT');
      const last = puts.at(-1);
      expect(last?.[0]).toBe('/api/projects/default-project/characters');
      expect(JSON.parse(String((last?.[1] as RequestInit).body))).toMatchObject({
        characters: [{ id: 'kael', x: 24 }, { id: 'liora', x: 72 }],
        relationships: [{ id: 'kael-liora', label: '旧日盟友' }],
      });
    });

    expect(fetchPaths(fetchMock).every((path) => !path.includes('/documents/relations'))).toBe(true);
  });

  it('reports 保存失败 when a label save rejects', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') throw new Error('down');
      return okJson(characterFile);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<RelationsPage projectId="default-project" />);
    const label = await screen.findByRole('textbox', { name: 'Kael 与 Liora' });
    await user.type(label, 'x');
    await act(() => vi.advanceTimersByTimeAsync(1600));
    expect(await screen.findByRole('status')).toHaveTextContent('保存失败');
    expect(fetchPaths(fetchMock).every((path) => !path.includes('/documents/relations'))).toBe(true);
  });

  it('explains missing relationships when characters exist', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okJson({
      characters: [{ id: 'char-1', name: '渔人', role: '误入者' }],
      relationships: [],
    })));

    render(<RelationsPage projectId="default-project" />);

    expect(await screen.findByRole('status', { name: '还没有关系' })).toHaveTextContent(
      '人物和关系共用一份档案',
    );
    expect(screen.queryByRole('list', { name: '关系标签' })).not.toBeInTheDocument();
  });

  it('shows onboarding when there are no characters, then 完成 saves and returns home', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (String(url).includes('/characters') && init?.method === 'PUT') {
        return Promise.resolve(okJson({ characters: [], relationships: [] }));
      }
      return Promise.resolve(okJson({ characters: [], relationships: [] }));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<RelationsPage projectId="default-project" onBack={onBack} />);

    expect(await screen.findByRole('region', { name: '关系初始化' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /暂不存在/ }));
    await user.click(screen.getByRole('button', { name: '完成' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/projects/default-project/characters',
        expect.objectContaining({ method: 'PUT' }),
      );
      expect(onBack).toHaveBeenCalledOnce();
    });
  });

  it('opens Explorer from 从文件导入 then presents extracted relations', async () => {
    const user = userEvent.setup();
    const extracted = {
      characters: [
        { id: 'char-1', name: '渔人', role: '误入者' },
        { id: 'char-2', name: '村长', role: '守秘者' },
      ],
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
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith('/workspaces/browse-file') && init?.method === 'POST') {
        expect(JSON.parse(String(init.body))).toEqual({ title: '选择关系文件' });
        return Promise.resolve(okJson({ path: 'D:\\桃园密码\\设定\\关系.md' }));
      }
      if (path.startsWith('/api/local-text?path=')) {
        return Promise.resolve(okJson({ content: 'Kael 与 Liora' }));
      }
      if (path.endsWith('/characters') && init?.method === 'PUT') {
        return Promise.resolve(okJson(extracted));
      }
      return Promise.resolve(okJson(characterFile));
    });
    vi.stubGlobal('fetch', fetchMock);
    streamChatMock.mockImplementation(async function* () {
      yield { content: `\`\`\`json\n${JSON.stringify(extracted)}\n\`\`\`` };
    });

    render(<RelationsPage projectId="default-project" onBack={() => undefined} />);

    expect(await screen.findByRole('list', { name: 'Character nodes' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '从文件导入' }));

    expect(await screen.findByRole('list', { name: '关系标签' })).toHaveTextContent('渔人 与 村长');
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/workspaces/browse-file'))).toBe(true);
  });
});
