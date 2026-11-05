import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

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

  constructor() {
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
