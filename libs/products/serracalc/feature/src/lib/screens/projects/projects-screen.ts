import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AhButton, AhEmptyState, AhModal } from '@ah/ui';
import {
  type CalcKind,
  CLIMATES,
  climateById,
  COVER_IDS,
  CROP_IDS,
  type Currency,
  DEFAULT_CONTEXT,
  greenhouseGeometry,
  type GreenhouseProject,
  type GreenhouseShape,
  type SavedCalculation,
  SCREEN_IDS,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import { type NewProject, SerraStore } from '../../store/serra.store';
import { BackupPanel } from '../../ui/backup-panel/backup-panel';
import { FieldGrid, type FieldChange } from '../../ui/field-grid/field-grid';
import { GREENHOUSE_FIELDS } from '../fields';

/** Where each kind of saved result opens. */
const OPENS_IN: Record<CalcKind, { screen: string; tab: string }> = {
  heatPeak: { screen: 'heating', tab: 'peak' },
  heatYear: { screen: 'heating', tab: 'year' },
  hotWater: { screen: 'heating', tab: 'pipes' },
  ventilation: { screen: 'cooling', tab: 'ventilation' },
  padFan: { screen: 'cooling', tab: 'padFan' },
  cropWater: { screen: 'water', tab: 'crop' },
  rainwater: { screen: 'water', tab: 'rain' },
  light: { screen: 'air', tab: 'light' },
  co2: { screen: 'air', tab: 'co2' },
  humidity: { screen: 'air', tab: 'humidity' },
  vpd: { screen: 'air', tab: 'vpd' },
  fog: { screen: 'cooling', tab: 'fog' },
  calendar: { screen: 'calendar', tab: 'plan' },
  ro: { screen: 'supply', tab: 'ro' },
  fertigation: { screen: 'supply', tab: 'fertigation' },
  energy: { screen: 'energy', tab: 'chp' },
  heatReuse: { screen: 'energy', tab: 'reuse' },
  economics: { screen: 'site', tab: 'economics' },
};

const SHAPES: readonly GreenhouseShape[] = ['gable', 'venlo', 'tunnel'];
const CURRENCIES: readonly Currency[] = ['TND', 'EUR', 'USD'];

function blankDraft(): NewProject {
  return {
    title: '',
    site: '',
    climateId: DEFAULT_CONTEXT.climateId,
    crop: DEFAULT_CONTEXT.crop,
    currency: DEFAULT_CONTEXT.currency,
    greenhouse: { ...DEFAULT_CONTEXT.greenhouse },
  };
}

@Component({
  selector: 'sc-projects-screen',
  imports: [
    AhButton,
    AhEmptyState,
    AhModal,
    BackupPanel,
    FieldGrid,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects-screen.html',
  styleUrl: './projects-screen.scss',
})
export class ProjectsScreen {
  protected readonly store = inject(SerraStore);
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;

  protected readonly climates = CLIMATES;
  protected readonly crops = CROP_IDS;
  protected readonly covers = COVER_IDS;
  protected readonly screens = SCREEN_IDS;
  protected readonly shapes = SHAPES;
  protected readonly currencies = CURRENCIES;
  protected readonly houseFields = GREENHOUSE_FIELDS;

  protected readonly formOpen = signal(false);
  protected readonly editingProject = signal(false);
  protected readonly formError = signal(false);
  protected readonly draft = signal<NewProject>(blankDraft());

  protected readonly renaming = signal<SavedCalculation | null>(null);
  protected readonly renameOpen = signal(false);
  protected readonly renameText = signal('');

  protected readonly summary = computed(() => {
    const project = this.store.activeProject();
    if (!project) return null;
    const g = greenhouseGeometry(project.greenhouse);
    return {
      climate: climateById(project.climateId),
      floor: g.floorAreaM2,
      cover: g.coverAreaM2,
      volume: g.volumeM3,
    };
  });

  protected newProject(): void {
    this.draft.set(blankDraft());
    this.editingProject.set(false);
    this.formError.set(false);
    this.formOpen.set(true);
  }

  protected editProject(project: GreenhouseProject): void {
    this.draft.set({
      title: project.title,
      site: project.site,
      climateId: project.climateId,
      crop: project.crop,
      currency: project.currency,
      greenhouse: { ...project.greenhouse },
    });
    this.editingProject.set(true);
    this.formError.set(false);
    this.formOpen.set(true);
  }

  protected setDraft<K extends keyof NewProject>(
    key: K,
    value: NewProject[K],
  ): void {
    this.draft.update((d) => ({ ...d, [key]: value }));
  }

  protected setHouse(change: FieldChange): void {
    this.draft.update((d) => ({
      ...d,
      greenhouse: { ...d.greenhouse, [change.key]: change.value },
    }));
  }

  protected setHouseOption(
    key: 'shape' | 'cover' | 'screen',
    value: string,
  ): void {
    this.draft.update((d) => ({
      ...d,
      greenhouse: { ...d.greenhouse, [key]: value },
    }));
  }

  protected setInsulated(value: boolean): void {
    this.draft.update((d) => ({
      ...d,
      greenhouse: { ...d.greenhouse, perimeterInsulated: value },
    }));
  }

  protected async submit(): Promise<void> {
    const draft = this.draft();
    if (!draft.title.trim()) {
      this.formError.set(true);
      return;
    }
    const clean = {
      ...draft,
      title: draft.title.trim(),
      site: draft.site.trim(),
    };
    if (this.editingProject()) {
      await this.store.updateProject(clean);
    } else {
      await this.store.createProject(clean);
    }
    this.formOpen.set(false);
  }

  protected async deleteProject(project: GreenhouseProject): Promise<void> {
    if (confirm(this.t().projects.deleteConfirm(project.title))) {
      await this.store.deleteProject(project.id);
    }
  }

  protected opens(saved: SavedCalculation): { screen: string; tab: string } {
    return OPENS_IN[saved.kind];
  }

  protected startRename(saved: SavedCalculation): void {
    this.renaming.set(saved);
    this.renameText.set(saved.label);
    this.renameOpen.set(true);
  }

  protected async rename(): Promise<void> {
    const saved = this.renaming();
    const label = this.renameText().trim();
    if (saved && label) {
      await this.store.renameCalculation(saved.id, label);
    }
    this.renameOpen.set(false);
  }

  protected async deleteResult(saved: SavedCalculation): Promise<void> {
    if (confirm(this.t().projects.deleteResult(saved.label))) {
      await this.store.deleteCalculation(saved.id);
    }
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  protected checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
