import { Injectable, computed, inject, signal } from '@angular/core';
import {
  AutoSphereCmsService,
  type AmbientLightingOption,
  type FinanceSummary,
  type InteriorTrim,
  type InteriorUpholstery,
  type RangeSimulation,
  type VehicleColorway,
  type VehicleModel,
  type VehiclePackage,
  type VehicleTrim,
  type VehicleWheel,
  type VehicleReservationRequest,
  type VehicleReservationResponse,
} from '@ah/products/autosphere/domain';
import type { CameraPreset, LightingMode } from './three/autosphere-3d-scene';

export type ViewAngle = 'side' | 'three-quarters' | 'blueprint';
export type FinanceType = 'lease' | 'loan' | 'cash';
export type DrivingSpeedCycle = 'city' | 'mixed' | 'highway';

@Injectable({
  providedIn: 'root',
})
export class AutoSphereStore {
  private readonly cms = inject(AutoSphereCmsService);

  readonly availableModels = this.cms.availableModels;
  readonly isPreviewMode = this.cms.isPreviewMode;
  readonly cmsMetadata = this.cms.cmsMetadata;

  // Selected vehicle attributes
  readonly selectedModelSlug = signal<string>('gt-v');
  readonly selectedTrimId = signal<string>('performance-awd');
  readonly selectedColorId = signal<string>('monaco');
  readonly selectedWheelId = signal<string>('wheel-20');
  readonly selectedUpholsteryId = signal<string>('upholstery-nappa-black');
  readonly selectedInteriorTrimId = signal<string>('trim-carbon');
  readonly selectedAmbientLightId = signal<string>('ambient-cyan');
  readonly selectedPackageIds = signal<Set<string>>(new Set(['pilot-pack']));

  // 3D Viewport & Studio Settings
  readonly viewAngle = signal<ViewAngle>('three-quarters');
  readonly cameraPreset = signal<CameraPreset>('three-quarters');
  readonly lightingMode = signal<LightingMode>('daylight');
  readonly turntableSpin = signal<boolean>(true);
  readonly doorsOpen = signal<boolean>(false);
  readonly suspensionLift = signal<boolean>(false);
  readonly headlightsOn = signal<boolean>(true);
  readonly webGlEnabled = signal<boolean>(true);

  // Financial Configuration
  readonly financeType = signal<FinanceType>('lease');
  readonly leaseTermMonths = signal<24 | 36 | 48 | 60>(48);
  readonly downPaymentPercent = signal<number>(10);
  readonly downPaymentAmount = signal<number>(10000);

  // Range Simulation Parameters
  readonly ambientTemperatureC = signal<number>(20);
  readonly drivingSpeedCycle = signal<DrivingSpeedCycle>('mixed');
  readonly hvacActive = signal<boolean>(true);

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

  /** Active interior upholstery */
  readonly activeUpholstery = computed<InteriorUpholstery>(() => {
    const model = this.activeModel();
    const id = this.selectedUpholsteryId();
    return (
      model.interiorUpholsteries.find((u) => u.id === id) ??
      model.interiorUpholsteries[0]
    );
  });

  /** Active interior trim insert */
  readonly activeInteriorTrim = computed<InteriorTrim>(() => {
    const model = this.activeModel();
    const id = this.selectedInteriorTrimId();
    return (
      model.interiorTrims.find((t) => t.id === id) ?? model.interiorTrims[0]
    );
  });

