import type { Omm } from './omm';
import type { OrbitClass } from './orbit-shape';

export type SatelliteGroup =
  'stations' | 'starlink' | 'gnss' | 'weather' | 'other';

export const satelliteGroups: readonly SatelliteGroup[] = [
  'stations',
  'starlink',
  'gnss',
  'weather',
  'other',
];

export const groupNames: Record<SatelliteGroup, string> = {
  stations: 'Space stations',
  starlink: 'Starlink',
  gnss: 'Navigation',
  weather: 'Weather',
  other: 'Everything else',
};

const station = /^(ISS|CSS) \(/;
const navigation =
  /\b(GPS|NAVSTAR|GALILEO|GSAT0|BEIDOU|COSMOS|GLONASS|QZS|IRNSS)\b/;
const weather =
  /\b(NOAA|METOP|METEOR|GOES|FENGYUN|HIMAWARI|METEOSAT|DMSP|SUOMI|JPSS|ELEKTRO|GK-?2A)\b/;

/** Mirrors SatelliteGroup.classify in apps/orbit-api. */
export function groupOf(elements: Omm, orbitClass: OrbitClass): SatelliteGroup {
  const name = (elements.OBJECT_NAME ?? '').toUpperCase();
  if (station.test(name)) {
    return 'stations';
  }
  if (name.startsWith('STARLINK')) {
    return 'starlink';
  }
  if (orbitClass !== 'LEO' && navigation.test(name)) {
    return 'gnss';
  }
  if (weather.test(name)) {
    return 'weather';
  }
  return 'other';
}
