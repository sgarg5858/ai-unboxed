import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { BlockList } from '../../blocks/block-list';
import { CodeBlock } from '../../shared/code-block/code-block';
import { SlideFigure } from '../../shared/slide-figure/slide-figure';
import { ThemeSwitch } from '../../shared/theme/theme-switch';
import { ChapterStore } from '../chapter-store';
import { ContentsDrawer } from '../contents-drawer/contents-drawer';
import { CourseNav } from '../course-nav';
import { CourseOutline } from '../course-outline/course-outline';
import { SidebarState } from '../sidebar-state';
import { SlideProgress } from '../slide-progress/slide-progress';
import { NoteKind, Prose } from '../content.model';

@Component({
  selector: 'app-course-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BlockList,
    CodeBlock,
    ContentsDrawer,
    CourseOutline,
    SlideFigure,
    SlideProgress,
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

  constructor() {
    // Once the first slide is on screen, fetch the other chapters while the reader reads.
    afterNextRender(() => setTimeout(() => this.store.preloadAll(), 1500));
  }
  private readonly article = viewChild.required<ElementRef<HTMLElement>>('article');

  protected readonly kindOf = (p: Prose) =>
    typeof p === 'string' ? 'p' : 'ul' in p ? 'ul' : 'h' in p ? 'h' : 'note';
  protected readonly noteLabel: Record<NoteKind, string> = {
    key: 'Key idea',
    analogy: 'Analogy',
    dev: 'For developers',
    warn: 'Watch out',
    example: 'Worked example',
  };
  protected readonly noteLabelOf = (p: Prose) => this.noteLabel[(p as { kind: NoteKind }).kind];

  protected move(dir: 1 | -1) {
    this.nav
      .step(dir)
      .then(() => this.article().nativeElement.scrollIntoView?.({ block: 'nearest' }));
  }

  /** Wide screens: show or hide the sidebar. Small screens: open the contents drawer. */
  protected toggleContents(drawer: ContentsDrawer) {
    if (this.sidebar.wide()) this.sidebar.open.update((open) => !open);
    else drawer.open();
  }

  protected onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (/INPUT|TEXTAREA|SELECT/.test(target.tagName) || target.closest?.('dialog')) return;
    if (e.key === 'ArrowRight') this.move(1);
    if (e.key === 'ArrowLeft' && !this.nav.isFirst()) this.move(-1);
  }
}
