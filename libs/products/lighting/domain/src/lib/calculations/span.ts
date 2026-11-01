import type {
  CalcNote,
  ConductorType,
  SpanCalculationParams,
  SpanCalculationResult,
  SpanLimit,
  SpanState,
} from '../models/lighting.models';

const G = 9.81;

/** Typical catalogue figures; the screen says to check the cable's datasheet. */
export const CONDUCTORS: Record<
  ConductorType,
  {
    /** Mass of the whole bundle, kg per metre. */
    massKgPerM: number;
    /** Overall diameter of the bundle, mm (what the wind sees). */
    diameterMm: number;
    /** Breaking load of whatever carries the tension, daN. */
    breakingLoadDaN: number;
    /** Cross-section carrying the tension, mm². */
    loadAreaMm2: number;
    /** Elastic modulus of that section, GPa. */
    elasticityGPa: number;
  }
> = {
  // Self-supporting bundles: every core carries the tension.
  abc_2x16: {
    massKgPerM: 0.15,
    diameterMm: 15,
    breakingLoadDaN: 510,
    loadAreaMm2: 32,
    elasticityGPa: 59,
  },
  abc_4x16: {
    massKgPerM: 0.3,
    diameterMm: 18,
    breakingLoadDaN: 1020,
    loadAreaMm2: 64,
    elasticityGPa: 59,
  },
  abc_4x25: {
    massKgPerM: 0.42,
    diameterMm: 22,
    breakingLoadDaN: 1600,
    loadAreaMm2: 100,
    elasticityGPa: 59,
  },
  // Neutral-messenger bundles (NF C 33-209): the Almelec neutral carries it.
  abc_3x35_54: {
    massKgPerM: 0.62,
    diameterMm: 28,
    breakingLoadDaN: 1660,
    loadAreaMm2: 54.6,
    elasticityGPa: 62,
  },
  abc_3x70_54: {
    massKgPerM: 0.98,
    diameterMm: 34,
    breakingLoadDaN: 1660,
    loadAreaMm2: 54.6,
    elasticityGPa: 62,
  },
  abc_3x150_70: {
    massKgPerM: 1.85,
    diameterMm: 45,
    breakingLoadDaN: 2050,
    loadAreaMm2: 70,
    elasticityGPa: 62,
  },
};

/** Thermal expansion of aluminium and Almelec, per kelvin. */
const EXPANSION_PER_K = 23e-6;
/** The worst case may use at most a third of the breaking load (NF C 11-201). */
export const CONDUCTOR_SAFETY_FACTOR = 3;
/** Gusts never load a whole span at once (span factor on wind). */
const WIND_SPAN_FACTOR = 0.75;
/** Dynamic wind pressure by zone, Pa (same zones as the foundation check). */
const WIND_PRESSURE_PA: Record<number, number> = {
  1: 500,
  2: 650,
  3: 850,
  4: 1050,
};
/** Nominal pole loads are given this far below the top (EN 40 / NF C 67-200). */
const NOMINAL_LOAD_BELOW_TOP_M = 0.25;
const INSTALL_TEMP_C = 15;
const STATES: { state: SpanState; tempC: number; windy: boolean }[] = [
  { state: 'everyday', tempC: INSTALL_TEMP_C, windy: false },
  { state: 'wind', tempC: INSTALL_TEMP_C, windy: true },
  { state: 'cold', tempC: -5, windy: false },
  { state: 'hot', tempC: 50, windy: false },
];

interface Conductor {
  weightNPerM: number;
  windNPerM: number;
  breakingN: number;
  stiffnessN: number;
}

/**
 * Horizontal tension after a change of temperature or load, from the
 * parabolic change-of-state equation:
 *   H²·(H − H₀ + EA·w₀²L²/(24H₀²) + EA·α·(t − t₀)) = EA·w²L²/24
 * solved by Newton's method from above the single positive root.
 */
