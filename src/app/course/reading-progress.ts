import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export const PROGRESS_KEY = 'ai-unboxed:read';

/** "chapterId/slideIndex" (0-based) for every slide the reader has marked done. */
const keyOf = (chapterId: string, slide: number) => `${chapterId}/${slide}`;

/**
 * Slides the reader has ticked as done. Saved in localStorage (this browser only) and kept in step
 * with other open tabs through the storage event.
 */
@Injectable({ providedIn: 'root' })
export class ReadingProgress {
  private readonly seen = signal<ReadonlySet<string>>(this.read());

  constructor() {
    const win = inject(DOCUMENT).defaultView;
    // Another tab changed the ticks: pick up its list.
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROGRESS_KEY || e.key === null) this.seen.set(this.read());
    };
    win?.addEventListener('storage', onStorage);
    inject(DestroyRef).onDestroy(() => win?.removeEventListener('storage', onStorage));
  }

  has(chapterId: string, slide: number): boolean {
    return this.seen().has(keyOf(chapterId, slide));
  }

  /** How many slides of this chapter are marked done. */
  count(chapterId: string): number {
    let n = 0;
    for (const k of this.seen()) if (k.startsWith(chapterId + '/')) n++;
    return n;
  }

  toggle(chapterId: string, slide: number) {
    const k = keyOf(chapterId, slide);
    const next = new Set(this.seen());
    if (!next.delete(k)) next.add(k);
    this.seen.set(next);
    this.write(next);
  }

  private write(set: ReadonlySet<string>) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify([...set]));
    } catch {
      // Storage can be blocked; ticks still show for this visit.
    }
  }

  private read(): ReadonlySet<string> {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]');
      return new Set(Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : []);
    } catch {
      return new Set();
    }
  }
}
