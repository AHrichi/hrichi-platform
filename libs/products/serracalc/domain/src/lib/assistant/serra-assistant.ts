import {
  type AssistantLocale,
  type AssistantProfile,
  defineTool,
} from '@ah/shared/assistant';
import * as v from 'valibot';
import { CLIMATES } from '../data/climates.data';
import { COVER_IDS, CROP_IDS, SCREEN_IDS } from '../data/catalogue.data';
import { CALC_KINDS, SERRA_SCREENS } from './navigation';

const LANGUAGE_NAMES: Record<AssistantLocale, string> = {
  en: 'English',
  fr: 'French',
  ar: 'Arabic',
  it: 'Italian',
  de: 'German',
};

const ID = v.pipe(v.string(), v.minLength(1), v.maxLength(64));
const TITLE = v.pipe(v.string(), v.minLength(1), v.maxLength(80));
const CROP = v.picklist(CROP_IDS);
const CLIMATE = v.picklist(CLIMATES.map((climate) => climate.id));
const CURRENCY = v.picklist(['TND', 'EUR', 'USD']);
const KIND = v.picklist(CALC_KINDS);

/** A greenhouse's house; every part optional, merged into what is there. */
const HOUSE = v.object({
  shape: v.optional(v.picklist(['gable', 'venlo', 'tunnel'])),
  spans: v.optional(v.number()),
  spanWidthM: v.optional(v.number()),
  lengthM: v.optional(v.number()),
  gutterHeightM: v.optional(v.number()),
  ridgeHeightM: v.optional(v.number()),
  cover: v.optional(v.picklist(COVER_IDS)),
  screen: v.optional(v.picklist(SCREEN_IDS)),
});

/** Calculator inputs by key, as text, so one schema fits every calculator. */
const INPUTS = v.pipe(
  v.array(
    v.object({
      key: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
      value: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
    }),
  ),
  v.maxLength(40),
);

const tools = [
  defineTool({
    name: 'get_project',
    description:
      'A project in full: its house, climate, crop, currency and saved results with their headline figures.',
    effect: 'read',
    args: v.object({ projectId: ID }),
  }),
  defineTool({
    name: 'get_calculator',
    description:
      'A calculator’s inputs: each key with its value, unit and allowed range. From a saved result, or the defaults for the project. Call it before save_calculation or preview_calculation.',
    effect: 'read',
    args: v.object({
      kind: KIND,
      projectId: v.optional(ID),
      resultId: v.optional(ID),
    }),
  }),
  defineTool({
    name: 'preview_calculation',
    description:
      'Works out a calculator’s headline figures for some inputs without saving anything. Inputs not given keep their current values.',
    effect: 'read',
    args: v.object({ kind: KIND, projectId: v.optional(ID), inputs: INPUTS }),
  }),
  defineTool({
    name: 'open_screen',
    description: 'Opens a screen of the app, and a tab of it if given.',
    effect: 'navigate',
    args: v.object({
      screen: v.picklist(SERRA_SCREENS),
      tab: v.optional(v.pipe(v.string(), v.maxLength(20))),
    }),
  }),
  defineTool({
    name: 'set_active_project',
    description: 'Makes a project the active one, which every tool uses.',
    effect: 'navigate',
    args: v.object({ projectId: ID }),
  }),
  defineTool({
    name: 'start_tour',
    description: 'Starts the guided tour of the app.',
    effect: 'navigate',
    args: v.object({}),
  }),
  defineTool({
    name: 'set_sunlight',
    description:
      'Turns sunlight mode (high contrast for bright sun) on or off.',
    effect: 'setting',
    args: v.object({ on: v.boolean() }),
  }),
  defineTool({
    name: 'set_theme',
    description: 'Sets light, dark, or the system’s theme.',
    effect: 'setting',
    args: v.object({ theme: v.picklist(['light', 'dark', 'system']) }),
  }),
  defineTool({
    name: 'set_language',
    description: 'Sets the app’s language.',
    effect: 'setting',
    args: v.object({ language: v.picklist(['en', 'fr', 'ar', 'it', 'de']) }),
  }),
  defineTool({
    name: 'create_project',
    description:
      'Creates a project (one greenhouse) and makes it active. Unset fields take sensible defaults.',
    effect: 'write',
    args: v.object({
      title: TITLE,
      site: v.optional(v.pipe(v.string(), v.maxLength(80))),
      climateId: v.optional(CLIMATE),
      crop: v.optional(CROP),
      currency: v.optional(CURRENCY),
      house: v.optional(HOUSE),
    }),
  }),
  defineTool({
    name: 'update_project',
    description:
      'Changes a project’s title, site, climate, crop, currency or house. Only the fields given change.',
    effect: 'write',
    args: v.object({
      projectId: ID,
      title: v.optional(TITLE),
      site: v.optional(v.pipe(v.string(), v.maxLength(80))),
      climateId: v.optional(CLIMATE),
      crop: v.optional(CROP),
      currency: v.optional(CURRENCY),
      house: v.optional(HOUSE),
    }),
  }),
  defineTool({
    name: 'save_calculation',
    description:
      'Saves a calculator’s result to a project (the active one if none is given) with the inputs given, the rest as they are, then opens it. replaceResultId updates that result instead of adding one.',
    effect: 'write',
    args: v.object({
      kind: KIND,
      label: TITLE,
      projectId: v.optional(ID),
      inputs: INPUTS,
      replaceResultId: v.optional(ID),
    }),
  }),
  defineTool({
    name: 'rename_result',
    description: 'Renames a saved result.',
    effect: 'write',
    args: v.object({ projectId: ID, resultId: ID, label: TITLE }),
  }),
  defineTool({
    name: 'delete_project',
    description: 'Deletes a project and all its saved results.',
    effect: 'destructive',
    args: v.object({ projectId: ID }),
  }),
  defineTool({
    name: 'delete_result',
    description: 'Deletes a saved result from a project.',
    effect: 'destructive',
    args: v.object({ projectId: ID, resultId: ID }),
  }),
];