export function changeOfState(
  h0: number,
  w0: number,
  w: number,
  spanM: number,
  stiffnessN: number,
  deltaTempK: number,
): number {
  const k =
    -h0 +
    (stiffnessN * w0 * w0 * spanM * spanM) / (24 * h0 * h0) +
    stiffnessN * EXPANSION_PER_K * deltaTempK;
  const c = (stiffnessN * w * w * spanM * spanM) / 24;
  let h = Math.max(h0, Math.cbrt(c), -k) + 1;
  for (let i = 0; i < 60; i++) {
    const f = h * h * h + k * h * h - c;
    const df = 3 * h * h + 2 * k * h;
    const next = h - f / df;
    if (!Number.isFinite(next) || next <= 0) break;
    if (Math.abs(next - h) < 1e-6) {
      h = next;
      break;
    }
    h = next;
  }
  return h;
}

function conductorOf(params: SpanCalculationParams): Conductor {
  const preset = CONDUCTORS[params.conductor] ?? CONDUCTORS.abc_4x16;
  const zone = WIND_PRESSURE_PA[params.windZone] ?? WIND_PRESSURE_PA[2];
  return {
    weightNPerM: preset.massKgPerM * G,
    windNPerM: WIND_SPAN_FACTOR * zone * (preset.diameterMm / 1000),
    breakingN: preset.breakingLoadDaN * 10,
    stiffnessN: preset.elasticityGPa * 1e3 * preset.loadAreaMm2,
  };
}

interface SpanCheck {
  states: { state: SpanState; tensionN: number; sagM: number }[];
  maxTensionN: number;
  maxTensionState: SpanState;
  windTensionN: number;
  poleLoadN: number;
  conductorUtilization: number;
  poleUtilization: number;
  clearanceM: number;
}

function check(
  params: SpanCalculationParams,
  conductor: Conductor,
  spanM: number,
): SpanCheck {
  const { weightNPerM: w0, windNPerM, breakingN, stiffnessN } = conductor;
  const h0 = (params.everydayTensionPct / 100) * breakingN;
  const windy = Math.hypot(w0, windNPerM);

  const states = STATES.map(({ state, tempC, windy: hasWind }) => {
    const w = hasWind ? windy : w0;
    const h =
      state === 'everyday'
        ? h0
        : changeOfState(h0, w0, w, spanM, stiffnessN, tempC - INSTALL_TEMP_C);
    const sagM = (w * spanM * spanM) / (8 * h);
    // Tension at the support: horizontal tension plus the weight of the sag.
    return { state, tensionN: h + w * sagM, sagM };
  });
  const worst = states.reduce((a, b) => (b.tensionN > a.tensionN ? b : a));
  const windTensionN = states[1].tensionN;
  const hot = states[3];

  // Horizontal load at the attachment, by the pole's role in the line.
  const deviation = (params.deviationDegrees * Math.PI) / 180;
  const poleLoadN =
    params.poleRole === 'terminal'
      ? windTensionN + (windNPerM * spanM) / 2
      : params.poleRole === 'angle'
        ? 2 * windTensionN * Math.sin(deviation / 2) +
          windNPerM * spanM * Math.cos(deviation / 2)
        : windNPerM * spanM;
  const leverM = Math.max(0.5, params.attachmentHeightMeters);
  const capacityNm =
    params.poleNominalLoadDaN *
    10 *
    Math.max(0.5, params.poleHeightMeters - NOMINAL_LOAD_BELOW_TOP_M);

  return {
    states,
    maxTensionN: worst.tensionN,
    maxTensionState: worst.state,
    windTensionN,
    poleLoadN,
    conductorUtilization:
      (worst.tensionN * CONDUCTOR_SAFETY_FACTOR) / breakingN,
    poleUtilization: (poleLoadN * leverM) / capacityNm,
    clearanceM: params.attachmentHeightMeters - hot.sagM,
  };
}

