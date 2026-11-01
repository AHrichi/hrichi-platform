import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type * as Leaflet from 'leaflet';
import { AhButton } from '@ah/ui';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { Geocoder, type Place } from '../../services/geocoder';

export interface LatLng {
  lat: number;
  lng: number;
}

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/**
 * Picks a point on a map: tap to set it, drag the pin, use the phone's
 * position, or search for a place. Shows other points (the project's poles)
 * for context. Used by the project and pole forms.
 */
@Component({
  selector: 'lp-location-picker',
  imports: [AhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Leaflet builds its own DOM: rules are nested under the element instead.
  encapsulation: ViewEncapsulation.None,
  templateUrl: './location-picker.html',
  styleUrl: './location-picker.scss',
})
export class LocationPicker {
  readonly value = model.required<LatLng>();
  /** Other points to show faintly, e.g. the project's poles. */
  readonly context = input<readonly LatLng[]>([]);
  readonly searchable = input(true);
  readonly zoom = input(17);
  /** A place the user searched and chose, with its name. */
  readonly placeChosen = output<Place>();

  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  private readonly geocoder = inject(Geocoder);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('map');

  protected readonly query = signal('');
  protected readonly results = signal<Place[] | null>(null);
  protected readonly searching = signal(false);
  protected readonly notice = signal<string | null>(null);

  private L: typeof Leaflet | null = null;
  private map: Leaflet.Map | null = null;
  private pin: Leaflet.Marker | null = null;
  private others: Leaflet.LayerGroup | null = null;

  constructor() {
    afterNextRender(async () => {
      const module = await import('leaflet');
      const L = ((module as { default?: typeof Leaflet }).default ??
        module) as typeof Leaflet;
      this.L = L;
      const start = this.value();
      const map = L.map(this.host().nativeElement, {
        center: [start.lat, start.lng],
        zoom: this.zoom(),
      });
      L.tileLayer(TILES, {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      this.others = L.layerGroup().addTo(map);
      this.pin = L.marker([start.lat, start.lng], {
        draggable: true,
        keyboard: false,
        icon: L.divIcon({
          className: 'lp-pick-pin',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        }),
      }).addTo(map);
      this.pin.on('dragend', () => {
        const at = this.pin?.getLatLng();
        if (at) this.set({ lat: at.lat, lng: at.lng }, false);
      });
      map.on('click', (event: Leaflet.LeafletMouseEvent) =>
        this.set({ lat: event.latlng.lat, lng: event.latlng.lng }, false),
      );
      this.map = map;
      // Opened in a dialog, the map measures 0 at first: refit once it shows.
      const resize = new ResizeObserver(() => map.invalidateSize());
      resize.observe(this.host().nativeElement);
      this.drawContext();
      this.destroy = () => {
        resize.disconnect();
        map.remove();
      };
    });

    // Typed coordinates move the pin and the view.
    effect(() => {
      const value = this.value();
      untracked(() => {
        const at = this.pin?.getLatLng();
        if (at && (at.lat !== value.lat || at.lng !== value.lng)) {
          this.pin?.setLatLng([value.lat, value.lng]);
          this.map?.panTo([value.lat, value.lng]);
        }
      });
    });
    effect(() => {
      this.context();
      untracked(() => this.drawContext());
    });
    inject(DestroyRef).onDestroy(() => this.destroy?.());
  }

  private destroy: (() => void) | null = null;

  private drawContext(): void {
    const L = this.L;
    if (!L || !this.others) return;
    this.others.clearLayers();
    for (const p of this.context()) {
      L.circleMarker([p.lat, p.lng], {
        radius: 5,
        className: 'lp-pick-other',
        interactive: false,
      }).addTo(this.others);
    }
  }

  private set(point: LatLng, pan: boolean): void {
    const rounded = {
      lat: Math.round(point.lat * 1e6) / 1e6,
      lng: Math.round(point.lng * 1e6) / 1e6,
    };
    this.pin?.setLatLng([rounded.lat, rounded.lng]);
    if (pan) this.map?.setView([rounded.lat, rounded.lng], 18);
    this.value.set(rounded);
  }

  protected locate(): void {
    if (!navigator.geolocation) {
      this.notice.set(this.t().map.noGps);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.notice.set(null);
        this.set({ lat: coords.latitude, lng: coords.longitude }, true);
      },
      () => this.notice.set(this.t().map.noGps),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  protected async search(event: Event): Promise<void> {
    event.preventDefault();
    const query = this.query().trim();
    if (!query) return;
    this.searching.set(true);
    const places = await this.geocoder.search(query, this.i18n.lang());
    this.searching.set(false);
    this.results.set(places);
  }

  protected choose(place: Place): void {
    this.results.set(null);
    this.set({ lat: place.lat, lng: place.lng }, true);
    this.placeChosen.emit(place);
  }

  protected text(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
