import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CourseNav } from '../course-nav';
import { ViewModeState } from '../view-mode';

/**
 * Course-wide: read the slides or watch each chapter's video. Lives in the header next to the
 * theme switch. A dot on Watch marks that the current chapter has a video.
 */
@Component({
  selector: 'app-mode-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="seg" role="group" aria-label="Learn the course by reading or watching">
      <button
        type="button"
        aria-label="Read"
        title="Read the slides"
        [attr.aria-pressed]="state.mode() === 'read'"
        (click)="state.mode.set('read')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5v13"
          />
        </svg>
        Read
      </button>
      <button
        type="button"
        [attr.aria-label]="hasVideo() ? 'Watch (this chapter has a video)' : 'Watch'"
        [attr.aria-pressed]="state.mode() === 'watch'"
        [attr.title]="hasVideo() ? 'Watch this chapter’s video' : 'No video for this chapter yet'"
        (click)="state.mode.set('watch')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" class="solid">
          <path d="M8 5.5v13l10.5-6.5z" />
        </svg>
        Watch
        @if (hasVideo()) {
          <span class="dot" aria-hidden="true"></span>
        }
      </button>
    </div>
    <!-- Phones: one button showing the current mode; a tap switches to the other. -->
    @let watching = state.mode() === 'watch';
    <button
      type="button"
      class="cycle"
      [attr.aria-label]="watching ? 'Mode: Watch. Switch to Read' : 'Mode: Read. Switch to Watch'"
      [attr.title]="watching ? 'Watching. Tap to read' : 'Reading. Tap to watch'"
      (click)="state.mode.set(watching ? 'read' : 'watch')"
    >
      @if (watching) {
        <svg viewBox="0 0 24 24" aria-hidden="true" class="solid">
          <path d="M8 5.5v13l10.5-6.5z" />
        </svg>
      } @else {
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5v13"
          />
        </svg>
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
}
