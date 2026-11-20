import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { f2, signCell } from '../shared/lib/format';
import { plotPath } from '../shared/lib/math';
import {
  ACTIVATIONS,
  ActivationName,
  DETECTORS,
  FEATURES,
  TOKENS,
  runMlp,
} from '../shared/lib/mlp';
import { Slider } from '../shared/slider/slider';

type Step = 'expand' | 'bend' | 'shrink';
const WORDS = Object.keys(TOKENS);

/** Bar from the centre: right for positive, left for negative, full width at ±2. */
const bar = (v: number) => {
  const w = Math.min(1, Math.abs(v) / 2) * 50;
  return { left: v >= 0 ? 50 : 50 - w, width: w, pos: v >= 0 };
};

/**
 * The toy MLP, one step at a time: expand into detector scores, bend them with an activation,
 * then shrink back and add to the token's vector. Pick a token to run it on.
 */
@Component({
  selector: 'w-mlp-steps',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  styles: `
    .rows {
      display: grid;
      grid-template-columns: minmax(0, 11rem) minmax(0, 1fr) 3.2rem;
      gap: 6px 10px;
      align-items: center;
      font-size: 13.5px;
    }
    .track {
      position: relative;
      height: 14px;
      border-radius: 4px;
      background: var(--sunk);
    }
    .track::after {
      content: '';
      position: absolute;
      left: 50%;
      top: -2px;
      bottom: -2px;
      width: 1px;
      background: var(--line);
    }
    .fill {
      position: absolute;
      top: 0;
      bottom: 0;
      border-radius: 4px;
    }
    .num {
      font: 600 13px var(--f-mono);
      text-align: right;
    }
    .lab {
      color: var(--muted);
    }
    .lab.on {
      color: var(--ink);
      font-weight: 700;
    }
    table {
      border-collapse: collapse;
      font: 600 13px var(--f-mono);
      width: 100%;
    }
    th,
    td {
      padding: 6px 8px;
      text-align: right;
    }
    th:first-child,
    td:first-child {
      text-align: left;
      font-family: var(--f-sans, inherit);
    }
    th {
      color: var(--muted);
      font-weight: 600;
    }
  `,
  template: `
    @let r = run();
    <div class="panel">
      <div class="row" style="margin-bottom:12px" role="group" aria-label="Token">
        @for (w of words; track w) {
          <button
            type="button"
            class="btn"
            [class.on]="word() === w"
            [attr.aria-pressed]="word() === w"
            (click)="word.set(w)"
          >
            {{ w }}
          </button>
        }
        @if (props().step === 'bend') {
          <span style="flex:1"></span>
          @for (a of acts; track a) {
            <button
              type="button"
              class="btn"
              [class.on]="act() === a"
              [attr.aria-pressed]="act() === a"
              (click)="act.set(a)"
            >
              {{ a }}
            </button>
          }
        }
      </div>
      @switch (props().step) {
        @case ('expand') {
          <div class="rows" role="list" aria-label="Detector scores">
            @for (d of detectors; track d.label; let i = $index) {
              @let b = bar(r.h[i]);
              <span class="lab" [class.on]="r.h[i] > 0" role="listitem">{{ d.label }}</span>
              <span class="track" aria-hidden="true"
                ><span
                  class="fill"
                  [style.left.%]="b.left"
                  [style.width.%]="b.width"
                  [style.background]="b.pos ? 'var(--pos)' : 'var(--neg)'"
                ></span
              ></span>
              <span class="num">{{ f2(r.h[i]) }}</span>
            }
          </div>
          <p class="cap">
            4 numbers in, 6 detector scores out. A positive score means the pattern is there. GPT-2
            does the same with 768 numbers in and 3,072 detectors.
          </p>
        }
        @case ('bend') {
          <div class="rows" role="list" aria-label="Scores after the activation">
            @for (d of detectors; track d.label; let i = $index) {
              @let b = bar(r.a[i]);
              <span class="lab" [class.on]="r.a[i] > 0.05" role="listitem">{{ d.label }}</span>
              <span class="track" aria-hidden="true"
                ><span
                  class="fill"
                  [style.left.%]="b.left"
                  [style.width.%]="b.width"
                  [style.background]="b.pos ? 'var(--pos)' : 'var(--neg)'"
                ></span
              ></span>
              <span class="num">{{ f2(r.a[i]) }}</span>
            }
          </div>
          <p class="cap">
            @if (act() === 'GELU') {
              GELU keeps the detectors that fired and squashes the rest close to 0, letting a little
              through: “{{ detectors[4].label }}” gives {{ f2(r.a[4]) }} for “it”.
            } @else {
              ReLU keeps the detectors that fired and cuts every negative score to exactly 0.
            }
          </p>
        }
        @case ('shrink') {
          <table>
            <caption class="sr-only">
              The token's vector before and after the MLP adds its result
            </caption>
            <thead>
              <tr>
                <th scope="col">feature</th>
                <th scope="col">before</th>
                <th scope="col">MLP adds</th>
                <th scope="col">after</th>
              </tr>
            </thead>
            <tbody>
              @for (f of features; track f; let j = $index) {
                <tr>
                  <td>{{ f }}</td>
                  <td>{{ f2(x()[j]) }}</td>
                  <td [style]="cell(r.y[j])">{{ (r.y[j] >= 0 ? '+' : '') + f2(r.y[j]) }}</td>
                  <td>{{ f2(r.out[j]) }}</td>
                </tr>
              }
            </tbody>
          </table>
          <p class="cap">
            Each detector that fired writes its own small vector back. They're added up (6 → 4
            numbers) and added to the token. Run “it”: the MLP adds “animal”.
          </p>
        }
      }
    </div>
  `,
})
export class MlpStepsWidget {
  readonly props = input.required<{ step: Step }>();
  protected readonly words = WORDS;
  protected readonly acts = ['GELU', 'ReLU'] as const;
  protected readonly detectors = DETECTORS;
  protected readonly features = FEATURES;
  protected readonly f2 = f2;
  protected readonly bar = bar;
  protected readonly cell = (v: number) => signCell(v * 2);
  protected readonly word = signal('it');
  protected readonly act = signal<'GELU' | 'ReLU'>('GELU');
  protected readonly x = computed(() => TOKENS[this.word()]);
  protected readonly run = computed(() => runMlp(this.x(), ACTIVATIONS[this.act()]));
}

