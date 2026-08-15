import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { atomicWrite, countWords, projectRelations, readChapter, readCharacters, readDocument, readProject, writeChapter, writeCharacters, writeDocument } from './projectStore.ts';

describe('projectStore', () => {
  let root: string;
  before(async () => {
    root = await mkdtemp(join(tmpdir(), 'novelora-'));
    await mkdir(join(root, 'chapters'), { recursive: true });
    await writeFile(join(root, 'project.json'), JSON.stringify({
      id: 'default-project', title: 'Tides of Embers', currentChapter: 1,
      chapters: [{ num: 1, title: 'Ash on the Morning Tide', status: 'drafting' }],
    }));
    await writeFile(join(root, 'chapters/ch_01.md'), '# Ash on the Morning Tide\n\n潮汐涌来。\n');
  });
  after(() => rm(root, { recursive: true, force: true }));

  it('counts CJK chars plus latin words', () => {
    assert.equal(countWords('潮汐 hello world 涌'), 5);
  });

  it('reads project meta with computed word counts', async () => {
    const meta = await readProject(root);
    assert.equal(meta.title, 'Tides of Embers');
    assert.equal(meta.chapters[0].words, 9);
  });

  it('round-trips a chapter through atomic write', async () => {
    const { words } = await writeChapter(root, 1, '# New\n\n两个 words\n');
    assert.equal(words, 4);
    const chapter = await readChapter(root, 1);
    assert.equal(chapter.title, 'Ash on the Morning Tide');
    assert.match(chapter.content, /两个 words/);
    assert.match(await readFile(join(root, 'chapters/ch_01.md'), 'utf8'), /两个 words/);
  });

  it('rejects unknown chapters', async () => {
    await assert.rejects(readChapter(root, 99), /Unknown chapter 99/);
    await assert.rejects(writeChapter(root, 99, 'x'), /Unknown chapter 99/);
  });

  it('projects relations.md without layout fields', async () => {
    await writeCharacters(root, {
      characters: [{ id: 'liora', name: '莉奥拉', role: '档案员', goal: '守镜', knows: '潮图', x: 12, y: 40 }],
      relationships: [{ id: 'r1', fromCharacterId: 'liora', toCharacterId: 'kael', label: '同盟', tension: '潮图秘密', kind: 'ally' }],
    });
    const md = await readDocument(root, 'relations');
    assert.match(md, /id: liora/);
    assert.match(md, /from: liora/);
    assert.doesNotMatch(md, /\bx:/);
    assert.doesNotMatch(md, /\by:/);
    const file = await readCharacters(root);
    assert.equal(file.characters[0].x, 12);
  });

  it('refuses to write relations.md directly', async () => {
    await assert.rejects(writeDocument(root, 'relations', 'nope'), /relations/);
  });

  it('overwrites an existing file without leaving the target missing', async () => {
    const target = join(root, 'atomic-target.md');
    await writeFile(target, 'old', 'utf8');
    await atomicWrite(target, 'new contents');
    assert.equal(await readFile(target, 'utf8'), 'new contents');
    await assert.rejects(readFile(`${target}.tmp`, 'utf8'), { code: 'ENOENT' });
  });

  it('keeps distinct tmp names so concurrent writes do not share target.tmp', async () => {
    const first = join(root, 'concurrent-a.md');
    const second = join(root, 'concurrent-b.md');
    await Promise.all([atomicWrite(first, 'alpha'), atomicWrite(second, 'beta')]);
    assert.equal(await readFile(first, 'utf8'), 'alpha');
    assert.equal(await readFile(second, 'utf8'), 'beta');
    const same = join(root, 'concurrent-same.md');
    await Promise.all([atomicWrite(same, 'one'), atomicWrite(same, 'two')]);
    const winner = await readFile(same, 'utf8');
    assert.ok(winner === 'one' || winner === 'two');
    await assert.rejects(readFile(`${same}.tmp`, 'utf8'), { code: 'ENOENT' });
  });

  it('overwrites characters.json and relations.md on second write', async () => {
    await writeCharacters(root, {
      characters: [{ id: 'liora', name: 'Liora', role: 'archivist' }],
      relationships: [],
    });
    await writeCharacters(root, {
      characters: [{ id: 'kael', name: 'Kael', role: 'scout' }],
      relationships: [{ id: 'r1', fromCharacterId: 'kael', toCharacterId: 'liora', label: 'ally', tension: 'low', kind: 'ally' }],
    });
    const file = await readCharacters(root);
    assert.equal(file.characters[0].id, 'kael');
    const md = await readDocument(root, 'relations');
    assert.match(md, /id: kael/);
    assert.doesNotMatch(md, /id: liora/);
  });
});
