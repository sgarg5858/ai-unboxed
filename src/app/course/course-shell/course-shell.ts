import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  untracked,
  viewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ThemeSwitch } from '../../shared/theme/theme-switch';
import { ChapterStore } from '../chapter-store';
import { CommandPalette } from '../command-palette/command-palette';
import { ContentsDrawer } from '../contents-drawer/contents-drawer';
import { CourseNav } from '../course-nav';
import { CourseOutline } from '../course-outline/course-outline';
import { ModeSwitch } from '../mode-switch/mode-switch';
import { SectionTabs } from '../section-tabs/section-tabs';
import { SidebarState } from '../sidebar-state';
import { ShortcutsHelp } from '../shortcuts-help/shortcuts-help';
import { SidebarToggle } from '../sidebar-toggle/sidebar-toggle';
import { SlideView } from '../slide-view/slide-view';
import { ViewModeState } from '../view-mode';
import { WatchView } from '../watch-view/watch-view';

@Component({
  selector: 'app-course-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommandPalette,
    ContentsDrawer,
    CourseOutline,
    ModeSwitch,
    SectionTabs,
    ShortcutsHelp,
    SidebarToggle,
    SlideView,
    ThemeSwitch,
    WatchView,
  ],
  host: { '(document:keydown)': 'onKey($event)' },
  templateUrl: './course-shell.html',
  styleUrl: './course-shell.css',
})
export class CourseShell {
  protected readonly nav = inject(CourseNav);
  protected readonly sidebar = inject(SidebarState);
  private readonly mode = inject(ViewModeState);
  protected readonly watching = computed(() => this.mode.mode() === 'watch');
  private readonly watchView = viewChild(WatchView);
  private readonly store = inject(ChapterStore);
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly palette = viewChild.required(CommandPalette);
  private readonly keys = viewChild.required(ShortcutsHelp);
  private readonly title = inject(Title);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Read out after each move, instead of the whole slide. */
  protected readonly announcement = computed(() =>
    this.watching()
      ? `Video: ${this.nav.video()?.title ?? `no video for ${this.nav.chapter().name} yet`}`
      : `Slide ${this.nav.position().slide + 1} of ${this.nav.chapter().slides.length}: ${this.nav.slide().title}`,
  );

  /** Watch mode moves a video at a time (then a chapter), so Back, Next and the count follow. */
  protected readonly isFirst = computed(() =>
    this.watching()
      ? this.nav.position().chapter === 0 && this.nav.videoIndex() <= 0
      : this.nav.isFirst(),
  );
  private readonly lastChapter = computed(
    () => this.nav.position().chapter === this.nav.chapters.length - 1,
  );
  protected readonly counter = computed(() =>
    this.watching()
      ? (this.nav.videos().length > 1
          ? `video ${this.nav.videoIndex() + 1} / ${this.nav.videos().length} · `
          : '') + `ch. ${this.nav.position().chapter + 1} / ${this.nav.chapters.length}`
      : `${this.nav.position().slide + 1} / ${this.nav.chapter().slides.length}`,
  );
  protected readonly nextAria = computed(() =>
    this.watching()
      ? this.nav.nextVideo()
        ? `Next video: ${this.nav.nextVideo()!.title}`
        : this.lastChapter()
          ? 'Back to start'
          : `Next chapter: ${this.nav.nextChapterName()}`
      : `${this.nav.nextLabel()}: ${this.nav.nextHint()}`,
  );

  /** "Next →" inside a chapter, "Next: Attention →" at its end, "Back to start ↺" at the very end. */
  protected readonly nextText = computed(() => {
    if (this.watching()) {
      const nv = this.nav.nextVideo();
      if (nv) return `Next video: ${nv.title} →`;
      return this.lastChapter() ? 'Back to start ↺' : `Next: ${this.nav.nextChapterName()} →`;
    }
    const label = this.nav.nextLabel();
    if (label === 'Next') return 'Next →';
    return this.nav.isLast() ? 'Back to start ↺' : `Next: ${this.nav.nextHint()} →`;
  });

  constructor() {
    // Once the first slide is on screen, fetch the other chapters while the reader reads.
    afterNextRender(() => setTimeout(() => this.store.preloadAll(), 1500));

    let first = true;
    afterRenderEffect(() => {
      const slide = this.nav.slide();
      const chapter = this.nav.chapter();
      // The browser tab names the slide (or video), so history and tab lists make sense.
      const what = this.watching()
        ? `${this.nav.video()?.title ?? chapter.name} (video)`
        : slide.title;
      this.title.setTitle(`${what} · ${chapter.name} · AI, Unboxed`);
      if (first) {
        first = false;
        return;
      }
      // After jumping from the sidebar, a tab or search, put keyboard focus on the new slide's
      // heading. Back and Next keep focus, so they can be pressed again.
      untracked(() => {
        const active = document.activeElement as HTMLElement | null;
        if (active?.closest('.foot')) return;
        this.host.nativeElement
          .querySelector<HTMLElement>('article h2')
          ?.focus({ preventScroll: true });
      });
    });
  }

  /** Skip links: move focus without touching the hash, which the router owns. */
  protected skipTo(e: Event, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    el?.focus();
    el?.scrollIntoView?.({ block: 'start' });
  }

  protected move(dir: 1 | -1) {
    (this.watching() ? this.nav.stepVideo(dir) : this.nav.step(dir)).then(() =>
      this.stage().nativeElement.scrollIntoView?.({ block: 'nearest' }),
    );
  }

  protected onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (/INPUT|TEXTAREA|SELECT/.test(target.tagName) || target.closest?.('dialog')) return;
    if (e.key === '/' || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      this.palette().open();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '?') {
      e.preventDefault();
      this.keys().open();
      return;
    }
    if (e.key === '[' && this.sidebar.wide()) this.sidebar.open.update((o) => !o);
    // Watching a video: the player takes Space, ←/→ (±5 s), F, M and friends.
    if (this.watchView()?.handleKey(e)) {
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowRight') this.move(1);
    if (e.key === 'ArrowLeft' && !this.isFirst()) this.move(-1);
  }
}
