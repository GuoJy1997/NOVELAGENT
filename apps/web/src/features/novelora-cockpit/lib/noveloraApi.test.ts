import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  acceptTaskDraft,
  createTask,
  discardTaskDraft,
  fetchChapter,
  fetchCharacters,
  fetchDocument,
  fetchDraft,
  fetchProject,
  fetchTask,
  fetchTasks,
  saveChapter,
  saveCharacters,
  saveDocument,
} from './noveloraApi';

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('noveloraApi', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('fetches project meta through the /api proxy path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ id: 'default-project', chapters: [] }));
    vi.stubGlobal('fetch', fetchMock);
    await fetchProject();
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/default-project');
  });

  it('fetches and saves a chapter', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okJson({ num: 3, title: 'Salt Map, Ember Mark', content: '# x' }))
      .mockResolvedValueOnce(okJson({ words: 42 }));
    vi.stubGlobal('fetch', fetchMock);
    const chapter = await fetchChapter(3);
    expect(chapter.title).toBe('Salt Map, Ember Mark');
    const saved = await saveChapter(3, 'body');
    expect(saved.words).toBe(42);
    expect(fetchMock).toHaveBeenLastCalledWith('/api/projects/default-project/chapters/3', expect.objectContaining({ method: 'PUT' }));
  });

  it('throws on non-ok responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 404 })));
    await expect(fetchProject()).rejects.toThrow('404');
  });

  it('fetches a named document through the /api proxy path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ content: '# world' }));
    vi.stubGlobal('fetch', fetchMock);
    const document = await fetchDocument('world');
    expect(document.content).toBe('# world');
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/default-project/documents/world');
  });

  it('saves characters with PUT /characters', async () => {
    const file = { characters: [], relationships: [] };
    const fetchMock = vi.fn().mockResolvedValue(okJson(file));
    vi.stubGlobal('fetch', fetchMock);
    await saveCharacters(file);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/default-project/characters',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('covers remaining document, character, task, and draft routes', async () => {
    const task = { id: 't1', recipe: 'chapter', chapterNums: [1] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okJson({ content: 'saved' }))
      .mockResolvedValueOnce(okJson({ characters: [], relationships: [] }))
      .mockResolvedValueOnce(okJson([]))
      .mockResolvedValueOnce(okJson(task))
      .mockResolvedValueOnce(okJson(task))
      .mockResolvedValueOnce(okJson({ content: 'draft' }))
      .mockResolvedValueOnce(okJson({ ok: true }))
      .mockResolvedValueOnce(okJson({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await saveDocument('outline', '# outline');
    await fetchCharacters();
    await fetchTasks();
    await createTask({ recipe: 'chapter', chapterNums: [1] });
    await fetchTask('t1');
    await fetchDraft('t1', 1);
    await acceptTaskDraft('t1', 1);
    await discardTaskDraft('t1', 1);

    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method])).toEqual([
      ['/api/projects/default-project/documents/outline', 'PUT'],
      ['/api/projects/default-project/characters', undefined],
      ['/api/projects/default-project/tasks', undefined],
      ['/api/projects/default-project/tasks', 'POST'],
      ['/api/projects/default-project/tasks/t1', undefined],
      ['/api/projects/default-project/drafts/t1/1', undefined],
      ['/api/projects/default-project/tasks/t1/accept', 'POST'],
      ['/api/projects/default-project/tasks/t1/discard', 'POST'],
    ]);
  });
});
