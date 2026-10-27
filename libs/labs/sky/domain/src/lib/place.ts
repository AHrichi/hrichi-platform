import type { City } from './cities';

/** Where the sky is seen from. */
export interface Place {
  name: string;
  /** Degrees, north positive. */
  lat: number;
  /** Degrees, east positive. */
  lon: number;
  /** IANA zone for local times, or null for the viewer's own zone. */
  timeZone: string | null;
}

export function placeFromCity(city: City): Place {
  return {
    name: `${city.name}, ${city.country}`,
    lat: city.lat,
    lon: city.lon,
    timeZone: city.timeZone,
  };
}

/** A spot picked on the globe or from the browser's location. */
export function placeAt(lat: number, lon: number, name?: string): Place {
  return {
    name: name ?? formatCoordinates(lat, lon),
    lat,
    lon,
    timeZone: null,
  };
}

/** `36.81° N, 10.18° E` */
export function formatCoordinates(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}° ${ns}, ${Math.abs(lon).toFixed(2)}° ${ew}`;
}

export interface SkyLink {
  lat: number;
  lon: number;
  /** The moment to show, or null for now. */
  at: Date | null;
}

/** Reads `?lat=…&lon=…&at=…`; anything missing or out of range is ignored. */
export function parseSkyLink(search: string): SkyLink | null {
  const params = new URLSearchParams(search);
  const lat = Number.parseFloat(params.get('lat') ?? '');
  const lon = Number.parseFloat(params.get('lon') ?? '');
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  ) {
    return null;
  }
  const at = params.get('at');
  const time = at ? new Date(at) : null;
  return {
    lat,
    lon,
    at: time && !Number.isNaN(time.getTime()) ? time : null,
  };
}

/** The query string that reopens this sky: about 1 km of precision is enough. */
export function skyLink(place: Place, at: Date | null): string {
  const params = new URLSearchParams({
    lat: place.lat.toFixed(2),
    lon: place.lon.toFixed(2),
  });
  if (at) {
    params.set('at', at.toISOString().slice(0, 16) + 'Z');
  }
  return `?${params.toString()}`;
}
