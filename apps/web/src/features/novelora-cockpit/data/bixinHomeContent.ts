export interface HomeChallenge {
  topic: string; description: string; reward: string; participants: string;
}
export interface HomeQuickAction { id: string; label: string; nav: 'writing' | 'outline' | 'characters' | 'world'; }
export interface HomeRecentProject {
  id: string; genre: string; title: string; latestChapter: string;
  words: string; progressPercent: number;
}
export interface HomeSuggestion { id: string; text: string; }
export interface HomeStats { totalWords: string; totalDays: string; weeklyBars: number[]; }

export const bixinHomeContent = {
  heroTitleLines: ['笔心在手', '故事无界！'] as const,
  heroSubtitle: '你的 AI 小说创作搭档，灵感无限，笔下生花',
  heroBubble: '脑洞成文，一秒入戏！',
  featureChips: ['智能构思', '角色鲜活', '剧情联动', '世界沉浸', '一键成稿'] as const,
  challenge: {
    topic: '命运的转折点',
    description: '在故事中设置一个重要而不经的抉择，让主角的命运发生改变。',
    reward: '创作能量 +80',
    participants: '1234 人正在参与挑战',
  } satisfies HomeChallenge,
  copilotActions: ['续写下一章', '优化剧情', '描写场景', '对话润色'] as const,
  quickActions: [
    { id: 'outline-doc', label: '小说大纲', nav: 'outline' },
    { id: 'chapter-brief', label: '章节提纲', nav: 'writing' },
    { id: 'character-sheet', label: '角色设定', nav: 'characters' },
    { id: 'world-setting', label: '世界设定', nav: 'world' },
  ] satisfies HomeQuickAction[],
  recentProjects: [
    { id: 'p1', genre: '奇幻', title: '云上王座', latestChapter: '更新至 第三十五章', words: '12.8万字', progressPercent: 68 },
    { id: 'p2', genre: '科幻', title: '星海旅人', latestChapter: '更新至 第十八章', words: '8.7万字', progressPercent: 42 },
    { id: 'p3', genre: '古风', title: '长安夜话录', latestChapter: '更新至 第二十章', words: '9.3万字', progressPercent: 55 },
  ] satisfies HomeRecentProject[],
  suggestions: [
    { id: 's1', text: '让主角在困境中做出艰难抉择，增强戏剧张力' },
    { id: 's2', text: '增加反派的背景故事，丰富人物层次' },
    { id: 's3', text: '在下一章埋下伏笔，为后续高潮做铺垫' },
  ] satisfies HomeSuggestion[],
  stats: { totalWords: '892,301', totalDays: '68 天', weeklyBars: [30, 45, 38, 62, 55, 78, 90] } satisfies HomeStats,
} as const;
