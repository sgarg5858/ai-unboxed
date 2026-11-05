import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Slider } from '../shared/slider/slider';

/**
 * 100 arbitrary facts from the training data. The share seen exactly once sets a floor on the
 * errors a pretrained model should be expected to make on facts like these
 * (Kalai, Nachum, Vempala and Zhang, "Why Language Models Hallucinate", 2025).
 */
@Component({
  selector: 'w-singleton-rate',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Slider],
  host: { class: 'contents' },
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(10, minmax(0, 1fr));
      gap: 4px;
      margin: 12px 0;
    }
    .cell {
      aspect-ratio: 1;
      border-radius: 4px;
      background: var(--accent-soft);
      border: 1px solid var(--accent);
    }
    .cell.once {
      background: var(--heat);
      border-color: var(--heat);
    }
  `,
  template: `
    <div class="panel">
      <app-slider label="seen once" [min]="0" [max]="50" [(value)]="pct" [format]="fmt" />
      <div
        class="grid"
        role="img"
        [attr.aria-label]="pct() + ' of 100 facts were seen exactly once in training'"
      >
        @for (c of cells; track $index) {
          <div class="cell" [class.once]="c < pct()"></div>
        }
      </div>
      <div class="legend">
        <span><i style="background:var(--heat)"></i>seen exactly once</span>
        <span
          ><i style="background:var(--accent-soft);border:1px solid var(--accent)"></i>seen many
          times</span
        >
      </div>
      <div class="stat" style="margin-top:12px">
        <div>
          <b>{{ pct() }} of 100</b><span>facts the model saw only once</span>
        </div>
        <div>
          <b>at least ≈ {{ pct() }}%</b><span>expected error when asked about them</span>
        </div>
      </div>
    </div>
    <p class="cap">
      Illustrative. The bound applies to arbitrary facts with no learnable pattern, such as
      birthdays, and to a model that has only been pretrained.
    </p>
  `,
})
export class SingletonRateWidget {
  protected readonly pct = signal(20);
  protected readonly fmt = (v: number) => v + '%';
  /** A fixed scatter: 37 is coprime with 100, so this visits every index 0..99 exactly once. */
  protected readonly cells = Array.from({ length: 100 }, (_, i) => (i * 37) % 100);
}

type Rule = { label: string; penalty: number };
const RULES: Rule[] = [
  { label: 'Accuracy only: wrong = 0', penalty: 0 },
  { label: 'Wrong = −1', penalty: 1 },
  { label: 'Wrong = −3 (answer only if ≥ 75% sure)', penalty: 3 },
];

/** Expected score of guessing vs saying "I don't know" under different grading rules. */
@Component({
  selector: 'w-guess-or-abstain',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Slider],
  host: { class: 'contents' },
  template: `
    @let r = result();
    <div class="panel">
      <p class="cap" style="margin-bottom:6px">How the test is graded</p>
      <div class="row" style="margin-bottom:12px">
        @for (g of rules; track g.label) {
          <button class="btn" [class.on]="rule() === g" (click)="rule.set(g)">{{ g.label }}</button>
        }
      </div>
      <app-slider label="chance right" [min]="0" [max]="100" [(value)]="p" [format]="fmt" />
      <div class="stat" style="margin-top:12px">
        <div [style.outline]="r.guess > 0 ? '2px solid var(--pos)' : null">
          <b>{{ r.guess.toFixed(2) }}</b
          ><span>expected score if it guesses</span>
        </div>
        <div [style.outline]="r.guess < 0 ? '2px solid var(--pos)' : null">
          <b>0.00</b><span>expected score if it says “I don't know”</span>
        </div>
      </div>
      <p style="margin:12px 0 0">
        <b>{{ r.verdict }}</b>
      </p>
      <p class="cap" style="margin-top:4px">{{ r.why }}</p>
    </div>
  `,
})
export class GuessOrAbstainWidget {
  protected readonly rules = RULES;
  protected readonly rule = signal(RULES[0]);
  protected readonly p = signal(30);
  protected readonly fmt = (v: number) => v + '%';
  protected readonly result = computed(() => {
    const p = this.p() / 100;
    const k = this.rule().penalty;
    const guess = p - (1 - p) * k;
    const breakEven = k / (1 + k);
    if (k === 0) {
      return {
        guess,
        verdict: guess > 0 ? 'Best move: guess.' : 'Guessing costs nothing, so it never loses.',
        why: 'A wrong answer costs nothing, so guessing is never worse than abstaining. A model tuned to maximise this score learns to always answer, however unsure it is.',
      };
    }
    return {
      guess,
      verdict:
        guess > 0 ? 'Best move: guess.' : guess < 0 ? "Best move: say “I don't know”." : 'A tie.',
      why: `With this rule, guessing only pays when the chance of being right is above ${(breakEven * 100).toFixed(0)}% (the penalty ÷ (1 + penalty)). Below that, abstaining scores higher.`,
    };
  });
}
