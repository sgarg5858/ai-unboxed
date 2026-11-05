/** Display formatting shared across slides. */

/** Two decimals, with tiny values snapped to 0 so tables don't show "-0.00". */
export const f2 = (x: number): string => (Math.abs(x) < 0.005 ? 0 : x).toFixed(2);

/** Show a leading space in a token as ␣ so it's visible. */
export const vis = (t: string): string => t.replace(/^ /, '␣');

export const human = (n: number): string =>
  n >= 1e9
    ? (n / 1e9).toFixed(2) + 'B'
    : n >= 1e6
      ? (n / 1e6).toFixed(1) + 'M'
      : n >= 1e3
        ? (n / 1e3).toFixed(1) + 'K'
        : String(Math.round(n));

export const bytes = (n: number): string =>
  n >= 2 ** 30
    ? (n / 2 ** 30).toFixed(2) + ' GiB'
    : n >= 2 ** 20
      ? (n / 2 ** 20).toFixed(1) + ' MiB'
      : (n / 1024).toFixed(0) + ' KiB';

/** Diverging green/red cell background for signed values in roughly [-1, 1]. */
export const signCell = (v: number): string =>
  `background:color-mix(in srgb, ${v >= 0 ? 'var(--pos)' : 'var(--neg)'} ${Math.round(12 + Math.min(1, Math.abs(v)) * 70)}%, var(--surface));color:var(--ink)`;

/** Amber heat cell for values in [0, 1]. */
export const heatCell = (v: number): string =>
  `background:color-mix(in srgb, var(--heat) ${Math.round(v * 90)}%, var(--surface));color:var(--ink)`;
