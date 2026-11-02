import { computed, signal } from '@angular/core';

/** How long a step shows at 1× before autoplay moves on. */
export const STEP_MS = 2400;

export const SPEEDS = [0.5, 1, 2] as const;

/** Time and timers, swapped for a fake clock in tests. */
export interface Clock {
  now(): number;
  schedule(run: () => void, ms: number): () => void;
}

export const realClock: Clock = {
  now: () => performance.now(),
  schedule: (run, ms) => {
    const handle = setTimeout(run, ms);
    return () => clearTimeout(handle);
  },
};

/**
 * Where a stepped visual is, and the controls that move it. Step -1 is the
 * scene before the first step.
 *
 * Autoplay keeps time against a wall-clock anchor (as the Sky lab does),
 * not a chain of fixed delays, so a throttled background tab catches up
 * instead of drifting, and pausing is just forgetting the anchor.
 *
 * A step with `pauseFor` holds: playback stops there, and neither stepping
 * nor scrubbing goes past it until its check is answered.
 */
export class StepTimeline {
  readonly count = signal(0);
  readonly index = signal(-1);
  readonly playing = signal(false);
  readonly speed = signal<number>(1);
  /** Steps that hold until their check is answered. */
  readonly holds = signal<ReadonlySet<number>>(new Set());

  /** The furthest step reachable now: the first hold, or the last step. */
  readonly limit = computed(() => {
    const holds = [...this.holds()];
    const last = this.count() - 1;
    return holds.length ? Math.min(last, ...holds) : last;
  });
  readonly held = computed(
    () => this.holds().has(this.index()) && this.index() < this.count() - 1,
  );
  readonly canBack = computed(() => this.index() > -1);
  readonly canForward = computed(() => this.index() < this.limit());

  private anchor: { time: number; index: number } | null = null;
  private cancel: (() => void) | null = null;

  constructor(private readonly clock: Clock = realClock) {}

  reset(count: number, index = -1): void {
    this.pause();
    this.count.set(count);
    this.index.set(Math.max(-1, Math.min(index, count - 1)));
  }

  seek(index: number): void {
    this.index.set(Math.max(-1, Math.min(index, this.limit())));
    if (this.playing()) this.restart();
  }

  forward(): void {
    this.pause();
    this.seek(this.index() + 1);
  }

  back(): void {
    this.pause();
    this.seek(this.index() - 1);
  }

  first(): void {
    this.pause();
    this.seek(-1);
  }

  last(): void {
    this.pause();
    this.seek(this.limit());
  }

  toggle(): void {
    if (this.playing()) this.pause();
    else this.play();
  }

  play(): void {
    if (this.count() === 0) return;
    // At the end, play starts over.
    if (this.index() >= this.count() - 1) this.index.set(-1);
    if (!this.canForward()) return;
    this.playing.set(true);
    this.restart();
  }

  pause(): void {
    this.playing.set(false);
    this.anchor = null;
    this.cancel?.();
    this.cancel = null;
  }

  setSpeed(speed: number): void {
    this.speed.set(speed);
    if (this.playing()) this.restart();
  }

  /** Re-anchors to now, so a seek or a new speed counts from here. */
  private restart(): void {
    this.anchor = { time: this.clock.now(), index: this.index() };
    this.schedule();
  }

  private schedule(): void {
    this.cancel?.();
    const anchor = this.anchor;
    if (!anchor) return;
    const per = STEP_MS / this.speed();
    const elapsed = this.clock.now() - anchor.time;
    const next = (Math.floor(elapsed / per) + 1) * per - elapsed;
    this.cancel = this.clock.schedule(() => this.tick(), next);
  }

  private tick(): void {
    const anchor = this.anchor;
    if (!anchor) return;
    const per = STEP_MS / this.speed();
    const due =
      anchor.index + Math.floor((this.clock.now() - anchor.time) / per);
    const reached = Math.min(due, this.limit());
    if (reached > this.index()) this.index.set(reached);
    if (this.index() >= this.limit()) {
      this.pause();
      return;
    }
    this.schedule();
  }
}
