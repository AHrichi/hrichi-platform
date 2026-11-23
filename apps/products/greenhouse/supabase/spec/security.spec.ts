import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { CROPS } from '@ah/products/greenhouse/domain';

/**
 * The migrations, run as they are against real Postgres (PGlite), with the
 * Supabase pieces they need stood in. Each test runs in a transaction that
 * is rolled back, acting as one user or another the way PostgREST does:
 * the `authenticated` role plus that user's JWT claims.
 */

const root = join(import.meta.dirname, '..');

const FARM_A = 'a0000000-0000-4000-8000-000000000001';
const FARM_B = 'b0000000-0000-4000-8000-000000000001';
const MANAGER_A = 'a0000000-0000-4000-8000-0000000000a1';
const SUPERVISOR_A = 'a0000000-0000-4000-8000-0000000000a2';
const SUPERVISOR_A2 = 'a0000000-0000-4000-8000-0000000000a3';
const HR_A = 'a0000000-0000-4000-8000-0000000000a4';
const MANAGER_B = 'b0000000-0000-4000-8000-0000000000b1';
const STRANGER = 'c0000000-0000-4000-8000-0000000000c1';
const GH_A = 'a0000000-0000-4000-8000-00000000a001';
const GH_B = 'b0000000-0000-4000-8000-00000000b001';
const TEAM_A = 'a0000000-0000-4000-8000-00000000a101';
const TEAM_B = 'b0000000-0000-4000-8000-00000000b101';
const WORKER_A = 'a0000000-0000-4000-8000-00000000a201';
const WORKER_B = 'b0000000-0000-4000-8000-00000000b201';
const LOG_ID = 'a0000000-0000-4000-8000-00000000a301';

let db: PGlite;

beforeAll(async () => {
  db = await PGlite.create();
  await db.exec(
    readFileSync(join(root, 'spec', 'supabase-stand-in.sql'), 'utf8'),
  );
  const migrations = readdirSync(join(root, 'migrations'))
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of migrations) {
    await db.exec(readFileSync(join(root, 'migrations', file), 'utf8'));
  }
  // The local-development seed, so it can't drift from the schema.
  await db.exec(readFileSync(join(root, 'seed.sql'), 'utf8'));
  await db.exec(`
    insert into auth.users (id, email) values
      ('${MANAGER_A}', 'manager-a@example.test'),
      ('${SUPERVISOR_A}', 'supervisor-a@example.test'),
      ('${SUPERVISOR_A2}', 'supervisor-a2@example.test'),
      ('${HR_A}', 'hr-a@example.test'),
      ('${MANAGER_B}', 'manager-b@example.test'),
      ('${STRANGER}', 'stranger@example.test');
    insert into public.farm (id, name) values
      ('${FARM_A}', 'Farm A'), ('${FARM_B}', 'Farm B');
    insert into public.member (farm_id, user_id, role, full_name) values
      ('${FARM_A}', '${MANAGER_A}', 'manager', 'Manager A'),
      ('${FARM_A}', '${SUPERVISOR_A}', 'supervisor', 'Supervisor A'),
      ('${FARM_A}', '${SUPERVISOR_A2}', 'supervisor', 'Supervisor A2'),
      ('${FARM_A}', '${HR_A}', 'hr', 'HR A'),
      ('${FARM_B}', '${MANAGER_B}', 'manager', 'Manager B');
    insert into public.greenhouse (id, farm_id, name, area_m2, crop, kg_per_crate) values
      ('${GH_A}', '${FARM_A}', 'Serre 1', 10000, 'tomato', 12),
      ('${GH_B}', '${FARM_B}', 'Serre 1', 10000, 'pepper', 10);
    insert into public.team (id, farm_id, name, supervisor_id) values
      ('${TEAM_A}', '${FARM_A}', 'Équipe A', '${SUPERVISOR_A}'),
      ('${TEAM_B}', '${FARM_B}', 'Équipe B', null);
    insert into public.worker (id, farm_id, full_name, team_id, badge_code) values
      ('${WORKER_A}', '${FARM_A}', 'Amira Gharbi', '${TEAM_A}', 'GH-0001'),
      ('${WORKER_B}', '${FARM_B}', 'Bilel Ayari', '${TEAM_B}', 'GH-0001');
    insert into public.worker_pay (worker_id, farm_id, hourly_rate) values
      ('${WORKER_A}', '${FARM_A}', 2.55),
      ('${WORKER_B}', '${FARM_B}', 2.4);
  `);
});

