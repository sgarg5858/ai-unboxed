import { DETECTORS, TOKENS, gelu, relu, runMlp, silu } from './mlp';

describe('toy MLP', () => {
  it('matches the published activation values', () => {
    expect(gelu(1)).toBeCloseTo(0.841, 3);
    expect(gelu(-1)).toBeCloseTo(-0.159, 3);
    expect(gelu(-3)).toBeCloseTo(-0.004, 3);
    expect(silu(1)).toBeCloseTo(0.731, 3);
    expect(silu(-1)).toBeCloseTo(-0.269, 3);
    expect(relu(-1)).toBe(0);
  });

  it('fires each detector for its own token only', () => {
    const fired = (t: string) =>
      runMlp(TOKENS[t])
        .h.map((v, i) => (v > 1 ? DETECTORS[i].label : ''))
        .filter(Boolean);
    expect(fired('cat')).toEqual(['a living thing']);
    expect(fired('mat')).toEqual(['somewhere to sit']);
    expect(fired('sat')).toEqual(['a past action']);
    expect(fired('it')).toEqual(['a pronoun for an animal']);
  });

  it('adds "animal" to "it", and GELU lets a small negative through where ReLU gives 0', () => {
    const g = runMlp(TOKENS['it']);
    const r = runMlp(TOKENS['it'], relu);
    expect(g.y[0]).toBeGreaterThan(0.7);
    expect(g.out[0]).toBeCloseTo(TOKENS['it'][0] + g.y[0], 10);
    const objectPronoun = 4;
    expect(r.a[objectPronoun]).toBe(0);
    expect(g.a[objectPronoun]).toBeCloseTo(-0.159, 2);
  });
});
