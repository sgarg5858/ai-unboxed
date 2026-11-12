import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationExtras, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { SECTIONS } from '../../content/course';
import { COURSE_CHAPTERS, ChapterStore } from './chapter-store';
import { ChapterContent, SectionContent } from './content.model';
import { Position, chapterNumber, resolvePosition, step, toPath } from './course-position';

/**
 * The URL is the single source of truth for which slide is showing. The route resolver has
 * loaded the current chapter before NavigationEnd, so its content is always available here.
 */
@Injectable({ providedIn: 'root' })
export class CourseNav {
  private readonly router = inject(Router);
  private readonly store = inject(ChapterStore);
  readonly chapters = inject(COURSE_CHAPTERS);
  readonly sections: readonly SectionContent[] = SECTIONS;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Slides in the chapter at this index, or 1 if it hasn't loaded yet. */
  private readonly count = (i: number) =>
    this.store.loaded().get(this.chapters[i].id)?.slides.length ?? 1;

  readonly position = computed<Position>(() =>
    resolvePosition(this.chapters, this.url(), this.count),
  );
  readonly chapterRef = computed(() => this.chapters[this.position().chapter]);
  readonly chapter = computed(
    () => this.store.loaded().get(this.chapterRef().id) as ChapterContent,
  );
  readonly sectionIndex = computed(() =>
    Math.max(
      0,
      this.sections.findIndex((s) => s.chapters.some((c) => c.id === this.chapterRef().id)),
    ),
  );
  readonly section = computed(() => this.sections[this.sectionIndex()]);
  /** e.g. "2.3" for the current chapter. */
  readonly chapterNumber = computed(() =>
    chapterNumber(
      this.sections,
      this.sectionIndex(),
      this.section().chapters.findIndex((c) => c.id === this.chapterRef().id),
    ),
  );
  readonly slide = computed(() => this.chapter().slides[this.position().slide]);
  readonly isFirst = computed(() => this.position().chapter === 0 && this.position().slide === 0);
  readonly isLast = computed(
    () =>
      this.position().chapter === this.chapters.length - 1 &&
      this.position().slide === this.chapter().slides.length - 1,
  );
  readonly nextLabel = computed(() => {
    const p = this.position();
    if (p.slide < this.chapter().slides.length - 1) return 'Next';
    return this.isLast() ? 'Back to start' : 'Next chapter';
  });
  /** Where Next leads: the next slide's title, the next chapter's name, or the course start. */
  readonly nextHint = computed(() => {
    const p = this.position();
    const slides = this.chapter().slides;
    if (p.slide < slides.length - 1) return slides[p.slide + 1].title;
    return this.isLast() ? this.chapters[0].name : this.chapters[p.chapter + 1].name;
  });

  goto(chapterId: string, slideIndex = 0) {
    const c = Math.max(
      0,
      this.chapters.findIndex((ch) => ch.id === chapterId),
    );
    return this.router.navigate(toPath(this.chapters, { chapter: c, slide: slideIndex }));
  }

  /** Pass { replaceUrl: true } to follow the reader's scrolling without filling the history. */
  gotoSlide(slideIndex: number, extras?: NavigationExtras) {
    return this.router.navigate(
      toPath(this.chapters, { ...this.position(), slide: slideIndex }),
      extras,
    );
  }

  async step(dir: 1 | -1) {
    const p = this.position();
    // Going back from a chapter's first slide needs the previous chapter's length.
    if (dir < 0 && p.slide === 0 && p.chapter > 0) {
      await this.store.load(this.chapters[p.chapter - 1].id);
    }
    return this.router.navigate(toPath(this.chapters, step(this.chapters, p, dir, this.count)));
  }
}
