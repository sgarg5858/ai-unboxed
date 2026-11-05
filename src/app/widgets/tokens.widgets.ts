import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { f2, heatCell, signCell, vis } from '../shared/lib/format';
import { TOK } from '../shared/lib/toy-model';
import { tokenize } from '../shared/lib/tokenizer';
import { Slider } from '../shared/slider/slider';

@Component({
  selector: 'w-tokenizer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <label for="tokin" class="cap" style="display:block;margin-bottom:6px">Your text</label>
      <textarea
        id="tokin"
        rows="2"
        [value]="text()"
        (input)="text.set($any($event.target).value)"
      ></textarea>
      <div class="row" style="margin-top:12px">
        @for (t of tokens(); track $index) {
          <span class="chip"
            >{{ vis(t[0]) }}<small>{{ t[1] }}</small></span
          >
        }
      </div>
      <div class="stat" style="margin-top:12px">
        <div>
          <b>{{ tokens().length }}</b
          ><span>tokens</span>
        </div>
        <div>
          <b>{{ ratio() }}</b
          ><span>characters per token</span>
        </div>
      </div>
    </div>
  `,
})
export class TokenizerWidget {
  readonly props = input<{ initial?: string }>({});
  protected readonly text = linkedSignal(() => this.props().initial ?? '');
  protected readonly tokens = computed(() => tokenize(this.text()));
  protected readonly ratio = computed(() =>
    this.tokens().length ? (this.text().length / this.tokens().length).toFixed(1) : '0',
  );
  protected readonly vis = vis;
}

@Component({
  selector: 'w-embedding-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <div class="row">
        @for (t of toks; track $index) {
          <button class="btn" [class.on]="$index === sel()" (click)="sel.set($index)">
            {{ t[0] }} · {{ t[1] }}
          </button>
        }
      </div>
      <div class="scroll" style="margin-top:12px">
        <table class="matrix">
          <tr>
            <th>row</th>
            @for (c of cols; track c) {
              <th>d{{ c }}</th>
            }
            <th>…</th>
          </tr>
          @for (r of rows; track r[0]; let ri = $index) {
            <tr>
              <th>{{ r[0] }} {{ r[1] }}</th>
              @for (c of cols; track c) {
                <td [style]="r[0] === toks[sel()][1] ? heat : 'color:var(--muted)'">
                  {{ val(r[0], c) }}
                </td>
              }
              <td style="color:var(--muted)">…</td>
            </tr>
            @if (ri === 0 || ri === 4) {
              <tr>
                <th>⋮</th>
                <td colspan="6" style="color:var(--muted);text-align:left">⋮</td>
              </tr>
            }
          }
        </table>
      </div>
    </div>
  `,
})
export class EmbeddingTableWidget {
  protected readonly toks: [string, number][] = [
    ['I', 40],
    ['␣am', 939],
    ['␣learning', 6975],
    ['␣artificial', 21075],
  ];
  protected readonly rows: [number, string][] = [
    [0, '!'],
    [40, 'I'],
    [939, '␣am'],
    [6975, '␣learning'],
    [21075, '␣artificial'],
    [50256, '<eot>'],
  ];
  protected readonly cols = [0, 1, 2, 3, 4];
  protected readonly sel = signal(2);
  protected readonly heat = heatCell(0.6);
  protected val = (r: number, c: number) => f2(Math.sin(r * 0.013 + c * 1.9) * 0.6);
}

