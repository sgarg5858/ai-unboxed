/**
 * The tiny 4-token model used across the attention and output chapters.
 * Fixed weights so every number on screen is reproducible by hand.
 */
import { matmul, transpose } from './math';

export const TOK = ['I', ' am', ' learning', ' artificial'];
export const X = [
  [0.9, 0.1, 0.3, -0.2],
  [0.2, 0.8, -0.1, 0.3],
  [-0.3, 0.4, 0.9, 0.5],
  [0.1, -0.2, 0.7, 1.0],
];
const Wq = [
  [0.6, -0.2, 0.1],
  [0.1, 0.5, -0.3],
  [0.4, 0.3, 0.8],
  [-0.2, 0.6, 0.5],
];
const Wk = [
  [0.5, 0.1, -0.2],
  [-0.1, 0.6, 0.2],
  [0.3, 0.2, 0.9],
  [0.2, 0.4, 0.6],
];
const Wv = [
  [0.7, 0.0, 0.2],
  [0.1, 0.8, -0.1],
  [0.2, -0.3, 0.9],
  [-0.4, 0.5, 0.3],
];

export const Q = matmul(X, Wq);
export const K = matmul(X, Wk);
export const V = matmul(X, Wv);
/** Scaled scores Q·Kᵀ / √d_head (d_head = 3). */
export const S = matmul(Q, transpose(K)).map((r) => r.map((v) => v / Math.sqrt(3)));

/** Next-token candidates and logits after "I am learning artificial". */
export const CANDS: [string, number][] = [
  ['intelligence', 7.6],
  ['neural nets', 4.6],
  ['life', 4.2],
  ['languages', 3.9],
  ['sweeteners', 3.4],
  ['flowers', 2.6],
  ['grass', 1.6],
  ['banana', 0.9],
];
