import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

process.env.NOVELORA_DATA_DIR = await mkdtemp(join(tmpdir(), 'novelora-api-'));
const { buildServer } = await import('./index.ts');

describe('api routes', () => {
  let app: Awaited<ReturnType<typeof buildServer>>;
  before(async () => {
    const root = join(process.env.NOVELORA_DATA_DIR!, 'default-project');
    await mkdir(join(root, 'chapters'), { recursive: true });
    await writeFile(join(root, 'project.json'), JSON.stringify({
      id: 'default-project', title: 'Tides of Embers', currentChapter: 1,
      chapters: [{ num: 1, title: 'Ash on the Morning Tide', status: 'drafting' }],
    }));
    await writeFile(join(root, 'chapters/ch_01.md'), '# Ash\n\n三个中文字\n');
    app = await buildServer();
  });
  after(async () => {
    await app.close();
    await rm(process.env.NOVELORA_DATA_DIR!, { recursive: true, force: true });
  });

  it('serves health, project meta, chapter round-trip, and 404s', async () => {
    const health = await app.inject({ url: '/health' });
    assert.equal(health.statusCode, 200);

    const project = await app.inject({ url: '/projects/default-project' });
    assert.equal(project.statusCode, 200);
    assert.equal(project.json().chapters[0].title, 'Ash on the Morning Tide');
    assert.equal(project.json().rootPath, join(process.env.NOVELORA_DATA_DIR!, 'default-project'));

    const saved = await app.inject({
      method: 'PUT', url: '/projects/default-project/chapters/1',
      payload: { content: '# Ash\n\n重写 four words\n' },
    });
    assert.equal(saved.statusCode, 200);
    assert.equal(saved.json().words, 5);

    const chapter = await app.inject({ url: '/projects/default-project/chapters/1' });
    assert.match(chapter.json().content, /four words/);

    const missing = await app.inject({ url: '/projects/default-project/chapters/9' });
    assert.equal(missing.statusCode, 404);

    const badBody = await app.inject({
      method: 'PUT', url: '/projects/default-project/chapters/1', payload: {},
    });
    assert.equal(badBody.statusCode, 400);
  });

  it('round-trips world.md through GET and PUT documents', async () => {
    const saved = await app.inject({
      method: 'PUT', url: '/projects/default-project/documents/world',
      payload: { content: '# World\n规则：潮不可直呼其名\n' },
    });
    assert.equal(saved.statusCode, 200);

    const world = await app.inject({ url: '/projects/default-project/documents/world' });
    assert.equal(world.statusCode, 200);
    assert.equal(world.json().content, '# World\n规则：潮不可直呼其名\n');
  });

  it('puts characters and exposes projected relations.md', async () => {
    const saved = await app.inject({
      method: 'PUT', url: '/projects/default-project/characters',
      payload: {
        characters: [{ id: 'liora', name: '莉奥拉', role: '档案员', goal: '守镜', knows: '潮图', x: 12, y: 40 }],
        relationships: [{ id: 'r1', fromCharacterId: 'liora', toCharacterId: 'kael', label: '同盟', tension: '潮图秘密', kind: 'ally' }],
      },
    });
    assert.equal(saved.statusCode, 200);
    assert.equal(saved.json().characters[0].x, 12);

    const listed = await app.inject({ url: '/projects/default-project/characters' });
    assert.equal(listed.statusCode, 200);
    assert.equal(listed.json().characters[0].name, '莉奥拉');

    const relations = await app.inject({ url: '/projects/default-project/documents/relations' });
    assert.equal(relations.statusCode, 200);
    assert.match(relations.json().content, /id: liora/);
    assert.match(relations.json().content, /from: liora/);
    assert.doesNotMatch(relations.json().content, /\bx:/);
  });

  it('refuses PUT documents/relations with 400', async () => {
    const res = await app.inject({
      method: 'PUT', url: '/projects/default-project/documents/relations',
      payload: { content: 'nope' },
    });
    assert.equal(res.statusCode, 400);
  });

  it('creates a task and 404s accept when no draft exists', async () => {
    const created = await app.inject({
      method: 'POST', url: '/projects/default-project/tasks',
      payload: { recipe: 'chapter', chapterNums: [1] },
    });
    assert.equal(created.statusCode, 200);
    const task = created.json();
    assert.equal(task.model, 'hermes-agent');
    assert.equal(task.status, 'queued');
    assert.equal(task.recipe, 'chapter');

    const listed = await app.inject({ url: '/projects/default-project/tasks' });
    assert.equal(listed.statusCode, 200);
    assert.ok(listed.json().some((t: { id: string }) => t.id === task.id));

    const fetched = await app.inject({ url: `/projects/default-project/tasks/${task.id}` });
    assert.equal(fetched.statusCode, 200);
    assert.equal(fetched.json().id, task.id);

    const accept = await app.inject({
      method: 'POST', url: `/projects/default-project/tasks/${task.id}/accept`,
      payload: { chapterNum: 1 },
    });
    assert.equal(accept.statusCode, 404);
    assert.match(accept.json().error, /unknown draft/i);
  });

  it('stops a task to queued without deleting drafts', async () => {
    const { readDraft, writeDraft, writeTask } = await import('./taskStore.ts');
    const created = await app.inject({
      method: 'POST', url: '/projects/default-project/tasks',
      payload: { recipe: 'chapter', chapterNums: [1] },
    });
    assert.equal(created.statusCode, 200);
    const task = created.json();
    const root = join(process.env.NOVELORA_DATA_DIR!, 'default-project');
    await writeDraft(root, task.id, 1, 'keep this candidate');
    await writeTask(root, { ...task, status: 'running' });

    const stopped = await app.inject({
      method: 'POST', url: `/projects/default-project/tasks/${task.id}/stop`,
    });
    assert.equal(stopped.statusCode, 200);
    assert.equal(stopped.json().status, 'queued');
    assert.equal(await readDraft(root, task.id, 1), 'keep this candidate');

    const missing = await app.inject({
      method: 'POST', url: '/projects/default-project/tasks/missing-task-id/stop',
    });
    assert.equal(missing.statusCode, 404);
    assert.match(missing.json().error, /unknown task/i);
  });

  it('returns 404 for an unknown task on run', async () => {
    const missing = await app.inject({
      method: 'POST', url: '/projects/default-project/tasks/missing-task-id/run',
    });
    assert.equal(missing.statusCode, 404);
    assert.match(missing.json().error, /unknown task/i);
  });

  it('returns a task 404 not a draft 404 when accepting a missing taskId', async () => {
    const accept = await app.inject({
      method: 'POST', url: '/projects/default-project/tasks/missing-task-id/accept',
      payload: { chapterNum: 1 },
    });
    assert.equal(accept.statusCode, 404);
    assert.match(accept.json().error, /unknown task/i);
    assert.doesNotMatch(accept.json().error, /draft/i);
  });

  it('returns 400 for bad document and task bodies and 404 for missing records', async () => {
    const badDoc = await app.inject({
      method: 'PUT', url: '/projects/default-project/documents/world', payload: {},
    });
    assert.equal(badDoc.statusCode, 400);

    const badTask = await app.inject({
      method: 'POST', url: '/projects/default-project/tasks', payload: { recipe: 'chapter' },
    });
    assert.equal(badTask.statusCode, 400);

    const missingProject = await app.inject({ url: '/projects/no-such-book/documents/world' });
    assert.equal(missingProject.statusCode, 404);

    const missingTask = await app.inject({ url: '/projects/default-project/tasks/missing-id' });
    assert.equal(missingTask.statusCode, 404);

    const missingDraft = await app.inject({ url: '/projects/default-project/drafts/missing-id/1' });
    assert.equal(missingDraft.statusCode, 404);
  });

  it('rejects empty or unknown chapterNums with 400', async () => {
    const empty = await app.inject({
      method: 'POST', url: '/projects/default-project/tasks',
      payload: { recipe: 'chapter', chapterNums: [] },
    });
    assert.equal(empty.statusCode, 400);

    const unknown = await app.inject({
      method: 'POST', url: '/projects/default-project/tasks',
      payload: { recipe: 'chapter', chapterNums: [99] },
    });
    assert.equal(unknown.statusCode, 400);

    const nan = await app.inject({
      method: 'POST', url: '/projects/default-project/tasks',
      payload: { recipe: 'chapter', chapterNums: [Number.NaN] },
    });
    assert.equal(nan.statusCode, 400);
  });

  it('writes, lists, accepts, and discards dialog candidates', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/projects/default-project/candidates',
      payload: {
        runId: 'sess-1',
        targetPath: 'chapters/ch_01.md',
        source: 'dialog',
        content: '# from dialog\n',
      },
    });
    assert.equal(created.statusCode, 201);
    const id = created.json().id as string;
    const listed = await app.inject({ url: '/projects/default-project/candidates' });
    assert.equal(listed.statusCode, 200);
    assert.equal(listed.json().some((row: { id: string }) => row.id === id), true);
    const accepted = await app.inject({
      method: 'POST',
      url: `/projects/default-project/candidates/${id}/accept`,
    });
    assert.equal(accepted.statusCode, 200);
    const chapter = await app.inject({ url: '/projects/default-project/chapters/1' });
    assert.match(chapter.json().content, /from dialog/);
  });

  it('rejects characters.json as a candidate target', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/projects/default-project/candidates',
      payload: { runId: 'x', targetPath: 'characters.json', source: 'dialog', content: '{}' },
    });
    assert.equal(res.statusCode, 400);
  });

  it('returns 404 when discarding an unknown candidate', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/projects/default-project/candidates/11111111-1111-1111-1111-111111111111/discard',
    });
    assert.equal(res.statusCode, 404);
    assert.match(res.json().error, /unknown candidate/i);
  });

  it('returns 400 for a non-UUID candidate id instead of joining it into a path', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/projects/default-project/candidates/${encodeURIComponent('../../../../etc/passwd')}/discard`,
    });
    assert.equal(res.statusCode, 400);
    assert.match(res.json().error, /invalid candidate id/i);
  });

  it('marks a task done after accepting its last chapter draft', async () => {
    const { writeDraft } = await import('./taskStore.ts');
    const created = await app.inject({
      method: 'POST', url: '/projects/default-project/tasks',
      payload: { recipe: 'chapter', chapterNums: [1] },
    });
    assert.equal(created.statusCode, 200);
    const task = created.json();
    const root = join(process.env.NOVELORA_DATA_DIR!, 'default-project');
    await writeDraft(root, task.id, 1, '# accepted last chapter\n');

    const accept = await app.inject({
      method: 'POST', url: `/projects/default-project/tasks/${task.id}/accept`,
      payload: { chapterNum: 1 },
    });
    assert.equal(accept.statusCode, 200);

    const fetched = await app.inject({ url: `/projects/default-project/tasks/${task.id}` });
    assert.equal(fetched.statusCode, 200);
    assert.equal(fetched.json().status, 'done');
  });

  it('registers a workspace with Chinese chapter names and scans its chapters dir', async () => {
    const fake = await mkdtemp(join(tmpdir(), 'novelora-fake-book-'));
    await mkdir(join(fake, '正文'), { recursive: true });
    await mkdir(join(fake, '状态卡'), { recursive: true });
    await writeFile(join(fake, '正文/001-第1章-忘路之远近.md'), '# 忘路之远近\n\n晋太元中\n');
    await writeFile(join(fake, '正文/014-间隙章上-同梦.md'), '# 同梦\n\n同梦\n');
    await writeFile(join(fake, '世界观设定.md'), '# 世界观\n');
    await writeFile(join(fake, '状态卡/map.svg'), '<svg/>\n');

    const badBody = await app.inject({ method: 'POST', url: '/workspaces', payload: {} });
    assert.equal(badBody.statusCode, 400);

    const missing = await app.inject({
      method: 'POST', url: '/workspaces', payload: { path: join(fake, 'nope') },
    });
    assert.equal(missing.statusCode, 400);

    const registered = await app.inject({
      method: 'POST', url: '/workspaces', payload: { path: fake },
    });
    assert.equal(registered.statusCode, 201);
    const project = registered.json();
    assert.match(project.id, /-[0-9a-f]{6}$/);

    const workspaces = await app.inject({ url: '/workspaces' });
    assert.equal(workspaces.statusCode, 200);
    assert.ok(workspaces.json().some((w: { id: string }) => w.id === project.id));

    const scanned = await app.inject({
      method: 'PUT', url: `/projects/${project.id}/chapters-dir`, payload: { dir: '正文' },
    });
    assert.equal(scanned.statusCode, 200);
    assert.deepEqual(
      scanned.json().chapters.map((c: { num: number; title: string; file: string }) => [c.num, c.title, c.file]),
      [
        [1, '忘路之远近', '正文/001-第1章-忘路之远近.md'],
        [14, '间隙章上-同梦', '正文/014-间隙章上-同梦.md'],
      ],
    );

    const chapter = await app.inject({ url: `/projects/${project.id}/chapters/14` });
    assert.equal(chapter.statusCode, 200);
    assert.match(chapter.json().content, /同梦/);

    const escapeDir = await app.inject({
      method: 'PUT', url: `/projects/${project.id}/chapters-dir`, payload: { dir: '..' },
    });
    assert.equal(escapeDir.statusCode, 400);

    const unknownProject = await app.inject({
      method: 'PUT', url: '/projects/no-such-book/chapters-dir', payload: { dir: '正文' },
    });
    assert.equal(unknownProject.statusCode, 404);

    await rm(fake, { recursive: true, force: true });
  });

  it('lists entries and serves file content with traversal guards', async () => {
    const fake = await mkdtemp(join(tmpdir(), 'novelora-fake-files-'));
    await mkdir(join(fake, '正文'), { recursive: true });
    await writeFile(join(fake, '正文/001-第1章-忘路之远近.md'), '# 忘路之远近\n');
    await writeFile(join(fake, '人物小传.txt'), 'chars\n');
    await writeFile(join(fake, 'cover-art.png'), Buffer.from([0x89, 0x50]));

    const registered = await app.inject({
      method: 'POST', url: '/workspaces', payload: { path: fake },
    });
    const id = registered.json().id as string;

    const files = await app.inject({ url: `/projects/${id}/files` });
    assert.equal(files.statusCode, 200);
    assert.deepEqual(files.json().dirs, ['正文']);
    assert.ok(files.json().files.includes('人物小传.txt'));
    assert.ok(files.json().files.includes('正文/001-第1章-忘路之远近.md'));
    assert.deepEqual(files.json().images, ['cover-art.png']);

    const content = await app.inject({
      url: `/projects/${id}/file-content?path=${encodeURIComponent('人物小传.txt')}`,
    });
    assert.equal(content.statusCode, 200);
    assert.equal(content.json().content, 'chars\n');

    const traversal = await app.inject({
      url: `/projects/${id}/file-content?path=${encodeURIComponent('../secret.md')}`,
    });
    assert.equal(traversal.statusCode, 400);

    const notText = await app.inject({
      url: `/projects/${id}/file-content?path=${encodeURIComponent('cover-art.png')}`,
    });
    assert.equal(notText.statusCode, 400);

    const missingFile = await app.inject({
      url: `/projects/${id}/file-content?path=${encodeURIComponent('nope.md')}`,
    });
    assert.equal(missingFile.statusCode, 404);

    const unknownProject = await app.inject({ url: '/projects/no-such-book/files' });
    assert.equal(unknownProject.statusCode, 404);

    await rm(fake, { recursive: true, force: true });
  });

  it('sets, generates, and serves project covers', async () => {
    const fake = await mkdtemp(join(tmpdir(), 'novelora-fake-cover-'));
    await writeFile(join(fake, 'cover-art.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const registered = await app.inject({
      method: 'POST', url: '/workspaces', payload: { path: fake },
    });
    const id = registered.json().id as string;

    const noCover = await app.inject({ url: `/projects/${id}/cover` });
    assert.equal(noCover.statusCode, 404);

    const badBody = await app.inject({ method: 'PUT', url: `/projects/${id}/cover`, payload: {} });
    assert.equal(badBody.statusCode, 400);

    const traversal = await app.inject({
      method: 'PUT', url: `/projects/${id}/cover`, payload: { file: '../x.png' },
    });
    assert.equal(traversal.statusCode, 400);

    const notImage = await app.inject({
      method: 'PUT', url: `/projects/${id}/cover`, payload: { file: 'project.json' },
    });
    assert.equal(notImage.statusCode, 400);

    const set = await app.inject({
      method: 'PUT', url: `/projects/${id}/cover`, payload: { file: 'cover-art.png' },
    });
    assert.equal(set.statusCode, 200);
    assert.equal(set.json().cover, 'cover-art.png');

    const png = await app.inject({ url: `/projects/${id}/cover` });
    assert.equal(png.statusCode, 200);
    assert.equal(png.headers['content-type'], 'image/png');
    assert.equal(png.rawPayload[0], 0x89);

    const generated = await app.inject({ method: 'POST', url: `/projects/${id}/cover/generate` });
    assert.equal(generated.statusCode, 200);
    assert.equal(generated.json().cover, 'cover.svg');

    const svg = await app.inject({ url: `/projects/${id}/cover` });
    assert.equal(svg.statusCode, 200);
    assert.match(svg.headers['content-type'] as string, /image\/svg\+xml/);
    assert.match(svg.body, /<svg/);

    const unknownProject = await app.inject({ method: 'POST', url: '/projects/no-such-book/cover/generate' });
    assert.equal(unknownProject.statusCode, 404);

    await rm(fake, { recursive: true, force: true });
  });

  it('opens a native folder picker and returns the selected path', async () => {
    const pickerApp = await buildServer({
      pickFolder: async () => 'D:\\桃园密码',
    });
    const picked = await pickerApp.inject({ method: 'POST', url: '/workspaces/browse' });
    assert.equal(picked.statusCode, 200);
    assert.equal(picked.json().path, 'D:\\桃园密码');
    await pickerApp.close();
  });

  it('returns a null path when the native folder picker is cancelled', async () => {
    const pickerApp = await buildServer({
      pickFolder: async () => null,
    });
    const cancelled = await pickerApp.inject({ method: 'POST', url: '/workspaces/browse' });
    assert.equal(cancelled.statusCode, 200);
    assert.equal(cancelled.json().path, null);
    await pickerApp.close();
  });

  it('opens a native file picker and returns the selected path', async () => {
    const pickerApp = await buildServer({
      pickFile: async () => 'D:\\桃园密码\\设定.md',
    });
    const picked = await pickerApp.inject({ method: 'POST', url: '/workspaces/browse-file' });
    assert.equal(picked.statusCode, 200);
    assert.equal(picked.json().path, 'D:\\桃园密码\\设定.md');
    await pickerApp.close();
  });

  it('lists DeepSeek models through GET /llm/models', async () => {
    const llmApp = await buildServer({
      llm: {
        apiKey: 'test-key',
        baseUrl: 'https://api.deepseek.com',
        fetchImpl: (async () => new Response(JSON.stringify({
          object: 'list',
          data: [{ id: 'deepseek-v4-flash', object: 'model', owned_by: 'deepseek' }],
        }), { status: 200 })) as typeof fetch,
      },
    });
    const listed = await llmApp.inject({ url: '/llm/models' });
    assert.equal(listed.statusCode, 200);
    assert.equal(listed.json().data[0].id, 'deepseek-v4-flash');
    await llmApp.close();
  });

  it('returns 503 from GET /llm/models when the DeepSeek key is missing', async () => {
    const llmApp = await buildServer({
      llm: { apiKey: '', baseUrl: 'https://api.deepseek.com' },
    });
    const listed = await llmApp.inject({ url: '/llm/models' });
    assert.equal(listed.statusCode, 503);
    await llmApp.close();
  });

  it('flushes chat SSE chunks before the upstream stream ends', async () => {
    const encoder = new TextEncoder();
    let releaseSecond: () => void = () => undefined;
    const second = new Promise<void>((resolve) => {
      releaseSecond = resolve;
    });
    const llmApp = await buildServer({
      llm: {
        apiKey: 'test-key',
        baseUrl: 'https://api.deepseek.com',
        fetchImpl: (async () => new Response(new ReadableStream({
          async start(controller) {
            controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n'));
            await second;
            controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"lo"}}]}\n\ndata: [DONE]\n\n'));
            controller.close();
          },
        }), { status: 200, headers: { 'Content-Type': 'text/event-stream' } })) as typeof fetch,
      },
    });
    await llmApp.listen({ host: '127.0.0.1', port: 0 });
    try {
      const address = llmApp.server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      const response = await fetch(`http://127.0.0.1:${port}/llm/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
      });
      assert.equal(response.status, 200);
      const reader = response.body?.getReader();
      assert.ok(reader);
      const first = await Promise.race([
        reader.read(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('buffered until end')), 500);
        }),
      ]);
      assert.match(new TextDecoder().decode(first.value), /Hel/);
      releaseSecond();
      await reader.read();
    } finally {
      releaseSecond();
      await llmApp.close();
    }
  });

  it('reads a local markdown file chosen from the system picker', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'novelora-local-text-'));
    const file = join(dir, '设定.md');
    await writeFile(file, '晋太元中\n');
    const fetched = await app.inject({ url: `/local-text?path=${encodeURIComponent(file)}` });
    assert.equal(fetched.statusCode, 200);
    assert.equal(fetched.json().content, '晋太元中\n');
    const png = await app.inject({ url: `/local-text?path=${encodeURIComponent(join(dir, 'x.png'))}` });
    assert.equal(png.statusCode, 400);
    await rm(dir, { recursive: true, force: true });
  });

  it('accepts an absolute chapters directory inside the project root', async () => {
    const fake = await mkdtemp(join(tmpdir(), 'novelora-abs-chapters-'));
    await mkdir(join(fake, '正文'), { recursive: true });
    await writeFile(join(fake, '正文/001-第1章-忘路之远近.md'), '# 忘路之远近\n\n晋太元中\n');
    const registered = await app.inject({
      method: 'POST', url: '/workspaces', payload: { path: fake },
    });
    assert.equal(registered.statusCode, 201);
    const id = registered.json().id;
    const scanned = await app.inject({
      method: 'PUT',
      url: `/projects/${id}/chapters-dir`,
      payload: { dir: join(fake, '正文') },
    });
    assert.equal(scanned.statusCode, 200);
    assert.equal(scanned.json().chapters[0].title, '忘路之远近');
    await rm(fake, { recursive: true, force: true });
  });
});

