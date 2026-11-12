import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { APP_MODE } from '@ah/platform/app-mode';
import { LearningStore } from '../store/learning.store';

/** The app's frame: the bar with the sync status, and the screen below. */
@Component({
  selector: 'lrn-learning-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-shell.html',
  styleUrl: './learning-shell.scss',
})
export class LearningShell {
  protected readonly store = inject(LearningStore);
  /** Standalone, the app's content is the page's main landmark. */
  protected readonly standalone = inject(APP_MODE) === 'standalone';

  /** One short status for the pill, and whether tapping it syncs. */
  protected readonly status = computed(() => {
    const pending = this.store.pending();
    const unsent = pending ? ` · ${pending} to send` : '';
    switch (this.store.sync().state) {
      case 'starting':
        return { label: 'Opening…', tone: 'muted', canSync: false };
      case 'unavailable':
        return this.store.unavailable() === 'demo'
          ? { label: 'Demo · on this device', tone: 'muted', canSync: false }
          : { label: 'On this device only', tone: 'muted', canSync: false };
      case 'unpaired':
        return {
          label: `Not paired${unsent}`,
          tone: 'warning',
          canSync: false,
        };
      case 'syncing':
        return { label: 'Syncing…', tone: 'muted', canSync: false };
      case 'synced':
        return { label: `Synced${unsent}`, tone: 'success', canSync: true };
      case 'offline':
        return { label: `Offline${unsent}`, tone: 'warning', canSync: true };
      case 'failed':
        return { label: `Sync failed${unsent}`, tone: 'danger', canSync: true };
    }
  });

  constructor() {
    void this.store.load();
  }
}
