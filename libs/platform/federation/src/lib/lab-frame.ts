import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SectionHeading } from '@ah/ui';

/**
 * A lab's page around its remote: the intro, then the remote's routes. The
 * shell prerenders it, so the first paint and the LCP never wait for the
 * remote, and the body keeps a screen's height so the remote's arrival
 * doesn't push the footer around (ADR-0014). Remotes use it standalone too.
 */
@Component({
  selector: 'ah-lab-frame',
  imports: [RouterOutlet, SectionHeading],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="lab ah-container" aria-labelledby="lab-heading">
      <div class="lab__header">
        <ah-section-heading
          class="lab__intro"
          headingId="lab-heading"
          [level]="1"
          [eyebrow]="eyebrow()"
          [heading]="heading()"
          [lead]="lead()"
        />
        <div class="lab__actions">
          <button
            type="button"
            class="lab__fullscreen-btn ah-button ah-button--secondary"
            [attr.aria-label]="
              isFullscreen() ? 'Exit fullscreen' : 'View remote in fullscreen'
            "
            [attr.title]="
              isFullscreen()
                ? 'Exit fullscreen (Esc)'
                : 'Expand remote to fullscreen'
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
              <span>Exit Fullscreen</span>
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
              <span>Fullscreen Remote</span>
            }
          </button>
        </div>
      </div>
      <div #labBody class="lab__body" [class.is-fullscreen]="isFullscreen()">
        @if (isFullscreen()) {
          <button
            type="button"
            class="lab__fullscreen-exit"
            aria-label="Exit fullscreen"
            title="Exit fullscreen (Esc)"
            (click)="exitFullscreen()"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        }
        <router-outlet />
      </div>
    </section>
  `,
  styles: `
    .lab {
      display: grid;
      gap: var(--space-5);
      padding-block: var(--space-7) var(--space-8);
    }
    .lab__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: var(--space-4);
      flex-wrap: wrap;
    }
    .lab__intro {
      max-inline-size: var(--layout-prose);
    }
    .lab__actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }
    .lab__fullscreen-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      min-block-size: 2.25rem;
      padding-block: var(--space-1);
      padding-inline: var(--space-3);
      font-size: var(--font-size-200);
      cursor: pointer;
    }
    .lab__body {
      min-block-size: 100svh;
      position: relative;
    }
    .lab__body:fullscreen,
    .lab__body.is-fullscreen {
      position: fixed !important;
      inset: 0 !important;
      inline-size: 100vw !important;
      block-size: 100vh !important;
      block-size: 100dvh !important;
      max-inline-size: none !important;
      max-block-size: none !important;
      z-index: 99999 !important;
      background: var(--color-bg-canvas) !important;
      padding: 0 !important;
      margin: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      box-sizing: border-box !important;

      > *:not(.lab__fullscreen-exit) {
        inline-size: 100% !important;
        block-size: 100% !important;
        min-height: 100% !important;
        height: 100% !important;
        flex: 1 1 100% !important;
        display: flex !important;
        flex-direction: column !important;
      }
    }
    .lab__fullscreen-exit {
      position: fixed;
      top: var(--space-4);
      right: var(--space-4);
      z-index: 100000;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: var(--radius-pill);
      border: 1px solid var(--color-border-strong);
      background: var(--color-bg-raised);
      color: var(--color-text-default);
      box-shadow: var(--shadow-raised);
      cursor: pointer;
      transition:
        transform var(--motion-duration-fast) var(--motion-easing-standard),
        border-color var(--motion-duration-fast) var(--motion-easing-standard);

      &:hover {
        transform: scale(1.08);
        border-color: var(--color-accent-default);
      }
      &:focus-visible {
        outline: 2px solid var(--color-focus-ring);
        outline-offset: 2px;
      }
    }
  `,
})
export class LabFrame {
  // Bound from the route's data in the shell (withComponentInputBinding).
  readonly eyebrow = input.required<string>();
  readonly heading = input.required<string>();
  readonly lead = input.required<string>();

  readonly isFullscreen = signal(false);
  private readonly labBody = viewChild<ElementRef<HTMLElement>>('labBody');
  private readonly document = inject(DOCUMENT);

  constructor() {
    const onFullscreenChange = () => {
      const el = this.labBody()?.nativeElement;
      const active = !!el && this.document.fullscreenElement === el;
      this.isFullscreen.set(active);
      if (!active && el) {
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
      this.document.removeEventListener('fullscreenchange', onFullscreenChange);
      this.document.removeEventListener('keydown', onKeyDown);
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
    const el = this.labBody()?.nativeElement;
    if (!el) return;
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
    const el = this.labBody()?.nativeElement;
    try {
      if (this.document.fullscreenElement) {
        await this.document.exitFullscreen();
      }
    } catch {
      // Ignore exit failures
    }
    el?.classList.remove('is-fullscreen');
    this.isFullscreen.set(false);
  }
}
