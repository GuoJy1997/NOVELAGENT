import { useMemo, useState } from 'react';
import type { ChapterMeta } from '../../lib/noveloraApi';

interface ChapterListProps {
  chapters: ChapterMeta[];
  selectedNum: number;
  onSelect: (num: number) => void;
}

const STATUS_LABEL: Record<string, string> = {
  drafting: '起草中',
  complete: '已完成',
  revision: '修订中',
  published: '已发布',
};

export function ChapterList({ chapters, selectedNum, onSelect }: ChapterListProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => chapters.filter((chapter) => chapter.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [chapters, query]);
  const totalWords = chapters.reduce((sum, chapter) => sum + chapter.words, 0);
  const progress = chapters.length ? Math.min(100, Math.round((selectedNum / chapters.length) * 100)) : 0;
  return (
    <nav className="bixin-chapter-list" aria-label="章节列表">
      <div className="bixin-chapter-list__head"><strong>章节目录</strong><span>{chapters.length} 章</span></div>
      <input type="search" aria-label="搜索章节" placeholder="搜索章节…" value={query} onChange={(event) => setQuery(event.target.value)} />
      <ul>
        {filtered.map((chapter) => (
          <li key={chapter.num}>
            <button
              type="button"
              aria-pressed={chapter.num === selectedNum}
              onClick={() => onSelect(chapter.num)}
            >
              <span>第 {chapter.num} 章</span>
              <strong>{chapter.title}</strong>
              <span>{chapter.words} 字</span>
              <span className="bixin-chapter-list__badge" data-status={chapter.status}>{STATUS_LABEL[chapter.status] ?? chapter.status}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="bixin-chapter-list__progress">
        <strong>本章进度</strong><span>{selectedNum} / {chapters.length} 章</span>
        <div className="bixin-chapter-list__track"><span style={{ width: `${progress}%` }} /></div>
        <span>总字数 {totalWords} / 150,000 字</span>
      </div>
    </nav>
  );
}
