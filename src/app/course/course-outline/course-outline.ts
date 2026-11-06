import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ChapterStore } from '../chapter-store';
import { CourseNav } from '../course-nav';
import { chapterNumber } from '../course-position';

/**
 * The whole course as a list: sections → chapters → slides of the current chapter.
 * Shown as a sidebar on wide screens and inside the Contents drawer on small ones.
 */
@Component({
  selector: 'app-course-outline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './course-outline.css',
  host: { style: 'display:block' },
  template: `
    <nav aria-label="Course contents">
      @for (sec of nav.sections; track sec.id; let si = $index) {
        <h2 class="sec">
          <span class="num">{{ pad(si + 1) }}</span
          >{{ sec.name }}
        </h2>
        <ol class="chapters">
          @for (c of sec.chapters; track c.id; let ci = $index) {
            @let current = c.id === nav.chapter().id;
            <li [class.current]="current">
              <button
                type="button"
                class="ch"
                [attr.aria-current]="current ? 'page' : null"
                (click)="openChapter(c.id)"
              >
                <span class="num">{{ number(si, ci) }}</span>
                <span class="name">{{ c.name }}</span>
                <span class="count"
                  >{{ current ? nav.position().slide + 1 + '/' : '' }}{{ count(c.id) }}</span
                >
              </button>
              @if (current) {
                <ol class="slides">
                  @for (s of nav.chapter().slides; track $index; let i = $index) {
                    <li>
                      <button
                        type="button"
                        [class.on]="i === nav.position().slide"
                        [attr.aria-current]="i === nav.position().slide ? 'step' : null"
                        (click)="openSlide(i)"
                      >
                        {{ s.title }}
                      </button>
                    </li>
                  }
                </ol>
              }
            </li>
          }
        </ol>
      }
    </nav>
  `,
})
export class CourseOutline {
  protected readonly nav = inject(CourseNav);
  private readonly store = inject(ChapterStore);
  /** Slide count, once that chapter has loaded (they all load in the background). */
  protected count(id: string) {
    return this.store.loaded().get(id)?.slides.length;
  }
  /** Fires after any jump, so a drawer can close itself. */
  readonly navigated = output<void>();

  protected readonly pad = (n: number) => String(n).padStart(2, '0');
  protected number(si: number, ci: number) {
    return chapterNumber(this.nav.sections, si, ci);
  }

  protected openChapter(id: string) {
    this.nav.goto(id).then(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    this.navigated.emit();
  }

  protected openSlide(i: number) {
    this.nav.gotoSlide(i);
    this.navigated.emit();
  }
}
