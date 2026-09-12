import { describe, expect, it } from 'vitest';
import { extractChapterCandidate } from './chapterCandidate';

describe('extractChapterCandidate', () => {
  it('returns the markdown fence and ignores unfenced chat', () => {
    expect(extractChapterCandidate('just talk', 3)).toBeNull();
    expect(extractChapterCandidate('intro\n```markdown\n# 第三章\n```\n', 3)).toBe('# 第三章\n');
  });

  it('accepts the shorthand md fence', () => {
    expect(extractChapterCandidate('intro\n```md\n# 第三章\n```\n', 3)).toBe('# 第三章\n');
  });
});
