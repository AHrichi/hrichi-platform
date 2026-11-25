import type { HeatLossParams } from '../models/serra.models';
import { DEFAULT_CONTEXT, defaultAnnualHeating } from './defaults';
import { annualHeating, heatLoss } from './heating';

const house: HeatLossParams = {
  floorAreaM2: 1000,
  coverAreaM2: 1400,
  volumeM3: 4500,
  perimeterM: 140,
  cover: 'pe_double',
  uValue: 4,
  airChangesPerHour: 1,
  perimeterInsulated: false,
  screen: 'clear',
  screenSavingPct: 25,
  insideC: 16,
  outsideDesignC: 4,
  screenClosed: false,
  marginPct: 10,
};

describe('Peak heating load', () => {
  it('adds cover, air leakage and footing losses', () => {
    const r = heatLoss(house);
    expect(r.deltaT).toBe(12);
    // U·A·ΔT = 4 × 1400 × 12
    expect(r.transmissionW).toBe(67200);
    // 1.2 × 1005 / 3600 × 1 × 4500 × 12
    expect(r.infiltrationW).toBe(Math.round(((1.2 * 1005) / 3600) * 4500 * 12));
    // 1.4 W/m·K × 140 m × 12
    expect(r.perimeterW).toBe(2352);
    expect(r.totalW).toBe(r.transmissionW + r.infiltrationW + r.perimeterW);
    expect(r.wPerM2).toBe(Math.round(r.totalW / 1000));
    expect(r.designKw).toBeCloseTo((r.totalW * 1.1) / 1000, 1);
  });

  it('counts a closed screen against the cover and the leaks', () => {
    const open = heatLoss(house);
    const closed = heatLoss({ ...house, screenClosed: true });
    expect(closed.transmissionW).toBe(Math.round(open.transmissionW * 0.75));
    expect(closed.perimeterW).toBe(open.perimeterW);
    expect(closed.uEffective).toBe(3);
  });

  it('needs no heat when outside is warmer than the set point', () => {
    const r = heatLoss({ ...house, outsideDesignC: 20 });
    expect(r.totalW).toBe(0);
    expect(r.notes.map((n) => n.code)).toContain('heat.noLoad');
  });
});

describe('A year of heating', () => {
  it('heats only in the cool months on the Tunisian coast', () => {
    const r = annualHeating(defaultAnnualHeating(DEFAULT_CONTEXT));
    expect(r.months).toHaveLength(12);
    // July and August need nothing.
    expect(r.months[6].totalKwh).toBe(0);
    expect(r.months[7].totalKwh).toBe(0);
    // January is the peak, and nights carry it.
    expect(r.peakMonth).toBe(0);
    expect(r.months[0].nightKwh).toBeGreaterThan(r.months[0].dayKwh);
    expect(r.annualKwh).toBe(r.months.reduce((sum, m) => sum + m.totalKwh, 0));
    // A Mediterranean house: tens of kWh per m², not hundreds.
    expect(r.kwhPerM2).toBeGreaterThan(15);
    expect(r.kwhPerM2).toBeLessThan(120);
  });

  it('turns the heat into fuel, money and CO₂', () => {
    const p = defaultAnnualHeating(DEFAULT_CONTEXT);
    const r = annualHeating(p);
    const m3 = r.annualKwh / (9.77 * 0.9);
    expect(r.fuelUnit).toBe('m3');
    expect(r.fuelUnits).toBe(Math.round(m3));
    expect(r.cost).toBe(Math.round(m3 * p.fuelPrice));
    expect(r.co2Kg).toBe(Math.round(m3 * 1.96));
  });

  it('saves with a screen and costs nothing in CO₂ on geothermal water', () => {
    const p = defaultAnnualHeating(DEFAULT_CONTEXT);
    const without = annualHeating({ ...p, screenSavingPct: 0 });
    const withScreen = annualHeating(p);
    expect(withScreen.annualKwh).toBeLessThan(without.annualKwh);
    const geo = annualHeating({
      ...p,
      fuel: 'geothermal',
      efficiencyPct: 100,
      fuelPrice: 0,
    });
    expect(geo.co2Kg).toBe(0);
    expect(geo.notes.map((n) => n.code)).toContain('year.geothermal');
  });

  it('needs far more heat in a Dutch winter', () => {
    const dutch = annualHeating(
      defaultAnnualHeating({ ...DEFAULT_CONTEXT, climateId: 'de_bilt' }),
    );
    const coast = annualHeating(defaultAnnualHeating(DEFAULT_CONTEXT));
    expect(dutch.annualKwh).toBeGreaterThan(coast.annualKwh * 4);
    expect(dutch.heatingMonths).toBeGreaterThanOrEqual(10);
  });
});
