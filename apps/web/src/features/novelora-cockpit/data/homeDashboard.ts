export const homeProject = {
  title: 'Tides of Embers',
  status: '进行中',
  description: '被放逐的潮汐行者归来，港口开始记起被禁的航路。',
  metrics: [
    { label: '字数', value: '80K' },
    { label: '章节', value: '6' },
    { label: '世界观', value: '12' },
    { label: '完成', value: '35%' },
  ],
};

export const chapterProgress = [
  { label: '灵感', value: 24 },
  { label: '大纲', value: 18 },
  { label: '草稿', value: 12 },
  { label: '修订', value: 6 },
  { label: '已发布', value: 3, highlight: true },
];

export const chapterSummary = '6 章正在推进';

export const writingGoals = {
  progress: 72,
  subtitle: '本月目标',
  items: [
    { label: '字数目标', current: '16,148', total: '80,000', percent: 20 },
    { label: '章节目标', current: '3', total: '6', percent: 50 },
    { label: '修订目标', current: '1', total: '4', percent: 25 },
  ],
};

export const characterNetwork = {
  center: { name: 'Kael', role: '潮汐行者' },
  nodes: [
    { name: 'Liora', role: '档案员', x: 12, y: 18, color: '#7ee5c0' },
    { name: 'Arden', role: '摄政', x: 14, y: 68, color: '#dff8ef' },
    { name: 'Selene', role: '神谕', x: 86, y: 18, color: '#7ee5c0' },
    { name: 'Vex', role: '走私客', x: 86, y: 68, color: '#ff4a4a' },
  ],
  legend: [
    { label: '同盟', color: '#09c779' },
    { label: '对手', color: '#ff4a4a' },
    { label: '中立', color: '#61706a' },
    { label: '未知', color: '#61706a' },
  ],
};

export const sceneSchedule = [
  { title: 'Ash Harbor', subtitle: '潮汐码头', badge: '2 天后' },
  { title: 'Ember Reef', subtitle: '透镜廊', badge: '2 小时后' },
  { title: 'Black-Water Forge', subtitle: '地图密室', badge: '4 小时后' },
];

export const calendarMonth = {
  label: '2024 年 5 月',
  weekdays: ['日', '一', '二', '三', '四', '五', '六'],
  days: [
    ['', '', '', '1', '2', '3', '4'],
    ['5', '6', '7', '8', '9', '10', '11'],
    ['12', '13', '14', '15', '16', '17', '18'],
    ['19', '20', '21', '22', '23', '24', '25'],
    ['26', '27', '28', '29', '30', '31', ''],
  ],
  active: '17',
};
