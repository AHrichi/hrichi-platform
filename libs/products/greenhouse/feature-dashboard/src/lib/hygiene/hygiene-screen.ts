import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AhMetricCard } from '@ah/ui';
import {
  addDays,
  checkHygieneItem,
  type HygieneCheck,
  type HygieneItem,
  type HygieneItemInput,
  type HygieneLanguage,
  itemLabel,
  newId,
  todayOnFarm,
} from '@ah/products/greenhouse/domain';
import { GhButton } from '@ah/products/greenhouse/ui';
import { DashboardI18n } from '../i18n/dashboard-i18n';
import { type FieldProblems, formText } from '../shared/problems';
import { FarmStore } from '../store/farm.store';
import { answerRows, buildHygieneView } from './hygiene-view';

/**
 * The day's hygiene checks, greenhouse by greenhouse, with each answer,
 * note and photo; and the farm's checklist, which managers edit. Photos
 * live in a private bucket: the screen asks for short-lived links when a
 * check is opened.
 */
@Component({
  selector: 'gh-hygiene-screen',
  imports: [AhMetricCard, GhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hygiene-screen.html',
  styleUrls: ['../shared/screen.scss', './hygiene-screen.scss'],
})
export class HygieneScreen {
  protected readonly store = inject(FarmStore);
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;
  protected readonly today = todayOnFarm();
  /** The wording boxes, French first: the farm's working language. */
  protected readonly languages: readonly HygieneLanguage[] = ['fr', 'en', 'ar'];

  /** The greenhouse whose check is open, if any. */
  protected readonly opened = signal<string | null>(null);
  protected readonly photoLinks = signal<ReadonlyMap<string, string>>(
    new Map(),
  );
  protected readonly editing = signal<HygieneItem | null>(null);
  protected readonly problems = signal<FieldProblems<keyof HygieneItemInput>>(
    {},
  );

  protected readonly view = computed(() => {
    const hygiene = this.store.hygiene();
    if (!hygiene) return null;
    const { greenhouses, members } = this.store.setup();
    return buildHygieneView(hygiene, greenhouses, members);
  });
  protected readonly items = computed(() => this.store.hygiene()?.items ?? []);

  constructor() {
    void this.store.showHygiene(this.today);
  }

  protected showDay(days: number): void {
    this.opened.set(null);
    void this.store.showHygiene(addDays(this.store.hygieneDate(), days));
  }

  protected showToday(): void {
    this.opened.set(null);
    void this.store.showHygiene(this.today);
  }

  protected async toggle(
    greenhouseId: string,
    check: HygieneCheck | null,
  ): Promise<void> {
    if (this.opened() === greenhouseId || !check) {
      this.opened.set(null);
      return;
    }
    this.opened.set(greenhouseId);
    const paths = check.answers
      .flatMap((a) => a.photoPaths)
      .filter((p) => !this.photoLinks().has(p));
    if (paths.length === 0) return;
    const links = await this.store.photoUrls(paths);
    this.photoLinks.update((known) => new Map([...known, ...links]));
  }

  protected answers(check: HygieneCheck) {
    return answerRows(check, this.items());
  }

  protected label(item: HygieneItem): string {
    return itemLabel(item, this.i18n.lang());
  }

  // The checklist --------------------------------------------------------

  protected edit(item: HygieneItem): void {
    this.editing.set(item);
    this.problems.set({});
  }

  protected cancel(form: HTMLFormElement): void {
    form.reset();
    this.editing.set(null);
    this.problems.set({});
  }

  protected async save(form: HTMLFormElement): Promise<void> {
    const values = formText(form);
    const result = checkHygieneItem({
      ar: values['ar'] ?? '',
      fr: values['fr'] ?? '',
      en: values['en'] ?? '',
    });
    if (!result.ok) {
      this.problems.set(result.errors);
      return;
    }
    const photoBox = form.elements.namedItem('photoRequired');
    const photoRequired =
      photoBox instanceof HTMLInputElement && photoBox.checked;
    const editing = this.editing();
    const last = Math.max(0, ...this.items().map((i) => i.sortOrder));
    this.cancel(form);
    await this.store.saveHygieneItem({
      id: editing?.id ?? newId(),
      label: result.value,
      photoRequired,
      sortOrder: editing?.sortOrder ?? last + 1,
      active: editing?.active ?? true,
    });
  }

  protected setActive(item: HygieneItem, active: boolean): void {
    void this.store.saveHygieneItem({ ...item, active });
  }

  /** Moves an item up or down, numbering the checklist 1, 2, 3… */
  protected move(item: HygieneItem, step: -1 | 1): void {
    const list = [...this.items()];
    const from = list.indexOf(item);
    const to = from + step;
    const other = list[to];
    if (from < 0 || !other) return;
    list[to] = item;
    list[from] = other;
    list.forEach((each, i) => {
      if (each.sortOrder !== i + 1) {
        void this.store.saveHygieneItem({ ...each, sortOrder: i + 1 });
      }
    });
  }

  protected problem(field: keyof HygieneItemInput): string | null {
    const problem = this.problems()[field];
    return problem ? this.t().common.errors[problem] : null;
  }
}
