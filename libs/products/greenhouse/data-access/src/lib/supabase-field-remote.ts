import {
  type Crop,
  type Greenhouse,
  isCrop,
  type Team,
  type Worker,
} from '@ah/products/greenhouse/domain';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Roster } from './field-database';
import {
  type FieldRemote,
  type LogChange,
  RemoteError,
  type RemoteErrorKind,
} from './field-remote';

/** The parts of a PostgREST reply that say what went wrong. */
export interface PostgrestFailure {
  status: number;
  error: { message: string; code?: string } | null;
}

/**
 * What a failed PostgREST call means for the sync. Data the database
 * refuses (constraints, RLS, bad values) is `rejected`; a missing network,
 * a timeout or a busy server is worth retrying.
 */
export function classifyFailure({
  status,
  error,
}: PostgrestFailure): RemoteErrorKind {
  const code = error?.code ?? '';
  const message = error?.message ?? '';
  if (
    status === 0 ||
    /failed to fetch|networkerror|fetch failed|load failed/i.test(message) ||
    // Angular's service worker answers a request it couldn't send with an
    // empty 504, which is how no signal looks once the app is installed.
    (status === 504 && !code)
  ) {
    return 'offline';
  }
  if (status === 401 || code.startsWith('PGRST30') || /jwt/i.test(message)) {
    return 'auth';
  }
  if (status === 408 || status === 429 || status >= 500) return 'server';
  // 22xxx bad data, 23xxx constraints, 42501 row-level security.
  if (
    /^(22|23)/.test(code) ||
    code === '42501' ||
    (status >= 400 && status < 500)
  ) {
    return 'rejected';
  }
  return 'server';
}

interface WorkLogRow {
  id: string;
  farm_id: string;
  work_date: string;
  worker_id: string;
  team_id: string | null;
  greenhouse_id: string;
  kg: number;
  crates: number;
  rejected_crates: number;
  hours: number;
  recorded_at: string;
}

function toRow({ farmId, log }: LogChange): WorkLogRow {
  // recorded_by and synced_at are the server's to set.
  return {
    id: log.id,
    farm_id: farmId,
    work_date: log.date,
    worker_id: log.workerId,
    team_id: log.teamId,
    greenhouse_id: log.greenhouseId,
    kg: log.kg,
    crates: log.crates,
    rejected_crates: log.rejectedCrates,
    hours: log.hours,
    recorded_at: log.recordedAt,
  };
}

/**
 * The field app's server in standalone mode: Supabase, as the signed-in
 * supervisor, so row-level security decides what goes through.
 */
export class SupabaseFieldRemote implements FieldRemote {
  constructor(
    private readonly client: SupabaseClient,
    /** Which farm to use when the supervisor belongs to several. */
    private readonly preferredFarmId: string | null = null,
  ) {}

  async pushLogs(changes: readonly LogChange[]): Promise<void> {
    const creates = changes.filter((c) => c.op === 'create').map(toRow);
    const updates = changes.filter((c) => c.op === 'update').map(toRow);
    // Creates go first and never overwrite, so a batch that fails halfway
    // is safe to send again.
    if (creates.length > 0) {
      await this.call(
        this.client
          .from('work_log')
          .upsert(creates, { onConflict: 'id', ignoreDuplicates: true }),
      );
    }
    if (updates.length > 0) {
      await this.call(
        this.client.from('work_log').upsert(updates, { onConflict: 'id' }),
      );
    }
  }

  async fetchRoster(): Promise<Roster> {
    const session = await this.client.auth.getSession();
    const userId = session.data.session?.user.id;
    if (!userId) throw new RemoteError('auth', 'Not signed in');

    const memberships = await this.call(
      this.client.from('member').select('farm_id, role').eq('user_id', userId),
    );
    const farmIds = (memberships ?? []).map(
      (m: { farm_id: string }) => m.farm_id,
    );
    const farmId =
      farmIds.find((id: string) => id === this.preferredFarmId) ?? farmIds[0];
    if (!farmId) {
      throw new RemoteError('rejected', 'This account is not on any farm yet');
    }

    const [greenhouses, teams, workers] = await Promise.all([
      this.call(
        this.client
          .from('greenhouse')
          .select('id, name, area_m2, crop, kg_per_crate, active')
          .eq('farm_id', farmId)
          .order('name'),
      ),
      this.call(
        this.client
          .from('team')
          .select('id, name, supervisor_id')
          .eq('farm_id', farmId)
          .order('name'),
      ),
      this.call(
        this.client
          .from('worker')
          .select('id, full_name, team_id, badge_code, active')
          .eq('farm_id', farmId)
          .order('full_name'),
      ),
    ]);

    return {
      farmId,
      fetchedAt: new Date().toISOString(),
      greenhouses: (greenhouses ?? []).map(
        (g: Record<string, unknown>): Greenhouse => ({
          id: String(g['id']),
          name: String(g['name']),
          areaM2: Number(g['area_m2']),
          crop: isCrop(g['crop']) ? g['crop'] : ('other' as Crop),
          kgPerCrate: Number(g['kg_per_crate']),
          active: Boolean(g['active']),
        }),
      ),
      teams: (teams ?? []).map((t: Record<string, unknown>): Team => ({
        id: String(t['id']),
        name: String(t['name']),
        supervisorId: (t['supervisor_id'] as string | null) ?? null,
      })),
      workers: (workers ?? []).map((w: Record<string, unknown>): Worker => ({
        id: String(w['id']),
        fullName: String(w['full_name']),
        teamId: (w['team_id'] as string | null) ?? null,
        badgeCode: String(w['badge_code']),
        active: Boolean(w['active']),
      })),
    };
  }

  /** Awaits a query and turns a failure into a `RemoteError`. */
  private async call<T>(
    query: PromiseLike<{
      data: T;
      error: { message: string; code?: string } | null;
      status: number;
    }>,
  ): Promise<T> {
    let reply: Awaited<typeof query>;
    try {
      reply = await query;
    } catch (error) {
      throw new RemoteError('offline', String(error));
    }
    if (reply.error) {
      throw new RemoteError(classifyFailure(reply), reply.error.message);
    }
    return reply.data;
  }
}
