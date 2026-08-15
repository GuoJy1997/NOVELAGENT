import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type ApiSpawnSpec = {
  command: string;
  args: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
};

function findApiCwd(startDir: string): string {
  let dir = startDir;
  for (;;) {
    const candidate = join(dir, 'services', 'api');
    if (existsSync(join(candidate, 'package.json'))) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error('Could not locate services/api from desktop process');
    }
    dir = parent;
  }
}

export function resolveApiSpawn(): ApiSpawnSpec {
  const here = dirname(fileURLToPath(import.meta.url));
  const cwd = findApiCwd(here);
  const tsxCli = join(cwd, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NOVELORA_API_HOST: '127.0.0.1',
  };
  if (process.versions.electron) {
    env.ELECTRON_RUN_AS_NODE = '1';
  }

  if (existsSync(tsxCli)) {
    return {
      command: process.execPath,
      args: [tsxCli, 'src/index.ts'],
      cwd,
      env,
    };
  }

  return {
    command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
    args: ['tsx', 'src/index.ts'],
    cwd,
    env,
  };
}
