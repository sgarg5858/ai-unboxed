import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Goto, StageItem } from '../course/content.model';
import { CourseNav } from '../course/course-nav';
import { toneColor } from './tone';

/** Vertical list of labelled rows: pipelines, layers, timelines, message logs. */
@Component({
  selector: 'app-stages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'stack' },
  template: `
    @for (it of items(); track $index) {
      @if (it.spacer) {
        <div class="stage" style="background:transparent;border:0;box-shadow:none;padding:0 12px">
          <span [innerHTML]="it.label"></span><span class="mono">{{ it.value }}</span>
        </div>
      } @else {
        <div
          class="stage"
          [class.cur]="it.highlight"
          [style.opacity]="it.dim ? 0.5 : null"
          [attr.role]="it.goto ? 'button' : null"
          [attr.tabindex]="it.goto ? 0 : null"
          (click)="go(it.goto)"
          (keydown.enter)="go(it.goto)"
        >
          <span>
            <span [class.mono]="it.mono" [innerHTML]="it.label"></span>
            @if (it.sub) {
              <br /><span class="cap" [innerHTML]="it.sub"></span>
            }
          </span>
          <span
            class="mono"
            [style.color]="tone(it)"
            [style.text-decoration]="it.strike ? 'line-through' : null"
            >{{ it.value }}</span
          >
        </div>
      }
    }
  `,
})
export class Stages {
  readonly items = input.required<StageItem[]>();
  private readonly nav = inject(CourseNav);
  protected tone = (it: StageItem) => toneColor(it.tone);
  protected go(g?: Goto) {
    if (g) this.nav.goto(g.chapter, (g.slide ?? 1) - 1);
  }
}
