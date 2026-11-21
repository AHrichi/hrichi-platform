import type { SyncResult } from '@ah/products/greenhouse/data-access';
import { parseNumber, stepValue } from './numbers';
import { nextRun, retryDelay, stateAfter } from './sync-schedule';

describe('parseNumber', () => {
  it('reads Latin and Arabic-Indic digits, with a point or a comma', () => {
    expect(parseNumber('12')).toBe(12);
    expect(parseNumber(' 7,5 ')).toBe(7.5);
    expect(parseNumber('٧٫٥')).toBe(7.5);
    expect(parseNumber('١٢٠')).toBe(120);
    expect(parseNumber('۳۴')).toBe(34);
    expect(parseNumber('8.')).toBe(8);
    expect(parseNumber('.5')).toBe(0.5);
  });

  it('tells empty from not-a-number', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('   ')).toBeNull();
    expect(parseNumber('12kg')).toBeNaN();
    expect(parseNumber('1.2.3')).toBeNaN();
  });
});

describe('stepValue', () => {
  const bounds = { min: 0, max: 12 };

  it('steps from empty as if from zero, within bounds', () => {
    expect(stepValue(null, 1, bounds)).toBe(1);
    expect(stepValue(0, -1, bounds)).toBe(0);
    expect(stepValue(11.5, 1, bounds)).toBe(12);
    expect(stepValue(Number.NaN, 0.5, bounds)).toBe(0.5);
  });

  it('keeps half hours exact', () => {
    expect(stepValue(7.5, 0.5, bounds)).toBe(8);
    expect(stepValue(0.1, 0.2, bounds)).toBe(0.3);
  });
});

describe('sync schedule', () => {
  const result = (partial: Partial<SyncResult>): SyncResult => ({
    sent: 0,
    rejected: 0,
    pending: 0,
    stoppedBy: null,
    ...partial,
  });

  it('backs off from 5 seconds to at most 5 minutes', () => {
    expect([1, 2, 3, 4, 7, 20].map(retryDelay)).toEqual([
      5_000, 10_000, 20_000, 40_000, 300_000, 300_000,
    ]);
  });

  it('retries a failed run later, and resets once one goes through', () => {
    expect(nextRun(result({ stoppedBy: 'offline', pending: 3 }), 0)).toEqual({
      failures: 1,
      delayMs: 5_000,
    });
    expect(nextRun(result({ stoppedBy: 'server', pending: 3 }), 2)).toEqual({
      failures: 3,
      delayMs: 20_000,
    });
    expect(nextRun(result({ sent: 3 }), 3)).toEqual({
      failures: 0,
      delayMs: null,
    });
  });

  it('waits for a sign-in after an expired session', () => {
    expect(nextRun(result({ stoppedBy: 'auth', pending: 2 }), 1)).toEqual({
      failures: 1,
      delayMs: null,
    });
  });

  it('sends an entry edited mid-run shortly after', () => {
    expect(nextRun(result({ sent: 1, pending: 1 }), 0).delayMs).toBe(1_500);
  });

  it('names the state the header shows', () => {
    expect(stateAfter(result({ stoppedBy: 'offline' }))).toBe('offline');
    expect(stateAfter(result({ stoppedBy: 'auth' }))).toBe('auth');
    expect(stateAfter(result({ stoppedBy: 'server' }))).toBe('error');
    expect(stateAfter(result({}))).toBe('idle');
  });
});
