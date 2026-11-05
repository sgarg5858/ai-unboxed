import { highlight } from './highlight';

describe('highlight', () => {
  it('wraps comments without leaking markup into the text', () => {
    // Regression: a two-pass version re-highlighted "class" inside the comment span.
    const html = highlight('x = 1   # a comment');
    expect(html).toBe('x = 1   <span class="c"># a comment</span>');
  });

  it('highlights keywords and escapes HTML', () => {
    expect(highlight('for a in b: x < y')).toBe(
      '<span class="kw">for</span> a <span class="kw">in</span> b: x &lt; y',
    );
  });
});
