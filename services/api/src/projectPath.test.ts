import { mkdtemp, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toProjectRelative } from './projectPath.ts';

describe('toProjectRelative', () => {
  it('keeps relative dirs and converts an absolute child path', async () => {
    const root = await mkdtemp(join(tmpdir(), 'novelora-rel-'));
    await mkdir(join(root, '正文'));
    assert.equal(toProjectRelative(root, '正文'), '正文');
    assert.equal(toProjectRelative(root, join(root, '正文')), '正文');
  });

  it('rejects paths outside the project root', async () => {
    const root = await mkdtemp(join(tmpdir(), 'novelora-rel-root-'));
    const other = await mkdtemp(join(tmpdir(), 'novelora-rel-other-'));
    assert.throws(() => toProjectRelative(root, other), /escapes project root/);
  });
});
