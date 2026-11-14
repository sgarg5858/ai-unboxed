import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Theme, ThemeChoice } from './theme';

/** Segmented Auto / Light / Dark / Glass control. Phones get one button that steps through them. */
@Component({
  selector: 'app-theme-switch',
  styleUrl: './theme-switch.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="theme-switch" role="group" aria-label="Colour theme">
      @for (o of options; track o.value) {
        <button
          type="button"
          [attr.aria-pressed]="theme.choice() === o.value"
          [attr.title]="o.title"
          [attr.aria-label]="o.label"
          (click)="theme.set(o.value)"
        >
          <span aria-hidden="true">{{ o.icon }}</span>
          <span class="theme-label">{{ o.label }}</span>
        </button>
      }
    </div>
    @let c = current();
    <button
      type="button"
      class="theme-cycle"
      [attr.aria-label]="'Theme: ' + c.label + '. Switch to ' + next().label"
      [attr.title]="'Theme: ' + c.label"
      (click)="theme.set(next().value)"
    >
      <span aria-hidden="true">{{ c.icon }}</span>
    </button>
  `,
})
export class ThemeSwitch {
  protected readonly theme = inject(Theme);
  protected readonly options: { value: ThemeChoice; label: string; icon: string; title: string }[] =
    [
      { value: 'auto', label: 'Auto', icon: '◐', title: 'Follow your system setting' },
      { value: 'light', label: 'Light', icon: '☀', title: 'Light theme' },
      { value: 'dark', label: 'Dark', icon: '☾', title: 'Dark theme' },
      {
        value: 'glass',
        label: 'Glass',
        icon: '◇',
        title: 'Glass theme: frosted, see-through panels',
      },
    ];
  private readonly index = computed(() =>
    this.options.findIndex((o) => o.value === this.theme.choice()),
  );
  protected readonly current = computed(() => this.options[this.index()]);
  protected readonly next = computed(() => this.options[(this.index() + 1) % this.options.length]);
}
