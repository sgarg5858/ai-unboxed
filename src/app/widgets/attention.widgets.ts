import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { bytes, f2, heatCell, human, signCell, vis } from '../shared/lib/format';
import { softmax } from '../shared/lib/math';
import { K, Q, S, TOK, V } from '../shared/lib/toy-model';
import { Cell, MatrixTable } from '../shared/matrix-table/matrix-table';
import { Slider } from '../shared/slider/slider';

const LABELS = TOK.map(vis);
const signed =
  (scale = 1) =>
  (v: number): Cell => ({ text: f2(v), style: signCell(v / scale) });
const masked = (causal: boolean) =>
  S.map((r, i) => r.map((v, j) => (causal && j > i ? -Infinity : v)));
const weightsOf = (causal: boolean) =>
  masked(causal).map((r) => softmax(r.map((v) => (v === -Infinity ? -1e9 : v))));

@Component({
  selector: 'w-attention-arcs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <svg
        viewBox="0 0 420 170"
        width="100%"
        role="img"
        aria-label="artificial attends to earlier tokens"
      >
        @for (a of arcs; track $index) {
          <path
            [attr.d]="a.d"
            fill="none"
            stroke="var(--heat)"
            [attr.stroke-width]="a.w"
            [attr.stroke-opacity]="a.o"
          />
        }
        @for (t of boxes; track $index) {
          <rect
            [attr.x]="t.x - 42"
            y="124"
            width="84"
            height="30"
            rx="6"
            [attr.fill]="t.hot ? 'var(--heat-soft)' : 'var(--surface)'"
            [attr.stroke]="t.hot ? 'var(--heat)' : 'var(--line)'"
          />
          <text class="lbl" [attr.x]="t.x" y="143" text-anchor="middle">{{ t.label }}</text>
        }
      </svg>
      <p class="cap">
        The query from "artificial" matches the key of "learning" best, so most of its new vector
        comes from "learning".
      </p>
    </div>
  `,
})
export class AttentionArcsWidget {
  protected readonly arcs = [
    [0.08, 60],
    [0.12, 150],
    [0.62, 250],
  ].map(([w, x]) => ({
    d: `M ${x} 120 Q ${(x + 350) / 2} ${120 - (350 - x) * 0.42} 350 120`,
    w: (1 + w * 8).toFixed(1),
    o: (0.35 + w).toFixed(2),
  }));
  protected readonly boxes = TOK.map((t, i) => ({
    x: [60, 150, 250, 350][i],
    label: vis(t),
    hot: i === 3,
  }));
}

@Component({
  selector: 'w-qkv-matrices',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatrixTable],
  host: { class: 'contents' },
  template: `
    <div class="panel stack">
      @for (m of mats; track m.name) {
        <p class="cap">{{ m.name }} = X · W{{ m.name.toLowerCase() }}</p>
        <app-matrix-table [rows]="m.data" [rowLabels]="labels" [colLabels]="m.cols" [cell]="cell" />
      }
    </div>
  `,
})
export class QkvMatricesWidget {
  protected readonly labels = LABELS;
  protected readonly cell = signed();
  protected readonly mats = [
    { name: 'Q', data: Q, cols: ['q0', 'q1', 'q2'] },
    { name: 'K', data: K, cols: ['k0', 'k1', 'k2'] },
    { name: 'V', data: V, cols: ['v0', 'v1', 'v2'] },
  ];
}

@Component({
  selector: 'w-score-matrix',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatrixTable],
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <p class="cap" style="margin-bottom:8px">S = Q·Kᵀ / √3 (rows = queries, columns = keys)</p>
      <app-matrix-table [rows]="S" [rowLabels]="labels" [colLabels]="labels" [cell]="cell" />
    </div>
  `,
})
export class ScoreMatrixWidget {
  protected readonly S = S;
  protected readonly labels = LABELS;
  protected readonly cell = signed(1.5);
}

