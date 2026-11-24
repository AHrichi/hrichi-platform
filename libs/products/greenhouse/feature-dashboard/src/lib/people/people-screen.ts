import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  inject,
  signal,
} from '@angular/core';
import {
  checkPersonName,
  formatJoinCode,
  isRole,
  type JoinCode,
  type Member,
  ROLES,
  type SetupProblem,
} from '@ah/products/greenhouse/domain';
import { GhButton } from '@ah/products/greenhouse/ui';
import { DashboardI18n } from '../i18n/dashboard-i18n';
import { formText } from '../shared/problems';
import { FarmStore } from '../store/farm.store';

/**
 * Who can sign in to the farm: its members, and join codes for the people
 * a manager adds. The project sends no email, so a code is handed over in
 * person or on WhatsApp.
 */
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

  protected readonly nameProblem = signal<SetupProblem | null>(null);
  protected readonly busy = signal(false);
  /** The code just made, shown big until the next one. */
  protected readonly made = signal<JoinCode | null>(null);
  protected readonly copied = signal(false);
  protected readonly format = formatJoinCode;
  /** The member whose name is being changed. */
  protected readonly renaming = signal<string | null>(null);
  protected readonly renameProblem = signal<SetupProblem | null>(null);

  protected isMe(member: Member): boolean {
    return member.userId === this.store.account()?.id;
  }

  protected async makeCode(form: HTMLFormElement): Promise<void> {
    if (this.busy()) return;
    const values = formText(form);
    const checked = checkPersonName(values['name'] ?? '');
    const role = values['role'];
    this.nameProblem.set(
      checked.ok ? null : (checked.errors.name ?? 'invalid'),
    );
    if (!checked.ok || !isRole(role)) return;

    this.busy.set(true);
    this.made.set(null);
    this.copied.set(false);
    try {
      const code = await this.store.createJoinCode(role, checked.value);
      if (!code) return;
      form.reset();
      this.made.set(code);
    } finally {
      this.busy.set(false);
    }
  }

  protected async copy(code: JoinCode): Promise<void> {
    try {
      await this.window?.navigator.clipboard.writeText(
        formatJoinCode(code.code),
      );
      this.copied.set(true);
    } catch {
      // No clipboard here; the code is on screen to copy by hand.
    }
  }

  /** WhatsApp's share link: the manager picks the person in WhatsApp. */
  protected whatsAppLink(code: JoinCode): string {
    // Supervisors use the phone app; managers and HR the dashboard.
    const tp = this.t().people;
    const message =
      code.role === 'supervisor' ? tp.messageField : tp.messageDashboard;
    const text = this.i18n.fill(message, {
      farm: this.store.access()?.farmName ?? '',
      role: this.t().roles[code.role],
      code: formatJoinCode(code.code),
      date: this.i18n.until(code.expiresAt),
    });
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  protected withdraw(code: JoinCode): void {
    if (this.made()?.code === code.code) this.made.set(null);
    void this.store.withdrawJoinCode(code.code);
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
}
