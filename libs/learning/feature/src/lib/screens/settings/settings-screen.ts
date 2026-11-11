import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { learnedMorning } from '@ah/learning/domain';
import { AhButton } from '@ah/ui';
import {
  type LearnerSettings,
  LearningStore,
} from '../../store/learning.store';

/**
 * How much to review, and when to be reminded (design §3, §10). Settings
 * belong to this device; reminders go out through the Telegram bot once
 * the edge Worker is set up.
 */
@Component({
  selector: 'lrn-settings-screen',
  imports: [AhButton, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-screen.html',
  styleUrl: './settings-screen.scss',
})
export class SettingsScreen {
  protected readonly store = inject(LearningStore);
  protected readonly caps: LearnerSettings['dailyCap'][] = [5, 7, 10];
  protected readonly learned = computed(() =>
    learnedMorning(this.store.sessions(), this.store.timeZone()),
  );

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

  protected setVacation(value: string): void {
    void this.store.saveSettings({ vacationUntil: value || null });
  }
}
