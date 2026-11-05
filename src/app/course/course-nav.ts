import { computed, inject, Injectable, InjectionToken } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { COURSE, SECTIONS } from '../../content/course';
import { ChapterContent, SectionContent } from './content.model';
import { Position, resolvePosition, step, toPath } from './course-position';

export const COURSE_CONTENT = new InjectionToken<readonly ChapterContent[]>('COURSE_CONTENT', {
  providedIn: 'root',
  factory: () => COURSE,
});

/** The URL is the single source of truth for which slide is showing. */
@Injectable({ providedIn: 'root' })
export class CourseNav {
  private readonly router = inject(Router);
  readonly chapters = inject(COURSE_CONTENT);
  readonly sections: readonly SectionContent[] = SECTIONS;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly position = computed<Position>(() => resolvePosition(this.chapters, this.url()));
  readonly chapter = computed(() => this.chapters[this.position().chapter]);
  readonly sectionIndex = computed(() =>
    Math.max(
      0,
      this.sections.findIndex((s) => s.chapters.some((c) => c.id === this.chapter().id)),
    ),
  );
  readonly section = computed(() => this.sections[this.sectionIndex()]);
  readonly slide = computed(() => this.chapter().slides[this.position().slide]);
  readonly isFirst = computed(() => this.position().chapter === 0 && this.position().slide === 0);
  readonly isLast = computed(
    () =>
      this.position().chapter === this.chapters.length - 1 &&
      this.position().slide === this.chapter().slides.length - 1,
  );
  readonly nextLabel = computed(() => {
    const p = this.position();
    if (p.slide < this.chapter().slides.length - 1) return 'Next →';
    return this.isLast() ? 'Back to start ↺' : `Next: ${this.chapters[p.chapter + 1].name} →`;
  });

  goto(chapterId: string, slideIndex = 0) {
    const c = Math.max(
      0,
      this.chapters.findIndex((ch) => ch.id === chapterId),
    );
    return this.router.navigate(toPath(this.chapters, { chapter: c, slide: slideIndex }));
  }

  gotoSlide(slideIndex: number) {
    return this.router.navigate(toPath(this.chapters, { ...this.position(), slide: slideIndex }));
  }

  step(dir: 1 | -1) {
    return this.router.navigate(toPath(this.chapters, step(this.chapters, this.position(), dir)));
  }
}
