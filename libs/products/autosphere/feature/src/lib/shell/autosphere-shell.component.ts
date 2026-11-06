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
  ContentfulRichTextNode,
  EditorialArticle,
  InteriorTrim,
  InteriorUpholstery,
  PressReview,
  PromotionalCampaign,
  VehiclePackage,
  VehicleTrim,
  VehicleWheel,
  VehicleReservationRequest,
  VehicleReservationResponse,
} from '@ah/products/autosphere/domain';
import {
  createAutoSphere3DScene,
  type AutoSphere3DController,
  type CameraPreset,
  type LightingMode,
} from '../three/autosphere-3d-scene';
import { AutoSphereI18n, type AutoSphereLanguage } from '../i18n';
import { APP_MODE } from '@ah/platform/app-mode';

export type ConfiguratorTab =
  | 'trims'
  | 'color'
  | 'wheels'
  | 'interior'
  | 'packages'
  | 'simulator'
  | 'finance'
  | 'specs'
  | 'editorial';

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
  protected readonly isEmbedded =
    inject(APP_MODE, { optional: true }) === 'embedded-demo';
  private readonly destroyRef = inject(DestroyRef);

  protected readonly activeTab = signal<ConfiguratorTab>('trims');
  protected readonly orderModalOpen = signal<boolean>(false);
  protected readonly orderSubmitted = signal<boolean>(false);
  protected readonly copiedShareToast = signal<boolean>(false);
  protected readonly webGlActive = signal<boolean>(false);
  protected readonly isSyncingCms = signal<boolean>(false);
  protected readonly cmsSyncToast = signal<boolean>(false);
  protected readonly isSubmittingOrder = signal<boolean>(false);
  protected readonly reservationConfirmation =
    signal<VehicleReservationResponse | null>(null);
  protected readonly customerEmail = signal<string>(
    'recruiter@wynwood-tech.de',
  );
  protected readonly cmsMetadata = this.store.cmsMetadata;
  protected readonly editorialArticles = this.store.editorialArticles;
  protected readonly activeCampaign = this.store.activeCampaign;
  protected readonly pressReviews = this.store.pressReviews;
  protected readonly activeArticleModal = signal<EditorialArticle | null>(null);
  protected readonly activeCmsAstModal = signal<{
    title: string;
    json: string;
  } | null>(null);
  protected readonly campaignDetailsModal = signal<boolean>(false);
  protected readonly selectedArticleTag = signal<string>('All');

  // Reference to 3D WebGL Canvas
  protected readonly webglCanvas =
    viewChild<ElementRef<HTMLCanvasElement>>('webglCanvas');
  protected readonly scene3DController = signal<AutoSphere3DController | null>(
    null,
  );

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
  protected readonly suspensionLift = this.store.suspensionLift;
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
        const ctrl = createAutoSphere3DScene(canvas, {
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
          suspensionLift: this.suspensionLift(),
          headlightsOn: this.headlightsOn(),
        });
        this.scene3DController.set(ctrl);
        this.webGlActive.set(true);
      } catch (e) {
        console.warn('AutoSphere WebGL initialization skipped:', e);
        this.webGlActive.set(false);
      }
    });

    // Reactive effect synchronizing store signals with Three.js WebGL scene
    let lastPreset: CameraPreset | null = null;
    effect(() => {
      const ctrl = this.scene3DController();

      // Read ALL signals unconditionally so Angular tracks every dependency!
      const modelSlug = this.activeModel().slug;
      const colorHex = this.activeColor().hex;
      const accentHex = this.activeColor().accentHex;
      const finish = this.activeColor().finish;
      const wheelStyle = this.activeWheel().style;
      const upholsteryHex = this.activeUpholstery().hex;
      const ambientLightHex = this.activeAmbientLight().hex;
      const lightingMode = this.lightingMode();
      const cameraPreset = this.cameraPreset();
      const turntableSpin = this.turntableSpin();
      const doorsOpen = this.doorsOpen();
      const suspensionLift = this.suspensionLift();
      const headlightsOn = this.headlightsOn();

      if (!ctrl) return;

      ctrl.update({
        modelSlug,
        colorHex,
        accentHex,
        finish,
        wheelStyle,
        upholsteryHex,
        ambientLightHex,
        lightingMode,
        cameraPreset,
        turntableSpin,
        doorsOpen,
        suspensionLift,
        headlightsOn,
      });

      if (cameraPreset !== lastPreset) {
        lastPreset = cameraPreset;
        ctrl.setCameraPreset(cameraPreset);
      }
    });

    this.destroyRef.onDestroy(() => {
      this.scene3DController()?.dispose();
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

  protected toggleSuspension(): void {
    this.store.toggleSuspension();
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

  protected async syncCms(): Promise<void> {
    this.isSyncingCms.set(true);
    await this.store.syncFromContentful();
    this.isSyncingCms.set(false);
    this.cmsSyncToast.set(true);
    setTimeout(() => this.cmsSyncToast.set(false), 2600);
  }

  protected openOrderModal(): void {
    this.orderSubmitted.set(false);
    this.reservationConfirmation.set(null);
    this.orderModalOpen.set(true);
  }

  protected closeOrderModal(): void {
    this.orderModalOpen.set(false);
  }

  protected async confirmOrder(): Promise<void> {
    this.isSubmittingOrder.set(true);
    try {
      const res = await this.store.submitReservation({
        modelName: this.activeModel().name,
        trimName: this.activeTrim().name,
        colorName: this.activeColor().name,
        wheelName: this.activeWheel().name,
        upholsteryName: this.activeUpholstery().name,
        totalPrice: this.totalPrice(),
        monthlyLease: this.finance().monthlyLease,
        financeType: this.financeType(),
        depositAmount: 500,
        customerEmail: this.customerEmail(),
      });
      this.reservationConfirmation.set(res);
      this.orderSubmitted.set(true);
    } finally {
      this.isSubmittingOrder.set(false);
    }
  }

  protected isPackageSelected(id: string): boolean {
    return this.store.selectedPackageIds().has(id);
  }

  protected openArticle(article: EditorialArticle): void {
    this.activeArticleModal.set(article);
  }

  protected closeArticleModal(): void {
    this.activeArticleModal.set(null);
  }

  protected inspectCmsAst(title: string, data: unknown): void {
    this.activeCmsAstModal.set({
      title,
      json: JSON.stringify(data, null, 2),
    });
  }

  protected closeCmsAstModal(): void {
    this.activeCmsAstModal.set(null);
  }

  protected openCampaignDetails(): void {
    this.campaignDetailsModal.set(true);
  }

  protected closeCampaignDetails(): void {
    this.campaignDetailsModal.set(false);
  }

  protected setArticleTag(tag: string): void {
    this.selectedArticleTag.set(tag);
  }

  protected filteredArticles = computed(() => {
    const tag = this.selectedArticleTag();
    if (tag === 'All') return this.editorialArticles();
    return this.editorialArticles().filter(
      (a) => a.category === tag || a.tags.includes(tag),
    );
  });

  protected getNodeText(node: ContentfulRichTextNode): string {
    if (node.value) return node.value;
    if (node.content && node.content.length > 0) {
      return node.content.map((c) => this.getNodeText(c)).join(' ');
    }
    return '';
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

  protected onLanguageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target?.value) {
      this.selectLanguage(target.value as AutoSphereLanguage);
    }
  }

  protected formatCurrency(amount: number): string {
    return this.i18n.formatCurrency(amount);
  }
}
