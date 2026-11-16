import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { APP_MODE } from '@ah/platform/app-mode';
import { LearningNotifications } from '../store/learning-notifications';
import { LearningStore } from '../store/learning.store';

interface NavItem {
  path: string;
  label: string;
  /** A 24×24 stroke path. */
  icon: string;
  /** On wide screens the label is for screen readers only. */
  iconOnly?: boolean;
}

/**
 * The app's frame: the bar with the sync status, and the screen below. On a
 * phone, standalone, the screens move to a tab bar at the bottom, in reach
 * of the thumb.
 */
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
  private readonly notifications = inject(LearningNotifications);

  protected readonly items: readonly NavItem[] = [
    {
      path: 'today',
      label: 'Today',
      icon: 'M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    },
    {
      path: 'inbox',
      label: 'Inbox',
      icon: 'M3 13h5l1.5 3h5L16 13h5M5 5h14l2 8v6H3v-6l2-8Z',
    },
    {
      path: 'concepts',
      label: 'Library',
      icon: 'M4 5h4v14H4zM10 5h4v14h-4zM16.5 5.5l3.5 1-3.5 13-3.5-1z',
    },
    {
      path: 'garden',
      label: 'Garden',
      icon: 'M12 21v-8m0 0c0-4 3-7 7-7 0 4-3 7-7 7Zm0 0c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5Z',
    },
    {
      path: 'settings',
      label: 'Settings',
      iconOnly: true,
      icon: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm7.4 3a7.4 7.4 0 0 0-.1-1.3l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.2-1.3L14.4 3h-4l-.4 2.4a7.6 7.6 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.6l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2.2 1.3l.4 2.4h4l.4-2.4a7.6 7.6 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.3Z',
    },
  ];

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
    // Keeps this device's push subscription known to the edge Worker.
    if (this.standalone) void this.notifications.refresh();
  }
}
