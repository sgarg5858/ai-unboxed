import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Goto } from '../course/content.model';
import { CourseNav } from '../course/course-nav';

/** Box kinds drive styling: the model, control points that can block a request, stores, offline loop. */
type Kind = 'core' | 'control' | 'plain' | 'offline' | 'tool';

interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  /** Optional second sub-line (tall boxes only). */
  sub2?: string;
  kind: Kind;
}

interface Edge {
  d: string;
  label?: string;
  lx?: number;
  ly?: number;
  anchor?: 'start' | 'middle';
  dashed?: boolean;
  both?: boolean;
}

export interface ArchitectureNode {
  title: string;
  detail: string;
  link?: Goto;
}

// Layout grid: left column (offline loop + memory), main request column, right column (tools).
const L = { x: 12, w: 110 };
const M = { x: 184, w: 196 };
const R = { x: 440, w: 146 };
const CX = M.x + M.w / 2;

const BOXES: Box[] = [
  {
    id: 'user',
    ...M,
    y: 14,
    h: 38,
    title: 'User & client app',
    sub: 'web · mobile · API',
    kind: 'plain',
  },
  {
    id: 'gateway',
    ...M,
    y: 86,
    h: 44,
    title: 'Security & auth',
    sub: 'API keys · OAuth · rate limits',
    kind: 'control',
  },
  {
    id: 'input',
    ...M,
    y: 246,
    h: 44,
    title: 'Input guardrails',
    sub: 'checks the whole conversation',
    kind: 'control',
  },
  {
    id: 'convo',
    ...M,
    y: 162,
    h: 52,
    title: 'Conversation manager',
    sub: 'history · prompt assembly',
    kind: 'plain',
  },
  {
    id: 'llm',
    ...M,
    y: 326,
    h: 70,
    title: 'LLM',
    sub: 'values from safety training',
    kind: 'core',
  },
  {
    id: 'output',
    ...M,
    y: 432,
    h: 44,
    title: 'Output guardrails',
    sub: 'stream classifier · can halt',
    kind: 'control',
  },
  {
    id: 'reply',
    ...M,
    y: 510,
    h: 40,
    title: 'Reply to user',
    sub: 'citations · rendering',
    kind: 'plain',
  },

  { id: 'memory', ...L, y: 162, h: 52, title: 'Memory', sub: 'saved user facts', kind: 'plain' },
  {
    id: 'training',
    ...L,
    y: 326,
    h: 70,
    title: 'Safety training',
    sub: 'SFT · RLHF · spec',
    kind: 'offline',
  },
  {
    id: 'feedback',
    ...L,
    y: 432,
    h: 44,
    title: 'Human feedback',
    sub: 'labels · ratings',
    kind: 'offline',
  },
  {
    id: 'monitoring',
    ...L,
    y: 510,
    h: 40,
    title: 'Monitoring',
    sub: 'abuse detection',
    kind: 'offline',
  },

  {
    id: 'runtime',
    ...R,
    y: 326,
    h: 70,
    title: 'Tool runtime',
    sub: 'permissions · sandbox',
    sub2: 'scans results',
    kind: 'control',
  },
  { id: 'web', x: 458, w: 128, y: 418, h: 30, title: 'Web search', kind: 'tool' },
  { id: 'files', x: 458, w: 128, y: 456, h: 30, title: 'Files & code', kind: 'tool' },
  { id: 'retrieval', x: 458, w: 128, y: 494, h: 30, title: 'Retrieval (RAG)', kind: 'tool' },
  { id: 'mcp', x: 458, w: 128, y: 532, h: 30, title: 'MCP · APIs', kind: 'tool' },
];

const down = (y1: number, y2: number, label: string): Edge => ({
  d: `M${CX} ${y1}V${y2 - 2}`,
  label,
  lx: CX + 8,
  ly: (y1 + y2) / 2 + 4,
  anchor: 'start',
});

