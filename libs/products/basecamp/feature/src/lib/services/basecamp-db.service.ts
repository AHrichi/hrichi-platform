import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { APP_MODE } from '@ah/platform/app-mode';
import type { Forecast, GearItem, Trip } from '@ah/products/basecamp/domain';

const TRIPS = 'trips';
const GEAR = 'gear';
/** The last forecast per trip, so the weather shows without signal. */
const FORECASTS = 'forecasts';
type StoreName = typeof TRIPS | typeof GEAR | typeof FORECASTS;

/**
 * Trips, gear and forecasts live in IndexedDB, so Basecamp works at the
 * campsite without signal. The portfolio's demo uses its own database
 * (ADR-0002), so trying it never touches a real user's trips.
 */
@Injectable({ providedIn: 'root' })
export class BasecampDbService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly name =
    inject(APP_MODE, { optional: true }) === 'embedded-demo'
      ? 'ah-demo-basecamp'
      : 'basecamp_db_v1';
  private database: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    this.database ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const name of [TRIPS, GEAR, FORECASTS]) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: 'id' });
          }
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.database;
  }

  private async request<T>(
    storeName: StoreName,
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = run(
        db.transaction(storeName, mode).objectStore(storeName),
      );
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async all<T>(storeName: StoreName): Promise<T[]> {
    if (!this.isBrowser) return [];
    return (await this.request(storeName, 'readonly', (s) =>
      s.getAll(),
    )) as T[];
  }

  private async put(storeName: StoreName, value: unknown): Promise<void> {
    if (this.isBrowser) {
      await this.request(storeName, 'readwrite', (s) => s.put(value));
    }
  }

  private async remove(storeName: StoreName, id: string): Promise<void> {
    if (this.isBrowser) {
      await this.request(storeName, 'readwrite', (s) => s.delete(id));
    }
  }

  async trips(): Promise<Trip[]> {
    // Soonest first, the same on every load.
    return (await this.all<Trip>(TRIPS)).sort((a, b) =>
      a.start.localeCompare(b.start),
    );
  }

  saveTrip(trip: Trip): Promise<void> {
    return this.put(TRIPS, trip);
  }

  async deleteTrip(id: string): Promise<void> {
    await this.remove(TRIPS, id);
    await this.remove(FORECASTS, id);
  }

  async gear(): Promise<GearItem[]> {
    return (await this.all<GearItem>(GEAR)).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  saveGear(item: GearItem): Promise<void> {
    return this.put(GEAR, item);
  }

  deleteGear(id: string): Promise<void> {
    return this.remove(GEAR, id);
  }

  async forecast(tripId: string): Promise<Forecast | null> {
    if (!this.isBrowser) return null;
    const row = (await this.request(FORECASTS, 'readonly', (s) =>
      s.get(tripId),
    )) as (Forecast & { id: string }) | undefined;
    return row ?? null;
  }

  saveForecast(tripId: string, forecast: Forecast): Promise<void> {
    return this.put(FORECASTS, { ...forecast, id: tripId });
  }

  /** The trip last opened on this device, so a reload reopens it. */
  get lastTripId(): string | null {
    try {
      return this.isBrowser ? localStorage.getItem(this.activeKey) : null;
    } catch {
      return null;
    }
  }

  set lastTripId(id: string | null) {
    try {
      if (this.isBrowser && id) localStorage.setItem(this.activeKey, id);
    } catch {
      // Blocked storage: the first trip opens next time instead.
    }
  }

  private get activeKey(): string {
    return `${this.name}.active-trip`;
  }
}
