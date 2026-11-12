import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SidebarState } from '../sidebar-state';

/** The panel button that hides the sidebar (at its top) or brings it back (on the slim rail). */
@Component({
  selector: 'app-sidebar-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block' },
  styles: `
    button {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      padding: 0;
      border: 1px solid transparent;
      border-radius: 10px;
      background: none;
      color: var(--muted);
      cursor: pointer;
    }
    button:hover {
      color: var(--ink);
      background: var(--sunk);
      border-color: var(--line);
    }
    button:focus-visible {
      outline: 2px solid var(--accent-ink);
      outline-offset: 1px;
    }
    svg {
      width: 20px;
      height: 20px;
    }
  `,
  template: `
    <button
      type="button"
      aria-controls="course-sidebar"
      aria-keyshortcuts="["
      [attr.aria-expanded]="sidebar.open()"
      [attr.aria-label]="sidebar.open() ? 'Hide sidebar' : 'Show sidebar'"
      [title]="(sidebar.open() ? 'Hide sidebar' : 'Show sidebar') + ' ( [ )'"
      (click)="sidebar.open.update((o) => !o)"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        aria-hidden="true"
      >
        <rect x="2.5" y="3.5" width="15" height="13" rx="2.5" />
        <path d="M7.5 3.5v13" />
        @if (sidebar.open()) {
          <path d="M13.2 8 11 10l2.2 2" stroke-linecap="round" stroke-linejoin="round" />
        } @else {
          <path d="M11 8l2.2 2-2.2 2" stroke-linecap="round" stroke-linejoin="round" />
        }
      </svg>
    </button>
  `,
})
export class SidebarToggle {
  protected readonly sidebar = inject(SidebarState);
}
