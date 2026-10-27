import { FrameLoop, FrameScheduler } from './frame-loop';

/** A manual requestAnimationFrame: `flush(ms)` runs the pending frame. */
function fakeScheduler() {
  let pending: ((timeMs: number) => void) | null = null;
  let next = 1;
  const scheduler: FrameScheduler = {
    request(callback) {
      pending = callback;
      return next++;
    },
    cancel() {
      pending = null;
    },
  };
  return {
    scheduler,
    get pending() {
      return pending !== null;
    },
    flush(timeMs: number) {
      const callback = pending;
      pending = null;
      callback?.(timeMs);
    },
  };
}

describe('FrameLoop', () => {
  it('draws once per render request and then goes idle', () => {
    const frames = fakeScheduler();
    const draw = vi.fn();
    const loop = new FrameLoop(draw, frames.scheduler);

    loop.requestRender();
    loop.requestRender();
    frames.flush(16);

    expect(draw).toHaveBeenCalledTimes(1);
    expect(frames.pending).toBe(false);
  });

  it('keeps drawing while animating, with clamped deltas', () => {
    const frames = fakeScheduler();
    const draw = vi.fn();
    const loop = new FrameLoop(draw, frames.scheduler);

    loop.setAnimating(true);
    frames.flush(1000);
    frames.flush(1016);
    frames.flush(3000);

    expect(draw.mock.calls.map(([, delta]) => delta)).toEqual([
      0,
      expect.closeTo(0.016, 5),
      0.1,
    ]);
    expect(frames.pending).toBe(true);
  });

  it('pauses off-screen and in hidden tabs, and resumes without a jump', () => {
    const frames = fakeScheduler();
    const draw = vi.fn();
    const loop = new FrameLoop(draw, frames.scheduler);
    loop.setAnimating(true);
    frames.flush(1000);

    loop.setOnScreen(false);
    expect(frames.pending).toBe(false);
    loop.setOnScreen(true);
    loop.setPageVisible(false);
    expect(frames.pending).toBe(false);

    loop.setPageVisible(true);
    frames.flush(9000);
    expect(draw).toHaveBeenLastCalledWith(9, 0);
  });

  it('defers a render requested while hidden until it is visible again', () => {
    const frames = fakeScheduler();
    const draw = vi.fn();
    const loop = new FrameLoop(draw, frames.scheduler);

    loop.setOnScreen(false);
    loop.requestRender();
    expect(frames.pending).toBe(false);

    loop.setOnScreen(true);
    frames.flush(16);
    expect(draw).toHaveBeenCalledTimes(1);
  });

  it('never draws after dispose', () => {
    const frames = fakeScheduler();
    const draw = vi.fn();
    const loop = new FrameLoop(draw, frames.scheduler);
    loop.setAnimating(true);

    loop.dispose();
    loop.requestRender();

    expect(frames.pending).toBe(false);
    expect(draw).not.toHaveBeenCalled();
  });
});
