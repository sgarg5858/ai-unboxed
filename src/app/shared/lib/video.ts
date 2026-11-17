/** Pure helpers for the video player, kept out of the component so they can be unit-tested. */

/** 75 → "1:15", 3725 → "1:02:05". Bad or missing values show as "0:00". */
export function clock(seconds: number): string {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Read out by screen readers: "1 minute 15 seconds". */
export function spokenClock(seconds: number): string {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const m = Math.floor(s / 60);
  const parts = [];
  if (m) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  parts.push(`${s % 60} second${s % 60 === 1 ? '' : 's'}`);
  return parts.join(' ');
}

export const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;

/** The next playback speed up (or down), stopping at the ends. */
export function stepRate(rate: number, dir: 1 | -1): number {
  const i = RATES.findIndex((r) => r >= rate - 1e-6);
  const at = i < 0 ? RATES.length - 1 : i;
  return RATES[Math.min(RATES.length - 1, Math.max(0, at + dir))];
}

/** The speed button cycles 1 → 1.25 → … → 2 → 0.75 → 1. */
export function cycleRate(rate: number): number {
  const i = RATES.findIndex((r) => Math.abs(r - rate) < 1e-6);
  return RATES[(i + 1) % RATES.length];
}

/** Keep a seek target inside the video. */
export const clampTime = (t: number, duration: number): number =>
  Math.min(Math.max(0, t), Number.isFinite(duration) && duration > 0 ? duration : t);

/**
 * Where to resume a saved position: only if it's past the first few seconds and not
 * at the very end (then start over instead).
 */
export function resumeAt(saved: number | null, duration: number): number | null {
  if (saved == null || !Number.isFinite(saved) || !(duration > 0)) return null;
  return saved > 5 && saved < duration - 8 ? saved : null;
}

/** The share of the video that has loaded ahead of the playhead, in [0, 1]. */
export function bufferedAhead(ranges: TimeRanges | null | undefined, t: number, duration: number) {
  if (!ranges || !(duration > 0)) return 0;
  for (let i = 0; i < ranges.length; i++) {
    if (ranges.start(i) <= t + 0.5 && t <= ranges.end(i)) return ranges.end(i) / duration;
  }
  return 0;
}
