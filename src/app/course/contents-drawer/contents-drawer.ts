import { ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';
import { CourseOutline } from '../course-outline/course-outline';

/** The course outline in a slide-in panel, for screens too narrow for the sidebar. */
@Component({
  selector: 'app-contents-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CourseOutline],
  styleUrl: './contents-drawer.css',
  template: `
    <dialog #dialog aria-label="Course contents" (click)="closeOnBackdrop($event)">
      <div class="toc-inner">
        <div class="toc-head">
          <b>Contents</b>
          <button type="button" class="btn" aria-label="Close contents" (click)="close()">✕</button>
        </div>
        <app-course-outline (navigated)="close()" />
      </div>
    </dialog>
  `,
})
export class ContentsDrawer {
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open() {
    this.dialog().nativeElement.showModal();
  }

  close() {
    this.dialog().nativeElement.close();
  }

  /** A click on the dimmed backdrop lands on the <dialog> itself; clicks inside land on children. */
  protected closeOnBackdrop(e: MouseEvent) {
    if (e.target === this.dialog().nativeElement) this.close();
  }
}
