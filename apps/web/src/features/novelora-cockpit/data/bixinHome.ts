import type { characterPortraits } from '../assetRegistry';

type PortraitAssetKey = keyof typeof characterPortraits;

interface HomeCharacter {
  name: string;
  role: string;
  portraitAssetKey: PortraitAssetKey;
  relation: 'ally' | 'conflict' | 'mentor' | 'love' | 'unknown';
  x: number;
  y: number;
}

export const bixinHomeData = {
  project: {
    title: '天空之冠',
    status: '进行中',
    description: '天空岛上浮现远古王国的版图，面对尘封的秘密与命运的抉择。',
    metrics: [
      { label: '字数', value: '278K' },
      { label: '章节', value: '42' },
      { label: '世界观', value: '12' },
      { label: '完成度', value: '96%' },
    ],
  },
  chapterStages: [
    { label: '灵感', value: 24 },
    { label: '大纲', value: 18 },
    { label: '草稿', value: 12 },
    { label: '修订', value: 6 },
    { label: '已发布', value: 3, active: true },
  ],
  writingGoals: {
    progress: 72,
    items: [
      { label: '本月字数目标', current: '60,200', total: '90,000', percent: 67 },
      { label: '章节目标', current: '20', total: '30', percent: 67 },
      { label: '修订目标', current: '15', total: '20', percent: 75 },
    ],
  },
  characters: {
    center: { name: '艾琳', role: '女王', portraitAssetKey: 'liora' as const },
    nodes: [
      { name: '霍欧', role: '战士', portraitAssetKey: 'arden', relation: 'ally', x: 18, y: 24 },
      { name: '达洪', role: '学者', portraitAssetKey: 'kael', relation: 'mentor', x: 18, y: 68 },
      { name: '盟友', role: '部德', portraitAssetKey: 'selene', relation: 'love', x: 48, y: 84 },
      { name: '影树', role: '导师', portraitAssetKey: 'vex', relation: 'ally', x: 82, y: 24 },
      { name: '格雷司', role: '帝国', portraitAssetKey: 'theOrder', relation: 'conflict', x: 82, y: 68 },
    ] satisfies HomeCharacter[],
  },
  schedule: [
    { title: '次元洞窟', subtitle: '黑暗回廊', badge: '场景已完成' },
    { title: '永恒森林', subtitle: '猩红映照', badge: '场景进行中' },
    { title: '破碎群岛', subtitle: '秘密居所', badge: '场景进行中' },
  ],
  calendar: {
    label: '2024年5月',
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    days: [27, 28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7],
    active: 17,
  },
} as const;
