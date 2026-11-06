import { Injectable, computed, signal } from '@angular/core';
import { AUTOSPHERE_MODELS } from './mock-cms-catalog';
import type {
  ConfiguratorState,
  FinanceSummary,
  VehicleColorway,
  VehicleModel,
  VehiclePackage,
  VehicleTrim,
  VehicleWheel,
} from './model';

/**
 * Service providing typed access to Contentful Headless CMS entries
 * with full support for Contentful Live Preview mode and finance calculations.
 */
@Injectable({
  providedIn: 'root',
})
export class AutoSphereCmsService {
  /** Raw models store */
  private readonly models = signal<VehicleModel[]>(AUTOSPHERE_MODELS);

  /** Active preview mode toggle (Draft / Preview API vs Published / Delivery API) */
  readonly isPreviewMode = signal<boolean>(false);

  /** Public list of available vehicle models */
  readonly availableModels = computed(() => this.models());

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
  ): number {
    const packagesTotal = packages.reduce((sum, p) => sum + p.priceDelta, 0);
    return (
      model.basePrice +
      trim.priceDelta +
      color.priceDelta +
      wheel.priceDelta +
      packagesTotal
    );
  }

  /**
   * Calculates monthly lease payments based on total price, down payment, and term.
   */
  calculateFinance(
    cashPrice: number,
    downPaymentPercent = 10,
    termMonths: 36 | 48 | 60 = 48,
    annualRate = 0.039,
  ): FinanceSummary {
    const downPayment = Math.round(cashPrice * (downPaymentPercent / 100));
    const residualValuePercent =
      termMonths === 36 ? 0.55 : termMonths === 48 ? 0.45 : 0.38;
    const residualValue = cashPrice * residualValuePercent;

    const depreciation = (cashPrice - downPayment - residualValue) / termMonths;
    const monthlyFinanceCharge =
      ((cashPrice - downPayment + residualValue) / 2) * (annualRate / 12);
    const monthlyLease = Math.max(
      0,
      Math.round(depreciation + monthlyFinanceCharge),
    );

    return {
      cashPrice,
      downPayment,
      termMonths,
      monthlyLease,
      annualInterestRate: annualRate * 100,
      estimatedDeliveryWeeks: 6,
    };
  }
}
