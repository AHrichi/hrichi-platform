import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { Geocoder, type Place } from './geocoder';

export interface LatLng {
  lat: number;
  lng: number;
}

/** The picker's words, in the host app's language. */
export interface MapPickerLabels {
  search: string;
  searchPlaceholder: string;
  noResults: string;
  mapLabel: string;
  hint: string;
  myLocation: string;
  noGps: string;
}

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/**
 * Picks a point on a map: tap to set it, drag the pin, use the phone's
 * position, or search for a place. Shows other points for context. Leaflet
 * loads only when a picker first renders, and the host app supplies the
 * words, so any product can use it.
 */
@Component({
  selector: 'ah-map-picker',
  imports: [AhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Leaflet builds its own DOM: rules are nested under the element instead.
  encapsulation: ViewEncapsulation.None,
  templateUrl: './map-picker.html',
  styleUrl: './map-picker.scss',
})
export class MapPicker {
  readonly value = model.required<LatLng>();
  readonly labels = input.required<MapPickerLabels>();
  /** The search language for place names, e.g. 'fr'. */
  readonly language = input('en');
  /** The locale for the coordinates, e.g. 'ar-u-nu-latn'. */
  readonly locale = input('en-GB');
  /** Other points to show faintly, e.g. a project's poles. */
  readonly context = input<readonly LatLng[]>([]);
  readonly searchable = input(true);
  readonly zoom = input(17);
  /** A place the user searched and chose, with its name. */
  readonly placeChosen = output<Place>();

  private readonly geocoder = inject(Geocoder);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('map');

  protected readonly query = signal('');
  protected readonly results = signal<Place[] | null>(null);
  protected readonly searching = signal(false);
  protected readonly notice = signal<string | null>(null);
  protected readonly coords = computed(() => {
    const format = new Intl.NumberFormat(this.locale(), {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    });
    const { lat, lng } = this.value();
    return `${format.format(lat)}, ${format.format(lng)}`;
  });

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
          className: 'ah-pick-pin',
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
        className: 'ah-pick-other',
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
    if (pan)
      this.map?.setView([rounded.lat, rounded.lng], Math.max(this.zoom(), 14));
    this.value.set(rounded);
  }

  protected locate(): void {
    if (!navigator.geolocation) {
      this.notice.set(this.labels().noGps);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.notice.set(null);
        this.set({ lat: coords.latitude, lng: coords.longitude }, true);
      },
      () => this.notice.set(this.labels().noGps),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  protected async search(event: Event): Promise<void> {
    event.preventDefault();
    const query = this.query().trim();
    if (!query) return;
    this.searching.set(true);
    const places = await this.geocoder.search(query, this.language());
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
