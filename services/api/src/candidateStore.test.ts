import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptCandidate,
  discardCandidate,
  isAllowedTargetPath,
  listPendingCandidates,
  writeCandidate,
} from './candidateStore.ts';

describe('candidateStore', () => {
  let root: string;
  before(async () => {
    root = await mkdtemp(join(tmpdir(), 'novelora-cand-'));
    await mkdir(join(root, 'chapters'), { recursive: true });
    await writeFile(join(root, 'chapters/ch_03.md'), '# original\n');
    await writeFile(join(root, 'world.md'), '# World\nkeep\n');
  });
  after(() => rm(root, { recursive: true, force: true }));

  it('rejects unsafe target paths', () => {
    assert.equal(isAllowedTargetPath('chapters/ch_03.md'), true);
    assert.equal(isAllowedTargetPath('../secret'), false);
    assert.equal(isAllowedTargetPath('characters.json'), false);
    assert.equal(isAllowedTargetPath('relations.md'), false);
  });

  it('accepts a chapter candidate without touching world.md', async () => {
    const candidate = await writeCandidate(root, {
      runId: 'run-1',
      targetPath: 'chapters/ch_03.md',
      source: 'dialog',
      content: '# candidate chapter\n',
    });
    assert.equal(candidate.status, 'pending');
    assert.equal((await listPendingCandidates(root)).length, 1);
    await acceptCandidate(root, candidate.id);
    assert.equal(await readFile(join(root, 'chapters/ch_03.md'), 'utf8'), '# candidate chapter\n');
    assert.equal(await readFile(join(root, 'world.md'), 'utf8'), '# World\nkeep\n');
    assert.equal((await listPendingCandidates(root)).length, 0);
  });

  it('discard deletes only the candidate', async () => {
    const candidate = await writeCandidate(root, {
      runId: 'run-2',
      targetPath: 'chapters/ch_03.md',
      source: 'dialog',
      content: '# throw away\n',
    });
    await discardCandidate(root, candidate.id);
    assert.equal(await readFile(join(root, 'chapters/ch_03.md'), 'utf8'), '# candidate chapter\n');
    assert.equal((await listPendingCandidates(root)).some((item) => item.id === candidate.id), false);
  });

  it('throws for unknown discard', async () => {
    await assert.rejects(
      () => discardCandidate(root, '22222222-2222-2222-2222-222222222222'),
      /unknown candidate/i,
    );
  });

  it('rejects a non-UUID candidate id instead of joining it into a path', async () => {
    await assert.rejects(
      () => discardCandidate(root, '../../secret'),
      /invalid candidate id/i,
    );
  });

  it('re-checks the allowed target path before accepting, even if meta was tampered with', async () => {
    const candidate = await writeCandidate(root, {
      runId: 'run-3',
      targetPath: 'chapters/ch_03.md',
      source: 'dialog',
      content: '# tampered\n',
    });
    const dir = join(root, 'drafts', 'candidates', candidate.id);
    const metaPath = join(dir, 'meta.json');
    const meta = JSON.parse(await readFile(metaPath, 'utf8')) as Record<string, unknown>;
    meta.targetPath = 'characters.json';
    await writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf8');
    await assert.rejects(
      () => acceptCandidate(root, candidate.id),
      /disallowed target path/i,
    );
  });

  it('allows state ledgers and gene assets as target paths', () => {
    assert.equal(isAllowedTargetPath('state/facts.md'), true);
    assert.equal(isAllowedTargetPath('state/foreshadow.md'), true);
    assert.equal(isAllowedTargetPath('state/timeline.md'), true);
    assert.equal(isAllowedTargetPath('genes/source-book.md'), true);
    assert.equal(isAllowedTargetPath('state/other.md'), false);
    assert.equal(isAllowedTargetPath('genes/../world.md'), false);
    assert.equal(isAllowedTargetPath('genes/UPPER.md'), false);
  });

  it('accepting a candidate creates missing parent directories', async () => {
    const candidate = await writeCandidate(root, {
      runId: crypto.randomUUID(),
      targetPath: 'state/facts.md',
      source: 'workflow',
      content: '事实：主角已获得钥匙',
    });
    await acceptCandidate(root, candidate.id);
    assert.match(await readFile(join(root, 'state', 'facts.md'), 'utf8'), /钥匙/);
  });
});
