import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgrxNavigationComponent } from './navigation/navigation.component';

@Component({
  selector: 'ah-ngrx-practice-pad',
  imports: [RouterOutlet, NgrxNavigationComponent],
  template: `
    <div class="ngrx-lab-shell" [class.is-fullscreen]="isFullscreen()">
      <ah-ngrx-navigation
        [isFullscreen]="isFullscreen()"
        (toggleFullscreen)="toggleFullscreen()"
      />

      <main class="lab-main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .ngrx-lab-shell {
      display: flex;
      flex-direction: column;
      width: 100%;
      min-height: 100%;
      box-sizing: border-box;
      position: relative;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .ngrx-lab-shell.is-fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99999;
      background: var(--color-surface-base, #0b0f19);
      padding: var(--space-6, 1.5rem);
      overflow-y: auto;
    }

    .lab-main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgrxPracticePadComponent {
  private readonly elementRef = inject(ElementRef);
  readonly isFullscreen = signal(false);

  toggleFullscreen(): void {
    const next = !this.isFullscreen();
    this.isFullscreen.set(next);

    const el = this.elementRef.nativeElement as HTMLElement;
    if (next) {
      if (el.requestFullscreen && !document.fullscreenElement) {
        el.requestFullscreen().catch(() => void 0);
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => void 0);
      }
    }
  }
}
