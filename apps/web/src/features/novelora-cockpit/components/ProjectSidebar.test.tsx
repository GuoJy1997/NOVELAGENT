import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { noveloraMockProject } from '../data/noveloraMockProject';
import { ProjectSidebar } from './ProjectSidebar';

const navigationLabels = [
  'Home',
  'Structure',
  'Characters',
  'Worldbuilding',
  'Inspiration',
  'AI Review',
  'Projects',
];

describe('ProjectSidebar', () => {
  it('renders the Echo brand, exact navigation order, utilities, and progress', () => {
    render(<ProjectSidebar project={noveloraMockProject} />);

    expect(screen.getByRole('img', { name: 'Echo' })).toBeVisible();
    expect(screen.getByText('echo')).toBeVisible();
    expect(screen.getByText('AI Writing Studio')).toBeVisible();
    expect(screen.getByRole('button', { name: 'New Project' })).toBeVisible();

    const navigation = screen.getByRole('navigation', { name: 'Workspace navigation' });
    expect(within(navigation).getAllByRole('button').map((button) => button.textContent)).toEqual(
      navigationLabels,
    );
    expect(within(navigation).getByRole('button', { name: 'Home' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Settings' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Theme' })).toBeVisible();
    expect(screen.getByText("Today's Progress")).toBeVisible();
    expect(screen.getByText('72%')).toBeVisible();
    expect(screen.queryByText('Current project')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Writing streak')).not.toBeInTheDocument();
  });

  it('reports controlled navigation and new-project actions', async () => {
    const user = userEvent.setup();
    const onSelectItem = vi.fn();
    const onNewProject = vi.fn();

    render(
      <ProjectSidebar
        activeItem="Characters"
        onSelectItem={onSelectItem}
        onNewProject={onNewProject}
      />,
    );

    expect(screen.getByRole('button', { name: 'Characters' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'Home' }));
    await user.click(screen.getByRole('button', { name: 'New Project' }));

    expect(onSelectItem).toHaveBeenCalledWith('Home');
    expect(onNewProject).toHaveBeenCalledOnce();
  });
});
