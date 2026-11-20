/**
 * A tiny, readable MLP for the MLP chapter: 4 numbers in, 6 named detectors, 4 numbers out.
 * Real models use thousands of each (GPT-2: 768 → 3,072 → 768), and their detectors aren't
 * labelled; here every number means something, so each step can be followed by eye.
 */
import { erf } from './math';

/** What each of the 4 numbers in a token's vector stands for. */
export const FEATURES = ['animal', 'object', 'refers back', 'action'] as const;

/** Token vectors as they arrive from attention. "it" has already taken in some of "cat". */
export const TOKENS: Record<string, readonly number[]> = {
  cat: [0.9, 0.1, 0, 0.1],
  mat: [0.1, 0.9, 0, 0],
  sat: [0, 0.1, 0, 0.9],
  it: [0.6, 0.2, 0.9, 0],
};

/**
 * Each detector is one row of the expand matrix (`w`, plus a bias `b`): it fires when the token
 * matches its pattern. `v` is its row of the shrink matrix: what it writes back when it fires.
 */
export interface Detector {
  label: string;
  w: readonly number[];
  b: number;
  v: readonly number[];
}

export const DETECTORS: readonly Detector[] = [
  { label: 'a living thing', w: [3.2, -2, -0.2, -1.4], b: -1, v: [0.3, 0, 0, 0] },
  { label: 'somewhere to sit', w: [-1.8, 3, -1.1, -2], b: -1, v: [0, 0.3, 0, 0] },
  { label: 'a pronoun for an animal', w: [-1.3, -1.5, 4, -1.5], b: -1, v: [0.5, 0, 0, 0] },
  { label: 'a past action', w: [-1.8, -1.5, -0.1, 2.9], b: -1, v: [0, 0, 0, 0.3] },
  { label: 'a pronoun for an object', w: [-1.3, -1.5, 1.2, -1.5], b: -1, v: [0, 0.5, 0, 0] },
  { label: 'money or banking', w: [-1.8, -2, -0.6, -2], b: -1, v: [0.4, 0.4, 0.4, 0.4] },
];

export const relu = (x: number) => Math.max(0, x);
/** GELU, exactly: x times the chance that a standard normal value is below x. */
export const gelu = (x: number) => 0.5 * x * (1 + erf(x / Math.SQRT2));
export const silu = (x: number) => x / (1 + Math.exp(-x));

export const ACTIVATIONS = { ReLU: relu, GELU: gelu, SiLU: silu } as const;
export type ActivationName = keyof typeof ACTIVATIONS;

export interface MlpRun {
  /** Step 1: each detector's score (expand). */
  h: number[];
  /** Step 2: after the activation (bend). */
  a: number[];
  /** Step 3: what the MLP adds back (shrink). */
  y: number[];
  /** The token's vector after the add. */
  out: number[];
}

/** Run one token through the toy MLP. */
export function runMlp(x: readonly number[], act: (v: number) => number = gelu): MlpRun {
  const h = DETECTORS.map((d) => d.w.reduce((s, w, i) => s + w * x[i], d.b));
  const a = h.map(act);
  const y = FEATURES.map((_, j) => DETECTORS.reduce((s, d, i) => s + a[i] * d.v[j], 0));
  return { h, a, y, out: x.map((v, j) => v + y[j]) };
}
