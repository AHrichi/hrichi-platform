import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  inject,
  signal,
} from '@angular/core';
import {
  checkEmail,
  checkPersonName,
  isRole,
  type Member,
  ROLES,
  type SetupProblem,
} from '@ah/products/greenhouse/domain';
import { GhButton } from '@ah/products/greenhouse/ui';
import { DashboardI18n } from '../i18n/dashboard-i18n';
import { formText } from '../shared/problems';
import { FarmStore } from '../store/farm.store';

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
  /** The member whose name is being changed. */
  protected readonly renaming = signal<string | null>(null);
  protected readonly renameProblem = signal<SetupProblem | null>(null);

  protected isMe(member: Member): boolean {
    return member.userId === this.store.account()?.id;
  }

  protected async invite(form: HTMLFormElement): Promise<void> {
    if (this.busy()) return;
    const values = formText(form);
    const email = checkEmail(values['email'] ?? '');
    const checked = checkPersonName(values['name'] ?? '');
    const role = values['role'];
    const problems: Partial<Record<'email' | 'name', SetupProblem>> = {};
    if (!email)
      problems.email = values['email']?.trim() ? 'invalid' : 'required';
    if (!checked.ok) problems.name = checked.errors.name;
    this.problems.set(problems);
    this.message.set(null);
    if (!email || !checked.ok || !isRole(role)) return;
    const name = checked.value;

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

  protected startRename(member: Member): void {
    this.renaming.set(member.userId);
    this.renameProblem.set(null);
  }

  protected cancelRename(): void {
    this.renaming.set(null);
    this.renameProblem.set(null);
  }

  protected rename(member: Member, text: string): void {
    const checked = checkPersonName(text);
    if (!checked.ok) {
      this.renameProblem.set(checked.errors.name ?? 'invalid');
      return;
    }
    this.cancelRename();
    if (checked.value !== member.fullName) {
      void this.store.renameMember(member.userId, checked.value);
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
