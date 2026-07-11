import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import { CharacterGraph } from './CharacterGraph';

const cockpitCss = readFileSync(resolve(process.cwd(), 'src/styles/cockpit.css'), 'utf8');

describe('CharacterGraph', () => {
  it('renders passive named character nodes and relationship endpoints in the legend', () => {
    render(
      <CharacterGraph
        characters={noveloraMockProject.characters}
        relationships={noveloraMockProject.characterRelationships}
      />,
    );

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByRole('listitem', { name: 'Kael, Exiled tide-runner' })).toBeTruthy();
    expect(screen.getByText('Kael — Liora · uneasy allies')).toBeTruthy();
  });

  it('keeps the SVG edges and node grid in the fixed 620 by 255 stage coordinate system', () => {
    render(
      <CharacterGraph
        characters={noveloraMockProject.characters}
        relationships={noveloraMockProject.characterRelationships}
      />,
    );

    expect(document.querySelector('.character-graph__stage')).toBeTruthy();
    expect(document.querySelector('.character-graph__edges')?.getAttribute('viewBox')).toBe('0 0 620 255');
    expect(cockpitCss).toMatch(/\.character-graph__stage\s*\{[^}]*width:\s*620px;[^}]*height:\s*255px;/s);
  });

  it('stacks the knowledge workspace before its graph can be obscured at 1440 pixels', () => {
    expect(cockpitCss).toMatch(
      /@media\s*\(max-width:\s*1440px\)\s*\{\s*\.knowledge-workspace-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s,
    );
  });
});
