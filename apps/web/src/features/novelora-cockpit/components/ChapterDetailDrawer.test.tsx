import { useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import { ChapterDetailDrawer } from './ChapterDetailDrawer';

function DrawerHarness() {
  const [isOpen, setIsOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const selectedChapter = noveloraMockProject.chapters.find((chapter) => chapter.id === 'chapter-3')!;

  return (
    <>
      <button ref={openerRef} type="button" onClick={() => setIsOpen(true)}>
        Open chapter details
      </button>
      <ChapterDetailDrawer
        project={noveloraMockProject}
        selectedChapter={selectedChapter}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        invokerRef={openerRef}
      />
    </>
  );
}

describe('ChapterDetailDrawer', () => {
  it('opens selected chapter details and restores focus to its invoker when closed', async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);

    const opener = screen.getByRole('button', { name: 'Open chapter details' });
    await user.click(opener);

    expect(screen.getByRole('dialog', { name: /Chapter details/i })).toBeTruthy();
    expect(screen.getByText('Salt Map, Ember Mark')).toBeTruthy();
    expect(screen.getByText(/Act II/i)).toBeTruthy();
    expect(screen.getByText(/Turning point/i)).toBeTruthy();
    expect(screen.getByText(/4,400 words/i)).toBeTruthy();
    expect(screen.getByText('Kael')).toBeTruthy();
    expect(screen.getByText('The old tide map')).toBeTruthy();

    const closeButton = screen.getByRole('button', { name: 'Close chapter details' });
    expect(document.activeElement).toBe(closeButton);
    await user.click(closeButton);

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);

    await user.click(screen.getByRole('button', { name: 'Open chapter details' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
