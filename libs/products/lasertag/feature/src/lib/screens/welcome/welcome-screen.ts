import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AhAlert, AhButton } from '@ah/ui';
import { BarqI18n } from '../../i18n/barq-i18n';
import { BarqSession, problemOf } from '../../state/barq-session';
import { BoltMark } from '../../ui/bolt-mark';

/** The front door: create a badge, sign in, or find the other ways in. */
@Component({
  selector: 'lt-welcome-screen',
  imports: [AhAlert, AhButton, BoltMark, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './welcome-screen.html',
  styleUrls: ['../screen.scss', './welcome-screen.scss'],
})
export class WelcomeScreen {
  protected readonly i18n = inject(BarqI18n);
  protected readonly session = inject(BarqSession);
  private readonly router = inject(Router);

  protected readonly busy = signal(false);
  protected readonly problem = signal<string | null>(null);
  protected readonly isStaff = computed(
    () => this.session.staffVenues().length > 0,
  );

  protected async signIn(): Promise<void> {
    this.busy.set(true);
    this.problem.set(null);
    try {
      await this.session.signIn();
      await this.router.navigateByUrl('/badge');
    } catch (error) {
      this.problem.set(this.i18n.error(problemOf(error).code));
    } finally {
      this.busy.set(false);
    }
  }
}
