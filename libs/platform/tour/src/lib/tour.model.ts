/** Where a step's card sits next to its target; `auto` picks the side with room. */
export type TourPlacement =
  'auto' | 'block-start' | 'block-end' | 'inline-start' | 'inline-end';

/** A screen to open before a step shows, relative to the app's root route. */
export interface TourRoute {
  readonly path: string;
  readonly query?: Readonly<Record<string, string>>;
}

/**
 * One step: the element it points at and, optionally, the screen it needs.
 * `targets` are `data-tour` ids tried in order; the first one visible at the
 * current width wins (a side rail on a desktop, a bottom bar on a phone).
 * With none, or none visible, the card shows in the middle of the screen.
 */
export interface TourStep {
  readonly id: string;
  readonly targets: readonly string[];
  readonly route?: TourRoute;
  readonly placement?: TourPlacement;
}

/**
 * A tour of one app. It holds no words: the app passes them in its own
 * language, by step id. Bump `version` when the steps change for good.
 */
export interface TourDefinition {
  /** The app, e.g. `serracalc`: part of where progress is kept. */
  readonly app: string;
  readonly id: string;
  readonly version: number;
  readonly steps: readonly TourStep[];
}

/** The words of one step, in the reader's language. */
export interface TourStepText {
  readonly title: string;
  readonly body: string;
}

/** How a tour ended: walked to the end, skipped, or its invitation declined. */
export type TourOutcome = 'finished' | 'skipped' | 'dismissed';

const ID = /^[a-z0-9][a-z0-9-]*$/;

/** Ids are plain slugs, so they go into `[data-tour~="…"]` as they are. */
export function checkTour(definition: TourDefinition): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  if (!ID.test(definition.app)) problems.push(`app "${definition.app}"`);
  if (!ID.test(definition.id)) problems.push(`id "${definition.id}"`);
  if (definition.steps.length === 0) problems.push('no steps');
  for (const step of definition.steps) {
    if (!ID.test(step.id)) problems.push(`step "${step.id}"`);
    if (seen.has(step.id)) problems.push(`step "${step.id}" twice`);
    seen.add(step.id);
    for (const target of step.targets) {
      if (!ID.test(target)) problems.push(`target "${target}" in "${step.id}"`);
    }
  }
  return problems;
}
