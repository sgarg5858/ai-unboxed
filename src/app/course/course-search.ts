/** Searching slide titles and summaries across the course, for the command palette. */

export interface SearchEntry {
  chapterId: string;
  chapterName: string;
  /** e.g. "2.3" */
  number: string;
  /** 0-based slide index */
  slide: number;
  title: string;
  /** Plain-text summary (HTML removed). */
  summary: string;
}

/** Remove HTML tags and decode the few entities slide text uses. */
export const plain = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** Lower case, without accents (é → e). */
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

/**
 * Entries that contain every word of the query, best first. A word in the title counts most,
 * then the chapter name, then the summary; a match at the start of a word earns a bonus.
 */
export function searchSlides(
  entries: readonly SearchEntry[],
  query: string,
  limit = 12,
): SearchEntry[] {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const scored: { e: SearchEntry; score: number; i: number }[] = [];
  entries.forEach((e, i) => {
    const fields: [string, number][] = [
      [norm(e.title), 10],
      [norm(e.chapterName), 4],
      [norm(e.summary), 2],
    ];
    let score = 0;
    for (const w of words) {
      let best = 0;
      for (const [text, weight] of fields) {
        const at = text.indexOf(w);
        if (at < 0) continue;
        const wordStart = at === 0 || /[^a-z0-9]/.test(text[at - 1]);
        best = Math.max(best, weight * (wordStart ? 1.5 : 1));
      }
      if (!best) return;
      score += best;
    }
    scored.push({ e, score, i });
  });
  return scored
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map((s) => s.e);
}
