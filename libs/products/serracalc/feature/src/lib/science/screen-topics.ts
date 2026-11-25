import { computed, inject, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { phenomenaFor, type PhenomenonId } from '@ah/products/serracalc/domain';

export { type FieldInfo, fieldInfo } from './field-info';

/** The tab a screen opens on when the URL names none. */
const DEFAULT_TABS: Record<string, string> = {
  heating: 'peak',
  cooling: 'ventilation',
  water: 'crop',
  air: 'light',
  supply: 'ro',
  energy: 'chp',
  site: 'overview',
};

/**
 * The phenomena behind the screen and tab on show, read from the route, so
 * fields and formulas can link to the Science page without each screen
 * passing them down.
 */
export function injectScreenTopics(): Signal<PhenomenonId[]> {
  const route = inject(ActivatedRoute, { optional: true });
  const screen = route?.snapshot.routeConfig?.path ?? '';
  const query = route ? toSignal(route.queryParamMap) : null;
  return computed(() => {
    const tab = query?.()?.get('tab') ?? DEFAULT_TABS[screen];
    return phenomenaFor(screen, tab);
  });
}
