import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
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

  protected readonly volume = signal(1.2);
  protected readonly exposure = signal<ConcreteExposure>('XC2');
  protected readonly cement = signal(350);
  protected readonly water = signal(168);
  protected readonly slump = signal(7);
  protected readonly days = signal(7);
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

  protected readonly editingId = signal<string | null>(null);
  protected readonly editingLabel = signal<string | null>(null);
  protected readonly planned = signal(false);

  private readonly query = toSignal(this.route.queryParamMap);

  constructor() {
    effect(() => {
      const editId = this.query()?.get('edit') ?? null;
      const saved = this.store.calculations().find((c) => c.id === editId);
      untracked(() => {
        if (saved?.kind === 'concrete' && saved.id !== this.editingId()) {
          const i = saved.inputs;
          this.editingId.set(saved.id);
          this.editingLabel.set(saved.label);
          this.volume.set(i.volumeM3);
          this.exposure.set(i.exposure);
          this.cement.set(i.measuredCementKg ?? 350);
          this.water.set(i.measuredWaterLiters ?? 175);
          this.slump.set(i.slumpTestCm ?? 7);
          this.days.set(i.curingAgeDays ?? 7);
        }
      });
    });

    // Start from the project's concrete volume, if its poles have blocks.
    effect(() => {
      const volume = this.store.stats().totalConcreteVolumeM3;
      untracked(() => {
        if (volume > 0 && !this.editingId()) {
          this.volume.set(volume);
        }
      });
    });
  }

  protected async save(request: SaveRequest): Promise<void> {
    const id = await this.store.saveCalculation({
      id: request.replace ? (this.editingId() ?? undefined) : undefined,
      kind: 'concrete',
      label: request.label,
      inputs: this.params(),
    });
    this.editingId.set(id);
    this.editingLabel.set(request.label);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { edit: id },
      replaceUrl: true,
    });
  }

  protected stopEditing(): void {
    this.editingId.set(null);
    this.editingLabel.set(null);
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
