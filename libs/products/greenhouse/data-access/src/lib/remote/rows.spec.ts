import {
  absenceFrom,
  absenceRow,
  planRow,
  totalsFrom,
  workerFrom,
} from './rows';

describe('rows', () => {
  it('reads numeric strings and nulls the way PostgREST sends them', () => {
    expect(
      workerFrom({
        id: 'w1',
        full_name: 'Amira',
        team_id: null,
        badge_code: 'GH-0001',
        active: true,
      }),
    ).toEqual({
      id: 'w1',
      fullName: 'Amira',
      teamId: null,
      badgeCode: 'GH-0001',
      active: true,
    });
    expect(
      totalsFrom({
        work_date: '2026-11-20',
        team_id: 't1',
        greenhouse_id: 'g1',
        kg: '240.00',
        hours: '16.00',
        crates: 24,
        rejected_crates: 1,
        entries: 2,
      }),
    ).toMatchObject({
      date: '2026-11-20',
      teamId: 't1',
      greenhouseId: 'g1',
      kg: 240,
      hours: 16,
      crates: 24,
    });
  });

  it('round-trips an absence, the reason optional', () => {
    const absence = {
      id: 'a1',
      workerId: 'w1',
      from: '2026-11-26',
      to: '2026-11-27',
    };
    expect(absenceFrom(absenceRow('f1', absence))).toEqual(absence);
    expect(
      absenceFrom(absenceRow('f1', { ...absence, reason: 'Sick' })),
    ).toEqual({ ...absence, reason: 'Sick' });
  });

  it('leaves the generated plan date to the database', () => {
    expect(
      planRow('f1', {
        weekStart: '2026-11-23',
        day: 5,
        greenhouseId: 'g1',
        teamId: 't1',
        expectedKg: 4600,
        hoursPerDay: 8,
      }),
    ).toEqual({
      farm_id: 'f1',
      week_start: '2026-11-23',
      day: 5,
      greenhouse_id: 'g1',
      team_id: 't1',
      expected_kg: 4600,
      hours_per_day: 8,
    });
  });
});
