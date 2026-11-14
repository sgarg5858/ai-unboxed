import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Cell, MatrixTable } from '../shared/matrix-table/matrix-table';
import { f2, heatCell, signCell, vis } from '../shared/lib/format';
import { DIMS, IDS, TEXT, TOKENS, VOCAB, runWalkthrough } from '../shared/lib/walkthrough-model';

const W = runWalkthrough();
const ROWS = TOKENS.map((t, p) => `${p} ${vis(t)}`);
const STEPS: { name: string; cap: string }[] = [
  { name: 'Text', cap: 'This is all the model is given. It will predict the next word.' },
  { name: 'Tokens', cap: 'The tokenizer splits the text into tokens. ␣ marks a leading space.' },
  { name: 'IDs', cap: 'Each token becomes its number in GPT-2’s vocabulary of 50,257 tokens.' },
  {
    name: 'Embeddings',
    cap: 'Each ID picks a row from the embedding table. Both “to” rows are identical.',
  },
  {
    name: '+ Position',
    cap: 'A small position vector is added to each row. Now the two “to” rows differ.',
  },
  { name: 'Norm', cap: 'Each row is rescaled: average 0, spread 1.' },
  {
    name: 'Attention',
    cap: 'Each token looks back over earlier tokens (never ahead). Pick a token to see its row.',
  },
  {
    name: '+ Add',
    cap: 'Attention’s output is added to the input, not swapped in (a residual connection).',
  },
  {
    name: 'Feed-forward',
    cap: 'Each token goes through a small network on its own: expand, keep strong signals, shrink.',
  },
  {
    name: '+ Add',
    cap: 'Its output is added too. A real model repeats Norm → Add 12 times (GPT-2); this toy has 1.',
  },
  {
    name: 'Scores',
    cap: 'The last token’s vector is normalized and compared with every word in the vocabulary.',
  },
  { name: 'Prediction', cap: 'Softmax turns scores into probabilities. The model picks “money”.' },
];

