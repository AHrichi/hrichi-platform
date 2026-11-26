import type { ToolExecutor, ToolOutcome } from '@ah/platform/assistant';
import {
  type CalcContext,
  type CalcKind,
  CLIMATES,
  type Currency,
  DEFAULT_CONTEXT,
  type GreenhouseProject,
  type GreenhouseSpec,
  OPENS_IN,
  type SavedCalculation,
  type SerraScreen,
  summarizeSaved,
} from '@ah/products/serracalc/domain';
import type { SiteLanguage, ThemePreference } from '@ah/shared/state';
import type { SerraI18n } from '../i18n/serra-i18n';
import { GREENHOUSE_FIELDS } from '../screens/fields';
import { newId, type SerraStore } from '../store/serra.store';
import { describeInputs, KIND_INPUTS, mergeInputs } from './kind-inputs';

/** What the tools act on: the app's store and words, and how it moves. */
export interface SerraToolsDeps {
  readonly store: InstanceType<typeof SerraStore>;
  readonly i18n: SerraI18n;
  readonly theme: {
    (): ThemePreference;
    set(theme: ThemePreference): void;
  };
  /** Opens a screen of the app (and a tab, or a saved result to edit). */
  open(screen: SerraScreen, query?: Record<string, string>): Promise<unknown>;
  startTour(): void;
}

type House = Partial<
  Pick<
    GreenhouseSpec,
    | 'shape'
    | 'spans'
    | 'spanWidthM'
    | 'lengthM'
    | 'gutterHeightM'
    | 'ridgeHeightM'
    | 'cover'
    | 'screen'
  >
>;

interface ProjectFields {
  title?: string;
  site?: string;
  climateId?: string;
  crop?: GreenhouseProject['crop'];
  currency?: Currency;
  house?: House;
}

type Inputs = readonly { key: string; value: string }[];

interface SaveArgs {
  kind: CalcKind;
  label: string;
  projectId?: string;
  inputs: Inputs;
  replaceResultId?: string;
}

const ok = (result: unknown, note?: string): ToolOutcome => ({
  ok: true,
  result,
  note,
});
const fail = (error: string): ToolOutcome => ({ ok: false, error });

/** Keeps each executor's arguments typed. */
const tool = <A>(executor: ToolExecutor<A>) => executor;

const pick = (names: object, key: string): string =>
  (names as Record<string, string>)[key] ?? key;

/**
 * SerraCalc's tools, run in the app: read projects and calculators, move
 * around, change settings, and (after the reader's Apply) change data.
 * Every write checks first, so a card is only shown for a change that can
 * run; its words come from here, in the reader's language.
 */
