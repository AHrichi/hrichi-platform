import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { normalizeCode } from '@ah/products/lasertag/domain';
import { AhAlert, AhButton } from '@ah/ui';
import { BarqI18n } from '../../i18n/barq-i18n';
import { BarqSession, problemOf } from '../../state/barq-session';

/** A recovery code from staff, then a new passkey on this device. */
@Component({
  selector: 'lt-recover-screen',
  imports: [AhAlert, AhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recover-screen.html',
  styleUrls: ['../screen.scss'],
})
export class RecoverScreen {
  protected readonly i18n = inject(BarqI18n);
  private readonly session = inject(BarqSession);
  private readonly router = inject(Router);

  protected readonly code = signal('');
  protected readonly busy = signal(false);
  protected readonly problem = signal<string | null>(null);

  protected async recover(event: Event): Promise<void> {
    event.preventDefault();
    if (!normalizeCode(this.code())) {
      this.problem.set(this.i18n.error('CODE_INVALID'));
      return;
    }
    this.busy.set(true);
    this.problem.set(null);
    try {
      await this.session.recover(this.code());
      await this.router.navigateByUrl('/badge');
    } catch (error) {
      this.problem.set(this.i18n.error(problemOf(error).code));
    } finally {
      this.busy.set(false);
    }
  }
}
