import { describe, expect, it } from 'vitest';
import { SAMPLE_PROJECTS } from '../data/sample-projects.data';
import { COOLING_RULES } from '../data/targets.data';
import { isoWeek, valueAtWeek, wrapWeek } from '../utils/weeks';
import { cropCalendar } from './calendar';
import { ventilation } from './cooling';
import {
  adviceParams,
  type CalcContext,
  defaultCalendar,
  defaultFog,
  defaultVentilation,
  defaultVpd,
} from './defaults';
import { coolingAdvice, fogCooling } from './fog';
import { rhForVpd, saturatedGm3, vpdCheck } from './vpd';

/** The geothermal tomato sample: ten 9.6 m spans, 100 m long, in Kebili. */
const kebili = SAMPLE_PROJECTS[0];
const KEBILI: CalcContext = {
  greenhouse: kebili.greenhouse,
  climateId: kebili.climateId,
  crop: kebili.crop,
  currency: kebili.currency,
};

describe('VPD', () => {
  it('gives 0.85 kPa at 15 °C and 50 % and at 34 °C and 84 % (Tetens)', () => {
    const cool = vpdCheck({ ...defaultVpd(KEBILI), airC: 15, rhPct: 50 });
    const hot = vpdCheck({ ...defaultVpd(KEBILI), airC: 34, rhPct: 84 });
    expect(cool.vpdKpa).toBeCloseTo(0.85, 2);
    expect(hot.vpdKpa).toBeCloseTo(0.85, 2);
  });

  it('turns a VPD and a temperature back into the humidity', () => {
    expect(rhForVpd(15, 0.8526)).toBeCloseTo(50, 0);
    expect(rhForVpd(10, 5)).toBeNull();
    // Saturated air at 20 °C holds about 17.3 g/m³.
    expect(saturatedGm3(20)).toBeCloseTo(17.3, 1);
  });

  it('calls a damp, cool house too wet and dries it with heat and air', () => {
    const r = vpdCheck({
      ...defaultVpd(KEBILI),
      light: 'night',
      airC: 14,
      rhPct: 95,
      outsideC: 6,
      outsideRhPct: 80,
    });
    expect(r.status).toBe('tooWet');
    expect(r.action).toBe('heatAndVent');
    expect(r.notes.map((n) => n.code)).toContain('vpd.disease');
  });

  it('calls hot, dry desert air too dry and cools it with fog', () => {
    const r = vpdCheck({ ...defaultVpd(KEBILI), airC: 32, rhPct: 35 });
    expect(r.vpdKpa).toBeGreaterThan(3);
    expect(r.status).toBe('tooDry');
    expect(r.action).toBe('coolAndHumidify');
    expect(r.notes.map((n) => n.code)).toContain('vpd.arid');
  });

  it('holds a tomato crop inside 0.45–1.25 kPa and lists the same VPD elsewhere', () => {
    const r = vpdCheck({ ...defaultVpd(KEBILI), airC: 24, rhPct: 72 });
    expect(r.status).toBe('good');
    expect(r.ideal).toBe(true);
    expect(r.band).toEqual({ min: 0.45, max: 1.25 });
    const at15 = r.pairs.find((p) => p.airC === 15);
    expect(at15?.rhPct).toBeGreaterThan(45);
    expect(at15?.rhPct).toBeLessThan(55);
  });
});

describe('fogging', () => {
  const fog = fogCooling(defaultFog(KEBILI));

  it('cools a 44 °C, 15 % afternoon well below the vents alone', () => {
    expect(fog.ventOnlyC).toBeGreaterThan(44);
    expect(fog.insideC).toBeLessThan(34);
    expect(fog.insideC).toBeGreaterThan(fog.wetBulbC);
    expect(fog.insideRhPct).toBeLessThanOrEqual(75.5);
  });

  it('sprays about 24 g/m² a minute while on, as in the Arizona test', () => {
    expect(fog.fogGm2Min).toBeCloseTo(24.3, 0);
  });

  it('works out the water as q × A × t / 10⁶ and the cycle from the duty', () => {
    const p = defaultFog(KEBILI);
    const minutesOn = p.hoursPerDay * 60 * (fog.dutyPct / 100);
    const expected = (fog.fogGm2Min * 9600 * minutesOn) / 1e6;
    expect(fog.waterM3Day).toBeCloseTo(expected, 0);
    if (fog.rhLimited) {
      const duty = fog.onS / (fog.onS + fog.offS);
      expect(duty * 100).toBeCloseTo(fog.dutyPct, -1);
    }
    expect(fog.padWaterM3Day).toBeGreaterThan(fog.waterM3Day);
  });

  it('stops fogging when the outside air is already too humid', () => {
    const r = fogCooling({
      ...defaultFog(KEBILI),
      outsideC: 28,
      outsideRhPct: 95,
    });
    expect(r.dutyPct).toBe(0);
    expect(r.notes.map((n) => n.code)).toContain('fog.tooHumid');
  });
});

