import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BarItem, ChipItem, TableRow } from '../course/content.model';
import { heatCell } from '../shared/lib/format';

@Component({
  selector: 'app-chips',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'row' },
  template: `
    @for (c of items(); track $index) {
      <span class="chip" [class.hot]="c.hot" [class.dim]="c.dim"
        >{{ c.text }}
        @if (c.sub) {
          <small>{{ c.sub }}</small>
        }
      </span>
    }
  `,
})
export class Chips {
  readonly items = input.required<ChipItem[]>();
}

@Component({
  selector: 'app-bars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block' },
  template: `
    @if (layout() === 'stacked') {
      <div class="stack" style="gap:10px">
        @for (b of items(); track $index) {
          <div>
            <div class="row" style="justify-content:space-between;font-size:13px">
              <span>{{ b.label }}</span
              ><span class="mono" style="color:var(--muted)">{{ b.display }}</span>
            </div>
            <div
              style="height:10px;background:var(--surface);border-radius:5px;overflow:hidden;margin-top:4px"
            >
              <i
                style="display:block;height:100%;background:var(--accent)"
                [style.width.%]="b.value * 100"
              ></i>
            </div>
          </div>
        }
      </div>
    } @else {
      @for (b of items(); track $index) {
        <div class="bar">
          <span>{{ b.label }}</span>
          <div class="t"><i [style.width.%]="b.value * 100"></i></div>
          <span>{{ b.display }}</span>
        </div>
      }
    }
  `,
})
export class Bars {
  readonly items = input.required<BarItem[]>();
  readonly layout = input<'inline' | 'stacked'>('inline');
}

@Component({
  selector: 'app-table-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'scroll', style: 'display:block' },
  template: `
    <table class="matrix">
      @for (r of rows(); track $index) {
        <tr>
          <th>{{ r.head }}</th>
          @for (c of r.cells; track $index) {
            <td [style]="cellStyle(c.tone)">{{ c.text }}</td>
          }
        </tr>
      }
    </table>
  `,
})
export class TableBlock {
  readonly rows = input.required<TableRow[]>();
  protected cellStyle = (t?: 'accent' | 'heat') =>
    t === 'heat'
      ? heatCell(0.45)
      : t === 'accent'
        ? 'background:var(--accent-soft);color:var(--accent-ink)'
        : '';
}

@Component({
  selector: 'app-stat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'stat' },
  template: `
    @for (s of items(); track $index) {
      <div>
        <b>{{ s.value }}</b
        ><span>{{ s.label }}</span>
      </div>
    }
  `,
})
export class Stat {
  readonly items = input.required<{ value: string; label: string }[]>();
}
