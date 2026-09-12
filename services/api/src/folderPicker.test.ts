import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathFromPickerOutput } from './folderPicker.ts';

describe('folder picker output', () => {
  it('returns a trimmed path on success and null on cancel', () => {
    assert.equal(pathFromPickerOutput(0, 'D:\\桃园密码\n'), 'D:\\桃园密码');
    assert.equal(pathFromPickerOutput(1, 'D:\\桃园密码'), null);
    assert.equal(pathFromPickerOutput(0, '   '), null);
  });

  it('opens files with a standalone dialog that can take focus', () => {
    const script = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../scripts/pick-folder.ps1'),
      'utf8',
    );
    assert.match(script, /IFileDialog/);
    assert.match(script, /PickFile/);
    assert.match(script, /ShowHelp\s*=\s*true/);
    assert.equal(script.includes('-32000'), false);
  });

  it('keeps the file-picker PowerShell window attached so the dialog can stay open', () => {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), './folderPicker.ts'), 'utf8');
    assert.equal(src.includes("detached: mode === 'File'"), false);
    assert.match(src, /windowsHide:\s*mode === 'Folder'/);
    assert.match(src, /WindowStyle', 'Normal'/);
  });
});
