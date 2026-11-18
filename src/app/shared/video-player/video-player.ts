import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  bufferedAhead,
  clampTime,
  clock,
  cycleRate,
  resumeAt,
  spokenClock,
  stepRate,
} from '../lib/video';
import { VideoMark } from '../../course/content.model';
import { VideoRange } from './video-range';

const SKIP = 5;
const POSITION_KEY = 'ai-unboxed:video:';

/** Safari on iPhone can't put an element in full screen, only the video itself. */
type IosVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

/**
 * A video player with custom controls: play, ±5 s, a scrubber with hover time and buffer,
 * speed, volume and full screen. Double-click the left or right of the picture to skip.
 * It remembers where you stopped. Keys are passed in by the page through `handleKey`.
 * Content projected with the `end` attribute shows over the picture when the video ends.
 */
@Component({
  selector: 'app-video-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VideoRange],
  templateUrl: './video-player.html',
  styleUrl: './video-player.css',
  host: {
    '(document:fullscreenchange)': 'onFullscreenChange()',
  },
})
export class VideoPlayer {
  readonly src = input.required<string>();
  readonly label = input.required<string>();
  readonly poster = input<string>();
  /** Seconds to start at (e.g. a slide's topic), instead of resuming. Applied once. */
  readonly start = input<number | null>(null);
  /** Timestamps shown as ticks on the seek bar. */
  readonly marks = input<readonly VideoMark[]>([]);
  /** Fired once `start` has been applied, so the page can clear it. */
  readonly startApplied = output<void>();

  protected readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');
  private readonly videoRef = viewChild.required<ElementRef<HTMLVideoElement>>('video');
  private get video() {
    return this.videoRef().nativeElement;
  }

  protected readonly playing = signal(false);
  protected readonly started = signal(false);
  protected readonly ended = signal(false);
  protected readonly waiting = signal(false);
  protected readonly failed = signal(false);
  protected readonly current = signal(0);
  protected readonly duration = signal(0);
  protected readonly buffered = signal(0);
  protected readonly volume = signal(1);
  protected readonly muted = signal(false);
  protected readonly rate = signal(1);
  protected readonly fullscreen = signal(false);
  /** The pointer moved recently, so the controls stay up. */
  private readonly active = signal(true);
  /** The "−10 s" bubble; `key` restarts its animation on every press. */
  protected readonly flash = signal<{ dir: 1 | -1; amount: number; key: number } | null>(null);
  protected readonly resumedFrom = signal<number | null>(null);

  protected readonly clock = clock;
  protected readonly idle = computed(() => this.playing() && !this.active());
  protected readonly progress = computed(() =>
    this.duration() ? (this.current() / this.duration()) * 100 : 0,
  );
  protected readonly bufferPct = computed(() => this.buffered() * 100);
  protected readonly timeText = computed(
    () => `${spokenClock(this.current())} of ${spokenClock(this.duration())}`,
  );
  protected readonly volumeShown = computed(() => (this.muted() ? 0 : this.volume()));

  private wakeTimer?: ReturnType<typeof setTimeout>;
  private flashTimer?: ReturnType<typeof setTimeout>;
  private toastTimer?: ReturnType<typeof setTimeout>;
  private lastSaved = 0;

  constructor() {
    // A new start time for a video that's already loaded (e.g. "Watch this part" on another slide).
    afterRenderEffect(() => {
      const t = this.start();
      if (t != null && this.video.readyState >= 1) this.applyStart(t);
    });
    inject(DestroyRef).onDestroy(() => {
      this.save();
      clearTimeout(this.wakeTimer);
      clearTimeout(this.flashTimer);
      clearTimeout(this.toastTimer);
    });
  }

  // ---- actions -------------------------------------------------------------------------------

  toggle() {
    if (this.video.paused || this.video.ended) {
      this.resumedFrom.set(null);
      this.video.play()?.catch?.(() => this.playing.set(false));
    } else {
      this.video.pause();
    }
  }

  /** Jump to a timestamp and play from there. */
  jumpTo(t: number) {
    this.resumedFrom.set(null);
    this.seekTo(t);
    this.video.play()?.catch?.(() => this.playing.set(false));
  }

