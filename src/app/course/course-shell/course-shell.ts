import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { ThemeSwitch } from '../../shared/theme/theme-switch';
import { ChapterStore } from '../chapter-store';
import { CommandPalette } from '../command-palette/command-palette';
import { ContentsDrawer } from '../contents-drawer/contents-drawer';
import { CourseNav } from '../course-nav';
import { CourseOutline } from '../course-outline/course-outline';
import { SectionTabs } from '../section-tabs/section-tabs';
import { SidebarState } from '../sidebar-state';
import { SidebarToggle } from '../sidebar-toggle/sidebar-toggle';
import { SlideView } from '../slide-view/slide-view';

@Component({
  selector: 'app-course-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommandPalette,
    ContentsDrawer,
    CourseOutline,
    SectionTabs,
    SidebarToggle,
    SlideView,
    ThemeSwitch,
  ],
  host: { '(document:keydown)': 'onKey($event)' },
  templateUrl: './course-shell.html',
  styleUrl: './course-shell.css',
})
export class CourseShell {
  protected readonly nav = inject(CourseNav);
  protected readonly sidebar = inject(SidebarState);
  private readonly store = inject(ChapterStore);
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly palette = viewChild.required(CommandPalette);

  /** "Next →" inside a chapter, "Next: Attention →" at its end, "Back to start ↺" at the very end. */
  protected readonly nextText = computed(() => {
    const label = this.nav.nextLabel();
    if (label === 'Next') return 'Next →';
    return this.nav.isLast() ? 'Back to start ↺' : `Next: ${this.nav.nextHint()} →`;
  });

  constructor() {
    // Once the first slide is on screen, fetch the other chapters while the reader reads.
    afterNextRender(() => setTimeout(() => this.store.preloadAll(), 1500));
  }

  protected move(dir: 1 | -1) {
    this.nav
      .step(dir)
      .then(() => this.stage().nativeElement.scrollIntoView?.({ block: 'nearest' }));
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
    if (e.key === '[' && this.sidebar.wide()) this.sidebar.open.update((o) => !o);
    if (e.key === 'ArrowRight') this.move(1);
    if (e.key === 'ArrowLeft' && !this.nav.isFirst()) this.move(-1);
  }
}
