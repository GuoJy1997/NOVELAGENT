import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

process.env.NOVELORA_DATA_DIR = await mkdtemp(join(tmpdir(), 'novelora-ws-'));
const {
  coverSvg, generateProjectCover, listEntries, listWorkspaces, registerWorkspace,
  resolveProjectRoot, scanChapters, setProjectCover,
} = await import('./workspaceStore.ts');

describe('workspaceStore', () => {
  let root: string;
  let fake: string;
  before(async () => {
    root = process.env.NOVELORA_DATA_DIR!;
    fake = await mkdtemp(join(tmpdir(), 'novelora-book-'));
    await mkdir(join(fake, '正文'), { recursive: true });
    await mkdir(join(fake, '状态卡'), { recursive: true });
    await mkdir(join(fake, '.git'), { recursive: true });
    await mkdir(join(fake, 'node_modules'), { recursive: true });
    await mkdir(join(fake, '.hidden'), { recursive: true });
    await writeFile(join(fake, '正文/001-第1章-忘路之远近.md'), '# 忘路之远近\n\n晋太元中\n');
    await writeFile(join(fake, '正文/002-第2章-豁然开朗.md'), '# 豁然开朗\n\n豁然开朗\n');
    await writeFile(join(fake, '正文/014-间隙章上-同梦.md'), '# 同梦\n\n同梦\n');
    await writeFile(join(fake, '正文/plain-notes.md'), 'notes\n');
    await writeFile(join(fake, '世界观设定.md'), '# 世界观\n');
    await writeFile(join(fake, '人物小传.txt'), 'chars\n');
    await writeFile(join(fake, 'cover-art.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    await writeFile(join(fake, '状态卡/map.svg'), '<svg/>\n');
    await writeFile(join(fake, '.git/ignored.md'), 'nope\n');
    await writeFile(join(fake, 'node_modules/ignored.md'), 'nope\n');
  });
  after(async () => {
    await rm(root, { recursive: true, force: true });
    await rm(fake, { recursive: true, force: true });
  });

  it('lists no workspaces before any registration', async () => {
    assert.deepEqual(await listWorkspaces(), []);
  });

  it('registers a directory and initializes project.json without other files', async () => {
    const { record, project } = await registerWorkspace(fake);
    assert.match(record.id, /^novelora-book-.*-[0-9a-f]{6}$/);
    assert.equal(record.title, basename(fake));
    assert.equal(record.rootPath, fake);
    assert.equal(project.chapters.length, 0);

    const written = JSON.parse(await readFile(join(fake, 'project.json'), 'utf8'));
    assert.equal(written.id, record.id);
    assert.deepEqual(written.chapters, []);
    await assert.rejects(readFile(join(fake, 'outline.md'), 'utf8'), { code: 'ENOENT' });

    const listed = await listWorkspaces();
    assert.equal(listed.length, 1);
    assert.equal(listed[0].id, record.id);
  });

  it('returns the existing record when registering the same path again', async () => {
    const first = (await listWorkspaces())[0];
    const again = await registerWorkspace(fake);
    assert.equal(again.record.id, first.id);
    assert.equal((await listWorkspaces()).length, 1);
  });

  it('rejects registering a missing directory', async () => {
    await assert.rejects(registerWorkspace(join(fake, 'nope')), /Not a directory/);
  });

  it('resolves registered ids to their root and falls back to DATA_ROOT', async () => {
    const id = (await listWorkspaces())[0].id;
    assert.equal(await resolveProjectRoot(id), fake);
    assert.equal(await resolveProjectRoot('default-project'), join(root, 'default-project'));
  });

  it('scans Chinese chapter file names and writes chapters plus chaptersDir back', async () => {
    const meta = await scanChapters(fake, '正文');
    assert.equal(meta.chapters.length, 4);
    assert.deepEqual(
      meta.chapters.map((c) => [c.num, c.title, c.file]),
      [
        [1, '忘路之远近', '正文/001-第1章-忘路之远近.md'],
        [2, '豁然开朗', '正文/002-第2章-豁然开朗.md'],
        [14, '间隙章上-同梦', '正文/014-间隙章上-同梦.md'],
        [4, 'plain-notes', '正文/plain-notes.md'],
      ],
    );
    assert.equal(meta.chapters[0].status, 'draft');
    assert.ok(meta.chapters[0].words > 0);

    const written = JSON.parse(await readFile(join(fake, 'project.json'), 'utf8'));
    assert.equal(written.chaptersDir, '正文');
    assert.equal(written.title, basename(fake));
    assert.equal(written.chapters.length, 4);
  });

  it('rejects a chapters dir that escapes the root or does not exist', async () => {
    await assert.rejects(scanChapters(fake, '..'), /escapes project root/);
    await assert.rejects(scanChapters(fake, '正文/..'), /escapes project root/);
    await assert.rejects(scanChapters(fake, 'no-such-dir'), /Not a directory/);
  });

  it('lists dirs, markdown/text files, and images with exclusions', async () => {
    const entries = await listEntries(fake);
    assert.deepEqual(entries.dirs, ['正文', '状态卡']);
    assert.ok(entries.files.includes('世界观设定.md'));
    assert.ok(entries.files.includes('人物小传.txt'));
    assert.ok(entries.files.includes('正文/001-第1章-忘路之远近.md'));
    assert.ok(!entries.files.some((f) => f.includes('.git') || f.includes('node_modules')));
    assert.deepEqual(entries.images.sort(), ['cover-art.png', '状态卡/map.svg']);
  });

  it('sets a cover from an existing image and rejects invalid targets', async () => {
    const meta = await setProjectCover(fake, 'cover-art.png');
    assert.equal(meta.cover, 'cover-art.png');
    await assert.rejects(setProjectCover(fake, '../outside.png'), /escapes project root/);
    await assert.rejects(setProjectCover(fake, '世界观设定.md'), /Not an image file/);
    await assert.rejects(setProjectCover(fake, 'missing.png'), /No such file/);
  });

  it('generates a deterministic svg cover and records it in project.json', async () => {
    const meta = await generateProjectCover(fake);
    assert.equal(meta.cover, 'cover.svg');
    const svg = await readFile(join(fake, 'cover.svg'), 'utf8');
    assert.equal(svg, coverSvg(meta.title));
    assert.match(svg, /<svg/);
    assert.match(svg, new RegExp(meta.title));
    const again = await generateProjectCover(fake);
    assert.equal(await readFile(join(fake, 'cover.svg'), 'utf8'), svg);
    assert.equal(again.cover, 'cover.svg');
  });
});
