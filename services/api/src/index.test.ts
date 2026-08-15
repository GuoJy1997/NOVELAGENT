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
});

