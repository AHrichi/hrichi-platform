import { type Clock, STEP_MS, StepTimeline } from './step-timeline';

/** Time that moves only when the test says so. */
class FakeClock implements Clock {
  time = 0;
  private timers: { at: number; run: () => void }[] = [];

  now(): number {
    return this.time;
  }

  schedule(run: () => void, ms: number): () => void {
    const timer = { at: this.time + ms, run };
    this.timers.push(timer);
    return () => (this.timers = this.timers.filter((t) => t !== timer));
  }

  /** Jumps ahead, as a throttled background tab would, then fires what's due. */
  advance(ms: number): void {
    this.time += ms;
    for (;;) {
      const due = this.timers.filter((t) => t.at <= this.time);
      if (!due.length) return;
      this.timers = this.timers.filter((t) => !due.includes(t));
      due.forEach((t) => t.run());
    }
  }
}

function setup(count = 5) {
  const clock = new FakeClock();
  const timeline = new StepTimeline(clock);
  timeline.reset(count);
  return { clock, timeline };
}

describe('StepTimeline', () => {
  it('steps forward and back between the scene and the last step', () => {
    const { timeline } = setup(3);
    expect(timeline.index()).toBe(-1);
    timeline.back();
    expect(timeline.index()).toBe(-1);
    timeline.forward();
    timeline.forward();
    timeline.forward();
    timeline.forward();
    expect(timeline.index()).toBe(2);
    timeline.first();
    expect(timeline.index()).toBe(-1);
  });

  it('plays one step per interval and stops at the end', () => {
    const { clock, timeline } = setup(3);
    timeline.play();
    clock.advance(STEP_MS);
    expect(timeline.index()).toBe(0);
    clock.advance(STEP_MS * 2);
    expect(timeline.index()).toBe(2);
    expect(timeline.playing()).toBe(false);
  });

  it('catches up after a long gap instead of drifting', () => {
    const { clock, timeline } = setup(10);
    timeline.play();
    clock.advance(STEP_MS * 4 + 10);
    expect(timeline.index()).toBe(3);
  });

  it('runs twice as fast at 2×, and pausing stops it', () => {
    const { clock, timeline } = setup(10);
    timeline.setSpeed(2);
    timeline.play();
    clock.advance(STEP_MS);
    expect(timeline.index()).toBe(1);
    timeline.pause();
    clock.advance(STEP_MS * 5);
    expect(timeline.index()).toBe(1);
  });

  it('holds at a step until its check is answered', () => {
    const { clock, timeline } = setup(6);
    timeline.holds.set(new Set([2]));
    timeline.play();
    clock.advance(STEP_MS * 10);
    expect(timeline.index()).toBe(2);
    expect(timeline.playing()).toBe(false);
    timeline.forward();
    timeline.seek(5);
    expect(timeline.index()).toBe(2);
    expect(timeline.held()).toBe(true);

    timeline.holds.set(new Set());
    timeline.forward();
    expect(timeline.index()).toBe(3);
  });

  it('starts over when played from the end', () => {
    const { clock, timeline } = setup(2);
    timeline.last();
    timeline.play();
    expect(timeline.index()).toBe(-1);
    clock.advance(STEP_MS);
    expect(timeline.index()).toBe(0);
  });
});
