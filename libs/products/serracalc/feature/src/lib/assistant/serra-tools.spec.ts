import '@angular/compiler';
import { DOCUMENT } from '@angular/common';
import { Injector } from '@angular/core';
import type { ToolExecutor, ToolOutcome } from '@ah/platform/assistant';
import {
  DEFAULT_GREENHOUSE,
  defaultHeatLoss,
  DEFAULT_CONTEXT,
  type GreenhouseProject,
  SERRA_ASSISTANT,
} from '@ah/products/serracalc/domain';
import { PreferencesStore, type ThemePreference } from '@ah/shared/state';
import { describe, expect, it } from 'vitest';
import { SerraI18n } from '../i18n/serra-i18n';
import { SerraDbService } from '../services/serra-db.service';
import { SerraStore } from '../store/serra.store';
import { serraTools } from './serra-tools';

function project(id: string, extra: Partial<GreenhouseProject> = {}) {
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
    ...extra,
  } as GreenhouseProject;
}

async function setup(initial: GreenhouseProject[] = [project('p1')]) {
  const saved = new Map(initial.map((p) => [p.id, structuredClone(p)]));
  const db = {
    lastProjectId: initial[0]?.id ?? null,
    sunlight: false,
    getAllProjects: async () => [...saved.values()],
    getAllSites: async () => [],
    saveProject: async (p: GreenhouseProject) => {
      saved.set(p.id, structuredClone(p));
    },
    deleteProject: async (id: string) => {
      saved.delete(id);
    },
  };
  const root = {
    setAttribute: () => undefined,
    removeAttribute: () => undefined,
  };
  const injector = Injector.create({
    providers: [
      { provide: SerraDbService, useValue: db },
      {
        provide: DOCUMENT,
        useValue: { defaultView: null, documentElement: root },
      },
      PreferencesStore,
      SerraI18n,
      SerraStore,
    ],
  });
  const store = injector.get(SerraStore);
  await store.loadProjects();
  const i18n = injector.get(SerraI18n);
  i18n.setLanguage('en');
  const opened: { screen: string; query?: Record<string, string> }[] = [];
  let theme: ThemePreference = 'system';
  let tours = 0;
  const tools = serraTools({
    store,
    i18n,
    theme: Object.assign(() => theme, {
      set: (value: ThemePreference) => void (theme = value),
    }),
    open: async (screen, query) => opened.push({ screen, query }),
    startTour: () => tours++,
  }) as Record<string, ToolExecutor<unknown>>;
  return {
    tools,
    store,
    i18n,
    saved,
    opened,
    theme: () => theme,
    tours: () => tours,
  };
}

const result = (outcome: ToolOutcome) => {
  if (!outcome.ok) throw new Error(outcome.error);
  return outcome.result as Record<string, unknown>;
};

