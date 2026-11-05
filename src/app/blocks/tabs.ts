import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  linkedSignal,
} from '@angular/core';
import { Block } from '../course/content.model';
import { BlockList } from './block-list';

/** Buttons that switch between alternative views, each a list of blocks. */
@Component({
  selector: 'app-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [forwardRef(() => BlockList)],
  host: { style: 'display:block' },
  template: `
    <div class="row" role="tablist" style="margin-bottom:12px">
      @for (t of tabs(); track $index) {
        <button
          class="btn"
          role="tab"
          [class.on]="$index === active()"
          [attr.aria-selected]="$index === active()"
          (click)="active.set($index)"
        >
          {{ t.label }}
        </button>
      }
    </div>
    <app-blocks [blocks]="current()" [nested]="true" />
  `,
})
export class Tabs {
  readonly tabs = input.required<{ label: string; blocks: Block[] }[]>();
  readonly selected = input(0);
  protected readonly active = linkedSignal(() => this.selected());
  protected readonly current = computed(() => this.tabs()[this.active()]?.blocks ?? []);
}
