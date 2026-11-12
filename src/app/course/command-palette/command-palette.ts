import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { ChapterStore } from '../chapter-store';
import { CourseNav } from '../course-nav';
import { chapterNumber } from '../course-position';
import { SearchEntry, plain, searchSlides } from '../course-search';
import { ReadingProgress } from '../reading-progress';

type Item = {
  id: string;
  chapterId: string;
  slide: number;
  label: string;
  meta: string;
  seen: boolean;
  current: boolean;
};

/**
 * Search every slide in the course and jump to one, from the keyboard or by tapping.
 * Follows the WAI-ARIA combobox pattern: focus stays in the input, arrow keys move the
 * active option, Enter opens it and Escape closes the dialog.
 */
@Component({
  selector: 'app-command-palette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './command-palette.css',
  template: `
    <dialog #dialog aria-label="Search slides" (click)="closeOnBackdrop($event)">
      <div class="box">
        <div class="field">
          <span class="icon" aria-hidden="true">⌕</span>
          <input
            #input
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="cp-list"
            [attr.aria-activedescendant]="items()[active()]?.id ?? null"
            placeholder="Search every slide…"
            autocomplete="off"
            spellcheck="false"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
            (keydown)="onKey($event)"
          />
          <span class="kbd" aria-hidden="true">esc</span>
        </div>
        <p class="group" id="cp-label">{{ heading() }}</p>
        <ul id="cp-list" role="listbox" aria-labelledby="cp-label">
          @for (it of items(); track it.id; let i = $index) {
            <li
              [id]="it.id"
              role="option"
              [attr.aria-selected]="i === active()"
              [class.active]="i === active()"
              [class.current]="it.current"
              (mousemove)="active.set(i)"
              (click)="choose(it)"
            >
              <span class="mark" aria-hidden="true">{{
                it.current ? '●' : it.seen ? '✓' : ''
              }}</span>
              <span class="label">{{ it.label }}</span>
              <span class="meta">{{ it.meta }}</span>
              @if (it.current) {
                <span class="sr">(current slide)</span>
              } @else if (it.seen) {
                <span class="sr">(done)</span>
              }
            </li>
          } @empty {
            <li class="none" role="presentation">No slides match “{{ query() }}”.</li>
          }
        </ul>
        <p class="sr" aria-live="polite">{{ status() }}</p>
        <p class="hints" aria-hidden="true">
          <span><b>↑↓</b> move</span><span><b>↵</b> open</span><span><b>esc</b> close</span>
        </p>
      </div>
    </dialog>
  `,
})
export class CommandPalette {
  private readonly nav = inject(CourseNav);
  private readonly store = inject(ChapterStore);
  private readonly progress = inject(ReadingProgress);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  protected readonly query = signal('');

  /** Every loaded slide, in course order. Chapters load in the background soon after start. */
  private readonly entries = computed<SearchEntry[]>(() => {
    const loaded = this.store.loaded();
    return this.nav.sections.flatMap((sec, si) =>
      sec.chapters.flatMap((c, ci) =>
        (loaded.get(c.id)?.slides ?? []).map((s, i) => ({
          chapterId: c.id,
          chapterName: c.name,
          number: chapterNumber(this.nav.sections, si, ci),
          slide: i,
          title: s.title,
          summary: plain(s.summary ?? ''),
        })),
      ),
    );
  });

  protected readonly heading = computed(() =>
    this.query().trim() ? 'Results' : `In this chapter: ${this.nav.chapter().name}`,
  );

  protected readonly items = computed<Item[]>(() => {
    const here = this.nav.position();
    const hereId = this.nav.chapterRef().id;
    const list = this.query().trim()
      ? searchSlides(this.entries(), this.query())
      : this.entries().filter((e) => e.chapterId === hereId);
    return list.map((e) => ({
      id: `cp-${e.chapterId}-${e.slide}`,
      chapterId: e.chapterId,
      slide: e.slide,
      label: e.title,
      meta: `${e.number} ${e.chapterName} · ${e.slide + 1}`,
      seen: this.progress.has(e.chapterId, e.slide),
      current: e.chapterId === hereId && e.slide === here.slide,
    }));
  });

  /**
   * The highlighted option. A new query starts at the top; otherwise it stays on the same item
   * when the list refreshes (chapters keep loading in the background, ticks appear).
   */
  protected readonly active = linkedSignal<{ items: Item[]; q: string }, number>({
    source: () => ({ items: this.items(), q: this.query() }),
    computation: (src, prev) => {
      if (!prev || prev.source.q !== src.q) return 0;
      const id = prev.source.items[prev.value]?.id;
      return Math.max(
        0,
        src.items.findIndex((it) => it.id === id),
      );
    },
  });

  protected readonly status = computed(() => {
    if (!this.query().trim()) return '';
    const n = this.items().length;
    return n ? `${n} slide${n === 1 ? '' : 's'} found` : 'No slides found';
  });

  open() {
    this.query.set('');
    const d = this.dialog().nativeElement;
    if (!d.open) d.showModal?.();
    this.input().nativeElement.focus();
    // Start on the current slide, so arrows move from where the reader is.
    const i = this.items().findIndex((it) => it.current);
    if (i >= 0) this.active.set(i);
  }

  close() {
    this.dialog().nativeElement.close?.();
  }

  protected onKey(e: KeyboardEvent) {
    const n = this.items().length;
    if (!n) return;
    if (e.key === 'ArrowDown') this.active.update((i) => (i + 1) % n);
    else if (e.key === 'ArrowUp') this.active.update((i) => (i - 1 + n) % n);
    else if (e.key === 'Enter') this.choose(this.items()[this.active()]);
    else return;
    e.preventDefault();
    const id = this.items()[this.active()]?.id;
    if (id)
      this.dialog().nativeElement.querySelector(`#${id}`)?.scrollIntoView?.({ block: 'nearest' });
  }

  protected choose(it: Item | undefined) {
    if (!it) return;
    this.close();
    this.nav.goto(it.chapterId, it.slide).then(() => window.scrollTo?.({ top: 0 }));
  }

  /** A click on the dimmed backdrop lands on the <dialog> itself. */
  protected closeOnBackdrop(e: MouseEvent) {
    if (e.target === this.dialog().nativeElement) this.close();
  }
}
