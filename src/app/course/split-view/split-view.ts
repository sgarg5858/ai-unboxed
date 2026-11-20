import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { VideoPlayer } from '../../shared/video-player/video-player';
import { clock } from '../../shared/lib/video';
import { slideAtTime, startFor, videoCovering } from '../chapter-videos';
import { CourseNav } from '../course-nav';
import { SlideView } from '../slide-view/slide-view';

type Layout = 'side' | 'large';
const LAYOUTS: readonly { id: Layout; label: string; title: string; icon: string }[] = [
  {
    id: 'side',
    label: 'Side by side',
    title: 'Video beside the text',
    icon: 'M3.5 5.5h17v13h-17zM12 5.5v13',
  },
  {
    id: 'large',
    label: 'Large video',
    title: 'Video across the page, text below',
    icon: 'M3.5 4.5h17v10h-17zM3.5 18.5h17',
  },
];

/**
 * Combined mode: the video beside the slide it's talking about, kept in step both ways. As the video
 * plays into the next slide's topic, the slide follows; moving to another slide jumps the video
 * to where that slide's topic starts. Slides that no video covers show the text alone.
 */
@Component({
  selector: 'app-split-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SlideView, VideoPlayer],
  styleUrl: './split-view.css',
  template: `
    @let large = layout() === 'large';
    <div class="split" [class.solo]="!video()" [class.large]="large">
      @if (video(); as v) {
        <section class="media" aria-label="Video for this slide">
          <p class="eyebrow">
            <span class="dot" aria-hidden="true"></span>
            {{ count() > 1 ? 'Video ' + (index() + 1) + ' of ' + count() + ' · ' : ''
            }}{{ v.title }}
          </p>
          <!-- keyed by file, so another video gets a fresh player -->
          @for (src of [v.src]; track src) {
            <app-video-player
              [src]="src"
              [label]="v.title"
              [poster]="v.poster"
              [start]="start()"
              [marks]="v.marks ?? []"
              (startApplied)="start.set(null)"
            />
          }
          <div class="bar">
            <div class="seg" role="group" aria-label="Video layout">
              @for (o of layouts; track o.id) {
                <button
                  type="button"
                  [attr.aria-pressed]="layout() === o.id"
                  [title]="o.title"
                  (click)="layout.set(o.id)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="o.icon" /></svg>
                  {{ o.label }}
                </button>
              }
            </div>
            <button
              type="button"
              class="fs"
              title="Full screen (F). The slide keeps following the video."
              aria-label="Full screen"
              (click)="player()?.toggleFullscreen()"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
              </svg>
            </button>
          </div>
          <details class="how">
            <summary>How Combined works</summary>
            <p>The slide follows the video. Change slide and the video jumps to it.</p>
          </details>
          @if (v.marks?.length) {
            <details class="how stamps">
              <summary>In this video · {{ v.marks!.length }} timestamps</summary>
              <ol class="marks" aria-label="In this video">
                @for (m of v.marks; track m.at; let i = $index) {
                  <li>
                    <button
                      type="button"
                      [attr.aria-current]="i === markIndex() ? 'true' : null"
                      (click)="player()?.jumpTo(m.at)"
                    >
                      <span class="at">{{ clock(m.at) }}</span
                      >{{ m.label }}
                    </button>
                  </li>
                }
              </ol>
            </details>
          }
          @if (count() > 1) {
            <details class="how stamps">
              <summary>Videos in this chapter · {{ count() }}</summary>
              <ol class="marks playlist" aria-label="Videos in this chapter">
                @for (pv of nav.videos(); track pv.src; let n = $index) {
                  <li>
                    <button
                      type="button"
                      [attr.aria-current]="pv === v ? 'true' : null"
                      (click)="nav.gotoVideo(n)"
                    >
                      <span class="at">{{ n + 1 }}</span
                      >{{ pv.title }}
                    </button>
                  </li>
                }
              </ol>
            </details>
          }
        </section>
      }
      <div class="text">
        @if (!video()) {
          <p class="none">No video covers this slide, so here's the text on its own.</p>
        }
        <!-- track by slide identity so widget state resets when the slide changes -->
        @for (s of [nav.slide()]; track s) {
          <app-slide-view [content]="s" />
        }
      </div>
    </div>
  `,
})
export class SplitView {
  protected readonly nav = inject(CourseNav);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly player = viewChild(VideoPlayer);
  protected readonly clock = clock;
  private readonly slideCount = computed(() => this.nav.chapter().slides.length);

  /** The video that covers this slide, if any. */
  protected readonly video = computed(() =>
    videoCovering(this.nav.videos(), this.nav.position().slide, this.slideCount()),
  );
  /** Side by side, or a large video across the page with the text below. */
  protected readonly layout = signal<Layout>('side');
  protected readonly layouts = LAYOUTS;
  protected readonly count = computed(() => this.nav.videos().length);
  protected readonly index = computed(() => this.nav.videos().indexOf(this.video()!));

  /** The timestamp now playing (the last one at or before the current time). */
  protected readonly markIndex = computed(() => {
    const t = this.player()?.time() ?? 0;
    return (this.video()?.marks ?? []).reduce((cur, m, i) => (m.at <= t ? i : cur), 0);
  });

  /** Where a newly opened video starts: the current slide's topic. Cleared once applied. */
  protected readonly start = linkedSignal<string | undefined, number | null>({
    source: () => this.video()?.src,
    computation: () => {
      const v = untracked(this.video);
      return v ? startFor(v, untracked(this.nav.position).slide) : null;
    },
  });

  constructor() {
    // Video → slide, when playing or seeking crosses into another slide's topic. Only on a crossing,
    // so a slide the reader picked isn't snapped back on the next tick.
    let last: number | null = null;
    let lastSrc: string | undefined;
    effect(() => {
      const p = this.player();
      if (!p) return;
      const t = p.time();
      untracked(() => {
        const v = this.video();
        if (!v || p.src() !== v.src) return;
        if (lastSrc !== v.src) [last, lastSrc] = [null, v.src];
        const target = slideAtTime(v, t, this.slideCount());
        const crossed = last !== null && target !== last;
        last = target;
        if (target === null || !crossed || target === this.nav.position().slide) return;
        // Another video goes with that slide first: let the reader move there themselves.
        if (videoCovering(this.nav.videos(), target, this.slideCount()) !== v) return;
        this.nav.gotoSlide(target, { replaceUrl: true }).then(() => this.keepInView());
      });
    });

    // Slide → video. The reader moved to a slide this video covers: jump to its topic.
    effect(() => {
      const slide = this.nav.position().slide;
      const v = this.video();
      untracked(() => {
        const p = this.player();
        if (!v || !p || p.src() !== v.src || v.at?.[String(slide + 1)] === undefined) return;
        if (slideAtTime(v, p.time(), this.slideCount()) !== slide) p.seek(startFor(v, slide));
      });
    });
  }

  /** Keys pressed anywhere on the page; true if the player used it. ←/→ stay for slides. */
  handleKey(e: KeyboardEvent): boolean {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') return false;
    return this.player()?.handleKey(e) ?? false;
  }

  /** After the video turns the slide, bring its top back into view if the reader scrolled past. */
  private keepInView() {
    const top = this.host.nativeElement.getBoundingClientRect?.().top ?? 0;
    if (top < 0) window.scrollBy?.({ top: top - 16, behavior: 'smooth' });
  }
}
