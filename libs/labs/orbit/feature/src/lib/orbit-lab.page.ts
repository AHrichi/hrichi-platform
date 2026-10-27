import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
} from '@angular/core';
import {
  cities,
  formatCount,
  formatFromNow,
  formatKm,
  formatLocalTime,
  formatPeriod,
  formatSpeed,
  groupNames,
  groupOf,
  orbitClasses,
  orbitClassNames,
  orbitShape,
  type SatelliteGroup,
  satelliteGroups,
} from '@ah/labs/orbit/domain';
import { SiteConfigService } from '@ah/shared/site-config';
import { SceneHost } from '@ah/three/angular';
import type { OrbitGlobeParams } from '@ah/three/scenes/orbit-globe';
import { SegmentedControl, type SegmentedOption } from '@ah/ui';
import { OrbitApi } from './orbit-api';
import { OrbitLabStore, type Speed } from './orbit-lab.store';
import { Propagation, startPropagationWorker } from './propagation/propagation';

const classColours = {
  LEO: 'color-data-4',
  MEO: 'color-data-3',
  GEO: 'color-data-2',
  HEO: 'color-data-5',
} as const;

/**
 * The Orbit lab (ADR-0014): every active satellite on a WebGL globe, from
 * the Spring Boot Orbit API, with a bundled snapshot while the API wakes.
 */
@Component({
  selector: 'ah-orbit-lab-page',
  imports: [SceneHost, SegmentedControl],
  providers: [OrbitLabStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './orbit-lab.page.html',
  styleUrl: './orbit-lab.page.scss',
})
export class OrbitLabPage {
  protected readonly store = inject(OrbitLabStore);
  private readonly window = inject(DOCUMENT).defaultView;

  protected readonly cities = cities;
  protected readonly legend = orbitClasses.map((orbitClass) => ({
    label: `${orbitClass} · ${orbitClassNames[orbitClass]}`,
    token: classColours[orbitClass],
  }));
  protected readonly speeds: SegmentedOption<`${Speed}`>[] = [
    { value: '1', label: 'Live' },
    { value: '60', label: '×60' },
    { value: '600', label: '×600' },
  ];
  protected readonly speed = computed(
    () => String(this.store.speed()) as `${Speed}`,
  );
  private readonly reducedMotion =
    this.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
    false;

  protected readonly params = computed<OrbitGlobeParams>(() => ({
    feed: this.store.feed(),
    clock: this.store.clock,
    selected: this.store.selectedIndex(),
    path: this.store.path(),
    groupMask: this.store.groupMask(),
    reducedMotion: this.reducedMotion,
  }));

  protected readonly loadScene = () =>
    import('@ah/three/scenes/orbit-globe').then((m) => m.orbitGlobeScene);

  /** How many satellites each group holds in the catalog on screen. */
  protected readonly groups = computed(() => {
    const counts = new Map<SatelliteGroup, number>();
    for (const satellite of this.store.catalog()) {
      const group = groupOf(satellite, orbitShape(satellite).orbitClass);
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }
    return satelliteGroups.map((group, bit) => ({
      group,
      label: groupNames[group],
      count: formatCount(counts.get(group) ?? 0),
      shown: Boolean(this.store.groupMask() & (1 << bit)),
    }));
  });

  protected readonly status = computed(() => {
    const count = formatCount(this.store.count());
    const satellites = this.store.count() === 1 ? 'satellite' : 'satellites';
    const date = new Date(this.store.fetchedAt()).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
    switch (this.store.api()) {
      case 'ready':
        return `Live: ${count} active ${satellites}, CelesTrak data from ${date} UTC.`;
      case 'waking':
        return `Showing the ${count} brightest ${satellites} from the bundled snapshot while the free-tier Orbit API wakes up (up to a minute)…`;
      case 'unavailable':
        return `The Orbit API didn't answer, so this is the bundled snapshot of the ${count} brightest ${satellites} (${date} UTC).`;
      default:
        return `Showing the ${count} brightest ${satellites} (snapshot of ${date} UTC). The live catalog comes from the Orbit API, which isn't configured here.`;
    }
  });

  protected readonly details = computed(() => {
    const satellite = this.store.selected();
    const shape = this.store.shape();
    const group = this.store.selectedGroup();
    if (!satellite || !shape || !group) {
      return null;
    }
    const telemetry = this.store.telemetry();
    return {
      name: satellite.OBJECT_NAME,
      subtitle: `NORAD ${satellite.NORAD_CAT_ID} · ${groupNames[group]} · ${orbitClassNames[shape.orbitClass]}`,
      facts: [
        {
          label: 'Altitude',
          value: telemetry ? formatKm(telemetry.altitudeKm) : '…',
        },
        {
          label: 'Speed',
          value: telemetry ? formatSpeed(telemetry.speedKmS) : '…',
        },
        {
          label: 'Over',
          value: telemetry
            ? `${telemetry.latitude.toFixed(1)}°, ${telemetry.longitude.toFixed(1)}°`
            : '…',
        },
        { label: 'Period', value: formatPeriod(shape.periodMinutes) },
        {
          label: 'Inclination',
          value: `${satellite.INCLINATION.toFixed(1)}°`,
        },
        {
          label: 'Perigee · apogee',
          value: `${formatKm(shape.perigeeKm)} · ${formatKm(shape.apogeeKm)}`,
        },
      ],
    };
  });

  protected readonly passes = computed(() => {
    const city = this.store.city();
    const now = new Date(this.store.clock());
    return this.store.passes().passes.map((pass) => ({
      key: pass.rise.time,
      when: formatLocalTime(pass.rise.time, city.timeZone),
      fromNow: formatFromNow(pass.rise.time, now),
      height: `${Math.round(pass.culmination.elevationDeg)}°`,
      minutes: Math.max(1, Math.round(pass.durationSeconds / 60)),
      visible: pass.visible,
    }));
  });

  constructor() {
    const siteConfig = inject(SiteConfigService);
    afterNextRender(() => {
      const propagation = new Propagation(startPropagationWorker(), {
        catalog: (feed) => this.store.catalogReady(feed),
        telemetry: (telemetry) => this.store.telemetry.set(telemetry),
        path: (index, positions) => this.store.pathReady(index, positions),
      });
      void siteConfig
        .load()
        .then(({ orbitApiUrl }) =>
          this.store.start(
            propagation,
            orbitApiUrl ? new OrbitApi(orbitApiUrl) : null,
          ),
        );
    });
    inject(DestroyRef).onDestroy(() => this.store.stop());
  }

  protected setSpeed(value: `${Speed}`): void {
    this.store.setSpeed(Number(value) as Speed);
  }

  protected picked(index: string | null): void {
    this.store.selectIndex(index === null ? null : Number(index));
  }
}
