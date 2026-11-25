import { SAMPLE_PROJECTS } from '../data/sample-projects.data';
import type { SavedCalculation } from '../models/serra.models';
import {
  type CalcContext,
  DEFAULT_CONTEXT,
  defaultAnnualHeating,
  defaultCo2,
  defaultCropWater,
  defaultHeatLoss,
  defaultHotWater,
  defaultHumidity,
  defaultLight,
  defaultPadFan,
  defaultRainwater,
  defaultVentilation,
} from './defaults';
import { annualHeating } from './heating';
import { summarizeSaved } from './saved';

function saved<K extends SavedCalculation['kind']>(
  kind: K,
  inputs: Extract<SavedCalculation, { kind: K }>['inputs'],
): SavedCalculation {
  return {
    id: `calc_${kind}`,
    label: kind,
    savedAt: '2026-11-25T08:00:00.000Z',
    kind,
    inputs,
  } as SavedCalculation;
}

function everyKind(ctx: CalcContext): SavedCalculation[] {
  return [
    saved('heatPeak', defaultHeatLoss(ctx)),
    saved('heatYear', defaultAnnualHeating(ctx)),
    saved('hotWater', defaultHotWater(ctx)),
    saved('ventilation', defaultVentilation(ctx)),
    saved('padFan', defaultPadFan(ctx)),
    saved('cropWater', defaultCropWater(ctx)),
    saved('rainwater', defaultRainwater(ctx)),
    saved('light', defaultLight(ctx)),
    saved('co2', defaultCo2(ctx)),
    saved('humidity', defaultHumidity(ctx)),
  ];
}

const kebili = SAMPLE_PROJECTS[0];
const kebiliContext: CalcContext = {
  greenhouse: kebili.greenhouse,
  climateId: kebili.climateId,
  crop: kebili.crop,
  currency: kebili.currency,
};

describe('Saved results in a report', () => {
  it('gives the Heating screen’s peak for the Kebili sample', () => {
    // 9,600 m² of double film on a 0 °C night: 825 kW, 78 W/m² (checked
    // by hand on the Heating screen, AI_HANDOFF §2).
    const { figures } = summarizeSaved(
      saved('heatPeak', defaultHeatLoss(kebiliContext)),
    );
    expect(figures.map((f) => f.id)).toEqual(['designKw', 'heatWm2']);
    expect(figures[0].value).toBeCloseTo(825.2, 1);
    expect(figures[0].unit).toBe('kW');
    expect(figures[1].value).toBeCloseTo(78, 0);
  });

  it('turns kWh into MWh and kg into tonnes for the year', () => {
    const inputs = defaultAnnualHeating(kebiliContext);
    const direct = annualHeating(inputs);
    const byId = Object.fromEntries(
      summarizeSaved(saved('heatYear', inputs)).figures.map((f) => [f.id, f]),
    );
    expect(byId['annualHeat'].value).toBeCloseTo(direct.annualKwh / 1000, 6);
    expect(byId['heatCo2'].value).toBeCloseTo(direct.co2Kg / 1000, 6);
    expect(byId['fuelCost'].unit).toBe('money');
  });

  it('recomputes from the saved inputs, so a colder night needs more', () => {
    const inputs = defaultHeatLoss(kebiliContext);
    const mild = summarizeSaved(saved('heatPeak', inputs)).figures[0].value;
    const cold = summarizeSaved(
      saved('heatPeak', {
        ...inputs,
        outsideDesignC: inputs.outsideDesignC - 10,
      }),
    ).figures[0].value;
    expect(cold).toBeGreaterThan(mild ?? Infinity);
  });

  it('has finite figures and its notes for every kind', () => {
    for (const ctx of [DEFAULT_CONTEXT, kebiliContext]) {
      for (const calc of everyKind(ctx)) {
        const summary = summarizeSaved(calc);
        expect(summary.figures.length, calc.kind).toBeGreaterThan(1);
        for (const figure of summary.figures) {
          if (figure.value !== null) {
            expect(Number.isFinite(figure.value), figure.id).toBe(true);
          }
        }
        expect(Array.isArray(summary.notes)).toBe(true);
      }
    }
  });
});
