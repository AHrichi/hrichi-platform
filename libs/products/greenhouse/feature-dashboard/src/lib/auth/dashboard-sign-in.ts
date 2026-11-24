import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { GhButton } from '@ah/products/greenhouse/ui';
import { DashboardI18n } from '../i18n/dashboard-i18n';
import { FarmStore } from '../store/farm.store';

type AuthProblem = 'invalid' | 'unconfirmed' | 'offline' | 'other' | 'short';

const MIN_PASSWORD = 8;

/** Sign in, or make an account (a new manager, or someone with a join code). */
@Component({
  selector: 'gh-dashboard-sign-in',
  imports: [GhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-sign-in.html',
  styleUrl: './auth.scss',
})
export class DashboardSignIn {
  private readonly store = inject(FarmStore);
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;

  protected readonly mode = signal<'sign-in' | 'sign-up'>('sign-in');
  protected readonly busy = signal(false);
  protected readonly problem = signal<AuthProblem | null>(null);
  protected readonly confirm = signal(false);
  protected readonly problemText = computed(() => {
    const problem = this.problem();
    return problem ? this.t().auth.errors[problem] : null;
  });

  protected switchMode(): void {
    this.mode.update((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'));
    this.problem.set(null);
    this.confirm.set(false);
  }

  protected async submit(email: string, password: string): Promise<void> {
    if (this.busy()) return;
    this.problem.set(null);
    this.confirm.set(false);
    if (this.mode() === 'sign-up' && password.length < MIN_PASSWORD) {
      this.problem.set('short');
      return;
    }
    this.busy.set(true);
    try {
      if (this.mode() === 'sign-in') {
        this.problem.set(await this.store.signIn(email, password));
        return;
      }
      const result = await this.store.signUp(email, password);
      if (result === 'confirm-email') {
        this.confirm.set(true);
        this.mode.set('sign-in');
      } else {
        this.problem.set(result);
      }
    } finally {
      this.busy.set(false);
    }
  }
}
