import * as v from 'valibot';
import {
  Caption,
  Code,
  CodeLanguageSchema,
  Id,
  LIMITS,
  text,
} from '../primitives';
import { stepsSchema } from '../step';

export const WALK_OPS = ['lines', 'note'] as const;

/**
 * `lines` highlights lines `from` to `to`; `note` pins `text` beside line
 * `from`. Lines are numbered from 1.
 */
export const WalkOp = v.strictObject({
  op: v.picklist(WALK_OPS),
  from: v.nullable(
    v.pipe(
      v.number(),
      v.integer(),
      v.minValue(1),
      v.description('First line, from 1.'),
    ),
  ),
  to: v.nullable(
    v.pipe(
      v.number(),
      v.integer(),
      v.minValue(1),
      v.description('Last line, for `lines`; null for `note`.'),
    ),
  ),
  text: v.nullable(text(200, 'The note, for `note`; null for `lines`.')),
});

export const CodeWalkthroughBlock = v.strictObject({
  id: Id,
  kind: v.literal('code-walkthrough'),
  title: Caption,
  language: CodeLanguageSchema,
  code: Code,
  steps: stepsSchema(
    WalkOp,
    '`lines` (from, to) highlights a range; `note` (from, text) pins a note to a line. Leave `focus` empty: code has no ids.',
  ),
});

export const TRACE_MODES = ['execute', 'scripted'] as const;

/** One moment of a program's run: the line about to run, and the state just before it runs. */
export const TraceFrame = v.strictObject({
  id: Id,
  line: v.pipe(
    v.number(),
    v.integer(),
    v.minValue(1),
    v.description('The line about to run, from 1.'),
  ),
  narration: text(
    LIMITS.narrationChars,
    `What this line does, in at most ${LIMITS.narrationWords} words.`,
  ),
  vars: v.pipe(
    v.array(
      v.strictObject({
        scope: text(40, 'The function the variable belongs to, or "global".'),
        name: text(40, 'The variable name.'),
        value: text(80, 'Its value, written as the language would print it.'),
      }),
    ),
    v.maxLength(LIMITS.variables),
    v.description(
      `The variables in scope as the line is about to run, at most ${LIMITS.variables}.`,
    ),
  ),
  stack: v.pipe(
    v.array(text(40, 'A function name, with its arguments if short.')),
    v.maxLength(LIMITS.stackFrames),
    v.description(
      'The call stack as the line is about to run, outermost first, innermost last.',
    ),
  ),
  output: v.nullable(
    text(
      200,
      'Everything printed so far, lines joined with \\n; null before anything is printed.',
    ),
  ),
});

export const CodeTraceBlock = v.strictObject({
  id: Id,
  kind: v.literal('code-trace'),
  title: Caption,
  language: CodeLanguageSchema,
  code: Code,
  mode: v.pipe(
    v.picklist(TRACE_MODES),
    v.description(
      'execute: JavaScript only; the app runs the code and records every frame itself, so leave frames empty. scripted: any language; you write the frames.',
    ),
  ),
  call: v.nullable(
    text(
      200,
      'For execute: the call that starts the run, such as "binarySearch([1, 3, 5], 5)". Null if the code runs on its own.',
    ),
  ),
  frames: v.pipe(
    v.array(TraceFrame),
    v.maxLength(LIMITS.traceFrames),
    v.description(
      `For scripted: the frames in order, at most ${LIMITS.traceFrames}. Empty for execute.`,
    ),
  ),
});
