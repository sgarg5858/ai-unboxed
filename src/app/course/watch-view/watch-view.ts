import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { VideoPlayer } from '../../shared/video-player/video-player';
import { clock } from '../../shared/lib/video';
import { slidesLabel } from '../chapter-videos';
import { ChapterVideo } from '../content.model';
import { ChapterStore } from '../chapter-store';
import { CourseNav } from '../course-nav';
import { ViewModeState } from '../view-mode';

/**
 * Watch mode: the video that goes with the current slide (a chapter can have a few, each covering
 * a range of slides), a playlist when there's more than one, or a way back to the slides.
 */
@Component({
  selector: 'app-watch-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VideoPlayer],
  styleUrl: './watch-view.css',
  template: `
    @let chapter = nav.chapter();
    @let count = nav.videos().length;
    <article class="watch">
      @if (nav.video(); as v) {
        <header>
          <p class="eyebrow">
            <span class="dot" aria-hidden="true"></span>Video{{
              count > 1 ? ' ' + (nav.videoIndex() + 1) + ' of ' + count : ''
            }}
            · {{ chapter.name }}
          </p>
          <h2 tabindex="-1">{{ v.title }}</h2>
          @if (v.description) {
            <p class="lede" [innerHTML]="v.description"></p>
          }
        </header>
        <!-- keyed by file, so another video gets a fresh player -->
        @for (src of [v.src]; track src) {
          <app-video-player
            [src]="src"
            [label]="v.title"
            [poster]="v.poster"
            [start]="mode.seekTo()"
            [marks]="v.marks ?? []"
            (startApplied)="mode.seekTo.set(null)"
          >
            @if (nav.nextVideo(); as nv) {
              <button end type="button" class="upnext" (click)="nav.stepVideo(1)">
                <span>Up next</span>
                <b>{{ nv.title }} →</b>
              </button>
            } @else if (nav.nextChapterName(); as next) {
              <button end type="button" class="upnext" (click)="nav.stepChapter(1)">
                <span>Up next</span>
                <b>{{ next }} →</b>
              </button>
            }
          </app-video-player>
        }
        @if (v.marks?.length) {
          <details class="chapters">
            <summary class="sub">In this video · {{ v.marks!.length }} timestamps</summary>
            <ol class="marks">
              @for (m of v.marks; track m.at) {
                <li>
                  <button type="button" (click)="player()?.jumpTo(m.at)">
                    <span class="at">{{ clock(m.at) }}</span
                    >{{ m.label }}
                  </button>
                </li>
              }
            </ol>
          </details>
        }
        @if (count > 1) {
          <h3 class="sub">Videos in this chapter</h3>
          <ol class="playlist" aria-label="Videos in this chapter">
            @for (pv of nav.videos(); track pv.src; let i = $index) {
              <li>
                <button
                  type="button"
                  [attr.aria-current]="i === nav.videoIndex() ? 'true' : null"
                  (click)="nav.gotoVideo(i)"
                >
                  <span class="n">{{ i + 1 }}</span>
                  <span class="t">{{ pv.title }}</span>
                </button>
              </li>
            }
          </ol>
        }
        <p class="alt">
          Prefer to read?
          <button type="button" class="link" (click)="mode.mode.set('read')">
            Read {{ v.slides ? label(v) : 'the ' + chapter.slides.length + ' slides' }} instead
          </button>
        </p>
      } @else {
        <div class="empty">
          <span class="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" /></svg>
          </span>
          <h2 tabindex="-1">No video for {{ chapter.name }} yet</h2>
          <p>This chapter is slides only for now. Read it, or watch a chapter that has one.</p>
          <div class="acts">
            <button type="button" class="btn on" (click)="mode.mode.set('read')">
              Read this chapter
            </button>
            @for (c of withVideo(); track c.id) {
              <button type="button" class="btn" (click)="nav.goto(c.id)">▶ {{ c.name }}</button>
            }
          </div>
        </div>
      }
    </article>
  `,
})
export class WatchView {
  protected readonly nav = inject(CourseNav);
  protected readonly mode = inject(ViewModeState);
  private readonly store = inject(ChapterStore);
  protected readonly player = viewChild(VideoPlayer);
  protected readonly clock = clock;

  protected readonly label = (v: ChapterVideo) => slidesLabel(v, this.nav.chapter().slides.length);

  /** Loaded chapters that have a video, for the empty state. */
  protected readonly withVideo = computed(() => {
    const loaded = this.store.loaded();
    return this.nav.chapters.filter((c) => loaded.get(c.id)?.videos?.length).slice(0, 4);
  });

  /** Keys pressed anywhere on the page; true if the player used it. */
  handleKey(e: KeyboardEvent): boolean {
    return this.player()?.handleKey(e) ?? false;
  }
}
