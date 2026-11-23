import type { SupabaseClient } from '@supabase/supabase-js';
import { callPostgrest } from '../remote/postgrest';
import { RemoteError } from '../remote/remote-error';
import {
  GREENHOUSE_COLUMNS,
  greenhouseFrom,
  type Row,
  TEAM_COLUMNS,
  teamFrom,
  WORKER_COLUMNS,
  workerFrom,
} from '../remote/rows';
import type { Roster } from './field-database';
import type { FieldRemote, LogChange } from './field-remote';

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
      await callPostgrest(
        this.client
          .from('work_log')
          .upsert(creates, { onConflict: 'id', ignoreDuplicates: true }),
      );
    }
    if (updates.length > 0) {
      await callPostgrest(
        this.client.from('work_log').upsert(updates, { onConflict: 'id' }),
      );
    }
  }

  async fetchRoster(): Promise<Roster> {
    const session = await this.client.auth.getSession();
    const userId = session.data.session?.user.id;
    if (!userId) throw new RemoteError('auth', 'Not signed in');

    const memberships = await callPostgrest<Row[] | null>(
      this.client.from('member').select('farm_id').eq('user_id', userId),
    );
    const farmIds = (memberships ?? []).map((m) => String(m['farm_id']));
    const farmId =
      farmIds.find((id) => id === this.preferredFarmId) ?? farmIds[0];
    if (!farmId) {
      throw new RemoteError('rejected', 'This account is not on any farm yet');
    }

    const [greenhouses, teams, workers] = await Promise.all([
      callPostgrest<Row[] | null>(
        this.client
          .from('greenhouse')
          .select(GREENHOUSE_COLUMNS)
          .eq('farm_id', farmId)
          .order('name'),
      ),
      callPostgrest<Row[] | null>(
        this.client
          .from('team')
          .select(TEAM_COLUMNS)
          .eq('farm_id', farmId)
          .order('name'),
      ),
      callPostgrest<Row[] | null>(
        this.client
          .from('worker')
          .select(WORKER_COLUMNS)
          .eq('farm_id', farmId)
          .order('full_name'),
      ),
    ]);

    return {
      farmId,
      fetchedAt: new Date().toISOString(),
      greenhouses: (greenhouses ?? []).map(greenhouseFrom),
      teams: (teams ?? []).map(teamFrom),
      workers: (workers ?? []).map(workerFrom),
    };
  }
}
