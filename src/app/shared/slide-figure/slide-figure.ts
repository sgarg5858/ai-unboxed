import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Figure } from '../../course/content.model';
import { Theme } from '../theme/theme';

/** A wide slide image that swaps to its dark version with the site theme, not just the OS setting. */
@Component({
  selector: 'app-slide-figure',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block' },
  styles: `
    figure {
      margin: 0;
    }
    .frame {
      overflow-x: auto;
      border-radius: 12px;
    }
    img {
      display: block;
      width: 100%;
      height: auto;
      /* Below this the labels get too small to read, so the frame scrolls instead. */
      min-width: 640px;
      max-width: none;
    }
    figcaption {
      margin-top: 8px;
    }
  `,
  template: `
    <figure>
      <div class="frame">
        <img
          [src]="src()"
          [alt]="figure().alt"
          [width]="figure().width"
          [height]="figure().height"
          loading="lazy"
          decoding="async"
        />
      </div>
      @if (figure().caption; as c) {
        <figcaption class="cap" [innerHTML]="c"></figcaption>
      }
    </figure>
  `,
})
export class SlideFigure {
  readonly figure = input.required<Figure>();
  private readonly theme = inject(Theme);
  protected readonly src = computed(() => {
    const f = this.figure();
    return this.theme.dark() && f.darkSrc ? f.darkSrc : f.src;
  });
}
