import { ChapterVideo } from './content.model';
import {
  coveredSlides,
  slideAtTime,
  slidesLabel,
  startFor,
  videoCovering,
  videoIndexAt,
} from './chapter-videos';

const A: ChapterVideo = { src: 'videos/a.mp4', title: 'A', slides: [1, 5] };
const B: ChapterVideo = {
  src: 'videos/b.mp4',
  title: 'B',
  slides: [6, 8],
  at: { '8': 16, '6': 85 },
};

describe('chapter videos', () => {
  it('picks the video whose slide range covers the slide', () => {
    expect(videoIndexAt([A, B], 0, 10)).toBe(0);
    expect(videoIndexAt([A, B], 6, 10)).toBe(1);
  });

  it('falls back to the closest video before an uncovered slide', () => {
    expect(videoIndexAt([A, B], 9, 10)).toBe(1);
    expect(videoIndexAt([], 3, 10)).toBe(-1);
  });

  it('treats a video without a range as covering the whole chapter', () => {
    expect(videoCovering([{ src: 'videos/c.mp4', title: 'C' }], 9, 10)?.title).toBe('C');
    expect(videoCovering([A, B], 9, 10)).toBeNull();
  });

  it("starts at the slide's timestamp, or 0", () => {
    expect(startFor(B, 5)).toBe(85);
    expect(startFor(B, 6)).toBe(0);
  });

  it('labels the range', () => {
    expect(slidesLabel(B, 10)).toBe('slides 6–8');
    expect(slidesLabel({ ...A, slides: [4, 4] }, 10)).toBe('slide 4');
  });

  it('covers slides listed in "at" outside its range, and prefers them', () => {
    const big: ChapterVideo = {
      src: 'videos/big.mp4',
      title: 'Big',
      slides: [1, 2],
      at: { '6': 99 },
    };
    const wide: ChapterVideo = { src: 'videos/w.mp4', title: 'Wide', slides: [4, 8] };
    expect(coveredSlides(big, 10)).toEqual([0, 1, 5]);
    expect(videoCovering([wide, big], 5, 10)?.title).toBe('Big');
    expect(videoCovering([wide, big], 6, 10)?.title).toBe('Wide');
    expect(slidesLabel(big, 10)).toBe('slides 1, 2, 6');
  });

  it('finds the slide whose topic is playing at a given time', () => {
    // B lists slide 8 at 16 s and slide 6 at 85 s (0-based 7 and 5).
    expect(slideAtTime(B, 0, 10)).toBe(7);
    expect(slideAtTime(B, 16, 10)).toBe(7);
    expect(slideAtTime(B, 84.9, 10)).toBe(7);
    expect(slideAtTime(B, 85, 10)).toBe(5);
    expect(slideAtTime(A, 30, 10)).toBeNull();
  });
});