export function serraTools(
  deps: SerraToolsDeps,
): Record<string, ToolExecutor<never>> {
  const { store, i18n } = deps;
  const t = () => i18n.t();

  const project = (id?: string): GreenhouseProject | null =>
    id
      ? (store.projects().find((p) => p.id === id) ?? null)
      : store.activeProject();
  const missing = (id: string) => `No project "${id}"`;
  const result = (p: GreenhouseProject, id: string) =>
    p.calculations.find((c) => c.id === id) ?? null;

  const contextOf = (p: GreenhouseProject | null): CalcContext =>
    p
      ? {
          greenhouse: p.greenhouse,
          climateId: p.climateId,
          crop: p.crop,
          currency: p.currency,
        }
      : DEFAULT_CONTEXT;

  /** A house's numbers must fit the Greenhouse screen's fields. */
  function houseProblem(base: GreenhouseSpec, house: House = {}) {
    for (const field of GREENHOUSE_FIELDS) {
      const value = (house as Record<string, unknown>)[field.key];
      if (
        typeof value === 'number' &&
        (value < field.min || value > field.max)
      ) {
        return `${field.key}: ${value} is outside ${field.min}–${field.max} ${field.unit}`.trim();
      }
    }
    const merged = { ...base, ...house };
    if (merged.ridgeHeightM < merged.gutterHeightM) {
      return 'ridgeHeightM must be at least gutterHeightM';
    }
    return null;
  }

  function figures(saved: SavedCalculation, currency: Currency) {
    try {
      const summary = summarizeSaved(saved);
      return {
        figures: summary.figures.map((f) => ({
          id: f.id,
          value: f.value === null ? null : Number(f.value.toFixed(f.digits)),
          unit: f.unit === 'money' ? currency : f.unit,
        })),
        findings: summary.notes.map((note) => i18n.note(note)),
      };
    } catch {
      return { figures: [], findings: [] };
    }
  }

  /** The inputs a save or preview would use, or why it can't. */
  function inputsFor(args: {
    kind: CalcKind;
    projectId?: string;
    inputs: Inputs;
    replaceResultId?: string;
  }) {
    const p = project(args.projectId);
    if (args.projectId && !p) return { problem: missing(args.projectId) };
    let base: object = KIND_INPUTS[args.kind].defaults(contextOf(p));
    if (args.replaceResultId) {
      const saved = p ? result(p, args.replaceResultId) : null;
      if (!saved || saved.kind !== args.kind) {
        return { problem: `No ${args.kind} result "${args.replaceResultId}"` };
      }
      base = saved.inputs;
    }
    const currency = contextOf(p).currency;
    const merged = mergeInputs(args.kind, base, args.inputs, currency);
    if (!merged.ok) return { problem: merged.problem };
    return { project: p, base, inputs: merged.inputs, currency };
  }

  function value(key: string, raw: unknown): string {
    if (typeof raw === 'boolean') return raw ? t().common.yes : t().common.no;
    if (typeof raw === 'number') return i18n.num(raw, 2);
    const text = String(raw);
    switch (key) {
      case 'fuel':
        return pick(t().fuels, text);
      case 'pipe':
        return pick(t().pipes, text);
      case 'cover':
        return pick(t().covers, text);
      case 'screen':
        return pick(t().screens, text);
      case 'crop':
        return pick(t().crops, text);
      case 'shape':
        return pick(t().shapes, text);
      case 'climateId':
        return CLIMATES.find((c) => c.id === text)?.name ?? text;
      default:
        return text;
    }
  }

  function houseLines(house: House, base: GreenhouseSpec): string[] {
    const copy = t();
    const lines: string[] = [];
    const named = (['shape', 'cover', 'screen'] as const)
      .filter((key) => house[key] !== undefined)
      .map((key) => value(key, house[key]));
    const sized = (
      [
        'spans',
        'spanWidthM',
        'lengthM',
        'gutterHeightM',
        'ridgeHeightM',
      ] as const
    ).some((key) => house[key] !== undefined);
    if (named.length)
      lines.push(`${copy.assistant.cards.house}: ${named.join(', ')}`);
    if (sized) {
      const g = { ...base, ...house };
      lines.push(
        copy.report.layout(
          i18n.num(g.spans, 0),
          i18n.num(g.spanWidthM, 1),
          i18n.num(g.lengthM, 0),
          i18n.num(g.gutterHeightM, 1),
          i18n.num(g.ridgeHeightM, 1),
        ),
      );
    }
    return lines;
  }

  function projectLines(fields: ProjectFields, base: GreenhouseSpec): string[] {
    const copy = t().projects;
    const lines: string[] = [];
    if (fields.title !== undefined) lines.push(`${copy.name}: ${fields.title}`);
    if (fields.site) lines.push(`${copy.site}: ${fields.site}`);
    if (fields.climateId) {
      lines.push(`${copy.climate}: ${value('climateId', fields.climateId)}`);
    }
    if (fields.crop) lines.push(`${copy.crop}: ${value('crop', fields.crop)}`);
    if (fields.currency) {
      lines.push(`${copy.currency}: ${pick(t().currencies, fields.currency)}`);
    }
    return [...lines, ...houseLines(fields.house ?? {}, base)];
  }

  function inputLines(
    kind: CalcKind,
    base: object,
    inputs: Record<string, unknown>,
    currency: string,
  ): string[] {
    const units = new Map(
      describeInputs(kind, inputs, currency).map((f) => [f.key, f.unit]),
    );
    const before = base as Record<string, unknown>;
    return Object.keys(inputs)
      .filter((key) => inputs[key] !== before[key])
      .map((key) => {
        const unit = units.get(key);
        const shown = value(key, inputs[key]);
        return `${pick(t().fields, key)}: ${unit ? `${shown} ${i18n.unit(unit)}` : shown}`;
      });
  }

  return {
    get_project: tool<{ projectId: string }>({
      run: ({ projectId }) => {
        const p = project(projectId);
        if (!p) return fail(missing(projectId));
        const shown = p.calculations.slice(0, 20);
        return ok({
          id: p.id,
          title: p.title,
          site: p.site,
          climate: value('climateId', p.climateId),
          crop: p.crop,
          currency: p.currency,
          areaHa: p.areaHa,
          house: p.greenhouse,
          results: shown.map((c) => ({
            id: c.id,
            label: c.label,
            kind: c.kind,
            saved: c.savedAt.slice(0, 10),
            ...figures(c, p.currency),
          })),
          moreResults: p.calculations.length - shown.length || undefined,
        });
      },
    }),

    get_calculator: tool<{
      kind: CalcKind;
      projectId?: string;
      resultId?: string;
    }>({
      run: (args) => {
        const found = inputsFor({
          kind: args.kind,
          projectId: args.projectId,
          inputs: [],
          replaceResultId: args.resultId,
        });
        if ('problem' in found) return fail(found.problem ?? '');
        return ok({
          kind: args.kind,
          project: found.project?.title ?? null,
          from: args.resultId
            ? 'saved result'
            : found.project
              ? 'project defaults'
              : 'example house',
          inputs: describeInputs(args.kind, found.inputs, found.currency),
        });
      },
    }),

    preview_calculation: tool<{
      kind: CalcKind;
      projectId?: string;
      inputs: Inputs;
    }>({
      run: (args) => {
        const found = inputsFor(args);
        if ('problem' in found) return fail(found.problem ?? '');
        return ok(
          figures(
            {
              id: 'preview',
              label: '',
              savedAt: '',
              kind: args.kind,
              inputs: found.inputs,
            } as unknown as SavedCalculation,
            found.currency as Currency,
          ),
        );
      },
    }),

    open_screen: tool<{ screen: SerraScreen; tab?: string }>({
      run: async ({ screen, tab }) => {
        await deps.open(screen, tab ? { tab } : undefined);
        return ok(
          { opened: screen, tab },
          t().assistant.notes.opened(t().nav[screen]),
        );
      },
    }),

    set_active_project: tool<{ projectId: string }>({
      run: ({ projectId }) => {
        const p = project(projectId);
        if (!p) return fail(missing(projectId));
        const before = store.activeProject()?.id;
        store.setActiveProject(p.id);
        return {
          ok: true,
          result: { active: p.id },
          note: t().assistant.notes.active(p.title),
          undo: before ? () => store.setActiveProject(before) : undefined,
        };
      },
    }),

    start_tour: tool<Record<string, never>>({
      run: () => {
        deps.startTour();
        return ok({ started: true }, t().assistant.notes.tour);
      },
    }),

    set_sunlight: tool<{ on: boolean }>({
      run: ({ on }) => {
        const before = store.isHighContrast();
        if (before !== on) store.toggleHighContrast();
        const notes = t().assistant.notes;
        return {
          ok: true,
          result: { sunlight: on },
          note: on ? notes.sunlightOn : notes.sunlightOff,
          undo: () => {
            if (store.isHighContrast() !== before) store.toggleHighContrast();
          },
        };
      },
    }),

    set_theme: tool<{ theme: ThemePreference }>({
      run: ({ theme }) => {
        const before = deps.theme();
        deps.theme.set(theme);
        return {
          ok: true,
          result: { theme },
          note: t().assistant.notes[theme],
          undo: () => deps.theme.set(before),
        };
      },
    }),

    set_language: tool<{ language: SiteLanguage }>({
      run: ({ language }) => {
        const before = i18n.lang();
        i18n.setLanguage(language);
        return {
          ok: true,
          result: { language },
          // Said in the new language.
          note: t().assistant.notes.language,
          undo: () => i18n.setLanguage(before),
        };
      },
    }),

    create_project: tool<ProjectFields & { title: string }>({
      check: (args) => houseProblem(DEFAULT_CONTEXT.greenhouse, args.house),
      describe: (args) => ({
        heading: t().assistant.cards.create(args.title),
        lines: projectLines(
          {
            ...args,
            title: undefined,
            climateId: args.climateId ?? DEFAULT_CONTEXT.climateId,
            crop: args.crop ?? DEFAULT_CONTEXT.crop,
            currency: args.currency ?? DEFAULT_CONTEXT.currency,
            house: { ...DEFAULT_CONTEXT.greenhouse, ...args.house },
          },
          DEFAULT_CONTEXT.greenhouse,
        ),
      }),
      run: async (args) => {
        const created = await store.createProject({
          title: args.title.trim(),
          site: args.site?.trim() ?? '',
          climateId: args.climateId ?? DEFAULT_CONTEXT.climateId,
          crop: args.crop ?? DEFAULT_CONTEXT.crop,
          currency: args.currency ?? DEFAULT_CONTEXT.currency,
          greenhouse: { ...DEFAULT_CONTEXT.greenhouse, ...args.house },
        });
        return ok({ id: created.id, title: created.title, active: true });
      },
    }),

    update_project: tool<ProjectFields & { projectId: string }>({
      check: (args) => {
        const p = project(args.projectId);
        return p
          ? houseProblem(p.greenhouse, args.house)
          : missing(args.projectId);
      },
      describe: (args) => {
        const p = project(args.projectId);
        return {
          heading: t().assistant.cards.update(p?.title ?? args.projectId),
          lines: p ? projectLines(args, p.greenhouse) : [],
        };
      },
      run: async ({ projectId, house, ...fields }) => {
        const changes = Object.fromEntries(
          Object.entries(fields).filter(([, v]) => v !== undefined),
        );
        const problem = await store.editProject(projectId, (p) => ({
          ...p,
          ...changes,
          greenhouse: { ...p.greenhouse, ...house },
        }));
        return problem ? fail(problem) : ok({ id: projectId, updated: true });
      },
    }),

    save_calculation: tool<SaveArgs>({
      check: (args) => {
        if (!project(args.projectId)) {
          return args.projectId
            ? missing(args.projectId)
            : 'No project yet: create one first';
        }
        const found = inputsFor(args);
        return 'problem' in found ? (found.problem ?? null) : null;
      },
      describe: (args) => {
        const found = inputsFor(args);
        const kind = t().kinds[args.kind];
        const cards = t().assistant.cards;
        if ('problem' in found)
          return { heading: cards.save(args.label, kind) };
        return {
          heading: args.replaceResultId
            ? cards.replace(args.label, kind)
            : cards.save(args.label, kind),
          lines: [
            `${cards.project}: ${found.project?.title ?? ''}`,
            ...inputLines(args.kind, found.base, found.inputs, found.currency),
            cards.others,
          ],
        };
      },
      run: async (args) => {
        const found = inputsFor(args);
        if ('problem' in found || !found.project) {
          return fail(('problem' in found && found.problem) || 'No project');
        }
        const target = found.project;
        const saved = {
          id: args.replaceResultId ?? newId('calc'),
          kind: args.kind,
          label: args.label.trim(),
          inputs: found.inputs,
          savedAt: new Date().toISOString(),
        } as unknown as SavedCalculation;
        const problem = await store.editProject(target.id, (p) => ({
          ...p,
          calculations: p.calculations.some((c) => c.id === saved.id)
            ? p.calculations.map((c) => (c.id === saved.id ? saved : c))
            : [saved, ...p.calculations],
        }));
        if (problem) return fail(problem);
        // The calculator opens it from the active project.
        store.setActiveProject(target.id);
        const opens = OPENS_IN[args.kind];
        await deps.open(opens.screen, { tab: opens.tab, edit: saved.id });
        return ok({
          id: saved.id,
          label: saved.label,
          project: target.title,
          opened: `${opens.screen}?tab=${opens.tab}`,
          ...figures(saved, target.currency),
        });
      },
    }),

    rename_result: tool<{ projectId: string; resultId: string; label: string }>(
      {
        check: ({ projectId, resultId }) => {
          const p = project(projectId);
          if (!p) return missing(projectId);
          return result(p, resultId) ? null : `No result "${resultId}"`;
        },
        describe: ({ projectId, resultId, label }) => {
          const p = project(projectId);
          const from = p ? result(p, resultId)?.label : undefined;
          return {
            heading: t().assistant.cards.rename(from ?? resultId, label),
            lines: p ? [`${t().assistant.cards.project}: ${p.title}`] : [],
          };
        },
        run: async ({ projectId, resultId, label }) => {
          const problem = await store.editProject(projectId, (p) => ({
            ...p,
            calculations: p.calculations.map((c) =>
              c.id === resultId ? { ...c, label: label.trim() } : c,
            ),
          }));
          return problem ? fail(problem) : ok({ id: resultId, label });
        },
      },
    ),

    delete_project: tool<{ projectId: string }>({
      check: ({ projectId }) =>
        project(projectId) ? null : missing(projectId),
      describe: ({ projectId }) => ({
        heading: t().assistant.cards.deleteProject(
          project(projectId)?.title ?? projectId,
        ),
        lines: [t().assistant.cards.noUndo],
      }),
      run: async ({ projectId }) => {
        try {
          await store.deleteProject(projectId);
        } catch (error) {
          return fail(error instanceof Error ? error.message : String(error));
        }
        return ok({
          deleted: projectId,
          active: store.activeProject()?.id ?? null,
        });
      },
    }),

    delete_result: tool<{ projectId: string; resultId: string }>({
      check: ({ projectId, resultId }) => {
        const p = project(projectId);
        if (!p) return missing(projectId);
        return result(p, resultId) ? null : `No result "${resultId}"`;
      },
      describe: ({ projectId, resultId }) => {
        const p = project(projectId);
        return {
          heading: t().assistant.cards.deleteResult(
            (p && result(p, resultId)?.label) ?? resultId,
            p?.title ?? projectId,
          ),
          lines: [t().assistant.cards.noUndo],
        };
      },
      run: async ({ projectId, resultId }) => {
        const problem = await store.editProject(projectId, (p) => ({
          ...p,
          calculations: p.calculations.filter((c) => c.id !== resultId),
        }));
        return problem ? fail(problem) : ok({ deleted: resultId });
      },
    }),
  } as Record<string, ToolExecutor<never>>;
}
