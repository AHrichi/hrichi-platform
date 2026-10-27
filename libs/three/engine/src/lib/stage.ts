import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import type { QualityTier } from '../quality';
import { disposeObject } from './dispose';
import { FrameLoop } from './frame-loop';

export interface StageOptions {
  canvas: HTMLCanvasElement;
  tier: Exclude<QualityTier, 'off'>;
  /** Vertical field of view in degrees. */
  fov?: number;
}

export interface Frame {
  /** Seconds since the page loaded. */
  time: number;
  /** Seconds since the previous animated frame; 0 after a pause. */
  delta: number;
}

export interface Stage {
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  readonly tier: Exclude<QualityTier, 'off'>;
  /** CSS pixel size of the canvas. */
  readonly width: number;
  readonly height: number;
  /** Runs before every draw; returns an unsubscribe function. */
  onFrame(callback: (frame: Frame) => void): () => void;
  /** Runs once if frames stay slow and the stage lowers its pixel ratio. */
  onDegrade(callback: () => void): void;
  /** Replaces the default `renderer.render(scene, camera)`, e.g. for post-processing. */
  setRender(render: () => void): void;
  /** Disposed with the stage (render targets, composers, controls). */
  track(disposable: { dispose(): void }): void;
  requestRender(): void;
  setAnimating(animating: boolean): void;
  /** Draws one frame synchronously, e.g. before revealing the canvas. */
  renderNow(): void;
  dispose(): void;
}

const pixelRatioCap = { low: 1.25, high: 2 } as const;
/** Median frame time above which the stage halves its work (about 30 fps). */
const slowFrameS = 1 / 30;

/**
 * A renderer, scene and camera bound to a canvas, with the lifecycle every
 * scene needs (ADR-0011): resize on layout changes, draw only when needed,
 * pause off-screen and in hidden tabs, degrade on slow devices, and release
 * every GPU resource on dispose.
 */
export function createStage({ canvas, tier, fov = 40 }: StageOptions): Stage {
  const window = canvas.ownerDocument.defaultView as Window;
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: tier === 'high',
    powerPreference: tier === 'high' ? 'high-performance' : 'default',
  });
  let pixelRatio = Math.min(window.devicePixelRatio || 1, pixelRatioCap[tier]);
  renderer.setPixelRatio(pixelRatio);

  const scene = new Scene();
  const camera = new PerspectiveCamera(fov, 1, 0.05, 100);
  const frameCallbacks = new Set<(frame: Frame) => void>();
  const degradeCallbacks: (() => void)[] = [];
  const tracked: { dispose(): void }[] = [];
  let render = () => renderer.render(scene, camera);
  let width = 0;
  let height = 0;

  // Adaptive quality: watch the first animated frames once, then stop.
  const samples: number[] = [];
  let degraded = false;

  const draw = (time: number, delta: number) => {
    for (const callback of frameCallbacks) {
      callback({ time, delta });
    }
    render();
    if (!degraded && delta > 0 && samples.length < 90) {
      samples.push(delta);
      if (samples.length === 90) {
        const median = [...samples].sort((a, b) => a - b)[45];
        if (median > slowFrameS) {
          degraded = true;
          pixelRatio = 1;
          renderer.setPixelRatio(pixelRatio);
          renderer.setSize(width, height, false);
          degradeCallbacks.forEach((callback) => callback());
        }
      }
    }
  };

  const loop = new FrameLoop(draw, {
    request: (callback) => window.requestAnimationFrame(callback),
    cancel: (handle) => window.cancelAnimationFrame(handle),
  });

  const resize = (w: number, h: number) => {
    if (w === 0 || h === 0 || (w === width && h === height)) {
      return;
    }
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    loop.requestRender();
  };
  resize(canvas.clientWidth, canvas.clientHeight);

  const resizeObserver = new ResizeObserver(([entry]) =>
    resize(entry.contentRect.width, entry.contentRect.height),
  );
  resizeObserver.observe(canvas);
  const intersectionObserver = new IntersectionObserver(([entry]) =>
    loop.setOnScreen(entry.isIntersecting),
  );
  intersectionObserver.observe(canvas);
  const onVisibility = () =>
    loop.setPageVisible(canvas.ownerDocument.visibilityState === 'visible');
  canvas.ownerDocument.addEventListener('visibilitychange', onVisibility);

  return {
    renderer,
    scene,
    camera,
    tier,
    get width() {
      return width;
    },
    get height() {
      return height;
    },
    onFrame(callback) {
      frameCallbacks.add(callback);
      return () => frameCallbacks.delete(callback);
    },
    onDegrade(callback) {
      degradeCallbacks.push(callback);
    },
    setRender(custom) {
      render = custom;
    },
    track(disposable) {
      tracked.push(disposable);
    },
    requestRender: () => loop.requestRender(),
    setAnimating: (animating) => loop.setAnimating(animating),
    renderNow() {
      draw(window.performance.now() / 1000, 0);
    },
    dispose() {
      loop.dispose();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.ownerDocument.removeEventListener(
        'visibilitychange',
        onVisibility,
      );
      frameCallbacks.clear();
      tracked.forEach((disposable) => disposable.dispose());
      disposeObject(scene);
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
