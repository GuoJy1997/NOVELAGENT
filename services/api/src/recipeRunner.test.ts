import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createTask, readTask, writeDraft, writeTask } from './taskStore.ts';
import { assembleContext, runTaskStep } from './recipeRunner.ts';

const mockFetch = (async () =>
  new Response(JSON.stringify({ choices: [{ message: { content: '候选正文莉奥拉' } }] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })) as typeof fetch;

describe('recipeRunner', () => {
  let root: string;

  before(async () => {
    root = await mkdtemp(join(tmpdir(), 'novelora-recipe-'));
    await mkdir(join(root, 'chapters'), { recursive: true });
    await writeFile(join(root, 'project.json'), JSON.stringify({
      id: 'default-project',
      title: 'Tides of Embers',
      currentChapter: 1,
      acts: [
        { id: 'act-1', title: 'Act I', chapterNums: [1, 2, 3] },
        { id: 'act-2', title: 'Act II', chapterNums: [4, 5, 6] },
      ],
      chapters: [
        { num: 1, title: 'Ash on the Morning Tide', status: 'drafting' },
        { num: 2, title: 'The Vow Beneath Glass', status: 'planned' },
        { num: 3, title: 'Salt Map, Ember Mark', status: 'planned' },
        { num: 4, title: 'The Queen of Broken Buoys', status: 'planned' },
      ],
    }));
    await writeFile(join(root, 'world.md'), '禁直呼潮名');
    await writeFile(join(root, 'relations.md'), '# Characters\n- id: liora\n  name: 莉奥拉\n  role: 档案员\n');
    await writeFile(join(root, 'outline.md'), '# Outline\n');
    await writeFile(join(root, 'canon.md'), '# Canon\n');
    await writeFile(join(root, 'chapters/ch_01.md'), '');
    await writeFile(join(root, 'chapters/ch_02.md'), 'neighbor two body '.repeat(40));
    await writeFile(join(root, 'characters.json'), JSON.stringify({
      characters: [{ id: 'liora', name: '莉奥拉', role: '档案员', x: 12, y: 40 }],
      relationships: [],
    }));
  });

  after(() => rm(root, { recursive: true, force: true }));

  it('assembleContext never includes character coordinates', async () => {
    const ctx = await assembleContext(root, 1);
    assert.match(ctx, /莉奥拉/);
    assert.doesNotMatch(ctx, /\bx:/);
    assert.doesNotMatch(ctx, /characters\.json/);
  });

  it('draft step writes drafts/ and never touches world.md', async () => {
    const worldBefore = await readFile(join(root, 'world.md'), 'utf8');
    const task = await createTask(root, { recipe: 'chapter', chapterNums: [1] });
    await runTaskStep(root, task.id, mockFetch);
    await runTaskStep(root, task.id, mockFetch); // draft
    const draft = await readFile(join(root, 'drafts', task.id, 'ch_01.md'), 'utf8');
    assert.match(draft, /候选正文/);
    assert.equal(await readFile(join(root, 'world.md'), 'utf8'), worldBefore);
  });

  it('self_check does not write world.md', async () => {
    const worldBefore = await readFile(join(root, 'world.md'), 'utf8');
    const charactersBefore = await readFile(join(root, 'characters.json'), 'utf8');
    const task = await createTask(root, { recipe: 'chapter', chapterNums: [1] });
    await runTaskStep(root, task.id, mockFetch);
    await runTaskStep(root, task.id, mockFetch);
    const afterCheck = await runTaskStep(root, task.id, mockFetch);
    assert.equal(afterCheck.step, 'park_draft');
    assert.equal(await readFile(join(root, 'world.md'), 'utf8'), worldBefore);
    assert.equal(await readFile(join(root, 'characters.json'), 'utf8'), charactersBefore);
  });

  it('hermes failure blocks the task and keeps drafts', async () => {
    const task = await createTask(root, { recipe: 'chapter', chapterNums: [1] });
    await runTaskStep(root, task.id, mockFetch);
    await runTaskStep(root, task.id, mockFetch);
    const failingFetch = (async () => {
      throw new Error('hermes down');
    }) as typeof fetch;
    const blocked = await runTaskStep(root, task.id, failingFetch);
    assert.equal(blocked.status, 'blocked');
    const draft = await readFile(join(root, 'drafts', task.id, 'ch_01.md'), 'utf8');
    assert.match(draft, /候选正文/);
    const persisted = await readTask(root, task.id);
    assert.equal(persisted.status, 'blocked');
  });

  it('volume park after an act logs pause:act', async () => {
    const created = await createTask(root, { recipe: 'volume', chapterNums: [1, 2, 3, 4] });
    await writeTask(root, {
      ...created,
      status: 'running',
      step: 'park_draft',
      currentIndex: 2,
      log: ['context'],
    });
    await writeDraft(root, created.id, 3, 'act-end draft');
    const parked = await runTaskStep(root, created.id, mockFetch);
    assert.equal(parked.status, 'awaiting_accept');
    assert.equal(parked.step, 'await_accept');
    assert.equal(parked.currentIndex, 3);
    assert.ok(parked.log.includes('pause:act'));
    assert.equal(await readFile(join(root, 'drafts', created.id, 'ch_03.md'), 'utf8'), 'act-end draft');
  });

  it('resumes a volume after pause:act without deleting drafts', async () => {
    const created = await createTask(root, { recipe: 'volume', chapterNums: [1, 2, 3, 4] });
    await writeTask(root, {
      ...created,
      status: 'awaiting_accept',
      step: 'await_accept',
      currentIndex: 3,
      log: ['context', 'pause:act'],
    });
    await writeDraft(root, created.id, 3, 'kept act draft');
    const resumed = await runTaskStep(root, created.id, mockFetch);
    assert.equal(resumed.status, 'running');
    assert.equal(resumed.step, 'draft');
    assert.equal(resumed.currentIndex, 3);
    assert.equal(await readFile(join(root, 'drafts', created.id, 'ch_03.md'), 'utf8'), 'kept act draft');
  });
});
