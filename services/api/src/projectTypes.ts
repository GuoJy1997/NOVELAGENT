export type RecipeId = 'chapter' | 'act' | 'volume';

export type DocumentName = 'outline' | 'world' | 'canon' | 'relations';

export interface CharacterRecord {
  id: string;
  name: string;
  role: string;
  goal?: string;
  knows?: string;
  x?: number;
  y?: number;
}

export interface RelationshipRecord {
  id: string;
  fromCharacterId: string;
  toCharacterId: string;
  label: string;
  tension: string;
  kind: string;
}

export interface CharacterFile {
  characters: CharacterRecord[];
  relationships: RelationshipRecord[];
}
