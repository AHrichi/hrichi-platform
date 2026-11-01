import type { DayForecast } from './models';
import {
  addDays,
  forecastUrl,
  parseForecast,
  skyOf,
  tripDays,
  warningsFor,
} from './weather';

const day = (over: Partial<DayForecast>): DayForecast => ({
  date: '2026-11-05',
  code: 1,
  maxC: 20,
  minC: 10,
  rainMm: 0,
  rainChance: 0,
  windKmh: 10,
  gustKmh: 20,
  cloudPct: 10,
  ...over,
});

describe('Weather', () => {
  it('asks Open-Meteo for the campsite in its own time zone', () => {
    const url = new URL(forecastUrl(36.7766, 8.6874));
    expect(url.origin).toBe('https://api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('36.777');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('daily')).toContain('cloud_cover_mean');
  });

  it('reads the daily block and drops days left blank', () => {
    const days = parseForecast({
      daily: {
        time: ['2026-11-05', '2026-11-06'],
        weather_code: [61, null],
        temperature_2m_max: [17.2, 18],
        temperature_2m_min: [6.1, null],
        precipitation_sum: [12.4, 0],
        precipitation_probability_max: [90, 0],
        wind_speed_10m_max: [22, 0],
        wind_gusts_10m_max: [55, 0],
        cloud_cover_mean: [95, 0],
      },
    });
    expect(days).toEqual([
      {
        date: '2026-11-05',
        code: 61,
        maxC: 17.2,
        minC: 6.1,
        rainMm: 12.4,
        rainChance: 90,
        windKmh: 22,
        gustKmh: 55,
        cloudPct: 95,
      },
    ]);
    expect(parseForecast(null)).toEqual([]);
    expect(parseForecast({ error: true })).toEqual([]);
  });

  it('maps WMO codes to the sky', () => {
    expect([0, 2, 3, 45, 53, 63, 73, 81, 95].map(skyOf)).toEqual([
      'clear',
      'partly',
      'cloudy',
      'fog',
      'drizzle',
      'rain',
      'snow',
      'showers',
      'storm',
    ]);
  });

  it('warns about storms, wind, rain, frost, cold and heat', () => {
    expect(warningsFor(day({}))).toEqual([]);
    expect(
      warningsFor(day({ code: 95, gustKmh: 60, rainMm: 15, minC: -2 })),
    ).toEqual(['storm', 'wind', 'rain', 'frost']);
    expect(warningsFor(day({ minC: 3, maxC: 36 }))).toEqual(['cold', 'heat']);
  });

  it('keeps the days of the trip: its nights and the last morning', () => {
    const days = [4, 5, 6, 7, 8].map((d) => day({ date: `2026-11-0${d}` }));
    expect(tripDays(days, '2026-11-05', 2).map((d) => d.date)).toEqual([
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
    ]);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
