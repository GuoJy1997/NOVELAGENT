import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import type { CharacterNode, CharacterRelationship } from '../types';
import { CharacterGraph } from './CharacterGraph';

const finitePathPattern = /^M\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+C\s+-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?$/;
const echoCss = readFileSync(resolve(process.cwd(), 'src/styles/echo.css'), 'utf8');

describe('CharacterGraph', () => {
  it('renders a named graph and one curved path for every known relationship', () => {
    const { container } = render(
      <CharacterGraph
        characters={noveloraMockProject.characters}
        relationships={noveloraMockProject.characterRelationships}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Character Relationship Graph' })).toBeTruthy();
    const graph = screen.getByRole('region', { name: 'Character relationship graph' });
    const paths = graph.querySelectorAll('path[data-relationship-id]');
    expect(paths).toHaveLength(noveloraMockProject.characterRelationships.length);
    expect(container.querySelectorAll('line')).toHaveLength(0);

    for (const relationship of noveloraMockProject.characterRelationships) {
      const path = graph.querySelector(`path[data-relationship-id="${relationship.id}"]`);
      expect(path).toHaveAttribute('data-relationship-kind', relationship.kind);
      expect(path?.getAttribute('d')).toMatch(finitePathPattern);
      expect(path?.getAttribute('d')).toContain('C');
    }
  });

  it('omits relationships with unknown endpoints', () => {
    const unknownRelationship: CharacterRelationship = {
      ...noveloraMockProject.characterRelationships[0],
      id: 'missing-kael',
      toCharacterId: 'missing',
    };
    const { container } = render(
      <CharacterGraph
        characters={noveloraMockProject.characters.slice(0, 2)}
        relationships={[noveloraMockProject.characterRelationships[0], unknownRelationship]}
      />,
    );

    expect(container.querySelector('[data-relationship-id="kael-liora"]')).toBeTruthy();
    expect(container.querySelector('[data-relationship-id="missing-kael"]')).toBeNull();
  });

  it('derives finite coordinates for arbitrary character order and count', () => {
    const reorderedCharacters = [
      noveloraMockProject.characters[4],
      noveloraMockProject.characters[0],
      noveloraMockProject.characters[3],
    ];
    const relationship: CharacterRelationship = {
      ...noveloraMockProject.characterRelationships[0],
      id: 'vex-selene-custom',
      fromCharacterId: 'vex',
      toCharacterId: 'selene',
    };
    const { container, rerender } = render(
      <CharacterGraph characters={reorderedCharacters} relationships={[relationship]} />,
    );

    expect(
      container.querySelector('[data-relationship-id="vex-selene-custom"]')?.getAttribute('d'),
    ).toMatch(finitePathPattern);
    for (const node of container.querySelectorAll<HTMLElement>('.character-graph__node')) {
      expect(node.getAttribute('style')).not.toMatch(/NaN|Infinity/);
    }

    rerender(<CharacterGraph characters={[]} relationships={[relationship]} />);
    expect(container.querySelectorAll('path')).toHaveLength(0);
    expect(screen.getByRole('list', { name: 'Character nodes' }).children).toHaveLength(0);

    rerender(
      <CharacterGraph characters={[noveloraMockProject.characters[0]]} relationships={[]} />,
    );
    expect(container.querySelector('.character-graph__node')?.getAttribute('style')).not.toMatch(
      /NaN|Infinity/,
    );
  });

  it('keeps one accessible named list item per character', () => {
    render(
      <CharacterGraph
        characters={noveloraMockProject.characters}
        relationships={noveloraMockProject.characterRelationships}
      />,
    );

    const nodes = screen.getByRole('list', { name: 'Character nodes' });
    expect(within(nodes).getAllByRole('listitem')).toHaveLength(
      noveloraMockProject.characters.length,
    );
    expect(within(nodes).getByRole('listitem', { name: 'Kael, Exiled tide-runner' })).toBeTruthy();
  });

  it('keeps the node stage in the same 320-unit coordinate system as its SVG', () => {
    const { container } = render(
      <CharacterGraph characters={noveloraMockProject.characters} relationships={[]} />,
    );
    const stageRule = echoCss.match(
      /\.cockpit-scroll \.character-graph__stage\s*\{([^}]*)\}/,
    )?.[1];

    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 320 180');
    expect(stageRule).toMatch(/width:\s*320px;/);
    expect(stageRule).toMatch(/height:\s*var\(--character-graph-height\);/);
    expect(stageRule).not.toMatch(/max-width:/);
  });

  it('exposes the four relationship kinds as a compact legend with edge colors', () => {
    render(
      <CharacterGraph
        characters={noveloraMockProject.characters}
        relationships={noveloraMockProject.characterRelationships}
      />,
    );

    const legend = screen.getByRole('list', { name: 'Relationship kinds' });
    const items = within(legend).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['Ally', 'Neutral', 'Rival', 'Unknown']);

    const edges = screen
      .getByRole('region', { name: 'Character relationship graph' })
      .querySelectorAll('path[data-relationship-kind]');
    expect(Array.from(edges, (edge) => edge.getAttribute('data-relationship-kind'))).toEqual(
      noveloraMockProject.characterRelationships.map((relationship) => relationship.kind),
    );

    const legendRule = echoCss.match(
      /\.cockpit-scroll \.character-graph__legend\s*\{([^}]*)\}/,
    )?.[1];
    expect(legendRule).toMatch(/list-style:\s*none;/);
  });

  it('centers the first character as the protagonist', () => {
    const { container } = render(
      <CharacterGraph
        characters={noveloraMockProject.characters}
        relationships={noveloraMockProject.characterRelationships}
      />,
    );

    const kaelNode = container.querySelector<HTMLElement>('.character-graph__node.is-protagonist');
    expect(kaelNode).not.toBeNull();
    expect(kaelNode?.textContent).toContain('Kael');
    expect(kaelNode?.style.getPropertyValue('--character-x')).toBe('160px');
    expect(kaelNode?.style.getPropertyValue('--character-y')).toBe('90px');
  });

  it('lays out eight characters without overlapping node bounds', () => {
    const characters: CharacterNode[] = Array.from({ length: 8 }, (_, index) => ({
      ...noveloraMockProject.characters[index % noveloraMockProject.characters.length],
      id: `character-${index}`,
      name: `Character ${index}`,
    }));
    const { container } = render(<CharacterGraph characters={characters} relationships={[]} />);
    const nodes = [...container.querySelectorAll<HTMLElement>('.character-graph__node')];
    const centers = nodes.map((node) => {
      const style = node.getAttribute('style') ?? '';
      return {
        x: Number(style.match(/--character-x:\s*([\d.]+)px/)?.[1]),
        y: Number(style.match(/--character-y:\s*([\d.]+)px/)?.[1]),
      };
    });

    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 320 180');
    expect(container.querySelector('.character-graph__stage')).toHaveStyle({
      '--character-graph-height': '180px',
      height: '180px',
    });
    for (let first = 0; first < centers.length; first += 1) {
      for (let second = first + 1; second < centers.length; second += 1) {
        expect(
          Math.abs(centers[first].x - centers[second].x) >= 82 ||
            Math.abs(centers[first].y - centers[second].y) >= 35,
        ).toBe(true);
      }
    }
  });

  it('draws a finite non-degenerate loop for a self relationship', () => {
    const selfRelationship: CharacterRelationship = {
      ...noveloraMockProject.characterRelationships[0],
      id: 'kael-self',
      toCharacterId: 'kael',
    };
    const { container } = render(
      <CharacterGraph
        characters={[noveloraMockProject.characters[0]]}
        relationships={[selfRelationship]}
      />,
    );
    const path = container.querySelector('[data-relationship-id="kael-self"]');
    const numbers = path?.getAttribute('d')?.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];

    expect(path?.getAttribute('d')).toMatch(finitePathPattern);
    expect(numbers.slice(0, 2)).toEqual(numbers.slice(-2));
    expect(numbers.slice(2, 4)).not.toEqual(numbers.slice(0, 2));
    expect(numbers.slice(4, 6)).not.toEqual(numbers.slice(2, 4));
  });

  it('keeps the first character and relationship for duplicate business IDs', () => {
    const character = noveloraMockProject.characters[0];
    const relationship = noveloraMockProject.characterRelationships[0];
    const { container } = render(
      <CharacterGraph
        characters={[
          character,
          { ...character, name: 'Duplicate Kael' },
          noveloraMockProject.characters[1],
        ]}
        relationships={[
          relationship,
          { ...relationship, kind: 'rival', label: 'duplicate relationship' },
        ]}
      />,
    );

    expect(screen.getAllByRole('listitem', { name: 'Kael, Exiled tide-runner' })).toHaveLength(1);
    expect(screen.queryByText('Duplicate Kael')).toBeNull();
    expect(container.querySelectorAll('[data-relationship-id="kael-liora"]')).toHaveLength(1);
    expect(container.querySelector('[data-relationship-id="kael-liora"]')).toHaveAttribute(
      'data-relationship-kind',
      'ally',
    );
    expect(screen.queryByText('duplicate relationship')).toBeNull();
  });
});
