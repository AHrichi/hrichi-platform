import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AhButton, AhMetricCard } from '@ah/ui';
import {
  COVER_IDS,
  greenhouseGeometry,
  type GreenhouseShape,
  type GreenhouseSpec,
  roofSectionsPerSpan,
  SCREEN_IDS,
} from '@ah/products/serracalc/domain';
import { HouseSection } from '../../diagrams/house-section/house-section';
import { SerraI18n } from '../../i18n/serra-i18n';
import { SerraStore } from '../../store/serra.store';
import { CalcSteps, type CalcStep } from '../../ui/calc-steps/calc-steps';
import { FieldGrid, type FieldChange } from '../../ui/field-grid/field-grid';
import { NoteList } from '../../ui/note-list/note-list';
import { GREENHOUSE_FIELDS } from '../fields';

/** The house every calculator starts from, edited and saved to the project. */
@Component({
  selector: 'sc-greenhouse-screen',
  imports: [
    AhButton,
    AhMetricCard,
    CalcSteps,
    FieldGrid,
    HouseSection,
    NoteList,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './greenhouse-screen.html',
  styleUrl: '../calc-screen.scss',
})
export class GreenhouseScreen {
  protected readonly store = inject(SerraStore);
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;

  protected readonly fields = GREENHOUSE_FIELDS;
  protected readonly shapes: readonly GreenhouseShape[] = [
    'gable',
    'venlo',
    'tunnel',
  ];
  protected readonly covers = COVER_IDS;
  protected readonly screens = SCREEN_IDS;

  protected readonly spec = signal<GreenhouseSpec>(
    this.store.context().greenhouse,
  );
  protected readonly geometry = computed(() => greenhouseGeometry(this.spec()));
  protected readonly savedNow = signal(false);
  /** Changed here and not yet saved to the project. */
  protected readonly dirty = computed(() => {
    const project = this.store.activeProject();
    return (
      !!project &&
      JSON.stringify(project.greenhouse) !== JSON.stringify(this.spec())
    );
  });

  protected readonly steps = computed<CalcStep[]>(() => {
    const s = this.spec();
    const g = this.geometry();
    const n = (v: number, d = 1) => this.i18n.num(v, d);
    const f = this.t().greenhouse.formulas;
    const sections = roofSectionsPerSpan(s);
    const rise = Math.max(0, s.ridgeHeightM - s.gutterHeightM);
    const sectionWidth = s.spanWidthM / sections;
    return [
      {
        label: f.floor,
        math: `${s.spans} × ${n(s.spanWidthM)} m × ${n(s.lengthM, 0)} m = ${n(g.floorAreaM2, 0)} m²`,
      },
      {
        label: f.roof,
        math:
          s.shape === 'tunnel'
            ? `${s.spans * sections} × ½ ellipse(${n(sectionWidth / 2, 2)}, ${n(rise, 2)}) × ${n(s.lengthM, 0)} m = ${n(g.roofAreaM2, 0)} m²`
            : `${s.spans * sections} × 2 × √(${n(sectionWidth / 2, 2)}² + ${n(rise, 2)}²) × ${n(s.lengthM, 0)} m = ${n(g.roofAreaM2, 0)} m²`,
      },
      {
        label: f.ends,
        math: `${n(g.sideWallAreaM2, 0)} + ${n(g.gableAreaM2, 0)} m² → ${this.t().greenhouse.cover} ${n(g.coverAreaM2, 0)} m² (× ${n(g.coverRatio, 2)})`,
      },
      {
        label: f.volume,
        math: `${n(g.floorAreaM2, 0)} × ${n(s.gutterHeightM)} + roof × ${n(s.lengthM, 0)} = ${n(g.volumeM3, 0)} m³`,
      },
    ];
  });

  constructor() {
    effect(() => {
      const greenhouse = this.store.context().greenhouse;
      untracked(() => this.spec.set({ ...greenhouse }));
    });
  }

  protected set(change: FieldChange): void {
    this.spec.update((s) => ({ ...s, [change.key]: change.value }));
    this.savedNow.set(false);
  }

  protected setOption(key: 'shape' | 'cover' | 'screen', value: string): void {
    this.spec.update((s) => ({ ...s, [key]: value }));
    this.savedNow.set(false);
  }

  protected setInsulated(value: boolean): void {
    this.spec.update((s) => ({ ...s, perimeterInsulated: value }));
    this.savedNow.set(false);
  }

  protected async saveToProject(): Promise<void> {
    await this.store.updateProject({ greenhouse: { ...this.spec() } });
    this.savedNow.set(true);
  }

  protected value(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  protected checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
