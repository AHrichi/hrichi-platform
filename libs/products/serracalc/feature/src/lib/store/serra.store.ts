import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  type CalcContext,
  DEFAULT_CONTEXT,
  DEFAULT_GREENHOUSE,
  type GreenhouseProject,
  SAMPLE_PROJECTS,
  type SavedCalculation,
} from '@ah/products/serracalc/domain';
import { SerraDbService } from '../services/serra-db.service';

export interface SerraState {
  projects: GreenhouseProject[];
  activeProjectId: string | null;
  /** Sunlight mode: maximum contrast for reading the screen outdoors. */
  isHighContrast: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: SerraState = {
  projects: [],
  activeProjectId: null,
  isHighContrast: false,
  isLoading: true,
  error: null,
};

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** What a new project or a new save needs from the caller. */
export type NewProject = Pick<
  GreenhouseProject,
  'title' | 'site' | 'climateId' | 'crop' | 'currency' | 'greenhouse'
>;

export type NewCalculation = Omit<SavedCalculation, 'id' | 'savedAt'> & {
  id?: string;
};

export const SerraStore = signalStore(
  { providedIn: 'root' },
  withState<SerraState>(initialState),
  withComputed((store) => {
    const activeProject = computed<GreenhouseProject | null>(() => {
      const projects = store.projects();
      return (
        projects.find((p) => p.id === store.activeProjectId()) ??
        projects[0] ??
        null
      );
    });
    return {
      activeProject,
      calculations: computed(() => activeProject()?.calculations ?? []),
      /** Where calculators start: the active project, or the example house. */
      context: computed<CalcContext>(() => {
        const project = activeProject();
        return project
          ? {
              greenhouse: project.greenhouse,
              climateId: project.climateId,
              crop: project.crop,
              currency: project.currency,
            }
          : DEFAULT_CONTEXT;
      }),
      hasSamples: computed(() =>
        SAMPLE_PROJECTS.every((s) =>
          store.projects().some((p) => p.id === s.id),
        ),
      ),
    };
  }),
  withMethods((store) => {
    const db = inject(SerraDbService);
    let queue: Promise<void> = Promise.resolve();

    /** Applies a change to the active project, one at a time, and saves it. */
    function edit(
      change: (project: GreenhouseProject) => GreenhouseProject,
    ): Promise<void> {
      const task = async () => {
        try {
          const project = store.activeProject();
          if (!project) return;
          const saved = {
            ...change(project),
            id: project.id,
            updatedAt: new Date().toISOString(),
          };
          await db.saveProject(saved);
          patchState(store, {
            projects: store
              .projects()
              .map((p) => (p.id === saved.id ? saved : p)),
            error: null,
          });
        } catch (err) {
          patchState(store, {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      };
      queue = queue.then(task, task);
      return queue;
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
          // Private browsing can refuse IndexedDB: start empty, in memory.
          patchState(store, { projects: [], isLoading: false });
        }
      },

      setActiveProject(id: string): void {
        db.lastProjectId = id;
        patchState(store, { activeProjectId: id });
      },

      toggleHighContrast(): void {
        patchState(store, { isHighContrast: !store.isHighContrast() });
      },

      async createProject(details: NewProject): Promise<GreenhouseProject> {
        const now = new Date().toISOString();
        const project: GreenhouseProject = {
          ...details,
          greenhouse: { ...DEFAULT_GREENHOUSE, ...details.greenhouse },
          id: newId('gh'),
          calculations: [],
          createdAt: now,
          updatedAt: now,
        };
        await db.saveProject(project);
        db.lastProjectId = project.id;
        patchState(store, {
          projects: [...store.projects(), project],
          activeProjectId: project.id,
        });
        return project;
      },

      updateProject(details: Partial<GreenhouseProject>): Promise<void> {
        return edit((project) => ({ ...project, ...details }));
      },

      async deleteProject(id: string): Promise<void> {
        await db.deleteProject(id);
        const projects = store.projects().filter((p) => p.id !== id);
        patchState(store, {
          projects,
          activeProjectId: projects[0]?.id ?? null,
        });
      },

      /** Saves new inputs, or replaces the saved result with the same id. */
      async saveCalculation(calculation: NewCalculation): Promise<string> {
        const saved = {
          ...calculation,
          id: calculation.id ?? newId('calc'),
          savedAt: new Date().toISOString(),
        } as SavedCalculation;
        await edit((project) => ({
          ...project,
          calculations: project.calculations.some((c) => c.id === saved.id)
            ? project.calculations.map((c) => (c.id === saved.id ? saved : c))
            : [saved, ...project.calculations],
        }));
        return saved.id;
      },

      renameCalculation(id: string, label: string): Promise<void> {
        return edit((project) => ({
          ...project,
          calculations: project.calculations.map((c) =>
            c.id === id ? { ...c, label } : c,
          ),
        }));
      },

      deleteCalculation(id: string): Promise<void> {
        return edit((project) => ({
          ...project,
          calculations: project.calculations.filter((c) => c.id !== id),
        }));
      },

      /** Adds the sample projects (back as they were); the user's stay. */
      async loadSamples(): Promise<void> {
        await db.seedSamples();
        const projects = await db.getAllProjects();
        const first = SAMPLE_PROJECTS[0].id;
        db.lastProjectId = first;
        patchState(store, {
          projects: projects.length ? projects : [...SAMPLE_PROJECTS],
          activeProjectId: first,
        });
      },
    };
  }),
  withHooks({
    onInit(store) {
      void store.loadProjects();
    },
  }),
);
