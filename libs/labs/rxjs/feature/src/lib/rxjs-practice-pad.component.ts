import { Component, signal } from '@angular/core';
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

  toggleSidebar() {
    this.isSidebarOpen.update((open) => !open);
  }
}
