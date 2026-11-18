import { Injectable, effect, signal } from '@angular/core';

export const VIEW_MODE_KEY = 'ai-unboxed:mode';
export type ViewMode = 'read' | 'watch';

/** Read the slides or watch the chapter's video. Remembered between visits. */
@Injectable({ providedIn: 'root' })
export class ViewModeState {
  readonly mode = signal<ViewMode>(this.read());
  /** Where the video should start when Watch mode opens from a slide's "Watch this part". */
  readonly seekTo = signal<number | null>(null);

  /** Switch to Watch mode, starting the video at `seconds`. */
  watchAt(seconds: number) {
    this.seekTo.set(seconds);
    this.mode.set('watch');
  }

  constructor() {
    effect(() => {
      const mode = this.mode();
      try {
        if (mode === 'read') localStorage.removeItem(VIEW_MODE_KEY);
        else localStorage.setItem(VIEW_MODE_KEY, mode);
      } catch {
        // Storage can be blocked; the choice still applies for this visit.
      }
    });
  }

  private read(): ViewMode {
    try {
      return localStorage.getItem(VIEW_MODE_KEY) === 'watch' ? 'watch' : 'read';
    } catch {
      return 'read';
    }
  }
}
