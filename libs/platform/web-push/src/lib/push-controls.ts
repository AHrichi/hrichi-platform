import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { AhButton } from '@ah/ui';
import { WebPush } from './web-push';

/**
 * Turn push on or off for this device, and send a test. The parent says
 * what blocks it (unpaired, demo) in words; this says what the browser
 * blocks (iPhone not installed, permission denied).
 */
@Component({
  selector: 'ah-push-controls',
  imports: [AhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="status" role="status" aria-live="polite">
      <span
        class="dot"
        [class]="'dot dot--' + tone()"
        aria-hidden="true"
      ></span>
      <span>{{ statusText() }}</span>
    </div>

    @if (blockedBy(); as reason) {
      <p class="hint">{{ reason }}</p>
    } @else if (browserBlock(); as reason) {
      <p class="hint">{{ reason }}</p>
    } @else {
      <div class="actions">
        @if (push.subscribed()) {
          <button
            ahButton="secondary"
            size="sm"
            type="button"
            [disabled]="push.busy()"
            (click)="sendTest.emit()"
          >
            Send a test
          </button>
          <button
            ahButton="ghost"
            size="sm"
            type="button"
            [disabled]="push.busy()"
            (click)="turnOff.emit()"
          >
            Turn off
          </button>
        } @else {
          <button
            ahButton
            size="sm"
            type="button"
            [disabled]="push.busy()"
            (click)="turnOn.emit()"
          >
            {{ push.busy() ? 'Turning on…' : 'Turn on notifications' }}
          </button>
        }
      </div>
    }
    @if (push.problem(); as problem) {
      <p class="problem" role="alert">{{ problem }}</p>
    } @else if (push.info(); as info) {
      <p class="hint">{{ info }}</p>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-2);
    }

    .status {
      display: flex;
      gap: var(--space-2);
      align-items: center;
      font-weight: var(--font-weight-medium);
    }

    .dot {
      inline-size: 0.6rem;
      block-size: 0.6rem;
      flex: none;
      border-radius: var(--radius-pill);
      background: var(--color-text-muted);
    }

    .dot--on {
      background: var(--color-success-default);
    }

    .dot--blocked {
      background: var(--color-warning-default);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    .hint {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--font-size-200);
    }

    .problem {
      margin: 0;
      color: var(--color-danger-default);
      font-size: var(--font-size-200);
    }
  `,
})
export class PushControls {
  protected readonly push = inject(WebPush);
  /** Why the app can't subscribe this device, in words; null when it can. */
  readonly blockedBy = input<string | null>(null);
  readonly turnOn = output<void>();
  readonly turnOff = output<void>();
  readonly sendTest = output<void>();

  protected readonly browserBlock = computed(() => {
    switch (this.push.support()) {
      case 'install-first':
        return 'On iPhone and iPad, add this app to your Home Screen (Share → Add to Home Screen), open it from there, then turn notifications on.';
      case 'no-service-worker':
        return 'Notifications need the installed app or its own web address, not this preview.';
      case 'unsupported':
        return 'This browser can’t receive notifications.';
      default:
        return this.push.permission() === 'denied' && !this.push.subscribed()
          ? 'Notifications are blocked for this site. Allow them in the browser’s site settings (the lock or ⓘ icon next to the address), then come back.'
          : null;
    }
  });

  protected readonly tone = computed(() =>
    this.push.subscribed()
      ? 'on'
      : this.blockedBy() || this.browserBlock()
        ? 'blocked'
        : 'off',
  );

  protected readonly statusText = computed(() =>
    this.push.subscribed() ? 'On for this device' : 'Off for this device',
  );
}
