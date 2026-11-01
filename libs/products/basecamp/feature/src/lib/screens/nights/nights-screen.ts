import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AhButton, AhEmptyState, AhProgressBar } from '@ah/ui';
import { APP_MODE } from '@ah/platform/app-mode';
import { BasecampI18n } from '../../i18n/basecamp-i18n';
import { skyLabLink } from '../../nights/night-plan';
import { BasecampStore } from '../../store/basecamp.store';

const MOON_ICONS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

/**
 * Each night at the campsite, worked out on the phone: dark hours, the
 * Moon, meteor showers and a stargazing score, lowered by forecast clouds.
 */
@Component({
  selector: 'bc-nights-screen',
  imports: [AhButton, AhEmptyState, AhProgressBar, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nights-screen.html',
  styleUrl: './nights-screen.scss',
})
export class NightsScreen {
  protected readonly store = inject(BasecampStore);
  protected readonly i18n = inject(BasecampI18n);
  protected readonly t = this.i18n.t;
  /** The Sky lab is part of the portfolio, so its link shows only there. */
  protected readonly inPortfolio =
    inject(APP_MODE, { optional: true }) === 'embedded-demo';

  protected readonly nights = computed(() => {
    const trip = this.store.activeTrip();
    const best = this.store.bestNight();
    const clouds = new Map(
      (this.store.forecast()?.days ?? []).map((d) => [d.date, d.cloudPct]),
    );
    if (!trip) return [];
    return this.store.nights().map((night) => ({
      ...night,
      best: night === best && this.store.nights().length > 1,
      moonIcon: MOON_ICONS[night.moonPhase],
      cloudPct: clouds.get(night.date) ?? null,
      darkHours: night.darkMinutes / 60,
      moonFreeHours: night.moonFreeMinutes / 60,
      skyParams: Object.fromEntries(
        new URL(
          skyLabLink(trip.campsite.lat, trip.campsite.lng, night),
          'https://sky',
        ).searchParams,
      ),
    }));
  });

  protected variant(score: number): 'success' | 'warning' | 'danger' {
    return score >= 60 ? 'success' : score >= 30 ? 'warning' : 'danger';
  }
}
