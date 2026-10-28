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

    this.document.addEventListener('fullscreenchange', onFullscreenChange);

    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('fullscreenchange', onFullscreenChange);
    });
  }

  toggleSidebar() {
    this.isSidebarOpen.update((open) => !open);
  }
}
