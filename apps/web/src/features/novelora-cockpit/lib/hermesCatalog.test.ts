import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyCatalog, fetchHermesCatalog, fetchHermesModels, listBixinModels } from './hermesCatalog';

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('fetchHermesCatalog', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('maps GET /hermes/v1/skills and leaves experts empty without an experts endpoint', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === '/hermes/v1/skills') {
        return okJson({
          object: 'list',
          data: [{ name: 'github-pr-workflow', description: 'GitHub workflow skill', category: 'github' }],
        });
      }
      if (url === '/hermes/v1/capabilities') {
        return okJson({ endpoints: { skills: { path: '/v1/skills' } } });
      }
      return new Response('no', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const catalog = await fetchHermesCatalog();
    expect(fetchMock).toHaveBeenCalledWith(
      '/hermes/v1/skills',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer novelora-dev-key' }) }),
    );
    expect(catalog.skills).toEqual([
      { id: 'github-pr-workflow', label: 'github-pr-workflow', hint: 'GitHub workflow skill', kind: 'skill' },
    ]);
    expect(catalog.commands).toEqual([]);
    expect(catalog.experts).toEqual([]);
    expect(catalog.skills.some((item) => item.id === 'scene-drafting')).toBe(false);
  });

  it('keeps skills populated when capabilities is non-OK', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === '/hermes/v1/skills') {
        return okJson({
          object: 'list',
          data: [{ name: 'scene-drafting', description: 'Scene drafting skill' }],
        });
      }
      if (url === '/hermes/v1/capabilities') {
        return new Response('no', { status: 404 });
      }
      return new Response('no', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const catalog = await fetchHermesCatalog();
    expect(catalog.skills).toEqual([
      { id: 'scene-drafting', label: 'scene-drafting', hint: 'Scene drafting skill', kind: 'skill' },
    ]);
    expect(catalog.commands).toEqual([]);
    expect(catalog.experts).toEqual([]);
  });

  it('keeps skills populated when capabilities fetch throws', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === '/hermes/v1/skills') {
        return okJson({
          object: 'list',
          data: [{ name: 'scene-drafting', description: 'Scene drafting skill' }],
        });
      }
      if (url === '/hermes/v1/capabilities') {
        throw new Error('network down');
      }
      return new Response('no', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const catalog = await fetchHermesCatalog();
    expect(catalog.skills).toEqual([
      { id: 'scene-drafting', label: 'scene-drafting', hint: 'Scene drafting skill', kind: 'skill' },
    ]);
    expect(catalog.commands).toEqual([]);
    expect(catalog.experts).toEqual([]);
  });

  it('returns empty lists when Hermes is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down'); }));
    expect(await fetchHermesCatalog()).toEqual(emptyCatalog());
  });
});

describe('fetchHermesModels', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lists models from GET /hermes/v1/models', async () => {
    const fetchMock = vi.fn(async () => okJson({
      object: 'list',
      data: [
        { id: 'hermes-agent', object: 'model' },
        { id: 'deepseek-v4-flash', object: 'model' },
        { id: 'glm-5.2', object: 'model' },
      ],
    }));
    vi.stubGlobal('fetch', fetchMock);
    const listed = await fetchHermesModels();
    expect(fetchMock).toHaveBeenCalledWith(
      '/hermes/v1/models',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer novelora-dev-key' }) }),
    );
    expect(listed).toEqual(['deepseek-v4-flash', 'glm-5.2', 'hermes-agent']);
  });

  it('returns an empty list when Hermes is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down'); }));
    expect(await fetchHermesModels()).toEqual([]);
  });
});

describe('listBixinModels', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('unions Hermes models with DeepSeek models from the LLM API', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === '/hermes/v1/models') {
        return okJson({ object: 'list', data: [{ id: 'hermes-agent', object: 'model' }] });
      }
      if (url === '/api/llm/models') {
        return okJson({
          object: 'list',
          data: [
            { id: 'deepseek-v4-flash', object: 'model', owned_by: 'deepseek' },
            { id: 'deepseek-v4-pro', object: 'model', owned_by: 'deepseek' },
          ],
        });
      }
      return new Response('no', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    expect(await listBixinModels()).toEqual([
      'deepseek-v4-flash',
      'deepseek-v4-pro',
      'hermes-agent',
    ]);
  });

  it('keeps Hermes models when the LLM API is down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === '/hermes/v1/models') {
          return okJson({ object: 'list', data: [{ id: 'hermes-agent' }, { id: 'glm-5.2' }] });
        }
        throw new Error('llm down');
      }),
    );
    expect(await listBixinModels()).toEqual(['glm-5.2', 'hermes-agent']);
  });
});