@Component({
  selector: 'w-embedding-geometry',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <svg
        viewBox="0 0 420 240"
        width="100%"
        role="img"
        aria-label="Embedding space with parallel gender arrows and a fruit cluster"
      >
        <defs>
          <marker
            id="ah"
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
          x1="70"
          y1="170"
          x2="185"
          y2="170"
          stroke="var(--heat)"
          stroke-width="1.6"
          marker-end="url(#ah)"
        />
        <line
          x1="95"
          y1="60"
          x2="210"
          y2="60"
          stroke="var(--heat)"
          stroke-width="1.6"
          marker-end="url(#ah)"
        />
        <line
          x1="72"
          y1="160"
          x2="92"
          y2="72"
          stroke="var(--accent)"
          stroke-width="1.2"
          stroke-dasharray="4 3"
          marker-end="url(#ah)"
        />
        @for (p of points; track p[2]) {
          <circle
            [attr.cx]="p[0]"
            [attr.cy]="p[1]"
            r="5"
            [attr.fill]="p[0] > 280 ? 'var(--pos)' : 'var(--accent)'"
          />
          <text class="lbl" [attr.x]="p[0]" [attr.y]="p[1] + 20" text-anchor="middle">
            {{ p[2] }}
          </text>
        }
        <text x="120" y="120">royalty</text>
        <text x="110" y="190">same "gender" direction</text>
      </svg>
    </div>
  `,
})
export class EmbeddingGeometryWidget {
  protected readonly points: [number, number, string][] = [
    [70, 170, 'man'],
    [195, 170, 'woman'],
    [95, 60, 'king'],
    [220, 60, 'queen'],
    [320, 140, 'apple'],
    [352, 168, 'banana'],
    [300, 178, 'carrot'],
  ];
}

@Component({
  selector: 'w-positional-heatmap',
  styleUrl: './positional-heatmap.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <div class="hm" style="grid-template-columns:repeat(32,minmax(0,1fr))">
        @for (c of cells; track $index) {
          <div [style]="c"></div>
        }
      </div>
      <div class="legend" style="margin-top:10px">
        <span><i style="background:var(--pos)"></i>positive</span>
        <span><i style="background:var(--neg)"></i>negative</span>
        <span>rows: position 0–23 · columns: dims 0–31</span>
      </div>
    </div>
  `,
})
export class PositionalHeatmapWidget {
  protected readonly cells = Array.from({ length: 24 * 32 }, (_, n) => {
    const p = Math.floor(n / 32),
      i = n % 32,
      k = Math.floor(i / 2);
    return signCell((i % 2 ? Math.cos : Math.sin)(p / Math.pow(10000, (2 * k) / 32)));
  });
}

@Component({
  selector: 'w-rope',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Slider],
  host: { class: 'contents' },
  template: `
    @let g = geo();
    <div class="panel">
      <svg
        viewBox="0 0 240 240"
        width="100%"
        style="max-width:300px;display:block;margin:0 auto"
        role="img"
        aria-label="Rotated query and key vectors"
      >
        <defs>
          <marker
            id="ra"
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
        <circle cx="120" cy="120" r="90" fill="none" stroke="var(--line)" />
        <line
          x1="120"
          y1="120"
          [attr.x2]="g.q[0]"
          [attr.y2]="g.q[1]"
          stroke="var(--accent)"
          stroke-width="2.5"
          marker-end="url(#ra)"
        />
        <line
          x1="120"
          y1="120"
          [attr.x2]="g.k[0]"
          [attr.y2]="g.k[1]"
          stroke="var(--heat)"
          stroke-width="2.5"
          marker-end="url(#ra)"
        />
        <text
          class="lbl"
          [attr.x]="120 + (g.q[0] - 120) * 1.17"
          [attr.y]="120 + (g.q[1] - 120) * 1.17"
          text-anchor="middle"
        >
          q
        </text>
        <text
          class="lbl"
          [attr.x]="120 + (g.k[0] - 120) * 1.17"
          [attr.y]="120 + (g.k[1] - 120) * 1.17"
          text-anchor="middle"
        >
          k
        </text>
      </svg>
      <app-slider label="query pos m" [min]="0" [max]="12" [(value)]="m" />
      <app-slider label="key pos n" [min]="0" [max]="12" [(value)]="n" />
      <p class="cap" style="margin-top:8px">
        m − n = {{ m() - n() }} · q·k = {{ g.dot }} (depends only on the gap)
      </p>
    </div>
  `,
})
export class RopeWidget {
  protected readonly m = signal(2);
  protected readonly n = signal(5);
  protected readonly geo = computed(() => {
    const a = this.m() * 0.45,
      b = this.n() * 0.45 + 0.3;
    const pt = (ang: number) => [120 + 90 * Math.cos(ang), 120 - 90 * Math.sin(ang)];
    return { q: pt(a), k: pt(b), dot: Math.cos(a - b).toFixed(3) };
  });
}

