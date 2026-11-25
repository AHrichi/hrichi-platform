import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  INPUT_METHODS,
  INSTRUMENTS,
  type InstrumentId,
  PHENOMENA,
  type Phenomenon,
  type PhenomenonId,
  SCIENCE_GROUPS,
  SOURCES,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import { INSTRUMENT_PHOTOS, TOPIC_PHOTOS } from '../../science/photos';
import { Formula } from '../../ui/formula/formula';
import { Icon } from '../../ui/icon/icon';
import { Panel } from '../../ui/panel/panel';
import { PhotoViewer } from '../../ui/photo-viewer/photo-viewer';
import { PanelState } from '../../ui/panel/panel-state';

/**
 * Science: every phenomenon the calculators rest on, with its formula, its
 * assumptions, how to get each input (and with what instrument), the topics
 * it touches and the tools that use it. `?topic=` and `?instrument=` open
 * an entry, so fields and formulas elsewhere link straight to it.
 */
@Component({
  selector: 'sc-science-screen',
  imports: [Formula, Icon, NgTemplateOutlet, Panel, PhotoViewer, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './science-screen.html',
  styleUrl: './science-screen.scss',
})
export class ScienceScreen {
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly sources = SOURCES;
  protected readonly methods = INPUT_METHODS;
  protected readonly instruments = INSTRUMENTS;
  protected readonly query = signal('');
  private readonly panels = inject(PanelState);
  protected readonly topicPhotos = TOPIC_PHOTOS;
  protected readonly instrumentPhotos = INSTRUMENT_PHOTOS;

  /** What a topic's photo shows, in the reader's language. */
  protected caption(id: PhenomenonId): string {
    const captions: Partial<Record<PhenomenonId, string>> =
      this.t().science.photoCaptions;
    return captions[id] ?? '';
  }

  private readonly params = toSignal(inject(ActivatedRoute).queryParamMap);
  protected readonly activeTopic = computed(
    () => this.params()?.get('topic') ?? null,
  );
  protected readonly activeInstrument = computed(
    () => this.params()?.get('instrument') ?? null,
  );

  /** The topics that match the search, each with its words. */
  protected readonly topics = computed(() => {
    const t = this.t();
    const words = this.query().trim().toLowerCase();
    return PHENOMENA.filter((p) => {
      if (!words) return true;
      const copy = t.science.topics[p.id];
      return `${copy.title} ${copy.what} ${p.formula}`
        .toLowerCase()
        .includes(words);
    });
  });

  protected readonly groups = computed(() =>
    SCIENCE_GROUPS.map((id) => ({
      id,
      topics: this.topics().filter((p) => p.group === id),
    })).filter((g) => g.topics.length > 0),
  );

  /** For each instrument, the inputs it measures. */
  protected readonly measures = computed(() => {
    const t = this.t();
    const out = {} as Record<InstrumentId, string[]>;
    for (const id of INSTRUMENTS) out[id] = [];
    for (const [key, method] of Object.entries(INPUT_METHODS)) {
      if (method.instrument && method.kind === 'measure') {
        out[method.instrument].push(t.fields[key] ?? key);
      }
    }
    return out;
  });

  /** Every topic shown, and the instruments, as section ids. */
  private readonly panelIds = computed(() => [
    ...this.topics().map((p) => `science-${p.id}`),
    'science-instruments',
  ]);
  protected readonly allFolded = computed(() =>
    this.panelIds().every((id) => this.panels.isFolded(id)),
  );

  protected foldAll(folded: boolean): void {
    this.panels.setAll(this.panelIds(), folded);
  }

  constructor() {
    // Bring the entry a link asked for into view (unfolded), and focus it.
    effect(() => {
      const topic = this.activeTopic();
      const instrument = this.activeInstrument();
      const id = topic
        ? `sc-topic-${topic}`
        : instrument
          ? `sc-instrument-${instrument}`
          : null;
      if (!id) return;
      untracked(() => {
        this.panels.unfold(topic ? `science-${topic}` : 'science-instruments');
        if (topic) this.query.set('');
        setTimeout(() => {
          const el = document.getElementById(id);
          if (!el) return;
          const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches;
          el.scrollIntoView({
            behavior: smooth ? 'smooth' : 'auto',
            block: 'start',
          });
          el.focus({ preventScroll: true });
        }, 0);
      });
    });
  }

  protected label(key: string): string {
    return this.t().fields[key] ?? key;
  }

  protected toolLabel(p: Phenomenon['tools'][number]): string {
    const t = this.t();
    const screen = t.nav[p.screen as keyof typeof t.nav] ?? p.screen;
    const tabs: Record<string, Record<string, string>> = {
      heating: t.heating.tabs,
      cooling: t.cooling.tabs,
      water: t.water.tabs,
      supply: t.supply.tabs,
      energy: t.energy.tabs,
      site: t.site.tabs,
      air: t.air.tabs,
    };
    const tab = p.tab ? tabs[p.screen]?.[p.tab] : undefined;
    return tab ? `${screen} · ${tab}` : screen;
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
