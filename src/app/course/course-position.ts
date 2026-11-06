import { SectionContent } from './content.model';

/** Where the reader is. Both indexes are 0-based. */
export interface Position {
  chapter: number;
  slide: number;
}

/** Only what navigation needs to know about a chapter. */
type Chapter = { id: string };
/** Number of slides in the chapter at this index. */
type SlideCount = (chapter: number) => number;

/** Resolve a URL path like "/assistant/3" (1-based slide) to a position, clamping bad input. */
export function resolvePosition(
  chapters: readonly Chapter[],
  path: string,
  count: SlideCount,
): Position {
  const [id = '', n = ''] = path.split(/[?#]/)[0].split('/').filter(Boolean);
  const c = Math.max(
    0,
    chapters.findIndex((ch) => ch.id === id),
  );
  const max = count(c) - 1;
  const s = Number.parseInt(n, 10);
  return { chapter: c, slide: Number.isFinite(s) ? Math.min(max, Math.max(0, s - 1)) : 0 };
}

/** Move one slide forward or back, crossing chapter boundaries and wrapping at the end. */
export function step(
  chapters: readonly Chapter[],
  p: Position,
  dir: 1 | -1,
  count: SlideCount,
): Position {
  if (dir > 0) {
    if (p.slide < count(p.chapter) - 1) return { ...p, slide: p.slide + 1 };
    if (p.chapter < chapters.length - 1) return { chapter: p.chapter + 1, slide: 0 };
    return { chapter: 0, slide: 0 };
  }
  if (p.slide > 0) return { ...p, slide: p.slide - 1 };
  if (p.chapter > 0) return { chapter: p.chapter - 1, slide: count(p.chapter - 1) - 1 };
  return p;
}

export const toPath = (chapters: readonly Chapter[], p: Position): string[] => [
  '/',
  chapters[p.chapter].id,
  String(p.slide + 1),
];

/** "01" for a one-chapter section, "2.3" for the third chapter of section 2. Indexes are 0-based. */
export function chapterNumber(sections: readonly SectionContent[], si: number, ci: number): string {
  return sections[si].chapters.length > 1 ? `${si + 1}.${ci + 1}` : String(si + 1).padStart(2, '0');
}
