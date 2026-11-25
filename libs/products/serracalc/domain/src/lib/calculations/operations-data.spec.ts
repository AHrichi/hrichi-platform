import { describe, expect, it } from 'vitest';
import { climateById } from '../data/climates.data';
import {
  checkLogEntry,
  heatStress,
  type LogEntry,
  maintenanceStatus,
} from './operations';
import {
  analyseReadings,
  fieldOfColumn,
  parseReadingsCsv,
  parseTime,
  readingsToCsv,
  sampleWeek,
} from './readings';

const TARGETS = {
  crop: 'tomato',
  stage: 'harvest',
  drainEcMaxDsM: 4.5,
  drainPct: 30,
} as const;

describe('operations', () => {
  it('refuses sprays of WHO class Ia and Ib', () => {
    expect(checkLogEntry({ kind: 'spray', whoClass: 'Ib' })[0].code).toBe(
      'ops.bannedSpray',
    );
    expect(checkLogEntry({ kind: 'spray', whoClass: 'III' })).toEqual([]);
  });

  it('schedules maintenance from the last service in the log', () => {
    const logs: LogEntry[] = [
      {
        id: 'a',
        date: '2026-11-10',
        kind: 'maintenance',
        subject: '',
        task: 'filters',
      },
      {
        id: 'b',
        date: '2026-11-20',
        kind: 'maintenance',
        subject: '',
        task: 'pumps',
      },
    ];
    const status = maintenanceStatus(logs, '2026-11-25');
    const filters = status.find((s) => s.id === 'filters');
    const pumps = status.find((s) => s.id === 'pumps');
    const fans = status.find((s) => s.id === 'fans');
    expect(filters).toMatchObject({
      due: '2026-11-17',
      inDays: -8,
      state: 'overdue',
    });
    expect(pumps).toMatchObject({ due: '2026-12-20', state: 'ok' });
    expect(fans).toMatchObject({ last: null, inDays: 0, state: 'soon' });
  });

  it('rates heat stress by the heat index (NWS)', () => {
    // NWS table: 95 °F at 50 % reads about 105 °F (40.6 °C).
    const warm = heatStress(35, 50);
    expect(warm.heatIndexC).toBeCloseTo(40.6, 0);
    expect(warm.risk).toBe('extremeCaution');
    // 38 °C at 50 %: about 121 °F (49 °C), danger.
    expect(heatStress(38, 50).risk).toBe('danger');
    expect(heatStress(22, 50).risk).toBe('none');
  });
});

describe('readings', () => {
  it('recognises columns by name and reads several date styles', () => {
    expect(fieldOfColumn('Temperature (°C)')).toBe('airC');
    expect(fieldOfColumn('RH %')).toBe('rhPct');
    expect(fieldOfColumn('Drain EC')).toBe('drainEcDsM');
    expect(fieldOfColumn('Outside temp')).toBe('outsideC');
    expect(fieldOfColumn('Timestamp')).toBe('time');
    expect(parseTime('25/11/2026 14:30')).toBe('2026-11-25T14:30:00.000Z');
    expect(parseTime('2026-11-25 14:30')).toBe('2026-11-25T14:30:00.000Z');
    expect(parseTime('soon')).toBeNull();
  });

  it('imports a semicolon CSV with decimal commas', () => {
    const csv = 'Date;Temp;RH;EC\n25/11/2026 10:00;24,5;70;2,7\nbad;1;2;3\n';
    const r = parseReadingsCsv(csv);
    expect(r.error).toBeNull();
    expect(r.skipped).toBe(1);
    expect(r.readings).toEqual([
      { t: '2026-11-25T10:00:00.000Z', airC: 24.5, rhPct: 70, ecDsM: 2.7 },
    ]);
  });

  it('imports a real week and compares it without manual edits', () => {
    const week = sampleWeek(climateById('gabes'), 0, '2026-01-12');
    expect(week).toHaveLength(672);
    const round = parseReadingsCsv(readingsToCsv(week));
    expect(round.error).toBeNull();
    expect(round.readings).toHaveLength(672);
    const a = analyseReadings(round.readings, TARGETS);
    expect(a.days).toBe(7);
    expect(a.stepMin).toBe(15);
    expect(a.hours).toHaveLength(24);
    expect(a.vpdInBandPct).toBeGreaterThan(0);
    expect(a.dayMeanC).toBeGreaterThan(a.nightMeanC ?? 99);
    // The sample's drain EC climbs past 4.5 at the end of the week.
    expect(a.alerts.map((x) => x.code)).toContain('drainEcHigh');
  });

  it('groups consecutive readings breaking a rule into one alert', () => {
    const base = '2026-01-12T';
    const readings = [0, 1, 2, 3].map((h) => ({
      t: `${base}0${h}:00:00.000Z`,
      airC: 15,
      rhPct: h < 3 ? 99 : 70,
    }));
    const a = analyseReadings(readings, TARGETS);
    const low = a.alerts.filter((x) => x.code === 'vpdLow');
    expect(low).toHaveLength(1);
    expect(low[0].readings).toBe(3);
  });
});
