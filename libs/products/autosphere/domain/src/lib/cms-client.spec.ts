import { describe, expect, it, beforeEach } from 'vitest';
import { AutoSphereCmsService } from './cms-client';

describe('AutoSphereCmsService', () => {
  let service: AutoSphereCmsService;

  beforeEach(() => {
    service = new AutoSphereCmsService();
  });

  it('retrieves vehicle models by slug', () => {
    const model = service.getModelBySlug('gt-v');
    expect(model).toBeDefined();
    expect(model?.name).toBe('AutoSphere GT-V');
    expect(model?.trims.length).toBeGreaterThanOrEqual(2);
  });

  it('correctly calculates total configured price', () => {
    const model = service.getModelBySlug('gt-v')!;
    const trim = model.trims[1]; // Performance AWD (+14,200)
    const color = model.colorways[1]; // Monaco Blue (+1,250)
    const wheel = model.wheels[1]; // 21" V-Spoke (+2,100)
    const packages = [model.packages[0]]; // Pilot pack (+3,900)

    const total = service.calculateTotalPrice(
      model,
      trim,
      color,
      wheel,
      packages,
    );
    const expected = 84900 + 14200 + 1250 + 2100 + 3900;
    expect(total).toBe(expected);
  });

  it('computes accurate monthly leasing payments', () => {
    const finance = service.calculateFinance(100000, 10, 48, 0.039);
    expect(finance.cashPrice).toBe(100000);
    expect(finance.downPayment).toBe(10000);
    expect(finance.termMonths).toBe(48);
    expect(finance.monthlyLease).toBeGreaterThan(500);
  });

  it('supports toggling Contentful preview mode', () => {
    expect(service.isPreviewMode()).toBe(false);
    service.setPreviewMode(true);
    expect(service.isPreviewMode()).toBe(true);
  });
});
