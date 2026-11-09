import '@angular/compiler';
import { Injector } from '@angular/core';
import { describe, expect, it } from 'vitest';
import type { ProjectItem } from '@ah/products/lighting/domain';
import { LightingDbService } from '../services/lighting-db.service';
import { LightingStore } from './lighting.store';

function sampleProject(id: string): ProjectItem {
  return {
    id,
    title: `Project ${id}`,
    clientOrMunicipality: 'Municipality',
    locationName: 'Main Street',
    lightingType: 'solar_autonomous',
    stage: 'survey',
    startDate: '2026-11-01',
    commissioningDeadline: '2026-12-01',
    roadWidthMeters: 7,
    roadClass: 'M3',
    windZone: 2,
    defaultSoil: 'compact_gravel',
    engineerName: 'Engineer',
    gpsCenter: { lat: 36.8, lng: 10.2 },
    poles: [
      {
        id: 'pole-1',
        projectId: id,
        code: 'M-01',
        type: 'solar_autonomous',
        status: 'planned',
        gps: { lat: 36.8, lng: 10.2 },
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
        soilType: 'compact_gravel',
      },
    ],
    milestones: [],
    calculations: [],
    measurements: [],
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
  };
}

function setupStore(initialProjects: ProjectItem[] = [sampleProject('p1')]) {
  const savedProjects = new Map<string, ProjectItem>(
    initialProjects.map((p) => [p.id, { ...p }]),
  );

  let saveDelay = 0;
  let shouldFail = false;

  const mockDb = {
    lastProjectId: initialProjects[0]?.id ?? null,
    getAllProjects: async () => Array.from(savedProjects.values()),
    getMaterials: async () => [],
    saveProject: async (project: ProjectItem) => {
      if (shouldFail) {
        throw new Error('IndexedDB disk quota exceeded');
      }
      if (saveDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, saveDelay));
      }
      savedProjects.set(project.id, { ...project });
    },
    deleteProject: async (id: string) => {
      savedProjects.delete(id);
    },
    saveMaterial: async () => undefined,
    deleteMaterial: async () => undefined,
    seedDefaults: async () => initialProjects,
  };

  const store = Injector.create({
    providers: [
      { provide: LightingDbService, useValue: mockDb },
      LightingStore,
    ],
  }).get(LightingStore);

  return {
    store,
    savedProjects,
    setSaveDelay: (ms: number) => {
      saveDelay = ms;
    },
    setShouldFail: (fail: boolean) => {
      shouldFail = fail;
    },
  };
}

describe('LightingStore', () => {
  it('loads projects on init and sets the active project', async () => {
    const { store } = setupStore();
    await store.loadProjects();

    expect(store.projects().length).toBe(1);
    expect(store.activeProjectId()).toBe('p1');
    expect(store.activeProject()?.title).toBe('Project p1');
    expect(store.error()).toBeNull();
  });

  it('serializes concurrent edit() calls so fast marker drags never lose updates', async () => {
    const { store, setSaveDelay } = setupStore();
    await store.loadProjects();

    // Introduce a delay to simulate IndexedDB write latency
    setSaveDelay(20);

    const active = store.activeProject();
    expect(active).toBeDefined();
    const pole = active?.poles[0];
    expect(pole).toBeDefined();
    if (!pole) throw new Error('Pole not found');

    // Fire 3 concurrent edits rapidly (e.g. marker drag events)
    const p1 = store.updatePole({ ...pole, heightMeters: 9 });
    const p2 = store.updatePole({ ...pole, heightMeters: 10 });
    const p3 = store.updatePole({ ...pole, heightMeters: 11 });

    await Promise.all([p1, p2, p3]);

    // The final state must have heightMeters = 11, and not be overwritten by an earlier stale read
    const updatedProject = store.activeProject();
    expect(updatedProject?.poles[0]?.heightMeters).toBe(11);
  });

  it('records error state and does not crash when database write fails', async () => {
    const { store, setShouldFail } = setupStore();
    await store.loadProjects();

    setShouldFail(true);
    await store.updateProject({ roadWidthMeters: 12 });

    expect(store.error()).toBe('IndexedDB disk quota exceeded');
  });

  it('saves and deletes calculation results', async () => {
    const { store } = setupStore();
    await store.loadProjects();

    const calcId = await store.saveCalculation({
      kind: 'spacing',
      label: 'Spacing M3',
      inputs: {
        mountingHeightMeters: 8,
        spacingMeters: 28,
        roadWidthMeters: 7,
        roadClass: 'M3',
        luminaireLumens: 7500,
        maintenanceFactor: 0.8,
      },
    });

    expect(store.calculations().length).toBe(1);
    expect(store.calculations()[0].id).toBe(calcId);

    await store.deleteCalculation(calcId);
    expect(store.calculations().length).toBe(0);
  });
});
