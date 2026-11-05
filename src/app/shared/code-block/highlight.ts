const KEYWORDS =
  /(#[^\n]*)|\b(def|class|return|for|in|if|else|import|torch|self|while|break|async|not)\b/g;

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * Minimal Python-ish highlighter: comments and a few keywords.
 * Single pass, so text inside an inserted span is never re-matched
 * (the old two-pass version turned `class="c"` into visible text).
 */
export function highlight(src: string): string {
  return escapeHtml(src).replace(KEYWORDS, (_m, comment?: string, kw?: string) =>
    comment ? `<span class="c">${comment}</span>` : `<span class="kw">${kw}</span>`,
  );
}
