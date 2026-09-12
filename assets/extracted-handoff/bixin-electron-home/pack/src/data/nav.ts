import { BookOpenText, ChartColumnBig, FileText, Globe2, Home, Settings, Users } from 'lucide-react';

export const navItems = [
  { key: 'home', label: '首页', icon: Home, active: true },
  { key: 'projects', label: '项目', icon: FileText, active: false },
  { key: 'outline', label: '大纲', icon: BookOpenText, active: false },
  { key: 'characters', label: '人物', icon: Users, active: false },
  { key: 'stats', label: '统计', icon: ChartColumnBig, active: false },
  { key: 'world', label: '世界观', icon: Globe2, active: false }
];

export const footerItem = { key: 'settings', label: '设置', icon: Settings };