  skip(dir: 1 | -1) {
    this.seekTo(this.video.currentTime + dir * SKIP);
    const f = this.flash();
    const amount = f && f.dir === dir ? f.amount + SKIP : SKIP;
    this.flash.set({ dir, amount, key: (f?.key ?? 0) + 1 });
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.flash.set(null), 650);
    this.wake();
  }

  protected seekTo(t: number) {
    const next = clampTime(t, this.duration());
    this.video.currentTime = next;
    this.current.set(next);
    if (next < this.duration()) this.ended.set(false);
  }

  protected retry() {
    this.failed.set(false);
    this.video.load();
  }

  protected restart() {
    this.resumedFrom.set(null);
    this.seekTo(0);
    this.video.play()?.catch?.(() => undefined);
  }

  protected toggleMute() {
    if (this.muted() || this.volume() === 0) {
      this.video.muted = false;
      if (this.video.volume === 0) this.video.volume = 0.6;
    } else {
      this.video.muted = true;
    }
  }

  protected setVolume(v: number) {
    this.video.volume = v;
    this.video.muted = v === 0;
  }

  protected setRate(r: number) {
    this.video.playbackRate = r;
  }

  protected cycleRate() {
    this.setRate(cycleRate(this.rate()));
  }

  toggleFullscreen() {
    const frame = this.frame().nativeElement;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else if (frame.requestFullscreen) {
      frame.requestFullscreen().catch(() => undefined);
    } else {
      (this.video as IosVideo).webkitEnterFullscreen?.();
    }
  }

  protected onFullscreenChange() {
    this.fullscreen.set(document.fullscreenElement === this.frame().nativeElement);
  }

  /** Keep the controls up for a moment after the pointer or keyboard does anything. */
  protected wake() {
    this.active.set(true);
    clearTimeout(this.wakeTimer);
    this.wakeTimer = setTimeout(() => this.active.set(false), 2600);
  }

  /** Called by the page for keys pressed anywhere. Returns true if the player used the key. */
  handleKey(e: KeyboardEvent): boolean {
    const onButton = (e.target as HTMLElement).closest?.('button, a');
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if ((k === ' ' || k === 'Enter') && onButton) return false;
    const actions: Record<string, () => void> = {
      ' ': () => this.toggle(),
      k: () => this.toggle(),
      ArrowLeft: () => this.skip(-1),
      j: () => this.skip(-1),
      ArrowRight: () => this.skip(1),
      l: () => this.skip(1),
      m: () => this.toggleMute(),
      f: () => this.toggleFullscreen(),
      Home: () => this.seekTo(0),
      End: () => this.seekTo(this.duration()),
      '>': () => this.setRate(stepRate(this.rate(), 1)),
      '<': () => this.setRate(stepRate(this.rate(), -1)),
    };
    const run =
      actions[k] ?? (/^[0-9]$/.test(k) ? () => this.seekTo((+k / 10) * this.duration()) : null);
    if (!run) return false;
    run();
    this.wake();
    return true;
  }

  // ---- picture gestures ----------------------------------------------------------------------

  /** Double-click: left third skips back, right third skips on, the middle goes full screen. */
  protected onDouble(e: MouseEvent) {
    const box = this.frame().nativeElement.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    if (x < 1 / 3) this.skip(-1);
    else if (x > 2 / 3) this.skip(1);
    else this.toggleFullscreen();
  }

  // ---- media events --------------------------------------------------------------------------

  /** Jump to `start`: on load, or straight away if the video is already loaded. */
  private applyStart(t: number) {
    this.resumedFrom.set(null);
    this.seekTo(t);
    this.startApplied.emit();
  }

  protected onMeta() {
    const d = this.video.duration;
    this.duration.set(Number.isFinite(d) ? d : 0);
    const start = this.start();
    if (start != null) {
      this.applyStart(start);
      return;
    }
    const at = resumeAt(this.readSaved(), this.duration());
    if (at != null) {
      this.video.currentTime = at;
      this.current.set(at);
      this.resumedFrom.set(at);
      this.toastTimer = setTimeout(() => this.resumedFrom.set(null), 7000);
    }
  }

  protected onPlay() {
    this.playing.set(true);
    this.started.set(true);
    this.ended.set(false);
    this.wake();
  }

  protected onPause() {
    this.playing.set(false);
    this.active.set(true);
    this.save();
  }

  protected onTime() {
    const t = this.video.currentTime;
    this.current.set(t);
    this.buffered.set(bufferedAhead(this.video.buffered, t, this.duration()));
    if (Math.abs(t - this.lastSaved) > 4) this.save();
  }

  protected onProgress() {
    this.buffered.set(bufferedAhead(this.video.buffered, this.video.currentTime, this.duration()));
  }

  protected onEnded() {
    this.playing.set(false);
    this.ended.set(true);
    this.active.set(true);
    this.forget();
  }

  protected onVolume() {
    this.volume.set(this.video.volume);
    this.muted.set(this.video.muted || this.video.volume === 0);
  }

  // ---- remembered position -------------------------------------------------------------------

  private save() {
    const t = this.video?.currentTime ?? 0;
    this.lastSaved = t;
    if (this.ended() || t < 1) return;
    try {
      localStorage.setItem(POSITION_KEY + this.src(), String(Math.floor(t)));
    } catch {
      // Storage can be blocked; resuming is a nicety.
    }
  }

  private forget() {
    try {
      localStorage.removeItem(POSITION_KEY + this.src());
    } catch {
      // ignore
    }
  }

  private readSaved(): number | null {
    try {
      const v = localStorage.getItem(POSITION_KEY + this.src());
      return v == null ? null : Number(v);
    } catch {
      return null;
    }
  }
}
