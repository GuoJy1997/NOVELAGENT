import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { acceptDraft, createTask, discardDraft, listTasks, readTask, writeDraft, writeTask } from './taskStore.ts';

describe('taskStore', () => {
  let root: string;
  before(async () => {
    root = await mkdtemp(join(tmpdir(), 'novelora-tasks-'));
    await mkdir(join(root, 'chapters'), { recursive: true });
    await writeFile(join(root, 'project.json'), JSON.stringify({
      id: 'default-project', title: 'Tides of Embers', currentChapter: 1,
      chapters: [{ num: 1, title: 'Ash on the Morning Tide', status: 'drafting' }],
    }));
    await writeFile(join(root, 'chapters/ch_01.md'), '# Ash\n\noriginal chapter\n');
    await writeFile(join(root, 'world.md'), '# World\nunchanged setting\n');
  });
  after(() => rm(root, { recursive: true, force: true }));

  it('accepts a draft onto the chapter file without changing world.md', async () => {
    const draft = '# Ash\n\ncandidate draft body\n';
    await writeDraft(root, 'task-accept', 1, draft);
    await acceptDraft(root, 'task-accept', 1);
    assert.equal(await readFile(join(root, 'chapters/ch_01.md'), 'utf8'), draft);
    assert.equal(await readFile(join(root, 'world.md'), 'utf8'), '# World\nunchanged setting\n');
  });

  it('creates a queued task with default hermes-agent model', async () => {
    const task = await createTask(root, { recipe: 'chapter', chapterNums: [1] });
    assert.match(task.id, /^[0-9a-f-]{36}$/i);
    assert.equal(task.recipe, 'chapter');
    assert.equal(task.status, 'queued');
    assert.equal(task.step, 'read_context');
    assert.equal(task.model, 'hermes-agent');
    assert.deepEqual(task.chapterNums, [1]);
    assert.equal(task.currentIndex, 0);
    assert.deepEqual(task.log, []);
    assert.equal(await readTask(root, task.id).then((t) => t.id), task.id);
    const listed = await listTasks(root);
    assert.ok(listed.some((t) => t.id === task.id));
  });

  it('rejects accept when the draft file is missing', async () => {
    await assert.rejects(acceptDraft(root, 'missing-task', 1), /draft/i);
  });

  it('discards a draft without rewriting the chapter', async () => {
    const before = await readFile(join(root, 'chapters/ch_01.md'), 'utf8');
    await writeDraft(root, 'task-discard', 1, '# discarded\n');
    await discardDraft(root, 'task-discard', 1);
    assert.equal(await readFile(join(root, 'chapters/ch_01.md'), 'utf8'), before);
    await assert.rejects(readFile(join(root, 'drafts/task-discard/ch_01.md'), 'utf8'), { code: 'ENOENT' });
  });

  it('marks the task done after accepting the last chapter', async () => {
    const task = await createTask(root, { recipe: 'chapter', chapterNums: [1] });
    await writeDraft(root, task.id, 1, '# last chapter draft\n');
    await acceptDraft(root, task.id, 1);
    assert.equal((await readTask(root, task.id)).status, 'done');
    assert.equal(await readFile(join(root, 'chapters/ch_01.md'), 'utf8'), '# last chapter draft\n');
  });

  it('keeps awaiting_accept after accepting a pause:act chapter when more remain', async () => {
    await writeFile(join(root, 'project.json'), JSON.stringify({
      id: 'default-project', title: 'Tides of Embers', currentChapter: 1,
      chapters: [
        { num: 1, title: 'Ash on the Morning Tide', status: 'drafting' },
        { num: 2, title: 'The Vow Beneath Glass', status: 'planned' },
        { num: 3, title: 'Salt Map, Ember Mark', status: 'planned' },
      ],
    }));
    await writeFile(join(root, 'chapters/ch_02.md'), '# two\n');
    await writeFile(join(root, 'chapters/ch_03.md'), '# three\n');
    const task = await createTask(root, { recipe: 'volume', chapterNums: [1, 2, 3] });
    await writeTask(root, {
      ...task,
      status: 'awaiting_accept',
      step: 'await_accept',
      currentIndex: 1,
      log: ['context', 'pause:act'],
    });
    await writeDraft(root, task.id, 1, '# parked act\n');
    await acceptDraft(root, task.id, 1);
    assert.equal((await readTask(root, task.id)).status, 'awaiting_accept');
    assert.equal(await readFile(join(root, 'chapters/ch_01.md'), 'utf8'), '# parked act\n');
  });
});