@Component({
  selector: 'w-causal-mask',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatrixTable],
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <div class="row" style="margin-bottom:12px">
        <button class="btn" [class.on]="causal()" (click)="causal.set(true)">
          Causal (GPT-style)
        </button>
        <button class="btn" [class.on]="!causal()" (click)="causal.set(false)">
          Bidirectional (BERT-style)
        </button>
      </div>
      <app-matrix-table [rows]="rows()" [rowLabels]="labels" [colLabels]="labels" [cell]="cell" />
    </div>
  `,
})
export class CausalMaskWidget {
  protected readonly causal = signal(true);
  protected readonly rows = computed(() => masked(this.causal()));
  protected readonly labels = LABELS;
  protected readonly cell = (v: number): Cell =>
    v === -Infinity
      ? { text: '−∞', style: 'background:var(--surface);color:var(--muted)' }
      : { text: f2(v), style: signCell(v / 1.5) };
}

@Component({
  selector: 'w-attention-weights',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatrixTable],
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <div class="row" style="margin-bottom:12px">
        @for (t of labels; track $index) {
          <button class="btn" [class.on]="$index === q()" (click)="q.set($index)">{{ t }}</button>
        }
      </div>
      <app-matrix-table [rows]="W" [rowLabels]="labels" [colLabels]="labels" [cell]="cell()" />
      <div style="margin-top:12px">
        @for (w of W[q()]; track $index) {
          <div class="bar">
            <span>{{ labels[$index] }}</span>
            <div class="t"><i [style.width.%]="w * 100" style="background:var(--heat)"></i></div>
            <span>{{ (w * 100).toFixed(0) }}%</span>
          </div>
        }
      </div>
      <div class="shape">out[{{ labels[q()] }}] = [{{ out() }}]</div>
    </div>
  `,
})
export class AttentionWeightsWidget {
  protected readonly W = weightsOf(true);
  protected readonly labels = LABELS;
  protected readonly q = signal(3);
  protected readonly cell = computed(() => {
    const q = this.q();
    return (v: number, i: number): Cell => ({
      text: f2(v),
      style: heatCell(v) + (i === q ? ';outline:1.5px solid var(--accent)' : ';opacity:.55'),
    });
  });
  protected readonly out = computed(() => {
    const r = this.W[this.q()];
    return V[0].map((_, c) => f2(r.reduce((s, w, j) => s + w * V[j][c], 0))).join(', ');
  });
}

const HEAD_LABELS = ['<s>', 'I', '␣am', '␣learning', '␣artificial', '␣intellig.'];
const headMatrix = (f: (i: number, j: number) => number) =>
  Array.from({ length: 6 }, (_, i) => {
    const r = Array.from({ length: 6 }, (_, j) => (j > i ? 0 : f(i, j) + 0.04));
    const s = r.reduce((a, b) => a + b, 0);
    return r.map((x) => x / s);
  });

@Component({
  selector: 'w-attention-heads',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatrixTable],
  host: { class: 'contents' },
  template: `
    @let h = heads[i()];
    <div class="panel">
      <div class="row" style="margin-bottom:12px">
        @for (x of heads; track $index) {
          <button class="btn" [class.on]="$index === i()" (click)="i.set($index)">
            Head {{ $index + 1 }}
          </button>
        }
      </div>
      <app-matrix-table [rows]="h.m" [rowLabels]="labels" [colLabels]="labels" [cell]="cell" />
      <p class="cap" style="margin-top:10px">
        <b style="font-weight:500;color:var(--ink)">{{ h.name }}.</b> {{ h.cap }}
      </p>
    </div>
  `,
})
export class AttentionHeadsWidget {
  protected readonly labels = HEAD_LABELS;
  protected readonly i = signal(0);
  protected readonly heads = [
    {
      name: 'Previous token',
      m: headMatrix((i, j) => (j === i - 1 ? 1 : 0)),
      cap: 'Each token looks at the one right before it. Builds n-gram-like features.',
    },
    {
      name: 'Attention sink',
      m: headMatrix((i, j) => (j === 0 ? 1 : 0)),
      cap: 'Weight parks on the first token when nothing else is useful.',
    },
    {
      name: 'Self / local',
      m: headMatrix((i, j) => (j === i ? 0.8 : i - j === 1 ? 0.3 : 0)),
      cap: 'Stays close to itself and its neighbour.',
    },
    {
      name: 'Semantic',
      m: headMatrix((i, j) =>
        i === 5 && j === 4
          ? 1
          : i === 4 && j === 3
            ? 0.9
            : i === 3 && j === 1
              ? 0.6
              : j === i
                ? 0.2
                : 0,
      ),
      cap: '"intellig." reads "artificial"; "artificial" reads "learning".',
    },
  ];
  protected readonly cell = (v: number, i: number, j: number): Cell =>
    j > i
      ? { text: '', style: 'background:var(--surface)' }
      : { text: v > 0.05 ? f2(v) : '', style: heatCell(v) };
}

const CTX = [1024, 2048, 4096, 8192, 16384, 32768, 131072, 1048576];

@Component({
  selector: 'w-attention-cost',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Slider],
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <app-slider label="context n" [min]="1" [max]="8" [(value)]="v" [format]="fmt" />
      <div class="stat" style="margin-top:12px">
        <div>
          <b>{{ squares() }}</b
          ><span>scores per head per layer</span>
        </div>
        <div>
          <b>{{ mem() }}</b
          ><span>naive fp16 score matrix, 32 heads</span>
        </div>
      </div>
      <p class="cap" style="margin-top:10px">
        Naive memory for one layer's scores. FlashAttention avoids storing this at all.
      </p>
    </div>
  `,
})
export class AttentionCostWidget {
  protected readonly v = signal(3);
  protected readonly fmt = (v: number) => CTX[v - 1].toLocaleString();
  protected readonly squares = computed(() => human(CTX[this.v() - 1] ** 2));
  protected readonly mem = computed(() => bytes(CTX[this.v() - 1] ** 2 * 2 * 32));
}
