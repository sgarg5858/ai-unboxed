import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { bytes, human } from '../shared/lib/format';
import { plotPath } from '../shared/lib/math';
import { Slider } from '../shared/slider/slider';

@Component({
  selector: 'w-residual-stream',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <svg
        viewBox="0 0 360 300"
        width="100%"
        style="max-width:420px;display:block;margin:0 auto"
        role="img"
        aria-label="Residual stream with attention and MLP adding into it"
      >
        <defs>
          <marker
            id="rs"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M1 1L8 5L1 9" fill="none" stroke="context-stroke" stroke-width="1.6" />
          </marker>
        </defs>
        <line
          x1="90"
          y1="285"
          x2="90"
          y2="18"
          stroke="var(--accent)"
          stroke-width="6"
          stroke-opacity=".35"
        />
        <line
          x1="90"
          y1="285"
          x2="90"
          y2="16"
          stroke="var(--accent)"
          stroke-width="1.5"
          marker-end="url(#rs)"
        />
        @for (s of subs; track s.name) {
          <path
            [attr.d]="'M 90 ' + (s.y + 30) + ' L 170 ' + (s.y + 30)"
            fill="none"
            stroke="var(--muted)"
            stroke-width="1.2"
            marker-end="url(#rs)"
          />
          <rect
            x="172"
            [attr.y]="s.y + 8"
            width="150"
            height="44"
            rx="8"
            fill="var(--surface)"
            stroke="var(--line)"
          />
          <text class="lbl" x="247" [attr.y]="s.y + 27" text-anchor="middle">{{ s.name }}</text>
          <text x="247" [attr.y]="s.y + 43" text-anchor="middle">{{ s.sub }}</text>
          <path
            [attr.d]="'M 247 ' + (s.y + 8) + ' L 247 ' + (s.y - 6) + ' L 104 ' + (s.y - 6)"
            fill="none"
            stroke="var(--heat)"
            stroke-width="1.4"
            marker-end="url(#rs)"
          />
          <circle cx="90" [attr.cy]="s.y - 6" r="9" fill="var(--surface)" stroke="var(--heat)" />
          <text class="lbl" x="90" [attr.y]="s.y - 2" text-anchor="middle">+</text>
        }
        <text x="20" y="290">x in</text>
        <text x="20" y="22">x out</text>
      </svg>
    </div>
  `,
})
export class ResidualStreamWidget {
  protected readonly subs = [
    { y: 200, name: 'Attention', sub: 'norm → attn' },
    { y: 95, name: 'MLP', sub: 'norm → mlp' },
  ];
}

const RMS_BASE = [3.2, -1.1, 0.4, 5.0, -2.6, 0.9];

@Component({
  selector: 'w-rms-norm',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <ng-template #bars let-values let-max="max">
      @for (v of values; track $index) {
        <div
          style="display:grid;grid-template-columns:1fr 1fr;align-items:center;height:16px;margin:3px 0"
        >
          <div style="display:flex;justify-content:flex-end">
            @if (v < 0) {
              <i
                style="display:block;height:12px;background:var(--neg);border-radius:3px 0 0 3px"
                [style.width.%]="(-v / max) * 100"
              ></i>
            }
          </div>
          <div>
            @if (v >= 0) {
              <i
                style="display:block;height:12px;background:var(--pos);border-radius:0 3px 3px 0"
                [style.width.%]="(v / max) * 100"
              ></i>
            }
          </div>
        </div>
      }
    </ng-template>
    <div class="panel">
      <div class="row" style="margin-bottom:12px">
        <button class="btn" [class.on]="scale() === 1" (click)="scale.set(1)">Input ×1</button>
        <button class="btn" [class.on]="scale() === 10" (click)="scale.set(10)">Input ×10</button>
      </div>
      @let d = data();
      <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px">
        <div>
          <p class="cap">input x · rms = {{ d.rms.toFixed(1) }}</p>
          <ng-container *ngTemplateOutlet="bars; context: { $implicit: d.x, max: 55 }" />
        </div>
        <div>
          <p class="cap">rms_norm(x)</p>
          <ng-container *ngTemplateOutlet="bars; context: { $implicit: d.y, max: 2 }" />
        </div>
      </div>
    </div>
  `,
  imports: [NgTemplateOutlet],
})
export class RmsNormWidget {
  protected readonly scale = signal(1);
  protected readonly data = computed(() => {
    const x = RMS_BASE.map((v) => v * this.scale());
    const rms = Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length);
    return { x, y: x.map((v) => v / rms), rms };
  });
}
const ACT: Record<string, { f: (x: number) => number; color: string }> = {
  ReLU: { f: (x) => Math.max(0, x), color: 'var(--muted)' },
  GELU: {
    f: (x) => 0.5 * x * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x ** 3))),
    color: 'var(--accent)',
  },
  SiLU: { f: (x) => x / (1 + Math.exp(-x)), color: 'var(--heat)' },
};
const asx = (x: number) => 40 + ((x + 4) / 8) * 340;
const asy = (y: number) => 180 - ((y + 1) / 5) * 160;

