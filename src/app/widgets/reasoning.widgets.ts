import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Slider } from '../shared/slider/slider';

type Task = 'hard' | 'easy';

/** Thinking budgets offered by the slider, in tokens. */
const BUDGETS = [0, 500, 1_000, 2_000, 4_000, 8_000, 16_000, 32_000];
/** Illustrative speed and price, roughly typical for a large hosted model. */
const TOKENS_PER_SECOND = 100;
const DOLLARS_PER_MILLION = 10;

/**
 * Illustrative accuracy curves: hard problems improve with more thinking but with diminishing
 * returns; easy ones barely change.
 */
const accuracy = (task: Task, tokens: number) =>
  task === 'hard'
    ? 20 + 65 * (1 - Math.exp(-tokens / 6_000))
    : 94 + 2 * (1 - Math.exp(-tokens / 500));

/** Trade-off between thinking longer and answering faster and cheaper. */
@Component({
  selector: 'w-thinking-budget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Slider],
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <div class="row" role="tablist" aria-label="Question type" style="margin-bottom:12px">
        @for (t of tasks; track t.id) {
          <button
            class="btn"
            role="tab"
            [class.on]="task() === t.id"
            [attr.aria-selected]="task() === t.id"
            (click)="task.set(t.id)"
          >
            {{ t.label }}
          </button>
        }
      </div>
      <app-slider
        label="Thinking budget"
        [min]="0"
        [max]="budgets.length - 1"
        [(value)]="index"
        [format]="fmtBudget"
      />
      <svg
        viewBox="0 0 320 130"
        role="img"
        [attr.aria-label]="'Accuracy ' + acc() + ' percent at ' + fmtBudget(index())"
        style="width:100%;height:auto;margin-top:10px;display:block"
      >
        <line x1="30" y1="110" x2="310" y2="110" stroke="var(--line)" />
        <line x1="30" y1="10" x2="30" y2="110" stroke="var(--line)" />
        <text x="24" y="14" text-anchor="end" font-size="9" fill="var(--muted)">100%</text>
        <text x="24" y="113" text-anchor="end" font-size="9" fill="var(--muted)">0%</text>
        <text x="170" y="126" text-anchor="middle" font-size="9" fill="var(--muted)">
          more thinking →
        </text>
        <polyline [attr.points]="curve()" fill="none" stroke="var(--accent)" stroke-width="2.5" />
        <circle [attr.cx]="dot().x" [attr.cy]="dot().y" r="6" fill="var(--heat)" />
      </svg>
      <div class="stat" style="margin-top:10px">
        <div>
          <b>{{ acc() }}%</b
          ><span>{{ task() === 'hard' ? 'hard problems solved' : 'answered correctly' }}</span>
        </div>
        <div>
          <b>{{ wait() }}</b
          ><span>extra wait before the answer</span>
        </div>
        <div>
          <b>{{ cost() }}</b
          ><span>extra cost per question</span>
        </div>
      </div>
    </div>
  `,
})
export class ThinkingBudgetWidget {
  protected readonly tasks = [
    { id: 'hard', label: 'Hard maths problem' },
    { id: 'easy', label: '"Capital of France?"' },
  ] as const;
  protected readonly budgets = BUDGETS;
  protected readonly task = signal<Task>('hard');
  protected readonly index = signal(0);
  protected readonly tokens = computed(() => BUDGETS[this.index()]);

  protected readonly fmtBudget = (i: number) =>
    BUDGETS[i] === 0 ? 'none' : BUDGETS[i].toLocaleString('en-GB') + ' tokens';

  protected readonly acc = computed(() => Math.round(accuracy(this.task(), this.tokens())));
  protected readonly wait = computed(() => {
    const s = this.tokens() / TOKENS_PER_SECOND;
    return s === 0 ? '0 s' : s < 60 ? `${Math.round(s)} s` : `${(s / 60).toFixed(1)} min`;
  });
  protected readonly cost = computed(() => {
    const d = (this.tokens() / 1e6) * DOLLARS_PER_MILLION;
    return d === 0 ? '$0' : d < 0.01 ? '<1¢' : `${Math.round(d * 100)}¢`;
  });

  /** Plot accuracy against budget position, evenly spaced like the slider. */
  private readonly point = (i: number) => ({
    x: 30 + (i / (BUDGETS.length - 1)) * 280,
    y: 110 - accuracy(this.task(), BUDGETS[i]),
  });
  protected readonly curve = computed(() =>
    BUDGETS.map((_, i) => this.point(i))
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' '),
  );
  protected readonly dot = computed(() => this.point(this.index()));
}
