import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { Block, StageItem } from '../course/content.model';
import { BlockList } from './block-list';
import { Stages } from './stages';

type Step = { item?: StageItem; blocks?: Block[]; caption?: string };

/** Click-through sequence. With `accumulate`, each step appends a row to a growing list. */
@Component({
  selector: 'app-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [forwardRef(() => BlockList), Stages],
  host: { style: 'display:block' },
  template: `
    @if (accumulate()) {
      <app-stages [items]="items()" />
    } @else {
      <app-blocks [blocks]="steps()[i()].blocks ?? []" [nested]="true" />
    }
    <div class="row" style="margin-top:12px">
      <button class="btn on" (click)="next()" [disabled]="accumulate() && atEnd()">
        {{ label() }}
      </button>
      @if (!atEnd() || accumulate()) {
        <button class="btn" (click)="i.set(0)">Reset</button>
      }
    </div>
    @if (steps()[i()].caption; as c) {
      <p class="cap" style="margin-top:10px" [innerHTML]="c"></p>
    }
  `,
})
export class Stepper {
  readonly steps = input.required<Step[]>();
  readonly accumulate = input(false);
  readonly nextLabel = input('Next step');
  readonly restartLabel = input('Reset');
  protected readonly i = signal(0);
  protected readonly atEnd = computed(() => this.i() >= this.steps().length - 1);
  protected readonly label = computed(() =>
    this.atEnd() && !this.accumulate() ? this.restartLabel() : this.nextLabel(),
  );
  protected readonly items = computed(() =>
    this.steps()
      .slice(0, this.i() + 1)
      .map((s, k) => ({ ...(s.item as StageItem), highlight: k === this.i() })),
  );
  protected next() {
    this.i.set(this.atEnd() ? (this.accumulate() ? this.i() : 0) : this.i() + 1);
  }
}
