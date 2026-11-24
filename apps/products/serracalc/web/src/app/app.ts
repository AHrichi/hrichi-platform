import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PreferencesStore } from '@ah/shared/state';

@Component({
  selector: 'ah-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  constructor() {
    const preferences = inject(PreferencesStore);
    afterNextRender(() => {
      preferences.restore();
    });
  }
}
