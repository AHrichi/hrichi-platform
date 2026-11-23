import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  checkWorker,
  nextBadgeCode,
  normalizeBadge,
  type Worker,
  type WorkerInput,
} from '@ah/products/greenhouse/domain';
import { GhButton } from '@ah/products/greenhouse/ui';
import { DashboardI18n } from '../i18n/dashboard-i18n';
import { type FieldProblems, formText } from '../shared/problems';
import { FarmStore, newId } from '../store/farm.store';

/** Filter value for workers in no team. */
export const NO_TEAM = 'none';

/** The roster: add, edit, move between teams, and print badges. */
@Component({
  selector: 'gh-workers-screen',
  imports: [GhButton, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workers-screen.html',
  styleUrl: '../shared/screen.scss',
})
export class WorkersScreen {
  protected readonly store = inject(FarmStore);
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;
  protected readonly noTeam = NO_TEAM;

  protected readonly editing = signal<Worker | null>(null);
  protected readonly problems = signal<FieldProblems<keyof WorkerInput>>({});
  protected readonly teamFilter = signal('');
  protected readonly query = signal('');

  protected readonly teamNames = computed(
    () => new Map(this.store.setup().teams.map((t) => [t.id, t.name])),
  );
  protected readonly pay = computed(
    () =>
      new Map(this.store.setup().pay.map((p) => [p.workerId, p.hourlyRate])),
  );
  protected readonly nextBadge = computed(() =>
    nextBadgeCode(this.store.setup().workers),
  );
  protected readonly shown = computed(() => {
    const team = this.teamFilter();
    const query = this.query().trim().toLocaleLowerCase();
    const badge = normalizeBadge(query);
    return this.store
      .setup()
      .workers.filter(
        (w) =>
          (!team || (team === NO_TEAM ? !w.teamId : w.teamId === team)) &&
          (!query ||
            w.fullName.toLocaleLowerCase().includes(query) ||
            normalizeBadge(w.badgeCode).includes(badge)),
      );
  });

  protected edit(worker: Worker): void {
    this.editing.set(worker);
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
    const result = checkWorker(
      {
        fullName: values['fullName'] ?? '',
        badgeCode: values['badgeCode'] ?? '',
        hourlyRate: values['hourlyRate'] ?? '',
      },
      this.store
        .setup()
        .workers.filter((w) => w.id !== editing?.id)
        .map((w) => w.badgeCode),
    );
    if (!result.ok) {
      this.problems.set(result.errors);
      return;
    }
    const { fullName, badgeCode, hourlyRate } = result.value;
    const worker: Worker = {
      id: editing?.id ?? newId(),
      fullName,
      badgeCode,
      teamId: values['teamId'] || null,
      active: editing ? values['active'] === 'on' : true,
    };
    this.cancel(form);
    await this.store.saveWorker(worker, hourlyRate);
  }

  protected problem(field: keyof WorkerInput): string | null {
    const problem = this.problems()[field];
    return problem ? this.t().common.errors[problem] : null;
  }
}
