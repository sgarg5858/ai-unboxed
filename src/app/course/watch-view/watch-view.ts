import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { VideoPlayer } from '../../shared/video-player/video-player';
import { ChapterStore } from '../chapter-store';
import { CourseNav } from '../course-nav';
import { ViewModeState } from '../view-mode';

/** Watch mode: the current chapter's video, or a way back to the slides if it has none yet. */
@Component({
  selector: 'app-watch-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VideoPlayer],
  styleUrl: './watch-view.css',
  template: `
    @let chapter = nav.chapter();
    <article class="watch">
      @if (chapter.video; as v) {
        <header>
          <p class="eyebrow">
            <span class="dot" aria-hidden="true"></span>Video · {{ chapter.name }}
          </p>
          <h2 tabindex="-1">{{ v.title }}</h2>
          @if (v.description) {
            <p class="lede" [innerHTML]="v.description"></p>
          }
        </header>
        <!-- keyed by file, so a new chapter gets a fresh player -->
        @for (src of [v.src]; track src) {
          <app-video-player [src]="src" [label]="v.title" [poster]="v.poster">
            @if (nav.nextChapterName(); as next) {
              <button end type="button" class="upnext" (click)="nav.stepChapter(1)">
                <span>Up next</span>
                <b>{{ next }} →</b>
              </button>
            }
          </app-video-player>
        }
        <p class="alt">
          Prefer to read?
          <button type="button" class="link" (click)="mode.mode.set('read')">
            Read the {{ chapter.slides.length }} slides instead
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
  private readonly player = viewChild(VideoPlayer);

  /** Loaded chapters that have a video, for the empty state. */
  protected readonly withVideo = computed(() => {
    const loaded = this.store.loaded();
    return this.nav.chapters.filter((c) => loaded.get(c.id)?.video).slice(0, 4);
  });

  /** Keys pressed anywhere on the page; true if the player used it. */
  handleKey(e: KeyboardEvent): boolean {
    return this.player()?.handleKey(e) ?? false;
  }
}