describe('workflow routes', () => {
  let app: Awaited<ReturnType<typeof buildServer>>;
  const hermesReplies: string[] = [];
  const hermesFetch = (async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: hermesReplies.shift() ?? '附件内容' } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;

  before(async () => {
    const root = join(process.env.NOVELORA_DATA_DIR!, 'wf-project');
    await mkdir(join(root, 'chapters'), { recursive: true });
    await writeFile(join(root, 'project.json'), JSON.stringify({
      id: 'wf-project', title: 'WF', currentChapter: 1,
      chapters: [{ num: 1, title: 'One', status: 'planned' }],
    }));
    await writeFile(join(root, 'outline.md'), '# Outline\n第一卷\n');
    app = await buildServer({ hermesFetch });
  });
  after(() => app.close());

  const graph = {
    model: 'hermes-agent',
    nodes: [
      { id: 'scan', type: 'explore', title: '盘点', goal: '盘点全书状态', skills: [], config: { sourcePaths: ['outline.md'] } },
      { id: 'check', type: 'manual', title: '作者检查', goal: '作者过目', skills: [] },
    ],
    edges: [{ from: 'scan', to: 'check', attachmentType: 'fact' }],
  };

  it('rejects an invalid graph with 400 and details', async () => {
    const bad = { ...graph, edges: [{ from: 'scan', to: 'ghost', attachmentType: 'fact' }] };
    const res = await app.inject({ method: 'PUT', url: '/projects/wf-project/workflow/graphs/daily', payload: bad });
    assert.equal(res.statusCode, 400);
    assert.ok(res.json().details.length > 0);
  });

  it('saves a graph, runs it to waiting_author, and resolves the manual node', async () => {
    const saved = await app.inject({ method: 'PUT', url: '/projects/wf-project/workflow/graphs/daily', payload: graph });
    assert.equal(saved.statusCode, 200);

    const list = await app.inject({ url: '/projects/wf-project/workflow/graphs' });
    assert.deepEqual(list.json(), ['daily']);

    const created = await app.inject({
      method: 'POST', url: '/projects/wf-project/workflow/runs', payload: { graphName: 'daily' },
    });
    assert.equal(created.statusCode, 201);
    const runId = created.json().id as string;

    hermesReplies.push('进度盘点：第一卷已完成两章');
    const step1 = await app.inject({ method: 'POST', url: `/projects/wf-project/workflow/runs/${runId}/step` });
    assert.equal(step1.json().nodes.scan.status, 'done');

    const step2 = await app.inject({ method: 'POST', url: `/projects/wf-project/workflow/runs/${runId}/step` });
    assert.equal(step2.json().status, 'waiting_author');

    const resolved = await app.inject({
      method: 'POST', url: `/projects/wf-project/workflow/runs/${runId}/manual`,
      payload: { nodeId: 'check', note: '放行' },
    });
    assert.equal(resolved.json().status, 'done');

    const fetched = await app.inject({ url: `/projects/wf-project/workflow/runs/${runId}` });
    assert.equal(fetched.json().status, 'done');

    const missing = await app.inject({ url: '/projects/wf-project/workflow/runs/00000000-0000-0000-0000-000000000000' });
    assert.equal(missing.statusCode, 404);

    const notWaiting = await app.inject({
      method: 'POST', url: `/projects/wf-project/workflow/runs/${runId}/manual`,
      payload: { nodeId: 'scan' },
    });
    assert.equal(notWaiting.statusCode, 400);
  });
});

