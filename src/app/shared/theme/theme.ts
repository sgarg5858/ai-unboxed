import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type ThemeChoice = 'auto' | 'light' | 'dark';

export const THEME_KEY = 'ai-unboxed:theme';

const isChoice = (v: unknown): v is ThemeChoice => v === 'auto' || v === 'light' || v === 'dark';

/**
 * Light/dark preference. "auto" follows the OS setting (no attribute); the other two force a
 * palette via data-theme on <html>, which styles.css already understands.
 * The same logic runs once in index.html before first paint so there is no flash.
 */
@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly doc = inject(DOCUMENT);
  readonly choice = signal<ThemeChoice>(this.read());
  /** The OS setting, kept live. jsdom and old browsers have no matchMedia, so default to light. */
  private readonly systemDark = signal(this.media()?.matches ?? false);
  /** True when the dark palette is showing, whether chosen or inherited from the OS. */
  readonly dark = computed(() =>
    this.choice() === 'auto' ? this.systemDark() : this.choice() === 'dark',
  );

  constructor() {
    this.media()?.addEventListener('change', (e) => this.systemDark.set(e.matches));
    effect(() => {
      const c = this.choice();
      const root = this.doc.documentElement;
      if (c === 'auto') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', c);
      try {
        if (c === 'auto') localStorage.removeItem(THEME_KEY);
        else localStorage.setItem(THEME_KEY, c);
      } catch {
        // Storage can be blocked (private mode); the choice still applies for this visit.
      }
    });
  }

  set(c: ThemeChoice) {
    this.choice.set(c);
  }

  private media(): MediaQueryList | undefined {
    return this.doc.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
  }

  private read(): ThemeChoice {
    try {
      const v = localStorage.getItem(THEME_KEY);
      if (isChoice(v)) return v;
    } catch {
      // ignore
    }
    return 'auto';
  }
}
