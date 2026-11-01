import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AhButton, AhEmptyState, AhModal } from '@ah/ui';
import { type LatLng, MapPicker, type Place } from '@ah/platform/maps';
import {
  addDays,
  FORECAST_DAYS,
  SKY_ICONS,
  skyOf,
  TRIP_TYPES,
  type Trip,
} from '@ah/products/basecamp/domain';
import { BasecampI18n } from '../../i18n/basecamp-i18n';
import {
  BasecampStore,
  newId,
  today,
  type TripDraft,
} from '../../store/basecamp.store';
import { SharePanel } from '../../ui/share-panel/share-panel';

const DEFAULT_SITE = { lat: 36.7766, lng: 8.6874, name: '' };

/** Trips: the open trip at a glance, the trip form, sharing and backups. */
@Component({
  selector: 'bc-trips-screen',
  imports: [AhButton, AhEmptyState, AhModal, MapPicker, RouterLink, SharePanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trips-screen.html',
  styleUrl: './trips-screen.scss',
})
export class TripsScreen {
  protected readonly store = inject(BasecampStore);
  protected readonly i18n = inject(BasecampI18n);
  protected readonly t = this.i18n.t;
  protected readonly types = TRIP_TYPES;

  /** The trip being edited, or a new one; null when the form is shut. */
  protected readonly draft = signal<TripDraft | null>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly newPerson = signal('');

  protected readonly firstDay = computed(() => {
    const day = this.store.forecastDays()[0];
    return day ? { ...day, icon: SKY_ICONS[skyOf(day.code)] } : null;
  });
  /** `3 people: Sami, Lina, Yassine`, each name isolated for Arabic. */
  protected readonly peopleLine = computed(() => {
    const people = this.store.activeTrip()?.people ?? [];
    const t = this.t().trips;
    const names = people.map((p) => `\u2068${p.name}\u2069`).join(t.separator);
    return names
      ? `${t.peopleCount(people.length)}: ${names}`
      : t.peopleCount(0);
  });
  protected readonly lastDay = computed(() => {
    const trip = this.store.activeTrip();
    return trip ? addDays(trip.start, trip.nights) : '';
  });

  /** Changes only when the trip, its place or its dates do. */
  private readonly forecastKey = computed(() => {
    const trip = this.store.activeTrip();
    return trip && trip.start <= addDays(today(), FORECAST_DAYS - 1)
      ? [trip.id, trip.campsite.lat, trip.campsite.lng, trip.start].join('|')
      : '';
  });

  constructor() {
    // The summary shows the weather when the trip is within forecast range.
    effect(() => {
      if (this.forecastKey()) {
        untracked(() => void this.store.loadForecast());
      }
    });
  }

  protected openNew(): void {
    this.editingId.set(null);
    this.draft.set({
      name: '',
      type: 'tent',
      start: addDays(today(), 7),
      nights: 2,
      campsite: { ...(this.store.activeTrip()?.campsite ?? DEFAULT_SITE) },
      people: [],
      notes: '',
    });
  }

  protected openEdit(trip: Trip): void {
    this.editingId.set(trip.id);
    this.draft.set({
      name: trip.name,
      type: trip.type,
      start: trip.start,
      nights: trip.nights,
      campsite: { ...trip.campsite },
      people: trip.people.map((p) => ({ ...p })),
      notes: trip.notes,
    });
  }

  protected patch(change: Partial<TripDraft>): void {
    const draft = this.draft();
    if (draft) this.draft.set({ ...draft, ...change });
  }

  protected addPerson(event?: Event): void {
    event?.preventDefault();
    const name = this.newPerson().trim();
    const draft = this.draft();
    if (!name || !draft) return;
    this.patch({ people: [...draft.people, { id: newId('p'), name }] });
    this.newPerson.set('');
  }

  protected removePerson(id: string): void {
    const draft = this.draft();
    if (draft) this.patch({ people: draft.people.filter((p) => p.id !== id) });
  }

  protected setSite(point: LatLng): void {
    const site = this.draft()?.campsite;
    if (site) this.patch({ campsite: { ...site, ...point } });
  }

  /** A searched place sets the point and, shortened, the name. */
  protected choosePlace(place: Place): void {
    const name = place.name.split(',').slice(0, 2).join(',').trim();
    this.patch({ campsite: { lat: place.lat, lng: place.lng, name } });
  }

  protected setSiteName(name: string): void {
    const site = this.draft()?.campsite;
    if (site) this.patch({ campsite: { ...site, name } });
  }

  protected async save(): Promise<void> {
    const draft = this.draft();
    if (!draft || !draft.name.trim()) return;
    // A name typed in the "add person" box counts, even without "Add".
    this.addPerson();
    const final = this.draft() ?? draft;
    const clean = {
      ...final,
      name: final.name.trim(),
      nights: Math.min(14, Math.max(1, Math.round(final.nights) || 1)),
    };
    const id = this.editingId();
    if (id) {
      await this.store.update(id, clean);
    } else {
      await this.store.create(clean);
    }
    this.draft.set(null);
  }

  protected async remove(trip: Trip): Promise<void> {
    if (confirm(this.t().trips.deleteConfirm(trip.name))) {
      await this.store.remove(trip.id);
    }
  }

  protected closeForm(open: boolean): void {
    if (!open) this.draft.set(null);
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
