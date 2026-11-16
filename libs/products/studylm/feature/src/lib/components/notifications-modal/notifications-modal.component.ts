import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { PushControls } from '@ah/platform/web-push';
import { AhModal } from '@ah/ui';
import { StudyLmNotifications } from '../../services/studylm-notifications.service';
import { StudyLmSyncService } from '../../services/studylm-sync.service';

/** Notifications on this device: the study reminder and "AI work done". */
@Component({
  selector: 'ah-studylm-notifications-modal',
  imports: [AhModal, PushControls],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ah-modal
      [open]="true"
      eyebrow="Stay on track"
      title="Notifications"
      closeLabel="Close"
      size="md"
      (closed)="notifications.showPanel.set(false)"
    >
      <div class="body">
        <section class="block" aria-labelledby="reminder-title">
          <h3 id="reminder-title">Daily study reminder</h3>
          <p class="hint">
            If you haven’t studied by this time, your phone tells you what’s
            next on your roadmap. Tapping it opens that lesson.
          </p>
          <label class="field">
            <span>Remind me at</span>
            <input
              type="time"
              [value]="notifications.settings().reminderAt ?? ''"
              (change)="setReminder($any($event.target).value)"
            />
          </label>
          <p class="hint">Leave it empty for no reminder.</p>
          <ah-push-controls
            [blockedBy]="blocker()"
            (turnOn)="notifications.enable()"
            (turnOff)="notifications.disable()"
            (sendTest)="notifications.test()"
          />
          @if (blocker() && notifications.blocker() === 'unpaired') {
            <button type="button" class="link" (click)="openSync()">
              Set up sync on this device
            </button>
          }
        </section>

        <section class="block" aria-labelledby="ai-title">
          <h3 id="ai-title">When AI work finishes</h3>
          <label class="toggle">
            <input
              type="checkbox"
              [checked]="notifications.settings().aiDone"
              (change)="
                notifications.update({ aiDone: $any($event.target).checked })
              "
            />
            <span
              >Tell me when a lesson, flashcards, a quiz or a bulk run is ready
              while I’m in another app</span
            >
          </label>
          @if (
            notifications.settings().aiDone &&
            notifications.push.permission() === 'default'
          ) {
            <button
              type="button"
              class="link"
              (click)="notifications.push.allowLocal()"
            >
              Allow notifications in this browser
            </button>
          }
          <p class="hint">
            These come from StudyLM itself, so they need no pairing; StudyLM has
            to stay open in the background.
          </p>
        </section>
      </div>
    </ah-modal>
  `,
  styles: `
    .body {
      display: grid;
      gap: var(--space-4);
    }

    .block {
      display: grid;
      gap: var(--space-2);
      padding: var(--space-4);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md);
      background: var(--color-bg-raised);

      h3 {
        margin: 0;
        font-size: var(--font-size-300);
      }
    }

    .hint {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--font-size-200);
    }

    .field {
      display: grid;
      gap: var(--space-1);
      font-size: var(--font-size-200);
      font-weight: var(--font-weight-medium);

      input {
        min-block-size: 2.75rem;
        padding-inline: var(--space-3);
        border: 1px solid
          var(--color-border-control, var(--color-border-default));
        border-radius: var(--radius-md);
        background: var(--color-bg-canvas);
        color: var(--color-text-default);
        font: inherit;
        color-scheme: dark light;
      }
    }

    .toggle {
      display: flex;
      gap: var(--space-2);
      align-items: flex-start;
      font-size: var(--font-size-200);

      input {
        inline-size: 1.25rem;
        block-size: 1.25rem;
        margin-block-start: 0.1rem;
        flex: none;
        accent-color: var(--color-accent-default);
      }
    }

    .link {
      justify-self: start;
      padding: 0;
      border: 0;
      background: none;
      color: var(--color-accent-default);
      font: inherit;
      font-size: var(--font-size-200);
      text-decoration: underline;
      cursor: pointer;
    }
  `,
})
export class NotificationsModalComponent {
  protected readonly notifications = inject(StudyLmNotifications);
  private readonly sync = inject(StudyLmSyncService, { optional: true });

  protected readonly blocker = computed(() => {
    switch (this.notifications.blocker()) {
      case 'demo':
        return 'This copy runs inside the portfolio and can’t send reminders. Open StudyLM itself to turn them on.';
      case 'no-edge':
        return 'Reminders aren’t set up for this server.';
      case 'unpaired':
        return 'Reminders need this device paired for sync (it proves the reminder is yours).';
      default:
        return null;
    }
  });

  protected setReminder(value: string): void {
    this.notifications.update({ reminderAt: value || null });
  }

  protected openSync(): void {
    this.notifications.showPanel.set(false);
    this.sync?.openModal();
  }
}