afterAll(async () => {
  await db.close();
});

interface Session {
  /** Act as this user from now on (null: anonymous with no claims). */
  as(userId: string | null): Promise<void>;
  rows<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<T[]>;
  /** How many rows a write touched. */
  count(sql: string, params?: unknown[]): Promise<number>;
  /** The error a statement raises; fails the test if it succeeds. */
  error(sql: string, params?: unknown[]): Promise<string>;
}

/** Runs `fn` in a transaction that is always rolled back. */
async function scenario(fn: (s: Session) => Promise<void>): Promise<void> {
  await db.exec('begin');
  let savepoint = 0;
  const session: Session = {
    async as(userId) {
      await db.exec('reset role');
      await db.query(`select set_config('request.jwt.claims', $1, true)`, [
        userId ? JSON.stringify({ sub: userId, role: 'authenticated' }) : '',
      ]);
      await db.exec(
        userId ? 'set local role authenticated' : 'set local role anon',
      );
    },
    async rows<T>(sql: string, params: unknown[] = []) {
      return (await db.query<T>(sql, params)).rows;
    },
    async count(sql, params = []) {
      return (await db.query(sql, params)).affectedRows ?? 0;
    },
    async error(sql, params = []) {
      const name = `s${++savepoint}`;
      await db.exec(`savepoint ${name}`);
      try {
        await db.query(sql, params);
      } catch (error) {
        await db.exec(`rollback to savepoint ${name}`);
        return (error as Error).message;
      }
      throw new Error(`Expected an error from: ${sql}`);
    },
  };
  try {
    await fn(session);
  } finally {
    await db.exec('rollback');
  }
}

const insertLog = `
  insert into public.work_log (id, farm_id, work_date, worker_id, greenhouse_id,
    kg, crates, rejected_crates, hours, recorded_at, recorded_by)
  values ($1, $2, $3, $4, $5, 120, 12, 1, 8, now(), $6)`;

