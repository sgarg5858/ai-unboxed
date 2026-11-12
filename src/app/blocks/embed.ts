import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * A live external tool, loaded only when the reader asks for it: nothing from the other site
 * is fetched until "Try it here" is pressed. Only https URLs are accepted.
 */
@Component({
  selector: 'app-embed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:block' },
  template: `
    <p style="margin:0 0 4px;font-weight:700">{{ title() }}</p>
    @if (description()) {
      <p class="cap" style="margin:0 0 12px">{{ description() }}</p>
    }
    @if (safeSrc(); as url) {
      @if (loaded()) {
        <iframe
          [src]="url"
          [title]="title()"
          [style.height.px]="height()"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerpolicy="no-referrer"
          style="display:block;width:100%;border:1px solid var(--line);border-radius:10px;background:#fff"
        ></iframe>
      }
      <div class="row" style="margin-top:10px">
        @if (loaded()) {
          <button type="button" class="btn" (click)="loaded.set(false)">
            <span aria-hidden="true">✕</span> Close
          </button>
        } @else {
          <button type="button" class="btn on" (click)="loaded.set(true)">
            <span aria-hidden="true">▶</span> Try it here
          </button>
        }
        <a class="btn" [href]="src()" target="_blank" rel="noopener noreferrer"
          >Open in a new tab <span aria-hidden="true">↗</span></a
        >
      </div>
      @if (!loaded()) {
        <p class="cap" style="margin:8px 0 0">Loads {{ host() }}, an external site.</p>
      }
    }
  `,
})
export class EmbedBlock {
  readonly src = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly height = input(600);
  protected readonly loaded = signal(false);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly host = computed(() => new URL(this.src()).host);
  /** Content is trusted (it ships with the site), but still refuse anything that isn't https. */
  protected readonly safeSrc = computed(() =>
    this.src().startsWith('https://')
      ? this.sanitizer.bypassSecurityTrustResourceUrl(this.src())
      : null,
  );
}
