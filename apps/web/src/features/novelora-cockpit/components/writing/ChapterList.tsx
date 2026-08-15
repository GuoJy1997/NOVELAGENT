import type { ChapterMeta } from '../../lib/noveloraApi';

interface ChapterListProps {
  chapters: ChapterMeta[];
  selectedNum: number;
  onSelect: (num: number) => void;
}

export function ChapterList({ chapters, selectedNum, onSelect }: ChapterListProps) {
  return (
    <nav className="chapter-list" aria-label="Chapter list">
      <ul>
        {chapters.map((chapter) => (
          <li key={chapter.num}>
            <button
              type="button"
              aria-pressed={chapter.num === selectedNum}
              onClick={() => onSelect(chapter.num)}
            >
              <span>Chapter {chapter.num}</span>
              <strong>{chapter.title}</strong>
              <span>{chapter.status} · {chapter.words} words</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
