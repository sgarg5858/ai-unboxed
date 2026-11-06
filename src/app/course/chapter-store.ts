import { Injectable, InjectionToken, inject, signal } from '@angular/core';
import { CHAPTERS } from '../../content/course';
import { loadWidget } from '../widgets/registry';
import { allBlocks } from './blocks-walk';
import { ChapterContent, ChapterRef } from './content.model';

export const COURSE_CHAPTERS = new InjectionToken<readonly ChapterRef[]>('COURSE_CHAPTERS', {
  providedIn: 'root',
  factory: () => CHAPTERS,
});

/** Loads chapter content on demand and keeps what has been loaded. */
@Injectable({ providedIn: 'root' })
export class ChapterStore {
  private readonly chapters = inject(COURSE_CHAPTERS);
  private readonly cache = signal<ReadonlyMap<string, ChapterContent>>(new Map());
  private readonly pending = new Map<string, Promise<ChapterContent>>();
  /** Every chapter loaded so far, by id. */
  readonly loaded = this.cache.asReadonly();

  /**
   * Load a chapter and the code for every widget it uses, so its slides render without
   * waiting. Safe to call repeatedly; each chapter is fetched once.
   */
  load(id: string): Promise<ChapterContent> {
    const ready = this.cache().get(id);
    if (ready) return Promise.resolve(ready);
    let job = this.pending.get(id);
    if (!job) {
      const ref = this.chapters.find((c) => c.id === id);
      if (!ref) return Promise.reject(new Error(`Unknown chapter "${id}"`));
      job = ref.load().then(async (content) => {
        const names = new Set<string>();
        for (const slide of content.slides)
          for (const b of allBlocks(slide.viz)) if (b.type === 'widget') names.add(b.name);
        await Promise.all([...names].map(loadWidget));
        this.cache.update((m) => new Map(m).set(id, content));
        this.pending.delete(id);
        return content;
      });
      this.pending.set(id, job);
    }
    return job;
  }

  /** Quietly fetch every chapter, so later navigation is instant. */
  preloadAll(): Promise<unknown> {
    return Promise.all(this.chapters.map((c) => this.load(c.id).catch(() => undefined)));
  }
}
