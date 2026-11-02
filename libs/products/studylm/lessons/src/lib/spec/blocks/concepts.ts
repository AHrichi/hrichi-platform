import * as v from 'valibot';
import { Caption, Id, LIMITS, list, Ref, text } from '../primitives';
import { stepsSchema } from '../step';

export const MAP_OPS = ['reveal', 'highlight'] as const;

export const ConceptMapOp = v.strictObject({
  op: v.picklist(MAP_OPS),
  node: v.nullable(Ref),
  link: v.nullable(Ref),
});

export const ConceptMapBlock = v.strictObject({
  id: Id,
  kind: v.literal('concept-map'),
  title: Caption,
  nodes: list(
    v.strictObject({
      id: Id,
      label: text(32, 'The concept.'),
      group: v.nullable(
        text(24, 'A group name; nodes in a group share a colour.'),
      ),
    }),
    2,
    LIMITS.mapNodes,
    'The concepts.',
  ),
  links: list(
    v.strictObject({
      id: Id,
      from: Ref,
      to: Ref,
      label: text(32, 'How they relate, such as "points to".'),
    }),
    1,
    LIMITS.mapLinks,
    'The relations.',
  ),
  steps: stepsSchema(
    ConceptMapOp,
    'reveal (node or link): it appears; highlight (node or link). Empty steps show the whole map at once.',
  ),
});

/** Growth functions a chart can plot, computed by the app. */
export const GROWTH_FUNCTIONS = [
  '1',
  'log n',
  'n',
  'n log n',
  'n^2',
  'n^3',
  '2^n',
  'n!',
] as const;

export const ChartBlock = v.strictObject({
  id: Id,
  kind: v.literal('chart'),
  title: Caption,
  chart: v.pipe(
    v.picklist(['line', 'bar']),
    v.description('line: values over x; bar: one value per category.'),
  ),
  xLabel: text(32, 'The x axis label.'),
  yLabel: text(32, 'The y axis label.'),
  x: v.nullable(
    v.strictObject({
      from: v.pipe(v.number(), v.integer(), v.description('The first x.')),
      to: v.pipe(
        v.number(),
        v.integer(),
        v.description(
          `The last x, at most ${LIMITS.chartPoints - 1} after from.`,
        ),
      ),
    }),
  ),
  categories: v.pipe(
    v.array(text(24, 'A category.')),
    v.maxLength(LIMITS.categoriesShown),
    v.description('For bar: the categories. Empty for line.'),
  ),
  series: list(
    v.strictObject({
      id: Id,
      label: text(32, 'The series name, shown in the legend.'),
      fn: v.nullable(
        v.pipe(
          v.picklist(GROWTH_FUNCTIONS),
          v.description(
            'For line: a growth function the app computes. Null when values are given.',
          ),
        ),
      ),
      values: v.nullable(
        v.pipe(
          v.array(v.number()),
          v.maxLength(LIMITS.chartPoints),
          v.description(
            'The values: one per x for line, one per category for bar. Null when fn is given.',
          ),
        ),
      ),
    }),
    1,
    LIMITS.series,
    'The series.',
  ),
});
