import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface Cell {
  text: string;
  style: string;
}

/** Labelled numeric matrix. `cell` decides each cell's text and inline style. */
@Component({
  selector: 'app-matrix-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block' },
  template: `
    <div class="scroll">
      <table class="matrix">
        <tr>
          <th></th>
          @for (c of colLabels(); track $index) {
            <th style="text-align:center">{{ c }}</th>
          }
        </tr>
        @for (r of rows(); track $index; let i = $index) {
          <tr>
            <th>{{ rowLabels()[i] }}</th>
            @for (v of r; track $index; let j = $index) {
              @let c = cell()(v, i, j);
              <td [style]="c.style">{{ c.text }}</td>
            }
          </tr>
        }
      </table>
    </div>
  `,
})
export class MatrixTable {
  readonly rows = input.required<number[][]>();
  readonly rowLabels = input.required<string[]>();
  readonly colLabels = input.required<string[]>();
  readonly cell = input.required<(v: number, i: number, j: number) => Cell>();
}
