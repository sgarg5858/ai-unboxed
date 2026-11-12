import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { BlockList } from '../../blocks/block-list';
import { CodeBlock } from '../../shared/code-block/code-block';
import { SlideFigure } from '../../shared/slide-figure/slide-figure';
import { Figure, Goto, NoteKind, Prose, SlideContent } from '../content.model';
import { CourseNav } from '../course-nav';

/** One slide: text on the left, interactive blocks on the right, wide figures underneath. */
@Component({
  selector: 'app-slide-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BlockList, CodeBlock, SlideFigure],
  templateUrl: './slide-view.html',
  styleUrl: './slide-view.css',
})
export class SlideView {
  private readonly nav = inject(CourseNav);
  readonly content = input.required<SlideContent>();

  protected readonly kindOf = (p: Prose) =>
    typeof p === 'string' ? 'p' : 'ul' in p ? 'ul' : 'h' in p ? 'h' : 'more' in p ? 'more' : 'note';
  protected readonly noteLabel: Record<NoteKind, string> = {
    key: 'Key idea',
    analogy: 'Analogy',
    dev: 'For developers',
    warn: 'Watch out',
    example: 'Worked example',
  };
  /** A slide's figure field holds one figure or a list; always render a list. */
  protected readonly figures = (s: SlideContent): Figure[] =>
    s.figure ? ([] as Figure[]).concat(s.figure) : [];
  /** An accordion's text is one paragraph or a list of them; always render a list. */
  protected readonly paragraphsOf = (p: Prose): string[] =>
    ([] as string[]).concat((p as { text: string | string[] }).text);
  protected readonly go = (g: Goto) => this.nav.goto(g.chapter, (g.slide ?? 1) - 1);
  protected readonly noteLabelOf = (p: Prose) => this.noteLabel[(p as { kind: NoteKind }).kind];
}
