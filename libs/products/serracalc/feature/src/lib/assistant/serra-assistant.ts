import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  type AssistantSetup,
  AssistantPanel,
  provideAssistant,
} from '@ah/platform/assistant';
import { APP_MODE } from '@ah/platform/app-mode';
import { TourService } from '@ah/platform/tour';
import {
  SERRA_ASSISTANT,
  SERRA_SCREENS,
  type SerraScreen,
  SITE_WIDE_TOOLS,
} from '@ah/products/serracalc/domain';
import { PreferencesStore } from '@ah/shared/state';
import { SerraI18n } from '../i18n/serra-i18n';
import { SerraStore } from '../store/serra.store';
import { SERRA_TOUR } from '../tour/serra-tour';
import { serraTools } from './serra-tools';

const isScreen = (path: string): path is SerraScreen =>
  (SERRA_SCREENS as readonly string[]).includes(path);

/** SerraCalc's side of the assistant: its tools, its state, its words. */
function serraAssistantSetup(): AssistantSetup {
  const view = inject(SerraAssistant);
  const store = inject(SerraStore);
  const i18n = inject(SerraI18n);
  const preferences = inject(PreferencesStore);
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  const tour = inject(TourService);
  const standalone =
    (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'standalone';

  /** Where the reader is: the last screen in the URL, and its tab. */
  function where(): { screen: SerraScreen; tab?: string } {
    const tree = router.parseUrl(router.url);
    const paths = (tree.root.children['primary']?.segments ?? []).map(
      (segment) => segment.path,
    );
    const screen = paths.reverse().find(isScreen) ?? 'projects';
    const tab = tree.queryParams['tab'];
    return typeof tab === 'string' && tab
      ? { screen, tab: tab.slice(0, 20) }
      : { screen };
  }

  const theme = Object.assign(() => preferences.theme(), {
    set: (value: Parameters<typeof preferences.setTheme>[0]) =>
      preferences.setTheme(value),
  });

  return {
    profile: SERRA_ASSISTANT,
    locale: () => i18n.lang(),
    omitTools: () => (standalone ? [] : [...SITE_WIDE_TOOLS]),
    storageKey: standalone
      ? 'serracalc.assistant'
      : 'ah-demo.serracalc.assistant',
    context: () => ({
      ...where(),
      mode: standalone ? 'standalone' : 'embedded-demo',
      activeProjectId: store.activeProject()?.id ?? null,
      projects: store
        .projects()
        .slice(0, 30)
        .map((p) => ({
          id: p.id,
          title: p.title.slice(0, 80),
          crop: p.crop,
          climateId: p.climateId,
          currency: p.currency,
          results: p.calculations.length,
        })),
      prefs: {
        language: i18n.lang(),
        theme: preferences.theme(),
        sunlight: store.isHighContrast(),
      },
    }),
    executors: serraTools({
      store,
      i18n,
      theme,
      open: (screen, query) =>
        router.navigate([screen], { relativeTo: route, queryParams: query }),
      startTour: () => {
        // The tour needs the page: the panel closes first, and the tour
        // gives focus back to what the panel gave it to.
        view.open.set(false);
        setTimeout(() =>
          tour.start(
            SERRA_TOUR,
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null,
          ),
        );
      },
    }),
  };
}

/**
 * The assistant's panel for SerraCalc. The shell loads it on the first
 * click of its button, so the first visit doesn't pay for it.
 */
@Component({
  selector: 'sc-assistant',
  imports: [AssistantPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideAssistant(serraAssistantSetup)],
  template: `
    <ah-assistant-panel
      [(open)]="open"
      [greeting]="t().assistant.greeting"
      [suggestions]="t().assistant.suggestions"
      [privacy]="t().assistant.privacy"
      [placeholder]="t().assistant.placeholder"
    />
  `,
})
export class SerraAssistant {
  readonly open = model(false);
  protected readonly t = inject(SerraI18n).t;
}
