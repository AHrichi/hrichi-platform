import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  AhButton,
  AhEmptyState,
  AhMetricCard,
  AhModal,
  AhProgressBar,
} from '@ah/ui';
import type {
  ProjectItem,
  ProjectStage,
  RoadLightingClass,
  SoilType,
  WindZone,
} from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { LightingStore } from '../../store/lighting.store';
import {
  PROJECT_STAGES,
  ROAD_CLASSES,
  SOIL_TYPES,
  WIND_ZONES,
} from '../options';
import { MilestoneList } from './milestone-list/milestone-list';
import { PoleList } from './pole-list/pole-list';
import { SavedResults } from './saved-results/saved-results';

type LightingType = ProjectItem['lightingType'];

/** Projects: pick one, see where it stands, and edit its poles, plan and saved work. */
@Component({
  selector: 'lp-projects-screen',
  imports: [
    AhButton,
    AhEmptyState,
    AhMetricCard,
    AhModal,
    AhProgressBar,
    PoleList,
    MilestoneList,
    SavedResults,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects-screen.html',
  styleUrl: './projects-screen.scss',
})
export class ProjectsScreen {
  protected readonly store = inject(LightingStore);
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly stages = PROJECT_STAGES;
  protected readonly roadClasses = ROAD_CLASSES;
  protected readonly windZones = WIND_ZONES;
  protected readonly soils = SOIL_TYPES;
  protected readonly lightingTypes: readonly LightingType[] = [
    'solar_only',
    'grid_only',
    'mixed',
  ];

  protected readonly formOpen = signal(false);
  protected readonly editing = signal(false);
  protected readonly formError = signal(false);
  protected readonly confirmDelete = signal(false);
  protected readonly confirmReset = signal(false);

  // The project form
  protected readonly title = signal('');
  protected readonly client = signal('');
  protected readonly location = signal('');
  protected readonly engineer = signal('');
  protected readonly email = signal('');
  protected readonly lightingType = signal<LightingType>('solar_only');
  protected readonly roadClass = signal<RoadLightingClass>('M3');
  protected readonly windZone = signal<WindZone>(2);
  protected readonly soil = signal<SoilType>('compact_gravel');
  protected readonly deadline = signal('');

  protected openNew(): void {
    this.editing.set(false);
    this.fill(null);
    this.formOpen.set(true);
  }

  protected openEdit(): void {
    this.editing.set(true);
    this.fill(this.store.activeProject());
    this.formOpen.set(true);
  }

  private fill(project: ProjectItem | null): void {
    this.formError.set(false);
    this.title.set(project?.title ?? '');
    this.client.set(project?.clientOrMunicipality ?? '');
    this.location.set(project?.locationName ?? '');
    this.engineer.set(project?.engineerName ?? '');
    this.email.set(project?.engineerEmail ?? '');
    this.lightingType.set(project?.lightingType ?? 'solar_only');
    this.roadClass.set(project?.roadClass ?? 'M3');
    this.windZone.set(project?.windZone ?? 2);
    this.soil.set(project?.defaultSoil ?? 'compact_gravel');
    this.deadline.set(project?.commissioningDeadline ?? '');
  }

  protected async submit(): Promise<void> {
    if (!this.title().trim() || !this.client().trim()) {
      this.formError.set(true);
      return;
    }
    const details = {
      title: this.title().trim(),
      clientOrMunicipality: this.client().trim(),
      locationName: this.location().trim(),
      engineerName: this.engineer().trim(),
      engineerEmail: this.email().trim(),
      lightingType: this.lightingType(),
      roadClass: this.roadClass(),
      windZone: this.windZone(),
      defaultSoil: this.soil(),
      ...(this.deadline() ? { commissioningDeadline: this.deadline() } : {}),
    };
    if (this.editing()) {
      await this.store.updateProject(details);
    } else {
      await this.store.createProject(details);
    }
    this.formOpen.set(false);
  }

  protected setStage(stage: ProjectStage): void {
    void this.store.updateProject({ stage });
  }

  protected async remove(): Promise<void> {
    const project = this.store.activeProject();
    if (project) {
      await this.store.deleteProject(project.id);
    }
    this.confirmDelete.set(false);
  }

  protected async reset(): Promise<void> {
    await this.store.resetToDefaults();
    this.confirmReset.set(false);
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
