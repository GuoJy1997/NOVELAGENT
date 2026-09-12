import { useEffect, useState } from 'react';
import { acceptCandidate, discardCandidate, fetchCandidate, fetchCandidates, type FileCandidate } from '../../lib/noveloraApi';

interface CandidateReviewProps {
  projectId: string;
  chapterNum: number;
  refreshKey: number;
  onAccepted: () => void;
}

interface ReviewItem extends FileCandidate {
  content: string;
}

function chapterTargetPath(chapterNum: number): string {
  return `chapters/ch_${String(chapterNum).padStart(2, '0')}.md`;
}

export function CandidateReview({ projectId, chapterNum, refreshKey, onAccepted }: CandidateReviewProps) {
  const [candidates, setCandidates] = useState<ReviewItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');

    async function load() {
      try {
        const all = await fetchCandidates(projectId);
        const pending = all.filter((item) => item.targetPath === chapterTargetPath(chapterNum));
        const items = await Promise.all(pending.map(async (item) => {
          try {
            const full = await fetchCandidate(item.id, projectId);
            return { ...item, content: full.content };
          } catch {
            return { ...item, content: '' };
          }
        }));
        if (!cancelled) setCandidates(items);
      } catch {
        if (!cancelled) setCandidates([]);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [projectId, chapterNum, refreshKey]);

  async function reload() {
    const all = await fetchCandidates(projectId);
    const pending = all.filter((item) => item.targetPath === chapterTargetPath(chapterNum));
    const items = await Promise.all(pending.map(async (item) => {
      try {
        const full = await fetchCandidate(item.id, projectId);
        return { ...item, content: full.content };
      } catch {
        return { ...item, content: '' };
      }
    }));
    setCandidates(items);
  }

  async function handleAccept(id: string) {
    setError('');
    try {
      await acceptCandidate(id, projectId);
      onAccepted();
      await reload();
    } catch {
      setError('未能接受候选。');
    }
  }

  async function handleDiscard(id: string) {
    setError('');
    try {
      await discardCandidate(id, projectId);
      await reload();
    } catch {
      setError('未能丢弃候选。');
    }
  }

  if (candidates.length === 0) return null;

  return (
    <section className="bixin-candidate" aria-label="待审候选">
      {error ? <p role="alert">{error}</p> : null}
      <ul className="bixin-candidate__list">
        {candidates.map((candidate) => (
          <li key={candidate.id} className="bixin-candidate__item">
            <pre className="bixin-candidate__preview">{candidate.content}</pre>
            <div className="bixin-candidate__actions">
              <button type="button" className="bixin-btn bixin-btn--primary" onClick={() => { void handleAccept(candidate.id); }}>接受</button>
              <button type="button" className="bixin-btn" onClick={() => { void handleDiscard(candidate.id); }}>丢弃</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
