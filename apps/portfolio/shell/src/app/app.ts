import { afterNextRender, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { profile, site } from '@ah/shared/content';
import { PreferencesStore } from '@ah/shared/state';
import { AhButton } from '@ah/ui';

@Component({
  imports: [AhButton, RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'ah-root',
  templateUrl: './app.html',
})
export class App {
  protected readonly profile = profile;
  protected readonly repository = site.repository;
  protected readonly year = new Date().getFullYear();
  protected readonly nav = [
    { label: 'Work', path: '/work' },
    { label: 'Experience', path: '/experience' },
    { label: 'Services', path: '/services' },
    { label: 'Contact', path: '/contact' },
  ];

  constructor() {
    // Prerendered HTML uses the default audience; switch only once hydrated.
    const preferences = inject(PreferencesStore);
    afterNextRender(() => preferences.restore());
  }
}
