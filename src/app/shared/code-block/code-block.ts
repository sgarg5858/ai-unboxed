import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { highlight } from './highlight';

@Component({
  selector: 'app-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<pre class="code" [innerHTML]="html()"></pre>`,
})
export class CodeBlock {
  readonly source = input.required<string>();
  protected readonly html = computed(() => highlight(this.source()));
}
