import type { HotWaterParams } from '../models/serra.models';
import { hotWaterHeating, pipeOutput } from './hot-water';

const base: HotWaterParams = {
  heatDemandKw: 400,
  supplyC: 65,
  returnC: 45,
  airC: 16,
  pipe: 'steel_51',
  floorAreaM2: 4608,
  loopLengthM: 120,
  pumpHeadM: 15,
  pumpEfficiencyPct: 60,
  annualHeatKwh: 200000,
};

describe('Pipe heat output', () => {
  it('gives about 90 W per metre of 51 mm rail at 44 K', () => {
    const out = pipeOutput(51, 0.85, 60, 16);
    // Convection 1.32 × (44 / 0.051)^0.25
    expect(out.convection).toBeCloseTo(1.32 * (44 / 0.051) ** 0.25, 6);
    expect(out.wPerM).toBeGreaterThan(80);
    expect(out.wPerM).toBeLessThan(100);
  });

  it('gives nothing when the pipe is no warmer than the air', () => {
    expect(pipeOutput(51, 0.85, 16, 16).wPerM).toBe(0);
  });
});

describe('Hot-water heating', () => {
  it('sizes the flow from Q = 1.163 × flow × ΔT', () => {
    const r = hotWaterHeating(base);
    // 400 kW / (1.163 × 20 K) = 17.2 m³/h
    expect(r.flowM3h).toBeCloseTo(400 / (1.163 * 20), 1);
    expect(r.meanWaterC).toBe(55);
    expect(r.pipeDeltaK).toBe(39);
  });

  it('lays enough pipe to give off the load, in loops', () => {
    const r = hotWaterHeating(base);
    // The shown W/m is rounded to 0.1, so allow a few metres.
    expect(Math.abs(r.pipeLengthM - 400000 / r.pipeOutputWPerM)).toBeLessThan(
      5,
    );
    expect(r.loops).toBe(Math.ceil(r.pipeLengthM / 120));
    expect(r.metresPerM2).toBeCloseTo(r.pipeLengthM / 4608, 2);
  });

  it('counts the year of geothermal water and the pump', () => {
    const r = hotWaterHeating(base);
    // 200 MWh / (1.163 × 20)
    expect(r.annualWaterM3).toBe(Math.round(200000 / (1.163 * 20)));
    // ρ g Q H / η
    expect(r.pumpKw).toBeCloseTo(
      (1000 * 9.81 * (r.flowM3h / 3600) * 15) / 0.6 / 1000,
      1,
    );
  });

  it('warns when plastic pipe meets water over 75 °C', () => {
    const r = hotWaterHeating({ ...base, pipe: 'pe_40', supplyC: 85 });
    expect(r.notes.map((n) => n.code)).toContain('pipes.peHot');
  });
});
