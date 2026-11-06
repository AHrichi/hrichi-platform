import { Injectable, computed, inject, signal } from '@angular/core';
import {
  AutoSphereCmsService,
  type FinanceSummary,
  type VehicleColorway,
  type VehicleModel,
  type VehiclePackage,
  type VehicleTrim,
  type VehicleWheel,
} from '@ah/products/autosphere/domain';

export type ViewAngle = 'side' | 'three-quarters' | 'blueprint';

@Injectable({
  providedIn: 'root',
})
export class AutoSphereStore {
  private readonly cms = inject(AutoSphereCmsService);

  readonly availableModels = this.cms.availableModels;
  readonly isPreviewMode = this.cms.isPreviewMode;

  readonly selectedModelSlug = signal<string>('gt-v');
  readonly selectedTrimId = signal<string>('performance-awd');
  readonly selectedColorId = signal<string>('monaco');
  readonly selectedWheelId = signal<string>('wheel-20');
  readonly selectedPackageIds = signal<Set<string>>(new Set(['pilot-pack']));
  readonly viewAngle = signal<ViewAngle>('three-quarters');
  readonly leaseTermMonths = signal<36 | 48 | 60>(48);
  readonly downPaymentPercent = signal<number>(10);

  /** Active vehicle model resolved from CMS */
  readonly activeModel = computed<VehicleModel>(() => {
    const slug = this.selectedModelSlug();
    const found = this.cms.getModelBySlug(slug);
    return found ?? this.availableModels()[0];
  });

  /** Active trim level */
  readonly activeTrim = computed<VehicleTrim>(() => {
    const model = this.activeModel();
    const trimId = this.selectedTrimId();
    return model.trims.find((t) => t.id === trimId) ?? model.trims[0];
  });

  /** Active exterior colorway */
  readonly activeColor = computed<VehicleColorway>(() => {
    const model = this.activeModel();
    const colorId = this.selectedColorId();
    return model.colorways.find((c) => c.id === colorId) ?? model.colorways[0];
  });

  /** Active wheel specification */
  readonly activeWheel = computed<VehicleWheel>(() => {
    const model = this.activeModel();
    const wheelId = this.selectedWheelId();
    return model.wheels.find((w) => w.id === wheelId) ?? model.wheels[0];
  });

  /** Active optional equipment packages */
  readonly activePackages = computed<VehiclePackage[]>(() => {
    const model = this.activeModel();
    const selectedIds = this.selectedPackageIds();
    return model.packages.filter((pkg) => selectedIds.has(pkg.id));
  });

  /** Computed total configured cash price */
  readonly totalPrice = computed<number>(() => {
    return this.cms.calculateTotalPrice(
      this.activeModel(),
      this.activeTrim(),
      this.activeColor(),
      this.activeWheel(),
      this.activePackages(),
    );
  });

  /** Effective WLTP range accounting for wheel aerodynamic drag impact */
  readonly effectiveRangeKm = computed<number>(() => {
    const trimRange = this.activeTrim().wltpRangeKm;
    const wheelImpact = this.activeWheel().rangeImpactKm;
    return Math.max(100, trimRange + wheelImpact);
  });

  /** Computed financial calculations */
  readonly finance = computed<FinanceSummary>(() => {
    return this.cms.calculateFinance(
      this.totalPrice(),
      this.downPaymentPercent(),
      this.leaseTermMonths(),
    );
  });

  selectModel(slug: string): void {
    const model = this.cms.getModelBySlug(slug);
    if (!model) return;

    this.selectedModelSlug.set(slug);
    this.selectedTrimId.set(model.trims[0].id);
    this.selectedColorId.set(model.colorways[0].id);
    this.selectedWheelId.set(model.wheels[0].id);
    this.selectedPackageIds.set(new Set());
  }

  selectTrim(trimId: string): void {
    this.selectedTrimId.set(trimId);
  }

  selectColor(colorId: string): void {
    this.selectedColorId.set(colorId);
  }

  selectWheel(wheelId: string): void {
    this.selectedWheelId.set(wheelId);
  }

  togglePackage(packageId: string): void {
    const current = new Set(this.selectedPackageIds());
    if (current.has(packageId)) {
      current.delete(packageId);
    } else {
      current.add(packageId);
    }
    this.selectedPackageIds.set(current);
  }

  setViewAngle(angle: ViewAngle): void {
    this.viewAngle.set(angle);
  }

  setLeaseTerm(months: 36 | 48 | 60): void {
    this.leaseTermMonths.set(months);
  }

  setDownPayment(percent: number): void {
    this.downPaymentPercent.set(percent);
  }

  togglePreviewMode(): void {
    this.cms.setPreviewMode(!this.isPreviewMode());
  }
}
