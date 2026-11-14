import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

export interface ComingSoonProps {
  /** Section number shown in the core, e.g. "04". */
  num: string;
  title: string;
  /** Short labels (two or three words) that orbit the core. */
  orbit: string[];
  /** Lines that cycle under the progress bar. */
  status: string[];
  /** How far along the chapter is, 0 to 1. */
  progress: number;
}

const GLYPHS = '▓▒░<>/\\_=+*#01{}';
const ORBIT_MS = 26000;

/** Where a chip sits on a tilted ellipse at angle a: position plus a depth for scale and fade. */
export const orbitPoint = (a: number) => {
  const depth = (Math.sin(a) + 1) / 2;
  return { x: 50 + 40 * Math.cos(a), y: 50 + 30 * Math.sin(a), depth };
};

/** The title as it decodes: characters before `shown` are real, the rest are glyphs. */
export const scramble = (text: string, ms: number) =>
  [...text]
    .map((ch, i) =>
      ch === ' ' || ms > i * 45 ? ch : GLYPHS[(Math.floor(ms / 70) + i * 7) % GLYPHS.length],
    )
    .join('');

/** An animated "coming soon" stage for a chapter that isn't written yet. */
@Component({
  selector: 'w-coming-soon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  styles: `
    .stage {
      position: relative;
      height: 380px;
      overflow: hidden;
      padding: 0;
      background:
        radial-gradient(
          circle at 50% 46%,
          color-mix(in srgb, var(--accent) 22%, transparent),
          transparent 55%
        ),
        var(--sunk);
    }
    .floor {
      position: absolute;
      inset: 55% -40% -30%;
      background-image:
        linear-gradient(var(--line) 1px, transparent 1px),
        linear-gradient(90deg, var(--line) 1px, transparent 1px);
      background-size: 36px 36px;
      transform: perspective(260px) rotateX(62deg);
      animation: floor 2.4s linear infinite;
    }
    @keyframes floor {
      to {
        background-position: 0 36px;
      }
    }
    .chip {
      position: absolute;
      translate: -50% -50%;
      padding: 4px 10px;
      border: 1px solid var(--accent);
      border-radius: 999px;
      background: var(--surface);
      color: var(--accent-ink);
      font: 600 12px var(--f-mono);
      white-space: nowrap;
    }
    .core {
      position: absolute;
      left: 50%;
      top: 50%;
      translate: -50% -50%;
      width: 96px;
      height: 96px;
      border: 2px solid var(--heat);
      border-radius: 50%;
      background: var(--surface);
      color: var(--heat-ink);
      font: 800 24px var(--f-display);
      cursor: pointer;
      z-index: 50;
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--heat) 50%, transparent);
      animation: ring 2s ease-out infinite;
    }
    .core small {
      display: block;
      font: 700 10px var(--f-mono);
      letter-spacing: 0.2em;
    }
    @keyframes ring {
      to {
        box-shadow: 0 0 0 26px transparent;
      }
    }
    .hud {
      position: absolute;
      inset: auto 16px 14px;
      z-index: 60;
    }
    .title {
      margin: 0 0 8px;
      font: 800 clamp(18px, 3vw, 24px) var(--f-mono);
      color: var(--ink);
    }
    .bar {
      height: 8px;
      border-radius: 4px;
      background: var(--line);
      overflow: hidden;
    }
    .bar i {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, var(--accent), var(--heat), var(--accent));
      background-size: 200% 100%;
      animation: shimmer 1.4s linear infinite;
    }
    @keyframes shimmer {
      to {
        background-position: -200% 0;
      }
    }
    .status {
      margin: 6px 0 0;
      font: 12px var(--f-mono);
      color: var(--muted);
    }
    @media (prefers-reduced-motion: reduce) {
      .floor,
      .core,
      .bar i {
        animation: none;
      }
    }
  `,
  template: `
    @let p = props();
    <div class="panel stage" (pointerenter)="paused.set(true)" (pointerleave)="paused.set(false)">
      <div class="floor" aria-hidden="true"></div>
      @for (c of chips(); track c.label) {
        <span
          class="chip"
          aria-hidden="true"
          [style.left.%]="c.x"
          [style.top.%]="c.y"
          [style.scale]="c.scale"
          [style.opacity]="c.opacity"
          [style.z-index]="c.z"
          >{{ c.label }}</span
        >
      }
      <button type="button" class="core" aria-label="Replay the animation" (click)="replay()">
        {{ p.num }}<small>SOON</small>
      </button>
      <div class="hud">
        <p class="title">
          <span aria-hidden="true">{{ title() }}</span
          ><span class="sr-only">{{ p.title }}: coming soon</span>
        </p>
        <div
          class="bar"
          role="progressbar"
          aria-label="How much of this chapter is ready"
          aria-valuemin="0"
          aria-valuemax="100"
          [attr.aria-valuenow]="pct()"
        >
          <i [style.width.%]="pct()"></i>
        </div>
        <p class="status">{{ pct() }}% · {{ status() }}…</p>
      </div>
    </div>
  `,
})
export class ComingSoonWidget {
  readonly props = input.required<ComingSoonProps>();
  /** Milliseconds since the title started decoding. Starts large so a static render is readable. */
  private readonly ms = signal(1e9);
  /** Orbit angle in radians; stops while the pointer is over the stage. */
  private readonly angle = signal(0);
  protected readonly paused = signal(false);

  protected readonly pct = computed(() => Math.round(this.props().progress * 100));
  protected readonly title = computed(() => scramble(this.props().title, this.ms()));
  protected readonly status = computed(() => {
    const s = this.props().status;
    return s[Math.floor(Math.min(this.ms(), 1e6) / 2200) % s.length];
  });
  protected readonly chips = computed(() => {
    const labels = this.props().orbit;
    return labels.map((label, i) => {
      const { x, y, depth } = orbitPoint(this.angle() + (i / labels.length) * 2 * Math.PI);
      return {
        label,
        x,
        y: y - 8,
        scale: 0.75 + 0.35 * depth,
        opacity: 0.45 + 0.55 * depth,
        z: Math.round(depth * 40),
      };
    });
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (still || typeof requestAnimationFrame !== 'function') return;
      this.ms.set(0);
      let last = performance.now();
      let id = 0;
      const frame = (now: number) => {
        const dt = now - last;
        last = now;
        this.ms.update((m) => m + dt);
        if (!this.paused()) this.angle.update((a) => a + (dt / ORBIT_MS) * 2 * Math.PI);
        id = requestAnimationFrame(frame);
      };
      id = requestAnimationFrame(frame);
      destroyRef.onDestroy(() => cancelAnimationFrame(id));
    });
  }

  protected replay() {
    if (this.ms() < 1e8) this.ms.set(0);
  }
}