@Component({
  selector: 'w-activations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <div class="row" style="margin-bottom:10px">
        @for (k of options; track k) {
          <button class="btn" [class.on]="sel() === k" (click)="sel.set(k)">
            {{ k === 'all' ? 'All' : k }}
          </button>
        }
      </div>
      <svg viewBox="0 0 400 220" width="100%" role="img" aria-label="Activation function curves">
        <line x1="40" [attr.y1]="y0" x2="380" [attr.y2]="y0" stroke="var(--line)" />
        <line [attr.x1]="x0" y1="20" [attr.x2]="x0" y2="180" stroke="var(--line)" />
        @for (t of xt; track t) {
          <text [attr.x]="sx(t)" y="198" text-anchor="middle">{{ t }}</text>
        }
        @for (t of yt; track t) {
          <text x="32" [attr.y]="sy(t) + 4" text-anchor="end">{{ t }}</text>
        }
        @for (c of curves(); track c.name) {
          <path [attr.d]="c.d" fill="none" [attr.stroke]="c.color" stroke-width="2.2" />
        }
      </svg>
      <div class="legend">
        @for (k of names; track k) {
          <span><i [style.background]="color(k)"></i>{{ k }}</span>
        }
      </div>
    </div>
  `,
})
export class ActivationsWidget {
  protected readonly names = Object.keys(ACT);
  protected readonly options = ['all', ...this.names];
  protected readonly sel = signal('all');
  protected readonly sx = asx;
  protected readonly sy = asy;
  protected readonly x0 = asx(0);
  protected readonly y0 = asy(0);
  protected readonly xt = [-4, -2, 0, 2, 4];
  protected readonly yt = [0, 2, 4];
  protected readonly color = (k: string) => ACT[k].color;
  protected readonly curves = computed(() =>
    this.names
      .filter((k) => this.sel() === 'all' || this.sel() === k)
      .map((k) => ({ name: k, color: ACT[k].color, d: plotPath(ACT[k].f, -4, 4, 80, asx, asy) })),
  );
}

const DIMS = [768, 1024, 2048, 4096, 5120, 8192, 12288];
const VOCABS = [32000, 50257, 100000, 128256, 256000];

@Component({
  selector: 'w-param-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Slider],
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <div class="row" style="margin-bottom:12px">
        @for (p of presets; track p.name) {
          <button class="btn" (click)="apply(p.v)">{{ p.name }}</button>
        }
      </div>
      <app-slider label="d_model" [min]="0" [max]="6" [(value)]="di" [format]="fmtD" />
      <app-slider label="layers N" [min]="2" [max]="120" [(value)]="L" />
      <app-slider label="vocab V" [min]="0" [max]="4" [(value)]="vi" [format]="fmtV" />
      <div class="stat" style="margin-top:12px">
        <div>
          <b>{{ fmtHuman(params()) }}</b
          ><span>parameters ≈ 12·N·d² + V·d</span>
        </div>
        <div>
          <b>{{ fmtBytes(params() * 2) }}</b
          ><span>weights in bf16 (4-bit: {{ fmtBytes(params() * 0.5) }})</span>
        </div>
      </div>
    </div>
  `,
})
export class ParamCounterWidget {
  protected readonly di = signal(0);
  protected readonly L = signal(12);
  protected readonly vi = signal(1);
  protected readonly presets = [
    { name: 'GPT-2 small', v: [0, 12, 1] },
    { name: '7B-class', v: [3, 32, 0] },
    { name: '70B-class', v: [5, 80, 3] },
  ];
  protected readonly fmtD = (v: number) => String(DIMS[v]);
  protected readonly fmtV = (v: number) => human(VOCABS[v]);
  protected readonly fmtHuman = human;
  protected readonly fmtBytes = bytes;
  protected readonly params = computed(() => {
    const d = DIMS[this.di()];
    return 12 * this.L() * d * d + VOCABS[this.vi()] * d;
  });
  protected apply([a, l, v]: number[]) {
    this.di.set(a);
    this.L.set(l);
    this.vi.set(v);
  }
}

@Component({
  selector: 'w-moe-router',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @let r = route();
    <div class="panel">
      <div class="row" style="margin-bottom:12px">
        @for (t of props().tokens; track $index) {
          <button class="btn" [class.on]="$index === t_()" (click)="t_.set($index)">{{ t }}</button>
        }
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px">
        @for (e of experts; track e) {
          @let on = e === r[0] || e === r[1];
          <div
            style="border-radius:8px;padding:10px 6px;text-align:center;font-family:var(--f-mono);font-size:12px;border:1px solid"
            [style.border-color]="on ? 'var(--heat)' : 'var(--line)'"
            [style.background]="on ? 'var(--heat-soft)' : 'var(--surface)'"
            [style.color]="on ? 'var(--ink)' : 'var(--muted)'"
          >
            expert {{ e }}<br />{{ e === r[0] ? 'w 0.71' : e === r[1] ? 'w 0.29' : 'idle' }}
          </div>
        }
      </div>
      <p class="cap" style="margin-top:12px">
        2 of 8 experts active: 25% of MLP compute per token, 100% of MLP weights in memory.
      </p>
    </div>
  `,
})
export class MoeRouterWidget {
  readonly props = input.required<{ tokens: string[] }>();
  protected readonly experts = [0, 1, 2, 3, 4, 5, 6, 7];
  protected readonly t_ = signal(0);
  /** Deterministic fake router: two distinct experts per token. */
  protected readonly route = computed(() => {
    const k = this.t_(),
      a = (k * 5 + 1) % 8,
      b = (k * 3 + 4) % 8;
    return [a, b === a ? (b + 1) % 8 : b];
  });
}
