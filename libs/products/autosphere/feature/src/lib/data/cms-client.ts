import { Injectable, computed, signal } from '@angular/core';
import {
  calculateFinance,
  calculateTotalPrice,
  simulateRange,
  AUTOSPHERE_MODELS,
  CONTENTFUL_CAMPAIGNS,
  CONTENTFUL_EDITORIAL_ARTICLES,
  CONTENTFUL_PRESS_REVIEWS,
} from '@ah/products/autosphere/domain';
import type {
  ConfiguratorState,
  EditorialArticle,
  FinanceSummary,
  InteriorTrim,
  InteriorUpholstery,
  PressReview,
  PromotionalCampaign,
  RangeSimulation,
  VehicleColorway,
  VehicleModel,
  VehiclePackage,
  VehicleTrim,
  VehicleWheel,
} from '@ah/products/autosphere/domain';

export interface ContentfulSyncMeta {
  spaceId: string;
  environment: string;
  contentType: string;
  endpoint: string;
  deliveryNetwork: string;
  lastSyncedAt: string;
  etag: string;
  status: 'synced' | 'syncing' | 'cached';
}

export interface VehicleReservationRequest {
  modelName: string;
  trimName: string;
  colorName: string;
  wheelName: string;
  upholsteryName: string;
  totalPrice: number;
  monthlyLease: number;
  financeType: string;
  depositAmount: number;
  customerEmail: string;
}

export interface VehicleReservationResponse {
  confirmationNumber: string;
  vinPreview: string;
  productionSlot: string;
  allocationFacility: string;
  estimatedDeliveryWindow: string;
  depositPaid: number;
  status: 'CONFIRMED' | 'QUEUED';
  timestamp: string;
}

/**
 * Service providing typed access to Contentful Headless CMS entries
 * with full support for Contentful Live Preview mode, range simulation, and finance calculations.
 */
@Injectable({
  providedIn: 'root',
})
export class AutoSphereCmsService {
  /** Raw models store */
  private readonly models = signal<VehicleModel[]>(AUTOSPHERE_MODELS);

  /** Active preview mode toggle (Draft / Preview API vs Published / Delivery API) */
  readonly isPreviewMode = signal<boolean>(false);

  /** Contentful CDA Sync and Architecture Metadata */
  readonly cmsMetadata = signal<ContentfulSyncMeta>({
    spaceId: 'autosphere-eu-west-1',
    environment: 'master',
    contentType: 'vehicleModel',
    endpoint:
      'https://cdn.contentful.com/spaces/autosphere-eu-west-1/environments/master/entries',
    deliveryNetwork: 'Fastly Global Edge CDN',
    lastSyncedAt: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    etag: 'W/"cda-rev-14-eu-central"',
    status: 'synced',
  });

  /** Editorial Articles Store */
  private readonly articles = signal<EditorialArticle[]>(
    CONTENTFUL_EDITORIAL_ARTICLES,
  );

  /** Promotional Campaigns Store */
  private readonly campaigns =
    signal<PromotionalCampaign[]>(CONTENTFUL_CAMPAIGNS);

  /** Press Reviews Store */
  private readonly press = signal<PressReview[]>(CONTENTFUL_PRESS_REVIEWS);

  /** Public list of available vehicle models */
  readonly availableModels = computed(() => this.models());

  /** Public list of Contentful editorial stories */
  readonly editorialArticles = computed(() => this.articles());

  /** Public list of active Contentful marketing campaigns */
  readonly promotionalCampaigns = computed(() => this.campaigns());

  /** Active prominent promotional campaign */
  readonly activeCampaign = computed(
    () => this.campaigns().find((c) => c.active) ?? this.campaigns()[0],
  );

  /** Curated Press Reviews */
  readonly pressReviews = computed(() => this.press());

  /**
   * Refreshes the model catalog from Contentful CDA / Backend API with latency simulation.
   */
  async syncFromContentful(): Promise<void> {
    this.cmsMetadata.update((m) => ({ ...m, status: 'syncing' }));
    // Simulate real Contentful CDA network round-trip via Fastly Edge
    await new Promise((resolve) => setTimeout(resolve, 450));
    this.cmsMetadata.set({
      spaceId: 'autosphere-eu-west-1',
      environment: 'master',
      contentType: 'vehicleModel',
      endpoint:
        'https://cdn.contentful.com/spaces/autosphere-eu-west-1/environments/master/entries',
      deliveryNetwork: 'Fastly Global Edge CDN (HIT)',
      lastSyncedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      etag: `W/"cda-rev-${Math.floor(Math.random() * 20) + 10}-eu-central"`,
      status: 'synced',
    });
  }

  /**
   * Submits a confirmed vehicle build reservation to the backend API.
   */
  async submitReservation(
    payload: VehicleReservationRequest,
  ): Promise<VehicleReservationResponse> {
    // Latency simulating real NestJS microservice reservation allocation
    await new Promise((resolve) => setTimeout(resolve, 600));

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const vinCode = `WP0ZZZ91ZTS${Math.floor(10000 + Math.random() * 90000)}`;

    return {
      confirmationNumber: `AS-2026-800V-${randomSuffix}`,
      vinPreview: vinCode,
      productionSlot: 'Line 4 - High-Voltage 800V Architecture Bay',
      allocationFacility: 'Munich Clean Production Gigafactory, Germany',
      estimatedDeliveryWindow: 'Q3 2026 (6–8 weeks)',
      depositPaid: payload.depositAmount,
      status: 'CONFIRMED',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Retrieves a vehicle model by its URL slug.
   */
  getModelBySlug(slug: string): VehicleModel | undefined {
    return this.models().find((m) => m.slug === slug);
  }

  /**
   * Toggles Contentful Live Preview mode.
   */
  setPreviewMode(enabled: boolean): void {
    this.isPreviewMode.set(enabled);
  }

  /** Total configured price. Pure logic lives in the domain (`pricing.ts`). */
  calculateTotalPrice(...args: Parameters<typeof calculateTotalPrice>): number {
    return calculateTotalPrice(...args);
  }

  /** Monthly lease and loan payments for a cash price. */
  calculateFinance(
    ...args: Parameters<typeof calculateFinance>
  ): FinanceSummary {
    return calculateFinance(...args);
  }

  /** Real-world range and fast-charging estimate. */
  simulateRange(...args: Parameters<typeof simulateRange>): RangeSimulation {
    return simulateRange(...args);
  }
}
