import { climateById } from '../data/climates.data';
import { humidityRatio } from '../utils/physics';
import { co2Enrichment } from './co2';
import {
  DEFAULT_CONTEXT,
  defaultCo2,
  defaultHumidity,
  defaultLight,
} from './defaults';
import { nightHumidity } from './humidity';
import { dliFromRadiation, supplementalLight } from './light';

describe('Light', () => {
  it('turns radiation into a daily light integral', () => {
    // 10 MJ/m² × 0.47 PAR × 4.57 mol/MJ = 21.5 mol/m²
    expect(dliFromRadiation(10)).toBeCloseTo(21.48, 2);
    expect(dliFromRadiation(10, 0.6)).toBeCloseTo(12.89, 2);
  });

  it('sizes lamps for the darkest month', () => {
    const p = { ...defaultLight(DEFAULT_CONTEXT), climateId: 'de_bilt' };
    const r = supplementalLight(p);
    // December in De Bilt is the darkest month.
    expect(r.designMonth).toBe(11);
    const gap =
      p.targetDli -
      dliFromRadiation(
        climateById('de_bilt').months[11].radiationMj,
        p.transmissionPct / 100,
      );
    const ppfd = (gap * 1e6) / (p.lampHours * 3600);
    expect(r.designPpfd).toBe(Math.round(ppfd));
    expect(r.fixtures).toBe(
      Math.ceil(((ppfd / p.efficacyUmolJ) * p.floorAreaM2) / p.fixtureW),
    );
    expect(r.installedPpfd).toBeGreaterThanOrEqual(r.designPpfd);
    // The lamps run their full hours in the design month only.
    expect(r.months[11].lampHours).toBeLessThanOrEqual(p.lampHours);
    expect(r.annualKwh).toBe(r.months.reduce((s, m) => s + m.kwh, 0));
  });

  it('needs no lamps but some shade on the Tunisian coast for lettuce', () => {
    const r = supplementalLight({
      ...defaultLight({ ...DEFAULT_CONTEXT, crop: 'lettuce' }),
      // December inside double film: about 10.7 mol/m².
      targetDli: 10,
    });
    expect(r.fixtures).toBe(0);
    expect(r.annualKwh).toBe(0);
    expect(r.shadeMonths).toBeGreaterThan(4);
    expect(r.notes.map((n) => n.code)).toContain('light.shade');
  });
});

describe('CO₂ enrichment', () => {
  const p = defaultCo2(DEFAULT_CONTEXT);

  it('adds the leak and the uptake', () => {
    const r = co2Enrichment(p);
    const leak =
      p.airChangesPerHour *
      p.volumeM3 *
      (p.targetPpm - p.outsidePpm) *
      1e-6 *
      1.83;
    expect(r.ventLossKgH).toBeCloseTo(leak, 1);
    expect(r.uptakeKgH).toBeCloseTo((3 * p.floorAreaM2) / 1000, 1);
    expect(r.supplyKgH).toBeCloseTo(leak + (3 * p.floorAreaM2) / 1000, 1);
  });

  it('burns 1 m³ of gas for 1.96 kg of CO₂, with its heat', () => {
    const r = co2Enrichment(p);
    expect(r.gasM3h).toBeCloseTo(r.supplyKgH / 1.96, 1);
    expect(r.burnerHeatKw).toBeCloseTo((r.supplyKgH / 1.96) * 9.77 * 0.9, -1);
  });

  it('loses most of it with open vents', () => {
    const r = co2Enrichment({ ...p, airChangesPerHour: 20 });
    expect(r.notes.map((n) => n.code)).toContain('co2.leaky');
    expect(r.usedPct).toBeLessThan(30);
  });
});

describe('Night humidity', () => {
  const p = defaultHumidity(DEFAULT_CONTEXT);

  it('works out the water in the air', () => {
    // About 7.3 g/kg at 20 °C and 50 % (psychrometric chart).
    expect(humidityRatio(20, 50) * 1000).toBeCloseTo(7.3, 0);
  });

  it('brings in drier air to carry the water out, and warms it', () => {
    const r = nightHumidity(p);
    expect(r.airM3h).not.toBeNull();
    const air = r.airM3h ?? 0;
    const x =
      humidityRatio(p.insideC, p.insideRhPct) -
      humidityRatio(p.outsideC, p.outsideRhPct);
    expect(air).toBeCloseTo(r.moistureKgH / (1.2 * x), -2);
    expect(r.heatKw).toBeCloseTo(
      (1.2 * 1005 * (air / 3600) * (p.insideC - p.outsideC)) / 1000,
      0,
    );
  });

  it('warns of drips when the cover is under the dew point', () => {
    const r = nightHumidity({ ...p, uValue: 6.2, insideRhPct: 90 });
    expect(r.condensation).toBe(true);
    expect(r.notes.map((n) => n.code)).toContain('humidity.condensation');
  });

  it('says so when the outside air is wetter', () => {
    const r = nightHumidity({ ...p, outsideC: p.insideC, outsideRhPct: 100 });
    expect(r.airM3h).toBeNull();
    expect(r.notes.map((n) => n.code)).toContain('humidity.outsideWetter');
  });
});
