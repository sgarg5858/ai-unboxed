import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

/** Labelled range input. Two-way bind with [(value)]. */
@Component({
  selector: 'app-slider',
  styleUrl: './slider.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block' },
  template: `
    <label class="ctl">
      <span>{{ label() }}</span>
      <input
        type="range"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [value]="value()"
        (input)="value.set(+$any($event.target).value)"
      />
      <output>{{ display() }}</output>
    </label>
  `,
})
export class Slider {
  readonly label = input.required<string>();
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly value = model.required<number>();
  readonly format = input<(v: number) => string>((v) => String(v));
  protected readonly display = computed(() => this.format()(this.value()));
}
