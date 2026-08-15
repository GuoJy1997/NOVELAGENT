import { renameSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiSpawn } from './apiProcess.ts';

it('points the api child at 127.0.0.1 and services/api', () => {
  const spec = resolveApiSpawn();
  assert.match(spec.cwd, /services[\\/]api$/);
  assert.equal(spec.env.NOVELORA_API_HOST, '127.0.0.1');
});

it('runs the api child as Node when Electron provides execPath', () => {
  const versions = process.versions as NodeJS.ProcessVersions & { electron?: string };
  const previous = Object.getOwnPropertyDescriptor(process.versions, 'electron');
  Object.defineProperty(process.versions, 'electron', {
    value: '33.2.0',
    configurable: true,
    enumerable: true,
    writable: true,
  });
  try {
    const spec = resolveApiSpawn();
    assert.equal(spec.env.ELECTRON_RUN_AS_NODE, '1');
    assert.equal(spec.command, process.execPath);
  } finally {
    if (previous) {
      Object.defineProperty(process.versions, 'electron', previous);
    } else {
      delete versions.electron;
    }
  }
});

it('falls back to npx.cmd on win32 when local tsx is missing', () => {
  const cwd = resolveApiSpawn().cwd;
  const tsxCli = join(cwd, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const hidden = `${tsxCli}.hidden-for-test`;
  renameSync(tsxCli, hidden);
  try {
    const spec = resolveApiSpawn();
    const expected = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    assert.equal(spec.command, expected);
    assert.deepEqual(spec.args, ['tsx', 'src/index.ts']);
  } finally {
    renameSync(hidden, tsxCli);
  }
});
