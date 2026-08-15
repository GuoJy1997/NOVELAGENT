import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CharactersPage } from './CharactersPage';

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

function putBodies(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls
    .filter(([url, init]) => String(url).includes('/characters') && init?.method === 'PUT')
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)));
}

describe('CharactersPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('saves an edited role on PUT /characters and keeps existing coordinates', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => okJson(characterFile));
    vi.stubGlobal('fetch', fetchMock);

    render(<CharactersPage projectId="default-project" />);

    const role = await screen.findByRole('textbox', { name: '角色' });
    expect(role).toHaveValue('Exiled tide-runner');

    await user.clear(role);
    await user.type(role, '新向导');

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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson(characterFile)));

    render(<CharactersPage projectId="default-project" />);

    const list = await screen.findByRole('list', { name: '人物列表' });
    expect(within(list).getByRole('button', { name: 'Kael' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '人物' })).toBeInTheDocument();
  });

  it('does not apply an older save result after a newer save fails', async () => {
    const user = userEvent.setup();
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
    expect(screen.getByRole('status')).toHaveTextContent('保存中');
    await user.type(role, 'B');
    expect(await screen.findByRole('status')).toHaveTextContent('保存失败');

    await act(async () => {
      finishOlder?.(okJson(characterFile));
    });
    expect(screen.getByRole('status')).toHaveTextContent('保存失败');
  });
});
