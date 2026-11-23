import type { Greenhouse, WorkLog } from './models';
import { buildRateTable } from './productivity';

const greenhouses: Greenhouse[] = [
  {
    id: 'gh-t',
    name: 'T',
    areaM2: 1,
    crop: 'tomato',
    kgPerCrate: 12,
    active: true,
  },
  {
    id: 'gh-c',
    name: 'C',
    areaM2: 1,
    crop: 'cherry-tomato',
    kgPerCrate: 6,
    active: true,
  },
  {
    id: 'gh-p',
    name: 'P',
    areaM2: 1,
    crop: 'pepper',
    kgPerCrate: 10,
    active: true,
  },
];

let n = 0;
function log(
  partial: Partial<WorkLog> &
    Pick<WorkLog, 'teamId' | 'greenhouseId' | 'kg' | 'hours'>,
): WorkLog {
  n += 1;
  return {
    id: `l${n}`,
    date: '2026-11-10',
    workerId: `w${n}`,
    crates: 0,
    rejectedCrates: 0,
    recordedAt: '2026-11-10T15:00:00Z',
    syncedAt: null,
    ...partial,
  };
}

const window = { from: '2026-10-26', to: '2026-11-23', farmDefault: 20 };

describe('buildRateTable', () => {
  it('weighs every hour the same: total kg over total hours', () => {
    const rates = buildRateTable(
      [
        log({ teamId: 'a', greenhouseId: 'gh-t', kg: 400, hours: 8 }),
        log({ teamId: 'a', greenhouseId: 'gh-t', kg: 80, hours: 2 }),
        log({ teamId: 'a', greenhouseId: 'gh-t', kg: 300, hours: 10 }),
      ],
      greenhouses,
      window,
    );
    // (400 + 80 + 300) / 20 h, not the mean of 50, 40 and 30.
    expect(rates.rate('a', 'tomato')).toEqual({
      kgPerHour: 39,
      source: 'team-crop',
      hours: 20,
    });
  });

  it("falls back to the farm's rate on a crop the team hasn't picked", () => {
    const rates = buildRateTable(
      [
        log({ teamId: 'a', greenhouseId: 'gh-t', kg: 800, hours: 16 }),
        log({ teamId: 'b', greenhouseId: 'gh-c', kg: 240, hours: 16 }),
      ],
      greenhouses,
      window,
    );
    expect(rates.rate('a', 'cherry-tomato')).toMatchObject({
      kgPerHour: 15,
      source: 'farm-crop',
    });
  });

  it("then to the team's rate on any crop, then to the defaults", () => {
    const rates = buildRateTable(
      [log({ teamId: 'a', greenhouseId: 'gh-t', kg: 800, hours: 16 })],
      greenhouses,
      { ...window, cropDefaults: { 'cherry-tomato': 12 } },
    );
    expect(rates.rate('a', 'pepper')).toMatchObject({
      kgPerHour: 50,
      source: 'team',
    });
    expect(rates.rate('b', 'cherry-tomato')).toEqual({
      kgPerHour: 12,
      source: 'crop-default',
      hours: 0,
    });
    expect(rates.rate('b', 'pepper')).toEqual({
      kgPerHour: 20,
      source: 'farm-default',
      hours: 0,
    });
  });

  it('ignores thin history, other weeks and logs it cannot place', () => {
    const rates = buildRateTable(
      [
        // Under the 16 hours a rate needs.
        log({ teamId: 'a', greenhouseId: 'gh-p', kg: 300, hours: 8 }),
        // Outside the window, on both ends.
        log({
          teamId: 'a',
          greenhouseId: 'gh-t',
          kg: 9000,
          hours: 100,
          date: '2026-10-25',
        }),
        log({
          teamId: 'a',
          greenhouseId: 'gh-t',
          kg: 9000,
          hours: 100,
          date: '2026-11-23',
        }),
        // An unknown greenhouse and an hour-less entry.
        log({ teamId: 'a', greenhouseId: 'gh-x', kg: 9000, hours: 100 }),
        log({ teamId: 'a', greenhouseId: 'gh-t', kg: 50, hours: 0 }),
      ],
      greenhouses,
      window,
    );
    expect(rates.rate('a', 'pepper').source).toBe('farm-default');
    expect(rates.rate('a', 'tomato').source).toBe('farm-default');
  });

  it('counts logs with no team towards the crop, not a team', () => {
    const rates = buildRateTable(
      [log({ teamId: null, greenhouseId: 'gh-t', kg: 640, hours: 16 })],
      greenhouses,
      window,
    );
    expect(rates.rate('a', 'tomato')).toMatchObject({
      kgPerHour: 40,
      source: 'farm-crop',
    });
  });

  it('refuses a farm default that would divide by zero later', () => {
    expect(() =>
      buildRateTable([], greenhouses, { ...window, farmDefault: 0 }),
    ).toThrow(RangeError);
  });
});
