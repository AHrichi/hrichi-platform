import type { DayForecast } from './models';

/** Open-Meteo's forecast endpoint (free, no key, CC BY 4.0). */
export const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';
/** Open-Meteo forecasts up to 16 days ahead. */
export const FORECAST_DAYS = 16;

const DAILY = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
  'cloud_cover_mean',
] as const;

/** The request for a campsite's daily forecast, in its own time zone. */
export function forecastUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    latitude: lat.toFixed(3),
    longitude: lng.toFixed(3),
    daily: DAILY.join(','),
    timezone: 'auto',
    forecast_days: String(FORECAST_DAYS),
    wind_speed_unit: 'kmh',
  });
  return `${OPEN_METEO}?${params.toString()}`;
}

type Daily = Record<
  (typeof DAILY)[number] | 'time',
  (number | string | null)[]
>;

/** Days from Open-Meteo's `daily` block; days it left blank are dropped. */
export function parseForecast(json: unknown): DayForecast[] {
  const daily = (json as { daily?: Partial<Daily> } | null)?.daily;
  const time = daily?.time;
  if (!Array.isArray(time)) return [];
  const at = (key: (typeof DAILY)[number], i: number): number | null => {
    const value = daily?.[key]?.[i];
    return typeof value === 'number' ? value : null;
  };
  return time.flatMap((date, i) => {
    const max = at('temperature_2m_max', i);
    const min = at('temperature_2m_min', i);
    if (typeof date !== 'string' || max === null || min === null) return [];
    return [
      {
        date,
        code: at('weather_code', i) ?? 0,
        maxC: max,
        minC: min,
        rainMm: at('precipitation_sum', i) ?? 0,
        rainChance: at('precipitation_probability_max', i) ?? 0,
        windKmh: at('wind_speed_10m_max', i) ?? 0,
        gustKmh: at('wind_gusts_10m_max', i) ?? 0,
        cloudPct: at('cloud_cover_mean', i) ?? 0,
      },
    ];
  });
}

export type Sky =
  | 'clear'
  | 'partly'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'showers'
  | 'storm';

/** The WMO weather code's kind of sky. */
export function skyOf(code: number): Sky {
  if (code <= 1) return 'clear';
  if (code === 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 80 && code <= 82) return 'showers';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
}

export const SKY_ICONS: Record<Sky, string> = {
  clear: '☀️',
  partly: '⛅',
  cloudy: '☁️',
  fog: '🌫️',
  drizzle: '🌦️',
  rain: '🌧️',
  snow: '❄️',
  showers: '🌦️',
  storm: '⛈️',
};

export type WeatherWarning =
  'frost' | 'cold' | 'wind' | 'rain' | 'storm' | 'heat';

/** Gusts that bend tent poles and pull pegs: guy everything out. */
export const WINDY_GUST_KMH = 50;
/** Nights colder than this need a warm layer and a good sleeping bag. */
export const COLD_NIGHT_C = 5;

/** What a camper should be warned about, most serious first. */
export function warningsFor(day: DayForecast): WeatherWarning[] {
  const warnings: WeatherWarning[] = [];
  if (day.code >= 95) warnings.push('storm');
  if (day.gustKmh >= WINDY_GUST_KMH) warnings.push('wind');
  if (day.rainMm >= 10 || day.rainChance >= 70) warnings.push('rain');
  if (day.minC <= 0) warnings.push('frost');
  else if (day.minC < COLD_NIGHT_C) warnings.push('cold');
  if (day.maxC >= 35) warnings.push('heat');
  return warnings;
}

/** The forecast days that fall on the trip, nights plus the last morning. */
export function tripDays(
  days: readonly DayForecast[],
  start: string,
  nights: number,
): DayForecast[] {
  const end = addDays(start, nights);
  return days.filter((d) => d.date >= start && d.date <= end);
}

/** `YYYY-MM-DD` plus `n` days. */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