/** Steps through one forward pass of a tiny model on "I went to bank to deposit". */
@Component({
  selector: 'w-walkthrough',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatrixTable, NgTemplateOutlet],
  host: { class: 'contents' },
  styles: `
    .steps {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin: 0 0 12px;
      padding: 0;
      list-style: none;
    }
    .steps button,
    .pick button {
      font: inherit;
      font-size: 12px;
      padding: 3px 8px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface);
      color: var(--muted);
      cursor: pointer;
    }
    .steps button[aria-current='step'],
    .pick button[aria-pressed='true'] {
      background: var(--accent-soft);
      border-color: var(--accent);
      color: var(--accent-ink);
      font-weight: 700;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 8px 0;
    }
    .chip {
      font-family: var(--f-mono);
      font-size: 13px;
      padding: 4px 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      text-align: center;
    }
    .chip small {
      display: block;
      color: var(--accent-ink);
      font-weight: 700;
    }
    .text {
      font-size: 18px;
      font-weight: 600;
      margin: 8px 0;
    }
    .pick {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin: 8px 0;
    }
    .bar {
      display: grid;
      grid-template-columns: 90px 1fr 48px;
      gap: 8px;
      align-items: center;
      font-size: 13px;
      margin: 3px 0;
    }
    .bar span:first-child {
      font-family: var(--f-mono);
    }
    .bar i {
      display: block;
      height: 12px;
      border-radius: 3px;
      background: var(--heat);
    }
    .bar.win i {
      background: var(--accent);
    }
    .nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
    }
  `,
  template: `
    @let s = step();
    <div class="panel">
      <ol class="steps" aria-label="Steps">
        @for (st of steps; track $index) {
          <li>
            <button
              type="button"
              [attr.aria-current]="$index === s ? 'step' : null"
              (click)="step.set($index)"
            >
              {{ $index + 1 }} {{ st.name }}
            </button>
          </li>
        }
      </ol>
      <p class="cap" aria-live="polite">
        <b>{{ s + 1 }} · {{ steps[s].name }}.</b> {{ steps[s].cap }}
      </p>
      @switch (s) {
        @case (0) {
          <p class="text">“{{ text }}”</p>
        }
        @case (1) {
          <div class="chips">
            @for (t of tokens; track $index) {
              <span class="chip">{{ vis(t) }}</span>
            }
          </div>
        }
        @case (2) {
          <div class="chips">
            @for (t of tokens; track $index) {
              <span class="chip"
                >{{ vis(t) }}<small>{{ ids[$index] }}</small></span
              >
            }
          </div>
        }
        @case (3) {
          <app-matrix-table [rows]="w.embed" [rowLabels]="rows" [colLabels]="dims" [cell]="num" />
        }
        @case (4) {
          <p class="cap">Position vectors</p>
          <app-matrix-table [rows]="w.pos" [rowLabels]="rows" [colLabels]="dims" [cell]="num" />
          <p class="cap">Embedding + position = the input</p>
          <app-matrix-table [rows]="w.x0" [rowLabels]="rows" [colLabels]="dims" [cell]="num" />
        }
        @case (5) {
          <app-matrix-table [rows]="w.norm1" [rowLabels]="rows" [colLabels]="dims" [cell]="num" />
        }
        @case (6) {
          <ng-container [ngTemplateOutlet]="picker" />
          <app-matrix-table [rows]="w.attn" [rowLabels]="rows" [colLabels]="rows" [cell]="att()" />
        }
        @case (7) {
          <app-matrix-table [rows]="w.x1" [rowLabels]="rows" [colLabels]="dims" [cell]="num" />
        }
        @case (8) {
          <ng-container [ngTemplateOutlet]="picker" />
          <p class="cap">Middle layer for {{ vis(tokens[tok()]) }} (6 cells; GPT-2 has 3,072)</p>
          @for (h of w.hidden[tok()]; track $index) {
            <div class="bar">
              <span>cell {{ $index + 1 }}</span
              ><i [style.width.%]="(h / 3) * 100"></i><span>{{ f2(h) }}</span>
            </div>
          }
          <p class="cap">Output added to {{ vis(tokens[tok()]) }}</p>
          <app-matrix-table
            [rows]="[w.ffnOut[tok()]]"
            [rowLabels]="[rows[tok()]]"
            [colLabels]="dims"
            [cell]="num"
          />
        }
        @case (9) {
          <app-matrix-table [rows]="w.x2" [rowLabels]="rows" [colLabels]="dims" [cell]="num" />
        }
        @case (10) {
          <app-matrix-table
            [rows]="scores"
            [rowLabels]="cands"
            [colLabels]="['score']"
            [cell]="num"
          />
        }
        @case (11) {
          @for (c of ranked; track c.token) {
            <div class="bar" [class.win]="$first">
              <span>{{ vis(c.token) }}</span
              ><i [style.width.%]="c.p * 100"></i><span>{{ pct(c.p) }}</span>
            </div>
          }
          <p class="text">“{{ text }} <b>money</b>”</p>
        }
      }
      <div class="nav">
        <button type="button" class="btn" [disabled]="s === 0" (click)="step.set(s - 1)">
          ← Back
        </button>
        <button type="button" class="btn" [disabled]="s === last" (click)="step.set(s + 1)">
          Next step →
        </button>
      </div>
    </div>
    <ng-template #picker>
      <div class="pick" role="group" aria-label="Token to inspect">
        @for (t of tokens; track $index) {
          <button type="button" [attr.aria-pressed]="tok() === $index" (click)="tok.set($index)">
            {{ $index }} {{ vis(t) }}
          </button>
        }
      </div>
    </ng-template>
  `,
})
export class WalkthroughWidget {
  protected readonly w = W;
  protected readonly steps = STEPS;
  protected readonly last = STEPS.length - 1;
  protected readonly text = TEXT;
  protected readonly tokens = TOKENS;
  protected readonly ids = IDS;
  protected readonly rows = ROWS;
  protected readonly dims = DIMS;
  /** Candidates, most likely first. */
  protected readonly ranked = VOCAB.map((c, i) => ({ token: c.token, p: W.probs[i] })).sort(
    (a, b) => b.p - a.p,
  );
  protected readonly cands = VOCAB.map((c) => vis(c.token));
  protected readonly scores = W.logits.map((l) => [l]);
  protected readonly vis = vis;
  protected readonly f2 = f2;
  protected readonly step = signal(0);
  protected readonly tok = signal(TOKENS.length - 1);
  protected readonly pct = (p: number) => (p * 100).toFixed(p < 0.01 ? 1 : 0) + '%';
  /** Colour strength is capped so light text stays readable on dark backgrounds. */
  protected readonly num = (v: number): Cell => ({
    text: f2(v),
    style: signCell(Math.max(-0.5, Math.min(0.5, v / 3))),
  });
  protected readonly att = computed(() => {
    const t = this.tok();
    return (v: number, i: number, j: number): Cell =>
      j > i
        ? { text: '·', style: 'background:var(--sunk);color:var(--muted)' }
        : {
            text: f2(v),
            style: heatCell(i === t ? v * 0.55 : v * 0.25) + (i === t ? ';font-weight:700' : ''),
          };
  });
}
