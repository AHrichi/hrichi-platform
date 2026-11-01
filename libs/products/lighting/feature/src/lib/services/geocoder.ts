import { Injectable } from '@angular/core';

export interface Place {
  name: string;
  lat: number;
  lng: number;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';

/**
 * Place search and reverse lookup with OpenStreetMap's Nominatim (free, no
 * key). Its usage policy allows about one request a second, so LuxPath only
 * asks when the user searches or sets a project's point, never as they type.
 */
@Injectable({ providedIn: 'root' })
export class Geocoder {
  async search(query: string, language: string): Promise<Place[]> {
    const url = new URL(`${NOMINATIM}/search`);
    url.search = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      limit: '5',
      'accept-language': language,
    }).toString();
    const results = (await this.get(url)) as {
      display_name: string;
      lat: string;
      lon: string;
    }[];
    return (results ?? []).map((r) => ({
      name: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }));
  }

  /** A short name for a point (street and town), or null. */
  async reverse(
    lat: number,
    lng: number,
    language: string,
  ): Promise<string | null> {
    const url = new URL(`${NOMINATIM}/reverse`);
    url.search = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'jsonv2',
      zoom: '17',
      'accept-language': language,
    }).toString();
    const r = (await this.get(url)) as {
      address?: Record<string, string>;
      display_name?: string;
    } | null;
    const a = r?.address;
    if (!a) return r?.display_name ?? null;
    const street = a['road'] ?? a['pedestrian'] ?? a['neighbourhood'];
    const town = a['city'] ?? a['town'] ?? a['village'] ?? a['suburb'];
    return [street, town].filter(Boolean).join(', ') || r?.display_name || null;
  }

  private async get(url: URL): Promise<unknown> {
    try {
      const response = await fetch(url);
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  }
}
