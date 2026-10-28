import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';
import { ToasterComponent } from './shared/ui/toaster/toaster.component';

@Component({
  selector: 'ah-rxjs-practice-pad',
  standalone: true,
  imports: [RouterOutlet, NavigationComponent, ToasterComponent],
  templateUrl: './rxjs-practice-pad.component.html',
  styleUrl: './rxjs-practice-pad.component.scss',
})
export class RxjsPracticePadComponent {
  title = 'rxjs-practice-pad';
  isSidebarOpen = signal(true);
  isFullscreen = signal(false);

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);

  constructor() {
    const onFullscreenChange = () => {
      const container =
        this.hostRef.nativeElement.querySelector<HTMLElement>(
          '.app-container',
        ) ?? this.hostRef.nativeElement;
      const active =
        this.document.fullscreenElement === container ||
        !!(
          this.document.fullscreenElement &&
          this.document.fullscreenElement.contains(container)
        );
      this.isFullscreen.set(active);
      if (!active) {
        container.classList.remove('is-fullscreen');
      } else {
        container.classList.add('is-fullscreen');
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

  toggleSidebar() {
    this.isSidebarOpen.update((open) => !open);
  }

  async toggleFullscreen(): Promise<void> {
    if (this.isFullscreen()) {
      await this.exitFullscreen();
    } else {
      await this.enterFullscreen();
    }
  }

  async enterFullscreen(): Promise<void> {
    const container =
      this.hostRef.nativeElement.querySelector<HTMLElement>('.app-container') ??
      this.hostRef.nativeElement;
    try {
      if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else {
        container.classList.add('is-fullscreen');
        this.isFullscreen.set(true);
      }
    } catch {
      container.classList.add('is-fullscreen');
      this.isFullscreen.set(true);
    }
  }

  async exitFullscreen(): Promise<void> {
    const container =
      this.hostRef.nativeElement.querySelector<HTMLElement>('.app-container') ??
      this.hostRef.nativeElement;
    try {
      if (this.document.fullscreenElement) {
        await this.document.exitFullscreen();
      }
    } catch {
      // Ignore exit failures
    }
    container.classList.remove('is-fullscreen');
    this.isFullscreen.set(false);
  }
}
