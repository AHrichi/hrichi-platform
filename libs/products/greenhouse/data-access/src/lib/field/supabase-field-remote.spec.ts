import type { SupabaseClient } from '@supabase/supabase-js';
import type { LogChange } from './field-remote';
import { classifyFailure } from '../remote/postgrest';
import { RemoteError } from '../remote/remote-error';
import { classifyStorageFailure } from '../remote/storage';
import { SupabaseFieldRemote } from './supabase-field-remote';

describe('classifyFailure', () => {
  const cases: [string, Parameters<typeof classifyFailure>[0], string][] = [
    [
      'no network',
      { status: 0, error: { message: 'TypeError: Failed to fetch' } },
      'offline',
    ],
    [
      'Safari offline',
      { status: 0, error: { message: 'Load failed' } },
      'offline',
    ],
    [
      // What Chrome reported with the server down and the app installed.
      'the service worker’s stand-in for no network',
      { status: 504, error: { message: '' } },
      'offline',
    ],
    [
      'a real gateway timeout from the database',
      { status: 504, error: { message: 'canceling statement', code: '57014' } },
      'server',
    ],
    [
      'expired session',
      { status: 401, error: { message: 'JWT expired', code: 'PGRST301' } },
      'auth',
    ],
    [
      'row-level security',
      {
        status: 403,
        error: {
          message: 'new row violates row-level security policy',
          code: '42501',
        },
      },
      'rejected',
    ],
    [
      'foreign key',
      {
        status: 409,
        error: { message: 'violates foreign key constraint', code: '23503' },
      },
      'rejected',
    ],
    [
      'check constraint',
      {
        status: 400,
        error: { message: 'violates check constraint', code: '23514' },
      },
      'rejected',
    ],
    [
      'bad value',
      {
        status: 400,
        error: { message: 'invalid input syntax', code: '22P02' },
      },
      'rejected',
    ],
    [
      'busy',
      { status: 503, error: { message: 'Service Unavailable' } },
      'server',
    ],
    [
      'rate limit',
      { status: 429, error: { message: 'Too many requests' } },
      'server',
    ],
    [
      'timeout',
      { status: 408, error: { message: 'Request Timeout' } },
      'server',
    ],
  ];
  it.each(cases)('%s', (_name, failure, kind) => {
    expect(classifyFailure(failure)).toBe(kind);
  });
});

/** Records every call on the query builder and answers with `reply`. */
function fakeClient(reply: { data: unknown; error: unknown; status: number }) {
  const calls: { table: string; method: string; args: unknown[] }[] = [];
  const client = {
    from(table: string) {
      const builder: Record<string, unknown> = {};
      for (const method of ['upsert', 'select', 'eq', 'order']) {
        builder[method] = (...args: unknown[]) => {
          calls.push({ table, method, args });
          return builder;
        };
      }
      builder['then'] = (resolve: (value: unknown) => unknown) =>
        Promise.resolve(reply).then(resolve);
      return builder;
    },
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: 'user-1' } } },
      }),
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}

const change = (op: LogChange['op'], id: string): LogChange => ({
  op,
  farmId: 'farm-1',
  log: {
    id,
    date: '2026-11-23',
    workerId: 'w-1',
    teamId: 'team-a',
    greenhouseId: 'gh-1',
    kg: 300,
    crates: 26,
    rejectedCrates: 1,
    hours: 8,
    recordedAt: '2026-11-23T09:00:00.000Z',
    syncedAt: null,
  },
});

