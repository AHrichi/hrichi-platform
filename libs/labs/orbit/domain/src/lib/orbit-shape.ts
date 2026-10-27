import type { Omm } from './omm';

export type OrbitClass = 'LEO' | 'MEO' | 'GEO' | 'HEO';

export interface OrbitShape {
  semiMajorAxisKm: number;
  apogeeKm: number;
  perigeeKm: number;
  periodMinutes: number;
  orbitClass: OrbitClass;
}

/** WGS-84 equatorial radius, km. */
export const EARTH_RADIUS_KM = 6378.137;
/** Earth's gravitational parameter, km³/s². */
const MU = 398600.4418;

/**
 * Size and period from mean motion and eccentricity (two-body). Mirrors
 * OrbitShape in apps/orbit-api, so the lab and the API classify alike.
 */
export function orbitShape(elements: Omm): OrbitShape {
  const radiansPerSecond = (elements.MEAN_MOTION * 2 * Math.PI) / 86_400;
  const a = Math.cbrt(MU / (radiansPerSecond * radiansPerSecond));
  const e = elements.ECCENTRICITY;
  const apogeeKm = a * (1 + e) - EARTH_RADIUS_KM;
  const perigeeKm = a * (1 - e) - EARTH_RADIUS_KM;
  const periodMinutes = 1440 / elements.MEAN_MOTION;
  return {
    semiMajorAxisKm: a,
    apogeeKm,
    perigeeKm,
    periodMinutes,
    orbitClass: classify(e, apogeeKm, periodMinutes),
  };
}

function classify(
  eccentricity: number,
  apogeeKm: number,
  periodMinutes: number,
): OrbitClass {
  if (eccentricity > 0.25) {
    return 'HEO';
  }
  if (apogeeKm < 2_000) {
    return 'LEO';
  }
  if (periodMinutes > 1_380 && periodMinutes < 1_500) {
    return 'GEO';
  }
  return 'MEO';
}

export const orbitClasses: readonly OrbitClass[] = ['LEO', 'MEO', 'GEO', 'HEO'];

export const orbitClassNames: Record<OrbitClass, string> = {
  LEO: 'Low Earth orbit',
  MEO: 'Medium Earth orbit',
  GEO: 'Geosynchronous',
  HEO: 'Highly elliptical',
};
