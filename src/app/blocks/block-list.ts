import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Block } from '../course/content.model';
import { CodeBlock } from '../shared/code-block/code-block';
import { EmbedBlock } from './embed';
import { WidgetHost } from './widget-host';
import { Bars, Chips, Stat, TableBlock } from './simple-blocks';
import { Stages } from './stages';
import { Stepper } from './stepper';
import { Tabs } from './tabs';

/**
 * Renders a list of content blocks from JSON.
 * Top level: each visual block gets its own .panel; captions and code sit between panels.
 * Nested (inside a panel, tab or stepper): blocks render bare, stacked with a gap.
 */
@Component({
  selector: 'app-blocks',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CodeBlock,
    EmbedBlock,
    WidgetHost,
    Stages,
    Chips,
    Bars,
    TableBlock,
    Stat,
    Tabs,
    Stepper,
  ],
  host: {
    '[class.stack]': 'nested()',
    '[style.display]': 'nested() ? "flex" : "contents"',
    '[style.gap.px]': 'nested() ? 12 : null',
  },
  template: `
    @for (b of blocks(); track $index) {
      @switch (b.type) {
        @case ('caption') {
          <p class="cap" [innerHTML]="b.html"></p>
        }
        @case ('code') {
          <div>
            @if (b.title) {
              <p class="cap" style="margin-bottom:8px">{{ b.title }}</p>
            }
            <app-code-block [source]="b.source.join('\\n')" />
          </div>
        }
        @case ('widget') {
          <app-widget-host [name]="b.name" [props]="b.props" />
        }
        @case ('panel') {
          @if (b.title) {
            <details class="panel" [class.warn]="b.tone === 'neg'" [open]="b.open ?? false">
              <summary [innerHTML]="b.title"></summary>
              <app-blocks [blocks]="b.blocks" [nested]="true" />
            </details>
          } @else {
            <div class="panel" [class.warn]="b.tone === 'neg'">
              <app-blocks [blocks]="b.blocks" [nested]="true" />
            </div>
          }
        }
        @default {
          <div [class.panel]="!nested()">
            @switch (b.type) {
              @case ('stages') {
                <app-stages [items]="b.items" />
              }
              @case ('chips') {
                <app-chips [items]="b.items" />
              }
              @case ('bars') {
                <app-bars [items]="b.items" [layout]="b.layout ?? 'inline'" />
              }
              @case ('table') {
                <app-table-block [rows]="b.rows" />
              }
              @case ('stat') {
                <app-stat [items]="b.items" />
              }
              @case ('embed') {
                <app-embed
                  [src]="b.src"
                  [title]="b.title"
                  [description]="b.description"
                  [height]="b.height ?? 600"
                />
              }
              @case ('shape') {
                <div class="shape">{{ b.text }}</div>
              }
              @case ('tabs') {
                <app-tabs [tabs]="b.tabs" [selected]="b.selected ?? 0" />
              }
              @case ('stepper') {
                <app-stepper
                  [steps]="b.steps"
                  [accumulate]="b.accumulate ?? false"
                  [nextLabel]="b.nextLabel ?? 'Next step'"
                  [restartLabel]="b.restartLabel ?? 'Reset'"
                />
              }
            }
          </div>
        }
      }
    }
  `,
})
export class BlockList {
  readonly blocks = input.required<Block[]>();
  readonly nested = input(false);
}
