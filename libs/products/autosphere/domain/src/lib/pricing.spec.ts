import { describe, expect, it } from 'vitest';
import { AUTOSPHERE_MODELS } from './mock-cms-catalog';
import {
  calculateFinance,
  calculateTotalPrice,
  simulateRange,
} from './pricing';

const gtv = AUTOSPHERE_MODELS.find((m) => m.slug === 'gt-v')!;

describe('calculateTotalPrice', () => {
  it('adds every configured delta to the base price', () => {
    const total = calculateTotalPrice(
      gtv,
      gtv.trims[1],
      gtv.colorways[1],
      gtv.wheels[1],
      [gtv.packages[0]],
    );
    expect(total).toBe(
      gtv.basePrice +
        gtv.trims[1].priceDelta +
        gtv.colorways[1].priceDelta +
        gtv.wheels[1].priceDelta +
        gtv.packages[0].priceDelta,
    );
  });

  it('includes optional interior choices', () => {
    const base = calculateTotalPrice(
      gtv,
      gtv.trims[0],
      gtv.colorways[0],
      gtv.wheels[0],
      [],
    );
    const withInterior = calculateTotalPrice(
      gtv,
      gtv.trims[0],
      gtv.colorways[0],
      gtv.wheels[0],
      [],
      { priceDelta: 500 } as never,
      { priceDelta: 250 } as never,
    );
    expect(withInterior - base).toBe(750);
  });
});

describe('calculateFinance', () => {
  it('derives down payment and residual from the term', () => {
    const finance = calculateFinance(100000, 10, 48, 0.039);
    expect(finance.downPayment).toBe(10000);
    expect(finance.residualValue).toBe(45000);
    expect(finance.monthlyLease).toBeGreaterThan(500);
    expect(finance.monthlyLoan).toBeGreaterThan(1500);
  });

  it('charges no loan when nothing is financed', () => {
    expect(calculateFinance(10000, 100).monthlyLoan).toBe(0);
  });
});

describe('simulateRange', () => {
  it('loses range in cold weather at highway speed', () => {
    const mild = simulateRange(gtv.trims[0], gtv.wheels[0], 20, 'mixed');
    const winter = simulateRange(gtv.trims[0], gtv.wheels[0], -10, 'highway');
    expect(winter.simulatedRangeKm).toBeLessThan(mild.simulatedRangeKm);
    expect(winter.temperatureImpactPercent).toBeLessThan(0);
    expect(mild.temperatureImpactPercent).toBe(0);
  });
});
