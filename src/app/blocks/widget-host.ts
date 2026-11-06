import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Type,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import { WIDGETS, loadWidget, loadedWidget } from '../widgets/registry';

/**
 * Renders a named widget. The chapter resolver has usually fetched its code already, so it
 * appears immediately; otherwise it loads here first.
 */
@Component({
  selector: 'app-widget-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet],
  host: { class: 'contents' },
  template: `
    @if (!known()) {
      <p class="cap" style="color:var(--neg-ink)">Unknown widget "{{ name() }}"</p>
    } @else if (type(); as w) {
      <ng-container *ngComponentOutlet="w; inputs: props() ? { props: props() } : {}" />
    } @else {
      <div class="panel" aria-busy="true" style="min-height:160px"></div>
    }
  `,
})
export class WidgetHost {
  readonly name = input.required<string>();
  readonly props = input<Record<string, unknown>>();
  protected readonly known = computed(() => this.name() in WIDGETS);
  private readonly fetched = signal<Type<unknown> | undefined>(undefined);
  protected readonly type = computed(() => loadedWidget(this.name()) ?? this.fetched());

  constructor() {
    effect(() => {
      const name = this.name();
      if (loadedWidget(name) || !this.known()) return;
      loadWidget(name).then((t) => {
        if (this.name() === name) this.fetched.set(t);
      });
    });
  }
}
