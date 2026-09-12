import { Bell, CircleHelp } from 'lucide-react';
import { IconButton, SearchBar, Tooltip } from '@/components/ui';

export function TopBar() {
  return (
    <div className="absolute right-6 top-4 z-20 flex items-center gap-4">
      <SearchBar />
      <Tooltip label="通知">
        <IconButton icon={<Bell size={20} />} label="通知" />
      </Tooltip>
      <Tooltip label="帮助">
        <IconButton icon={<CircleHelp size={20} />} label="帮助" />
      </Tooltip>
    </div>
  );
}
