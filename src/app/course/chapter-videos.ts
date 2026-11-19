/**
 * Which of a chapter's videos goes with which slide. Pure functions, unit-tested without TestBed.
 * Slide numbers in content are 1-based; slide indexes here are 0-based, as in Position.
 *
 * A video covers its `slides` range plus any slide listed in `at`, so one video can cover
 * slides that aren't next to each other (e.g. 1, 2 and 6). A slide listed in a video's `at`
 * goes with that video first, even if another video's range also covers it.
 */
import { ChapterVideo } from './content.model';

/** The 0-based first and last slide index of a video's range. */
export function rangeOf(v: ChapterVideo, slideCount: number): [number, number] {
  return v.slides ? [v.slides[0] - 1, v.slides[1] - 1] : [0, slideCount - 1];
}

const inRange = (v: ChapterVideo, slide: number, slideCount: number) => {
  const [a, b] = rangeOf(v, slideCount);
  return slide >= a && slide <= b;
};
const listed = (v: ChapterVideo, slide: number) => v.at?.[String(slide + 1)] !== undefined;

/** Every 0-based slide a video covers, in order. */
export function coveredSlides(v: ChapterVideo, slideCount: number): number[] {
  const [a, b] = rangeOf(v, slideCount);
  const all = new Set<number>();
  for (let i = a; i <= b; i++) all.add(i);
  for (const k of Object.keys(v.at ?? {})) all.add(+k - 1);
  return [...all].sort((x, y) => x - y);
}

/** The index of the video for this slide: one that lists it in `at`, else one whose range has it. */
function coveringIndex(videos: readonly ChapterVideo[], slide: number, slideCount: number) {
  const byAt = videos.findIndex((v) => listed(v, slide));
  return byAt >= 0 ? byAt : videos.findIndex((v) => inRange(v, slide, slideCount));
}

/** The video that covers a slide; if none does, the closest one before it, else the first. */
export function videoIndexAt(videos: readonly ChapterVideo[], slide: number, slideCount: number) {
  if (!videos.length) return -1;
  const covering = coveringIndex(videos, slide, slideCount);
  if (covering >= 0) return covering;
  let before = 0;
  videos.forEach((v, i) => {
    if (rangeOf(v, slideCount)[0] <= slide) before = i;
  });
  return before;
}

/** The video covering exactly this slide, or null. */
export function videoCovering(videos: readonly ChapterVideo[], slide: number, slideCount: number) {
  return videos[coveringIndex(videos, slide, slideCount)] ?? null;
}

/** Seconds into the video where this slide's topic starts (0 if not given). */
export function startFor(v: ChapterVideo, slide: number): number {
  return v.at?.[String(slide + 1)] ?? 0;
}

/** "slides 6–8", "slide 4", or "slides 1, 2, 6" when they aren't next to each other. */
export function slidesLabel(v: ChapterVideo, slideCount: number): string {
  const s = coveredSlides(v, slideCount).map((i) => i + 1);
  if (s.length === 1) return `slide ${s[0]}`;
  const contiguous = s.every((n, i) => i === 0 || n === s[i - 1] + 1);
  return contiguous ? `slides ${s[0]}–${s[s.length - 1]}` : `slides ${s.join(', ')}`;
}

/**
 * The 0-based slide whose topic is playing at `t` seconds: the last slide listed in `at` that
 * starts at or before `t` (the first listed one before that). Null if the video lists none.
 */
export function slideAtTime(v: ChapterVideo, t: number, slideCount: number): number | null {
  const listedSlides = coveredSlides(v, slideCount)
    .filter((s) => listed(v, s))
    .sort((a, b) => startFor(v, a) - startFor(v, b));
  if (!listedSlides.length) return null;
  let current = listedSlides[0];
  for (const s of listedSlides) if (startFor(v, s) <= t) current = s;
  return current;
}
