import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RelationsPage } from './RelationsPage';

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
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('renders two character nodes and never requests relations.md', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => okJson(characterFile));
    vi.stubGlobal('fetch', fetchMock);

    render(<RelationsPage projectId="default-project" />);

    const nodes = await screen.findByRole('list', { name: 'Character nodes' });
    expect(within(nodes).getAllByRole('listitem')).toHaveLength(2);
    expect(within(nodes).getByRole('listitem', { name: 'Kael, Exiled tide-runner' })).toBeInTheDocument();
    expect(within(nodes).getByRole('listitem', { name: 'Liora, Lighthouse archivist' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '关系' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '人物关系图' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Character Relationship Graph' })).not.toBeInTheDocument();

    expect(fetchPaths(fetchMock).every((path) => !path.includes('/documents/relations'))).toBe(true);
    expect(document.body.textContent ?? '').not.toMatch(/[—–]/);
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
});
