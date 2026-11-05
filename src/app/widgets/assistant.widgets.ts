import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { erf, plotPath } from '../shared/lib/math';
import { Slider } from '../shared/slider/slider';

export interface PromptLayer {
  id: string;
  label: string;
  tokens: number;
  /** Stable layers can be served from the prompt cache while they form an unbroken prefix. */
  stable: boolean;
  text: string;
}

@Component({
  selector: 'w-prompt-assembly',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <div class="row" style="margin-bottom:12px">
        @for (l of props().layers; track l.id) {
          <button
            class="btn"
            [class.on]="on()[l.id]"
            [attr.aria-pressed]="on()[l.id]"
            (click)="toggle(l.id)"
          >
            {{ l.label }}
          </button>
        }
      </div>
      <div class="scroll">
        <pre
          class="code"
          style="white-space:pre-wrap;min-width:260px"
        >@for (l of active(); track l.id) {<span [style.color]="l.stable ? 'var(--code-key)' : 'var(--code-ink)'">{{ l.text }}</span>
}<span class="c">&lt;|assistant|&gt;   ← generation starts here</span></pre>
      </div>
      <div class="stat" style="margin-top:12px">
        <div>
          <b>{{ totals().total.toLocaleString() }}</b
          ><span>tokens in context</span>
        </div>
        <div>
          <b>{{ totals().cached.toLocaleString() }}{{ totals().pct }}</b
          ><span>cacheable stable prefix</span>
        </div>
      </div>
    </div>
  `,
})
export class PromptAssemblyWidget {
  readonly props = input.required<{ layers: PromptLayer[] }>();
  protected readonly on = linkedSignal(
    () =>
      Object.fromEntries(this.props().layers.map((l) => [l.id, true])) as Record<string, boolean>,
  );
  protected readonly active = computed(() => this.props().layers.filter((l) => this.on()[l.id]));
  protected readonly totals = computed(() => {
    let total = 0,
      cached = 0,
      broken = false;
    for (const l of this.active()) {
      total += l.tokens;
      if (l.stable && !broken) cached += l.tokens;
      else broken = true;
    }
    return { total, cached, pct: total ? ` (${Math.round((cached / total) * 100)}%)` : '' };
  });
  protected toggle(id: string) {
    this.on.update((o) => ({ ...o, [id]: !o[id] }));
  }
}

const above = (T: number, m: number, sd: number) => 0.5 * (1 - erf((T - m) / (sd * Math.SQRT2)));
const bell =
  (m: number, sd: number, h = 1) =>
  (x: number) =>
    h * Math.exp(-((x - m) ** 2) / (2 * sd * sd));
const csx = (x: number) => 20 + x * 360;
const csy = (y: number) => 160 - y * 130;

@Component({
  selector: 'w-classifier-threshold',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Slider],
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <app-slider
        label="block threshold"
        [min]="0.05"
        [max]="0.95"
        [step]="0.01"
        [(value)]="T"
        [format]="fix2"
      />
      <svg
        viewBox="0 0 400 190"
        width="100%"
        role="img"
        aria-label="Score distributions for benign and harmful requests with a movable threshold"
      >
        <rect
          [attr.x]="sx(T())"
          y="20"
          [attr.width]="sx(1) - sx(T())"
          height="140"
          fill="var(--neg)"
          opacity=".08"
        />
        <line x1="20" y1="160" x2="380" y2="160" stroke="var(--line)" />
        <path [attr.d]="benign" fill="none" stroke="var(--accent)" stroke-width="2" />
        <path [attr.d]="harmful" fill="none" stroke="var(--neg)" stroke-width="2" />
        <line
          [attr.x1]="sx(T())"
          y1="16"
          [attr.x2]="sx(T())"
          y2="160"
          stroke="var(--ink)"
          stroke-dasharray="4 3"
        />
        <text [attr.x]="sx(T()) + 5" y="28" class="lbl">block →</text>
        <text x="20" y="178">0 · looks safe</text>
        <text x="380" y="178" text-anchor="end">looks harmful · 1</text>
      </svg>
      <div class="legend">
        <span><i style="background:var(--accent)"></i>benign traffic</span>
        <span><i style="background:var(--neg)"></i>harmful traffic</span>
      </div>
      <div class="stat" style="margin-top:10px">
        <div>
          <b>{{ caught() }}</b
          ><span>harmful requests blocked</span>
        </div>
        <div>
          <b>{{ refused() }}</b
          ><span>benign requests refused</span>
        </div>
      </div>
    </div>
  `,
})
export class ClassifierThresholdWidget {
  protected readonly T = signal(0.5);
  protected readonly sx = csx;
  protected readonly fix2 = (v: number) => v.toFixed(2);
  protected readonly benign = plotPath(bell(0.3, 0.11), 0, 1, 100, csx, csy);
  protected readonly harmful = plotPath(bell(0.7, 0.12, 0.6), 0, 1, 100, csx, csy);
  protected readonly caught = computed(() => (above(this.T(), 0.7, 0.12) * 100).toFixed(1) + '%');
  protected readonly refused = computed(() => (above(this.T(), 0.3, 0.11) * 100).toFixed(2) + '%');
}

