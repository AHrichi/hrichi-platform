import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AhButton, AhEmptyState } from '@ah/ui';
import {
  addDays,
  FORECAST_DAYS,
  SKY_ICONS,
  skyOf,
  warningsFor,
} from '@ah/products/basecamp/domain';
import { BasecampI18n } from '../../i18n/basecamp-i18n';
import { BasecampStore, today } from '../../store/basecamp.store';

/** The campsite's forecast, day by day, with what to watch for. */
@Component({
  selector: 'bc-weather-screen',
  imports: [AhButton, AhEmptyState, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './weather-screen.html',
  styleUrl: './weather-screen.scss',
})
export class WeatherScreen {
  protected readonly store = inject(BasecampStore);
  protected readonly i18n = inject(BasecampI18n);
  protected readonly t = this.i18n.t;

  protected readonly days = computed(() =>
    this.store.forecastDays().map((day) => {
      const sky = skyOf(day.code);
      return { ...day, sky, icon: SKY_ICONS[sky], warnings: warningsFor(day) };
    }),
  );

  /** Why no day shows: the trip is too far ahead, or over. */
  protected readonly gap = computed<
    { kind: 'far'; from: string } | { kind: 'past' } | null
  >(() => {
    const trip = this.store.activeTrip();
    if (!trip || this.days().length) return null;
    if (addDays(trip.start, trip.nights) < today()) return { kind: 'past' };
    if (trip.start > addDays(today(), FORECAST_DAYS - 1)) {
      return { kind: 'far', from: addDays(trip.start, -(FORECAST_DAYS - 1)) };
    }
    return null;
  });

  protected readonly asOf = computed(() => {
    const at = this.store.forecast()?.fetchedAt;
    return at ? this.i18n.time(new Date(at)) : null;
  });

  private readonly tripId = computed(() => this.store.activeTrip()?.id);

  constructor() {
    effect(() => {
      if (this.tripId()) {
        untracked(() => void this.store.loadForecast());
      }
    });
  }
}
