import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
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
  type Twilight,
} from '@ah/labs/sky/domain';
import { SceneHost } from '@ah/three/angular';
import type { SkyLabel, SkySceneParams } from '@ah/three/scenes/sky';
import { SegmentedControl, type SegmentedOption } from '@ah/ui';
import {
  earthFrame,
  type SkyLayers,
  SkyLabStore,
  type Speed,
} from './sky-lab.store';

const twilightNames: Record<Twilight, string> = {
  day: 'Daytime',
  civil: 'Civil twilight',
  nautical: 'Nautical twilight',
  astronomical: 'Astronomical twilight',
  night: 'Full darkness',
};

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
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;

  protected readonly cities = cities;
  protected readonly copied = signal(false);

  protected readonly speeds: SegmentedOption<`${Speed}`>[] = [
    { value: '0', label: 'Paused' },
    { value: '1', label: 'Live' },
    { value: '60', label: '×60' },
    { value: '600', label: '×600' },
    { value: '3600', label: '×3600' },
  ];
  protected readonly directions: SegmentedOption<string>[] = [
    { value: '0', label: 'N' },
    { value: '90', label: 'E' },
    { value: '180', label: 'S' },
    { value: '270', label: 'W' },
  ];
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

  protected readonly zoneLabel = computed(() =>
    this.zone() ? `local time in ${this.store.place().name}` : 'your time zone',
  );
  protected readonly when = computed(() =>
    formatDateTime(this.date(), this.zone()),
  );
  protected readonly localInput = computed(() =>
    toLocalInput(this.date(), this.zone()),
  );

  /** Changes rarely, so screen readers aren't told every second. */
  protected readonly status = computed(() => {
    const sky = this.sky();
    return `${this.store.place().name} · ${twilightNames[sky.twilight]} · ${moonPhaseName(sky.moon.phase)}, ${formatPercent(sky.moon.illumination)} lit`;
  });

  protected readonly tonight = computed(() => {
    const night = this.night();
    const zone = this.zone();
    const time = (date: Date | null) => (date ? formatTime(date, zone) : '—');
    const facts: Fact[] = [
      {
        label: 'Sunset',
        value: night.sunset ? time(night.sunset) : 'The Sun doesn’t set',
      },
      {
        label: 'Truly dark',
        value:
          night.darkStart && night.darkEnd
            ? `${time(night.darkStart)} – ${time(night.darkEnd)} (${formatDuration(night.darkEnd.getTime() - night.darkStart.getTime())})`
            : 'Not tonight: the Sun stays less than 18° below the horizon',
      },
      { label: 'Sunrise', value: time(night.sunrise) },
      {
        label: 'Moon',
        value: `${night.moon.phaseName}, ${formatPercent(night.moon.illumination)} lit · rises ${time(night.moon.rise)}, sets ${time(night.moon.set)}`,
      },
    ];
    const planets = night.planets.map((planet) => ({
      name: planet.name,
      text:
        planet.altitude > 0
          ? `up now, ${Math.round(planet.altitude)}° high in the ${formatCompass(planet.azimuth)}, magnitude ${formatMagnitude(planet.magnitude)}`
          : `below the horizon · rises ${time(planet.rise)}, sets ${time(planet.set)}`,
    }));
    const showers = night.showers.map(({ shower, rate, radiantAltitude }) => ({
      name: shower.name,
      text: `about ${Math.round(rate)} an hour under a perfect sky · radiant ${radiantAltitude > 0 ? `${Math.round(radiantAltitude)}° up` : 'below the horizon'} · ${shower.speed} km/s, from ${shower.parent}`,
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
    const time = (date: Date | null) => (date ? formatTime(date, zone) : '—');
    const position = (altitude: number, azimuth: number): Fact => ({
      label: 'Where',
      value:
        altitude > 0
          ? `${Math.round(altitude)}° high in the ${formatCompass(azimuth)}`
          : 'Below the horizon',
    });
    if (id === 'moon') {
      return {
        title: 'The Moon',
        subtitle: `${moonPhaseName(sky.moon.phase)}, ${formatPercent(sky.moon.illumination)} lit`,
        facts: [
          position(sky.moon.altitude, sky.moon.azimuth),
          { label: 'Rises', value: time(night.moon.rise) },
          { label: 'Sets', value: time(night.moon.set) },
        ],
      };
    }
    if (id === 'sun') {
      return {
        title: 'The Sun',
        subtitle: twilightNames[sky.twilight],
        facts: [
          position(sky.sun.altitude, sky.sun.azimuth),
          { label: 'Sets', value: time(night.sunset) },
          { label: 'Rises', value: time(night.sunrise) },
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
        subtitle: `Planet · magnitude ${formatMagnitude(planet.magnitude)}`,
        facts: [
          position(planet.altitude, planet.azimuth),
          { label: 'Rises', value: time(planet.rise) },
          { label: 'Sets', value: time(planet.set) },
        ],
      };
    }
    if (id.startsWith('star:')) {
      const index = Number(id.slice('star:'.length));
      const star = starAt(index);
      return {
        title: starLabel(index) ?? 'A star',
        subtitle: star
          ? `In ${constellationName(star.constellation)} · magnitude ${formatMagnitude(star.mag)}`
          : 'Too faint to have a name in this catalogue',
        facts: [],
      };
    }
    if (id.startsWith('constellation:')) {
      const abbreviation = id.slice('constellation:'.length);
      const overhead = night.constellations.find((c) => c.id === abbreviation);
      return {
        title: constellationName(abbreviation),
        subtitle: 'Constellation',
        facts: overhead ? [position(overhead.altitude, overhead.azimuth)] : [],
      };
    }
    return null;
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
    afterNextRender(() => {
      const timer = this.window?.setInterval(() => this.store.tickNow(), 1000);
      destroyRef.onDestroy(() => this.window?.clearInterval(timer));
    });
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
          placeAt(coords.latitude, coords.longitude, 'Your location'),
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
