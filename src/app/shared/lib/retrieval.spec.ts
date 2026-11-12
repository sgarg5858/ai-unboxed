import { describe, expect, it } from 'vitest';
import { bm25, chunkWords, covers, rankOf, rrf, words } from './retrieval';

describe('chunkWords', () => {
  it('splits without overlap', () => {
    expect(chunkWords(10, 4, 0)).toEqual([
      { start: 0, end: 4 },
      { start: 4, end: 8 },
      { start: 8, end: 10 },
    ]);
  });
  it('shares words between neighbours with overlap', () => {
    expect(chunkWords(10, 6, 2)).toEqual([
      { start: 0, end: 6 },
      { start: 4, end: 10 },
    ]);
  });
  it('returns one chunk when size covers everything', () => {
    expect(chunkWords(5, 50, 10)).toEqual([{ start: 0, end: 5 }]);
  });
  it('checks coverage', () => {
    expect(covers({ start: 2, end: 8 }, 3, 8)).toBe(true);
    expect(covers({ start: 2, end: 8 }, 1, 4)).toBe(false);
  });
});

describe('bm25', () => {
  const docs = [
    'error E-4012 means the battery is faulty',
    'the screen is cracked',
    'battery tips',
  ];
  it('scores documents that contain rare query words highest', () => {
    const s = bm25('E-4012 meaning', docs);
    expect(rankOf(s)[0]).toBe(0);
    expect(s[1]).toBe(0);
  });
  it('tokenises to lower-case words', () => {
    expect(words('Hello, E-4012!')).toEqual(['hello', 'e-4012']);
  });
});

describe('rrf', () => {
  it('puts an item ranked last in both lists last', () => {
    const fused = rrf(
      [
        [0, 1, 2],
        [1, 0, 2],
      ],
      3,
    );
    expect(rankOf(fused)[2]).toBe(2);
    expect(fused[0]).toBeCloseTo(fused[1]);
  });
});