  /** Active ambient cabin lighting */
  readonly activeAmbientLight = computed<AmbientLightingOption>(() => {
    const model = this.activeModel();
    const id = this.selectedAmbientLightId();
    return (
      model.ambientLightingOptions.find((a) => a.id === id) ??
      model.ambientLightingOptions[0]
    );
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
      this.activeUpholstery(),
      this.activeInteriorTrim(),
    );
  });

  /** Effective WLTP range accounting for wheel aerodynamic drag impact */
  readonly effectiveRangeKm = computed<number>(() => {
    const trimRange = this.activeTrim().wltpRangeKm;
    const wheelImpact = this.activeWheel().rangeImpactKm;
    return Math.max(100, trimRange + wheelImpact);
  });

  /** Real-world simulated range based on temperature & speed cycle */
  readonly rangeSimulation = computed<RangeSimulation>(() => {
    return this.cms.simulateRange(
      this.activeTrim(),
      this.activeWheel(),
      this.ambientTemperatureC(),
      this.drivingSpeedCycle(),
      this.hvacActive(),
    );
  });

  /** Computed financial calculations */
  readonly finance = computed<FinanceSummary>(() => {
    return this.cms.calculateFinance(
      this.totalPrice(),
      this.downPaymentPercent(),
      this.leaseTermMonths(),
    );
  });

  /** Serialized shareable deep-link URL */
  readonly shareableUrl = computed<string>(() => {
    const params = new URLSearchParams({
      model: this.selectedModelSlug(),
      trim: this.selectedTrimId(),
      color: this.selectedColorId(),
      wheel: this.selectedWheelId(),
      upholstery: this.selectedUpholsteryId(),
    });
    return `/apps/autosphere?${params.toString()}`;
  });

  selectModel(slug: string): void {
    const model = this.cms.getModelBySlug(slug);
    if (!model) return;

    this.selectedModelSlug.set(slug);
    this.selectedTrimId.set(model.trims[0].id);
    this.selectedColorId.set(model.colorways[0].id);
    this.selectedWheelId.set(model.wheels[0].id);
    this.selectedUpholsteryId.set(model.interiorUpholsteries[0]?.id ?? '');
    this.selectedInteriorTrimId.set(model.interiorTrims[0]?.id ?? '');
    this.selectedAmbientLightId.set(model.ambientLightingOptions[0]?.id ?? '');
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

  selectUpholstery(upholsteryId: string): void {
    this.selectedUpholsteryId.set(upholsteryId);
  }

  selectInteriorTrim(trimId: string): void {
    this.selectedInteriorTrimId.set(trimId);
  }

  selectAmbientLight(lightId: string): void {
    this.selectedAmbientLightId.set(lightId);
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
    if (angle === 'blueprint') {
      this.lightingMode.set('xray');
      this.cameraPreset.set('side');
    } else if (angle === 'side') {
      this.cameraPreset.set('side');
    } else {
      this.cameraPreset.set('three-quarters');
    }
  }

  setCameraPreset(preset: CameraPreset): void {
    this.cameraPreset.set(preset);
  }

  setLightingMode(mode: LightingMode): void {
    this.lightingMode.set(mode);
  }

  toggleTurntable(): void {
    this.turntableSpin.set(!this.turntableSpin());
  }

  toggleDoors(): void {
    const next = !this.doorsOpen();
    this.doorsOpen.set(next);
    this.suspensionLift.set(next);
  }

  toggleSuspension(): void {
    const next = !this.suspensionLift();
    this.suspensionLift.set(next);
    this.doorsOpen.set(next);
  }

  toggleHeadlights(): void {
    this.headlightsOn.set(!this.headlightsOn());
  }

  setFinanceType(type: FinanceType): void {
    this.financeType.set(type);
  }

  setLeaseTerm(months: 24 | 36 | 48 | 60): void {
    this.leaseTermMonths.set(months);
  }

  setDownPayment(percent: number): void {
    this.downPaymentPercent.set(percent);
  }

  setTemperature(tempC: number): void {
    this.ambientTemperatureC.set(tempC);
  }

  setDrivingSpeedCycle(cycle: DrivingSpeedCycle): void {
    this.drivingSpeedCycle.set(cycle);
  }

  toggleHvac(): void {
    this.hvacActive.set(!this.hvacActive());
  }

  togglePreviewMode(): void {
    this.cms.setPreviewMode(!this.isPreviewMode());
  }

  async syncFromContentful(): Promise<void> {
    return this.cms.syncFromContentful();
  }

  async submitReservation(
    payload: VehicleReservationRequest,
  ): Promise<VehicleReservationResponse> {
    return this.cms.submitReservation(payload);
  }
}
