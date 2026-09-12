import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { noveloraMockProject } from '../data/noveloraMockProject';
import { ChapterSwimlane } from './ChapterSwimlane';

const actTwoChapters = noveloraMockProject.chapters.filter((chapter) => chapter.actId === 'act-ii');

function ChapterSwimlaneHarness({
  onSelectChapter,
}: {
  onSelectChapter: (chapterId: string) => void;
}) {
  const [selectedChapterId, setSelectedChapterId] = useState('chapter-4');

  return (
    <ChapterSwimlane
      chapters={actTwoChapters}
      selectedChapterId={selectedChapterId}
      onSelectChapter={(chapterId) => {
        setSelectedChapterId(chapterId);
        onSelectChapter(chapterId);
      }}
    />
  );
}

describe('ChapterSwimlane', () => {
  it('uses the direct OccludedPanel structure for the named Chapter Timeline region', () => {
    const { container } = render(
      <ChapterSwimlane
        chapters={actTwoChapters}
        selectedChapterId="chapter-3"
        onSelectChapter={() => undefined}
      />,
    );

    const timeline = screen.getByRole('region', { name: 'Chapter Timeline' });
    const directChildren = Array.from(timeline.children);

    expect(timeline).toHaveClass('occluded-panel', 'chapter-timeline');
    expect(timeline).toHaveAttribute('aria-labelledby', 'chapter-timeline-title');
    expect(directChildren.map((child) => child.className)).toEqual([
      'occluded-panel__surface',
      'occluded-panel__content',
    ]);
    expect(within(timeline).getByRole('heading', { name: 'Chapter Timeline', level: 2 })).toHaveAttribute(
      'id',
      'chapter-timeline-title',
    );
    expect(container.querySelector('.chapter-timeline__heading')).toHaveClass('echo-panel-heading');
  });

  it('keeps chapter order stable without a visible reorder control', () => {
    render(
      <ChapterSwimlane
        chapters={actTwoChapters}
        selectedChapterId="chapter-3"
        onSelectChapter={() => undefined}
      />,
    );

    const timeline = screen.getByRole('region', { name: 'Chapter Timeline' });
    const timelineQueries = within(timeline);

    expect(timelineQueries.queryByRole('button', { name: 'Reorder chapters' })).toBeNull();
    expect(
      Array.from(timeline.querySelectorAll('.chapter-timeline__card')).map(
        (card) => card.querySelector('.chapter-timeline__number')?.textContent,
      ),
    ).toEqual(actTwoChapters.map((chapter) => `Ch. ${chapter.order}`));
  });

  it('selects Chapter 3 and reports the chosen chapter', async () => {
    const user = userEvent.setup();
    const onSelectChapter = vi.fn();

    render(<ChapterSwimlaneHarness onSelectChapter={onSelectChapter} />);

    const timeline = screen.getByRole('region', { name: 'Chapter Timeline' });
    const chapterThree = within(timeline).getByRole('button', { name: /Ch\. 3/i });
    await user.click(chapterThree);

    expect(chapterThree).toHaveAttribute('aria-pressed', 'true');
    expect(onSelectChapter).toHaveBeenCalledWith('chapter-3');
  });

  it.each([
    ['no chapters', [], 0],
    ['one chapter', actTwoChapters.slice(0, 1), 0],
    ['multiple chapters', actTwoChapters, 1],
  ])('keeps cards, the terminal add control, and progress safe with %s', (_, chapters, lineCount) => {
    render(
      <ChapterSwimlane
        chapters={chapters}
        selectedChapterId={chapters[0]?.id ?? ''}
        onSelectChapter={() => undefined}
      />,
    );

    const timeline = screen.getByRole('region', { name: 'Chapter Timeline' });
    const timelineQueries = within(timeline);
    const chapterRail = timelineQueries.getByRole('region', { name: 'Chapter timeline chapters' });
    const cards = chapterRail.querySelector('.chapter-timeline__cards');
    const progress = timelineQueries.getByRole('group', { name: 'Chapter progress' });
    const realCards = cards?.querySelectorAll('.chapter-timeline__card');
    const addChapter = timelineQueries.getByRole('button', { name: 'Add Chapter' });

    expect(chapterRail).toHaveAttribute('tabindex', '0');
    expect(realCards).toHaveLength(chapters.length);
    expect(addChapter).toBeDisabled();
    expect(cards?.lastElementChild).toBe(addChapter);
    expect(progress.previousElementSibling).toBe(cards);
    expect(progress.querySelectorAll('.chapter-timeline__progress-line')).toHaveLength(lineCount);
    expect(progress.querySelectorAll('.chapter-timeline__progress-node')).toHaveLength(chapters.length);
  });

  it('marks progress before and through the current chapter without adding controls', () => {
    const chapters = noveloraMockProject.chapters.slice(1, 4);

    render(
      <ChapterSwimlane
        chapters={chapters}
        selectedChapterId="chapter-3"
        onSelectChapter={() => undefined}
      />,
    );

    const timeline = screen.getByRole('region', { name: 'Chapter Timeline' });
    const progress = within(timeline).getByRole('group', { name: 'Chapter progress' });
    const nodes = Array.from(progress.querySelectorAll('.chapter-timeline__progress-node'));

    expect(nodes).toHaveLength(3);
    expect(nodes[0]).toHaveClass('is-complete');
    expect(nodes[0]).not.toHaveClass('is-current');
    expect(nodes[1]).toHaveClass('is-complete', 'is-current');
    expect(nodes[2]).toHaveClass('is-later');
    expect(nodes[2]).not.toHaveClass('is-complete', 'is-current');
    expect(within(progress).getByRole('img', { name: 'Chapter 2 complete' })).toBeTruthy();
    expect(within(progress).getByRole('img', { name: 'Chapter 3 current' })).toBeTruthy();
    expect(within(progress).getByRole('img', { name: 'Chapter 4 later' })).toBeTruthy();
    expect(within(progress).queryByRole('button')).toBeNull();
  });

  it('strokes the progress line with a mint-to-teal gradient definition', () => {
    const { container } = render(
      <ChapterSwimlane
        chapters={actTwoChapters}
        selectedChapterId="chapter-3"
        onSelectChapter={() => undefined}
      />,
    );

    const gradient = container.querySelector('linearGradient');
    expect(gradient).not.toBeNull();
    expect(container.innerHTML).toMatch(/stroke="url\(#/);
    expect(gradient?.getAttribute('id')).toBe('echoProgressGradientTimeline');
  });

  it('renders compact visible chapter values while omitting the legacy summary layout', () => {
    const chapters = actTwoChapters.map((chapter) =>
      chapter.id === 'chapter-3'
        ? {
            ...chapter,
            title: 'A deliberately long fixture chapter title that stays accessible',
            beat: 'Fixture proof beat that stays accessible',
            summary: 'Legacy fixture summary that must not appear in the compact card.',
            wordCount: 4_321,
            status: 'review' as const,
          }
        : chapter,
    );

    render(
      <ChapterSwimlane
        chapters={chapters}
        selectedChapterId="chapter-3"
        onSelectChapter={() => undefined}
      />,
    );

    const timeline = screen.getByRole('region', { name: 'Chapter Timeline' });
    const chapterThree = within(timeline).getByRole('button', { name: /Ch\. 3/i });

    expect(chapterThree).toHaveTextContent('Ch. 3');
    expect(chapterThree).toHaveTextContent('A deliberately long fixture chapter title that stays accessible');
    expect(chapterThree).toHaveTextContent('Fixture proof beat that stays accessible');
    expect(chapterThree).toHaveTextContent('4,321 words');
    expect(chapterThree).toHaveTextContent('In review');
    expect(within(timeline).queryByText('Legacy fixture summary that must not appear in the compact card.')).toBeNull();
    expect(timeline.querySelector('.chapter-card__summary')).toBeNull();
    expect(timeline.querySelector('.chapter-card__avatars')).toBeNull();
    expect(timeline.querySelector('.chapter-card__lock')).toBeNull();
  });
});

