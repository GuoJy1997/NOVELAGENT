/// <reference types="node" />

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const pngSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

describe('legacy asset registry', () => {
  it('isolates both inactive book-origin PNG URLs while keeping their files valid', () => {
    const registryPath = resolve(
      process.cwd(),
      'src/features/novelora-cockpit/legacyAssetRegistry.ts',
    );

    expect(existsSync(registryPath)).toBe(true);
    if (!existsSync(registryPath)) return;

    const registrySource = readFileSync(registryPath, 'utf8');
    const expectedAssets = [
      ['bookOriginBackground', '../../assets/novelora/book-origin/book_background.png'],
      ['writingCompanion', '../../assets/novelora/book-origin/writing_companion.png'],
    ] as const;

    for (const [exportName, sourcePath] of expectedAssets) {
      expect(registrySource).toContain(`export const ${exportName} = new URL(`);
      expect(registrySource).toContain(`'${sourcePath}'`);
      expect(registrySource).toContain('import.meta.url');

      const assetPath = resolve(
        process.cwd(),
        sourcePath.replace('../../assets/', 'src/assets/'),
      );
      const contents = new Uint8Array(readFileSync(assetPath));
      expect(contents.byteLength).toBeGreaterThan(0);
      expect(contents.subarray(0, pngSignature.length)).toEqual(pngSignature);
    }
  });
});
