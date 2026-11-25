import { stageTargets, vpdBandsFor } from '../data/targets.data';
import type {
  CalcNote,
  ClimatePreset,
  CropId,
  CropStage,
} from '../models/serra.models';
import { round, vpdKpa } from '../utils/physics';
import { heatStress } from './operations';

/** One timestamped measurement from a sensor, a logger or a hand reading. */
export interface Reading {
  /** ISO date and time. */
  t: string;
  airC?: number;
  rhPct?: number;
  parUmol?: number;
  ecDsM?: number;
  ph?: number;
  drainPct?: number;
  drainEcDsM?: number;
  outsideC?: number;
  outsideRhPct?: number;
}

export type ReadingField = Exclude<keyof Reading, 't'>;

export const READING_FIELDS: readonly ReadingField[] = [
  'airC',
  'rhPct',
  'parUmol',
  'ecDsM',
  'ph',
  'drainPct',
  'drainEcDsM',
  'outsideC',
  'outsideRhPct',
];

const TIME_NAMES = ['time', 'timestamp', 'date', 'datetime', 'ts', 'date_time'];

/** Column names a CSV may use for each field, after normalising. */
const ALIASES: Record<ReadingField, readonly string[]> = {
  airC: [
    'air',
    'air_c',
    'airc',
    'temp',
    'temperature',
    't_air',
    'tair',
    't_in',
    'inside_c',
  ],
  rhPct: ['rh', 'humidity', 'hum', 'rh_pct', 'rh_in', 'inside_rh'],
  parUmol: ['par', 'ppfd', 'light', 'par_umol'],
  ecDsM: ['ec', 'ec_drip', 'ec_feed', 'ec_in'],
  ph: ['ph', 'ph_drip'],
  drainPct: ['drain', 'drain_pct', 'drain_share'],
  drainEcDsM: ['drain_ec', 'ec_drain'],
  outsideC: [
    'outside',
    'outside_c',
    'outside_t',
    't_out',
    'out_t',
    'ext_t',
    'tout',
  ],
  outsideRhPct: ['outside_rh', 'rh_out', 'out_rh', 'ext_rh'],
};

function normalise(header: string): string {
  return header
    .toLowerCase()
    .replace(/[([].*?[)\]]/g, '')
    .replace(/°c|%|µmol|umol|ds\/m|ms\/cm/g, '')
    .trim()
    .replace(/[\s\-./]+/g, '_')
    .replace(/_+$/, '');
}

/** The field a column holds, by its name; null if none. */
export function fieldOfColumn(header: string): ReadingField | 'time' | null {
  const h = normalise(header);
  if (TIME_NAMES.includes(h)) return 'time';
  for (const field of READING_FIELDS) {
    if (ALIASES[field].includes(h)) return field;
  }
  const out = h.includes('out') || h.includes('ext');
  if (out && (h.includes('rh') || h.includes('hum'))) return 'outsideRhPct';
  if (out) return 'outsideC';
  if (h.includes('drain') && h.includes('ec')) return 'drainEcDsM';
  if (h.includes('drain')) return 'drainPct';
  if (h.includes('rh') || h.includes('hum')) return 'rhPct';
  if (h.includes('par') || h.includes('ppfd')) return 'parUmol';
  if (h.startsWith('ec')) return 'ecDsM';
  if (h.includes('temp') || h.includes('air')) return 'airC';
  if (h.includes('time') || h.includes('date')) return 'time';
  return null;
}