/** What the app sends with each message: where the user is, and a summary. */
const CONTEXT = v.object({
  screen: v.picklist(SERRA_SCREENS),
  tab: v.optional(v.pipe(v.string(), v.maxLength(20))),
  mode: v.picklist(['standalone', 'embedded-demo']),
  activeProjectId: v.nullable(ID),
  projects: v.pipe(
    v.array(
      v.object({
        id: ID,
        title: v.pipe(v.string(), v.maxLength(80)),
        crop: v.string(),
        climateId: v.string(),
        currency: v.string(),
        results: v.number(),
      }),
    ),
    v.maxLength(30),
  ),
  prefs: v.object({
    language: v.string(),
    theme: v.string(),
    sunlight: v.boolean(),
  }),
});

function system(locale: AssistantLocale): string {
  return `You are the assistant inside SerraCalc, an app that sizes a greenhouse's heating, cooling, water, climate and energy, and keeps each greenhouse as a project with its saved results.

How to answer:
- Answer in ${LANGUAGE_NAMES[locale]}, in short plain text (no tables or markdown), with units on every number.
- Stay on SerraCalc and greenhouse engineering; politely decline anything else.
- Never invent the user's figures: read them with get_project, get_calculator or preview_calculation, and say where they come from.
- To change data, call the tool. The app shows the user what it will do and they apply or cancel it; only say it is done when the tool's result says so.
- Before save_calculation or preview_calculation, call get_calculator for the input keys, units and ranges; send only keys it lists, with values in range.
- SerraCalc is a planning aid: for decisions, a qualified engineer and the suppliers' data.

Screens: projects (create and switch projects, backups), greenhouse (the house), heating (peak load, year of fuel, hot-water pipes), cooling (ventilation, fan and pad, fog), water (crop water, rainwater), supply (reverse osmosis, fertigation), air (light, CO2, humidity, VPD), energy (CHP and buffer, heat reuse, cooling over the year, solar power), site (compartments, plants and tariffs, economics), calendar (crop calendar), operations (logbook, hygiene, maintenance, heat plan), data (live readings), climate, science (the physics behind each number), report, guide.`;
}

/** SerraCalc's assistant: held by the assistant's server, run by the app. */
export const SERRA_ASSISTANT = {
  id: 'serracalc',
  version: 1,
  tools,
  context: CONTEXT,
  system,
} satisfies AssistantProfile<typeof CONTEXT>;

/** The tools that would change the whole site inside the portfolio. */
export const SITE_WIDE_TOOLS = ['set_theme', 'set_language'] as const;
