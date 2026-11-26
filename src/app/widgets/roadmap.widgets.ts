import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import roadmap from '../../content/roadmap.json';
import { Goto } from '../course/content.model';
import { CourseNav } from '../course/course-nav';

export interface RoadmapTopic {
  name: string;
  /** The slide that teaches it. No link means it's coming soon. */
  goto?: Goto;
}
export interface RoadmapGroup {
  id: string;
  name: string;
  /** The Roadmap chapter slide (1-based) that lists this group. */
  slide: number;
  topics: RoadmapTopic[];
}

export const ROADMAP: readonly RoadmapGroup[] = roadmap.groups;

/** How many of a list of topics the course already covers. */
export const coverage = (topics: readonly RoadmapTopic[]) => {
  const done = topics.filter((t) => t.goto).length;
  return { done, total: topics.length, pct: topics.length ? (100 * done) / topics.length : 0 };
};

type Filter = 'all' | 'done' | 'soon';

const STYLES = `
  .bar {
    display: block;
    height: 8px;
    border-radius: 99px;
    background: var(--sunk);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--pos);
  }
  .count {
    font-family: var(--f-mono);
    font-size: 12.5px;
    color: var(--muted);
    white-space: nowrap;
  }
  .count b {
    color: var(--pos-ink);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .row {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 38px;
    padding: 6px 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    font-size: 14.5px;
    text-align: left;
  }
  button.row {
    cursor: pointer;
  }
  button.row:hover {
    border-color: var(--accent);
  }
  button.row:focus-visible {
    outline: 2px solid var(--accent-ink);
    outline-offset: 1px;
  }
  .row.soon {
    background: var(--sunk);
    border-style: dashed;
  }
  .tick {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--pos);
    color: var(--surface);
    font-size: 12px;
    font-weight: 700;
  }
  .soon .tick,
  .tick.open {
    background: none;
    border: 1.5px dashed var(--muted);
  }
  .where {
    font-family: var(--f-mono);
    font-size: 12px;
    color: var(--accent-ink);
    white-space: nowrap;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 9px;
    border-radius: 99px;
    background: var(--heat-soft);
    color: var(--heat-ink);
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }
  .badge::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--heat);
    animation: pulse 1.6s ease-in-out infinite;
  }
  @keyframes pulse {
    50% {
      opacity: 0.3;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .badge::before {
      animation: none;
    }
  }
`;

/**
 * The course roadmap. With `group`, that area's topics as a checklist: covered ones link to the
 * slide that teaches them, the rest say "coming soon". Without it, every area's progress.
 */
@Component({
  selector: 'w-topic-checklist',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'stack' },
  styles: [
    STYLES,
    `
      .head {
        display: grid;
        gap: 8px;
      }
      .head .top {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
      }
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .filters button {
        padding: 5px 12px;
        border: 1px solid var(--line);
        border-radius: 99px;
        background: var(--surface);
        color: var(--muted);
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .filters button[aria-pressed='true'] {
        background: var(--pill-bg);
        border-color: var(--pill-bg);
        color: var(--pill-fg);
      }
      .filters button:focus-visible {
        outline: 2px solid var(--accent-ink);
        outline-offset: 2px;
      }
      .area {
        font-weight: 600;
      }
      .area-row {
        display: grid;
        gap: 6px;
        font-weight: 600;
      }
    `,
  ],
  template: `
    @if (group(); as g) {
      <div class="head">
        <div class="top">
          <span class="area">{{ g.name }}</span>
          <span class="count"
            ><b>{{ stats().done }}</b> of {{ stats().total }} covered</span
          >
        </div>
        <div class="bar" role="img" [attr.aria-label]="barLabel()">
          <i [style.width.%]="stats().pct"></i>
        </div>
        <div class="filters" role="group" aria-label="Show topics">
          @for (f of filters; track f.id) {
            <button
              type="button"
              [attr.aria-pressed]="filter() === f.id"
              (click)="filter.set(f.id)"
            >
              {{ f.label }} · {{ countOf(f.id) }}
            </button>
          }
        </div>
      </div>
      <ul [attr.aria-label]="g.name + ' topics'">
        @for (t of shown(); track t.name) {
          <li>
            @if (t.goto; as to) {
              <button type="button" class="row" (click)="go(to)">
                <span class="tick" aria-hidden="true">✓</span>
                <span>{{ t.name }}<span class="sr-only"> (covered)</span></span>
                <span class="where">{{ where(to) }} →</span>
              </button>
            } @else {
              <div class="row soon">
                <span class="tick" aria-hidden="true"></span>
                <span>{{ t.name }}</span>
                <span class="badge">Coming soon</span>
              </div>
            }
          </li>
        } @empty {
          <li class="count">Nothing here yet.</li>
        }
      </ul>
    } @else {
      <div class="head">
        <div class="top">
          <span class="area">Whole course</span>
          <span class="count"
            ><b>{{ stats().done }}</b> of {{ stats().total }} topics covered</span
          >
        </div>
        <div class="bar" role="img" [attr.aria-label]="barLabel()">
          <i [style.width.%]="stats().pct"></i>
        </div>
      </div>
      <ul aria-label="Areas">
        @for (a of areas(); track a.id) {
          <li>
            <button type="button" class="row" (click)="open(a.slide)">
              <span class="tick" [class.open]="a.done < a.total" aria-hidden="true">{{
                a.done === a.total ? '✓' : ''
              }}</span>
              <span class="area-row">
                {{ a.name }}
                <span class="bar" aria-hidden="true"><i [style.width.%]="a.pct"></i></span>
              </span>
              <span class="count"
                ><b>{{ a.done }}</b> / {{ a.total }}</span
              >
            </button>
          </li>
        }
      </ul>
    }
  `,
})
export class TopicChecklistWidget {
  readonly props = input<{ group?: string }>({});
  private readonly nav = inject(CourseNav);

  protected readonly filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'done', label: 'Covered' },
    { id: 'soon', label: 'Coming soon' },
  ];
  protected readonly filter = signal<Filter>('all');

  protected readonly group = computed(() => ROADMAP.find((g) => g.id === this.props().group));
  private readonly topics = computed(
    () => this.group()?.topics ?? ROADMAP.flatMap((g) => g.topics),
  );
  protected readonly stats = computed(() => coverage(this.topics()));
  protected readonly barLabel = computed(
    () => `${this.stats().done} of ${this.stats().total} topics covered`,
  );
  protected readonly shown = computed(() => {
    const f = this.filter();
    return this.topics().filter((t) => f === 'all' || (f === 'done') === !!t.goto);
  });
  protected readonly areas = computed(() =>
    ROADMAP.map((g) => ({ id: g.id, name: g.name, slide: g.slide, ...coverage(g.topics) })),
  );

  protected countOf(f: Filter) {
    const s = this.stats();
    return f === 'all' ? s.total : f === 'done' ? s.done : s.total - s.done;
  }
  /** "Tokens · 6": the chapter's name and slide number. */
  protected where(g: Goto) {
    const name = this.nav.chapters.find((c) => c.id === g.chapter)?.name ?? g.chapter;
    return `${name.split(':')[0]} · ${g.slide ?? 1}`;
  }
  protected go(g: Goto) {
    this.nav.goto(g.chapter, (g.slide ?? 1) - 1);
  }
  protected open(slide: number) {
    this.nav.goto('roadmap', slide - 1);
  }
}
