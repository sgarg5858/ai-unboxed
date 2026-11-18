import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { VideoMark } from '../../course/content.model';
import { clock } from '../lib/video';

/**
 * A slim range slider for the video player: filled up to the value, shaded up to `buffer`,
 * thicker on hover. With `seekBar`, it shows the time under the pointer and arrow keys
 * ask for a ±5 s skip instead of moving by one step.
 */
@Component({
  selector: 'app-video-range',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      type="range"
      min="0"
      [max]="max() || 0"
      [step]="step()"
      [value]="value()"
      [style.--p]="pct() + '%'"
      [style.--b]="buffer() + '%'"
      [attr.aria-label]="label()"
      [attr.aria-valuetext]="valueText() ?? null"
      (input)="changed.emit(+$any($event.target).value)"
      (keydown)="onKey($event)"
      (pointermove)="onHover($event)"
      (pointerleave)="hoverAt.set(null)"
    />
    @if (max() > 0) {
      @for (m of marks(); track m.at) {
        @if (m.at > 0) {
          <span class="tick" [style.left.%]="(m.at / max()) * 100" aria-hidden="true"></span>
        }
      }
    }
    @if (seekBar() && hoverAt() !== null) {
      <span class="tip" [style.left.%]="hoverAt()! * 100" aria-hidden="true"
        >{{ clock(hoverAt()! * max()) }}
        @if (markAt(hoverAt()! * max()); as m) {
          · {{ m.label }}
        }
      </span>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      --t: 4px;
    }
    :host(:hover) {
      --t: 7px;
    }
    input {
      display: block;
      width: 100%;
      height: 18px;
      margin: 0;
      background: none;
      appearance: none;
      cursor: pointer;
    }
    .tick {
      position: absolute;
      top: 50%;
      width: 3px;
      height: calc(var(--t) + 4px);
      transform: translate(-50%, -50%);
      border-radius: 2px;
      background: rgba(0, 0, 0, 0.55);
      pointer-events: none;
    }
    input:focus-visible {
      outline: 2px solid var(--player-accent);
      outline-offset: 2px;
    }
    input::-webkit-slider-runnable-track {
      height: var(--t);
      border-radius: 9px;
      background: linear-gradient(
        to right,
        var(--player-accent) var(--p),
        var(--player-buffer) var(--p) var(--b),
        var(--player-track) var(--b)
      );
    }
    input::-moz-range-track {
      height: var(--t);
      border-radius: 9px;
      background: linear-gradient(
        to right,
        var(--player-accent) var(--p),
        var(--player-buffer) var(--p) var(--b),
        var(--player-track) var(--b)
      );
    }
    input::-webkit-slider-thumb {
      appearance: none;
      width: 14px;
      height: 14px;
      margin-top: calc(var(--t) / 2 - 7px);
      border-radius: 50%;
      background: var(--player-ink);
      box-shadow: 0 0 0 4px var(--player-glass);
    }
    input::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border: 0;
      border-radius: 50%;
      background: var(--player-ink);
    }
    .tip {
      position: absolute;
      bottom: 24px;
      translate: -50%;
      padding: 3px 8px;
      border-radius: 6px;
      background: var(--player-ink);
      color: var(--player-bg);
      font: 600 12px var(--f-mono);
      pointer-events: none;
    }
  `,
})
export class VideoRange {
  /** Timestamps, drawn as ticks; the hover tip names the section under the pointer. */
  readonly marks = input<readonly VideoMark[]>([]);
  protected readonly markAt = (t: number) =>
    this.marks().reduce<VideoMark | null>((hit, m) => (m.at <= t ? m : hit), null);
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  readonly label = input.required<string>();
  readonly step = input(0.1);
  /** Loaded share, in percent. */
  readonly buffer = input(0);
  readonly valueText = input<string>();
  readonly seekBar = input(false);
  readonly changed = output<number>();
  /** Arrow keys on the seek bar: skip back (-1) or on (1). */
  readonly nudge = output<1 | -1>();

  protected readonly clock = clock;
  protected readonly hoverAt = signal<number | null>(null);
  protected readonly pct = computed(() => (this.max() ? (this.value() / this.max()) * 100 : 0));

  protected onHover(e: PointerEvent) {
    if (!this.seekBar()) return;
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.hoverAt.set(Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)));
  }

  protected onKey(e: KeyboardEvent) {
    if (!this.seekBar()) return;
    const dir = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key] as
      1 | -1 | undefined;
    if (!dir) return;
    e.preventDefault();
    e.stopPropagation();
    this.nudge.emit(dir);
  }
}
