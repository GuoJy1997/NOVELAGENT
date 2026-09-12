import { describe, expect, it } from 'vitest';
import type { CharacterFile, ProjectMeta } from '../lib/noveloraApi';
import { buildHomeDashboardView } from './homeDashboardView';

const project: ProjectMeta = {
  id: 'taoyuan',
  title: '桃园密码',
  currentChapter: 3,
  chapters: [
    { num: 1, title: '忘路之远近', status: 'complete', words: 4200 },
    { num: 2, title: '豁然开朗', status: 'draft', words: 1800 },
    { num: 3, title: '问津', status: 'draft', words: 0 },
  ],
};

const characters: CharacterFile = {
  characters: [
    { id: 'c1', name: '渔人', role: '叙述者', x: 20, y: 30 },
    { id: 'c2', name: '太守', role: '官员' },
  ],
  relationships: [
    { id: 'r1', fromCharacterId: 'c1', toCharacterId: 'c2', label: '求见', tension: 'low', kind: 'ally' },
  ],
};

describe('buildHomeDashboardView', () => {
  it('fills the home cards from the imported project instead of the demo fixture', () => {
    const view = buildHomeDashboardView({
      project,
      characters,
      outline: '武陵人捕鱼为业。\n沿溪行，忘路之远近。',
      world: '## 桃源村落\n与世隔绝的农耕聚落。\n## 武陵郡\n外部官署。',
    });

    expect(view.project.title).toBe('桃园密码');
    expect(view.project.description).toContain('武陵人捕鱼为业');
    expect(view.project.metrics.find((metric) => metric.label === '章节')?.value).toBe('3');
    expect(view.project.metrics.find((metric) => metric.label === '字数')?.value).toBe('6000');
    expect(view.characters.empty).toBe(false);
    expect(view.characters.center.name).toBe('渔人');
    expect(view.characters.nodes.map((node) => node.name)).toContain('太守');
    expect(view.writingGoals.items.some((item) => item.label === '已写章节')).toBe(true);
    expect(view.schedule[0]?.title).toBe('桃源村落');
    expect(view.schedule[0]?.subtitle).toBe('与世隔绝的农耕聚落。');
    expect(JSON.stringify(view)).not.toMatch(/天空之冠|艾琳|次元洞窟/);
  });

  it('fills the world card from body text when the markdown has no headings', () => {
    const view = buildHomeDashboardView({
      project,
      world: '桃源与世隔绝，对外只称隐居。\n武陵溪是误入的水路，也是唯一出口。',
    });
    expect(view.schedule[0]?.title).toMatch(/桃源/);
    expect(view.schedule.some((item) => item.title === '世界观' && item.subtitle === '还没有场景日程')).toBe(false);
  });

  it('prefers ## sections over ### subsections for the world card', () => {
    const view = buildHomeDashboardView({
      project,
      world: [
        '# 世界观设定',
        '',
        '## 石板',
        '七件国宝的底座。',
        '### 放大机制',
        '国宝只是媒介。',
        '## 副本系统',
        '历史恐怖副本。',
        '## 兰亭赌局',
        '召来后世之人。',
      ].join('\n'),
    });
    expect(view.schedule.map((item) => item.title)).toEqual(['石板', '副本系统', '兰亭赌局']);
    expect(view.schedule[0]?.subtitle).toBe('七件国宝的底座。');
  });

  it('shows an empty character hint when the imported project has no people yet', () => {
    const view = buildHomeDashboardView({
      project,
      characters: { characters: [], relationships: [] },
    });
    expect(view.characters.empty).toBe(true);
    expect(view.characters.emptyHint).toMatch(/人物/);
    expect(view.characters.nodes).toEqual([]);
  });
});