function today(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

describe('the test harness', () => {
  it('acts as the signed-in user, under row-level security', () =>
    scenario(async (s) => {
      await s.as(SUPERVISOR_A);
      expect(
        await s.rows(`select current_user as role, auth.uid() as uid`),
      ).toEqual([{ role: 'authenticated', uid: SUPERVISOR_A }]);
    }));
});

describe('farms and members', () => {
  it('makes the creator of a farm its manager', () =>
    scenario(async (s) => {
      await s.as(STRANGER);
      const [{ id }] = await s.rows<{ id: string }>(
        `select public.create_farm('My farm', 'Me') as id`,
      );
      expect(
        await s.rows(`select role from public.member where farm_id = $1`, [id]),
      ).toEqual([{ role: 'manager' }]);
    }));

  it('lets nobody create a farm without signing in', () =>
    scenario(async (s) => {
      await s.as(null);
      expect(
        await s.error(`select public.create_farm('My farm', 'Me')`),
      ).toMatch(/permission denied/);
    }));

  it('keeps every farm separate', () =>
    scenario(async (s) => {
      await s.as(MANAGER_B);
      for (const table of ['farm', 'member', 'greenhouse', 'team', 'worker']) {
        const rows = await s.rows<{ farm_id: string }>(
          table === 'farm'
            ? `select id as farm_id from public.farm`
            : `select farm_id from public.${table}`,
        );
        expect(rows.every((r) => r.farm_id === FARM_B)).toBe(true);
      }
      expect(
        await s.error(
          `insert into public.greenhouse (farm_id, name, area_m2, crop, kg_per_crate)
           values ($1, 'Mine now', 1, 'tomato', 12)`,
          [FARM_A],
        ),
      ).toMatch(/row-level security/);
    }));

  it('lets a stranger see nothing at all', () =>
    scenario(async (s) => {
      await s.as(STRANGER);
      expect(await s.rows(`select * from public.worker`)).toEqual([]);
      expect(await s.rows(`select * from public.work_log`)).toEqual([]);
    }));

  it('shuts the anonymous key out of every table', () =>
    scenario(async (s) => {
      await s.as(null);
      expect(await s.error(`select * from public.worker`)).toMatch(
        /permission denied/,
      );
    }));

  it('keeps at least one manager on a farm', () =>
    scenario(async (s) => {
      await s.as(MANAGER_A);
      expect(
        await s.error(
          `update public.member set role = 'supervisor' where user_id = $1`,
          [MANAGER_A],
        ),
      ).toMatch(/at least one manager/);
      // With a second manager, the first may step down.
      await s.count(
        `update public.member set role = 'manager' where user_id = $1`,
        [SUPERVISOR_A2],
      );
      expect(
        await s.count(
          `update public.member set role = 'supervisor' where user_id = $1`,
          [MANAGER_A],
        ),
      ).toBe(1);
    }));

  it('stops a supervisor promoting themselves', () =>
    scenario(async (s) => {
      await s.as(SUPERVISOR_A);
      expect(
        await s.count(
          `update public.member set role = 'manager' where user_id = $1`,
          [SUPERVISOR_A],
        ),
      ).toBe(0);
    }));
});

describe('pay', () => {
  it('is visible to managers and HR only', () =>
    scenario(async (s) => {
      await s.as(SUPERVISOR_A);
      expect(await s.rows(`select * from public.worker_pay`)).toEqual([]);
      // The roster itself is there.
      expect(await s.rows(`select full_name from public.worker`)).toEqual([
        { full_name: 'Amira Gharbi' },
      ]);
      await s.as(HR_A);
      expect(await s.rows(`select hourly_rate from public.worker_pay`)).toEqual(
        [{ hourly_rate: '2.550' }],
      );
      expect(
        await s.count(`update public.worker_pay set hourly_rate = 9`),
      ).toBe(0);
    }));
});

describe('work logs', () => {
  it('lets a supervisor log work, stamped by the server', () =>
    scenario(async (s) => {
      await s.as(SUPERVISOR_A);
      // A phone that claims someone else wrote it is overruled.
      await s.count(insertLog, [
        LOG_ID,
        FARM_A,
        today(),
        WORKER_A,
        GH_A,
        MANAGER_A,
      ]);
      const [log] = await s.rows<{ recorded_by: string; team_id: string }>(
        `select recorded_by, team_id from public.work_log where id = $1`,
        [LOG_ID],
      );
      expect(log).toEqual({ recorded_by: SUPERVISOR_A, team_id: TEAM_A });
    }));

  it('ignores the same entry sent twice', () =>
    scenario(async (s) => {
      await s.as(SUPERVISOR_A);
      const args = [LOG_ID, FARM_A, today(), WORKER_A, GH_A, SUPERVISOR_A];
      const upsert = `${insertLog} on conflict (id) do nothing`;
      expect(await s.count(upsert, args)).toBe(1);
      expect(await s.count(upsert, args)).toBe(0);
      expect(
        await s.rows(`select id from public.work_log where id = $1`, [LOG_ID]),
      ).toHaveLength(1);
    }));

  it('accepts two weeks of backlog from a phone that was offline', () =>
    scenario(async (s) => {
      await s.as(SUPERVISOR_A);
      expect(
        await s.count(insertLog, [
          LOG_ID,
          FARM_A,
          today(-13),
          WORKER_A,
          GH_A,
          SUPERVISOR_A,
        ]),
      ).toBe(1);
      expect(
        await s.error(insertLog, [
          crypto.randomUUID(),
          FARM_A,
          today(-30),
          WORKER_A,
          GH_A,
          SUPERVISOR_A,
        ]),
      ).toMatch(/row-level security/);
    }));

  it('never lets an entry point at another farm’s worker', () =>
    scenario(async (s) => {
      await s.as(MANAGER_A);
      expect(
        await s.error(insertLog, [
          LOG_ID,
          FARM_A,
          today(),
          WORKER_B,
          GH_A,
          MANAGER_A,
        ]),
      ).toMatch(/foreign key/);
    }));

  it('lets supervisors fix their own entries only, and never delete', () =>
    scenario(async (s) => {
      await s.as(SUPERVISOR_A);
      await s.count(insertLog, [
        LOG_ID,
        FARM_A,
        today(),
        WORKER_A,
        GH_A,
        SUPERVISOR_A,
      ]);
      expect(
        await s.count(`update public.work_log set kg = 130 where id = $1`, [
          LOG_ID,
        ]),
      ).toBe(1);
      expect(
        await s.count(`delete from public.work_log where id = $1`, [LOG_ID]),
      ).toBe(0);
      await s.as(SUPERVISOR_A2);
      expect(
        await s.count(`update public.work_log set kg = 1 where id = $1`, [
          LOG_ID,
        ]),
      ).toBe(0);
      await s.as(MANAGER_A);
      expect(
        await s.count(`delete from public.work_log where id = $1`, [LOG_ID]),
      ).toBe(1);
    }));

  it('keeps HR read-only', () =>
    scenario(async (s) => {
      await s.as(HR_A);
      expect(
        await s.error(insertLog, [
          LOG_ID,
          FARM_A,
          today(),
          WORKER_A,
          GH_A,
          HR_A,
        ]),
      ).toMatch(/row-level security/);
    }));

  it('refuses more rejected crates than crates', () =>
    scenario(async (s) => {
      await s.as(MANAGER_A);
      expect(
        await s.error(
          `insert into public.work_log (id, farm_id, work_date, worker_id,
             greenhouse_id, kg, crates, rejected_crates, hours, recorded_at, recorded_by)
           values ($1, $2, $3, $4, $5, 10, 1, 2, 8, now(), $6)`,
          [LOG_ID, FARM_A, today(), WORKER_A, GH_A, MANAGER_A],
        ),
      ).toMatch(/check constraint/);
    }));
});

describe('the weekly plan', () => {
  it('starts weeks on Monday and dates each day', () =>
    scenario(async (s) => {
      await s.as(MANAGER_A);
      const [row] = await s.rows<{ plan_date: Date }>(
        `insert into public.weekly_plan (farm_id, week_start, day, greenhouse_id,
           team_id, expected_kg, hours_per_day)
         values ($1, '2026-11-23', 5, $2, $3, 2800, 8)
         returning plan_date`,
        [FARM_A, GH_A, TEAM_A],
      );
      expect(row?.plan_date.toISOString().slice(0, 10)).toBe('2026-11-27');
      expect(
        await s.error(
          `insert into public.weekly_plan (farm_id, week_start, day, greenhouse_id,
             team_id, expected_kg, hours_per_day)
           values ($1, '2026-11-24', 1, $2, $3, 100, 8)`,
          [FARM_A, GH_A, TEAM_A],
        ),
      ).toMatch(/check constraint/);
    }));

  it('replaces a greenhouse’s row at once, for managers only', () =>
    scenario(async (s) => {
      const save = `select public.save_plan_row($1, '2026-11-23', $2, $3::jsonb)`;
      const cells = (kg: number) =>
        JSON.stringify(
          [1, 2].map((day) => ({
            day,
            team_id: TEAM_A,
            expected_kg: kg,
            hours_per_day: 8,
          })),
        );
      const row = `select day, expected_kg from public.weekly_plan
        where greenhouse_id = $1 order by day`;
      await s.as(MANAGER_A);
      await s.rows(save, [FARM_A, GH_A, cells(100)]);
      await s.rows(save, [FARM_A, GH_A, cells(250)]);
      expect(await s.rows(row, [GH_A])).toEqual([
        { day: 1, expected_kg: '250.00' },
        { day: 2, expected_kg: '250.00' },
      ]);
      // A supervisor can't write the plan, and can't empty it either.
      await s.as(SUPERVISOR_A);
      expect(await s.error(save, [FARM_A, GH_A, cells(1)])).toMatch(
        /row-level security/,
      );
      await s.rows(save, [FARM_A, GH_A, '[]']);
      expect(await s.rows(row, [GH_A])).toHaveLength(2);
    }));

  it('is the manager’s to write', () =>
    scenario(async (s) => {
      await s.as(SUPERVISOR_A);
      expect(
        await s.error(
          `insert into public.weekly_plan (farm_id, week_start, day, greenhouse_id,
             team_id, expected_kg, hours_per_day)
           values ($1, '2026-11-23', 1, $2, $3, 100, 8)`,
          [FARM_A, GH_A, TEAM_A],
        ),
      ).toMatch(/row-level security/);
    }));
});

describe('hygiene checks', () => {
  it('lock once signed', () =>
    scenario(async (s) => {
      await s.as(SUPERVISOR_A);
      const [check] = await s.rows<{ id: string }>(
        `insert into public.hygiene_check (farm_id, check_date, greenhouse_id, supervisor_id)
         values ($1, $2, $3, $4) returning id`,
        [FARM_A, today(), GH_A, SUPERVISOR_A],
      );
      const sign = `update public.hygiene_check set signed_at = now() where id = $1`;
      expect(await s.count(sign, [check?.id])).toBe(1);
      expect(
        await s.count(
          `update public.hygiene_check set answers = '[]' where id = $1`,
          [check?.id],
        ),
      ).toBe(0);
    }));

  it('are filled in by the supervisor who signs them', () =>
    scenario(async (s) => {
      await s.as(SUPERVISOR_A);
      expect(
        await s.error(
          `insert into public.hygiene_check (farm_id, check_date, greenhouse_id, supervisor_id)
           values ($1, $2, $3, $4)`,
          [FARM_A, today(), GH_A, SUPERVISOR_A2],
        ),
      ).toMatch(/row-level security/);
    }));
});

describe('hygiene photos', () => {
  const upload = `insert into storage.objects (bucket_id, name) values ('hygiene-photos', $1)`;

  it('go into the supervisor’s own farm folder only', () =>
    scenario(async (s) => {
      await s.as(SUPERVISOR_A);
      expect(await s.count(upload, [`${FARM_A}/check-1/sink.jpg`])).toBe(1);
      expect(await s.error(upload, [`${FARM_B}/check-1/sink.jpg`])).toMatch(
        /row-level security/,
      );
      expect(await s.error(upload, ['not-a-farm/sink.jpg'])).toMatch(
        /row-level security/,
      );
      await s.as(MANAGER_B);
      expect(await s.rows(`select name from storage.objects`)).toEqual([]);
    }));
});

describe('invitations', () => {
  const invite = `select public.invite_member($1, $2, $3, $4) as result`;

  it('adds someone with an account straight away', () =>
    scenario(async (s) => {
      await s.as(MANAGER_A);
      expect(
        await s.rows(invite, [
          FARM_A,
          ' Stranger@Example.test ',
          'supervisor',
          'New supervisor',
        ]),
      ).toEqual([{ result: 'added' }]);
      expect(
        await s.rows(`select role from public.member where user_id = $1`, [
          STRANGER,
        ]),
      ).toEqual([{ role: 'supervisor' }]);
      // Asking again changes the role.
      expect(
        await s.rows(invite, [FARM_A, 'stranger@example.test', 'hr', 'X']),
      ).toEqual([{ result: 'updated' }]);
    }));

  it('holds an invitation until that email signs up', () =>
    scenario(async (s) => {
      await s.as(MANAGER_A);
      expect(
        await s.rows(invite, [
          FARM_A,
          'Later@Example.test',
          'supervisor',
          'Lina',
        ]),
      ).toEqual([{ result: 'invited' }]);
      expect(await s.rows(`select email from public.invitation`)).toEqual([
        { email: 'later@example.test' },
      ]);
      // Supabase Auth creates the account; the trigger claims the invitation.
      await s.as(null);
      await db.exec('reset role');
      const newUser = 'd0000000-0000-4000-8000-0000000000d1';
      await s.count(`insert into auth.users (id, email) values ($1, $2)`, [
        newUser,
        'LATER@example.test',
      ]);
      await s.as(newUser);
      expect(
        await s.rows(
          `select farm_id, role, full_name from public.member where user_id = $1`,
          [newUser],
        ),
      ).toEqual([{ farm_id: FARM_A, role: 'supervisor', full_name: 'Lina' }]);
      await s.as(MANAGER_A);
      expect(await s.rows(`select * from public.invitation`)).toEqual([]);
    }));

  it('is for managers only, and invitations stay private', () =>
    scenario(async (s) => {
      await s.as(MANAGER_A);
      await s.rows(invite, [FARM_A, 'later@example.test', 'hr', 'Hana']);
      for (const who of [SUPERVISOR_A, HR_A, MANAGER_B]) {
        await s.as(who);
        expect(
          await s.error(invite, [FARM_A, 'x@example.test', 'manager', 'X']),
        ).toMatch(/Only a manager/);
        expect(await s.rows(`select * from public.invitation`)).toEqual([]);
      }
    }));

  it('still keeps a manager on the farm', () =>
    scenario(async (s) => {
      await s.as(MANAGER_A);
      expect(
        await s.error(invite, [
          FARM_A,
          'manager-a@example.test',
          'supervisor',
          'Me',
        ]),
      ).toMatch(/at least one manager/);
    }));
});

describe('work totals', () => {
  it('sum a day per team and greenhouse, within the farm', () =>
    scenario(async (s) => {
      await s.as(MANAGER_A);
      for (const id of [LOG_ID, 'a0000000-0000-4000-8000-00000000a302']) {
        await s.count(insertLog, [
          id,
          FARM_A,
          today(),
          WORKER_A,
          GH_A,
          MANAGER_A,
        ]);
      }
      const totals = `select team_id, kg, hours, crates, entries
        from public.work_totals($1, $2, $3)`;
      expect(await s.rows(totals, [FARM_A, today(-1), today(1)])).toEqual([
        {
          team_id: TEAM_A,
          kg: '240.00',
          hours: '16.00',
          crates: 24,
          entries: 2,
        },
      ]);
      // The end date is excluded.
      expect(await s.rows(totals, [FARM_A, today(-1), today()])).toEqual([]);
      await s.as(MANAGER_B);
      expect(await s.rows(totals, [FARM_A, today(-1), today(1)])).toEqual([]);
    }));
});

describe('performance totals', () => {
  /** The Monday of a `YYYY-MM-DD` day. */
  const monday = (date: string): string => {
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  };
  const iso = (value: unknown): string =>
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value);

  async function logTwoWeeks(s: Session): Promise<void> {
    await s.as(MANAGER_A);
    await s.count(insertLog, [
      LOG_ID,
      FARM_A,
      today(),
      WORKER_A,
      GH_A,
      MANAGER_A,
    ]);
    await s.count(insertLog, [
      'a0000000-0000-4000-8000-00000000a302',
      FARM_A,
      today(-7),
      WORKER_A,
      GH_A,
      MANAGER_A,
    ]);
  }

  const teamWeeks = `select week_start, team_id, kg, hours, crates,
      rejected_crates, labour_cost, paid_hours
    from public.team_week_totals($1, $2, $3)`;
  const workers = `select worker_id, days, kg, labour_cost, paid_hours
    from public.worker_totals($1, $2, $3)`;

  it('sum each team’s weeks from Monday, with the labour cost', () =>
    scenario(async (s) => {
      await logTwoWeeks(s);
      const rows = await s.rows<Record<string, unknown>>(teamWeeks, [
        FARM_A,
        today(-8),
        today(1),
      ]);
      expect(
        rows.map((r) => ({
          week: iso(r['week_start']),
          team: r['team_id'],
          kg: Number(r['kg']),
          cost: Number(r['labour_cost']),
          paid: Number(r['paid_hours']),
          rejected: r['rejected_crates'],
        })),
      ).toEqual(
        [today(-7), today()].map((day) => ({
          week: monday(day),
          team: TEAM_A,
          kg: 120,
          // 8 hours at 2.55 TND.
          cost: 20.4,
          paid: 8,
          rejected: 1,
        })),
      );
    }));

  it('sum each worker over the period', () =>
    scenario(async (s) => {
      await logTwoWeeks(s);
      const [row] = await s.rows<Record<string, unknown>>(workers, [
        FARM_A,
        today(-8),
        today(1),
      ]);
      expect(row?.['worker_id']).toBe(WORKER_A);
      expect(Number(row?.['days'])).toBe(2);
      expect(Number(row?.['kg'])).toBe(240);
      expect(Number(row?.['labour_cost'])).toBe(40.8);
    }));

  it('show supervisors the work but not its cost, and outsiders nothing', () =>
    scenario(async (s) => {
      await logTwoWeeks(s);
      await s.as(SUPERVISOR_A);
      const [row] = await s.rows<Record<string, unknown>>(workers, [
        FARM_A,
        today(-8),
        today(1),
      ]);
      expect(Number(row?.['kg'])).toBe(240);
      expect(Number(row?.['labour_cost'])).toBe(0);
      expect(Number(row?.['paid_hours'])).toBe(0);
      await s.as(MANAGER_B);
      expect(await s.rows(teamWeeks, [FARM_A, today(-8), today(1)])).toEqual(
        [],
      );
      expect(await s.rows(workers, [FARM_A, today(-8), today(1)])).toEqual([]);
    }));
});