describe('SerraCalc’s assistant tools', () => {
  it('has a way to run every tool its profile offers', async () => {
    const { tools } = await setup();
    expect(Object.keys(tools).sort()).toEqual(
      SERRA_ASSISTANT.tools.map((t) => t.name).sort(),
    );
    for (const tool of SERRA_ASSISTANT.tools) {
      const changes = tool.effect === 'write' || tool.effect === 'destructive';
      expect(Boolean(tools[tool.name].describe), tool.name).toBe(changes);
      expect(Boolean(tools[tool.name].check), tool.name).toBe(changes);
    }
  });

  it('creates a project from what was asked, the rest by default', async () => {
    const { tools, store } = await setup([]);
    const args = {
      title: 'East block',
      crop: 'tomato',
      climateId: 'monastir',
      house: { spans: 6, cover: 'pe_double' },
    };
    expect(tools['create_project'].check?.(args)).toBeNull();
    const card = tools['create_project'].describe?.(args);
    expect(card?.heading).toBe('Create the project “East block”');
    expect(card?.lines).toEqual(
      expect.arrayContaining([
        'Climate: Monastir',
        'Crop: Tomato',
        'House: Multi-span, pitched roofs, Double inflated film (PE), Clear energy screen',
        '6 × 9.6 m spans, 60 m long, gutter 4.5 m, ridge 6.3 m',
      ]),
    );
    const created = result(await tools['create_project'].run(args));
    expect(store.activeProject()).toMatchObject({
      id: created['id'],
      title: 'East block',
      crop: 'tomato',
      currency: DEFAULT_CONTEXT.currency,
      greenhouse: { ...DEFAULT_GREENHOUSE, spans: 6, cover: 'pe_double' },
    });
  });

  it('refuses a house the Greenhouse screen couldn’t hold', async () => {
    const { tools } = await setup();
    expect(
      tools['create_project'].check?.({ title: 'X', house: { spans: 500 } }),
    ).toBe('spans: 500 is outside 1–60');
    expect(
      tools['update_project'].check?.({
        projectId: 'p1',
        house: { ridgeHeightM: 2, gutterHeightM: 4 },
      }),
    ).toBe('ridgeHeightM must be at least gutterHeightM');
    expect(tools['update_project'].check?.({ projectId: 'nope' })).toBe(
      'No project "nope"',
    );
  });

  it('changes only the fields given', async () => {
    const { tools, store, saved } = await setup();
    const args = { projectId: 'p1', title: 'North', house: { lengthM: 80 } };
    expect(tools['update_project'].describe?.(args).lines).toEqual([
      'Project name: North',
      expect.stringContaining('80 m long'),
    ]);
    result(await tools['update_project'].run(args));
    expect(store.projects()[0]).toMatchObject({
      title: 'North',
      site: 'Block A',
      greenhouse: { spans: 4, lengthM: 80 },
    });
    expect(saved.get('p1')?.title).toBe('North');
  });

  it('reads a calculator’s inputs with units and ranges', async () => {
    const { tools } = await setup();
    const read = result(
      await tools['get_calculator'].run({ kind: 'heatPeak', projectId: 'p1' }),
    );
    expect(read['from']).toBe('project defaults');
    expect(read['inputs']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'insideC', unit: '°C' }),
      ]),
    );
  });

  it('previews figures without saving, and refuses values out of range', async () => {
    const { tools, store } = await setup();
    const preview = result(
      await tools['preview_calculation'].run({
        kind: 'heatPeak',
        inputs: [{ key: 'insideC', value: '18' }],
      }),
    );
    expect(preview['figures']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'designKw', unit: 'kW' }),
      ]),
    );
    expect(store.calculations()).toEqual([]);
    const outcome = await tools['preview_calculation'].run({
      kind: 'heatPeak',
      inputs: [{ key: 'insideC', value: '400' }],
    });
    expect(outcome).toMatchObject({
      ok: false,
      error: expect.stringContaining('insideC: 400 is outside'),
    });
  });

  it('saves a result, then opens it in its calculator', async () => {
    const { tools, store, opened } = await setup([
      project('p1'),
      project('p2', { title: 'South' }),
    ]);
    const args = {
      kind: 'heatPeak',
      label: 'Cold night',
      projectId: 'p2',
      inputs: [{ key: 'insideC', value: '20' }],
    };
    expect(tools['save_calculation'].check?.(args)).toBeNull();
    const card = tools['save_calculation'].describe?.(args);
    expect(card?.heading).toBe('Save “Cold night” (Peak heating load)');
    expect(card?.lines?.[0]).toBe('Project: South');
    expect(card?.lines?.slice(-1)[0]).toBe('Every other input stays as it is.');

    const done = result(await tools['save_calculation'].run(args));
    expect(store.activeProject()?.id).toBe('p2');
    expect(store.calculations()[0]).toMatchObject({
      id: done['id'],
      kind: 'heatPeak',
      label: 'Cold night',
      inputs: { insideC: 20 },
    });
    expect(opened).toEqual([
      { screen: 'heating', query: { tab: 'peak', edit: done['id'] } },
    ]);
  });

  it('only replaces a result of the same kind', async () => {
    const inputs = defaultHeatLoss(DEFAULT_CONTEXT);
    const { tools } = await setup([
      project('p1', {
        calculations: [
          {
            id: 'c1',
            kind: 'heatPeak',
            label: 'Base',
            savedAt: '2026-11-24T08:00:00.000Z',
            inputs,
          },
        ],
      }),
    ]);
    expect(
      tools['save_calculation'].check?.({
        kind: 'fog',
        label: 'x',
        projectId: 'p1',
        inputs: [],
        replaceResultId: 'c1',
      }),
    ).toBe('No fog result "c1"');
    expect(
      tools['save_calculation'].describe?.({
        kind: 'heatPeak',
        label: 'Base',
        projectId: 'p1',
        inputs: [],
        replaceResultId: 'c1',
      }).heading,
    ).toBe('Update “Base” (Peak heating load)');
  });

  it('needs a project before saving', async () => {
    const { tools } = await setup([]);
    expect(
      tools['save_calculation'].check?.({
        kind: 'heatPeak',
        label: 'x',
        inputs: [],
      }),
    ).toBe('No project yet: create one first');
  });

  it('renames and deletes results, and deletes projects', async () => {
    const { tools, store } = await setup([
      project('p1', {
        calculations: [
          {
            id: 'c1',
            kind: 'heatPeak',
            label: 'Base',
            savedAt: '2026-11-24T08:00:00.000Z',
            inputs: defaultHeatLoss(DEFAULT_CONTEXT),
          },
        ],
      }),
      project('p2'),
    ]);
    expect(
      tools['rename_result'].check?.({
        projectId: 'p1',
        resultId: 'zz',
        label: 'x',
      }),
    ).toBe('No result "zz"');
    result(
      await tools['rename_result'].run({
        projectId: 'p1',
        resultId: 'c1',
        label: 'Winter',
      }),
    );
    expect(store.calculations()[0].label).toBe('Winter');
    expect(
      tools['delete_result'].describe?.({ projectId: 'p1', resultId: 'c1' }),
    ).toEqual({
      heading: 'Delete “Winter” from “House p1”',
      lines: ['This can’t be undone.'],
    });
    result(
      await tools['delete_result'].run({ projectId: 'p1', resultId: 'c1' }),
    );
    expect(store.calculations()).toEqual([]);
    result(await tools['delete_project'].run({ projectId: 'p1' }));
    expect(store.projects().map((p) => p.id)).toEqual(['p2']);
  });

  it('reads a project with its results’ figures', async () => {
    const { tools } = await setup([
      project('p1', {
        calculations: [
          {
            id: 'c1',
            kind: 'heatPeak',
            label: 'Base',
            savedAt: '2026-11-24T08:00:00.000Z',
            inputs: defaultHeatLoss(DEFAULT_CONTEXT),
          },
        ],
      }),
    ]);
    const read = result(await tools['get_project'].run({ projectId: 'p1' }));
    expect(read).toMatchObject({ title: 'House p1', climate: 'Gabès' });
    expect(read['results']).toEqual([
      expect.objectContaining({
        id: 'c1',
        figures: expect.arrayContaining([
          expect.objectContaining({ id: 'designKw' }),
        ]),
      }),
    ]);
  });

  it('changes settings with a note and an Undo', async () => {
    const state = await setup();
    const sunlight = await state.tools['set_sunlight'].run({ on: true });
    expect(sunlight).toMatchObject({ note: 'Sunlight mode is on.' });
    expect(state.store.isHighContrast()).toBe(true);
    await (sunlight.ok && sunlight.undo?.());
    expect(state.store.isHighContrast()).toBe(false);

    const language = await state.tools['set_language'].run({ language: 'fr' });
    expect(language).toMatchObject({ note: 'SerraCalc est en français.' });
    await (language.ok && language.undo?.());
    expect(state.i18n.lang()).toBe('en');

    const theme = await state.tools['set_theme'].run({ theme: 'dark' });
    expect(state.theme()).toBe('dark');
    await (theme.ok && theme.undo?.());
    expect(state.theme()).toBe('system');
  });

  it('moves around: screens, the active project, the tour', async () => {
    const state = await setup([project('p1'), project('p2')]);
    expect(
      await state.tools['open_screen'].run({ screen: 'water', tab: 'rain' }),
    ).toMatchObject({ note: 'Opened Water.' });
    expect(state.opened).toEqual([{ screen: 'water', query: { tab: 'rain' } }]);
    const active = await state.tools['set_active_project'].run({
      projectId: 'p2',
    });
    expect(state.store.activeProject()?.id).toBe('p2');
    await (active.ok && active.undo?.());
    expect(state.store.activeProject()?.id).toBe('p1');
    await state.tools['start_tour'].run({});
    expect(state.tours()).toBe(1);
  });
});
