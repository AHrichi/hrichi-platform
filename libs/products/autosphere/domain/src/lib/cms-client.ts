import { Injectable, computed, signal } from '@angular/core';
import {
  AUTOSPHERE_MODELS,
  CONTENTFUL_CAMPAIGNS,
  CONTENTFUL_EDITORIAL_ARTICLES,
  CONTENTFUL_PRESS_REVIEWS,
} from './mock-cms-catalog';
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
} from './model';

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

  /**
   * Computes the total vehicle price based on user configuration.
   */
  calculateTotalPrice(
    model: VehicleModel,
    trim: VehicleTrim,
    color: VehicleColorway,
    wheel: VehicleWheel,
    packages: VehiclePackage[],
    upholstery?: InteriorUpholstery,
    interiorTrim?: InteriorTrim,
  ): number {
    const packagesTotal = packages.reduce((sum, p) => sum + p.priceDelta, 0);
    const upholsteryDelta = upholstery?.priceDelta ?? 0;
    const trimDelta = interiorTrim?.priceDelta ?? 0;

    return (
      model.basePrice +
      trim.priceDelta +
      color.priceDelta +
      wheel.priceDelta +
      packagesTotal +
      upholsteryDelta +
      trimDelta
    );
  }

  /**
   * Calculates monthly lease and loan payments based on total price, down payment, and term.
   */
  calculateFinance(
    cashPrice: number,
    downPaymentPercent = 10,
    termMonths: 24 | 36 | 48 | 60 = 48,
    annualRate = 0.039,
  ): FinanceSummary {
    const downPayment = Math.round(cashPrice * (downPaymentPercent / 100));
    const residualFactor =
      termMonths === 24
        ? 0.65
        : termMonths === 36
          ? 0.55
          : termMonths === 48
            ? 0.45
            : 0.38;
    const residualValue = Math.round(cashPrice * residualFactor);

    // Lease monthly calculation (depreciation + money factor)
    const depreciation = (cashPrice - downPayment - residualValue) / termMonths;
    const monthlyFinanceCharge =
      ((cashPrice - downPayment + residualValue) / 2) * (annualRate / 12);
    const monthlyLease = Math.max(
      0,
      Math.round(depreciation + monthlyFinanceCharge),
    );

    // Standard auto loan amortization (P * r * (1+r)^n / ((1+r)^n - 1))
    const financedPrincipal = Math.max(0, cashPrice - downPayment);
    const monthlyInterestRate = annualRate / 12;
    const compoundFactor = Math.pow(1 + monthlyInterestRate, termMonths);
    const monthlyLoan =
      financedPrincipal > 0
        ? Math.round(
            (financedPrincipal * monthlyInterestRate * compoundFactor) /
              (compoundFactor - 1),
          )
        : 0;

    const totalCostOfOwnership = Math.round(
      downPayment + monthlyLease * termMonths,
    );

    return {
      cashPrice,
      downPayment,
      termMonths,
      monthlyLease,
      monthlyLoan,
      annualInterestRate: Math.round(annualRate * 1000) / 10,
      residualValue,
      totalCostOfOwnership,
      estimatedDeliveryWeeks: 6,
    };
  }

  /**
   * Simulates real-world EV battery range and 800V fast-charging throughput
   * accounting for ambient temperature, driving cycle/speed, and HVAC energy draw.
   */
  simulateRange(
    trim: VehicleTrim,
    wheel: VehicleWheel,
    ambientTempC = 20,
    drivingSpeed: 'city' | 'mixed' | 'highway' = 'mixed',
    acHeatingOn = true,
  ): RangeSimulation {
    const baseWltp = Math.max(100, trim.wltpRangeKm + wheel.rangeImpactKm);

    // Temperature efficiency curve (optimal between 18°C and 24°C)
    let tempFactor = 1.0;
    if (ambientTempC < 18) {
      // Sub-zero / cold loss due to battery internal impedance
      tempFactor -= Math.min(0.25, ((18 - ambientTempC) * 0.8) / 100);
      if (acHeatingOn) tempFactor -= 0.05; // PTC cabin heater draw
    } else if (ambientTempC > 24) {
      // AC cooling draw
      tempFactor -= Math.min(0.12, ((ambientTempC - 24) * 0.6) / 100);
      if (acHeatingOn) tempFactor -= 0.04;
    }

    // Driving speed / aerodynamics impact
    const speedFactor =
      drivingSpeed === 'city' ? 1.12 : drivingSpeed === 'mixed' ? 1.0 : 0.78;

    const simulatedRangeKm = Math.round(baseWltp * tempFactor * speedFactor);
    const consumptionKwhPer100Km = Number(
      ((trim.batteryCapacityKwh / simulatedRangeKm) * 100).toFixed(1),
    );

    // 800V ultra-fast charging calculation
    // High-power 320 kW to 350 kW 800V architecture charges 10% to 80% (70% capacity)
    const kwhTo80 = trim.batteryCapacityKwh * 0.7;
    const avgChargingPowerKw = Math.min(trim.chargingRateKw * 0.75, 270);
    const fastCharge10to80Min = Math.round((kwhTo80 / avgChargingPowerKw) * 60);
    // Range added in 10 minutes
    const kwhIn10Min = avgChargingPowerKw * (10 / 60);
    const rangeAdded10MinKm = Math.round(
      kwhIn10Min / (consumptionKwhPer100Km / 100),
    );

    return {
      simulatedRangeKm,
      wltpBaseRangeKm: baseWltp,
      consumptionKwhPer100Km,
      temperatureImpactPercent: Math.round((tempFactor - 1) * 100),
      speedImpactPercent: Math.round((speedFactor - 1) * 100),
      fastCharge10to80Min,
      rangeAdded10MinKm,
    };
  }
}
