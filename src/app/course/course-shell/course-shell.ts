import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { BlockList } from '../../blocks/block-list';
import { CodeBlock } from '../../shared/code-block/code-block';
import { CourseNav } from '../course-nav';
import { NoteKind, Prose } from '../content.model';

@Component({
  selector: 'app-course-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BlockList, CodeBlock],
  host: { '(document:keydown)': 'onKey($event)' },
  templateUrl: './course-shell.html',
})
export class CourseShell {
  protected readonly nav = inject(CourseNav);
  private readonly article = viewChild.required<ElementRef<HTMLElement>>('article');

  protected readonly pad = (i: number) => String(i).padStart(2, '0');
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

  protected openChapter(id: string) {
    this.nav.goto(id).then(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  protected move(dir: 1 | -1) {
    this.nav
      .step(dir)
      .then(() => this.article().nativeElement.scrollIntoView?.({ block: 'nearest' }));
  }

  protected onKey(e: KeyboardEvent) {
    if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) return;
    if (e.key === 'ArrowRight') this.move(1);
    if (e.key === 'ArrowLeft' && !this.nav.isFirst()) this.move(-1);
  }
}
