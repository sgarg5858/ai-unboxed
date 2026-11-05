import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export const SIDEBAR_KEY = 'ai-unboxed:sidebar';
/** Keep in sync with the breakpoint in course-shell.css. */
export const WIDE_QUERY = '(min-width: 1360px)';

/** Whether the contents sidebar is shown on wide screens. Remembered between visits. */
@Injectable({ providedIn: 'root' })
export class SidebarState {
  private readonly doc = inject(DOCUMENT);
  private readonly media = this.doc.defaultView?.matchMedia?.(WIDE_QUERY);
  /** True when the screen is wide enough for a sidebar at all. */
  readonly wide = signal(this.media?.matches ?? false);
  readonly open = signal(this.read());

  constructor() {
    this.media?.addEventListener('change', (e) => this.wide.set(e.matches));
    effect(() => {
      const open = this.open();
      try {
        if (open) localStorage.removeItem(SIDEBAR_KEY);
        else localStorage.setItem(SIDEBAR_KEY, 'hidden');
      } catch {
        // Storage can be blocked; the choice still applies for this visit.
      }
    });
  }

  private read(): boolean {
    try {
      return localStorage.getItem(SIDEBAR_KEY) !== 'hidden';
    } catch {
      return true;
    }
  }
}
