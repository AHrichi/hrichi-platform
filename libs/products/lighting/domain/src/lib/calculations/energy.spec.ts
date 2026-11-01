import type { EnergyParams } from '../models/lighting.models';
import { calculateEnergy } from './energy';

const base: EnergyParams = {
  luminaires: 20,
  ledWatts: 60,
  oldWatts: 170,
  hoursPerNight: 11.5,
  dimmingSavingPct: 30,
  tariffPerKwh: 0.12,
  co2KgPerKwh: 0.47,
  retrofitCostPerLuminaire: 250,
};

describe('Energy and savings', () => {
  it('counts a year of burning hours', () => {
    const r = calculateEnergy(base);
    expect(r.hoursPerYear).toBe(4198);
    // 20 × 170 W × 4,197.5 h = 14,271.5 kWh
    expect(r.oldKwhPerYear).toBe(14272);
    // 20 × 60 W × 4,197.5 h × 0.7 = 3,525.9 kWh
    expect(r.ledKwhPerYear).toBe(3526);
  });

  it('turns the saving into money, CO₂ and a payback time', () => {
    const r = calculateEnergy(base);
    expect(r.savedCostPerYear).toBe(Math.round((14271.5 - 3525.9) * 0.12));
    expect(r.co2SavedKgPerYear).toBe(Math.round((14271.5 - 3525.9) * 0.47));
    expect(r.paybackYears).toBeCloseTo(5000 / ((14271.5 - 3525.9) * 0.12), 1);
    expect(r.notes.map((n) => n.code)).toContain('energy.saving');
  });

  it('says so when the LEDs save nothing', () => {
    const r = calculateEnergy({ ...base, ledWatts: 250, dimmingSavingPct: 0 });
    expect(r.paybackYears).toBeNull();
    expect(r.notes.map((n) => n.code)).toEqual([
      'energy.noSaving',
      'energy.tryDimming',
    ]);
  });
});
