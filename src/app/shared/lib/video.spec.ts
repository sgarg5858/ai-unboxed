import {
  bufferedAhead,
  clampTime,
  clock,
  cycleRate,
  resumeAt,
  spokenClock,
  stepRate,
} from './video';

describe('video helpers', () => {
  it('formats a clock', () => {
    expect(clock(0)).toBe('0:00');
    expect(clock(75.9)).toBe('1:15');
    expect(clock(3725)).toBe('1:02:05');
    expect(clock(NaN)).toBe('0:00');
    expect(clock(-3)).toBe('0:00');
  });

  it('formats a spoken clock', () => {
    expect(spokenClock(75)).toBe('1 minute 15 seconds');
    expect(spokenClock(1)).toBe('1 second');
  });

  it('steps and cycles the speed', () => {
    expect(stepRate(1, 1)).toBe(1.25);
    expect(stepRate(2, 1)).toBe(2);
    expect(stepRate(0.75, -1)).toBe(0.75);
    expect(cycleRate(1)).toBe(1.25);
    expect(cycleRate(2)).toBe(0.75);
  });

  it('clamps seeks to the video', () => {
    expect(clampTime(-4, 100)).toBe(0);
    expect(clampTime(104, 100)).toBe(100);
    expect(clampTime(50, NaN)).toBe(50);
  });

  it('resumes only from the middle of a video', () => {
    expect(resumeAt(null, 100)).toBeNull();
    expect(resumeAt(3, 100)).toBeNull();
    expect(resumeAt(95, 100)).toBeNull();
    expect(resumeAt(40, 100)).toBe(40);
  });

  it('measures the buffer around the playhead', () => {
    const ranges = { length: 2, start: (i: number) => [0, 50][i], end: (i: number) => [20, 80][i] };
    expect(bufferedAhead(ranges as unknown as TimeRanges, 10, 100)).toBe(0.2);
    expect(bufferedAhead(ranges as unknown as TimeRanges, 60, 100)).toBe(0.8);
    expect(bufferedAhead(ranges as unknown as TimeRanges, 30, 100)).toBe(0);
  });
});