describe('cooling advisor', () => {
  it('sends the Kebili sample to shade and fog instead of 26.6 % vents', () => {
    const vent = defaultVentilation(KEBILI);
    expect(vent.outsideC).toBe(39);
    const r = ventilation(vent);
    expect(r.ventPct).toBeCloseTo(26.6, 1);
    expect(r.flowM3h / 1e6).toBeCloseTo(2, 0);

    const advice = coolingAdvice(adviceParams(vent, KEBILI));
    expect(advice.strategy).toBe('shadeAndFog');
    expect(advice.shadePct).toBe(COOLING_RULES.shadePct);
    expect(advice.shadedVentPct).toBeLessThan(advice.ventPct);
    expect(advice.fogInsideC).toBeLessThan(vent.outsideC - 5);
    expect(advice.notes[0].code).toBe('advice.notBuildable');
  });

  it('keeps plain vents on a mild day and pads in a short house', () => {
    const mild = coolingAdvice({
      ...adviceParams(defaultVentilation(KEBILI), KEBILI),
      outsideC: 28,
      radiationWm2: 500,
      shadingPct: 30,
    });
    expect(mild.strategy).toBe('vents');

    const short = coolingAdvice({
      ...adviceParams(defaultVentilation(KEBILI), KEBILI),
      houseLengthM: 40,
    });
    expect(short.strategy).toBe('shadeAndPad');
  });
});

describe('crop calendar', () => {
  const r = cropCalendar(defaultCalendar(KEBILI));

  it('plants in week 36, picks from week 47 and finishes after week 29', () => {
    expect(r.weeks[0].week).toBe(36);
    expect(r.firstHarvestWeek).toBe(47);
    expect(r.endWeek).toBe(29);
    expect(r.harvestWeeks).toBe(35);
    expect(r.stages.map((s) => s.stage)).toEqual([
      'nursery',
      'vegetative',
      'flowering',
      'harvest',
      'cleanOut',
    ]);
    expect(r.stages[0]).toMatchObject({ startWeek: 29, endWeek: 35 });
  });

  it('turns the heating on from week 42 in Kebili, as the desert sites do', () => {
    expect(r.heatingFromWeek).toBe(42);
  });

  it('enriches CO₂ in winter, fogs and shades in summer, nothing when empty', () => {
    const byWeek = new Map(r.weeks.map((w) => [w.week, w]));
    expect(byWeek.get(2)?.co2).toBe(true);
    expect(byWeek.get(2)?.fog).toBe(false);
    expect(byWeek.get(26)?.fog).toBe(true);
    expect(byWeek.get(26)?.shade).toBe(true);
    expect(byWeek.get(26)?.co2).toBe(false);
    expect(byWeek.get(32)?.stage).toBe('cleanOut');
    expect(byWeek.get(32)?.heating).toBe(false);
  });
});

describe('weeks', () => {
  it('numbers ISO weeks and wraps them into a year', () => {
    expect(isoWeek(new Date(2026, 10, 25))).toBe(48);
    expect(isoWeek(new Date(2026, 0, 1))).toBe(1);
    expect(wrapWeek(60)).toBe(8);
    expect(wrapWeek(0)).toBe(52);
  });

  it('reads a monthly value between mid-months', () => {
    const ramp = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    // Week 3 is mid-January.
    expect(valueAtWeek(ramp, 3)).toBeCloseTo(0, 0);
    expect(valueAtWeek(ramp, 29)).toBeCloseTo(6.5, 0);
  });
});
