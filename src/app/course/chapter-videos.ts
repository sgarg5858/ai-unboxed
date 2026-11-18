/**
 * Which of a chapter's videos goes with which slide. Pure functions, unit-tested without TestBed.
 * Slide numbers in content are 1-based; slide indexes here are 0-based, as in Position.
 */
import { ChapterVideo } from './content.model';

/** The 0-based first and last slide index a video covers. */
export function rangeOf(v: ChapterVideo, slideCount: number): [number, number] {
  return v.slides ? [v.slides[0] - 1, v.slides[1] - 1] : [0, slideCount - 1];
}

/** The video that covers a slide; if none does, the closest one before it, else the first. */
export function videoIndexAt(videos: readonly ChapterVideo[], slide: number, slideCount: number) {
  if (!videos.length) return -1;
  const covering = videos.findIndex((v) => {
    const [a, b] = rangeOf(v, slideCount);
    return slide >= a && slide <= b;
  });
  if (covering >= 0) return covering;
  let before = 0;
  videos.forEach((v, i) => {
    if (rangeOf(v, slideCount)[0] <= slide) before = i;
  });
  return before;
}

/** The video covering exactly this slide, or null (for the "Watch this part" pill). */
export function videoCovering(videos: readonly ChapterVideo[], slide: number, slideCount: number) {
  return (
    videos.find((v) => {
      const [a, b] = rangeOf(v, slideCount);
      return slide >= a && slide <= b;
    }) ?? null
  );
}

/** Seconds into the video where this slide's topic starts (0 if not given). */
export function startFor(v: ChapterVideo, slide: number): number {
  return v.at?.[String(slide + 1)] ?? 0;
}

/** "slides 6–8", or "slide 4" for a single slide. */
export function slidesLabel(v: ChapterVideo, slideCount: number): string {
  const [a, b] = rangeOf(v, slideCount);
  return a === b ? `slide ${a + 1}` : `slides ${a + 1}–${b + 1}`;
}
