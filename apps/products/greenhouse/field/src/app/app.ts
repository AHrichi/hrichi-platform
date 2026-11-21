import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { languageStorageKey, PreferencesStore } from '@ah/shared/state';

@Component({
  selector: 'gh-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  constructor() {
    const preferences = inject(PreferencesStore);
    const storage = inject(DOCUMENT).defaultView?.localStorage;
    afterNextRender(() => {
      let chosen: string | null = null;
      try {
        chosen = storage?.getItem(languageStorageKey) ?? null;
      } catch {
        // Blocked storage: fall through to Arabic.
      }
      preferences.restore();
      // Supervisors mostly read Arabic: it's the default, whatever the
      // phone's language, until someone picks another.
      if (!chosen) preferences.setLanguage('ar');
    });
  }
}
