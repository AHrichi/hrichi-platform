import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  maxLength,
  required,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import {
  AGE_POLICIES,
  DISPLAY_NAME_MAX,
  handleProblem,
  type Lang,
  nameProblem,
  signupAge,
} from '@ah/products/lasertag/domain';
import { AhAlert, AhButton, AhSegmentedControl } from '@ah/ui';
import { BARQ_LANGUAGES, BarqI18n } from '../../i18n/barq-i18n';
import { BarqSession, problemOf } from '../../state/barq-session';

interface JoinModel {
  handle: string;
  displayName: string;
  birthYear: string;
}

/**
 * Sign-up: a handle, a name and a birth year, then a passkey. The same
 * rules as the server's (they share the domain lib) show as the reader
 * types; the server still checks everything.
 */
@Component({
  selector: 'lt-join-screen',
  imports: [
    AhAlert,
    AhButton,
    AhSegmentedControl,
    FormField,
    FormRoot,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './join-screen.html',
  styleUrls: ['../screen.scss'],
})
export class JoinScreen {
  protected readonly i18n = inject(BarqI18n);
  private readonly session = inject(BarqSession);
  private readonly router = inject(Router);

  protected readonly languages = computed(() =>
    BARQ_LANGUAGES.map((l) => ({ value: l.id, label: l.nativeName })),
  );
  protected readonly language = signal<Lang>(this.i18n.lang());
  protected readonly busy = signal(false);
  protected readonly problem = signal<string | null>(null);

  protected readonly model = signal<JoinModel>({
    handle: '',
    displayName: '',
    birthYear: '',
  });
  protected readonly join = form(
    this.model,
    (path) => {
      required(path.handle);
      required(path.displayName);
      required(path.birthYear);
      maxLength(path.birthYear, 4);
      validate(path.handle, ({ value }) => {
        const problem = handleProblem(value());
        return problem ? { kind: problem } : null;
      });
      validate(path.displayName, ({ value }) => {
        const problem = nameProblem(value(), 1, DISPLAY_NAME_MAX);
        return problem ? { kind: problem } : null;
      });
      validate(path.birthYear, ({ value }) =>
        /^\d{4}$/.test(value().trim()) &&
        signupAge(Number(value()), AGE_POLICIES.TN, new Date()) !== 'invalid'
          ? null
          : { kind: 'year' },
      );
    },
    { submission: { action: () => this.create() } },
  );

  /** What the age means, shown as soon as a full year is typed. */
  protected readonly age = computed(() => {
    const year = this.model().birthYear.trim();
    return /^\d{4}$/.test(year)
      ? signupAge(Number(year), AGE_POLICIES.TN, new Date())
      : null;
  });

  protected setLanguage(lang: Lang): void {
    this.language.set(lang);
    this.i18n.setLanguage(lang);
  }

  /** The words for a field's first error. */
  protected message(errors: readonly { kind: string }[]): string {
    const kind = errors[0]?.kind ?? '';
    const problems = this.i18n.t().problems as Record<string, string>;
    return problems[kind] ?? problems['required'];
  }

  private async create(): Promise<undefined> {
    if (this.age() === 'guardian-required') return undefined;
    this.busy.set(true);
    this.problem.set(null);
    const value = this.model();
    try {
      await this.session.signUp({
        handle: value.handle.trim(),
        displayName: value.displayName,
        birthYear: Number(value.birthYear),
        language: this.language(),
        country: 'TN',
      });
      await this.router.navigateByUrl('/badge');
    } catch (error) {
      this.problem.set(this.i18n.error(problemOf(error).code));
    } finally {
      this.busy.set(false);
    }
    return undefined;
  }
}
