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

  it('reads and writes chapters with a real file path', async () => {
    const cn = join(root, 'cn-book');
    await mkdir(join(cn, '正文'), { recursive: true });
    await writeFile(join(cn, 'project.json'), JSON.stringify({
      id: 'cn-book', title: '桃园密码', currentChapter: 1,
      chapters: [{ num: 1, title: '忘路之远近', status: 'draft', file: '正文/001-第1章-忘路之远近.md' }],
    }));
    await writeFile(join(cn, '正文/001-第1章-忘路之远近.md'), '# 忘路之远近\n\n晋太元中\n');

    const meta = await readProject(cn);
    assert.equal(meta.chapters[0].file, '正文/001-第1章-忘路之远近.md');
    assert.equal(meta.chapters[0].words, 9);

    const chapter = await readChapter(cn, 1);
    assert.equal(chapter.title, '忘路之远近');
    assert.match(chapter.content, /晋太元中/);

    const { words } = await writeChapter(cn, 1, '# 忘路之远近\n\n重写 四个汉字\n');
    assert.equal(words, 11);
    assert.match(await readFile(join(cn, '正文/001-第1章-忘路之远近.md'), 'utf8'), /重写/);
    await assert.rejects(readFile(join(cn, 'chapters/ch_01.md'), 'utf8'), { code: 'ENOENT' });
  });

  it('writes a file-field chapter whose parent directory does not exist yet', async () => {
    const nested = join(root, 'nested-book');
    await mkdir(nested, { recursive: true });
    await writeFile(join(nested, 'project.json'), JSON.stringify({
      id: 'nested-book', title: 'Nested', currentChapter: 1,
      chapters: [{ num: 1, title: 'One', status: 'draft', file: 'deep/dir/one.md' }],
    }));
    await writeChapter(nested, 1, 'hello world\n');
    assert.equal(await readFile(join(nested, 'deep/dir/one.md'), 'utf8'), 'hello world\n');
  });

  it('rejects chapter file paths that escape the project root', async () => {
    const evil = join(root, 'evil-book');
    await mkdir(evil, { recursive: true });
    await writeFile(join(evil, 'project.json'), JSON.stringify({
      id: 'evil-book', title: 'Evil', currentChapter: 1,
      chapters: [{ num: 1, title: 'One', status: 'draft', file: '../escape.md' }],
    }));
    await assert.rejects(readChapter(evil, 1), /escapes project root/);
    await assert.rejects(writeChapter(evil, 1, 'x'), /escapes project root/);
    const meta = await readProject(evil);
    assert.equal(meta.chapters[0].words, 0);
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
