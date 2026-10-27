import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { getState } from '@ngrx/signals';
import { FederationStore } from '@ah/platform/federation';
import { Inspector, type InspectableStores } from '@ah/platform/inspector';
import { profile, site } from '@ah/shared/content';
import { PreferencesStore } from '@ah/shared/state';
import { AhButton } from '@ah/ui';
import { reloadOnNavigationWhenUpdated } from './sw-updates';

@Component({
  imports: [AhButton, Inspector, RouterLink, RouterLinkActive, RouterOutlet],
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

  protected readonly inspecting = signal(false);
  private readonly hoodButton =
    viewChild<ElementRef<HTMLButtonElement>>('hoodButton');

  /** What the Federation Inspector's State tab shows. */
  protected readonly stores: InspectableStores;

  constructor() {
    const preferences = inject(PreferencesStore);
    const federation = inject(FederationStore);
    this.stores = {
      PreferencesStore: () => getState(preferences),
      FederationStore: () => getState(federation),
    };

    reloadOnNavigationWhenUpdated();

    // Prerendered HTML uses the default audience; switch only once hydrated.
    const window = inject(DOCUMENT).defaultView;
    afterNextRender(() => {
      preferences.restore();
      if (window && new URL(window.location.href).searchParams.has('inspect')) {
        this.inspecting.set(true);
      }
    });
  }

  protected closeInspector(): void {
    this.inspecting.set(false);
    this.hoodButton()?.nativeElement.focus();
  }
}
