import { describe, expect, it } from 'vitest';
import { characterPortraits } from '../assetRegistry';
import { bixinHomeData } from './bixinHome';

describe('bixinHomeData', () => {
  it('keeps the approved dashboard count and valid portrait keys', () => {
    expect(bixinHomeData.chapterStages).toHaveLength(5);
    expect(bixinHomeData.project.metrics).toHaveLength(4);
    expect(bixinHomeData.characters.nodes).toHaveLength(5);
    expect(bixinHomeData.schedule).toHaveLength(3);

    const portraitKeys = new Set(Object.keys(characterPortraits));
    const characters = [bixinHomeData.characters.center, ...bixinHomeData.characters.nodes];
    expect(characters.every((character) => portraitKeys.has(character.portraitAssetKey))).toBe(true);
  });
});
