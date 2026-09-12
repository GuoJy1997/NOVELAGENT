const FENCE_PATTERN = /```(?:markdown|md)\n([\s\S]*?)```/;

export function extractChapterCandidate(text: string, chapterNum: number): string | null {
  void chapterNum;
  const match = text.match(FENCE_PATTERN);
  return match ? match[1] : null;
}
