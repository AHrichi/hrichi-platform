import type { TourDefinition, TourStep, TourStepText } from '@ah/platform/tour';
import type { SerraCopy } from '../i18n/copy.en';

/** A step's id: its words are `tour.steps.<id>` in the copy files. */
export type SerraTourStep = keyof SerraCopy['tour']['steps'];

/**
 * SerraCalc's tour for new users, about two minutes. Targets carry
 * `data-tour`; where the layout changes with the width, a step lists every
 * place it could be (the rail, the tabs, the phone's bottom bar).
 */
export const SERRA_TOUR: TourDefinition & {
  readonly steps: readonly (TourStep & { readonly id: SerraTourStep })[];
} = {
  app: 'serracalc',
  id: 'main',
  version: 1,
  steps: [
    { id: 'welcome', targets: [], route: { path: 'projects' } },
    { id: 'projects', targets: ['new-project'] },
    { id: 'active', targets: ['project-chip', 'brand'] },
    { id: 'navigation', targets: ['nav-rail', 'nav-tabs', 'nav-bottom'] },
    {
      id: 'field',
      targets: ['field'],
      route: { path: 'heating', query: { tab: 'peak' } },
    },
    { id: 'info', targets: ['field-info'] },
    { id: 'save', targets: ['save-bar'] },
    { id: 'sunlight', targets: ['tool-sunlight'] },
    { id: 'backups', targets: ['backups'], route: { path: 'projects' } },
    { id: 'again', targets: ['tool-tour'] },
  ],
};

/** The words of each step, in the reader's language. */
export function serraTourText(t: SerraCopy): (id: string) => TourStepText {
  return (id) => t.tour.steps[id as SerraTourStep] ?? { title: id, body: '' };
}
