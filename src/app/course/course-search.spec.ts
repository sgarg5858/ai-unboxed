import { describe, expect, it } from 'vitest';
import { plain, searchSlides, SearchEntry } from './course-search';

const e = (title: string, summary = '', chapterName = 'Embeddings', slide = 0): SearchEntry => ({
  chapterId: 'x',
  chapterName,
  number: '2.3',
  slide,
  title,
  summary,
});

describe('searchSlides', () => {
  const entries = [
    e('The embedding table', 'One row per token.'),
    e('Cosine similarity: comparing meaning', 'Compare direction, not length.', 'Embeddings', 1),
    e('RoPE: what modern models use', 'Rotate vectors by position.', 'Embeddings', 2),
    e('Reranking', 'A second look with cosine scores.', 'RAG', 3),
  ];

  it('returns nothing for an empty query', () => {
    expect(searchSlides(entries, '  ')).toEqual([]);
  });

  it('ranks title matches above summary matches', () => {
    const hits = searchSlides(entries, 'cosine');
    expect(hits.map((h) => h.title)).toEqual(['Cosine similarity: comparing meaning', 'Reranking']);
  });

  it('requires every word, in any field', () => {
    expect(searchSlides(entries, 'rope position').map((h) => h.slide)).toEqual([2]);
    expect(searchSlides(entries, 'rope banana')).toEqual([]);
  });

  it('ignores case and accents', () => {
    expect(searchSlides([e('Café embeddings')], 'CAFE')).toHaveLength(1);
  });
});

describe('plain', () => {
  it('strips tags and decodes entities', () => {
    expect(plain('<b>Bold</b> &lt;tag&gt;  and   space')).toBe('Bold <tag> and space');
  });
});
