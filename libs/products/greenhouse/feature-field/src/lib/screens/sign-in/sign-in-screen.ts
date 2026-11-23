import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { GhButton } from '@ah/products/greenhouse/ui';
import type { SignInError } from '@ah/products/greenhouse/data-access';
import { FieldI18n } from '../../i18n/field-i18n';
import { FieldStore } from '../../store/field.store';

/** Supabase's default minimum, which the dashboard asks for too. */
const MIN_PASSWORD = 8;

type SignInProblem = SignInError | 'other-account' | 'short';

/**
 * Email and password, once, while there is signal; or a new account for a
 * supervisor the manager invited. When a session ran out with entries
 * waiting, the email is fixed to the account that logged them and there is
 * no sign-up.
 */
@Component({
  selector: 'gh-sign-in-screen',
  imports: [GhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sign-in-screen.html',
  styleUrl: './sign-in-screen.scss',
})
export class SignInScreen {
  protected readonly store = inject(FieldStore);
  protected readonly i18n = inject(FieldI18n);
  protected readonly t = this.i18n.t;

  /** The account to sign in as again, if a session ran out. */
  protected readonly lockedEmail = computed(() =>
    this.store.reauth() ? this.store.account() : null,
  );
  protected readonly mode = signal<'sign-in' | 'sign-up'>('sign-in');
  protected readonly busy = signal(false);
  /** The account is made; its email waits to be confirmed. */
  protected readonly confirm = signal(false);
  protected readonly error = signal<SignInProblem | null>(null);
  protected readonly errorText = computed(() => {
    const error = this.error();
    if (!error) return null;
    return this.i18n.fill(this.t().auth.errors[error], {
      email: this.lockedEmail() ?? '',
    });
  });

  protected switchMode(): void {
    this.mode.update((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'));
    this.error.set(null);
    this.confirm.set(false);
  }

  protected async submit(email: string, password: string): Promise<void> {
    if (this.busy()) return;
    this.error.set(null);
    this.confirm.set(false);
    const signingUp = this.mode() === 'sign-up' && !this.lockedEmail();
    if (signingUp && password.length < MIN_PASSWORD) {
      this.error.set('short');
      return;
    }
    this.busy.set(true);
    try {
      if (!signingUp) {
        this.error.set(
          await this.store.signIn(this.lockedEmail() ?? email, password),
        );
        return;
      }
      const result = await this.store.signUp(email, password);
      if (result === 'confirm-email') {
        this.confirm.set(true);
        this.mode.set('sign-in');
      } else {
        this.error.set(result);
      }
    } finally {
      this.busy.set(false);
    }
  }
}
