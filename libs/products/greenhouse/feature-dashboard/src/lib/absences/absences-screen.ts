import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  type AbsenceInput,
  checkAbsence,
  type Worker,
} from '@ah/products/greenhouse/domain';
import { GhButton } from '@ah/products/greenhouse/ui';
import { DashboardI18n } from '../i18n/dashboard-i18n';
import { type FieldProblems, formText } from '../shared/problems';
import { WeekNav } from '../shared/week-nav';
import { FarmStore, newId } from '../store/farm.store';

/** Who is off during the week on screen, and adding or removing it. */
@Component({
  selector: 'gh-absences-screen',
  imports: [GhButton, WeekNav],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './absences-screen.html',
  styleUrl: '../shared/screen.scss',
})
export class AbsencesScreen {
  protected readonly store = inject(FarmStore);
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;

  protected readonly problems = signal<FieldProblems<keyof AbsenceInput>>({});

  private readonly workers = computed(
    () => new Map(this.store.setup().workers.map((w) => [w.id, w])),
  );
  /** Active workers by team, for the picker. */
  protected readonly groups = computed(() => {
    const { teams, workers } = this.store.setup();
    const active = workers.filter((w) => w.active);
    const groups = teams.map((team) => ({
      label: team.name,
      workers: active.filter((w) => w.teamId === team.id),
    }));
    groups.push({
      label: this.t().common.noTeam,
      workers: active.filter((w) => !w.teamId),
    });
    return groups.filter((g) => g.workers.length > 0);
  });
  protected readonly absences = computed(() =>
    [...(this.store.currentWeek()?.absences ?? [])].sort(
      (a, b) =>
        a.from.localeCompare(b.from) ||
        this.nameOf(a.workerId).localeCompare(this.nameOf(b.workerId)),
    ),
  );

  protected worker(id: string): Worker | undefined {
    return this.workers().get(id);
  }

  private nameOf(id: string): string {
    return this.workers().get(id)?.fullName ?? '';
  }

  protected async save(form: HTMLFormElement): Promise<void> {
    const values = formText(form);
    const result = checkAbsence({
      workerId: values['workerId'] ?? '',
      from: values['from'] ?? '',
      to: values['to'] ?? '',
    });
    if (!result.ok) {
      this.problems.set(result.errors);
      return;
    }
    const reason = (values['reason'] ?? '').trim().slice(0, 200);
    this.problems.set({});
    form.reset();
    await this.store.saveAbsence({
      id: newId(),
      ...result.value,
      ...(reason ? { reason } : {}),
    });
  }

  protected problem(field: keyof AbsenceInput): string | null {
    const problem = this.problems()[field];
    return problem ? this.t().common.errors[problem] : null;
  }
}
