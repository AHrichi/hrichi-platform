import * as v from 'valibot';
import { Id, LIMITS, Ref, text } from './primitives';

/**
 * One discrete step of a visual. People follow processes as steps rather
 * than as continuous motion (Tversky et al., 2002), so every visual is a
 * list of steps the learner moves through at their own pace. A step's
 * `ops` change the visual's state; the player replays them in order.
 */
export function stepSchema<TOp extends v.GenericSchema>(
  op: TOp,
  opHelp: string,
) {
  return v.strictObject({
    id: Id,
    title: text(LIMITS.titleChars, 'A few words naming the step.'),
    narration: text(
      LIMITS.narrationChars,
      `What happens in this step and why, in at most ${LIMITS.narrationWords} words.`,
    ),
    focus: v.pipe(
      v.array(Ref),
      v.maxLength(LIMITS.focusPerStep),
      v.description(
        `Ids of the parts to highlight in this step (nodes, edges, messages and so on). At most ${LIMITS.focusPerStep}.`,
      ),
    ),
    ops: v.pipe(
      v.array(op),
      v.maxLength(LIMITS.opsPerStep),
      v.description(`${opHelp} At most ${LIMITS.opsPerStep} per step.`),
    ),
    pauseFor: v.nullable(
      v.pipe(
        Ref,
        v.description(
          'The id of a check block in the same section the learner answers before this step plays, or null.',
        ),
      ),
    ),
  });
}

export function stepsSchema<TOp extends v.GenericSchema>(
  op: TOp,
  opHelp: string,
) {
  return v.pipe(
    v.array(stepSchema(op, opHelp)),
    v.maxLength(LIMITS.steps),
    v.description(
      `The steps, in order. At most ${LIMITS.steps}. Each step's ops apply on top of the previous steps.`,
    ),
  );
}

export interface Step<TOp> {
  id: string;
  title: string;
  narration: string;
  focus: string[];
  ops: TOp[];
  pauseFor: string | null;
}
