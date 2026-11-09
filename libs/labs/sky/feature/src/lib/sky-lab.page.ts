import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  cities,
  constellationName,
  constellations,
  defaultCity,
  formatCompass,
  formatDateTime,
  formatDay,
  formatDuration,
  formatMagnitude,
  formatPercent,
  formatTime,
  fromLocalInput,
  moonPhaseName,
  namedStars,
  nightSummary,
  parseSkyLink,
  placeAt,
  placeFromCity,
  skyAt,
  skyLink,
  starAt,
  starLabel,
  toLocalInput,
} from '@ah/labs/sky/domain';
import type { Night } from '@ah/shared/api-client';
import { SiteConfigService } from '@ah/shared/site-config';
import { PreferencesStore } from '@ah/shared/state';
import { SceneHost } from '@ah/three/angular';
import type { SkyLabel, SkySceneParams } from '@ah/three/scenes/sky';
import { SegmentedControl, type SegmentedOption } from '@ah/ui';
import {
  earthFrame,
  type SkyLayers,
  SkyLabStore,
  type Speed,
} from './sky-lab.store';
import { NightPlannerApi } from './night-planner-api';
import { SKY_LAB_COPY } from './sky-lab-copy';

/** Names drawn on the sky: every constellation and the brightest named stars. */
const skyLabels: SkyLabel[] = [
  ...constellations.map((constellation) => ({
    id: `constellation:${constellation.id}`,
    text: constellation.name,
    ra: constellation.ra,
    dec: constellation.dec,
  })),
  ...namedStars
    .filter((star) => star.mag <= 1.6)
    .map((star) => ({
      id: `star:${star.index}`,
      text: star.name as string,
      ra: star.ra,
      dec: star.dec,
    })),
];

interface Fact {
  label: string;
  value: string;
}

/**
 * The middle of a night's longest moonless dark window, or of the night
 * itself when there is none: the moment worth looking at.
 */
function darkestMoment(night: Night): number {
  const middle = (start: string, end: string) =>
    (Date.parse(start) + Date.parse(end)) / 2;
  const longest = [...night.darkWindows].sort(
    (a, b) =>
      Date.parse(b.end) -
      Date.parse(b.start) -
      (Date.parse(a.end) - Date.parse(a.start)),
  )[0];
  if (longest) {
    return middle(longest.start, longest.end);
  }
  if (night.sunset && night.sunrise) {
    return middle(night.sunset, night.sunrise);
  }
  // Midnight sun or polar night: local midnight, roughly.
  return Date.parse(`${night.date}T23:59:00Z`);
}

/**
 * The Sky lab (ADR-0016): the sky above any place at any time. A 3D Earth to
 * pick the spot, a dive down to the ground, and the stars, constellations,
 * Sun, Moon, planets, Milky Way and meteor showers overhead, with the night
 * described in text for everyone.
 */
