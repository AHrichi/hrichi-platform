import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { normalizeCode } from '@ah/products/lasertag/domain';
import { AhAlert, AhButton } from '@ah/ui';
import { BarqI18n } from '../../i18n/barq-i18n';
import { BarqSession, problemOf } from '../../state/barq-session';

/**
 * A guest's games join the player's profile with the code staff gave them.
 * The guest's QR opens this page as `/claim#code=…`: the part after `#`
 * never reaches a server; it only fills the field in.
 */
@Component({
  selector: 'lt-claim-screen',
  imports: [AhAlert, AhButton, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './claim-screen.html',
  styleUrls: ['../screen.scss'],
})
export class ClaimScreen {
  protected readonly i18n = inject(BarqI18n);
  protected readonly session = inject(BarqSession);

  protected readonly code = signal(
    /code=([0-9A-Za-z-]{10,11})/.exec(globalThis.location?.hash ?? '')?.[1] ??
      '',
  );
  protected readonly busy = signal(false);
  protected readonly problem = signal<string | null>(null);
  protected readonly done = signal<string | null>(null);

  protected async claim(event: Event): Promise<void> {
    event.preventDefault();
    if (!normalizeCode(this.code())) {
      this.problem.set(this.i18n.error('CODE_INVALID'));
      return;
    }
    this.busy.set(true);
    this.problem.set(null);
    try {
      const guest = await this.session.claimGuest(this.code());
      this.done.set(guest.nickname);
      this.code.set('');
    } catch (error) {
      this.problem.set(this.i18n.error(problemOf(error).code));
    } finally {
      this.busy.set(false);
    }
  }
}
