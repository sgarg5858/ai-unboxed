/**
 * A toy one-layer transformer that runs "I went to bank to deposit" end to end, so every number
 * in the End-to-end chapter can be shown and recomputed. Token IDs are GPT-2's real ones; the
 * weights are hand-made and only 4 numbers wide (GPT-2 uses 768), with each slot given a
 * readable name. Pure functions, no Angular.
 */
import { softmax } from './math';

export const TEXT = 'I went to bank to deposit';
export const DIMS = ['money', 'place', 'action', 'grammar'];
export const TOKENS = ['I', ' went', ' to', ' bank', ' to', ' deposit'];
/** Real GPT-2 token IDs (tiktoken "gpt2"). */
export const IDS = [40, 1816, 284, 3331, 284, 14667];

/** Token embedding table: one row per word, the same row wherever the word appears. */
const EMBED: Record<string, number[]> = {
  I: [0.0, 0.1, 0.2, 0.9],
  ' went': [0.0, 0.5, 0.8, 0.2],
  ' to': [0.0, 0.2, 0.1, 1.0],
  ' bank': [0.6, 0.8, 0.0, 0.1],
  ' deposit': [0.9, 0.0, 0.8, 0.1],
};

const r2 = (x: number) => Math.round(x * 100) / 100;
const add = (a: number[], b: number[]) => a.map((v, i) => v + b[i]);
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
const mul = (v: number[], W: number[][]) => W[0].map((_, j) => dot(v, W.map((r) => r[j])));

/** Small wave-based position vectors, rounded so they can be added by hand. */
export const position = (p: number): number[] =>
  [Math.sin(p), Math.cos(p), Math.sin(p / 3), Math.cos(p / 3)].map((v) => r2(v * 0.1));

/** Layer norm without learned scale/shift: subtract the mean, divide by the spread. */
export const layerNorm = (v: number[]): number[] => {
  const m = v.reduce((s, x) => s + x, 0) / v.length;
  const sd = Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length) || 1;
  return v.map((x) => (x - m) / sd);
};

// Attention: queries ask “anything about money?”; keys answer with their money and place slots.
const WQ = [
  [1.4, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0.6, 0],
  [0, 0, 0, 0.1],
];
const WK = [
  [1.4, 0, 0, 0],
  [0, 0.6, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0.1],
];
// Feed-forward: 4 → 6 → 4. Hidden unit 0 fires on "money + action" and pushes "money" up.
const W1 = [
  [1.0, 0.0, 0.2, 0.0, 0.3, 0.0],
  [-0.4, 1.0, 0.0, 0.2, 0.0, 0.0],
  [0.8, 0.0, 1.0, 0.0, 0.0, 0.2],
  [-0.5, 0.0, -0.3, 0.5, 0.0, 0.4],
];
const W2 = [
  [0.6, -0.3, 0.1, 0.0],
  [-0.1, 0.4, 0.0, 0.0],
  [0.0, 0.0, 0.3, 0.0],
  [0.0, 0.0, 0.0, 0.2],
  [0.2, 0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0, 0.1],
];

/** Next-token candidates: real GPT-2 IDs and an output vector each (money, place, action, grammar). */
export const VOCAB: { token: string; id: number; vec: number[] }[] = [
  { token: ' money', id: 1637, vec: [1.6, -0.2, 0.3, -0.6] },
  { token: ' cash', id: 5003, vec: [1.0, -0.2, 0.2, -0.5] },
  { token: ' my', id: 616, vec: [0.2, 0.0, 0.0, 0.5] },
  { token: ' some', id: 617, vec: [0.3, 0.0, 0.0, 0.3] },
  { token: ' the', id: 262, vec: [0.0, 0.2, -0.2, 0.6] },
  { token: ' river', id: 7850, vec: [-0.9, 1.2, -0.3, -0.4] },
];

export interface Walkthrough {
  embed: number[][];
  pos: number[][];
  x0: number[][];
  norm1: number[][];
  /** attn[i][j]: how much token i looks at token j (0 for j > i: causal mask). */
  attn: number[][];
  attnOut: number[][];
  x1: number[][];
  norm2: number[][];
  hidden: number[][];
  ffnOut: number[][];
  x2: number[][];
  finalNorm: number[];
  logits: number[];
  probs: number[];
}

/** Run the whole forward pass once. */
export const runWalkthrough = (): Walkthrough => {
  const embed = TOKENS.map((t) => EMBED[t]);
  const pos = TOKENS.map((_, p) => position(p));
  const x0 = embed.map((e, p) => add(e, pos[p]));
  const norm1 = x0.map(layerNorm);
  const q = norm1.map((n) => mul(n, WQ));
  const k = norm1.map((n) => mul(n, WK));
  const attn = q.map((qi, i) => {
    const w = softmax(k.slice(0, i + 1).map((kj) => dot(qi, kj) / 2));
    return TOKENS.map((_, j) => (j <= i ? w[j] : 0));
  });
  // Values are the normalized vectors, scaled down so attention nudges rather than replaces.
  const attnOut = attn.map((row) =>
    [0, 1, 2, 3].map((d) => 0.5 * row.reduce((s, w, j) => s + w * norm1[j][d], 0)),
  );
  const x1 = x0.map((x, i) => add(x, attnOut[i]));
  const norm2 = x1.map(layerNorm);
  const hidden = norm2.map((n) => mul(n, W1).map((h) => Math.max(0, h)));
  const ffnOut = hidden.map((h) => mul(h, W2));
  const x2 = x1.map((x, i) => add(x, ffnOut[i]));
  const finalNorm = layerNorm(x2[x2.length - 1]);
  const logits = VOCAB.map((c) => dot(finalNorm, c.vec));
  return {
    embed,
    pos,
    x0,
    norm1,
    attn,
    attnOut,
    x1,
    norm2,
    hidden,
    ffnOut,
    x2,
    finalNorm,
    logits,
    probs: softmax(logits),
  };
};
