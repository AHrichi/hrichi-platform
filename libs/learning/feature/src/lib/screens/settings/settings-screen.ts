import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  type GardenTheme,
  learnedMorning,
  STREAK_MODES,
  type StreakMode,
} from '@ah/learning/domain';
import { StreakFlame } from '@ah/learning/ui';
import { PushControls } from '@ah/platform/web-push';
import { AhButton } from '@ah/ui';
import { LearningNotifications } from '../../store/learning-notifications';
import {
  type LearnerSettings,
  LearningStore,
} from '../../store/learning.store';

/**
 * How much to review, and when to be reminded (design §3, §10). Settings
 * sync across paired devices; reminders go out through the Telegram bot,
 * and as push notifications to each device that turned them on.
 */
@Component({
  selector: 'lrn-settings-screen',
  imports: [AhButton, RouterLink, StreakFlame, PushControls],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-screen.html',
  styleUrl: './settings-screen.scss',
})
export class SettingsScreen {
  protected readonly store = inject(LearningStore);
  protected readonly notifications = inject(LearningNotifications);
  protected readonly pushBlocker = computed(() => {
    switch (this.notifications.blocker()) {
      case 'demo':
        return 'This copy is a demo and never sends notifications. Open the Learning app itself to turn them on.';
      case 'no-edge':
        return 'Notifications aren’t set up for this server.';
      case 'unpaired':
        return 'Pair this device first (Devices and pairing, below), then turn notifications on.';
      default:
        return null;
    }
  });

  constructor() {
    void this.notifications.refresh();
  }
  protected readonly caps: LearnerSettings['dailyCap'][] = [5, 7, 10];
  protected readonly streakModes = STREAK_MODES;
  protected readonly learned = computed(() =>
    learnedMorning(this.store.sessions(), this.store.timeZone()),
  );

  protected readonly nextTheme = computed(() =>
    this.store.themes().find((unlock) => !unlock.unlocked),
  );

  protected setTheme(gardenTheme: GardenTheme): void {
    void this.store.saveSettings({ gardenTheme });
  }

  protected setStreakMode(streakMode: StreakMode): void {
    void this.store.saveSettings({ streakMode });
  }

  protected setWeeklyTarget(value: string): void {
    const weeklyTarget = Math.max(1, Math.min(7, Number(value) || 5));
    void this.store.saveSettings({ weeklyTarget });
  }

  protected setCap(dailyCap: LearnerSettings['dailyCap']): void {
    void this.store.saveSettings({ dailyCap });
  }

  protected setNew(value: string): void {
    const newPerDay = Math.max(0, Math.min(3, Number(value) || 0));
    void this.store.saveSettings({ newPerDay });
  }

  protected setMorning(mode: string, time: string): void {
    void this.store.saveSettings({
      morning: mode === 'fixed' && time ? time : null,
    });
  }

  protected setEvening(value: string): void {
    void this.store.saveSettings({ evening: value || null });
  }

  protected setRecap(weeklyRecap: boolean): void {
    void this.store.saveSettings({ weeklyRecap });
  }

  protected setVacation(value: string): void {
    void this.store.saveSettings({ vacationUntil: value || null });
  }
}
