import type { Worker } from './models';
import {
  acceptedKg,
  checkWorkLog,
  createWorkLog,
  findWorkerByBadge,
  normalizeBadge,
  type WorkLogDraft,
} from './work-log';

const KG_PER_CRATE = 12;

function draft(partial: Partial<WorkLogDraft> = {}): WorkLogDraft {
  return {
    date: '2026-11-23',
    workerId: 'w-1',
    greenhouseId: 'gh-1',
    crates: 30,
    kg: null,
    rejectedCrates: 2,
    hours: 8,
    ...partial,
  };
}

describe('acceptedKg', () => {
  it('prefers the weighed kg', () => {
    expect(acceptedKg({ kg: 341.256, crates: 30, rejectedCrates: 2 }, 12)).toBe(
      341.26,
    );
  });

  it('otherwise counts the accepted crates', () => {
    expect(acceptedKg({ kg: null, crates: 30, rejectedCrates: 2 }, 12)).toBe(
      336,
    );
    expect(
      acceptedKg({ kg: null, crates: 10, rejectedCrates: null }, 6.5),
    ).toBe(65);
    expect(acceptedKg({ kg: null, crates: null, rejectedCrates: 0 }, 12)).toBe(
      null,
    );
  });
});

describe('checkWorkLog', () => {
  it('accepts a complete entry and works out its kg', () => {
    expect(checkWorkLog(draft(), KG_PER_CRATE)).toEqual({
      valid: true,
      errors: {},
      warnings: [],
      kg: 336,
    });
  });

  it('needs a worker, a greenhouse, a quantity and hours', () => {
    const check = checkWorkLog(
      draft({
        workerId: null,
        greenhouseId: null,
        crates: null,
        rejectedCrates: null,
        hours: null,
      }),
      KG_PER_CRATE,
    );
    expect(check.valid).toBe(false);
    expect(check.kg).toBeNull();
    expect(check.errors).toEqual({
      worker: 'required',
      greenhouse: 'required',
      crates: 'required',
      hours: 'required',
    });
  });

  it('takes kg alone, without crates', () => {
    const check = checkWorkLog(
      draft({ crates: null, rejectedCrates: null, kg: 250 }),
      KG_PER_CRATE,
    );
    expect(check).toMatchObject({ valid: true, kg: 250 });
  });

  it('refuses counts that are not whole, positive numbers', () => {
    expect(checkWorkLog(draft({ crates: 2.5 }), 12).errors.crates).toBe(
      'not-whole',
    );
    expect(checkWorkLog(draft({ crates: -1 }), 12).errors.crates).toBe(
      'negative',
    );
    expect(
      checkWorkLog(draft({ rejectedCrates: Number.NaN }), 12).errors
        .rejectedCrates,
    ).toBe('invalid');
    expect(checkWorkLog(draft({ kg: -3 }), 12).errors.kg).toBe('negative');
  });

  it('refuses more rejected crates than crates', () => {
    expect(
      checkWorkLog(draft({ crates: 3, rejectedCrates: 4 }), 12).errors,
    ).toEqual({ rejectedCrates: 'more-than-crates' });
    // Rejected crates with only a weight make no sense either.
    expect(
      checkWorkLog(draft({ crates: null, kg: 100, rejectedCrates: 1 }), 12)
        .errors,
    ).toEqual({ rejectedCrates: 'more-than-crates' });
  });

  it('refuses a shift longer than the longest allowed day', () => {
    expect(checkWorkLog(draft({ hours: 12.5 }), 12).errors.hours).toBe(
      'too-long',
    );
    expect(checkWorkLog(draft({ hours: 0 }), 12).errors.hours).toBe('required');
  });

  it('warns about a rate that looks like a typo, without refusing it', () => {
    const check = checkWorkLog(
      draft({ kg: 2500, crates: null, rejectedCrates: null, hours: 8 }),
      KG_PER_CRATE,
    );
    expect(check).toMatchObject({ valid: true, warnings: ['high-rate'] });
  });

  it('refuses a malformed date', () => {
    expect(checkWorkLog(draft({ date: '23/11/2026' }), 12).errors.date).toBe(
      'invalid',
    );
  });
});

describe('createWorkLog', () => {
  const context = {
    id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    teamId: 'team-a',
    kgPerCrate: KG_PER_CRATE,
    recordedAt: '2026-11-23T14:05:00.000Z',
  };

  it('makes an unsynced entry with the worker’s team', () => {
    expect(createWorkLog(draft(), context)).toEqual({
      id: context.id,
      date: '2026-11-23',
      workerId: 'w-1',
      teamId: 'team-a',
      greenhouseId: 'gh-1',
      kg: 336,
      crates: 30,
      rejectedCrates: 2,
      hours: 8,
      recordedAt: context.recordedAt,
      syncedAt: null,
    });
  });

  it('saves missing counts as zero', () => {
    const log = createWorkLog(
      draft({ crates: null, rejectedCrates: null, kg: 120 }),
      context,
    );
    expect(log).toMatchObject({ kg: 120, crates: 0, rejectedCrates: 0 });
  });

  it('throws on an invalid draft', () => {
    expect(() => createWorkLog(draft({ hours: null }), context)).toThrow(
      RangeError,
    );
  });
});

describe('badges', () => {
  const workers: Worker[] = [
    {
      id: 'w-42',
      fullName: 'Amira',
      teamId: 'team-a',
      badgeCode: 'GH-0042',
      hourlyRate: 2.5,
      active: true,
    },
    {
      id: 'w-43',
      fullName: 'Bilel',
      teamId: 'team-a',
      badgeCode: 'GH-0043',
      hourlyRate: 2.5,
      active: false,
    },
  ];

  it('reads a code from a QR link, a prefix or a keyboard', () => {
    expect(normalizeBadge(' gh-0042 ')).toBe('GH-0042');
    expect(normalizeBadge('badge:GH-0042')).toBe('GH-0042');
    expect(normalizeBadge('https://example.test/b/GH-0042')).toBe('GH-0042');
    expect(normalizeBadge('GH 0042')).toBe('GH0042');
    expect(normalizeBadge('   ')).toBe('');
  });

  it('finds active workers only', () => {
    expect(findWorkerByBadge(workers, 'gh-0042')?.id).toBe('w-42');
    expect(findWorkerByBadge(workers, 'GH-0043')).toBeNull();
    expect(findWorkerByBadge(workers, '')).toBeNull();
  });
});