@Component({
  selector: 'w-residual-matrix',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="panel">
      @for (t of rows; track $index) {
        <div class="row" style="flex-wrap:nowrap;margin:4px 0">
          <span class="mono" style="width:96px;flex:0 0 auto">{{ t.label }}</span>
          <div style="display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:3px;flex:1">
            @for (c of t.cells; track $index) {
              <div style="height:18px;border-radius:3px" [style]="c"></div>
            }
          </div>
        </div>
      }
      <div class="shape" style="margin-top:12px">x : [1, 4, 4096] · batch, tokens, d_model</div>
    </div>
  `,
})
export class ResidualMatrixWidget {
  protected readonly rows = TOK.map((t, i) => ({
    label: vis(t),
    cells: Array.from(
      { length: 10 },
      (_, k) => 'height:18px;border-radius:3px;' + signCell(Math.sin(i * 2.3 + k * 1.4) * 0.9),
    ),
  }));
}

type LetterCountProps = {
  word?: string;
  letter?: string;
  /** How a tokenizer splits the word; the pieces must join back into the word. */
  pieces?: string[];
  /** Illustrative IDs, one per piece. */
  ids?: number[];
};

/** Why counting letters is hard: the model gets token IDs, not the letters inside them. */
@Component({
  selector: 'w-letter-count',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <div class="row" role="tablist" aria-label="View" style="margin-bottom:14px">
        @for (v of views; track v.id) {
          <button
            class="btn"
            role="tab"
            [class.on]="view() === v.id"
            [attr.aria-selected]="view() === v.id"
            (click)="view.set(v.id)"
          >
            {{ v.label }}
          </button>
        }
      </div>

      @if (view() === 'model') {
        <div class="row" [attr.aria-label]="'Tokens: ' + pieces().join(', ')">
          @for (p of pieces(); track $index) {
            <span class="chip"
              >{{ p }}<small>{{ ids()[$index] }}</small></span
            >
          }
        </div>
        <p class="cap" style="margin:12px 0 0">
          The model receives only the numbers: <b class="mono">[{{ ids().join(', ') }}]</b>. The
          letters inside each chunk are hidden from it.
        </p>
      } @else if (view() === 'spelled') {
        <div class="row" [attr.aria-label]="'Letters: ' + letters().join(' ')">
          @for (ch of letters(); track $index) {
            <span class="chip" [class.hot]="ch === target()" [class.dim]="ch !== target()">{{
              ch
            }}</span>
          }
        </div>
        <p class="cap" style="margin:12px 0 0">
          Now each letter is its own token, so every <b>{{ target() }}</b> is visible and can be
          counted.
        </p>
      } @else {
        <p class="cap" style="margin:0 0 8px">
          <b>1. Think first.</b> Before answering, the model writes the word out, one letter per
          token. Each letter it writes becomes something it can read.
        </p>
        <div class="row" [attr.aria-label]="'Letters written so far: ' + written().join(' ')">
          @for (ch of letters(); track $index) {
            @if ($index < step()) {
              <span
                class="chip"
                [class.hot]="ch === target()"
                [class.dim]="ch !== target()"
                [style.outline]="$index === step() - 1 ? '2px solid var(--accent)' : null"
                style="outline-offset: 2px"
                >{{ ch }}<small>{{ ch === target() ? tally()[$index] : '&nbsp;' }}</small></span
              >
            } @else {
              <span class="chip dim" aria-hidden="true" style="opacity: 0.4"
                >&nbsp;<small>&nbsp;</small></span
              >
            }
          }
        </div>
        <p class="cap" aria-live="polite" style="margin:10px 0 0; min-height: 1.5em">
          <span [innerHTML]="thought()"></span>
        </p>
        <div class="row" style="margin-top:10px">
          <button class="btn" [disabled]="done()" (click)="step.set(step() + 1)">
            {{ step() === 0 ? 'Start writing' : 'Write next letter' }}
          </button>
          <button class="btn" [disabled]="done()" (click)="step.set(letters().length)">
            Finish
          </button>
          <button class="btn" [disabled]="step() === 0" (click)="step.set(0)">Restart</button>
        </div>
        <details class="spell-why" style="margin-top:12px">
          <summary class="cap" style="cursor:pointer">
            <b>How does it know the spelling?</b>
          </summary>
          <p class="cap" style="margin:8px 0 6px">
            It memorised how each chunk is spelled, from all the spelled-out words in its training
            text:
          </p>
          <div class="row" style="gap:6px 14px">
            @for (p of pieces(); track $index) {
              <span class="cap mono"
                ><span class="chip">{{ p }}</span> → {{ p.split('').join(' ') }}</span
              >
            }
          </div>
          <ul class="cap" style="margin:8px 0 0; padding-left:18px">
            <li>Writing the next letter needs one small fact at a time. That's easy.</li>
            <li>
              Counting in one go needs every spelling recalled and added up at once. That's where it
              guesses.
            </li>
            <li>Reasoning models are trained to write it out first because that gets it right.</li>
          </ul>
        </details>
        <p class="cap" style="margin:14px 0 8px">
          <b>2. Or use a tool.</b> Run code, which sees every character.
        </p>
        <div class="row">
          <span class="chip mono">"{{ word() }}".count("{{ target() }}")</span>
          <span class="chip hot">→ {{ count() }}</span>
        </div>
      }

      <div class="stat" style="margin-top:14px">
        <div>
          <b>{{
            view() === 'model'
              ? pieces().length
              : view() === 'modern'
                ? step() + ' / ' + letters().length
                : letters().length
          }}</b
          ><span>{{
            view() === 'modern' ? 'letters written so far' : 'tokens the model reads'
          }}</span>
        </div>
        <div>
          <b>{{ view() === 'model' ? '?' : view() === 'modern' ? countSoFar() : count() }}</b
          ><span>{{
            view() === 'modern'
              ? done()
                ? 'final answer: correct'
                : target() + "'s counted so far"
              : target() + "'s it can see"
          }}</span>
        </div>
      </div>
    </div>
  `,
})
export class LetterCountWidget {
  readonly props = input<LetterCountProps>({});
  protected readonly views = [
    { id: 'model', label: 'What the model sees' },
    { id: 'spelled', label: 'Spelled out' },
    { id: 'modern', label: 'How modern models do it' },
  ] as const;
  protected readonly view = signal<'model' | 'spelled' | 'modern'>('model');
  protected readonly word = computed(() => this.props().word ?? 'strawberry');
  protected readonly target = computed(() => this.props().letter ?? 'r');
  protected readonly pieces = computed(() => this.props().pieces ?? ['str', 'aw', 'berry']);
  protected readonly ids = computed(
    () => this.props().ids ?? this.pieces().map((_, i) => 1000 + i * 7919),
  );
  protected readonly letters = computed(() => [...this.word()]);
  protected readonly count = computed(
    () => this.letters().filter((c) => c === this.target()).length,
  );
  /** How many letters the model has written so far in the "think first" walkthrough. */
  protected readonly step = signal(0);
  protected readonly done = computed(() => this.step() >= this.letters().length);
  protected readonly written = computed(() => this.letters().slice(0, this.step()));
  protected readonly countSoFar = computed(
    () => this.written().filter((c) => c === this.target()).length,
  );
  /** One line describing what the model just did. Inline HTML. */
  protected readonly thought = computed(() => {
    const k = this.step();
    const t = this.target();
    if (k === 0) return 'The question is "how many ' + t + '\'s?". Press <b>Start writing</b>.';
    const ch = this.letters()[k - 1];
    const found =
      ch === t
        ? `Wrote <b>${ch}</b>. That's an ${t}, so the count is now <b>${this.countSoFar()}</b>.`
        : `Wrote <b>${ch}</b>. Not an ${t}.`;
    if (this.done())
      return `${found} That's every letter, so the answer is <b>${this.count()}</b>.`;
    return ch === t ? found : `${found} Keep going.`;
  });
  /** Running count at each matching letter: 1, 2, 3… */
  protected readonly tally = computed(() => {
    let n = 0;
    return this.letters().map((c) => (c === this.target() ? ++n : 0));
  });
}
