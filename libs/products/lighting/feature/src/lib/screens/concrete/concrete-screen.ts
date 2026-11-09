import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AhButton, AhMetricCard } from '@ah/ui';
import {
  type ConcreteExposure,
  type ConcreteMixParams,
  validateConcreteMix,
} from '@ah/products/lighting/domain';
import { ConcreteDiagram } from '../../diagrams/concrete-diagram/concrete-diagram';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { LightingStore } from '../../store/lighting.store';
import { NoteList } from '../../ui/note-list/note-list';
import { HowTo } from '../../ui/how-to/how-to';
import { NumberField } from '../../ui/number-field/number-field';
import { SaveBar, type SaveRequest } from '../../ui/save-bar/save-bar';
import { EXPOSURES } from '../options';

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Checks a pour against NF EN 206: cement dosage, water/cement ratio, the
 * slump test, and how far curing has gone before the poles may go up.
 */
@Component({
  selector: 'lp-concrete-screen',
  imports: [
    AhButton,
    AhMetricCard,
    ConcreteDiagram,
    HowTo,
    NoteList,
    NumberField,
    SaveBar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './concrete-screen.html',
  styleUrl: './concrete-screen.scss',
})
export class ConcreteScreen {
  protected readonly store = inject(LightingStore);
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly exposures = EXPOSURES;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly query = toSignal(this.route.queryParamMap);
  private readonly destroyRef = inject(DestroyRef);
  private planTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly savedCalc = computed(() => {
    const editId = this.query()?.get('edit') ?? null;
    const saved = this.store.calculations().find((c) => c.id === editId);
    return saved?.kind === 'concrete' ? saved : null;
  });

  protected readonly editingId = computed(() => this.savedCalc()?.id ?? null);
  protected readonly editingLabel = computed(
    () => this.savedCalc()?.label ?? null,
  );

  protected readonly volume = linkedSignal<number>(
    () =>
      this.savedCalc()?.inputs.volumeM3 ??
      (this.store.stats().totalConcreteVolumeM3 || 1.2),
  );
  protected readonly exposure = linkedSignal<ConcreteExposure>(
    () => this.savedCalc()?.inputs.exposure ?? 'XC2',
  );
  protected readonly cement = linkedSignal<number>(
    () => this.savedCalc()?.inputs.measuredCementKg ?? 350,
  );
  protected readonly water = linkedSignal<number>(
    () => this.savedCalc()?.inputs.measuredWaterLiters ?? 168,
  );
  protected readonly slump = linkedSignal<number>(
    () => this.savedCalc()?.inputs.slumpTestCm ?? 7,
  );
  protected readonly days = linkedSignal<number>(
    () => this.savedCalc()?.inputs.curingAgeDays ?? 7,
  );
  protected readonly pouredOn = signal(
    addDays(new Date().toISOString().slice(0, 10), -7),
  );

  protected readonly params = computed<ConcreteMixParams>(() => ({
    volumeM3: this.volume(),
    targetClass: 'C25_30',
    exposure: this.exposure(),
    slumpTestCm: this.slump(),
    measuredCementKg: this.cement(),
    measuredWaterLiters: this.water(),
    mixingMethod: 'ready_mix_truck',
    curingAgeDays: this.days(),
  }));
  protected readonly result = computed(() =>
    validateConcreteMix(this.params()),
  );

  protected readonly suggestedLabel = computed(
    () =>
      `${this.t().nav.concrete} · ${this.i18n.num(this.cement(), 0)} kg/m³ · E/C ${this.i18n.num(this.result().providedWaterCementRatio, 2)} · ${this.result().slumpClassification}`,
  );

  protected readonly planned = signal(false);

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.planTimer) clearTimeout(this.planTimer);
    });
  }

  protected async save(request: SaveRequest): Promise<void> {
    const id = await this.store.saveCalculation({
      id: request.replace ? (this.editingId() ?? undefined) : undefined,
      kind: 'concrete',
      label: request.label,
      inputs: this.params(),
    });
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { edit: id },
      replaceUrl: true,
    });
  }

  protected stopEditing(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  /** Adds "poles may go up" (day 7) and "full strength" (day 28) to the plan. */
  protected async planCuring(): Promise<void> {
    const poured = this.pouredOn();
    const t = this.t().concrete;
    await this.store.addMilestone({
      title: t.milestoneLift,
      date: addDays(poured, 7),
      category: 'erection',
      notes: t.milestoneNotes(
        this.i18n.num(this.cement(), 0),
        this.result().slumpClassification,
      ),
    });
    await this.store.addMilestone({
      title: t.milestoneFull,
      date: addDays(poured, 28),
      category: 'foundation_curing',
    });
    this.planned.set(true);
    setTimeout(() => this.planned.set(false), 5000);
  }
}
