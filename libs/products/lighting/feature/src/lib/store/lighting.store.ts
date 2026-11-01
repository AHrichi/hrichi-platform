import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  type HeightMeasurement,
  type MilestoneItem,
  type PoleItem,
  type ProjectItem,
  SAMPLE_PROJECTS,
  type SavedCalculation,
} from '@ah/products/lighting/domain';
import { LightingDbService } from '../services/lighting-db.service';

export type PoleFilter = 'all' | 'solar' | 'grid';

export interface LightingState {
  projects: ProjectItem[];
  activeProjectId: string | null;
  poleFilter: PoleFilter;
  /** Sunlight mode: maximum contrast for reading the screen outdoors. */
  isHighContrast: boolean;
  isLoading: boolean;
  selectedPoleId: string | null;
}

const initialState: LightingState = {
  projects: [],
  activeProjectId: null,
  poleFilter: 'all',
  isHighContrast: false,
  isLoading: false,
  selectedPoleId: null,
};

export function isSolarPole(pole: PoleItem): boolean {
  return pole.type.startsWith('solar');
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const LightingStore = signalStore(
  { providedIn: 'root' },
  withState<LightingState>(initialState),
  withComputed((store) => {
    const activeProject = computed<ProjectItem | null>(() => {
      const projects = store.projects();
      return (
        projects.find((p) => p.id === store.activeProjectId()) ??
        projects[0] ??
        null
      );
    });

    const filteredPoles = computed<PoleItem[]>(() => {
      const poles = activeProject()?.poles ?? [];
      switch (store.poleFilter()) {
        case 'solar':
          return poles.filter(isSolarPole);
        case 'grid':
          return poles.filter((p) => !isSolarPole(p));
        default:
          return poles;
      }
    });

    const stats = computed(() => {
      const poles = activeProject()?.poles ?? [];
      let solarPoles = 0;
      let activePoles = 0;
      let erectedPoles = 0;
      let totalWatts = 0;
      let concrete = 0;
      for (const pole of poles) {
        if (isSolarPole(pole)) solarPoles++;
        if (pole.status === 'active') activePoles++;
        if (pole.status === 'erected' || pole.status === 'active')
          erectedPoles++;
        totalWatts += pole.luminaireWattage;
        concrete +=
          (pole.foundationWidthMeters || 0.8) ** 2 *
          (pole.foundationDepthMeters || 1.2);
      }
      return {
        totalPoles: poles.length,
        solarPoles,
        gridPoles: poles.length - solarPoles,
        activePoles,
        erectedPoles,
        totalWatts,
        totalConcreteVolumeM3: Math.round(concrete * 100) / 100,
        completionPct: poles.length
          ? Math.round((activePoles / poles.length) * 100)
          : 0,
      };
    });

    const selectedPole = computed<PoleItem | null>(
      () =>
        activeProject()?.poles.find((p) => p.id === store.selectedPoleId()) ??
        null,
    );

    return {
      activeProject,
      filteredPoles,
      stats,
      selectedPole,
      calculations: computed(() => activeProject()?.calculations ?? []),
      measurements: computed(() => activeProject()?.measurements ?? []),
    };
  }),
  withMethods((store) => {
    const db = inject(LightingDbService);

    /** Saves a changed project, then shows it; IndexedDB is the source of truth. */
    async function commit(project: ProjectItem): Promise<void> {
      const saved = { ...project, updatedAt: new Date().toISOString() };
      await db.saveProject(saved);
      patchState(store, {
        projects: store.projects().map((p) => (p.id === saved.id ? saved : p)),
      });
    }

    /** Applies a change to the active project, if there is one. */
    async function edit(
      change: (project: ProjectItem) => ProjectItem,
    ): Promise<void> {
      const project = store.activeProject();
      if (project) {
        await commit(change(project));
      }
    }

    return {
      async loadProjects(): Promise<void> {
        patchState(store, { isLoading: true });
        try {
          const projects = await db.getAllProjects();
          const wanted = store.activeProjectId() ?? db.lastProjectId;
          patchState(store, {
            projects,
            activeProjectId: projects.some((p) => p.id === wanted)
              ? wanted
              : (projects[0]?.id ?? null),
            isLoading: false,
          });
        } catch {
          // Private browsing can refuse IndexedDB: show the samples read-only.
          patchState(store, {
            projects: SAMPLE_PROJECTS,
            activeProjectId: SAMPLE_PROJECTS[0].id,
            isLoading: false,
          });
        }
      },

      setActiveProject(id: string): void {
        db.lastProjectId = id;
        patchState(store, { activeProjectId: id, selectedPoleId: null });
      },

      setPoleFilter(poleFilter: PoleFilter): void {
        patchState(store, { poleFilter });
      },

      toggleHighContrast(): void {
        patchState(store, { isHighContrast: !store.isHighContrast() });
      },

      selectPole(id: string | null): void {
        patchState(store, { selectedPoleId: id });
      },

      async createProject(
        details: Pick<
          ProjectItem,
          'title' | 'clientOrMunicipality' | 'locationName' | 'lightingType'
        > &
          Partial<ProjectItem>,
      ): Promise<void> {
        const now = new Date().toISOString();
        const project: ProjectItem = {
          id: newId('proj'),
          gpsCenter: { lat: 36.8065, lng: 10.1815 },
          stage: 'survey',
          startDate: now.slice(0, 10),
          commissioningDeadline: now.slice(0, 10),
          roadWidthMeters: 7,
          roadClass: 'M3',
          windZone: 2,
          defaultSoil: 'compact_gravel',
          engineerName: '',
          poles: [],
          milestones: [],
          calculations: [],
          measurements: [],
          ...details,
          createdAt: now,
          updatedAt: now,
        };
        await db.saveProject(project);
        db.lastProjectId = project.id;
        patchState(store, {
          projects: [...store.projects(), project],
          activeProjectId: project.id,
        });
      },

      updateProject(details: Partial<ProjectItem>): Promise<void> {
        return edit((project) => ({ ...project, ...details, id: project.id }));
      },

      async deleteProject(id: string): Promise<void> {
        await db.deleteProject(id);
        const projects = store.projects().filter((p) => p.id !== id);
        patchState(store, {
          projects,
          activeProjectId: projects[0]?.id ?? null,
          selectedPoleId: null,
        });
      },

      async addPole(details: Partial<PoleItem>): Promise<PoleItem | null> {
        const project = store.activeProject();
        if (!project) {
          return null;
        }
        const pole: PoleItem = {
          code: `M-${String(project.poles.length + 1).padStart(2, '0')}`,
          type:
            project.lightingType === 'grid_only'
              ? 'conventional_ac'
              : 'solar_autonomous',
          status: 'planned',
          gps: { ...project.gpsCenter },
          heightMeters: 8,
          armLengthMeters: 1.5,
          tiltAngleDegrees: 5,
          material: 'galvanized_steel',
          luminaireModel: 'LED 50 W',
          luminaireWattage: 50,
          luminaireLumens: 7500,
          colorTemperatureK: 4000,
          foundationWidthMeters: 0.8,
          foundationDepthMeters: 1.3,
          soilType: project.defaultSoil,
          ...details,
          id: newId('pole'),
          projectId: project.id,
        };
        await commit({ ...project, poles: [...project.poles, pole] });
        patchState(store, { selectedPoleId: pole.id });
        return pole;
      },

      updatePole(pole: PoleItem): Promise<void> {
        return edit((project) => ({
          ...project,
          poles: project.poles.map((p) => (p.id === pole.id ? pole : p)),
        }));
      },

      async removePole(poleId: string): Promise<void> {
        await edit((project) => ({
          ...project,
          poles: project.poles.filter((p) => p.id !== poleId),
        }));
        if (store.selectedPoleId() === poleId) {
          patchState(store, { selectedPoleId: null });
        }
      },

      addMilestone(
        details: Pick<MilestoneItem, 'title' | 'date'> & Partial<MilestoneItem>,
      ): Promise<void> {
        return edit((project) => ({
          ...project,
          milestones: [
            ...project.milestones,
            {
              category: 'inspection',
              completed: false,
              ...details,
              id: newId('m'),
              projectId: project.id,
            },
          ],
        }));
      },

      updateMilestone(milestone: MilestoneItem): Promise<void> {
        return edit((project) => ({
          ...project,
          milestones: project.milestones.map((m) =>
            m.id === milestone.id ? milestone : m,
          ),
        }));
      },

      toggleMilestone(id: string): Promise<void> {
        return edit((project) => ({
          ...project,
          milestones: project.milestones.map((m) =>
            m.id === id ? { ...m, completed: !m.completed } : m,
          ),
        }));
      },

      deleteMilestone(id: string): Promise<void> {
        return edit((project) => ({
          ...project,
          milestones: project.milestones.filter((m) => m.id !== id),
        }));
      },

      /** Saves new inputs, or replaces the saved calculation with the same id. */
      async saveCalculation(
        calculation: Omit<SavedCalculation, 'id' | 'savedAt'> & { id?: string },
      ): Promise<string> {
        const saved = {
          ...calculation,
          id: calculation.id ?? newId('calc'),
          savedAt: new Date().toISOString(),
        } as SavedCalculation;
        await edit((project) => {
          const list = project.calculations ?? [];
          return {
            ...project,
            calculations: list.some((c) => c.id === saved.id)
              ? list.map((c) => (c.id === saved.id ? saved : c))
              : [saved, ...list],
          };
        });
        return saved.id;
      },

      deleteCalculation(id: string): Promise<void> {
        return edit((project) => ({
          ...project,
          calculations: (project.calculations ?? []).filter((c) => c.id !== id),
        }));
      },

      /** Saves a new measurement, or replaces the one with the same id. */
      async saveMeasurement(
        measurement: Omit<HeightMeasurement, 'id' | 'savedAt'> & {
          id?: string;
        },
      ): Promise<string> {
        const saved: HeightMeasurement = {
          ...measurement,
          id: measurement.id ?? newId('meas'),
          savedAt: new Date().toISOString(),
        };
        await edit((project) => {
          const list = project.measurements ?? [];
          return {
            ...project,
            measurements: list.some((m) => m.id === saved.id)
              ? list.map((m) => (m.id === saved.id ? saved : m))
              : [saved, ...list],
          };
        });
        return saved.id;
      },

      deleteMeasurement(id: string): Promise<void> {
        return edit((project) => ({
          ...project,
          measurements: (project.measurements ?? []).filter((m) => m.id !== id),
        }));
      },

      async resetToDefaults(): Promise<void> {
        const projects = await db.seedDefaults();
        patchState(store, {
          projects,
          activeProjectId: projects[0]?.id ?? null,
          selectedPoleId: null,
        });
      },
    };
  }),
);
