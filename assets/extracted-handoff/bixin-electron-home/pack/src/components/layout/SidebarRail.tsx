import { footerItem, navItems } from '@/data/nav';
import { ChevronDown, UserRound } from 'lucide-react';

export function SidebarRail() {
  const FooterIcon = footerItem.icon;
  return (
    <aside className="relative z-20 flex h-full w-[118px] flex-col items-center px-4 py-5">
      <img src="/assets/brand/bixin_app_icon.png" alt="笔心图标" className="h-14 w-14 rounded-[18px] shadow-soft" />

      <nav className="mt-8 flex w-full flex-col gap-3">
        {navItems.map(({ key, label, icon: Icon, active }) => (
          <button key={key} className={active ? 'nav-item nav-item-active' : 'nav-item nav-item-idle'}>
            <Icon size={22} strokeWidth={2.1} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto flex w-full flex-col gap-4 pb-1">
        <button className="nav-item nav-item-idle">
          <FooterIcon size={22} strokeWidth={2.1} />
          <span>{footerItem.label}</span>
        </button>

        <div className="rounded-[20px] bg-white/[0.76] p-2.5 shadow-soft backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-bixin-400 to-bixin-700 text-white">
              <UserRound size={20} />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-[15px] font-semibold text-neutral-900">陆遥</div>
              <div className="mt-1 inline-flex items-center rounded-full border border-bixin-200 bg-bixin-50 px-2 py-[2px] text-[11px] font-medium text-bixin-700">
                专业版
              </div>
            </div>
            <ChevronDown size={16} className="text-neutral-500" />
          </div>
        </div>
      </div>
    </aside>
  );
}
