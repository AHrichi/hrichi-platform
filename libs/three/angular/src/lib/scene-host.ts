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
  template: `
    <!-- Stays in the accessibility tree when hidden: it describes the same picture. -->
    <div class="ah-scene__fallback">
      <ng-content />
    </div>
    @if (state() !== 'fallback') {
      <canvas #canvas class="ah-scene__canvas" aria-hidden="true"></canvas>
    }
    @if (hover(); as target) {
      <div
        class="ah-scene__label"
        aria-hidden="true"
        [style.translate]="target.x + 'px ' + target.y + 'px'"
      >
        <strong>{{ target.label }}</strong>
        @if (target.detail) {
          <span>{{ target.detail }}</span>
        }
      </div>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      overflow: hidden;
    }
    .ah-scene__fallback,
    .ah-scene__canvas {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      transition: opacity var(--motion-duration-slow)
        var(--motion-easing-standard);
    }
    .ah-scene__canvas {
      display: block;
      opacity: 0;
      touch-action: pan-y;
    }
    :host([data-state='ready']) .ah-scene__canvas {
      opacity: 1;
    }
    :host([data-state='ready']) .ah-scene__fallback {
      opacity: 0;
      pointer-events: none;
    }
    .ah-scene__label {
      position: absolute;
      inset-block-start: 0;
      inset-inline-start: 0;
      display: grid;
      gap: 0.125rem;
      padding-block: var(--space-1);
      padding-inline: var(--space-2);
      border: 1px solid var(--color-stage-border);
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--color-stage-bg) 88%, transparent);
      color: var(--color-stage-text);
      font-size: var(--font-size-100);
      white-space: nowrap;
      pointer-events: none;
      /* Anchored above the point it labels. */
      transform: translate(-50%, -100%);
    }
    .ah-scene__label span {
      color: var(--color-stage-muted);
    }
    @media (prefers-reduced-motion: reduce) {
      .ah-scene__fallback,
      .ah-scene__canvas {
        transition: none;
      }
    }
  `,
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

  protected readonly state = signal<SceneState>('fallback');
  protected readonly tier = signal<QualityTier | null>(null);
  protected readonly hover = signal<HoverTarget | null>(null);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly injector = inject(Injector);
  private readonly window = inject(DOCUMENT).defaultView;
  private controller: SceneController<P> | null = null;
  private destroyed = false;

  constructor() {
    afterNextRender(() => void this.start());
    effect(() => {
      const params = this.params();
      untracked(() => this.controller?.update(params));
    });
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.controller?.dispose();
      this.controller = null;
    });
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
