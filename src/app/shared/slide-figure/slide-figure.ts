import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Figure } from '../../course/content.model';
import { Theme } from '../theme/theme';

const prefersStill = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * A wide slide image that swaps to its dark version with the site theme, not just the OS setting.
 * Animated figures are embedded as live SVG documents (CSS animations may not run in an <img>)
 * with a Play/Pause button; they start paused when the reader's system asks for reduced motion.
 */
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
    img,
    object {
      display: block;
      width: 100%;
      height: auto;
      /* Below this the labels get too small to read, so the frame scrolls instead. */
      min-width: 640px;
      max-width: none;
    }
    object {
      pointer-events: none;
    }
    .play {
      margin-top: 8px;
    }
    figcaption {
      margin-top: 8px;
    }
  `,
  template: `
    @let f = figure();
    <figure>
      <div class="frame">
        @if (f.animated) {
          <object
            #anim
            type="image/svg+xml"
            role="img"
            [attr.aria-label]="f.alt"
            [data]="safeSrc()"
            [style.aspect-ratio]="f.width + ' / ' + f.height"
            (load)="loaded.set(loaded() + 1)"
          ></object>
        } @else {
          <img
            [src]="src()"
            [alt]="f.alt"
            [width]="f.width"
            [height]="f.height"
            loading="lazy"
            decoding="async"
          />
        }
      </div>
      @if (f.animated) {
        <button type="button" class="btn play" [attr.aria-pressed]="playing()" (click)="toggle()">
          {{ playing() ? '❚❚ Pause animation' : '▶ Play animation' }}
        </button>
      }
      @if (f.caption; as c) {
        <figcaption class="cap" [innerHTML]="c"></figcaption>
      }
    </figure>
  `,
})
export class SlideFigure {
  readonly figure = input.required<Figure>();
  private readonly theme = inject(Theme);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly anim = viewChild<ElementRef<HTMLObjectElement>>('anim');

  protected readonly src = computed(() => {
    const f = this.figure();
    return this.theme.dark() && f.darkSrc ? f.darkSrc : f.src;
  });
  /** The src comes from our own content JSON, so it's safe to load as a document. */
  protected readonly safeSrc = computed(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.src()),
  );
  protected readonly playing = signal(!prefersStill());
  /** Bumped on every (re)load, e.g. after a theme swap, so the play state is re-applied. */
  protected readonly loaded = signal(0);

  constructor() {
    // Sync the play state into the embedded SVG document (outside Angular's DOM).
    effect(() => {
      const playing = this.playing();
      this.loaded();
      const root = this.anim()?.nativeElement.contentDocument?.documentElement;
      root?.classList.toggle('play', playing);
      root?.classList.toggle('paused', !playing);
    });
  }

  protected toggle() {
    this.playing.update((p) => !p);
  }
}
