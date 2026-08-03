import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { noveloraMockProject } from '../data/noveloraMockProject';
import type { NoveloraProject } from '../types';
import { WorkspaceTopbar } from './WorkspaceTopbar';

const project = {
  ...noveloraMockProject,
  title: 'Eclipse of Echoes',
  wordGoal: 120_000,
} as NoveloraProject;

describe('WorkspaceTopbar', () => {
  it('renders project status, target, search, notifications, and a local user portrait', () => {
    render(<WorkspaceTopbar project={project} />);

    expect(screen.getByText('In Progress')).toBeVisible();
    expect(screen.getByText('120,000 words')).toBeVisible();
    expect(screen.getByRole('searchbox', { name: 'Search workspace' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'View notifications' })).toBeVisible();

    const userMenu = screen.getByRole('button', { name: 'Open user menu for Ari Chen' });
    expect(within(userMenu).getByRole('img', { name: 'Ari Chen' })).toBeVisible();
    expect(userMenu).not.toHaveAttribute('aria-haspopup');
    expect(userMenu).not.toHaveAttribute('aria-expanded');
  });

  it('focuses the menuitem on click and restores trigger focus when Escape closes it', async () => {
    const user = userEvent.setup();
    render(<WorkspaceTopbar project={project} />);

    const trigger = screen.getByRole('button', { name: /Eclipse of Echoes/ });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu', { name: 'Project switcher' })).toBeVisible();
    const menuItem = screen.getByRole('menuitem', { name: /Eclipse of Echoes/ });
    expect(menuItem).toHaveFocus();

    for (const key of ['{ArrowDown}', '{ArrowUp}', '{Home}', '{End}']) {
      await user.keyboard(key);
      expect(menuItem).toHaveFocus();
    }

    await user.keyboard('{Escape}');

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu', { name: 'Project switcher' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('opens with ArrowDown and closes from the selected menuitem', async () => {
    const user = userEvent.setup();
    render(<WorkspaceTopbar project={project} />);

    const trigger = screen.getByRole('button', { name: /Eclipse of Echoes/ });
    trigger.focus();
    await user.keyboard('{ArrowDown}');

    const menuItem = screen.getByRole('menuitem', { name: /Eclipse of Echoes/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(menuItem).toHaveFocus();

    await user.click(menuItem);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu', { name: 'Project switcher' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
