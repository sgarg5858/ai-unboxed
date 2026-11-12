/** Pure retrieval helpers for the RAG chapter: chunking, keyword (BM25) scoring and rank fusion. */

export type Chunk = { start: number; end: number }; // word indexes, end exclusive

/**
 * Split `total` words into fixed-size chunks. Each chunk starts `size - overlap` words after the
 * previous one, so neighbours share `overlap` words. The last chunk may be shorter.
 */
export function chunkWords(total: number, size: number, overlap: number): Chunk[] {
  const step = Math.max(1, size - Math.max(0, overlap));
  const out: Chunk[] = [];
  for (let start = 0; start < total; start += step) {
    const end = Math.min(total, start + size);
    out.push({ start, end });
    if (end === total) break;
  }
  return out;
}

/** True when the chunk contains the whole word range [start, end). */
export const covers = (c: Chunk, start: number, end: number) => c.start <= start && c.end >= end;

/** Lower-case word tokens: letters, digits and hyphens. */
export const words = (text: string): string[] => text.toLowerCase().match(/[a-z0-9-]+/g) ?? [];

/**
 * BM25 keyword scores of `query` against every document (k1 = 1.2, b = 0.75). A document scores
 * higher when it contains the query's words, especially words that are rare across the documents.
 */
export function bm25(query: string, docs: readonly string[], k1 = 1.2, b = 0.75): number[] {
  const toks = docs.map(words);
  const avg = toks.reduce((s, t) => s + t.length, 0) / Math.max(1, toks.length);
  const n = docs.length;
  const terms = [...new Set(words(query))];
  return toks.map((doc) =>
    terms.reduce((score, term) => {
      const df = toks.filter((t) => t.includes(term)).length;
      if (!df) return score;
      const tf = doc.filter((w) => w === term).length;
      const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
      return score + (idf * tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * doc.length) / avg));
    }, 0),
  );
}

/** Indexes of `scores` from best to worst. Ties keep their original order. */
export const rankOf = (scores: readonly number[]) =>
  scores
    .map((s, i) => [s, i] as const)
    .sort((a, b) => b[0] - a[0] || a[1] - b[1])
    .map((p) => p[1]);

/**
 * Reciprocal rank fusion: each list gives an item 1 / (k + rank), rank starting at 1, and the
 * contributions are summed. It merges rankings without needing their scores to be comparable.
 */
export function rrf(rankings: readonly (readonly number[])[], n: number, k = 60): number[] {
  const out = new Array<number>(n).fill(0);
  for (const ranking of rankings) ranking.forEach((item, r) => (out[item] += 1 / (k + r + 1)));
  return out;
}
