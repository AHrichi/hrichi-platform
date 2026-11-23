import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { GhButton } from '@ah/products/greenhouse/ui';
import type { SignInError } from '../../auth/sign-in-error';
import { FieldI18n } from '../../i18n/field-i18n';
import { FieldStore } from '../../store/field.store';

/**
 * Email and password, once, while there is signal. When a session ran out
 * with entries waiting, the email is fixed to the account that logged them.
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
  protected readonly busy = signal(false);
  protected readonly error = signal<SignInError | 'other-account' | null>(null);
  protected readonly errorText = computed(() => {
    const error = this.error();
    if (!error) return null;
    return this.i18n.fill(this.t().auth.errors[error], {
      email: this.lockedEmail() ?? '',
    });
  });

  protected async submit(email: string, password: string): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      this.error.set(
        await this.store.signIn(this.lockedEmail() ?? email, password),
      );
    } finally {
      this.busy.set(false);
    }
  }
}
