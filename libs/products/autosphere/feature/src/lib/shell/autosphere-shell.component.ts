import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  AhAccordionItem,
  AhButton,
  AhColorSwatch,
  type ColorSwatchItem,
  AhModal,
  AhTag,
} from '@ah/ui';
import {
  AutoSphereStore,
  type DrivingSpeedCycle,
  type FinanceType,
} from '../autosphere-store';
import type {
  AmbientLightingOption,
  InteriorTrim,
  InteriorUpholstery,
  VehiclePackage,
  VehicleTrim,
  VehicleWheel,
} from '@ah/products/autosphere/domain';
import {
  createAutoSphere3DScene,
  type AutoSphere3DController,
  type CameraPreset,
  type LightingMode,
} from '../three/autosphere-3d-scene';
import { AutoSphereI18n, type AutoSphereLanguage } from '../i18n';

export type ConfiguratorTab =
  | 'trims'
  | 'color'
  | 'wheels'
  | 'interior'
  | 'packages'
  | 'simulator'
  | 'finance'
  | 'specs';

@Component({
  selector: 'ah-autosphere-shell',
  imports: [
    CommonModule,
    RouterLink,
    AhAccordionItem,
    AhButton,
    AhColorSwatch,
    AhModal,
    AhTag,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './autosphere-shell.component.html',
  styleUrl: './autosphere-shell.component.scss',
})
export class AutoSphereShellComponent {
  protected readonly store = inject(AutoSphereStore);
  protected readonly i18n = inject(AutoSphereI18n);
  protected readonly t = this.i18n.t;
  private readonly destroyRef = inject(DestroyRef);

  protected readonly activeTab = signal<ConfiguratorTab>('trims');
  protected readonly orderModalOpen = signal<boolean>(false);
  protected readonly orderSubmitted = signal<boolean>(false);
  protected readonly copiedShareToast = signal<boolean>(false);
  protected readonly webGlActive = signal<boolean>(false);

  // Reference to 3D WebGL Canvas
  protected readonly webglCanvas =
    viewChild<ElementRef<HTMLCanvasElement>>('webglCanvas');
  private scene3DController: AutoSphere3DController | null = null;

  /** Models and configuration state from reactive store */
  protected readonly models = this.store.availableModels;
  protected readonly activeModel = this.store.activeModel;
  protected readonly activeTrim = this.store.activeTrim;
  protected readonly activeColor = this.store.activeColor;
  protected readonly activeWheel = this.store.activeWheel;
  protected readonly activeUpholstery = this.store.activeUpholstery;
  protected readonly activeInteriorTrim = this.store.activeInteriorTrim;
  protected readonly activeAmbientLight = this.store.activeAmbientLight;
  protected readonly activePackages = this.store.activePackages;
  protected readonly totalPrice = this.store.totalPrice;
  protected readonly effectiveRange = this.store.effectiveRangeKm;
  protected readonly rangeSimulation = this.store.rangeSimulation;
  protected readonly finance = this.store.finance;
  protected readonly financeType = this.store.financeType;
  protected readonly viewAngle = this.store.viewAngle;
  protected readonly isPreviewMode = this.store.isPreviewMode;
  protected readonly leaseTermMonths = this.store.leaseTermMonths;
  protected readonly downPaymentPercent = this.store.downPaymentPercent;
  protected readonly ambientTemperatureC = this.store.ambientTemperatureC;
  protected readonly drivingSpeedCycle = this.store.drivingSpeedCycle;
  protected readonly hvacActive = this.store.hvacActive;
  protected readonly cameraPreset = this.store.cameraPreset;
  protected readonly lightingMode = this.store.lightingMode;
  protected readonly turntableSpin = this.store.turntableSpin;
  protected readonly doorsOpen = this.store.doorsOpen;
  protected readonly headlightsOn = this.store.headlightsOn;
  protected readonly shareableUrl = this.store.shareableUrl;

  /** Convert domain colorways to AhColorSwatch items */
  protected readonly colorSwatchItems = computed<ColorSwatchItem[]>(() => {
    return this.activeModel().colorways.map((c) => ({
      id: c.id,
      name: c.name,
      hex: c.hex,
      accentHex: c.accentHex,
      finish: c.finish,
      priceLabel: c.priceLabel,
    }));
  });

  /** Technical specs list */
  protected readonly technicalSpecs = computed(() => {
    return this.activeModel().technicalSpecs;
  });

  constructor() {
    // Lazily mount Three.js WebGL 3D Studio on browser clients
    afterNextRender(() => {
      const canvasRef = this.webglCanvas();
      if (!canvasRef) return;

      try {
        const canvas = canvasRef.nativeElement;
        this.scene3DController = createAutoSphere3DScene(canvas, {
          modelSlug: this.activeModel().slug,
          colorHex: this.activeColor().hex,
          accentHex: this.activeColor().accentHex,
          finish: this.activeColor().finish,
          wheelStyle: this.activeWheel().style,
          upholsteryHex: this.activeUpholstery().hex,
          ambientLightHex: this.activeAmbientLight().hex,
          lightingMode: this.lightingMode(),
          cameraPreset: this.cameraPreset(),
          turntableSpin: this.turntableSpin(),
          doorsOpen: this.doorsOpen(),
          headlightsOn: this.headlightsOn(),
        });
        this.webGlActive.set(true);
      } catch (e) {
        console.warn('AutoSphere WebGL initialization skipped:', e);
        this.webGlActive.set(false);
      }
    });

    // Reactive effect synchronizing store signals with Three.js WebGL scene
    effect(() => {
      if (!this.scene3DController) return;

      this.scene3DController.update({
        modelSlug: this.activeModel().slug,
        colorHex: this.activeColor().hex,
        accentHex: this.activeColor().accentHex,
        finish: this.activeColor().finish,
        wheelStyle: this.activeWheel().style,
        upholsteryHex: this.activeUpholstery().hex,
        ambientLightHex: this.activeAmbientLight().hex,
        lightingMode: this.lightingMode(),
        cameraPreset: this.cameraPreset(),
        turntableSpin: this.turntableSpin(),
        doorsOpen: this.doorsOpen(),
        headlightsOn: this.headlightsOn(),
      });
    });

    // Effect for camera preset lerping
    effect(() => {
      if (!this.scene3DController) return;
      this.scene3DController.setCameraPreset(this.cameraPreset());
    });

    this.destroyRef.onDestroy(() => {
      this.scene3DController?.dispose();
    });
  }

  protected setTab(tab: ConfiguratorTab): void {
    this.activeTab.set(tab);
    if (tab === 'interior') {
      this.setCameraPreset('interior');
    } else if (tab === 'wheels') {
      this.setCameraPreset('wheels');
    } else if (tab === 'trims' || tab === 'color') {
      this.setCameraPreset('three-quarters');
    }
  }

  protected selectModel(slug: string): void {
    this.store.selectModel(slug);
  }

  protected selectTrim(trim: VehicleTrim): void {
    this.store.selectTrim(trim.id);
  }

  protected onColorChange(swatch: ColorSwatchItem): void {
    this.store.selectColor(swatch.id);
  }

  protected selectWheel(wheel: VehicleWheel): void {
    this.store.selectWheel(wheel.id);
  }

  protected selectUpholstery(upholstery: InteriorUpholstery): void {
    this.store.selectUpholstery(upholstery.id);
  }

  protected selectInteriorTrim(trim: InteriorTrim): void {
    this.store.selectInteriorTrim(trim.id);
  }

  protected selectAmbientLight(option: AmbientLightingOption): void {
    this.store.selectAmbientLight(option.id);
  }

  protected togglePackage(pkg: VehiclePackage): void {
    this.store.togglePackage(pkg.id);
  }

  protected setCameraPreset(preset: CameraPreset): void {
    this.store.setCameraPreset(preset);
  }

  protected setLightingMode(mode: LightingMode): void {
    this.store.setLightingMode(mode);
  }

  protected toggleTurntable(): void {
    this.store.toggleTurntable();
  }

  protected toggleDoors(): void {
    this.store.toggleDoors();
  }

  protected toggleHeadlights(): void {
    this.store.toggleHeadlights();
  }

  protected setFinanceType(type: FinanceType): void {
    this.store.setFinanceType(type);
  }

  protected setLeaseTerm(months: 24 | 36 | 48 | 60): void {
    this.store.setLeaseTerm(months);
  }

  protected setDownPayment(percent: number): void {
    this.store.setDownPayment(percent);
  }

  protected setTemperature(tempC: number): void {
    this.store.setTemperature(tempC);
  }

  protected setDrivingSpeedCycle(cycle: DrivingSpeedCycle): void {
    this.store.setDrivingSpeedCycle(cycle);
  }

  protected toggleHvac(): void {
    this.store.toggleHvac();
  }

  protected togglePreview(): void {
    this.store.togglePreviewMode();
  }

  protected openOrderModal(): void {
    this.orderSubmitted.set(false);
    this.orderModalOpen.set(true);
  }

  protected closeOrderModal(): void {
    this.orderModalOpen.set(false);
  }

  protected confirmOrder(): void {
    this.orderSubmitted.set(true);
  }

  protected isPackageSelected(id: string): boolean {
    return this.store.selectedPackageIds().has(id);
  }

  protected copyShareUrl(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(
        window.location.origin + this.shareableUrl(),
      );
      this.copiedShareToast.set(true);
      setTimeout(() => this.copiedShareToast.set(false), 2400);
    }
  }

  protected exportBuildJson(): void {
    const buildData = {
      model: this.activeModel().name,
      slug: this.activeModel().slug,
      trim: this.activeTrim().name,
      powertrain: this.activeTrim().powertrain,
      exteriorColor: this.activeColor().name,
      finish: this.activeColor().finish,
      wheels: this.activeWheel().name,
      interiorUpholstery: this.activeUpholstery().name,
      interiorTrim: this.activeInteriorTrim().name,
      ambientLighting: this.activeAmbientLight().name,
      installedPackages: this.activePackages().map((p) => p.name),
      cashPrice: this.totalPrice(),
      effectiveWltpRangeKm: this.effectiveRange(),
      financeSummary: this.finance(),
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(buildData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autosphere-${this.activeModel().slug}-${this.activeTrim().id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  protected selectLanguage(lang: AutoSphereLanguage): void {
    this.i18n.setLanguage(lang);
  }

  protected formatCurrency(amount: number): string {
    return this.i18n.formatCurrency(amount);
  }
}
