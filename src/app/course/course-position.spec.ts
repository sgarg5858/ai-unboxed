import { resolvePosition, step, toPath } from './course-position';

const C = [{ id: 'a' }, { id: 'b' }];
const slides = [2, 3];
const count = (i: number) => slides[i];

describe('course position', () => {
  it('resolves chapter and 1-based slide from the URL', () => {
    expect(resolvePosition(C, '/b/2', count)).toEqual({ chapter: 1, slide: 1 });
  });

  it('falls back to the first chapter/slide and clamps out-of-range slides', () => {
    expect(resolvePosition(C, '/', count)).toEqual({ chapter: 0, slide: 0 });
    expect(resolvePosition(C, '/nope/4', count)).toEqual({ chapter: 0, slide: 1 });
    expect(resolvePosition(C, '/b/99', count)).toEqual({ chapter: 1, slide: 2 });
    expect(resolvePosition(C, '/b/x', count)).toEqual({ chapter: 1, slide: 0 });
  });

  it('supports legacy single-segment links like #assistant', () => {
    expect(resolvePosition(C, '/b', count)).toEqual({ chapter: 1, slide: 0 });
  });

  it('steps across chapter boundaries and wraps at the end', () => {
    expect(step(C, { chapter: 0, slide: 1 }, 1, count)).toEqual({ chapter: 1, slide: 0 });
    expect(step(C, { chapter: 1, slide: 0 }, -1, count)).toEqual({ chapter: 0, slide: 1 });
    expect(step(C, { chapter: 1, slide: 2 }, 1, count)).toEqual({ chapter: 0, slide: 0 });
    expect(step(C, { chapter: 0, slide: 0 }, -1, count)).toEqual({ chapter: 0, slide: 0 });
  });

  it('builds 1-based router paths', () => {
    expect(toPath(C, { chapter: 1, slide: 2 })).toEqual(['/', 'b', '3']);
  });
});
