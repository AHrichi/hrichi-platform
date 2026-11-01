import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type * as Leaflet from 'leaflet';
import { AhButton, AhSegmentedControl } from '@ah/ui';
import {
  calculateHaversineDistanceMeters,
  type PoleItem,
} from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import {
  isSolarPole,
  LightingStore,
  type PoleFilter,
} from '../../store/lighting.store';

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/**
 * The site map: poles as markers (drag one to correct its position), dashed
 * runs with their lengths, and a tap anywhere to place a new pole. Leaflet
 * loads in the browser only. Its stylesheet ships with this component
 * (scoped to it), so the map also works inside the portfolio, which never
 * loads the remote's global styles.
 */
@Component({
  selector: 'lp-map-screen',
  imports: [AhButton, AhSegmentedControl],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Leaflet builds its own DOM, which emulated encapsulation can't reach;
  // every rule in the stylesheet is nested under lp-map-screen instead.
  encapsulation: ViewEncapsulation.None,
  templateUrl: './map-screen.html',
  styleUrl: './map-screen.scss',
})
export class MapScreen {
  protected readonly store = inject(LightingStore);
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('map');

  protected readonly ready = signal(false);
  protected readonly notice = signal<string | null>(null);
  protected readonly filters = computed(() =>
    (['all', 'solar', 'grid'] as const).map((value) => ({
      value,
      label: this.t().poles.filters[value],
    })),
  );

  /** Each pole with the run to the next one. */
  protected readonly runs = computed(() => {
    const poles = this.store.filteredPoles();
    return poles.map((pole, i) => {
      const next = poles[i + 1];
      return {
        pole,
        toNext: next
          ? calculateHaversineDistanceMeters(
              pole.gps.lat,
              pole.gps.lng,
              next.gps.lat,
              next.gps.lng,
            )
          : null,
      };
    });
  });
  protected readonly totalLength = computed(() =>
    this.runs().reduce((sum, run) => sum + (run.toNext ?? 0), 0),
  );

  private L: typeof Leaflet | null = null;
  private map: Leaflet.Map | null = null;
  private layer: Leaflet.LayerGroup | null = null;
  private fitted = false;

  constructor() {
    afterNextRender(async () => {
      // Leaflet is CommonJS: the bundler wraps it in `default`.
      const module = await import('leaflet');
      const L = ((module as { default?: typeof Leaflet }).default ??
        module) as typeof Leaflet;
      this.L = L;
      const project = this.store.activeProject();
      const map = L.map(this.host().nativeElement, {
        center: [
          project?.gpsCenter.lat ?? 36.8065,
          project?.gpsCenter.lng ?? 10.1815,
        ],
        zoom: 17,
      });
      L.tileLayer(TILES, {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      this.layer = L.layerGroup().addTo(map);
      map.on('click', (event: Leaflet.LeafletMouseEvent) =>
        this.offerPole(event.latlng),
      );
      this.map = map;
      this.ready.set(true);
    });

    effect(() => {
      const poles = this.store.filteredPoles();
      this.t();
      if (this.ready()) this.draw(poles);
    });

    inject(DestroyRef).onDestroy(() => this.map?.remove());
  }

  private draw(poles: PoleItem[]): void {
    const L = this.L;
    if (!L || !this.map || !this.layer) return;
    this.layer.clearLayers();
    const points: Leaflet.LatLngTuple[] = [];

    poles.forEach((pole, i) => {
      const at: Leaflet.LatLngTuple = [pole.gps.lat, pole.gps.lng];
      points.push(at);
      const icon = L.divIcon({
        className: `lp-marker ${isSolarPole(pole) ? 'is-solar' : 'is-grid'}${pole.id === this.store.selectedPoleId() ? ' is-selected' : ''}`,
        html: '',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      const marker = L.marker(at, {
        icon,
        draggable: true,
        title: pole.code,
        alt: pole.code,
        keyboard: true,
      });
      // The code goes in as text, never as HTML.
      marker.on('add', () => {
        const element = marker.getElement();
        if (element) element.textContent = pole.code;
      });
      marker.on('click', () => this.store.selectPole(pole.id));
      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        void this.store.updatePole({ ...pole, gps: { ...pole.gps, lat, lng } });
      });
      this.layer?.addLayer(marker);

      const next = poles[i + 1];
      if (next) {
        const meters = calculateHaversineDistanceMeters(
          pole.gps.lat,
          pole.gps.lng,
          next.gps.lat,
          next.gps.lng,
        );
        L.polyline([at, [next.gps.lat, next.gps.lng]], {
          className: 'lp-run',
          weight: 3,
          dashArray: '6 8',
        })
          .bindTooltip(`${this.i18n.num(meters, 0)} m`, {
            permanent: true,
            direction: 'center',
            className: 'lp-run-label',
          })
          .addTo(this.layer as Leaflet.LayerGroup);
      }
    });

    if (!this.fitted && points.length > 1) {
      this.map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
      this.fitted = true;
    }
  }

  private offerPole(at: Leaflet.LatLng): void {
    const L = this.L;
    if (!L || !this.map || !this.store.activeProject()) return;
    const box = document.createElement('div');
    box.className = 'lp-popup';
    const where = document.createElement('p');
    where.textContent = `${at.lat.toFixed(5)}, ${at.lng.toFixed(5)}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `+ ${this.t().map.placePole}`;
    button.addEventListener('click', () => {
      void this.store.addPole({ gps: { lat: at.lat, lng: at.lng } });
      this.map?.closePopup();
    });
    box.append(where, button);
    L.popup().setLatLng(at).setContent(box).openOn(this.map);
  }

  protected locate(): void {
    if (!navigator.geolocation) {
      this.flash(this.t().map.noGps);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        this.map?.setView([coords.latitude, coords.longitude], 18),
      () => this.flash(this.t().map.noGps),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  protected centerOnProject(): void {
    const project = this.store.activeProject();
    if (project)
      this.map?.setView([project.gpsCenter.lat, project.gpsCenter.lng], 17);
  }

  protected focus(pole: PoleItem): void {
    this.store.selectPole(pole.id);
    this.map?.setView([pole.gps.lat, pole.gps.lng], 18);
  }

  protected setFilter(filter: PoleFilter): void {
    this.fitted = false;
    this.store.setPoleFilter(filter);
  }

  private flash(message: string): void {
    this.notice.set(message);
    setTimeout(() => this.notice.set(null), 5000);
  }
}
