import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  effect,
  untracked,
  viewChild,
} from '@angular/core';
import type {
  HoverTarget,
  SceneController,
  SceneModule,
} from '@ah/three/engine';
import { detectQuality, type QualityTier } from '@ah/three/engine/quality';

export type SceneState = 'fallback' | 'loading' | 'ready';

/**
 * Hosts a lazily loaded Three.js scene over static fallback content
 * (ADR-0011). The projected content is what prerendering, reduced motion,
 * low-end devices and failures show; the canvas fades in over it only after
 * the page is idle and the first frame is drawn.
 *
 * ```html
 * <ah-scene [load]="loadScene" [params]="params()" label="…">
 *   <svg>…static version…</svg>
 * </ah-scene>
 * ```
 */
@Component({
  selector: 'ah-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-scene',
    '[attr.data-state]': 'state()',
    '[attr.data-tier]': 'tier()',
  },
  templateUrl: './scene-host.html',
  styleUrl: './scene-host.scss',
})
export class SceneHost<P> {
  /** Imports the scene module; called only on devices that get 3D. */
  readonly load = input.required<() => Promise<SceneModule<P>>>();
  readonly params = input.required<P>();
  /** The scene asked to open a link. */
  readonly navigate = output<string>();
  /** The visitor clicked an object in the scene (its id), or empty space. */
  readonly picked = output<string | null>();
  /**
   * The scene is the page's content rather than decoration: show it whenever
   * WebGL2 works, even with reduced motion or on a phone (the scene adapts).
   */
  readonly essential = input(false, { transform: booleanAttribute });
  /** Allows expanding the 3D scene to full viewport / screen. */
  readonly allowFullscreen = input(true, { transform: booleanAttribute });

  protected readonly isFullscreen = signal(false);
  protected readonly state = signal<SceneState>('fallback');
  protected readonly tier = signal<QualityTier | null>(null);
  protected readonly hover = signal<HoverTarget | null>(null);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly injector = inject(Injector);
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;
  private controller: SceneController<P> | null = null;
  private destroyed = false;

  constructor() {
    afterNextRender(() => void this.start());
    effect(() => {
      const params = this.params();
      untracked(() => this.controller?.update(params));
    });

    const onFullscreenChange = () => {
      const el = this.hostRef.nativeElement;
      const active = this.document.fullscreenElement === el;
      this.isFullscreen.set(active);
      if (!active) {
        el.classList.remove('is-fullscreen');
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isFullscreen()) {
        void this.exitFullscreen();
      }
    };

    this.document.addEventListener('fullscreenchange', onFullscreenChange);
    this.document.addEventListener('keydown', onKeyDown);

    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.document.removeEventListener('fullscreenchange', onFullscreenChange);
      this.document.removeEventListener('keydown', onKeyDown);
      this.controller?.dispose();
      this.controller = null;
    });
  }

  async toggleFullscreen(): Promise<void> {
    if (this.isFullscreen()) {
      await this.exitFullscreen();
    } else {
      await this.enterFullscreen();
    }
  }

  async enterFullscreen(): Promise<void> {
    const el = this.hostRef.nativeElement;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else {
        el.classList.add('is-fullscreen');
        this.isFullscreen.set(true);
      }
    } catch {
      el.classList.add('is-fullscreen');
      this.isFullscreen.set(true);
    }
  }

  async exitFullscreen(): Promise<void> {
    try {
      if (this.document.fullscreenElement) {
        await this.document.exitFullscreen();
      }
    } catch {
      // Ignore exit failures (e.g. document already not in fullscreen)
    }
    this.hostRef.nativeElement.classList.remove('is-fullscreen');
    this.isFullscreen.set(false);
  }

  private async start(): Promise<void> {
    const window = this.window;
    if (!window) {
      return;
    }
    const tier = detectQuality(window, { essential: this.essential() });
    this.tier.set(tier);
    if (tier === 'off') {
      return;
    }
    await idle(window);
    if (this.destroyed) {
      return;
    }
    try {
      const module = await this.load()();
      this.state.set('loading');
      await new Promise<void>((resolve) =>
        afterNextRender(() => resolve(), { injector: this.injector }),
      );
      const canvas = this.canvas()?.nativeElement;
      if (this.destroyed || !canvas) {
        return;
      }
      const controller = await module.createScene({
        canvas,
        tier,
        params: untracked(this.params),
        events: {
          navigate: (href) => this.navigate.emit(href),
          select: (id) => this.picked.emit(id),
          hover: (target) => this.hover.set(target),
        },
      });
      if (this.destroyed) {
        controller.dispose();
        return;
      }
      this.controller = controller;
      this.state.set('ready');
    } catch (error) {
      // Any failure (a blocked chunk, a lost context) leaves the fallback in place.
      console.warn('[ah-scene] 3D unavailable, keeping the static view', error);
      this.controller?.dispose();
      this.controller = null;
      this.hover.set(null);
      this.state.set('fallback');
    }
  }
}

/** Waits until the browser is idle, so 3D never competes with the page itself. */
function idle(window: Window): Promise<void> {
  return new Promise((resolve) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => resolve(), { timeout: 3000 });
    } else {
      setTimeout(resolve, 200);
    }
  });
}
