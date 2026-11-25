import '@angular/compiler';
import { Injector } from '@angular/core';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONTEXT,
  DEFAULT_GREENHOUSE,
  defaultHeatLoss,
  type GreenhouseProject,
  SAMPLE_PROJECTS,
} from '@ah/products/serracalc/domain';
import { SerraDbService } from '../services/serra-db.service';
import { SerraStore } from './serra.store';

function project(id: string): GreenhouseProject {
  return {
    id,
    title: `House ${id}`,
    site: 'Block A',
    climateId: 'gabes',
    crop: 'pepper',
    currency: 'TND',
    greenhouse: { ...DEFAULT_GREENHOUSE, spans: 4 },
    calculations: [],
    createdAt: '2026-11-24T08:00:00.000Z',
    updatedAt: '2026-11-24T08:00:00.000Z',
  };
}

function setup(initial: GreenhouseProject[] = [project('p1')]) {
  const saved = new Map(initial.map((p) => [p.id, structuredClone(p)]));
  const db = {
    lastProjectId: initial[0]?.id ?? null,
    getAllProjects: async () => [...saved.values()],
    saveProject: async (p: GreenhouseProject) => {
      saved.set(p.id, structuredClone(p));
    },
    deleteProject: async (id: string) => {
      saved.delete(id);
    },
    seedSamples: async () => {
      for (const s of SAMPLE_PROJECTS) saved.set(s.id, structuredClone(s));
    },
  };
  const store = Injector.create({
    providers: [{ provide: SerraDbService, useValue: db }, SerraStore],
  }).get(SerraStore);
  return { store, saved };
}

describe('SerraStore', () => {
  it('loads projects and gives calculators the active one', async () => {
    const { store } = setup();
    await store.loadProjects();
    expect(store.activeProject()?.id).toBe('p1');
    expect(store.context().climateId).toBe('gabes');
    expect(store.context().crop).toBe('pepper');
    expect(store.context().greenhouse.spans).toBe(4);
  });

  it('falls back to the example house with no project', async () => {
    const { store } = setup([]);
    await store.loadProjects();
    expect(store.activeProject()).toBeNull();
    expect(store.context()).toEqual(DEFAULT_CONTEXT);
  });

  it('saves a result, then updates it in place', async () => {
    const { store, saved } = setup();
    await store.loadProjects();
    const inputs = defaultHeatLoss(store.context());
    const id = await store.saveCalculation({
      kind: 'heatPeak',
      label: 'Peak',
      inputs,
    });
    expect(store.calculations()).toHaveLength(1);
    await store.saveCalculation({
      id,
      kind: 'heatPeak',
      label: 'Peak, colder night',
      inputs: { ...inputs, outsideDesignC: -2 },
    });
    expect(store.calculations()).toHaveLength(1);
    const stored = saved.get('p1')?.calculations[0];
    expect(stored?.label).toBe('Peak, colder night');
    expect(
      stored?.kind === 'heatPeak' ? stored.inputs.outsideDesignC : null,
    ).toBe(-2);
  });

  it('renames and deletes saved results', async () => {
    const { store } = setup();
    await store.loadProjects();
    const id = await store.saveCalculation({
      kind: 'heatPeak',
      label: 'Peak',
      inputs: defaultHeatLoss(store.context()),
    });
    await store.renameCalculation(id, 'Design night');
    expect(store.calculations()[0].label).toBe('Design night');
    await store.deleteCalculation(id);
    expect(store.calculations()).toHaveLength(0);
  });

  it('creates a project and makes it active', async () => {
    const { store, saved } = setup();
    await store.loadProjects();
    const created = await store.createProject({
      title: 'New house',
      site: '',
      climateId: 'tozeur',
      crop: 'melon',
      currency: 'EUR',
      greenhouse: DEFAULT_GREENHOUSE,
    });
    expect(store.activeProject()?.id).toBe(created.id);
    expect(saved.has(created.id)).toBe(true);
    expect(store.context().climateId).toBe('tozeur');
  });

  it('adds the samples beside the user’s projects', async () => {
    const { store } = setup();
    await store.loadProjects();
    await store.loadSamples();
    expect(store.projects()).toHaveLength(1 + SAMPLE_PROJECTS.length);
    expect(store.hasSamples()).toBe(true);
    expect(store.activeProject()?.id).toBe(SAMPLE_PROJECTS[0].id);
  });
});
