import { inject, Injectable, signal } from '@angular/core';
import { SiteConfigService } from '@ah/shared/site-config';
import type {
  Order,
  Driver,
  SubcontractorPlant,
  LinenSKU,
  WhatsAppMessage,
} from '@ah/products/dispatch/domain';
import type { CurrentDispatchUser } from '../store/dispatch.state';

export interface BackendQuotaStatus {
  orders: { current: number; max: number; pct: number };
  drivers: { current: number; max: number; pct: number };
  plants: { current: number; max: number; pct: number };
  stock: { current: number; max: number; pct: number };
  messages: { current: number; max: number; pct: number };
  status: 'safe' | 'warning' | 'near_limit';
}

@Injectable({ providedIn: 'root' })
export class DispatchApiService {
  private readonly siteConfig = inject(SiteConfigService);

  readonly isConnected = signal(false);
  readonly isSyncing = signal(false);
  readonly lastError = signal<string | null>(null);
  readonly quota = signal<BackendQuotaStatus | null>(null);

  private cachedBaseUrl: string | null = null;

  async getBaseUrl(): Promise<string> {
    if (this.cachedBaseUrl) return this.cachedBaseUrl;
    try {
      const config = await this.siteConfig.load();
      this.cachedBaseUrl =
        config.apiUrl ||
        (typeof window !== 'undefined' &&
        window.location.hostname === 'localhost'
          ? 'http://localhost:3000'
          : 'https://ahmed-hrichi-api.onrender.com');
    } catch {
      this.cachedBaseUrl = 'https://ahmed-hrichi-api.onrender.com';
    }
    return this.cachedBaseUrl;
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs = 6000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  private getAuthHeaders(user?: CurrentDispatchUser | null): HeadersInit {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    if (user?.token) {
      headers['authorization'] = `Bearer ${user.token}`;
    }
    return headers;
  }

  // --- HEALTH & QUOTA CHECK ---

  async checkConnectionAndQuota(): Promise<BackendQuotaStatus | null> {
    this.isSyncing.set(true);
    try {
      const base = await this.getBaseUrl();
      const res = await this.fetchWithTimeout(
        `${base}/api/dispatch/admin/quota`,
        {
          method: 'GET',
        },
      );

      if (res.ok) {
        const data: BackendQuotaStatus = await res.json();
        this.quota.set(data);
        this.isConnected.set(true);
        this.lastError.set(null);
        return data;
      }
      this.isConnected.set(false);
      return null;
    } catch {
      this.isConnected.set(false);
      return null;
    } finally {
      this.isSyncing.set(false);
    }
  }

  // --- AUTHENTICATION ---

  async login(
    email: string,
    pass: string,
  ): Promise<{ token: string; user: CurrentDispatchUser } | null> {
    try {
      const base = await this.getBaseUrl();
      const res = await this.fetchWithTimeout(
        `${base}/api/dispatch/auth/login`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password: pass }),
        },
      );

      if (res.ok) {
        const body = await res.json();
        return {
          token: body.token,
          user: {
            ...body.user,
            token: body.token,
          },
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async seedDemoUsers(): Promise<boolean> {
    try {
      const base = await this.getBaseUrl();
      const res = await this.fetchWithTimeout(
        `${base}/api/dispatch/auth/seed-demo-users`,
        { method: 'POST' },
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  // --- DATA SYNC ---

  async fetchAllRemoteData(user?: CurrentDispatchUser): Promise<{
    orders: Order[];
    drivers: Driver[];
    plants: SubcontractorPlant[];
    stock: LinenSKU[];
  } | null> {
    try {
      const base = await this.getBaseUrl();
      const headers = this.getAuthHeaders(user);

      const [ordersRes, driversRes, plantsRes, stockRes] = await Promise.all([
        this.fetchWithTimeout(`${base}/api/dispatch/orders`, { headers }),
        this.fetchWithTimeout(`${base}/api/dispatch/drivers`, { headers }),
        this.fetchWithTimeout(`${base}/api/dispatch/plants`, { headers }),
        this.fetchWithTimeout(`${base}/api/dispatch/stock`, { headers }),
      ]);

      if (ordersRes.ok && driversRes.ok && plantsRes.ok && stockRes.ok) {
        this.isConnected.set(true);
        return {
          orders: await ordersRes.json(),
          drivers: await driversRes.json(),
          plants: await plantsRes.json(),
          stock: await stockRes.json(),
        };
      }
      return null;
    } catch {
      this.isConnected.set(false);
      return null;
    }
  }

  // --- CREATE / MUTATE WITH CLOUD BACKEND ---

  async syncOrder(order: Order, user?: CurrentDispatchUser): Promise<boolean> {
    try {
      const base = await this.getBaseUrl();
      const res = await this.fetchWithTimeout(`${base}/api/dispatch/orders`, {
        method: 'POST',
        headers: this.getAuthHeaders(user),
        body: JSON.stringify(order),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async deleteOrder(id: string, user?: CurrentDispatchUser): Promise<boolean> {
    try {
      const base = await this.getBaseUrl();
      const res = await this.fetchWithTimeout(
        `${base}/api/dispatch/orders/${id}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(user),
        },
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  async syncDriver(
    driver: Driver,
    user?: CurrentDispatchUser,
  ): Promise<boolean> {
    try {
      const base = await this.getBaseUrl();
      const res = await this.fetchWithTimeout(`${base}/api/dispatch/drivers`, {
        method: 'POST',
        headers: this.getAuthHeaders(user),
        body: JSON.stringify(driver),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async syncPlant(
    plant: SubcontractorPlant,
    user?: CurrentDispatchUser,
  ): Promise<boolean> {
    try {
      const base = await this.getBaseUrl();
      const res = await this.fetchWithTimeout(`${base}/api/dispatch/plants`, {
        method: 'POST',
        headers: this.getAuthHeaders(user),
        body: JSON.stringify(plant),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async syncStock(
    item: LinenSKU,
    user?: CurrentDispatchUser,
  ): Promise<boolean> {
    try {
      const base = await this.getBaseUrl();
      const res = await this.fetchWithTimeout(`${base}/api/dispatch/stock`, {
        method: 'POST',
        headers: this.getAuthHeaders(user),
        body: JSON.stringify(item),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async seedRemoteSampleData(): Promise<boolean> {
    try {
      const base = await this.getBaseUrl();
      const res = await this.fetchWithTimeout(
        `${base}/api/dispatch/admin/seed-sample-data`,
        { method: 'POST' },
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  async clearRemoteData(): Promise<boolean> {
    try {
      const base = await this.getBaseUrl();
      const res = await this.fetchWithTimeout(
        `${base}/api/dispatch/admin/clear-data`,
        { method: 'POST' },
      );
      return res.ok;
    } catch {
      return false;
    }
  }
}
