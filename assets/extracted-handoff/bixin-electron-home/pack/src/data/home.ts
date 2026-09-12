export const hero = {
  badge: 'AI 更懂你的创作',
  titleTop: '写出让世界',
  titleBottomPrefix: '铭记的',
  titleHighlight: '故事',
  description: '构思想迷宫，毫不遗漏的\n与笔心AI一起开启你的创作之旅。'
};

export const project = {
  title: '天空之冠',
  status: '进行中',
  description: '天空岛上浮现远古王国的版图，面对尘封的秘密与命运的抉择。',
  cover: '/assets/covers/project-cover.png',
  metrics: [
    { label: '字数', value: '278K' },
    { label: '章节', value: '42' },
    { label: '世界观', value: '12' },
    { label: '完成度', value: '96%' }
  ]
};

export const chapterProgress = [
  { label: '灵感', value: 24 },
  { label: '大纲', value: 18 },
  { label: '草稿', value: 12 },
  { label: '修订', value: 6 },
  { label: '已发布', value: 3, highlight: true }
];

export const chapterSummary = ['章大纲', '待审中', '断节稿'];

export const goalStats = {
  progress: 72,
  items: [
    { label: '本月字数目标', current: '60,200', total: '90,000', percent: 67 },
    { label: '章节目标', current: '20', total: '30', percent: 66 },
    { label: '修订目标', current: '15', total: '20', percent: 75 }
  ]
};

export const characters = {
  center: { name: '艾琳', role: '女王' },
  nodes: [
    { name: '雷欧', role: '战士', x: 11, y: 18, color: '#ddb26f' },
    { name: '达洪', role: '学者', x: 13, y: 62, color: '#8ab6d5' },
    { name: '影树', role: '导师', x: 84, y: 18, color: '#d59b95' },
    { name: '格雷司', role: '帝国', x: 84, y: 62, color: '#9f8fe4' },
    { name: '盟友', role: '护卫者', x: 51, y: 83, color: '#7ac9c0' }
  ],
  legend: [
    { label: '盟友', color: '#30b567' },
    { label: '冲突', color: '#f15b4c' },
    { label: '师徒/引导', color: '#794cff' },
    { label: '爱慕', color: '#48a8ff' },
    { label: '未知', color: '#9ba2aa' }
  ]
};

export const schedule = [
  { title: '次元海港', subtitle: '星盟隐岸', badge: '还有2天' },
  { title: '永恒密林', subtitle: '温泉壁廊', badge: '还有2时' },
  { title: '破碎群岛', subtitle: '秘匙殿序', badge: '还有4时' }
];

export const month = {
  label: '2024年5月',
  weekdays: ['日', '一', '二', '三', '四', '五', '六'],
  days: [
    ['', '', '', '1', '2', '3', '4'],
    ['5', '6', '7', '8', '9', '10', '11'],
    ['12', '13', '14', '15', '16', '17', '18'],
    ['19', '20', '21', '22', '23', '24', '25'],
    ['26', '27', '28', '29', '30', '31', '']
  ],
  active: '17'
};
