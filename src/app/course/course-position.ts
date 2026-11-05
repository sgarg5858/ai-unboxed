import { ChapterContent } from './content.model';

/** Where the reader is. Both indexes are 0-based. */
export interface Position {
  chapter: number;
  slide: number;
}

/** Resolve a URL path like "/assistant/3" (1-based slide) to a position, clamping bad input. */
export function resolvePosition(chapters: readonly ChapterContent[], path: string): Position {
  const [id = '', n = ''] = path.split(/[?#]/)[0].split('/').filter(Boolean);
  const c = Math.max(
    0,
    chapters.findIndex((ch) => ch.id === id),
  );
  const max = chapters[c].slides.length - 1;
  const s = Number.parseInt(n, 10);
  return { chapter: c, slide: Number.isFinite(s) ? Math.min(max, Math.max(0, s - 1)) : 0 };
}

/** Move one slide forward or back, crossing chapter boundaries and wrapping at the end. */
export function step(chapters: readonly ChapterContent[], p: Position, dir: 1 | -1): Position {
  const len = chapters[p.chapter].slides.length;
  if (dir > 0) {
    if (p.slide < len - 1) return { ...p, slide: p.slide + 1 };
    if (p.chapter < chapters.length - 1) return { chapter: p.chapter + 1, slide: 0 };
    return { chapter: 0, slide: 0 };
  }
  if (p.slide > 0) return { ...p, slide: p.slide - 1 };
  if (p.chapter > 0)
    return { chapter: p.chapter - 1, slide: chapters[p.chapter - 1].slides.length - 1 };
  return p;
}

export const toPath = (chapters: readonly ChapterContent[], p: Position): string[] => [
  '/',
  chapters[p.chapter].id,
  String(p.slide + 1),
];
