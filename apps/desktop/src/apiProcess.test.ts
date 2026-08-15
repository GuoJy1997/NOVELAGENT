import { it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiSpawn } from './apiProcess.ts';

it('points the api child at 127.0.0.1 and services/api', () => {
  const spec = resolveApiSpawn();
  assert.match(spec.cwd, /services[\\/]api$/);
  assert.equal(spec.env.NOVELORA_API_HOST, '127.0.0.1');
});
