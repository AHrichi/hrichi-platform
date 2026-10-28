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
  templateUrl: './lab-frame.html',
  styleUrl: './lab-frame.scss',
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