const EDGES: Edge[] = [
  // Per-request path, top to bottom
  down(52, 86, 'request + credentials'),
  down(130, 162, 'authorised'),
  down(214, 246, 'full context'),
  down(290, 326, 'allowed prompt'),
  down(396, 432, 'streamed tokens'),
  down(476, 510, 'checked reply'),
  // Memory and tools
  { d: 'M124 188H182', label: 'load/save', lx: 153, ly: 182, anchor: 'middle', both: true },
  { d: 'M382 350H438', label: 'tool call', lx: 410, ly: 344, anchor: 'middle' },
  { d: 'M438 374H382', label: 'result', lx: 410, ly: 388, anchor: 'middle' },
  { d: 'M446 396V547M446 433H456M446 471H456M446 509H456M446 547H456' },
  // Offline improvement loop
  { d: 'M182 540H124', label: 'logs', lx: 153, ly: 534, anchor: 'middle', dashed: true },
  { d: 'M182 516H152V454H124', label: 'ratings', lx: 156, ly: 494, anchor: 'start', dashed: true },
  { d: 'M67 510V478', label: 'flagged', lx: 73, ly: 497, anchor: 'start', dashed: true },
  { d: 'M67 432V398', label: 'preferences', lx: 73, ly: 419, anchor: 'start', dashed: true },
  { d: 'M124 361H182', label: 'weights', lx: 153, ly: 355, anchor: 'middle', dashed: true },
];

