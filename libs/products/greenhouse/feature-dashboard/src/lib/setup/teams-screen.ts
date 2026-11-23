import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  inject,
  signal,
} from '@angular/core';
import { checkTeamName, type Team } from '@ah/products/greenhouse/domain';
import { GhButton } from '@ah/products/greenhouse/ui';
import { DashboardI18n } from '../i18n/dashboard-i18n';
import { type FieldProblems, formText } from '../shared/problems';
import { FarmStore, newId } from '../store/farm.store';

/** Harvest crews, their supervisor and head count. */
@Component({
  selector: 'gh-teams-screen',
  imports: [GhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teams-screen.html',
  styleUrl: '../shared/screen.scss',
})
export class TeamsScreen {
  protected readonly store = inject(FarmStore);
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;
  private readonly window = inject(DOCUMENT).defaultView;

  protected readonly editing = signal<Team | null>(null);
  protected readonly problems = signal<FieldProblems<'name'>>({});

  protected readonly supervisors = computed(() =>
    this.store.setup().members.filter((m) => m.role !== 'hr'),
  );
  protected readonly names = computed(
    () =>
      new Map(this.store.setup().members.map((m) => [m.userId, m.fullName])),
  );
  protected readonly headcount = computed(() => {
    const counts = new Map<string, number>();
    for (const w of this.store.setup().workers) {
      if (w.active && w.teamId) {
        counts.set(w.teamId, (counts.get(w.teamId) ?? 0) + 1);
      }
    }
    return counts;
  });

  protected edit(team: Team): void {
    this.editing.set(team);
    this.problems.set({});
  }

  protected cancel(form: HTMLFormElement): void {
    form.reset();
    this.editing.set(null);
    this.problems.set({});
  }

  protected async save(form: HTMLFormElement): Promise<void> {
    const values = formText(form);
    const editing = this.editing();
    const result = checkTeamName(
      values['name'] ?? '',
      this.store
        .setup()
        .teams.filter((t) => t.id !== editing?.id)
        .map((t) => t.name),
    );
    if (!result.ok) {
      this.problems.set(result.errors);
      return;
    }
    const supervisorId = values['supervisor'] || null;
    this.cancel(form);
    await this.store.saveTeam({
      id: editing?.id ?? newId(),
      name: result.value,
      supervisorId,
    });
  }

  protected remove(team: Team): void {
    const question = this.i18n.fill(this.t().teams.deleteConfirm, {
      name: team.name,
    });
    if (this.window?.confirm(question)) void this.store.deleteTeam(team.id);
  }

  protected problem(): string | null {
    const problem = this.problems().name;
    return problem ? this.t().common.errors[problem] : null;
  }
}
