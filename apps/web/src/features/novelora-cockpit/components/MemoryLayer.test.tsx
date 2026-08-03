import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import { MemoryLayer } from './MemoryLayer';

const memoryLabels = [
  'Core Memory',
  'World Lore',
  'Timeline',
  'Locations',
  'Characters',
  'Clues',
];

describe('MemoryLayer', () => {
  it('renders memory tags in the required order and maintains one local selection', async () => {
    const user = userEvent.setup();
    render(<MemoryLayer sources={noveloraMockProject.memorySources} onManage={() => undefined} />);

    expect(screen.getByRole('heading', { name: 'Memory Layer' })).toBeTruthy();
    const tagGroup = screen.getByLabelText('Memory categories');
    const tags = within(tagGroup).getAllByRole('button');
    expect(tags.map((tag) => tag.textContent)).toEqual(memoryLabels);
    expect(tags.map((tag) => tag.getAttribute('aria-pressed'))).toEqual([
      'true', 'false', 'false', 'false', 'false', 'false',
    ]);

    await user.click(tags[3]);

    expect(tags.map((tag) => tag.getAttribute('aria-pressed'))).toEqual([
      'false', 'false', 'false', 'true', 'false', 'false',
    ]);
    expect(screen.getByText('Selected: Locations')).toBeTruthy();
  });

  it('uses the sources for a safe visible summary and calls manage', async () => {
    const user = userEvent.setup();
    const onManage = vi.fn();
    const { rerender } = render(
      <MemoryLayer sources={noveloraMockProject.memorySources} onManage={onManage} />,
    );

    expect(screen.getByText(`${noveloraMockProject.memorySources.length} sources available`)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Manage memory' }));
    expect(onManage).toHaveBeenCalledTimes(1);

    rerender(<MemoryLayer sources={[]} onManage={onManage} />);
    expect(screen.getByText('No memory sources available')).toBeTruthy();
  });
});