/** A time cell as ISO: ISO itself, "yyyy-mm-dd hh:mm" or "dd/mm/yyyy hh:mm". */
export function parseTime(cell: string): string | null {
  const text = cell.trim().replace(/^"|"$/g, '');
  const dmy =
    /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(
      text,
    );
  let iso = text.replace(' ', 'T');
  if (dmy) {
    const [, d, m, y, hh = '0', mm = '0', ss = '0'] = dmy;
    iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${hh.padStart(2, '0')}:${mm}:${ss.padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{1,2}:\d{2}$/.test(iso)) iso += ':00';
  const ms = Date.parse(
    iso.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`,
  );
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

export interface CsvImport {
  readings: Reading[];
  /** The fields found, by column. */
  columns: (ReadingField | 'time' | null)[];
  skipped: number;
  error: 'empty' | 'noTime' | 'noData' | null;
}

/**
 * Readings from a logger's CSV: comma, semicolon or tab separated, decimal
 * points or commas, columns recognised by name (time, temperature, RH, PAR,
 * EC, pH, drain, outside…). Rows without a readable time are skipped.
 */
export function parseReadingsCsv(text: string): CsvImport {
  // A spreadsheet's export may start with a byte-order mark (U+FEFF).
  const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const lines = body.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2)
    return { readings: [], columns: [], skipped: 0, error: 'empty' };
  const head = lines[0];
  const sep = [';', '\t', ','].reduce((best, s) =>
    head.split(s).length > head.split(best).length ? s : best,
  );
  const columns = head.split(sep).map(fieldOfColumn);
  const timeCol = columns.indexOf('time');
  if (timeCol < 0)
    return { readings: [], columns, skipped: 0, error: 'noTime' };
  if (!columns.some((c) => c !== null && c !== 'time')) {
    return { readings: [], columns, skipped: 0, error: 'noData' };
  }
  const readings: Reading[] = [];
  let skipped = 0;
  for (const line of lines.slice(1)) {
    const cells = line.split(sep);
    const t = parseTime(cells[timeCol] ?? '');
    if (!t) {
      skipped++;
      continue;
    }
    const reading: Reading = { t };
    columns.forEach((field, i) => {
      if (field === null || field === 'time') return;
      const raw = (cells[i] ?? '').trim().replace(/^"|"$/g, '');
      if (raw === '') return;
      const value = Number(sep === ',' ? raw : raw.replace(',', '.'));
      if (Number.isFinite(value)) reading[field] = value;
    });
    readings.push(reading);
  }
  readings.sort((a, b) => a.t.localeCompare(b.t));
  return {
    readings,
    columns,
    skipped,
    error: readings.length ? null : 'noData',
  };
}

/** Readings back to CSV, for a sample file or an export. */
export function readingsToCsv(readings: readonly Reading[]): string {
  const head = ['time', ...READING_FIELDS];
  const rows = readings.map((r) =>
    [
      r.t.slice(0, 16).replace('T', ' '),
      ...READING_FIELDS.map((f) => r[f] ?? ''),
    ].join(','),
  );
  return [head.join(','), ...rows].join('\n');
}

/** What the analysis compares against: the crop, its stage and limits. */
export interface ReadingTargets {
  crop: CropId;
  stage: CropStage;
  /** Act (more drain, or a flush) when the drain's EC reaches this, dS/m. */
  drainEcMaxDsM: number;
  /** Planned drain share, percent. */
  drainPct: number;
}

export interface HourProfile {
  hour: number;
  airC: number | null;
  rhPct: number | null;
  vpdKpa: number | null;
}

export interface DaySummary {
  date: string;
  tMinC: number | null;
  tMaxC: number | null;
  rhMeanPct: number | null;
  vpdMeanKpa: number | null;
  /** Hours with the VPD outside its band. */
  hoursOutOfBand: number;
  drainEcMax: number | null;
}

export type AlertCode =
  | 'vpdLow'
  | 'vpdHigh'
  | 'heatStress'
  | 'heatDanger'
  | 'drainEcHigh'
  | 'tempLow'
  | 'tempHigh'
  | 'phOut';

export interface ReadingAlert {
  code: AlertCode;
  severity: CalcNote['severity'];
  /** First and last reading of the run, ISO. */
  from: string;
  to: string;
  readings: number;
  /** The worst value in the run. */
  worst: number;
}

export interface ReadingsAnalysis {
  count: number;
  from: string | null;
  to: string | null;
  days: number;
  /** Typical minutes between readings. */
  stepMin: number;
  /** Share of the time with VPD in its band for the light, percent. */
  vpdInBandPct: number | null;
  dayMeanC: number | null;
  nightMeanC: number | null;
  drainMeanPct: number | null;
  hours: HourProfile[];
  daysSummary: DaySummary[];
  alerts: ReadingAlert[];
  notes: CalcNote[];
}

const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

/** Alert rules as data: a test on a reading and how bad it is. */
export const ALERT_RULES: readonly {
  code: AlertCode;
  severity: CalcNote['severity'];
  test: (
    r: Reading,
    ctx: {
      vpd: number | null;
      day: boolean;
      hi: number | null;
      t: ReadingTargets;
    },
  ) => number | null;
}[] = [
  {
    code: 'vpdLow',
    severity: 'warn',
    test: (_r, c) => (c.vpd !== null && c.vpd < 0.3 ? c.vpd : null),
  },
  {
    code: 'vpdHigh',
    severity: 'warn',
    test: (_r, c) => (c.vpd !== null && c.day && c.vpd > 1.5 ? c.vpd : null),
  },
  {
    code: 'heatDanger',
    severity: 'error',
    test: (_r, c) => (c.hi !== null && c.hi >= 41 ? c.hi : null),
  },
  {
    code: 'heatStress',
    severity: 'warn',
    test: (_r, c) => (c.hi !== null && c.hi >= 32 && c.hi < 41 ? c.hi : null),
  },
  {
    code: 'drainEcHigh',
    severity: 'warn',
    test: (r, c) =>
      r.drainEcDsM !== undefined && r.drainEcDsM >= c.t.drainEcMaxDsM
        ? r.drainEcDsM
        : null,
  },
  {
    code: 'tempLow',
    severity: 'warn',
    test: (r, c) => {
      const band = stageTargets(c.t.crop, c.t.stage).nightC;
      return r.airC !== undefined && r.airC < band.min - 1 ? r.airC : null;
    },
  },
  {
    code: 'tempHigh',
    severity: 'warn',
    test: (r, c) => {
      const band = stageTargets(c.t.crop, c.t.stage).dayC;
      return r.airC !== undefined && r.airC > band.max + 5 ? r.airC : null;
    },
  },
  {
    code: 'phOut',
    severity: 'info',
    test: (r) =>
      r.ph !== undefined && (r.ph < 5.2 || r.ph > 6.8) ? r.ph : null,
  },
];

/**
 * Measured against calculated: VPD from each reading's temperature and
 * humidity against the stage's band for the light (PAR over 50 µmol/m²·s,
 * or 7:00–19:00 without PAR, counts as day), the mean day and night
 * temperatures, the drain; VPD by hour of the day; a summary per day; and
 * alerts, consecutive readings breaking the same rule grouped into one.
 */
export function analyseReadings(
  readings: readonly Reading[],
  targets: ReadingTargets,
): ReadingsAnalysis {
  const sorted = [...readings].sort((a, b) => a.t.localeCompare(b.t));
  const stage = stageTargets(targets.crop, targets.stage);
  const inBand: boolean[] = [];
  const dayTemps: number[] = [];
  const nightTemps: number[] = [];
  const drains: number[] = [];
  const byHour = Array.from({ length: 24 }, () => ({
    t: [] as number[],
    rh: [] as number[],
    vpd: [] as number[],
  }));
  const byDay = new Map<
    string,
    { t: number[]; rh: number[]; vpd: number[]; out: number; drainEc: number[] }
  >();
  const alerts: ReadingAlert[] = [];
  const open = new Map<AlertCode, ReadingAlert>();
  const steps: number[] = [];

  sorted.forEach((r, i) => {
    const date = r.t.slice(0, 10);
    const hour = Number(r.t.slice(11, 13));
    const day =
      r.parUmol !== undefined ? r.parUmol > 50 : hour >= 7 && hour < 19;
    const vpd =
      r.airC !== undefined && r.rhPct !== undefined
        ? vpdKpa(r.airC, r.rhPct)
        : null;
    const hi =
      r.airC !== undefined && r.rhPct !== undefined
        ? heatStress(r.airC, r.rhPct).heatIndexC
        : null;
    if (i > 0)
      steps.push((Date.parse(r.t) - Date.parse(sorted[i - 1].t)) / 60_000);
    const slot = byDay.get(date) ?? {
      t: [],
      rh: [],
      vpd: [],
      out: 0,
      drainEc: [],
    };
    byDay.set(date, slot);
    if (r.airC !== undefined) {
      (day ? dayTemps : nightTemps).push(r.airC);
      byHour[hour].t.push(r.airC);
      slot.t.push(r.airC);
    }
    if (r.rhPct !== undefined) {
      byHour[hour].rh.push(r.rhPct);
      slot.rh.push(r.rhPct);
    }
    if (vpd !== null) {
      const { band } = vpdBandsFor(stage, day ? 'sun' : 'night');
      const ok = vpd >= band.min && vpd <= band.max;
      inBand.push(ok);
      byHour[hour].vpd.push(vpd);
      slot.vpd.push(vpd);
      if (!ok) slot.out++;
    }
    if (r.drainPct !== undefined) drains.push(r.drainPct);
    if (r.drainEcDsM !== undefined) slot.drainEc.push(r.drainEcDsM);

    for (const rule of ALERT_RULES) {
      const value = rule.test(r, { vpd, day, hi, t: targets });
      const current = open.get(rule.code);
      if (value === null) {
        if (current) {
          alerts.push(current);
          open.delete(rule.code);
        }
        continue;
      }
      if (current) {
        current.to = r.t;
        current.readings++;
        const lower = rule.code === 'vpdLow' || rule.code === 'tempLow';
        current.worst = lower
          ? Math.min(current.worst, value)
          : Math.max(current.worst, value);
      } else {
        open.set(rule.code, {
          code: rule.code,
          severity: rule.severity,
          from: r.t,
          to: r.t,
          readings: 1,
          worst: value,
        });
      }
    }
  });
  alerts.push(...open.values());
  alerts.sort((a, b) => a.from.localeCompare(b.from));

  const stepMin = steps.length
    ? [...steps].sort((a, b) => a - b)[Math.floor(steps.length / 2)]
    : 0;
  const hourShare = stepMin > 0 ? stepMin / 60 : 1;
  const vpdInBand = inBand.length
    ? (inBand.filter(Boolean).length / inBand.length) * 100
    : null;
  const dayMean = mean(dayTemps);
  const nightMean = mean(nightTemps);
  const drainMean = mean(drains);

  const notes: CalcNote[] = [];
  if (vpdInBand !== null) {
    notes.push({
      code: 'data.vpdBand',
      severity: vpdInBand >= 80 ? 'ok' : vpdInBand >= 60 ? 'info' : 'warn',
      values: { pct: round(vpdInBand) },
    });
  }
  if (dayMean !== null) {
    const ok = dayMean >= stage.dayC.min - 1 && dayMean <= stage.dayC.max + 1;
    notes.push({
      code: ok ? 'data.dayOk' : 'data.dayOff',
      severity: ok ? 'ok' : 'warn',
      values: {
        t: round(dayMean, 1),
        min: stage.dayC.min,
        max: stage.dayC.max,
      },
    });
  }
  if (nightMean !== null) {
    const ok =
      nightMean >= stage.nightC.min - 1 && nightMean <= stage.nightC.max + 1;
    notes.push({
      code: ok ? 'data.nightOk' : 'data.nightOff',
      severity: ok ? 'ok' : 'warn',
      values: {
        t: round(nightMean, 1),
        min: stage.nightC.min,
        max: stage.nightC.max,
      },
    });
  }
  if (drainMean !== null) {
    notes.push({
      code: 'data.drain',
      severity: Math.abs(drainMean - targets.drainPct) <= 5 ? 'ok' : 'info',
      values: { pct: round(drainMean), plan: targets.drainPct },
    });
  }
  notes.push({
    code: alerts.length ? 'data.alerts' : 'data.noAlerts',
    severity: alerts.some((a) => a.severity === 'error')
      ? 'error'
      : alerts.length
        ? 'warn'
        : 'ok',
    values: { n: alerts.length },
  });

  return {
    count: sorted.length,
    from: sorted[0]?.t ?? null,
    to: sorted.at(-1)?.t ?? null,
    days: byDay.size,
    stepMin: round(stepMin),
    vpdInBandPct: vpdInBand === null ? null : round(vpdInBand),
    dayMeanC: dayMean === null ? null : round(dayMean, 1),
    nightMeanC: nightMean === null ? null : round(nightMean, 1),
    drainMeanPct: drainMean === null ? null : round(drainMean),
    hours: byHour.map((h, hour) => ({
      hour,
      airC: h.t.length ? round(mean(h.t) as number, 1) : null,
      rhPct: h.rh.length ? round(mean(h.rh) as number) : null,
      vpdKpa: h.vpd.length ? round(mean(h.vpd) as number, 2) : null,
    })),
    daysSummary: [...byDay.entries()].map(([date, d]) => ({
      date,
      tMinC: d.t.length ? round(Math.min(...d.t), 1) : null,
      tMaxC: d.t.length ? round(Math.max(...d.t), 1) : null,
      rhMeanPct: d.rh.length ? round(mean(d.rh) as number) : null,
      vpdMeanKpa: d.vpd.length ? round(mean(d.vpd) as number, 2) : null,
      hoursOutOfBand: round(d.out * hourShare, 1),
      drainEcMax: d.drainEc.length ? round(Math.max(...d.drainEc), 1) : null,
    })),
    alerts,
    notes,
  };
}

/**
 * A made-up but plausible week of 15-minute readings in a climate's month:
 * the house held near its set points, humid nights, PAR by day, the drain
 * EC creeping up through the week. Deterministic, so a demo or a test
 * always sees the same numbers.
 */
export function sampleWeek(
  climate: ClimatePreset,
  month: number,
  startDate: string,
): Reading[] {
  const m = climate.months[month];
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const out: Reading[] = [];
  for (let i = 0; i < 7 * 96; i++) {
    const t = start + i * 15 * 60_000;
    const hour = (i % 96) / 4;
    const dayIndex = Math.floor(i / 96);
    const wobble = Math.sin(i * 0.37) * 0.4 + Math.sin(i * 0.11) * 0.6;
    const outside =
      (m.tMinC + m.tMaxC) / 2 +
      ((m.tMaxC - m.tMinC) / 2) * Math.cos((2 * Math.PI * (hour - 15)) / 24);
    const sun = Math.max(0, Math.sin((Math.PI * (hour - 6.5)) / 12));
    const air =
      16.5 +
      9.5 * sun +
      wobble +
      (hour >= 13 && hour < 15 && dayIndex === 4 ? 6 : 0);
    const rh = Math.min(
      97,
      88 - 30 * sun + wobble * 2 + (hour < 6 && dayIndex === 2 ? 6 : 0),
    );
    out.push({
      t: new Date(t).toISOString(),
      airC: round(air, 1),
      rhPct: round(rh),
      parUmol: round(sun * 1300 * 0.65),
      ecDsM: round(2.7 + wobble * 0.05, 2),
      ph: round(5.8 + wobble * 0.1, 2),
      drainPct: sun > 0.2 ? round(28 + wobble * 3) : undefined,
      drainEcDsM: round(3.9 + dayIndex * 0.12 + wobble * 0.05, 2),
      outsideC: round(outside + wobble * 0.5, 1),
      outsideRhPct: round(Math.min(95, 60 - 25 * sun + wobble * 3)),
    });
  }
  return out;
}
