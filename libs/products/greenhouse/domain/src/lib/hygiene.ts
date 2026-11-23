import type { HygieneAnswer, HygieneCheck, HygieneItem } from './models';
import type { SetupResult } from './setup';

/**
 * The daily hygiene check: a supervisor walks a greenhouse, answers each
 * item of the farm's checklist (fine or not, with a note and photos), and
 * signs it off. A signed check never changes, on the phone or the server.
 */

export const HYGIENE_LANGUAGES = ['ar', 'fr', 'en'] as const;
export type HygieneLanguage = (typeof HYGIENE_LANGUAGES)[number];

/** The longest label or note the app accepts. */
export const HYGIENE_TEXT_MAX = 200;

/** An item's wording in `lang`, or the first wording it has. */
export function itemLabel(item: HygieneItem, lang: string): string {
  const own = (HYGIENE_LANGUAGES as readonly string[]).includes(lang)
    ? item.label[lang as HygieneLanguage]
    : '';
  return own || item.label.fr || item.label.en || item.label.ar;
}

/** The checklist as the supervisor walks it: active items, in order. */
export function checklist(items: readonly HygieneItem[]): HygieneItem[] {
  return items
    .filter((i) => i.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

/** `answers` with `answer` in place of the one for the same item. */
export function withAnswer(
  answers: readonly HygieneAnswer[],
  answer: HygieneAnswer,
): HygieneAnswer[] {
  const others = answers.filter((a) => a.itemId !== answer.itemId);
  return [...others, answer];
}

export interface HygieneProgress {
  /** Items on the checklist. */
  total: number;
  answered: number;
  /** Items answered "not fine". */
  failed: number;
  /** Items that need a photo and have none. */
  missingPhotos: string[];
  /** Every item answered, with its photos: ready to sign. */
  complete: boolean;
}

/** How far a check has got against the checklist. */
export function hygieneProgress(
  items: readonly HygieneItem[],
  answers: readonly HygieneAnswer[],
): HygieneProgress {
  const list = checklist(items);
  const byItem = new Map(answers.map((a) => [a.itemId, a]));
  let answered = 0;
  let failed = 0;
  const missingPhotos: string[] = [];
  for (const item of list) {
    const answer = byItem.get(item.id);
    if (!answer) continue;
    answered += 1;
    if (!answer.ok) failed += 1;
    if (item.photoRequired && answer.photoPaths.length === 0) {
      missingPhotos.push(item.id);
    }
  }
  return {
    total: list.length,
    answered,
    failed,
    missingPhotos,
    complete:
      list.length > 0 && answered === list.length && missingPhotos.length === 0,
  };
}

/** Where a greenhouse's check stands on a day. */
export type CheckStatus = 'missing' | 'open' | 'signed';

export function checkStatus(
  check: Pick<HygieneCheck, 'signedAt'> | null | undefined,
): CheckStatus {
  if (!check) return 'missing';
  return check.signedAt ? 'signed' : 'open';
}

export interface HygieneItemInput {
  ar: string;
  fr: string;
  en: string;
}

/**
 * An item's wording: at least one language, each at most 200 characters.
 * A language left empty takes the first wording given (French, then
 * English, then Arabic), so every supervisor reads something.
 */
export function checkHygieneItem(
  input: HygieneItemInput,
): SetupResult<HygieneItem['label'], keyof HygieneItemInput> {
  const clean = {
    ar: input.ar.trim().replace(/\s+/g, ' '),
    fr: input.fr.trim().replace(/\s+/g, ' '),
    en: input.en.trim().replace(/\s+/g, ' '),
  };
  const errors: Partial<
    Record<keyof HygieneItemInput, 'required' | 'invalid'>
  > = {};
  for (const lang of HYGIENE_LANGUAGES) {
    if (clean[lang].length > HYGIENE_TEXT_MAX) errors[lang] = 'invalid';
  }
  const first = clean.fr || clean.en || clean.ar;
  if (!first) errors.fr = 'required';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      ar: clean.ar || first,
      fr: clean.fr || first,
      en: clean.en || first,
    },
  };
}

/**
 * A starting checklist for a farm with none: the basics of picking-crew
 * hygiene, for the manager to edit. Generic; no standard is quoted.
 */
export const STANDARD_HYGIENE_ITEMS: readonly Pick<
  HygieneItem,
  'label' | 'photoRequired'
>[] = [
  {
    label: {
      ar: 'محطة غسل اليدين فيها ماء وصابون ومناديل',
      fr: 'Le poste de lavage des mains a eau, savon et essuie-mains',
      en: 'The handwashing station has water, soap and towels',
    },
    photoRequired: true,
  },
  {
    label: {
      ar: 'المراحيض نظيفة ومزوّدة',
      fr: 'Les toilettes sont propres et approvisionnées',
      en: 'The toilets are clean and stocked',
    },
    photoRequired: false,
  },
  {
    label: {
      ar: 'العمّال بملابس نظيفة وشعرهم مغطّى',
      fr: 'Les ouvriers ont une tenue propre et les cheveux couverts',
      en: 'Workers wear clean clothes and cover their hair',
    },
    photoRequired: false,
  },
  {
    label: {
      ar: 'لا أكل ولا شرب ولا تدخين داخل البيت المحمي',
      fr: 'Ni nourriture, ni boisson, ni tabac dans la serre',
      en: 'No food, drink or smoking inside the greenhouse',
    },
    photoRequired: false,
  },
  {
    label: {
      ar: 'الصناديق نظيفة ومرفوعة عن الأرض',
      fr: 'Les caisses sont propres et posées hors du sol',
      en: 'Crates are clean and kept off the ground',
    },
    photoRequired: true,
  },
  {
    label: {
      ar: 'المقصّات والأدوات نظيفة',
      fr: 'Les sécateurs et outils sont propres',
      en: 'Clippers and tools are clean',
    },
    photoRequired: false,
  },
  {
    label: {
      ar: 'لا زجاج مكسور ولا أجسام غريبة في الممرّات',
      fr: 'Ni verre brisé ni corps étranger dans les allées',
      en: 'No broken glass or foreign objects in the rows',
    },
    photoRequired: false,
  },
  {
    label: {
      ar: 'علبة الإسعافات الأولية كاملة',
      fr: 'La trousse de premiers secours est complète',
      en: 'The first-aid kit is complete',
    },
    photoRequired: false,
  },
];
