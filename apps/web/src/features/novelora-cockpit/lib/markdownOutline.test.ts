import { describe, expect, it } from 'vitest';
import { parseOutline } from './markdownOutline';

describe('parseOutline', () => {
  it('parses level one through three headings with zero-based lines', () => {
    expect(parseOutline('intro\n# 第一卷\n## 第一幕\n### 场景一')).toEqual([
      { level: 1, text: '第一卷', line: 1 },
      { level: 2, text: '第一幕', line: 2 },
      { level: 3, text: '场景一', line: 3 },
    ]);
  });

  it('ignores headings inside fenced code blocks', () => {
    expect(parseOutline('# visible\n```md\n# not a heading\n```\n## visible too')).toEqual([
      { level: 1, text: 'visible', line: 0 },
      { level: 2, text: 'visible too', line: 4 },
    ]);
  });

  it('returns an empty list for an empty document', () => {
    expect(parseOutline('')).toEqual([]);
  });
});