describe('targets', () => {
  const insertTarget = `insert into public.target
    (farm_id, week_start, cost_per_kg_target, kg_target)
    values ($1, '2026-11-23', 0.075, 160000)`;

  it('are set by managers and read by the whole farm', () =>
    scenario(async (s) => {
      await s.as(HR_A);
      expect(await s.error(insertTarget, [FARM_A])).toMatch(
        /row-level security/,
      );
      await s.as(MANAGER_A);
      expect(await s.count(insertTarget, [FARM_A])).toBe(1);
      await s.as(SUPERVISOR_A);
      expect(
        await s.rows(`select cost_per_kg_target from public.target`),
      ).toEqual([{ cost_per_kg_target: '0.075' }]);
      await s.as(MANAGER_B);
      expect(await s.rows(`select * from public.target`)).toEqual([]);
    }));
});

describe('the seed', () => {
  it('loads a farm of three teams, every worker paid', () =>
    scenario(async (s) => {
      const [row] = await s.rows<{
        workers: number;
        teams: number;
        paid: number;
      }>(
        `select
           (select count(*)::int from public.worker where farm_id = $1) as workers,
           (select count(distinct team_id)::int from public.worker where farm_id = $1) as teams,
           (select count(*)::int from public.worker_pay where farm_id = $1) as paid`,
        ['00000000-0000-4000-8000-000000000001'],
      );
      expect(row).toEqual({ workers: 12, teams: 3, paid: 12 });
    }));
});

describe('the schema and the domain model', () => {
  it('agree on the crops', () =>
    scenario(async (s) => {
      await s.as(MANAGER_A);
      for (const [i, crop] of CROPS.entries()) {
        await s.count(
          `insert into public.greenhouse (farm_id, name, area_m2, crop, kg_per_crate)
           values ($1, $2, 1, $3, 1)`,
          [FARM_A, `Crop ${i}`, crop],
        );
      }
      expect(
        await s.error(
          `insert into public.greenhouse (farm_id, name, area_m2, crop, kg_per_crate)
           values ($1, 'Bananas', 1, 'banana', 1)`,
          [FARM_A],
        ),
      ).toMatch(/check constraint/);
    }));
});
