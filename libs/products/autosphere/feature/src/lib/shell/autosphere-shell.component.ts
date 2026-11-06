import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
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
import { AutoSphereStore, type ViewAngle } from '../autosphere-store';
import type {
  VehicleColorway,
  VehicleModel,
  VehiclePackage,
  VehicleTrim,
  VehicleWheel,
} from '@ah/products/autosphere/domain';

export type ConfiguratorTab =
  'trims' | 'color' | 'wheels' | 'packages' | 'specs';

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

  protected readonly activeTab = signal<ConfiguratorTab>('trims');
  protected readonly orderModalOpen = signal<boolean>(false);
  protected readonly orderSubmitted = signal<boolean>(false);

  /** Models and configuration state */
  protected readonly models = this.store.availableModels;
  protected readonly activeModel = this.store.activeModel;
  protected readonly activeTrim = this.store.activeTrim;
  protected readonly activeColor = this.store.activeColor;
  protected readonly activeWheel = this.store.activeWheel;
  protected readonly activePackages = this.store.activePackages;
  protected readonly totalPrice = this.store.totalPrice;
  protected readonly effectiveRange = this.store.effectiveRangeKm;
  protected readonly finance = this.store.finance;
  protected readonly viewAngle = this.store.viewAngle;
  protected readonly isPreviewMode = this.store.isPreviewMode;
  protected readonly leaseTermMonths = this.store.leaseTermMonths;
  protected readonly downPaymentPercent = this.store.downPaymentPercent;

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

  protected setTab(tab: ConfiguratorTab): void {
    this.activeTab.set(tab);
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

  protected togglePackage(pkg: VehiclePackage): void {
    this.store.togglePackage(pkg.id);
  }

  protected setViewAngle(angle: ViewAngle): void {
    this.store.setViewAngle(angle);
  }

  protected togglePreview(): void {
    this.store.togglePreviewMode();
  }

  protected setLeaseTerm(months: 36 | 48 | 60): void {
    this.store.setLeaseTerm(months);
  }

  protected setDownPayment(percent: number): void {
    this.store.setDownPayment(percent);
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

  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
