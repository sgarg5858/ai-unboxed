import { IDS, TOKENS, VOCAB, layerNorm, runWalkthrough } from './walkthrough-model';

describe('walkthrough model', () => {
  const w = runWalkthrough();
  const last = TOKENS.length - 1;

  it('gives both "to" tokens the same ID and embedding, but different inputs', () => {
    expect(IDS[2]).toBe(IDS[4]);
    expect(w.embed[2]).toEqual(w.embed[4]);
    expect(w.x0[2]).not.toEqual(w.x0[4]);
  });

  it('layer norm centres on 0 with a spread of 1', () => {
    const n = layerNorm([6, -2, 10, 2]);
    const mean = n.reduce((s, x) => s + x, 0) / n.length;
    const sd = Math.sqrt(n.reduce((s, x) => s + (x - mean) ** 2, 0) / n.length);
    expect(mean).toBeCloseTo(0, 6);
    expect(sd).toBeCloseTo(1, 6);
  });

  it('attention is causal and each row sums to 1', () => {
    w.attn.forEach((row, i) => {
      row.forEach((v, j) => j > i && expect(v).toBe(0));
      expect(row.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 6);
    });
  });

  it('"deposit" looks back at "bank" more than at any other earlier word', () => {
    const others = w.attn[last].slice(0, last);
    expect(others.indexOf(Math.max(...others))).toBe(3);
  });

  it('predicts " money", with " river" least likely', () => {
    const top = w.probs.indexOf(Math.max(...w.probs));
    const bottom = w.probs.indexOf(Math.min(...w.probs));
    expect(VOCAB[top].token).toBe(' money');
    expect(VOCAB[bottom].token).toBe(' river');
    expect(w.probs.reduce((s, p) => s + p, 0)).toBeCloseTo(1, 6);
  });
});
