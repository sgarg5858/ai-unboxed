import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CourseNav } from '../course-nav';
import { ViewMode, ViewModeState } from '../view-mode';

/** Phones toggle between the two. */
const NEXT: Record<ViewMode, ViewMode> = { watch: 'combined', combined: 'watch' };

/**
 * Course-wide: watch each chapter's video, or see each slide beside its video (Combined, where
 * the video can also be hidden). Lives in the header next to the theme switch. A dot on Watch marks that the current chapter has a video.
 */
@Component({
  selector: 'app-mode-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="seg" role="group" aria-label="Watch the videos, or see slides and video together">
      <button
        type="button"
        [attr.aria-label]="hasVideo() ? 'Watch (this chapter has a video)' : 'Watch'"
        [attr.aria-pressed]="state.mode() === 'watch'"
        [attr.title]="hasVideo() ? 'Watch this chapter’s video' : 'No video for this chapter yet'"
        (click)="state.set('watch')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" class="solid">
          <path d="M8 5.5v13l10.5-6.5z" />
        </svg>
        Watch
        @if (hasVideo()) {
          <span class="dot" aria-hidden="true"></span>
        }
      </button>
      <button
        type="button"
        aria-label="Combined: video and slides side by side"
        title="Video and slides side by side"
        [attr.aria-pressed]="state.mode() === 'combined'"
        (click)="state.set('combined')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3.5 5.5h17v13h-17zM12 5.5v13M6 9.5l3 2-3 2z" />
        </svg>
        Combined
      </button>
    </div>
    <!-- Phones: one button showing the current mode; a tap moves to the next one. -->
    @let m = state.mode();
    <button
      type="button"
      class="cycle"
      [attr.aria-label]="'Mode: ' + names[m] + '. Switch to ' + names[nextMode()]"
      [attr.title]="names[m] + '. Tap for ' + names[nextMode()]"
      (click)="state.set(nextMode())"
    >
      @switch (m) {
        @case ('watch') {
          <svg viewBox="0 0 24 24" aria-hidden="true" class="solid">
            <path d="M8 5.5v13l10.5-6.5z" />
          </svg>
        }
        @case ('combined') {
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3.5 5.5h17v13h-17zM12 5.5v13M6 9.5l3 2-3 2z" />
          </svg>
        }
      }
      @if (hasVideo()) {
        <span class="dot" aria-hidden="true"></span>
      }
    </button>
  `,
  styles: `
    .seg {
      display: inline-flex;
      padding: 3px;
      gap: 2px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: var(--glass-bg);
      backdrop-filter: var(--glass-fx);
      -webkit-backdrop-filter: var(--glass-fx);
    }
    button {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      min-height: 30px;
      padding: 0 12px;
      border: 0;
      border-radius: 999px;
      background: none;
      color: var(--muted);
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition:
        background 0.15s,
        color 0.15s;
    }
    button:hover {
      color: var(--ink);
    }
    button[aria-pressed='true'] {
      background: var(--pill-bg);
      color: var(--pill-fg);
    }
    button:focus-visible {
      outline: 2px solid var(--accent-ink);
      outline-offset: 2px;
    }
    svg {
      width: 17px;
      height: 17px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linejoin: round;
    }
    svg.solid {
      fill: currentColor;
      stroke: none;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--neg);
    }
    .cycle {
      display: none;
    }
    @media (max-width: 600px) {
      .seg {
        display: none;
      }
      .cycle {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        padding: 0;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: var(--surface);
        color: var(--ink);
      }
      .cycle .dot {
        position: absolute;
        top: 8px;
        right: 8px;
      }
    }
  `,
})
export class ModeSwitch {
  protected readonly state = inject(ViewModeState);
  private readonly nav = inject(CourseNav);
  protected readonly hasVideo = computed(() => this.nav.videos().length > 0);
  protected readonly names: Record<ViewMode, string> = {
    watch: 'Watch',
    combined: 'Combined',
  };
  protected readonly nextMode = computed(() => NEXT[this.state.mode()]);
}
