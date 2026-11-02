import * as v from 'valibot';

/**
 * The lesson format's version. Bump it on any change a generated lesson or
 * the n8n workflow could notice; the workflow refuses other versions.
 */
export const SPEC_VERSION = 1;

/** Every size limit in one place: schemas, checks and prompts read it. */
export const LIMITS = {
  titleChars: 80,
  textChars: 400,
  proseChars: 1500,
  questionChars: 300,
  optionChars: 160,
  narrationChars: 280,
  narrationWords: 40,
  codeChars: 2400,
  codeLines: 30,
  codeLineChars: 100,
  payloadChars: 160,
  objectives: 5,
  sections: 8,
  blocksPerSection: 6,
  cards: 12,
  steps: 40,
  opsPerStep: 6,
  focusPerStep: 8,
  arrayLength: 16,
  pointers: 4,
  stackDepth: 12,
  buckets: 12,
  treeNodes: 15,
  graphNodes: 14,
  graphEdges: 24,
  gridSize: 10,
  recursionCalls: 31,
  flowNodes: 14,
  flowEdges: 24,
  actors: 7,
  messages: 20,
  states: 10,
  transitions: 16,
  stages: 8,
  mapNodes: 14,
  mapLinks: 20,
  series: 5,
  chartPoints: 64,
  categoriesShown: 12,
  options: 6,
  orderItems: 8,
  categorizeGroups: 4,
  categorizeItems: 10,
  parsonsLines: 14,
  distractors: 3,
  blanks: 6,
  rubric: 5,
  variables: 12,
  stackFrames: 8,
  traceFrames: 40,
  minutesMin: 5,
  minutesMax: 60,
} as const;

/** Lowercase kebab-case, starting with a letter: `db`, `step-3`, `call-fib-2`. */
export const ID_PATTERN = /^[a-z][a-z0-9-]{0,31}$/;

export const Id = v.pipe(
  v.string(),
  v.regex(ID_PATTERN),
  v.description(
    'Kebab-case id: lowercase letters, digits and dashes, starting with a letter, at most 32 characters. Unique within the lesson.',
  ),
);

/** A reference to an id declared elsewhere in the same block or lesson. */
export const Ref = v.pipe(
  v.string(),
  v.regex(ID_PATTERN),
  v.description('The id of an element declared in this block.'),
);

/** A non-empty string of at most `max` characters. */
export function text(max: number, description: string) {
  return v.pipe(
    v.string(),
    v.minLength(1),
    v.maxLength(max),
    v.description(`${description} At most ${max} characters.`),
  );
}

/** An array of `min` to `max` items. */
export function list<TItem extends v.GenericSchema>(
  item: TItem,
  min: number,
  max: number,
  description: string,
) {
  return v.pipe(
    v.array(item),
    v.minLength(min),
    v.maxLength(max),
    v.description(`${description} ${min} to ${max} items.`),
  );
}

/** A whole number between `min` and `max`. */
export function int(min: number, max: number, description: string) {
  return v.pipe(
    v.number(),
    v.integer(),
    v.minValue(min),
    v.maxValue(max),
    v.description(`${description} A whole number from ${min} to ${max}.`),
  );
}

export const CODE_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'go',
  'rust',
  'c',
  'cpp',
  'csharp',
  'sql',
  'bash',
  'html',
  'css',
  'json',
  'yaml',
  'text',
] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

export const CodeLanguageSchema = v.pipe(
  v.picklist(CODE_LANGUAGES),
  v.description('The language of the code.'),
);

export const Code = text(
  LIMITS.codeChars,
  `Source code: at most ${LIMITS.codeLines} lines of ${LIMITS.codeLineChars} characters, indented with spaces, no tabs. Lines are numbered from 1.`,
);

/** The same tiers as the roadmap's sections. */
export const TIERS = ['beginner', 'intermediate', 'expert'] as const;
export type Tier = (typeof TIERS)[number];

export const TierSchema = v.pipe(
  v.picklist(TIERS),
  v.description('The level the lesson is written for.'),
);

/** A short visible caption for a visual, or null. */
export const Caption = v.nullable(
  text(LIMITS.titleChars, 'A short caption shown above the visual.'),
);
