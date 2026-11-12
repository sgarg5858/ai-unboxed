import { ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';

/** Every keyboard shortcut in one dialog, opened with "?". */
@Component({
  selector: 'app-shortcuts-help',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    dialog {
      width: min(440px, calc(100vw - 24px));
      padding: 0;
      border: 1px solid var(--line);
      border-radius: 16px;
      background: var(--surface);
      color: var(--ink);
      box-shadow: 0 24px 64px -16px rgb(0 0 0 / 0.45);
    }
    dialog::backdrop {
      background: rgb(0 0 0 / 0.45);
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px 6px;
    }
    h2 {
      margin: 0;
      font-size: 18px;
    }
    dl {
      display: grid;
      grid-template-columns: max-content minmax(0, 1fr);
      gap: 10px 16px;
      margin: 0;
      padding: 8px 16px 18px;
      font-size: 15px;
    }
    dt {
      display: flex;
      gap: 4px;
    }
    dd {
      margin: 0;
      color: var(--muted);
    }
    kbd {
      font-family: var(--f-mono);
      font-size: 12px;
      min-width: 24px;
      text-align: center;
      border: 1px solid var(--line);
      border-bottom-width: 2px;
      border-radius: 5px;
      padding: 1px 6px;
      color: var(--ink);
    }
  `,
  template: `
    <dialog #dialog aria-labelledby="keys-title" (click)="closeOnBackdrop($event)">
      <div class="head">
        <h2 id="keys-title">Keyboard shortcuts</h2>
        <button type="button" class="btn" aria-label="Close" (click)="close()">✕</button>
      </div>
      <dl>
        <dt><kbd>→</kbd></dt>
        <dd>Next slide</dd>
        <dt><kbd>←</kbd></dt>
        <dd>Previous slide</dd>
        <dt><kbd>/</kbd> <kbd>⌘K</kbd></dt>
        <dd>Search every slide</dd>
        <dt><kbd>[</kbd></dt>
        <dd>Hide or show the sidebar (wide screens)</dd>
        <dt><kbd>Tab</kbd></dt>
        <dd>First press shows “Skip to slide”</dd>
        <dt><kbd>?</kbd></dt>
        <dd>This list</dd>
        <dt><kbd>Esc</kbd></dt>
        <dd>Close any dialog</dd>
      </dl>
    </dialog>
  `,
})
export class ShortcutsHelp {
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open() {
    const d = this.dialog().nativeElement;
    if (!d.open) d.showModal?.();
  }

  close() {
    this.dialog().nativeElement.close?.();
  }

  protected closeOnBackdrop(e: MouseEvent) {
    if (e.target === this.dialog().nativeElement) this.close();
  }
}
