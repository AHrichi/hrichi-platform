import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PreferencesStore } from '@ah/shared/state';

@Component({
  selector: 'gh-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  constructor() {
    const preferences = inject(PreferencesStore);
    afterNextRender(() => preferences.restore());
  }
}
