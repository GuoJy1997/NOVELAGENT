import { isAbsolute, relative, resolve } from 'node:path';
import { resolveInside } from './workspaceStore.ts';

export function toProjectRelative(root: string, input: string): string {
  const resolved = isAbsolute(input) ? resolve(input) : resolveInside(root, input);
  const rest = relative(resolve(root), resolved);
  if (rest === '' || rest.startsWith('..') || isAbsolute(rest)) {
    throw new Error(`Path escapes project root: ${input}`);
  }
  return rest.replace(/\\/g, '/');
}
