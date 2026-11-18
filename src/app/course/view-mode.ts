import { Injectable, inject, signal } from '@angular/core';
import { CourseNav, ViewMode } from './course-nav';

export type { ViewMode };

/**
 * Read the slides or watch the chapter's video. The choice lives in the URL (`?mode=`, see
 * CourseNav), so a reload or a shared link opens the same view.
 */
@Injectable({ providedIn: 'root' })
export class ViewModeState {
  private readonly nav = inject(CourseNav);
  readonly mode = this.nav.mode;
  /** Where the video should start when Watch mode opens (see WatchView). */
  readonly seekTo = signal<number | null>(null);

  set(mode: ViewMode) {
    return this.nav.setMode(mode);
  }
}
