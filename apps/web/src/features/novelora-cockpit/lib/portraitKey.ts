import { characterPortraits } from '../assetRegistry';
import type { CharacterNode } from '../types';

export const FALLBACK_PORTRAIT: CharacterNode['portraitAssetKey'] = 'kael';

export function portraitKey(id: string): CharacterNode['portraitAssetKey'] {
  return id in characterPortraits ? (id as CharacterNode['portraitAssetKey']) : FALLBACK_PORTRAIT;
}
