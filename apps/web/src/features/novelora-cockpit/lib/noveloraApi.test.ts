import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  acceptCandidate,
  acceptTaskDraft,
  coverUrl,
  createTask,
  discardCandidate,
  discardTaskDraft,
  fetchCandidates,
  fetchChapter,
  fetchFileContent,
  fetchTextFile,
  generateCover,
  listProjectFiles,
  listWorkspaces,
  pickWorkspaceFile,
  pickWorkspaceFolder,
  registerWorkspace,
  runTask,
  setChaptersDir,
  setCover,
  stopTask,
  fetchCharacters,
  fetchDocument,
  fetchLlmModels,
  fetchDraft,
  fetchWorkflowGraph,
  saveWorkflowGraph,
  startWorkflowRun,
  stepWorkflowRun,
  fetchProject,
  fetchTask,
  fetchTasks,
  saveChapter,
  saveCharacters,
  saveDocument,
} from './noveloraApi';

const PID = 'default-project';

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('noveloraApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.noveloraDesktop;
  });

  it('fetches project meta through the /api proxy path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ id: PID, chapters: [] }));
    vi.stubGlobal('fetch', fetchMock);
    await fetchProject(PID);
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/default-project');
  });

  it('fetches and saves a chapter', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okJson({ num: 3, title: 'Salt Map, Ember Mark', content: '# x' }))
      .mockResolvedValueOnce(okJson({ words: 42 }));
    vi.stubGlobal('fetch', fetchMock);
    const chapter = await fetchChapter(3, PID);
    expect(chapter.title).toBe('Salt Map, Ember Mark');
    const saved = await saveChapter(3, 'body', PID);
    expect(saved.words).toBe(42);
    expect(fetchMock).toHaveBeenLastCalledWith('/api/projects/default-project/chapters/3', expect.objectContaining({ method: 'PUT' }));
  });

  it('throws on non-ok responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 404 })));
    await expect(fetchProject(PID)).rejects.toThrow('404');
  });

  it('lists LLM models through GET /api/llm/models', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({
      object: 'list',
      data: [
        { id: 'deepseek-v4-flash', object: 'model', owned_by: 'deepseek' },
        { id: 'deepseek-v4-pro', object: 'model', owned_by: 'deepseek' },
      ],
    }));
    vi.stubGlobal('fetch', fetchMock);
    const listed = await fetchLlmModels();
    expect(listed.data.map((row) => row.id)).toEqual(['deepseek-v4-flash', 'deepseek-v4-pro']);
    expect(fetchMock).toHaveBeenCalledWith('/api/llm/models');
  });

  it('fetches a named document through the /api proxy path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ content: '# world' }));
    vi.stubGlobal('fetch', fetchMock);
    const document = await fetchDocument('world', PID);
    expect(document.content).toBe('# world');
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/default-project/documents/world');
  });

  it('saves characters with PUT /characters', async () => {
    const file = { characters: [], relationships: [] };
    const fetchMock = vi.fn().mockResolvedValue(okJson(file));
    vi.stubGlobal('fetch', fetchMock);
    await saveCharacters(file, PID);
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

    await saveDocument('outline', '# outline', PID);
    await fetchCharacters(PID);
    await fetchTasks(PID);
    await createTask({ recipe: 'chapter', chapterNums: [1] }, PID);
    await fetchTask('t1', PID);
    await fetchDraft('t1', 1, PID);
    await acceptTaskDraft('t1', 1, PID);
    await discardTaskDraft('t1', 1, PID);

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

  it('lists and accepts candidates through the /api proxy path', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okJson([{ id: 'c1', targetPath: 'chapters/ch_03.md' }]))
      .mockResolvedValueOnce(okJson({ ok: true }))
      .mockResolvedValueOnce(okJson({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    await fetchCandidates(PID);
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/default-project/candidates');
    await acceptCandidate('c1', PID);
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/projects/default-project/candidates/c1/accept',
      expect.objectContaining({ method: 'POST' }),
    );
    await discardCandidate('c1', PID);
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/projects/default-project/candidates/c1/discard',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('runs and stops a task through POST /run and /stop', async () => {
    const task = { id: 't1', recipe: 'chapter', status: 'queued', chapterNums: [1] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okJson({ ...task, status: 'running' }))
      .mockResolvedValueOnce(okJson({ ...task, status: 'queued' }));
    vi.stubGlobal('fetch', fetchMock);

    await runTask('t1', PID);
    await stopTask('t1', PID);

    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method])).toEqual([
      ['/api/projects/default-project/tasks/t1/run', 'POST'],
      ['/api/projects/default-project/tasks/t1/stop', 'POST'],
    ]);
  });

  it('lists and registers workspaces', async () => {
    const workspace = { id: 'w1', title: '潮汐余烬', rootPath: 'D:/novels/tides', addedAt: '2026-08-19T00:00:00.000Z' };
    const meta = { id: 'w1', title: '潮汐余烬', currentChapter: 1, chapters: [] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okJson([workspace]))
      .mockResolvedValueOnce(okJson(meta));
    vi.stubGlobal('fetch', fetchMock);

    const list = await listWorkspaces();
    expect(list).toEqual([workspace]);
    await registerWorkspace('D:/novels/tides');

    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method])).toEqual([
      ['/api/workspaces', undefined],
      ['/api/workspaces', 'POST'],
    ]);
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ path: 'D:/novels/tides' });
  });

  it('picks a workspace folder through the local api', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ path: 'D:\\桃园密码' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(pickWorkspaceFolder('选择小说目录')).resolves.toBe('D:\\桃园密码');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/workspaces/browse',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ title: '选择小说目录' }) }),
    );
  });

  it('picks a markdown file through the local api', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ path: 'D:\\桃园密码\\设定.md' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(pickWorkspaceFile('选择人物文件')).resolves.toBe('D:\\桃园密码\\设定.md');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/workspaces/browse-file',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ title: '选择人物文件' }) }),
    );
  });

  it('reads an absolute local text file', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ content: '晋太元中' }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchTextFile('D:\\桃园密码\\设定.md', PID)).resolves.toEqual({ content: '晋太元中' });
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/local-text?path=${encodeURIComponent('D:\\桃园密码\\设定.md')}`,
    );
  });

  it('uses the desktop directory picker when Electron exposes it', async () => {
    vi.stubGlobal('fetch', vi.fn());
    window.noveloraDesktop = {
      platform: 'win32',
      versions: {},
      selectDirectory: vi.fn().mockResolvedValue('D:\\笔心\\桃园密码'),
      selectFile: vi.fn().mockResolvedValue('D:\\笔心\\设定.md'),
    };

    await expect(pickWorkspaceFolder()).resolves.toBe('D:\\笔心\\桃园密码');
    await expect(pickWorkspaceFile()).resolves.toBe('D:\\笔心\\设定.md');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sets the chapters directory with PUT /chapters-dir', async () => {
    const meta = { id: PID, title: 'Tides', currentChapter: 1, chapters: [{ num: 1, title: '忘路之远近', status: 'drafting', words: 10 }] };
    const fetchMock = vi.fn().mockResolvedValue(okJson(meta));
    vi.stubGlobal('fetch', fetchMock);

    const result = await setChaptersDir('正文', PID);
    expect(result.chapters).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/default-project/chapters-dir',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ dir: '正文' }) }),
    );
  });

  it('lists project files and reads file content', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(okJson({ dirs: ['正文'], files: ['正文/ch_01.md'], images: ['assets/cover.png'] }))
      .mockResolvedValueOnce(okJson({ content: '晋太元中' }));
    vi.stubGlobal('fetch', fetchMock);

    const listing = await listProjectFiles(PID);
    expect(listing.dirs).toEqual(['正文']);
    expect(listing.images).toEqual(['assets/cover.png']);
    const file = await fetchFileContent('正文/ch_01.md', PID);
    expect(file.content).toBe('晋太元中');
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/projects/default-project/file-content?path=%E6%AD%A3%E6%96%87%2Fch_01.md',
    );
  });

  it('sets and generates covers and builds the cover url', async () => {
    const meta = { id: PID, title: 'Tides', currentChapter: 1, chapters: [] };
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(okJson(meta)));
    vi.stubGlobal('fetch', fetchMock);

    expect(coverUrl(PID)).toBe('/api/projects/default-project/cover');
    await setCover('assets/cover.png', PID);
    await generateCover(PID);

    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method])).toEqual([
      ['/api/projects/default-project/cover', 'PUT'],
      ['/api/projects/default-project/cover/generate', 'POST'],
    ]);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ file: 'assets/cover.png' });
  });

  it('saves a workflow graph and starts a run through the /api proxy', async () => {
    const graph = { name: 'daily', model: 'hermes-agent', nodes: [], edges: [] };
    const run = { id: 'run-1', graphName: 'daily', status: 'running', nodes: {}, createdAt: '2026-08-24' };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(okJson({ ok: true, name: 'daily' }))
      .mockResolvedValueOnce(new Response(JSON.stringify(run), { status: 201, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(okJson({ ...run, status: 'waiting_author' }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await fetchWorkflowGraph('daily', PID)).toBeNull();
    await saveWorkflowGraph(graph, PID);
    await startWorkflowRun('daily', PID);
    await stepWorkflowRun('run-1', PID);

    expect(fetchMock.mock.calls.map((call) => [call[0], call[1]?.method])).toEqual([
      ['/api/projects/default-project/workflow/graphs/daily', undefined],
      ['/api/projects/default-project/workflow/graphs/daily', 'PUT'],
      ['/api/projects/default-project/workflow/runs', 'POST'],
      ['/api/projects/default-project/workflow/runs/run-1/step', 'POST'],
    ]);
  });
});