export interface Defense {
  id: string;
  label: string;
  /** Illustrative fraction of attacks this layer lets through. Listed in pipeline order. */
  miss: number;
  why: string;
}

@Component({
  selector: 'w-injection-defenses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    @let r = result();
    <div class="panel">
      <p class="cap" style="margin-bottom:6px">
        User: "{{ props().request }}" The fetched page contains:
      </p>
      <pre class="code" style="white-space:pre-wrap">{{ props().page[0] }}
<span style="color:var(--heat)">{{ props().page[1] }}</span></pre>
      <p class="cap" style="margin:12px 0 6px">Defenses (toggle):</p>
      <div class="row">
        @for (d of props().defenses; track d.id) {
          <button
            class="btn"
            [class.on]="on()[d.id]"
            [attr.aria-pressed]="!!on()[d.id]"
            (click)="toggle(d.id)"
          >
            {{ d.label }}
          </button>
        }
      </div>
      <div class="stat" style="margin-top:12px">
        <div>
          <b [style.color]="r.rate > 0.05 ? 'var(--neg)' : 'var(--pos)'">{{ r.rateText }}</b
          ><span>attack success (illustrative)</span>
        </div>
        <div>
          <b style="font-size:14px;line-height:1.5">{{
            r.first?.label ?? 'nothing: agent sends the data'
          }}</b
          ><span>first layer that stops it</span>
        </div>
      </div>
    </div>
    <p class="cap">
      {{
        r.first
          ? 'Here, ' + r.first.why + '. '
          : 'With no defenses, the model often obeys text that merely looks like an instruction. '
      }}Numbers multiply made-up per-layer miss rates and assume layers fail independently. Real
      ones are correlated, which is why labs red-team the whole system.
    </p>
  `,
})
export class InjectionDefensesWidget {
  readonly props = input.required<{
    request: string;
    page: string[];
    baseline: number;
    defenses: Defense[];
  }>();
  protected readonly on = signal<Record<string, boolean>>({});
  protected readonly result = computed(() => {
    let rate = this.props().baseline;
    let first: Defense | undefined;
    for (const d of this.props().defenses) {
      if (!this.on()[d.id]) continue;
      rate *= d.miss;
      first ??= d;
    }
    const rateText =
      rate === 0
        ? '0% (impossible)'
        : rate * 100 < 0.01
          ? '<0.01%'
          : (rate * 100).toPrecision(2) + '%';
    return { rate, rateText, first };
  });
  protected toggle(id: string) {
    this.on.update((o) => ({ ...o, [id]: !o[id] }));
  }
}