const COLORS: Record<ActivationName, string> = {
  ReLU: 'var(--muted)',
  GELU: 'var(--accent)',
  SiLU: 'var(--heat)',
};
const NAMES = Object.keys(ACTIVATIONS) as ActivationName[];
const px = (x: number) => 40 + ((x + 3) / 6) * 340;
const py = (y: number) => 170 - ((y + 0.5) / 3.5) * 150;

/** ReLU, GELU and SiLU drawn together, with a slider to read all three at the same input. */
@Component({
  selector: 'w-activation-probe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Slider],
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <svg
        viewBox="0 0 400 200"
        width="100%"
        role="img"
        [attr.aria-label]="'ReLU, GELU and SiLU curves. At input ' + x() + ': ' + readout()"
      >
        <line x1="40" [attr.y1]="py(0)" x2="380" [attr.y2]="py(0)" stroke="var(--line)" />
        <line [attr.x1]="px(0)" y1="18" [attr.x2]="px(0)" y2="172" stroke="var(--line)" />
        @for (t of ticks; track t) {
          <text [attr.x]="px(t)" y="190" text-anchor="middle" font-size="11" fill="var(--muted)">
            {{ t }}
          </text>
        }
        <line
          [attr.x1]="px(x())"
          y1="18"
          [attr.x2]="px(x())"
          y2="172"
          stroke="var(--ink)"
          stroke-dasharray="3 4"
          stroke-opacity="0.5"
        />
        @for (c of curves; track c.name) {
          <path [attr.d]="c.d" fill="none" [attr.stroke]="c.color" stroke-width="2.4" />
          <circle [attr.cx]="px(x())" [attr.cy]="py(c.f(x()))" r="4.5" [attr.fill]="c.color" />
        }
      </svg>
      <app-slider label="input" [min]="-3" [max]="3" [step]="0.5" [(value)]="x" />
      <div class="stat" style="margin-top:10px">
        @for (c of curves; track c.name) {
          <div>
            <b [style.color]="c.color === 'var(--muted)' ? 'var(--ink)' : c.ink">{{
              f3(c.f(x()))
            }}</b>
            <span>{{ c.name }}</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class ActivationProbeWidget {
  protected readonly x = signal(-1);
  protected readonly ticks = [-3, -2, -1, 0, 1, 2, 3];
  protected readonly px = px;
  protected readonly py = py;
  protected readonly f3 = (v: number) => (Math.abs(v) < 0.0005 ? 0 : v).toFixed(3);
  protected readonly curves = NAMES.map((name) => ({
    name,
    f: ACTIVATIONS[name],
    color: COLORS[name],
    ink: name === 'GELU' ? 'var(--accent-ink)' : 'var(--heat-ink)',
    d: plotPath(ACTIVATIONS[name], -3, 3, 90, px, py),
  }));
  protected readonly readout = computed(() =>
    this.curves.map((c) => `${c.name} ${this.f3(c.f(this.x()))}`).join(', '),
  );
}
