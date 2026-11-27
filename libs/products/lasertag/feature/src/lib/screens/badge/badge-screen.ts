import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  badgeCode,
  badgeStep,
  badgeToken,
  secondsUntilNextBadge,
} from '@ah/products/lasertag/domain';
import { BarqI18n } from '../../i18n/barq-i18n';
import { BarqSession } from '../../state/barq-session';
import { QrCode } from '../../ui/qr-code';

/**
 * The player's badge: a QR that changes every 30 seconds, and six digits
 * that change with it, made on the device from the badge key, so it works
 * offline. Staff scan the QR, or type `@handle` and the digits.
 */
@Component({
  selector: 'lt-badge-screen',
  imports: [QrCode, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge-screen.html',
  styleUrls: ['../screen.scss', './badge-screen.scss'],
})
export class BadgeScreen {
  protected readonly i18n = inject(BarqI18n);
  protected readonly session = inject(BarqSession);

  private readonly now = signal(new Date());
  private readonly step = computed(() => badgeStep(this.now()));
  protected readonly secondsLeft = computed(() =>
    secondsUntilNextBadge(this.now()),
  );
  protected readonly token = signal<string | null>(null);
  protected readonly code = signal<string | null>(null);

  constructor() {
    const timer = setInterval(() => this.now.set(new Date()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    // A new QR and code at each 30-second step, or when the player changes.
    effect(() => {
      const session = this.session.session();
      this.step();
      if (!session) {
        this.token.set(null);
        this.code.set(null);
        return;
      }
      const at = new Date();
      void Promise.all([
        badgeToken(session.badgeKey, session.player.id, at),
        badgeCode(session.badgeKey, session.player.id, at),
      ]).then(([token, code]) => {
        this.token.set(token);
        this.code.set(`${code.slice(0, 3)} ${code.slice(3)}`);
      });
    });
    void this.session.refresh();
  }
}
