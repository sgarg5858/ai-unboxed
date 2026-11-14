import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
} from '@angular/core';
import { SectionContent } from '../content.model';
import { CourseNav } from '../course-nav';

/** One tab per course section. Choosing one opens its first chapter; the sidebar follows. */
@Component({
  selector: 'app-section-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block' },
  styles: `
    nav {
      border-bottom: 1px solid var(--line);
      overflow-x: auto;
      scrollbar-width: none;
    }
    ol {
      display: flex;
      gap: 0;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    button {
      position: relative;
      display: flex;
      align-items: baseline;
      gap: 6px;
      min-height: 44px;
      padding: 10px 10px;
      border: 0;
      border-radius: 8px 8px 0 0;
      background: none;
      color: var(--muted);
      font: inherit;
      font-size: 14.5px;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
    }
    button:hover {
      color: var(--ink);
      background: var(--sunk);
    }
    button:focus-visible {
      outline: 2px solid var(--accent-ink);
      outline-offset: -2px;
    }
    .num {
      font-family: var(--f-mono);
      font-size: 11.5px;
      font-weight: 500;
    }
    [aria-current] {
      color: var(--accent-ink);
    }
    /* Pulsing dot on sections whose chapters are all still to come. */
    .soon {
      align-self: center;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--heat);
      animation: pulse 1.6s ease-in-out infinite;
    }
    @keyframes pulse {
      50% {
        opacity: 0.3;
        transform: scale(0.6);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .soon {
        animation: none;
      }
    }
    [aria-current]::after {
      content: '';
      position: absolute;
      left: 10px;
      right: 10px;
      bottom: -1px;
      height: 3px;
      border-radius: 3px 3px 0 0;
      background: var(--accent);
    }
  `,
  template: `
    <nav aria-label="Sections">
      <ol>
        @for (sec of nav.sections; track sec.id; let i = $index) {
          <li>
            <button
              type="button"
              [attr.aria-current]="i === nav.sectionIndex() ? 'page' : null"
              (click)="open(sec, i)"
            >
              <span class="num">{{ pad(i + 1) }}</span
              >{{ sec.name }}
              @if (isSoon(sec)) {
                <span class="soon" aria-hidden="true"></span
                ><span class="sr-only">(coming soon)</span>
              }
            </button>
          </li>
        }
      </ol>
    </nav>
  `,
})
export class SectionTabs {
  protected readonly nav = inject(CourseNav);
  protected readonly pad = (n: number) => String(n).padStart(2, '0');
  protected readonly isSoon = (sec: SectionContent) => sec.chapters.every((c) => c.soon);
  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    // Keep the current tab visible when the row is wider than the screen.
    afterRenderEffect(() => {
      this.nav.sectionIndex();
      const tab = this.host.nativeElement.querySelector('[aria-current]');
      tab?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    });
  }

  protected open(sec: SectionContent, i: number) {
    if (i === this.nav.sectionIndex()) return;
    this.nav.goto(sec.chapters[0].id).then(() => window.scrollTo?.({ top: 0 }));
  }
}
