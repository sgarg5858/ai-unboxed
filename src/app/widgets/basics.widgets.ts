import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

const FEATURES = ['sweet', 'crunchy', 'sour'];
const FRUITS: [string, number[]][] = [
  ['apple', [0.7, 0.9, 0.3]],
  ['pear', [0.8, 0.6, 0.2]],
  ['banana', [0.9, 0.1, 0.1]],
  ['lemon', [0.1, 0.2, 1.0]],
  ['carrot', [0.3, 1.0, 0.1]],
];
const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
const norm = (a: number[]) => Math.sqrt(dot(a, a));

/** Pick two fruits described by hand-made feature vectors; shows dot product and cosine similarity. */
@Component({
  selector: 'w-fruit-similarity',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @let r = result();
    <div class="panel">
      @for (side of [0, 1]; track side) {
        <div class="row" style="margin-bottom:8px">
          <span class="cap" style="width:64px">{{ side === 0 ? 'Fruit A' : 'Fruit B' }}</span>
          @for (f of fruits; track f[0]) {
            <button class="btn" [class.on]="pick()[side] === $index" (click)="choose(side, $index)">
              {{ f[0] }}
            </button>
          }
        </div>
      }
      <div class="scroll" style="margin-top:6px">
        <table class="matrix">
          <tr>
            <th></th>
            @for (h of features; track h) {
              <th style="text-align:center">{{ h }}</th>
            }
          </tr>
          @for (f of fruits; track f[0]; let i = $index) {
            @let on = i === pick()[0] || i === pick()[1];
            <tr>
              <th>{{ f[0] }}</th>
              @for (v of f[1]; track $index) {
                <td
                  [style.background]="on ? 'var(--accent-soft)' : 'var(--surface)'"
                  [style.color]="on ? 'var(--accent-ink)' : 'var(--muted)'"
                >
                  {{ v.toFixed(1) }}
                </td>
              }
            </tr>
          }
        </table>
      </div>
      <div class="shape" style="white-space:normal">
        A · B = {{ r.working }} = {{ r.dot.toFixed(2) }}
      </div>
      <div class="stat">
        <div>
          <b>{{ r.dot.toFixed(2) }}</b
          ><span>dot product</span>
        </div>
        <div>
          <b>{{ r.cos.toFixed(2) }}</b
          ><span>cosine similarity (−1 to 1)</span>
        </div>
      </div>
    </div>
    <p class="cap">
      {{ r.verdict }} Each fruit is described by three hand-picked numbers. An LLM learns thousands
      of numbers per token, and nobody picks what they mean.
    </p>
  `,
})
export class FruitSimilarityWidget {
  protected readonly fruits = FRUITS;
  protected readonly features = FEATURES;
  protected readonly pick = signal<[number, number]>([0, 1]);
  protected choose(side: number, i: number) {
    this.pick.update((p) => (side === 0 ? [i, p[1]] : [p[0], i]));
  }
  protected readonly result = computed(() => {
    const [a, b] = this.pick().map((i) => FRUITS[i]);
    const d = dot(a[1], b[1]);
    const cos = d / (norm(a[1]) * norm(b[1]));
    const working = a[1].map((x, i) => `${x}×${b[1][i]}`).join(' + ');
    const verdict =
      a[0] === b[0]
        ? 'A fruit compared with itself always scores a cosine of exactly 1.'
        : cos > 0.9
          ? `${a[0]} and ${b[0]} point in almost the same direction: very similar.`
          : cos > 0.6
            ? `${a[0]} and ${b[0]} are somewhat similar.`
            : `${a[0]} and ${b[0]} point in quite different directions: not very similar.`;
    return { dot: d, cos, working, verdict: verdict[0].toUpperCase() + verdict.slice(1) };
  });
}
