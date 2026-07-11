import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import type { NoveloraProject } from '../types';
import { WorkspaceTopbar } from './WorkspaceTopbar';

describe('WorkspaceTopbar', () => {
  it('renders the project word progress passed to it', () => {
    const project = {
      ...noveloraMockProject,
      currentWords: 49_321,
      wordGoal: 90_000,
    } as NoveloraProject;

    render(<WorkspaceTopbar project={project} />);

    expect(screen.getByText('49,321 / 90,000 words')).toBeTruthy();
  });
});
