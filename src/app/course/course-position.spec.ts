import type { ChapterContent } from './content.model';
import { resolvePosition, step, toPath } from './course-position';

const ch = (id: string, n: number): ChapterContent => ({
  id,
  name: id,
  slides: Array.from({ length: n }, (_, i) => ({ title: `${id}${i}`, body: [] })),
});
const C = [ch('a', 2), ch('b', 3)];

describe('course position', () => {
  it('resolves chapter and 1-based slide from the URL', () => {
    expect(resolvePosition(C, '/b/2')).toEqual({ chapter: 1, slide: 1 });
  });

  it('falls back to the first chapter/slide and clamps out-of-range slides', () => {
    expect(resolvePosition(C, '/')).toEqual({ chapter: 0, slide: 0 });
    expect(resolvePosition(C, '/nope/4')).toEqual({ chapter: 0, slide: 1 });
    expect(resolvePosition(C, '/b/99')).toEqual({ chapter: 1, slide: 2 });
    expect(resolvePosition(C, '/b/x')).toEqual({ chapter: 1, slide: 0 });
  });

  it('supports legacy single-segment links like #assistant', () => {
    expect(resolvePosition(C, '/b')).toEqual({ chapter: 1, slide: 0 });
  });

  it('steps across chapter boundaries and wraps at the end', () => {
    expect(step(C, { chapter: 0, slide: 1 }, 1)).toEqual({ chapter: 1, slide: 0 });
    expect(step(C, { chapter: 1, slide: 0 }, -1)).toEqual({ chapter: 0, slide: 1 });
    expect(step(C, { chapter: 1, slide: 2 }, 1)).toEqual({ chapter: 0, slide: 0 });
    expect(step(C, { chapter: 0, slide: 0 }, -1)).toEqual({ chapter: 0, slide: 0 });
  });

  it('builds 1-based router paths', () => {
    expect(toPath(C, { chapter: 1, slide: 2 })).toEqual(['/', 'b', '3']);
  });
});
