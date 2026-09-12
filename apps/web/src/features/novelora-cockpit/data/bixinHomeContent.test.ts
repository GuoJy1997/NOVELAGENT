import { describe, expect, it } from 'vitest';
import type { NavId } from '../nav';
import { bixinHomeContent } from './bixinHomeContent';

const validNavIds: NavId[] = ['home', 'writing', 'workflow', 'outline', 'characters', 'relations', 'world', 'tasks'];

describe('bixinHomeContent', () => {
  it('contains valid quick action navigation targets', () => {
    expect(bixinHomeContent.quickActions.every((action) => validNavIds.includes(action.nav))).toBe(true);
  });

  it('contains seven weekly bars within the chart range', () => {
    expect(bixinHomeContent.stats.weeklyBars).toHaveLength(7);
    expect(bixinHomeContent.stats.weeklyBars.every((value) => value >= 0 && value <= 100)).toBe(true);
  });

  it('contains three recent projects', () => {
    expect(bixinHomeContent.recentProjects).toHaveLength(3);
  });
});
