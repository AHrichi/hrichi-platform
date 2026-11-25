import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';

/** `ready`: a newer build is downloaded. `broken`: the cached copy can't update. */
export type SerraUpdateState = 'none' | 'ready' | 'broken';

/** How often an open app looks for a new version. */
const CHECK_EVERY_MS = 30 * 60 * 1000;

/**
 * Standalone SerraCalc caches itself through a service worker, so a new
 * version downloads in the background and only shows on the next visit.
 * This notices it while the app is open (when the tab comes back into view
 * and every half hour) and offers a reload; the next move to another screen
 * loads it anyway. Inside the portfolio the site's own banner does this.
 */
@Injectable({ providedIn: 'root' })
export class SerraUpdates {
  private readonly worker = inject(SwUpdate, { optional: true });
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly router = inject(Router, { optional: true });

  readonly state = signal<SerraUpdateState>('none');
  private readonly dismissed = signal(false);
  readonly visible = computed(
    () => this.state() !== 'none' && !this.dismissed(),
  );
  private started = false;

  /** Starts watching; call once, in the browser, standalone only. */
  start(): void {
    const worker = this.worker?.isEnabled ? this.worker : null;
    const window = this.window;
    if (!worker || !window || this.started) return;
    this.started = true;

    worker.versionUpdates
      .pipe(filter((event) => event.type === 'VERSION_READY'))
      .subscribe(() => this.state.set('ready'));
    worker.unrecoverable.subscribe(() => this.state.set('broken'));

    const check = () => {
      if (this.state() === 'none')
        void worker.checkForUpdate().catch(() => false);
    };
    window.document.addEventListener('visibilitychange', () => {
      if (window.document.visibilityState === 'visible') check();
    });
    window.setInterval(check, CHECK_EVERY_MS);

    // Another screen after an update: load it fresh, in the new version.
    this.router?.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe((event) => {
        if (this.state() === 'ready') void this.reload(event.url);
      });
  }

  dismiss(): void {
    this.dismissed.set(true);
  }

  /** Loads the new version (or, if the cached copy is broken, a fresh one). */
  async reload(url?: string): Promise<void> {
    const window = this.window;
    if (!window) return;
    if (this.state() === 'broken') {
      await this.clearCache();
    } else {
      await this.worker?.activateUpdate().catch(() => false);
    }
    if (url) window.location.assign(url);
    else window.location.reload();
  }

  /**
   * Drops the worker and what it cached, so every file comes from the
   * network; projects live in IndexedDB and stay. The worker registers
   * again on load.
   */
  private async clearCache(): Promise<void> {
    const window = this.window;
    if (!window) return;
    try {
      const registrations =
        (await window.navigator.serviceWorker?.getRegistrations()) ?? [];
      await Promise.all(registrations.map((r) => r.unregister()));
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((key) => window.caches.delete(key)));
      }
    } catch {
      // A plain reload still helps.
    }
  }
}
