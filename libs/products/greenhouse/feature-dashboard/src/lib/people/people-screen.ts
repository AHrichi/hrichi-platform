import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  inject,
  signal,
} from '@angular/core';
import {
  checkEmail,
  type Member,
  type Role,
  ROLES,
  type SetupProblem,
} from '@ah/products/greenhouse/domain';
import { GhButton } from '@ah/products/greenhouse/ui';
import { DashboardI18n } from '../i18n/dashboard-i18n';
import { formText } from '../shared/problems';
import { FarmStore } from '../store/farm.store';

const isRole = (value: unknown): value is Role =>
  (ROLES as readonly unknown[]).includes(value);

/** Who can sign in to the farm: members, invitations, and inviting. */
@Component({
  selector: 'gh-people-screen',
  imports: [GhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './people-screen.html',
  styleUrl: '../shared/screen.scss',
})
export class PeopleScreen {
  protected readonly store = inject(FarmStore);
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;
  protected readonly roles = ROLES;
  private readonly window = inject(DOCUMENT).defaultView;

  protected readonly problems = signal<
    Partial<Record<'email' | 'name', SetupProblem>>
  >({});
  protected readonly message = signal<string | null>(null);
  protected readonly busy = signal(false);

  protected isMe(member: Member): boolean {
    return member.userId === this.store.account()?.id;
  }

  protected async invite(form: HTMLFormElement): Promise<void> {
    if (this.busy()) return;
    const values = formText(form);
    const email = checkEmail(values['email'] ?? '');
    const name = (values['name'] ?? '').trim().replace(/\s+/g, ' ');
    const role = values['role'];
    const problems: Partial<Record<'email' | 'name', SetupProblem>> = {};
    if (!email)
      problems.email = values['email']?.trim() ? 'invalid' : 'required';
    if (!name) problems.name = 'required';
    this.problems.set(problems);
    this.message.set(null);
    if (!email || !name || !isRole(role)) return;

    this.busy.set(true);
    try {
      const result = await this.store.invite(email, role, name);
      if (!result) return;
      form.reset();
      this.message.set(
        this.i18n.fill(this.t().people[result], { name, email }),
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected remove(member: Member): void {
    const question = this.i18n.fill(this.t().people.removeConfirm, {
      name: member.fullName,
    });
    if (this.window?.confirm(question)) {
      void this.store.removeMember(member.userId);
    }
  }

  protected problem(field: 'email' | 'name'): string | null {
    const problem = this.problems()[field];
    return problem ? this.t().common.errors[problem] : null;
  }
}
