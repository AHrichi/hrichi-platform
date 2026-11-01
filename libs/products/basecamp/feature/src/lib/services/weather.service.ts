import { Injectable } from '@angular/core';
import {
  type Forecast,
  forecastUrl,
  parseForecast,
} from '@ah/products/basecamp/domain';

/** Open-Meteo's daily forecast for a point (free, no key, CC BY 4.0). */
@Injectable({ providedIn: 'root' })
export class WeatherService {
  /** The forecast, or null when the service can't be reached. */
  async forecast(lat: number, lng: number): Promise<Forecast | null> {
    try {
      const response = await fetch(forecastUrl(lat, lng));
      if (!response.ok) return null;
      const days = parseForecast(await response.json());
      return days.length
        ? { lat, lng, fetchedAt: new Date().toISOString(), days }
        : null;
    } catch {
      return null;
    }
  }
}
