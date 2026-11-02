import * as v from 'valibot';
import { Caption, Id, LIMITS, list, text } from '../primitives';

export const ProseBlock = v.strictObject({
  id: Id,
  kind: v.literal('prose'),
  markdown: text(
    LIMITS.proseChars,
    'Explanation in a small Markdown subset: paragraphs, **bold**, *italic*, `inline code`, lists starting with "- " or "1. ", and [links](https://...). No HTML, no headings, no images, no tables.',
  ),
});

export const CALLOUT_TONES = [
  'key-idea',
  'analogy',
  'pitfall',
  'tip',
  'definition',
] as const;

export const CalloutBlock = v.strictObject({
  id: Id,
  kind: v.literal('callout'),
  tone: v.pipe(
    v.picklist(CALLOUT_TONES),
    v.description(
      'key-idea: the one thing to remember; analogy: an everyday comparison; pitfall: a common mistake; tip: practical advice; definition: a term.',
    ),
  ),
  title: v.nullable(text(LIMITS.titleChars, 'A short heading.')),
  text: text(LIMITS.textChars, 'The callout, in plain text.'),
});

export const CompareBlock = v.strictObject({
  id: Id,
  kind: v.literal('compare'),
  title: Caption,
  columns: list(
    text(60, 'A thing being compared.'),
    2,
    4,
    'The things being compared, as column headings.',
  ),
  rows: list(
    v.strictObject({
      label: text(60, 'The aspect compared in this row.'),
      cells: v.pipe(
        v.array(text(160, 'The value for one column.')),
        v.description('One cell per column, in column order.'),
      ),
    }),
    1,
    8,
    'The aspects compared.',
  ),
});