@Component({
  selector: 'w-assistant-architecture',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  styles: `
    .t-title {
      font-family: var(--f-body);
      font-size: 12px;
      font-weight: 500;
      fill: var(--ink);
    }
    .t-sub {
      font-size: 9.5px;
      fill: var(--muted);
    }
    .t-edge {
      font-size: 9.5px;
      fill: var(--muted);
    }
    .node {
      cursor: pointer;
      outline: none;
    }
    .node:focus-visible rect {
      stroke: var(--accent);
      stroke-width: 2.5;
    }
  `,
  template: `
    @let sel = selected();
    <div class="panel">
      <figure style="margin:0">
        <div class="scroll">
          <svg
            viewBox="0 0 598 604"
            width="100%"
            style="min-width:540px;display:block"
            role="img"
            aria-label="AI assistant architecture: a request flows from the user through security and auth and the conversation manager, then input guardrails check the full context before the LLM, which calls tools through a runtime that checks permissions and scans results; output guardrails check the reply. An offline loop of monitoring, user ratings, human feedback and safety training produces new model weights."
          >
            <defs>
              <marker
                id="arch-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M1 1L8 5L1 9" fill="none" stroke="var(--muted)" stroke-width="1.6" />
              </marker>
            </defs>

            <!-- offline zone backdrop -->
            <rect
              x="4"
              y="316"
              width="126"
              height="244"
              rx="10"
              fill="none"
              stroke="var(--line)"
              stroke-dasharray="3 4"
            />
            <text class="t-edge" x="67" y="312" text-anchor="middle">offline loop</text>

            @for (e of edges; track $index) {
              <path
                [attr.d]="e.d"
                fill="none"
                stroke="var(--muted)"
                stroke-width="1.3"
                [attr.stroke-dasharray]="e.dashed ? '4 3' : null"
                [attr.marker-end]="e.label ? 'url(#arch-arrow)' : null"
                [attr.marker-start]="e.both ? 'url(#arch-arrow)' : null"
              />
              @if (e.label) {
                <text class="t-edge" [attr.x]="e.lx" [attr.y]="e.ly" [attr.text-anchor]="e.anchor">
                  {{ e.label }}
                </text>
              }
            }

            @for (b of boxes; track b.id) {
              <g
                class="node"
                role="button"
                tabindex="0"
                [attr.aria-label]="b.title"
                [attr.aria-pressed]="sel === b.id"
                (click)="selected.set(b.id)"
                (keydown.enter)="selected.set(b.id)"
              >
                <rect
                  [attr.x]="b.x"
                  [attr.y]="b.y"
                  [attr.width]="b.w"
                  [attr.height]="b.h"
                  rx="8"
                  [attr.fill]="fill(b.kind)"
                  [attr.stroke]="sel === b.id ? 'var(--ink)' : stroke(b.kind)"
                  [attr.stroke-width]="
                    sel === b.id ? 2.2 : b.kind === 'control' || b.kind === 'core' ? 1.6 : 1
                  "
                  [attr.stroke-dasharray]="b.kind === 'offline' && sel !== b.id ? '4 3' : null"
                />
                <text
                  class="t-title"
                  [attr.x]="b.x + b.w / 2"
                  [attr.y]="
                    b.sub2 ? b.y + b.h / 2 - 8 : b.sub ? b.y + b.h / 2 - 2 : b.y + b.h / 2 + 4
                  "
                  text-anchor="middle"
                  [style.font-size.px]="b.kind === 'core' ? 15 : b.kind === 'tool' ? 11 : null"
                >
                  {{ b.title }}
                </text>
                @if (b.sub) {
                  <text
                    class="t-sub"
                    [attr.x]="b.x + b.w / 2"
                    [attr.y]="b.sub2 ? b.y + b.h / 2 + 7 : b.y + b.h / 2 + 12"
                    text-anchor="middle"
                  >
                    {{ b.sub }}
                  </text>
                }
                @if (b.sub2) {
                  <text
                    class="t-sub"
                    [attr.x]="b.x + b.w / 2"
                    [attr.y]="b.y + b.h / 2 + 20"
                    text-anchor="middle"
                  >
                    {{ b.sub2 }}
                  </text>
                }
              </g>
            }

            <!-- legend -->
            <g transform="translate(12 584)">
              <path
                d="M0 0H26"
                stroke="var(--muted)"
                stroke-width="1.3"
                marker-end="url(#arch-arrow)"
              />
              <text class="t-edge" x="32" y="3.5">per request</text>
              <path
                d="M112 0H138"
                stroke="var(--muted)"
                stroke-width="1.3"
                stroke-dasharray="4 3"
                marker-end="url(#arch-arrow)"
              />
              <text class="t-edge" x="144" y="3.5">offline: days to months</text>
              <rect
                x="300"
                y="-6"
                width="16"
                height="12"
                rx="3"
                fill="var(--surface)"
                stroke="var(--heat)"
                stroke-width="1.6"
              />
              <text class="t-edge" x="322" y="3.5">can block a request</text>
              <rect
                x="440"
                y="-6"
                width="16"
                height="12"
                rx="3"
                fill="var(--accent-soft)"
                stroke="var(--accent)"
                stroke-width="1.6"
              />
              <text class="t-edge" x="462" y="3.5">the model</text>
            </g>
          </svg>
        </div>
        <figcaption class="cap" style="margin-top:6px">
          Click any box for details. The model sits in the middle of a request path that ordinary
          code controls at every step.
        </figcaption>
      </figure>
      @if (detail(); as d) {
        <div class="stage cur" style="margin-top:12px;display:block">
          <b style="font-weight:500">{{ d.title }}</b>
          <p class="cap" style="margin:4px 0 0;color:var(--ink)" [innerHTML]="d.detail"></p>
          @if (d.link) {
            <button class="btn" style="margin-top:10px" (click)="go(d.link)">Read more →</button>
          }
        </div>
      }
    </div>
  `,
})
export class AssistantArchitectureWidget {
  readonly props = input.required<{ nodes: Record<string, ArchitectureNode> }>();
  private readonly nav = inject(CourseNav);
  protected readonly boxes = BOXES;
  protected readonly edges = EDGES;
  protected readonly selected = signal('llm');
  protected readonly detail = computed(() => this.props().nodes[this.selected()]);

  protected fill(k: Kind) {
    return k === 'core' ? 'var(--accent-soft)' : k === 'offline' ? 'var(--sunk)' : 'var(--surface)';
  }
  protected stroke(k: Kind) {
    return k === 'core' ? 'var(--accent)' : k === 'control' ? 'var(--heat)' : 'var(--line)';
  }
  protected go(g: Goto) {
    this.nav.goto(g.chapter, (g.slide ?? 1) - 1);
  }
}