function limitOf(
  params: SpanCalculationParams,
  result: SpanCheck,
): SpanLimit | null {
  if (result.conductorUtilization > 1) return 'conductor';
  if (result.poleUtilization > 1) return 'pole';
  if (result.clearanceM < params.requiredClearanceMeters) return 'clearance';
  return null;
}

/**
 * Overhead wire between two poles: sag and tension in four conditions
 * (everyday 15 °C, design wind, cold −5 °C, hot 50 °C), whether the wire,
 * the pole and the ground clearance hold, and the longest span that does.
 */
export function calculateSpan(
  params: SpanCalculationParams,
): SpanCalculationResult {
  const conductor = conductorOf(params);
  const span = Math.max(5, params.spanMeters);
  const result = check(params, conductor, span);
  const limit = limitOf(params, result);

  // The longest span that passes every check, to the half metre.
  let maxSpanMeters = 0;
  let limitingFactor: SpanLimit | null = null;
  for (let l = 5; l <= 150; l += 0.5) {
    const failed = limitOf(params, check(params, conductor, l));
    if (failed) {
      limitingFactor = failed;
      break;
    }
    maxSpanMeters = l;
  }

  const byState = Object.fromEntries(
    result.states.map((s) => [s.state, s]),
  ) as Record<SpanState, (typeof result.states)[number]>;
  const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
  const notes: CalcNote[] = [];
  if (result.conductorUtilization > 1) {
    notes.push({
      code: 'span.conductorOver',
      severity: 'error',
      values: { pct: Math.round(result.conductorUtilization * 100) },
    });
  }
  if (result.poleUtilization > 1) {
    notes.push({
      code: 'span.poleOver',
      severity: 'error',
      values: {
        pct: Math.round(result.poleUtilization * 100),
        load: Math.round(result.poleLoadN / 10),
      },
    });
  }
  if (result.clearanceM < params.requiredClearanceMeters) {
    notes.push({
      code: 'span.clearanceShort',
      severity: 'error',
      values: {
        clearance: round(result.clearanceM),
        required: params.requiredClearanceMeters,
      },
    });
  }
  if (!limit) {
    notes.push({ code: 'span.ok', severity: 'ok' });
  }
  if (maxSpanMeters > 0 && limitingFactor) {
    notes.push({
      code: `span.maxSpan.${limitingFactor}`,
      severity: 'info',
      values: { span: maxSpanMeters },
    });
  } else if (maxSpanMeters === 0) {
    notes.push({ code: 'span.noSpan', severity: 'warn' });
  }
  if (params.everydayTensionPct > 18) {
    notes.push({
      code: 'span.highEveryday',
      severity: 'warn',
      values: { pct: params.everydayTensionPct },
    });
  }
  notes.push({ code: 'span.datasheet', severity: 'info' });

  return {
    weightNPerM: round(conductor.weightNPerM),
    windNPerM: round(conductor.windNPerM),
    everydayTensionDaN: round(byState.everyday.tensionN / 10, 0),
    sagEverydayMeters: round(byState.everyday.sagM),
    sagHotMeters: round(byState.hot.sagM),
    maxTensionDaN: round(result.maxTensionN / 10, 0),
    maxTensionState: result.maxTensionState,
    allowedTensionDaN: round(
      conductor.breakingN / 10 / CONDUCTOR_SAFETY_FACTOR,
      0,
    ),
    conductorUtilization: round(result.conductorUtilization),
    poleLoadDaN: round(result.poleLoadN / 10, 0),
    poleUtilization: round(result.poleUtilization),
    clearanceMeters: round(result.clearanceM),
    meetsConductor: result.conductorUtilization <= 1,
    meetsPole: result.poleUtilization <= 1,
    meetsClearance: result.clearanceM >= params.requiredClearanceMeters,
    isCompliant: !limit,
    maxSpanMeters,
    limitingFactor,
    states: result.states.map((s) => ({
      state: s.state,
      tensionDaN: round(s.tensionN / 10, 0),
      sagMeters: round(s.sagM),
    })),
    notes,
  };
}
