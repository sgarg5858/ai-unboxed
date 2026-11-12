import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { ChapterStore } from '../chapter-store';
import { CourseNav } from '../course-nav';
import { chapterNumber } from '../course-position';
import { ReadingProgress } from '../reading-progress';

/**
 * Chapters with expandable slide lists and reading progress. The sidebar shows only the current
 * section (the section tabs switch it); the Contents drawer on small screens shows every section.
 */
@Component({
  selector: 'app-course-outline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './course-outline.css',
  host: { style: 'display:block' },
  template: `
    <nav [attr.aria-label]="scope() === 'section' ? nav.section().name : 'Course contents'">
      @for (sec of sections(); track sec.id) {
        @if (scope() === 'section') {
          <div class="sechead">
            <p class="eyebrow">Section {{ sec.num }}</p>
            <h2>{{ sec.name }}</h2>
            @if (sec.total) {
              <p class="secprog">
                <span class="bar" aria-hidden="true"
                  ><i [style.width.%]="(sec.read / sec.total) * 100"></i
                ></span>
                {{ sec.read }} of {{ sec.total }} slides done
              </p>
            }
          </div>
        } @else {
          <h2 class="sec">
            <span class="num">{{ sec.num }}</span
            >{{ sec.name }}
          </h2>
        }
        <ol class="chapters">
          @for (c of sec.chapters; track c.id) {
            @let open = isOpen(c.id);
            <li [class.current]="c.current">
              <div class="row">
                <button
                  type="button"
                  class="ch"
                  [attr.aria-current]="c.current ? 'page' : null"
                  (click)="openChapter(c.id)"
                >
                  <span class="num">{{ c.number }}</span>
                  <span class="name">{{ c.name }}</span>
                  @if (c.total) {
                    <span class="count" [class.done]="c.read >= c.total">
                      <span aria-hidden="true">{{
                        c.read >= c.total ? '✓' : c.read ? c.read + '/' + c.total : c.total
                      }}</span>
                      <span class="sr">, {{ c.read }} of {{ c.total }} slides done</span>
                    </span>
                  }
                </button>
                <button
                  type="button"
                  class="chev"
                  [class.up]="open"
                  [attr.aria-expanded]="open"
                  [attr.aria-controls]="'slides-' + c.id"
                  [attr.aria-label]="(open ? 'Hide' : 'Show') + ' slides in ' + c.name"
                  (click)="toggle(c.id)"
                >
                  <span aria-hidden="true">›</span>
                </button>
              </div>
              @if (open) {
                <ol class="slides" [id]="'slides-' + c.id">
                  @for (s of slidesOf(c.id); track $index; let i = $index) {
                    @let here = c.current && i === nav.position().slide;
                    @let done = progress.has(c.id, i);
                    <li class="srow">
                      <button
                        type="button"
                        class="sbtn"
                        [class.on]="here"
                        [attr.aria-current]="here ? 'step' : null"
                        [title]="s.title"
                        (click)="openSlide(c.id, i)"
                      >
                        <span class="n">{{ i + 1 }}</span>
                        <span class="st">{{ s.title }}</span>
                      </button>
                      <button
                        type="button"
                        class="check"
                        role="checkbox"
                        [class.done]="done"
                        [attr.aria-checked]="done"
                        [attr.aria-label]="'Done: ' + s.title"
                        [title]="done ? 'Marked done. Click to undo' : 'Mark as done'"
                        (click)="progress.toggle(c.id, i)"
                      >
                        <svg viewBox="0 0 16 16" aria-hidden="true">
                          <circle cx="8" cy="8" r="6.5" />
                          @if (done) {
                            <path d="M5 8.2 7 10.2 11 6" />
                          }
                        </svg>
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
  protected readonly progress = inject(ReadingProgress);
  private readonly store = inject(ChapterStore);
  /** "section": only the current section (sidebar). "all": every section (Contents drawer). */
  readonly scope = input<'section' | 'all'>('all');
  /** Fires after any jump, so a drawer can close itself. */
  readonly navigated = output<void>();

  /** Which chapters show their slides. Resets to just the current chapter when it changes. */
  private readonly expanded = linkedSignal<string, ReadonlySet<string>>({
    source: () => this.nav.chapterRef().id,
    computation: (id) => new Set([id]),
  });

  protected readonly sections = computed(() => {
    const loaded = this.store.loaded();
    const here = this.nav.chapterRef().id;
    const all = this.nav.sections.map((sec, si) => {
      const chapters = sec.chapters.map((c, ci) => ({
        id: c.id,
        name: c.name,
        number: chapterNumber(this.nav.sections, si, ci),
        current: c.id === here,
        total: loaded.get(c.id)?.slides.length ?? 0,
        read: this.progress.count(c.id),
      }));
      return {
        id: sec.id,
        name: sec.name,
        num: String(si + 1).padStart(2, '0'),
        chapters,
        total: chapters.reduce((n, c) => n + c.total, 0),
        read: chapters.reduce((n, c) => n + Math.min(c.read, c.total), 0),
      };
    });
    return this.scope() === 'section' ? [all[this.nav.sectionIndex()]] : all;
  });

  protected isOpen(id: string) {
    return this.expanded().has(id);
  }

  protected slidesOf(id: string) {
    return this.store.loaded().get(id)?.slides ?? [];
  }

  protected toggle(id: string) {
    if (this.isOpen(id)) {
      this.expanded.update((s) => new Set([...s].filter((x) => x !== id)));
      return;
    }
    // Other chapters usually have loaded in the background already; if not, load first.
    this.store.load(id).then(() => this.expanded.update((s) => new Set(s).add(id)));
  }

  protected openChapter(id: string) {
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.nav.goto(id).then(() => window.scrollTo?.({ top: 0, behavior: calm ? 'auto' : 'smooth' }));
    this.navigated.emit();
  }

  protected openSlide(chapterId: string, i: number) {
    this.nav.goto(chapterId, i).then(() => window.scrollTo?.({ top: 0 }));
    this.navigated.emit();
  }
}
