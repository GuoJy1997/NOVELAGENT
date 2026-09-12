import {
  ChartNoAxesCombined,
  Crown,
  Columns2,
  FileText,
  GitBranch,
  Globe2,
  House,
  Plus,
  Settings,
  Share2,
  UserRound,
} from 'lucide-react';
import { bixinAssets } from '../../assetRegistry';
import { bixinHomeContent } from '../../data/bixinHomeContent';
import type { NavId } from '../../nav';

interface NavigationRailProps {
  activeItem: NavId;
  onSelectItem: (item: NavId) => void;
  onNewProject: () => void;
  onShowMessage: (message: string) => void;
}

const navigationItems: { id: NavId; label: string; icon: typeof House }[] = [
  { id: 'home', label: '首页', icon: House },
  { id: 'writing', label: '写作', icon: FileText },
  { id: 'workflow', label: '工作流', icon: GitBranch },
  { id: 'outline', label: '大纲', icon: Columns2 },
  { id: 'characters', label: '人物', icon: UserRound },
  { id: 'relations', label: '关系', icon: Share2 },
  { id: 'world', label: '世界观', icon: Globe2 },
  { id: 'tasks', label: '任务', icon: ChartNoAxesCombined },
];

export function NavigationRail({ activeItem, onSelectItem, onNewProject, onShowMessage }: NavigationRailProps) {
  return (
    <nav className="bixin-navigation-rail" aria-label="工作区导航">
      <div className="bixin-navigation-rail__brand">
        <img src={bixinAssets.quill} alt="" width={34} height={34} />
        <div><span>笔心</span><small>AI 小说 Agent</small></div>
      </div>
      <button className="bixin-navigation-rail__cta" type="button" onClick={onNewProject}>
        <Plus aria-hidden="true" />
        新建作品
      </button>
      {navigationItems.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            className="bixin-navigation-rail__item"
            aria-pressed={activeItem === item.id}
            onClick={() => onSelectItem(item.id)}
          >
            <Icon aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
      <div className="bixin-navigation-rail__promo">
        <img src={activeItem === 'home' ? bixinAssets.mascotPro : bixinAssets.promoRocket} alt="" />
        <strong><Crown aria-hidden="true" />{activeItem === 'home' ? '笔心 Pro 限时特惠' : '笔心 Pro'}</strong>
        <small>解锁无限灵感与高级功能</small>
        <button type="button" onClick={() => onShowMessage('笔心 Pro 暂未在演示版开放。')}>立即开通</button>
      </div>
      <div className="bixin-navigation-rail__stats" aria-label="创作统计">
        <strong>创作统计</strong>
        <dl><div><dt>累计字数</dt><dd>{bixinHomeContent.stats.totalWords}</dd></div><div><dt>累计创作天数</dt><dd>{bixinHomeContent.stats.totalDays}</dd></div></dl>
        <div className="bixin-navigation-rail__bars">{bixinHomeContent.stats.weeklyBars.map((value, index) => <span key={index} style={{ height: `${value}%` }} />)}</div>
      </div>
      <div className="bixin-navigation-rail__footer">
        <div className="bixin-navigation-rail__utility">
          <Settings aria-hidden="true" />
          <span>设置</span>
        </div>
        <div className="bixin-navigation-rail__account">
          <img src={bixinAssets.avatarWriter} alt="笔心小作家" width={40} height={40} />
          <div>
            <span>笔心小作家</span>
            <small>Lv.12</small>
          </div>
        </div>
      </div>
    </nav>
  );
}
