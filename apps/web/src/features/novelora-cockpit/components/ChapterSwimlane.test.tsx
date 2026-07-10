import { useState } from 'react';
import { render, screen } from '@testing-library/react';
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
  it('selects Chapter 3 and reports the chosen chapter', async () => {
    const user = userEvent.setup();
    const onSelectChapter = vi.fn();

    render(<ChapterSwimlaneHarness onSelectChapter={onSelectChapter} />);

    const chapterThree = screen.getByRole('button', { name: /Chapter 3/i });
    await user.click(chapterThree);

    expect(chapterThree.getAttribute('aria-pressed')).toBe('true');
    expect(onSelectChapter).toHaveBeenCalledWith('chapter-3');
  });
});
