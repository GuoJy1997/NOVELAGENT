import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import type { AgentTask } from '../types';
import { AIWritingPartner } from './AIWritingPartner';

const extraTasks: AgentTask[] = [
  { id: 'task-5', title: 'Fifth task', state: 'queued', owner: 'Echo', focus: 'Later', progressPercent: 5 },
  { id: 'task-6', title: 'Sixth task', state: 'blocked', owner: 'Echo', focus: 'Later', progressPercent: 6 },
];

describe('AIWritingPartner', () => {
  it('renders Echo as a solid assistant card with dedicated local artwork', () => {
    render(
      <AIWritingPartner
        project={noveloraMockProject}
        onViewAll={() => undefined}
        viewAllButtonRef={createRef<HTMLButtonElement>()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'AI Writing Partner' })).toBeTruthy();
    expect(screen.getByText("Hello, I'm Echo.")).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    const artwork = screen.getByRole('img', { name: 'Echo' });
    expect(artwork.getAttribute('src')).toMatch(/echo-assistant-card.*\.png$/);
    expect(artwork.getAttribute('src')).not.toMatch(/background/i);
    expect(artwork.getAttribute('width')).toBe('192');
    expect(artwork.getAttribute('height')).toBe('192');
    expect(artwork.getAttribute('decoding')).toBe('async');
    expect(screen.getByRole('region', { name: 'AI Writing Partner' }).getAttribute('tabindex')).toBe('0');
  });

  it('normalizes task progress once for both the progress element and visible percentage', () => {
    const progressValues = [-10, 150, Number.NaN, 42];
    const normalizedValues = [0, 100, 0, 42];
    const project = {
      ...noveloraMockProject,
      agentTasks: noveloraMockProject.agentTasks.slice(0, 4).map((task, index) => ({
        ...task,
        progressPercent: progressValues[index],
      })),
    };
    const viewAllButtonRef = createRef<HTMLButtonElement>();
    const { rerender } = render(
      <AIWritingPartner
        project={project}
        onViewAll={() => undefined}
        viewAllButtonRef={viewAllButtonRef}
      />,
    );

    screen.getAllByRole('listitem').forEach((row, index) => {
      const task = project.agentTasks[index];
      expect(within(row).getByRole('progressbar').getAttribute('value')).toBe(
        String(normalizedValues[index]),
      );
      expect(within(row).getByText(`${normalizedValues[index]}%`)).toBeTruthy();
      expect(within(row).getByRole('progressbar').getAttribute('aria-label')).toBe(
        `${task.title} progress`,
      );
    });

    const infiniteProject = {
      ...project,
      agentTasks: project.agentTasks.map((task, index) => (
        index === 0 ? { ...task, progressPercent: Number.POSITIVE_INFINITY } : task
      )),
    };
    rerender(
      <AIWritingPartner
        project={infiniteProject}
        onViewAll={() => undefined}
        viewAllButtonRef={viewAllButtonRef}
      />,
    );

    const firstRow = screen.getAllByRole('listitem')[0];
    expect(within(firstRow).getByRole('progressbar').getAttribute('value')).toBe('0');
    expect(within(firstRow).getByText('0%')).toBeTruthy();
  });

  it('shows only the first four tasks in order with determinate progress and state', () => {
    const project = {
      ...noveloraMockProject,
      agentTasks: [...noveloraMockProject.agentTasks, ...extraTasks],
    };

    render(
      <AIWritingPartner
        project={project}
        onViewAll={() => undefined}
        viewAllButtonRef={createRef<HTMLButtonElement>()}
      />,
    );

    const visibleTasks = project.agentTasks.slice(0, 4);
    const taskRows = screen.getAllByRole('listitem');
    expect(taskRows).toHaveLength(4);
    expect(taskRows.map((row) => row.querySelector('strong')?.textContent)).toEqual(
      visibleTasks.map((task) => task.title),
    );
    expect(screen.queryByText('Fifth task')).toBeNull();

    for (const task of visibleTasks) {
      const progress = screen.getByRole('progressbar', { name: `${task.title} progress` });
      expect(progress.getAttribute('max')).toBe('100');
      expect(progress.getAttribute('value')).toBe(String(task.progressPercent));
      expect(screen.getByText(`${task.progressPercent}%`)).toBeTruthy();
      expect(screen.getByText(task.state, { exact: false })).toBeTruthy();
    }
  });

  it('attaches the supplied ref and calls the view-all callback', async () => {
    const user = userEvent.setup();
    const viewAllButtonRef = createRef<HTMLButtonElement>();
    const onViewAll = vi.fn();

    render(
      <AIWritingPartner
        project={noveloraMockProject}
        onViewAll={onViewAll}
        viewAllButtonRef={viewAllButtonRef}
      />,
    );

    const button = screen.getByRole('button', { name: 'View All agent details' });
    expect(viewAllButtonRef.current).toBe(button);
    await user.click(button);
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });
});
