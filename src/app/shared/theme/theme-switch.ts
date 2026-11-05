import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Theme, ThemeChoice } from './theme';

/** Segmented Auto / Light / Dark control. */
@Component({
  selector: 'app-theme-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="theme-switch" role="group" aria-label="Colour theme">
      @for (o of options; track o.value) {
        <button
          type="button"
          [attr.aria-pressed]="theme.choice() === o.value"
          [attr.title]="o.title"
          (click)="theme.set(o.value)"
        >
          <span aria-hidden="true">{{ o.icon }}</span>
          <span class="theme-label">{{ o.label }}</span>
        </button>
      }
    </div>
  `,
})
export class ThemeSwitch {
  protected readonly theme = inject(Theme);
  protected readonly options: { value: ThemeChoice; label: string; icon: string; title: string }[] =
    [
      { value: 'auto', label: 'Auto', icon: '◐', title: 'Follow your system setting' },
      { value: 'light', label: 'Light', icon: '☀', title: 'Light theme' },
      { value: 'dark', label: 'Dark', icon: '☾', title: 'Dark theme' },
    ];
}
