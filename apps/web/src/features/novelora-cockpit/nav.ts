export type NavId = 'home' | 'writing' | 'workflow' | 'outline' | 'characters' | 'relations' | 'world' | 'tasks';

export const NAV_ITEMS: { id: NavId; label: string }[] = [
  { id: 'home', label: '首页' },
  { id: 'writing', label: '写作' },
  { id: 'workflow', label: '工作流' },
  { id: 'outline', label: '大纲' },
  { id: 'characters', label: '人物' },
  { id: 'relations', label: '关系' },
  { id: 'world', label: '世界观' },
  { id: 'tasks', label: '任务' },
];
