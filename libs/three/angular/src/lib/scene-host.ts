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
    @if (state() === 'ready' && allowFullscreen()) {
      <button
        type="button"
        class="ah-scene__fullscreen-btn"
        [attr.aria-label]="
          isFullscreen() ? 'Exit fullscreen' : 'View 3D scene in fullscreen'
        "
        [attr.title]="
          isFullscreen()
            ? 'Exit fullscreen (Esc)'
            : 'Expand 3D scene to fullscreen'
        "
        (click)="toggleFullscreen()"
      >
        @if (isFullscreen()) {
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="4 14 10 14 10 20"></polyline>
            <polyline points="20 10 14 10 14 4"></polyline>
            <line x1="14" y1="10" x2="21" y2="3"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        } @else {
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        }
      </button>
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
    .ah-scene__fullscreen-btn {
      position: absolute;
      inset-block-start: var(--space-3);
      inset-inline-end: var(--space-3);
      z-index: 10;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 2.25rem;
      block-size: 2.25rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-stage-border);
      background: color-mix(in srgb, var(--color-stage-bg) 80%, transparent);
      backdrop-filter: blur(8px);
      color: var(--color-stage-text);
      cursor: pointer;
      padding: 0;
      transition:
        background var(--motion-duration-fast) var(--motion-easing-standard),
        border-color var(--motion-duration-fast) var(--motion-easing-standard),
        transform var(--motion-duration-fast) var(--motion-easing-standard);

      &:hover {
        background: var(--color-stage-bg);
        border-color: var(--color-accent-default);
        transform: scale(1.05);
      }

      &:focus-visible {
        outline: 2px solid var(--color-focus-ring);
        outline-offset: 2px;
      }
    }
    :host:fullscreen,
    :host.is-fullscreen {
      position: fixed !important;
      inset: 0 !important;
      inline-size: 100vw !important;
      block-size: 100vh !important;
      max-inline-size: none !important;
      max-block-size: none !important;
      z-index: 99999 !important;
      background: var(--color-stage-bg, #0f0f12) !important;
      border-radius: 0 !important;
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
