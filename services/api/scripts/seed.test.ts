import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { seedProject } from './seed.ts';

describe('seedProject', () => {
  it('creates the default project and never overwrites edits', async () => {
    const root = await mkdtemp(join(tmpdir(), 'novelora-seed-'));
    try {
      await seedProject(root);
      const meta = JSON.parse(await readFile(join(root, 'default-project/project.json'), 'utf8'));
      assert.ok(Array.isArray(meta.volumes));
      assert.ok(Array.isArray(meta.acts));
      assert.equal(meta.recipes[0], 'chapter');
      const relations = await readFile(join(root, 'default-project/relations.md'), 'utf8');
      assert.match(relations, /# Characters/);
      assert.doesNotMatch(relations, /\bx:/);
      assert.equal(meta.chapters.length, 6);
      assert.equal(meta.currentChapter, 3);
      assert.equal(meta.chapters[1].status, 'review');
      assert.deepEqual(meta.chapters[5], { num: 6, title: 'Embers Under Black Water', status: 'planned', actId: 'act-2' });
      await writeFile(join(root, 'default-project/chapters/ch_03.md'), 'user edits', 'utf8');
      await seedProject(root);
      assert.equal(await readFile(join(root, 'default-project/chapters/ch_03.md'), 'utf8'), 'user edits');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('merges missing chapters into an existing project.json without overwriting other fields', async () => {
    const root = await mkdtemp(join(tmpdir(), 'novelora-seed-'));
    try {
      await seedProject(root);
      const metaPath = join(root, 'default-project/project.json');
      const stale = {
        id: 'default-project',
        title: 'Tides of Embers',
        currentChapter: 3,
        chapters: [
          { num: 1, title: 'Ash on the Morning Tide', status: 'complete' },
          { num: 2, title: 'The Vow Beneath Glass', status: 'complete' },
          { num: 3, title: 'Salt Map, Ember Mark', status: 'drafting' },
          { num: 4, title: 'The Queen of Broken Buoys', status: 'planned' },
          { num: 5, title: 'Voren Lights the False Star', status: 'planned' },
        ],
      };
      await writeFile(metaPath, JSON.stringify(stale, null, 2), 'utf8');
      await writeFile(join(root, 'default-project/chapters/ch_06.md'), 'user ch6 draft', 'utf8');
      await seedProject(root);
      const merged = JSON.parse(await readFile(metaPath, 'utf8'));
      assert.equal(merged.chapters.length, 6);
      assert.deepEqual(merged.chapters[5], { num: 6, title: 'Embers Under Black Water', status: 'planned', actId: 'act-2' });
      assert.equal(merged.chapters[1].status, 'complete');
      assert.equal(merged.currentChapter, 3);
      assert.equal(await readFile(join(root, 'default-project/chapters/ch_06.md'), 'utf8'), 'user ch6 draft');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
