import { execFile, spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

export type FolderPicker = (title?: string) => Promise<string | null>;

const execFileAsync = promisify(execFile);
const PICK_SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '../scripts/pick-folder.ps1');

export function pathFromPickerOutput(exitCode: number, contents: string): string | null {
  if (exitCode !== 0) return null;
  const trimmed = contents.replace(/^\uFEFF/, '').trim();
  return trimmed === '' ? null : trimmed;
}

export async function pickNativeFolder(title = '选择文件夹'): Promise<string | null> {
  if (process.env.NODE_TEST_CONTEXT) return null;
  if (process.platform === 'win32') return pickWindowsPath(title, 'Folder');
  if (process.platform === 'darwin') return pickMacFolder(title);
  return pickLinuxFolder(title, true);
}

export async function pickNativeFile(title = '选择文件'): Promise<string | null> {
  if (process.env.NODE_TEST_CONTEXT) return null;
  if (process.platform === 'win32') return pickWindowsPath(title, 'File');
  if (process.platform === 'darwin') return pickMacFile(title);
  return pickLinuxFolder(title, false);
}

async function pickWindowsPath(title: string, mode: 'Folder' | 'File'): Promise<string | null> {
  const dir = await mkdtemp(join(tmpdir(), 'novelora-folder-'));
  const outFile = join(dir, 'path.txt');
  try {
    const result = await new Promise<{ code: number }>((resolve) => {
      const child = spawn(
        'powershell.exe',
        [
          '-NoProfile',
          '-STA',
          ...(mode === 'Folder' ? ['-WindowStyle', 'Hidden'] : ['-WindowStyle', 'Normal']),
          '-File',
          PICK_SCRIPT,
          '-OutFile',
          outFile,
          '-Title',
          title,
          '-Mode',
          mode,
        ],
        {
          windowsHide: mode === 'Folder',
        },
      );
      const timer = setTimeout(() => {
        child.kill();
        resolve({ code: 1 });
      }, 10 * 60 * 1000);
      child.on('error', () => {
        clearTimeout(timer);
        resolve({ code: 1 });
      });
      child.on('exit', (code) => {
        clearTimeout(timer);
        resolve({ code: code ?? 1 });
      });
    });
    let contents = '';
    try {
      contents = await readFile(outFile, 'utf8');
    } catch {
      contents = '';
    }
    return pathFromPickerOutput(result.code, contents);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function pickMacFolder(title: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('osascript', [
      '-e',
      `POSIX path of (choose folder with prompt ${JSON.stringify(title)})`,
    ]);
    return pathFromPickerOutput(0, stdout);
  } catch {
    return null;
  }
}

async function pickMacFile(title: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('osascript', [
      '-e',
      `POSIX path of (choose file with prompt ${JSON.stringify(title)} of type {"public.plain-text", "net.daringfireball.markdown", "txt", "md"})`,
    ]);
    return pathFromPickerOutput(0, stdout);
  } catch {
    return null;
  }
}

async function pickLinuxFolder(title: string, directory: boolean): Promise<string | null> {
  try {
    const args = ['--file-selection', `--title=${title}`];
    if (directory) args.push('--directory');
    else args.push('--file-filter=Markdown / 文本 | *.md *.txt');
    const { stdout } = await execFileAsync('zenity', args);
    return pathFromPickerOutput(0, stdout);
  } catch {
    return null;
  }
}
