import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  checkGreenhouse,
  CROPS,
  type Greenhouse,
  type GreenhouseInput,
  newId,
} from '@ah/products/greenhouse/domain';
import { GhButton } from '@ah/products/greenhouse/ui';
import { DashboardI18n } from '../i18n/dashboard-i18n';
import { type FieldProblems, formText } from '../shared/problems';
import { FarmStore } from '../store/farm.store';

/** The farm's greenhouses: add, edit, archive. */
@Component({
  selector: 'gh-greenhouses-screen',
  imports: [GhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './greenhouses-screen.html',
  styleUrl: '../shared/screen.scss',
})
export class GreenhousesScreen {
  protected readonly store = inject(FarmStore);
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;
  protected readonly crops = CROPS;

  protected readonly editing = signal<Greenhouse | null>(null);
  protected readonly problems = signal<FieldProblems<keyof GreenhouseInput>>(
    {},
  );

  protected edit(greenhouse: Greenhouse): void {
    this.editing.set(greenhouse);
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
    const others = this.store
      .setup()
      .greenhouses.filter((g) => g.id !== editing?.id)
      .map((g) => g.name);
    const result = checkGreenhouse(
      {
        name: values['name'] ?? '',
        area: values['area'] ?? '',
        crop: values['crop'] ?? '',
        kgPerCrate: values['kgPerCrate'] ?? '',
      },
      others,
    );
    if (!result.ok) {
      this.problems.set(result.errors);
      return;
    }
    this.cancel(form);
    await this.store.saveGreenhouse({
      id: editing?.id ?? newId(),
      active: editing?.active ?? true,
      ...result.value,
    });
  }

  protected setActive(greenhouse: Greenhouse, active: boolean): void {
    void this.store.saveGreenhouse({ ...greenhouse, active });
  }

  protected problem(field: keyof GreenhouseInput): string | null {
    const problem = this.problems()[field];
    return problem ? this.t().common.errors[problem] : null;
  }
}