describe('SupabaseFieldRemote', () => {
  it('inserts new entries without overwriting, then updates edited ones', async () => {
    const { client, calls } = fakeClient({
      data: null,
      error: null,
      status: 201,
    });
    await new SupabaseFieldRemote(client).pushLogs([
      change('create', 'a'),
      change('update', 'b'),
      change('create', 'c'),
    ]);
    expect(calls.map((c) => [c.table, c.method, c.args[1]])).toEqual([
      ['work_log', 'upsert', { onConflict: 'id', ignoreDuplicates: true }],
      ['work_log', 'upsert', { onConflict: 'id' }],
    ]);
    expect((calls[0]?.args[0] as { id: string }[]).map((r) => r.id)).toEqual([
      'a',
      'c',
    ]);
    // snake_case, and nothing the server stamps itself.
    expect((calls[0]?.args[0] as object[])[0]).toEqual({
      id: 'a',
      farm_id: 'farm-1',
      work_date: '2026-11-23',
      worker_id: 'w-1',
      team_id: 'team-a',
      greenhouse_id: 'gh-1',
      kg: 300,
      crates: 26,
      rejected_crates: 1,
      hours: 8,
      recorded_at: '2026-11-23T09:00:00.000Z',
    });
  });

  it('turns a refusal into a RemoteError of the right kind', async () => {
    const { client } = fakeClient({
      data: null,
      error: { message: 'violates foreign key constraint', code: '23503' },
      status: 409,
    });
    const push = new SupabaseFieldRemote(client).pushLogs([
      change('create', 'a'),
    ]);
    await expect(push).rejects.toBeInstanceOf(RemoteError);
    await expect(push).rejects.toMatchObject({ kind: 'rejected' });
  });

  it('maps the roster from snake_case rows', async () => {
    const rows = [
      {
        farm_id: 'farm-1',
        id: 'x',
        name: 'Serre 1',
        area_m2: '10000.00',
        crop: 'tomato',
        kg_per_crate: '12.00',
        active: true,
        supervisor_id: null,
        full_name: 'Amira',
        team_id: 'team-a',
        badge_code: 'GH-0001',
      },
    ];
    const { client } = fakeClient({ data: rows, error: null, status: 200 });
    const roster = await new SupabaseFieldRemote(client).fetchRoster();
    expect(roster.farmId).toBe('farm-1');
    expect(roster.greenhouses[0]).toEqual({
      id: 'x',
      name: 'Serre 1',
      areaM2: 10000,
      crop: 'tomato',
      kgPerCrate: 12,
      active: true,
    });
    expect(roster.workers[0]).toEqual({
      id: 'x',
      fullName: 'Amira',
      teamId: 'team-a',
      badgeCode: 'GH-0001',
      active: true,
    });
  });

  it('needs a signed-in user for the roster', async () => {
    const { client } = fakeClient({ data: [], error: null, status: 200 });
    (client.auth as unknown as { getSession: () => unknown }).getSession =
      async () => ({ data: { session: null } });
    await expect(
      new SupabaseFieldRemote(client).fetchRoster(),
    ).rejects.toMatchObject({
      kind: 'auth',
    });
  });
});

describe('classifyStorageFailure', () => {
  it('counts a photo already there as stored', () => {
    expect(
      classifyStorageFailure({
        message: 'The resource already exists',
        statusCode: '409',
      }),
    ).toBe('exists');
  });

  it('tells no signal, a lost session, a refusal and a busy server apart', () => {
    expect(classifyStorageFailure({ message: 'Failed to fetch' })).toBe(
      'offline',
    );
    expect(
      classifyStorageFailure({ message: 'jwt expired', status: 400 }),
    ).toBe('auth');
    expect(
      classifyStorageFailure({
        message: 'new row violates row-level security policy',
        statusCode: '403',
      }),
    ).toBe('rejected');
    expect(
      classifyStorageFailure({ message: 'Payload too large', status: 413 }),
    ).toBe('rejected');
    expect(
      classifyStorageFailure({ message: 'Bad gateway', status: 502 }),
    ).toBe('server');
  });
});

describe('SupabaseFieldRemote.pushCheck', () => {
  /** Upserts fail with `upsertError`; a select answers `signedAt`. */
  function checkClient(upsertError: unknown, signedAt: string | null) {
    const sent: unknown[] = [];
    const client = {
      from() {
        return {
          upsert(row: unknown) {
            sent.push(row);
            return Promise.resolve({
              data: null,
              error: upsertError,
              status: upsertError ? 403 : 201,
            });
          },
          select() {
            return {
              eq: () =>
                Promise.resolve({
                  data: [{ signed_at: signedAt }],
                  error: null,
                  status: 200,
                }),
            };
          },
        };
      },
      auth: {
        getSession: async () => ({
          data: { session: { user: { id: 'sup-1' } } },
        }),
      },
    };
    return { client: client as unknown as SupabaseClient, sent };
  }

  const signed = {
    id: 'check-1',
    date: '2026-11-23',
    greenhouseId: 'gh-1',
    supervisorId: 'someone-else',
    answers: [
      { itemId: 'hyg-1', ok: false, note: 'no soap', photoPaths: ['p.jpg'] },
    ],
    signedAt: '2026-11-23T08:00:00.000Z',
  };
  const rls = {
    message: 'new row violates row-level security policy',
    code: '42501',
  };

  it('sends the check as the signed-in supervisor', async () => {
    const { client, sent } = checkClient(null, null);
    await new SupabaseFieldRemote(client).pushCheck('farm-1', signed);
    expect(sent[0]).toEqual({
      id: 'check-1',
      farm_id: 'farm-1',
      check_date: '2026-11-23',
      greenhouse_id: 'gh-1',
      supervisor_id: 'sup-1',
      answers: [
        { itemId: 'hyg-1', ok: false, note: 'no soap', photoPaths: ['p.jpg'] },
      ],
      signed_at: '2026-11-23T08:00:00.000Z',
    });
  });

  it('counts a signed check the server already has signed as sent', async () => {
    const { client } = checkClient(rls, '2026-11-23T08:00:00+00');
    await expect(
      new SupabaseFieldRemote(client).pushCheck('farm-1', signed),
    ).resolves.toBeUndefined();
  });

  it('passes any other refusal on', async () => {
    const { client } = checkClient(rls, null);
    await expect(
      new SupabaseFieldRemote(client).pushCheck('farm-1', signed),
    ).rejects.toMatchObject({ kind: 'rejected' });
  });
});
