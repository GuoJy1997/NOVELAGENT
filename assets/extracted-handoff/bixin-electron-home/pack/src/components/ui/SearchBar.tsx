import { Search } from 'lucide-react';

export function SearchBar({ placeholder = '搜索项目...' }: { placeholder?: string }) {
  return (
    <label className="flex h-14 w-[270px] items-center gap-3 rounded-[18px] border border-white/75 bg-white/[0.88] px-5 shadow-soft backdrop-blur-md">
      <Search size={20} className="text-neutral-700" />
      <input aria-label={placeholder} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[15px] text-neutral-700 outline-none placeholder:text-neutral-400" />
      <kbd className="rounded-lg bg-neutral-50 px-2 py-1 text-[12px] font-medium text-neutral-700">⌘K</kbd>
    </label>
  );
}
