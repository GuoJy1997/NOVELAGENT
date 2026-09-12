import { useEffect, useRef, type FormEvent } from 'react';
import { Bell, Crown, FolderOpen, Search, Zap } from 'lucide-react';
import { bixinAssets } from '../../assetRegistry';

interface HomeTopbarProps {
  onShowMessage: (message: string) => void;
  onOpenProject?: () => void;
}

export function HomeTopbar({ onShowMessage, onOpenProject }: HomeTopbarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (searchRef.current?.value.trim()) {
      onShowMessage('搜索功能暂未在演示版开放。');
    }
  }

  return (
    <div className="bixin-home-topbar">
      {onOpenProject ? <button type="button" className="bixin-home-topbar__workspace" onClick={onOpenProject}>
        <FolderOpen aria-hidden="true" />选择小说项目
      </button> : null}
      <form onSubmit={handleSubmit}>
        <label>
          <Search aria-hidden="true" />
          <input ref={searchRef} type="search" aria-label="搜索项目" placeholder="搜索我的作品 / 角色 / 世界设定 / 灵感" />
          <kbd aria-hidden="true">⌘K</kbd>
        </label>
      </form>
      <button className="bixin-home-topbar__energy" type="button" onClick={() => onShowMessage('创作能量暂未在演示版开放。')}>
        <Zap aria-hidden="true" />
        创作能量 999+
      </button>
      <button className="bixin-home-topbar__pro" type="button" onClick={() => onShowMessage('笔心 Pro 暂未在演示版开放。')}>
        <Crown aria-hidden="true" />
        开通笔心Pro
      </button>
      <button
        type="button"
        aria-label="查看通知"
        onClick={() => onShowMessage('通知中心暂未在演示版开放。')}
      >
        <Bell aria-hidden="true" />
      </button>
      <div className="bixin-home-topbar__avatar">
        <img src={bixinAssets.avatarWriter} alt="笔心小作家" />
        <span>Lv.12</span>
      </div>
    </div>
  );
}
