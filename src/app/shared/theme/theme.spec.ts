import { TestBed } from '@angular/core/testing';
import { THEME_KEY, Theme } from './theme';

describe('Theme', () => {
  const root = document.documentElement;

  beforeEach(() => {
    localStorage.clear();
    root.removeAttribute('data-theme');
  });

  const create = () => {
    TestBed.resetTestingModule();
    return TestBed.inject(Theme);
  };

  it('defaults to auto with no data-theme attribute', () => {
    const t = create();
    TestBed.tick();
    expect(t.choice()).toBe('auto');
    expect(root.hasAttribute('data-theme')).toBe(false);
  });

  it('forces and persists light and dark', () => {
    const t = create();
    t.set('dark');
    TestBed.tick();
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    t.set('light');
    TestBed.tick();
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('returns to the system setting and forgets the saved choice', () => {
    const t = create();
    t.set('dark');
    TestBed.tick();
    t.set('auto');
    TestBed.tick();
    expect(root.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem(THEME_KEY)).toBeNull();
  });

  it('restores a saved choice and ignores junk values', () => {
    localStorage.setItem(THEME_KEY, 'light');
    expect(create().choice()).toBe('light');
    localStorage.setItem(THEME_KEY, 'purple');
    expect(create().choice()).toBe('auto');
  });
});
