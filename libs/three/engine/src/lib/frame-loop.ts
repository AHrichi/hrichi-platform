export interface FrameScheduler {
  request(callback: (timeMs: number) => void): number;
  cancel(handle: number): void;
}

/**
 * Decides when to draw. A frame is scheduled only while the canvas is on
 * screen, the tab is visible, and something changed: either a render was
 * requested or the scene is animating. Idle scenes cost nothing.
 */
export class FrameLoop {
  private animating = false;
  private dirty = false;
  private onScreen = true;
  private pageVisible = true;
  private disposed = false;
  private handle: number | null = null;
  private lastMs: number | null = null;

  constructor(
    private readonly draw: (timeS: number, deltaS: number) => void,
    private readonly scheduler: FrameScheduler,
  ) {}

  get scheduled(): boolean {
    return this.handle !== null;
  }

  requestRender(): void {
    this.dirty = true;
    this.schedule();
  }

  setAnimating(animating: boolean): void {
    this.animating = animating;
    this.schedule();
  }

  setOnScreen(onScreen: boolean): void {
    this.onScreen = onScreen;
    this.update();
  }

  setPageVisible(visible: boolean): void {
    this.pageVisible = visible;
    this.update();
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
  }

  private update(): void {
    if (this.onScreen && this.pageVisible) {
      this.schedule();
    } else {
      this.stop();
    }
  }

  private stop(): void {
    if (this.handle !== null) {
      this.scheduler.cancel(this.handle);
      this.handle = null;
    }
    // The next frame after a pause must not see the paused time as delta.
    this.lastMs = null;
  }

  private schedule(): void {
    if (
      this.disposed ||
      this.handle !== null ||
      !this.onScreen ||
      !this.pageVisible ||
      !(this.animating || this.dirty)
    ) {
      return;
    }
    this.handle = this.scheduler.request((timeMs) => this.tick(timeMs));
  }

  private tick(timeMs: number): void {
    this.handle = null;
    // Clamped so a long frame (a GC pause, a slow device) doesn't teleport animations.
    const deltaS =
      this.lastMs === null ? 0 : Math.min((timeMs - this.lastMs) / 1000, 0.1);
    this.lastMs = this.animating ? timeMs : null;
    this.dirty = false;
    this.draw(timeMs / 1000, deltaS);
    this.schedule();
  }
}
