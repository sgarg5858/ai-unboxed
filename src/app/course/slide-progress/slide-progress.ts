import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CourseNav } from '../course-nav';

/** One button per slide in the current chapter; shows progress and jumps to a slide. */
@Component({
  selector: 'app-slide-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './slide-progress.css',
  host: { style: 'display:block' },
  template: `
    <nav class="progress" aria-label="Slides in this chapter">
      @let count = nav.chapter().slides.length;
      @let current = nav.position().slide;
      @for (s of nav.chapter().slides; track $index; let i = $index) {
        <button
          type="button"
          [class.done]="i < current"
          [class.current]="i === current"
          [attr.aria-current]="i === current ? 'step' : null"
          [attr.aria-label]="'Slide ' + (i + 1) + ' of ' + count + ': ' + s.title"
          [title]="i + 1 + '. ' + s.title"
          (click)="nav.gotoSlide(i)"
        ></button>
      }
    </nav>
  `,
})
export class SlideProgress {
  protected readonly nav = inject(CourseNav);
}
