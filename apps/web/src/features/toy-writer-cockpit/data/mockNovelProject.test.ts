import { describe, expect, it } from 'vitest';
import { mockNovelProject } from './mockNovelProject';

describe('mockNovelProject', () => {
  it('keeps all project data scoped to one novel project', () => {
    expect(mockNovelProject.id).toBe('tides-of-embers');
    expect(mockNovelProject.title).toBe('Tides of Embers');
    expect(mockNovelProject.chapters).toHaveLength(6);
    expect(mockNovelProject.clueChains).toHaveLength(2);
  });

  it('has complete clue attribution fields for every clue chain', () => {
    for (const chain of mockNovelProject.clueChains) {
      expect(chain.provider.label).toBeTruthy();
      expect(chain.trigger.label).toBeTruthy();
      expect(chain.receiver.label).toBeTruthy();
      expect(chain.payoff.label).toBeTruthy();
      expect(chain.credibility).toMatch(/true|false|partial|misread|bait/);
    }
  });

  it('links the selected chapter seed to a clue chain', () => {
    const selectedChapter = mockNovelProject.chapters.find((chapter) => chapter.selected);
    expect(selectedChapter?.id).toBe('chapter-3');
    expect(mockNovelProject.clueChains.some((chain) => chain.relatedChapterIds.includes('chapter-3'))).toBe(true);
  });
});
