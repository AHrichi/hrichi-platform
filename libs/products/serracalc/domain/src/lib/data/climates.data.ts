import type { ClimatePreset, MonthClimate } from '../models/serra.models';

function months(
  tMin: readonly number[],
  tMax: readonly number[],
  radiation: readonly number[],
  rain: readonly number[],
): MonthClimate[] {
  return tMin.map((t, i) => ({
    tMinC: t,
    tMaxC: tMax[i],
    radiationMj: radiation[i],
    rainMm: rain[i],
  }));
}

/**
 * Typical monthly normals (about 1991–2020) for greenhouse regions, rounded.
 * Temperatures are station means; radiation is global on the horizontal.
 * They size a plant, they don't replace a site's own records: the screens
 * say so, and a later phase fetches normals for any place (Open-Meteo).
 */
export const CLIMATES: readonly ClimatePreset[] = [
  {
    id: 'tunis',
    name: 'Tunis',
    country: 'TN',
    latitude: 36.83,
    longitude: 10.23,
    elevationM: 4,
    designWinterC: 4,
    designSummerC: 37,
    designSummerRhPct: 30,
    peakRadiationWm2: 920,
    months: months(
      [7.4, 7.7, 9.2, 11.4, 15.0, 19.0, 22.0, 22.8, 20.6, 17.0, 12.3, 8.9],
      [16.3, 17.0, 19.2, 21.9, 26.2, 30.9, 33.8, 34.0, 30.5, 26.4, 21.0, 17.4],
      [8.5, 11.5, 15.5, 19.5, 23.5, 26.5, 27, 24, 18.5, 13.5, 9.5, 7.5],
      [59, 55, 47, 38, 23, 10, 3, 9, 54, 54, 59, 66],
    ),
  },
  {
    id: 'monastir',
    name: 'Monastir',
    country: 'TN',
    latitude: 35.76,
    longitude: 10.75,
    elevationM: 3,
    designWinterC: 5,
    designSummerC: 35,
    designSummerRhPct: 40,
    peakRadiationWm2: 930,
    months: months(
      [7.9, 8.2, 9.9, 12.3, 15.8, 19.6, 22.4, 23.4, 21.3, 17.6, 12.9, 9.4],
      [16.7, 17.5, 19.4, 21.9, 25.4, 29.4, 32.3, 33.0, 30.3, 26.6, 21.7, 17.9],
      [9, 12, 16, 20, 24, 26.5, 27, 24, 19, 14, 10, 8],
      [37, 31, 33, 24, 15, 4, 1, 6, 41, 52, 36, 37],
    ),
  },
  {
    id: 'sfax',
    name: 'Sfax',
    country: 'TN',
    latitude: 34.72,
    longitude: 10.68,
    elevationM: 21,
    designWinterC: 3,
    designSummerC: 36,
    designSummerRhPct: 38,
    peakRadiationWm2: 940,
    months: months(
      [6.4, 7.1, 9.3, 11.9, 15.4, 19.1, 21.6, 22.6, 21.0, 17.3, 12.0, 7.9],
      [17.3, 18.4, 20.5, 22.9, 26.4, 29.9, 32.5, 33.1, 30.6, 27.1, 22.4, 18.5],
      [9.5, 12.5, 16.5, 20.5, 24, 26.5, 27, 24, 19, 14.5, 10.5, 8.5],
      [21, 17, 27, 18, 12, 3, 1, 6, 32, 36, 23, 19],
    ),
  },
  {
    id: 'gabes',
    name: 'Gabès',
    country: 'TN',
    latitude: 33.88,
    longitude: 10.1,
    elevationM: 4,
    designWinterC: 4,
    designSummerC: 37,
    designSummerRhPct: 35,
    peakRadiationWm2: 950,
    months: months(
      [6.4, 7.6, 10.1, 12.9, 16.5, 20.1, 22.4, 23.1, 21.5, 17.6, 12.0, 7.7],
      [16.8, 18.5, 21.3, 24.2, 27.6, 30.7, 33.0, 33.6, 31.3, 27.6, 22.3, 18.0],
      [10, 13, 17, 21, 24.5, 26.5, 27, 24.5, 19.5, 15, 11, 9],
      [23, 16, 20, 11, 8, 1, 0, 2, 13, 30, 22, 20],
    ),
  },
  {
    id: 'kebili',
    name: 'Kebili',
    country: 'TN',
    latitude: 33.7,
    longitude: 8.97,
    elevationM: 40,
    designWinterC: 0,
    designSummerC: 44,
    designSummerRhPct: 15,
    peakRadiationWm2: 980,
    months: months(
      [3.5, 5.2, 8.6, 12.4, 16.8, 21.0, 23.6, 23.5, 20.6, 15.6, 9.2, 4.6],
      [17.0, 19.6, 23.3, 27.0, 31.6, 36.4, 39.6, 38.9, 34.3, 28.8, 22.6, 18.0],
      [11, 14, 18, 22, 25, 27.5, 28, 25.5, 20.5, 16, 12, 10],
      [12, 7, 12, 8, 5, 1, 0, 2, 6, 10, 10, 9],
    ),
  },
  {
    id: 'tozeur',
    name: 'Tozeur',
    country: 'TN',
    latitude: 33.92,
    longitude: 8.11,
    elevationM: 87,
    designWinterC: 1,
    designSummerC: 45,
    designSummerRhPct: 13,
    peakRadiationWm2: 980,
    months: months(
      [4.5, 6.2, 9.5, 13.2, 17.7, 22.2, 24.9, 24.7, 21.5, 16.4, 10.0, 5.6],
      [16.6, 19.2, 22.8, 26.6, 31.3, 36.4, 39.9, 39.2, 34.2, 28.5, 22.0, 17.4],
      [11, 14, 18, 22, 25, 27.5, 28, 25.5, 20.5, 16, 12, 10],
      [13, 7, 13, 9, 6, 2, 0, 2, 7, 11, 11, 10],
    ),
  },
  {
    id: 'almeria',
    name: 'Almería',
    country: 'ES',
    latitude: 36.84,
    longitude: -2.36,
    elevationM: 21,
    designWinterC: 7,
    designSummerC: 33,
    designSummerRhPct: 45,
    peakRadiationWm2: 930,
    months: months(
      [8.7, 9.2, 10.9, 12.6, 15.5, 19.0, 21.8, 22.6, 20.5, 16.8, 12.6, 9.9],
      [16.9, 17.3, 19.4, 21.2, 23.8, 27.6, 30.4, 31.0, 28.6, 24.8, 20.6, 17.9],
      [9.5, 12.5, 16.5, 20.5, 24, 26.5, 26.5, 23.5, 18.5, 14, 10, 8.5],
      [26, 23, 20, 21, 12, 4, 1, 3, 13, 25, 30, 29],
    ),
  },
  {
    id: 'agadir',
    name: 'Agadir',
    country: 'MA',
    latitude: 30.38,
    longitude: -9.57,
    elevationM: 23,
    designWinterC: 5,
    designSummerC: 34,
    designSummerRhPct: 35,
    peakRadiationWm2: 950,
    months: months(
      [7.9, 9.5, 11.6, 12.9, 14.8, 16.9, 18.4, 18.8, 17.6, 15.6, 12.2, 9.0],
      [20.4, 21.2, 22.8, 23.0, 24.0, 25.4, 27.0, 27.4, 27.2, 26.6, 24.0, 21.4],
      [11.5, 14.5, 18.5, 22, 24, 24.5, 24, 22, 19, 15.5, 12, 10.5],
      [41, 33, 26, 15, 3, 0, 0, 1, 5, 23, 41, 47],
    ),
  },
  {
    id: 'de_bilt',
    name: 'De Bilt',
    country: 'NL',
    latitude: 52.1,
    longitude: 5.18,
    elevationM: 2,
    designWinterC: -8,
    designSummerC: 30,
    designSummerRhPct: 40,
    peakRadiationWm2: 850,
    months: months(
      [0.8, 0.6, 2.4, 4.6, 8.2, 11.1, 13.2, 12.9, 10.4, 7.4, 4.1, 1.6],
      [6.3, 7.3, 10.7, 14.8, 18.5, 21.2, 23.3, 22.9, 19.6, 15.0, 10.2, 6.9],
      [2.3, 4.3, 7.9, 12.8, 16.4, 17.5, 17.0, 14.6, 10.3, 6.0, 3.0, 1.8],
      [70, 63, 58, 41, 55, 68, 78, 82, 77, 81, 80, 82],
    ),
  },
];

export const DEFAULT_CLIMATE_ID = 'monastir';

/** A preset by id; the default when the id is unknown (an old backup). */
export function climateById(id: string): ClimatePreset {
  return (
    CLIMATES.find((c) => c.id === id) ??
    (CLIMATES.find((c) => c.id === DEFAULT_CLIMATE_ID) as ClimatePreset)
  );
}

/** Days in each month of a common year. */
export const MONTH_DAYS: readonly number[] = [
  31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
];
