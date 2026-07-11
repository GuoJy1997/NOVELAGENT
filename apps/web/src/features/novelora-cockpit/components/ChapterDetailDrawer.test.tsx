import { createRef, type ReactNode, useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import { ChapterDetailDrawer } from './ChapterDetailDrawer';

function DrawerHarness({ footer }: { footer?: ReactNode }) {
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
        footer={footer}
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
    expect(screen.getByText('Presentation beat')).toBeTruthy();
    expect(screen.getByText(/Turning point/i)).toBeTruthy();
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

    const opener = screen.getByRole('button', { name: 'Open chapter details' });
    await user.click(opener);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('wraps Tab and Shift+Tab among visible enabled drawer controls', async () => {
    const user = userEvent.setup();
    render(
      <DrawerHarness
        footer={(
          <>
            <button type="button">View scene timeline</button>
            <button type="button" disabled>Unavailable chapter export</button>
            <button type="button" hidden>Hidden chapter action</button>
            <button type="button" style={{ display: 'none' }}>Hidden chapter export</button>
            <button type="button" style={{ visibility: 'hidden' }}>Invisible chapter export</button>
            <fieldset disabled>
              <legend>Unavailable chapter tools</legend>
              <button type="button">Disabled fieldset tool</button>
            </fieldset>
          </>
        )}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Open chapter details' }));

    const closeButton = screen.getByRole('button', { name: 'Close chapter details' });
    const timelineButton = screen.getByRole('button', { name: 'View scene timeline' });

    await user.tab();
    expect(document.activeElement).toBe(timelineButton);

    await user.tab();
    expect(document.activeElement).toBe(closeButton);

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(timelineButton);
  });

  it('renders the selected chapter beat and word count from its data', () => {
    const selectedChapter = {
      ...noveloraMockProject.chapters.find((chapter) => chapter.id === 'chapter-3')!,
      beat: 'Fixture proof beat',
      wordCount: 4_321,
    };

    render(
      <ChapterDetailDrawer
        project={noveloraMockProject}
        selectedChapter={selectedChapter}
        isOpen
        onClose={() => undefined}
        invokerRef={createRef<HTMLButtonElement>()}
      />,
    );

    expect(screen.getByText('Fixture proof beat')).toBeTruthy();
    expect(screen.getByText('4,321 words')).toBeTruthy();
  });
});