@Component({
  selector: 'ah-sky-lab-page',
  imports: [SceneHost, SegmentedControl],
  providers: [SkyLabStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sky-lab.page.html',
  styleUrl: './sky-lab.page.scss',
})
export class SkyLabPage {
  protected readonly store = inject(SkyLabStore);
  private readonly preferences = inject(PreferencesStore, { optional: true });
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;

  protected readonly copy = computed(
    () =>
      SKY_LAB_COPY[this.preferences?.language() ?? 'en'] ?? SKY_LAB_COPY.en,
  );

  protected readonly cities = cities;
  protected readonly copied = signal(false);

  protected readonly speeds = computed<SegmentedOption<`${Speed}`>[]>(() => {
    const s = this.copy().speeds;
    return [
      { value: '0', label: s.paused },
      { value: '1', label: s.live },
      { value: '60', label: s.x60 },
      { value: '600', label: s.x600 },
      { value: '3600', label: s.x3600 },
    ];
  });
  protected readonly directions = computed<SegmentedOption<string>[]>(() => {
    const d = this.copy().directions;
    return [
      { value: '0', label: d.n },
      { value: '90', label: d.e },
      { value: '180', label: d.s },
      { value: '270', label: d.w },
    ];
  });
  protected readonly speed = computed(
    () => String(this.store.speed()) as `${Speed}`,
  );
  protected readonly facing = computed(() => String(this.store.facing()));

  private readonly reducedMotion =
    this.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
    false;

  protected readonly params = computed<SkySceneParams>(() => ({
    clock: this.store.clock,
    skyAt: this.store.skyAt(),
    earthAt: earthFrame,
    spot: { lat: this.store.place().lat, lon: this.store.place().lon },
    view: this.store.view(),
    facing: this.store.facing(),
    layers: this.store.layers(),
    labels: skyLabels,
    selected: this.store.selected(),
    playing: this.store.playing(),
    reducedMotion: this.reducedMotion,
  }));

  protected readonly loadScene = () =>
    import('@ah/three/scenes/sky').then((m) => m.skyScene);

  private readonly zone = computed(() => this.store.place().timeZone);
  private readonly date = computed(() => new Date(this.store.time()));
  private readonly sky = computed(() => skyAt(this.date(), this.store.place()));
  protected readonly night = computed(() =>
    nightSummary(this.store.place(), this.date()),
  );

  protected readonly zoneLabel = computed(() => {
    const c = this.copy();
    return this.zone() ? c.localTimeIn(this.store.place().name) : c.yourTimeZone;
  });
  protected readonly when = computed(() =>
    formatDateTime(this.date(), this.zone()),
  );
  protected readonly localInput = computed(() =>
    toLocalInput(this.date(), this.zone()),
  );

  /** Changes rarely, so screen readers aren't told every second. */
  protected readonly status = computed(() => {
    const sky = this.sky();
    const c = this.copy();
    return `${this.store.place().name} · ${c.twilight[sky.twilight]} · ${moonPhaseName(sky.moon.phase)}, ${c.lit(formatPercent(sky.moon.illumination))}`;
  });

  protected readonly tonight = computed(() => {
    const night = this.night();
    const zone = this.zone();
    const c = this.copy();
    const time = (date: Date | null) => (date ? formatTime(date, zone) : '—');
    const facts: Fact[] = [
      {
        label: c.sunset,
        value: night.sunset ? time(night.sunset) : c.sunDoesNotSet,
      },
      {
        label: c.trulyDark,
        value:
          night.darkStart && night.darkEnd
            ? `${time(night.darkStart)} – ${time(night.darkEnd)} (${formatDuration(night.darkEnd.getTime() - night.darkStart.getTime())})`
            : c.notTonight,
      },
      { label: c.sunrise, value: time(night.sunrise) },
      {
        label: c.moon,
        value: c.moonFact(
          night.moon.phaseName,
          formatPercent(night.moon.illumination),
          time(night.moon.rise),
          time(night.moon.set),
        ),
      },
    ];
    const planets = night.planets.map((planet) => ({
      name: planet.name,
      text:
        planet.altitude > 0
          ? c.planetUpNow(
              Math.round(planet.altitude),
              formatCompass(planet.azimuth),
              formatMagnitude(planet.magnitude),
            )
          : c.planetBelowHorizon(time(planet.rise), time(planet.set)),
    }));
    const showers = night.showers.map(({ shower, rate, radiantAltitude }) => ({
      name: shower.name,
      text: c.showerText(
        Math.round(rate),
        radiantAltitude > 0
          ? c.radiantUp(Math.round(radiantAltitude))
          : c.radiantBelowHorizon,
        shower.speed,
        shower.parent,
      ),
    }));
    return {
      facts,
      planets,
      showers,
      constellations: night.constellations
        .slice(0, 14)
        .map((constellation) => constellation.name)
        .join(', '),
    };
  });

  /** The "tonight" slider: sunset to sunrise around the moment shown. */
  protected readonly tonightRange = computed(() => {
    const { sunset, sunrise } = this.night();
    if (!sunset || !sunrise) {
      return null;
    }
    const value = Math.min(
      Math.max(this.store.time(), sunset.getTime()),
      sunrise.getTime(),
    );
    return {
      min: sunset.getTime(),
      max: sunrise.getTime(),
      value,
      text: formatTime(new Date(value), this.zone()),
    };
  });

  /** What the visitor clicked on the sky. */
  protected readonly selection = computed(() => {
    const id = this.store.selected();
    if (!id) {
      return null;
    }
    const sky = this.sky();
    const night = this.night();
    const zone = this.zone();
    const c = this.copy();
    const time = (date: Date | null) => (date ? formatTime(date, zone) : '—');
    const position = (altitude: number, azimuth: number): Fact => ({
      label: c.where,
      value:
        altitude > 0
          ? c.highInThe(Math.round(altitude), formatCompass(azimuth))
          : c.belowTheHorizon,
    });
    if (id === 'moon') {
      return {
        title: c.theMoon,
        subtitle: `${moonPhaseName(sky.moon.phase)}, ${c.lit(formatPercent(sky.moon.illumination))}`,
        facts: [
          position(sky.moon.altitude, sky.moon.azimuth),
          { label: c.rises, value: time(night.moon.rise) },
          { label: c.sets, value: time(night.moon.set) },
        ],
      };
    }
    if (id === 'sun') {
      return {
        title: c.theSun,
        subtitle: c.twilight[sky.twilight],
        facts: [
          position(sky.sun.altitude, sky.sun.azimuth),
          { label: c.sets, value: time(night.sunset) },
          { label: c.rises, value: time(night.sunrise) },
        ],
      };
    }
    if (id.startsWith('planet:')) {
      const planet = night.planets.find((p) => `planet:${p.name}` === id);
      if (!planet) {
        return null;
      }
      return {
        title: planet.name,
        subtitle: c.planetSubtitle(formatMagnitude(planet.magnitude)),
        facts: [
          position(planet.altitude, planet.azimuth),
          { label: c.rises, value: time(planet.rise) },
          { label: c.sets, value: time(planet.set) },
        ],
      };
    }
    if (id.startsWith('star:')) {
      const index = Number(id.slice('star:'.length));
      const star = starAt(index);
      return {
        title: starLabel(index) ?? c.aStar,
        subtitle: star
          ? c.starSubtitle(
              constellationName(star.constellation),
              formatMagnitude(star.mag),
            )
          : c.starTooFaint,
        facts: [],
      };
    }
    if (id.startsWith('constellation:')) {
      const abbreviation = id.slice('constellation:'.length);
      const overhead = night.constellations.find((cItem) => cItem.id === abbreviation);
      return {
        title: constellationName(abbreviation),
        subtitle: c.constellation,
        facts: overhead ? [position(overhead.altitude, overhead.azimuth)] : [],
      };
    }
    return null;
  });

  private readonly plannerApi = signal<NightPlannerApi | null>(null);

  /** The night planner's nights, best three marked, each with a time to jump to. */
  protected readonly planner = computed(() => {
    const { status, nights } = this.store.planner();
    const c = this.copy();
    const best = new Set(
      nights
        .filter((night) => night.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((night) => night.date),
    );
    return {
      status,
      nights: nights.map((night) => ({
        date: night.date,
        label: formatDay(night.date),
        dark:
          night.darkMinutes > 0
            ? c.moonlessDark(formatDuration(night.darkMinutes * 60_000))
            : c.noMoonlessDarkness,
        moon: c.moonPct(formatPercent(night.moonIllumination)),
        shower: night.showers[0]?.name ?? null,
        score: night.score,
        best: best.has(night.date),
        time: darkestMoment(night),
      })),
    };
  });

  protected readonly shareLink = computed(() => {
    const path = this.window?.location.pathname ?? '/labs/sky';
    return `${path}${skyLink(this.store.place(), new Date(this.store.time()))}`;
  });

  constructor() {
    // A shared link opens that sky directly; otherwise start near the visitor.
    const link = this.window ? parseSkyLink(this.window.location.search) : null;
    if (link) {
      this.store.setPlace(placeAt(link.lat, link.lon));
      this.store.setView('sky');
      if (link.at) {
        this.store.setTime(link.at.getTime());
        this.store.setSpeed(0);
      }
    } else {
      this.store.setPlace(
        placeFromCity(
          defaultCity(Intl.DateTimeFormat().resolvedOptions().timeZone),
        ),
      );
    }
    if (this.reducedMotion) {
      this.store.setSpeed(0);
    }

    const destroyRef = inject(DestroyRef);
    const siteConfig = inject(SiteConfigService);
    afterNextRender(() => {
      const timer = this.window?.setInterval(() => this.store.tickNow(), 1000);
      destroyRef.onDestroy(() => this.window?.clearInterval(timer));
      void siteConfig
        .load()
        .then(({ orbitApiUrl }) =>
          this.plannerApi.set(
            orbitApiUrl ? new NightPlannerApi(orbitApiUrl) : null,
          ),
        );
    });

    // Plan the nights for each new place, once the visitor stops changing it.
    effect((onCleanup) => {
      const api = this.plannerApi();
      const place = this.store.place();
      if (!api) {
        return;
      }
      const zone =
        place.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
      const controller = new AbortController();
      const timer = setTimeout(() => {
        this.store.plannerLoading();
        api
          .nights(place, zone, {
            signal: controller.signal,
            onWaking: () => this.store.plannerWaking(),
          })
          .then((response) => this.store.plannerReady(response.nights))
          .catch(() => {
            if (!controller.signal.aborted) {
              this.store.plannerUnavailable();
            }
          });
      }, 400);
      onCleanup(() => {
        clearTimeout(timer);
        controller.abort();
      });
    });
  }

  /** Jumps the sky to a planned night's darkest hour, paused. */
  protected goToNight(time: number): void {
    this.store.setTime(time);
    this.store.setSpeed(0);
    this.store.setView('sky');
  }

  protected toggleView(): void {
    this.store.setView(this.store.view() === 'earth' ? 'sky' : 'earth');
  }

  protected face(value: string): void {
    this.store.face(Number(value));
  }

  protected setSpeed(value: `${Speed}`): void {
    this.store.setSpeed(Number(value) as Speed);
  }

  protected setTime(event: Event): void {
    const date = fromLocalInput(
      (event.target as HTMLInputElement).value,
      this.zone(),
    );
    if (date) {
      this.store.setTime(date.getTime());
    }
  }

  protected scrub(event: Event): void {
    this.store.setTime(Number((event.target as HTMLInputElement).value));
  }

  protected toggleLayer(layer: keyof SkyLayers): void {
    this.store.toggleLayer(layer);
  }

  protected chooseCity(event: Event): void {
    const city = cities.find(
      (c) => c.name === (event.target as HTMLSelectElement).value,
    );
    if (city) {
      this.store.setPlace(placeFromCity(city));
    }
  }

  /** Asks the browser where the visitor is; nothing is sent anywhere. */
  protected locate(): void {
    const geolocation = this.window?.navigator.geolocation;
    if (!geolocation) {
      this.store.setLocating('unavailable');
      return;
    }
    this.store.setLocating('asking');
    geolocation.getCurrentPosition(
      ({ coords }) => {
        this.store.setLocating('idle');
        this.store.setPlace(
          placeAt(coords.latitude, coords.longitude, this.copy().yourLocation),
        );
      },
      (error) =>
        this.store.setLocating(
          error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable',
        ),
      { maximumAge: 600_000, timeout: 15_000 },
    );
  }

  protected picked(id: string | null): void {
    if (id?.startsWith('spot:')) {
      const [lat, lon] = id.slice('spot:'.length).split(',').map(Number);
      this.store.setPlace(placeAt(lat, lon));
      return;
    }
    this.store.select(id);
  }

  protected async copyLink(): Promise<void> {
    const url = new URL(this.shareLink(), this.window?.location.href).href;
    try {
      await this.window?.navigator.clipboard.writeText(url);
      this.copied.set(true);
      this.window?.setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.copied.set(false);
    }
  }
}
