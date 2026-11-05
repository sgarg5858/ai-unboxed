/** Small numeric helpers used by the interactive slides. Plain arrays, no tensors. */
export type Matrix = number[][];

export const softmax = (a: number[]): number[] => {
  const m = Math.max(...a);
  const e = a.map((x) => Math.exp(x - m));
  const s = e.reduce((p, c) => p + c, 0);
  return e.map((x) => x / s);
};

export const matmul = (A: Matrix, B: Matrix): Matrix =>
  A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));

export const transpose = (A: Matrix): Matrix => A[0].map((_, j) => A.map((r) => r[j]));

/** Abramowitz–Stegun approximation, good to ~1e-7. */
export const erf = (x: number): number => {
  const s = Math.sign(x);
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return s * y;
};

/** Build an SVG path "M x y L x y ..." by sampling f over [x0, x1]. */
export const plotPath = (
  f: (x: number) => number,
  x0: number,
  x1: number,
  steps: number,
  sx: (x: number) => number,
  sy: (y: number) => number,
): string => {
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    d += (i ? 'L' : 'M') + sx(x).toFixed(1) + ' ' + sy(f(x)).toFixed(1);
  }
  return d;
};
