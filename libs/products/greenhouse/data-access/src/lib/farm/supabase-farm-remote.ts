import {
  type Absence,
  addDays,
  type Greenhouse,
  type Invitation,
  type IsoDate,
  type PlanEntry,
  isRole,
  type Role,
  type Team,
  type WeeklyTarget,
  type Worker,
} from '@ah/products/greenhouse/domain';
import type { SupabaseClient } from '@supabase/supabase-js';
import { callPostgrest } from '../remote/postgrest';
import { RemoteError } from '../remote/remote-error';
import {
  type FarmAccess,
  type FarmPerformance,
  type FarmRemote,
  type FarmSetup,
  type FarmWeek,
  HISTORY_DAYS,
  type InviteResult,
} from './farm-remote';
import {
  absenceFrom,
  absenceRow,
  GREENHOUSE_COLUMNS,
  greenhouseFrom,
  greenhouseRow,
  memberFrom,
  planFrom,
  type Row,
  TARGET_COLUMNS,
  targetFrom,
  targetRow,
  TEAM_COLUMNS,
  teamFrom,
  teamRow,
  teamWeekFrom,
  totalsFrom,
  WORKER_COLUMNS,
  workerFrom,
  workerRow,
  workerTotalsFrom,
} from '../remote/rows';

/**
 * The dashboard's server: Supabase as the signed-in person, so row-level
 * security decides what they read and write (HR reads, managers write).
 * Reads stay under the API's row limit (`max_rows`, 1000): a farm's
 * roster, a week's plan and absences, five weeks of daily totals, and
 * performance totals per team and week or per worker (a farm of up to a
 * thousand workers).
 */
export class SupabaseFarmRemote implements FarmRemote {
  constructor(private readonly client: SupabaseClient) {}

  async farms(): Promise<FarmAccess[]> {
    const session = await this.client.auth.getSession();
    const userId = session.data.session?.user.id;
    if (!userId) throw new RemoteError('auth', 'Not signed in');
    const rows = await callPostgrest<Row[] | null>(
      this.client
        .from('member')
        .select('farm_id, role, farm(name)')
        .eq('user_id', userId),
    );
    return (rows ?? [])
      .map((row) => ({
        farmId: String(row['farm_id']),
        farmName: String((row['farm'] as Row | null)?.['name'] ?? ''),
        role: isRole(row['role']) ? row['role'] : 'supervisor',
      }))
      .sort((a, b) => a.farmName.localeCompare(b.farmName));
  }

  async createFarm(farmName: string, managerName: string): Promise<string> {
    const id = await callPostgrest<string | null>(
      this.client.rpc('create_farm', {
        farm_name: farmName,
        manager_name: managerName,
      }),
    );
    return String(id);
  }

  async loadSetup(farmId: string): Promise<FarmSetup> {
    const db = this.client;
    const [greenhouses, teams, workers, pay, members, invitations] =
      await Promise.all([
        callPostgrest<Row[] | null>(
          db
            .from('greenhouse')
            .select(GREENHOUSE_COLUMNS)
            .eq('farm_id', farmId)
            .order('name'),
        ),
        callPostgrest<Row[] | null>(
          db
            .from('team')
            .select(TEAM_COLUMNS)
            .eq('farm_id', farmId)
            .order('name'),
        ),
        callPostgrest<Row[] | null>(
          db
            .from('worker')
            .select(WORKER_COLUMNS)
            .eq('farm_id', farmId)
            .order('badge_code'),
        ),
        callPostgrest<Row[] | null>(
          db
            .from('worker_pay')
            .select('worker_id, hourly_rate')
            .eq('farm_id', farmId),
        ),
        callPostgrest<Row[] | null>(
          db
            .from('member')
            .select('user_id, role, full_name')
            .eq('farm_id', farmId)
            .order('full_name'),
        ),
        callPostgrest<Row[] | null>(
          db
            .from('invitation')
            .select('email, role, full_name')
            .eq('farm_id', farmId)
            .order('email'),
        ),
      ]);
    return {
      greenhouses: (greenhouses ?? []).map(greenhouseFrom),
      teams: (teams ?? []).map(teamFrom),
      workers: (workers ?? []).map(workerFrom),
      pay: (pay ?? []).map((row) => ({
        workerId: String(row['worker_id']),
        hourlyRate: Number(row['hourly_rate']),
      })),
      members: (members ?? []).map(memberFrom),
      invitations: (invitations ?? []).map((row): Invitation => ({
        email: String(row['email']),
        fullName: String(row['full_name']),
        role: isRole(row['role']) ? row['role'] : 'supervisor',
      })),
    };
  }

  async loadWeek(farmId: string, weekStart: IsoDate): Promise<FarmWeek> {
    const db = this.client;
    const weekEnd = addDays(weekStart, 6);
    const [plan, absences, totals, target] = await Promise.all([
      callPostgrest<Row[] | null>(
        db
          .from('weekly_plan')
          .select(
            'week_start, day, greenhouse_id, team_id, expected_kg, hours_per_day',
          )
          .eq('farm_id', farmId)
          .eq('week_start', weekStart),
      ),
      // Every absence that overlaps the week.
      callPostgrest<Row[] | null>(
        db
          .from('absence')
          .select('id, worker_id, from_date, to_date, reason')
          .eq('farm_id', farmId)
          .lte('from_date', weekEnd)
          .gte('to_date', weekStart)
          .order('from_date'),
      ),
      callPostgrest<Row[] | null>(
        db.rpc('work_totals', {
          target_farm: farmId,
          from_date: addDays(weekStart, -HISTORY_DAYS),
          to_date: addDays(weekStart, 7),
        }),
      ),
      // The target in force: the latest set on or before the week.
      callPostgrest<Row[] | null>(
        db
          .from('target')
          .select(TARGET_COLUMNS)
          .eq('farm_id', farmId)
          .lte('week_start', weekStart)
          .order('week_start', { ascending: false })
          .limit(1),
      ),
    ]);
    const [targetRowFound] = target ?? [];
    return {
      weekStart,
      plan: (plan ?? []).map(planFrom),
      absences: (absences ?? []).map(absenceFrom),
      history: (totals ?? []).map(totalsFrom),
      target: targetRowFound ? targetFrom(targetRowFound) : null,
    };
  }

  async loadPerformance(
    farmId: string,
    from: IsoDate,
    to: IsoDate,
  ): Promise<FarmPerformance> {
    const db = this.client;
    const range = { target_farm: farmId, from_date: from, to_date: to };
    const [teamWeeks, workers, targets] = await Promise.all([
      callPostgrest<Row[] | null>(db.rpc('team_week_totals', range)),
      callPostgrest<Row[] | null>(db.rpc('worker_totals', range)),
      callPostgrest<Row[] | null>(
        db
          .from('target')
          .select(TARGET_COLUMNS)
          .eq('farm_id', farmId)
          .lte('week_start', to)
          .order('week_start'),
      ),
    ]);
    return {
      from,
      to,
      teamWeeks: (teamWeeks ?? []).map(teamWeekFrom),
      workers: (workers ?? []).map(workerTotalsFrom),
      targets: (targets ?? []).map(targetFrom),
    };
  }

  async saveTarget(farmId: string, target: WeeklyTarget): Promise<void> {
    await callPostgrest(
      this.client.from('target').upsert(targetRow(farmId, target), {
        onConflict: 'farm_id,week_start',
      }),
    );
  }

  async saveGreenhouse(farmId: string, greenhouse: Greenhouse): Promise<void> {
    await callPostgrest(
      this.client.from('greenhouse').upsert(greenhouseRow(farmId, greenhouse)),
    );
  }

  async saveTeam(farmId: string, team: Team): Promise<void> {
    await callPostgrest(this.client.from('team').upsert(teamRow(farmId, team)));
  }

  async deleteTeam(farmId: string, teamId: string): Promise<void> {
    await callPostgrest(
      this.client.from('team').delete().eq('farm_id', farmId).eq('id', teamId),
    );
  }

  async saveWorker(
    farmId: string,
    worker: Worker,
    hourlyRate: number | null,
  ): Promise<void> {
    await callPostgrest(
      this.client.from('worker').upsert(workerRow(farmId, worker)),
    );
    if (hourlyRate !== null) {
      await callPostgrest(
        this.client.from('worker_pay').upsert({
          worker_id: worker.id,
          farm_id: farmId,
          hourly_rate: hourlyRate,
          updated_at: new Date().toISOString(),
        }),
      );
    }
  }

  async savePlanRow(
    farmId: string,
    weekStart: IsoDate,
    greenhouseId: string,
    entries: readonly PlanEntry[],
  ): Promise<void> {
    await callPostgrest(
      this.client.rpc('save_plan_row', {
        target_farm: farmId,
        week: weekStart,
        target_greenhouse: greenhouseId,
        cells: entries.map((e) => ({
          day: e.day,
          team_id: e.teamId,
          expected_kg: e.expectedKg,
          hours_per_day: e.hoursPerDay,
        })),
      }),
    );
  }

  async saveAbsence(farmId: string, absence: Absence): Promise<void> {
    await callPostgrest(
      this.client.from('absence').upsert(absenceRow(farmId, absence)),
    );
  }

  async deleteAbsence(farmId: string, absenceId: string): Promise<void> {
    await callPostgrest(
      this.client
        .from('absence')
        .delete()
        .eq('farm_id', farmId)
        .eq('id', absenceId),
    );
  }

  async invite(
    farmId: string,
    email: string,
    role: Role,
    fullName: string,
  ): Promise<InviteResult> {
    const result = await callPostgrest<string | null>(
      this.client.rpc('invite_member', {
        target_farm: farmId,
        invitee_email: email,
        invitee_role: role,
        invitee_name: fullName,
      }),
    );
    return result === 'added' || result === 'updated' ? result : 'invited';
  }

  async cancelInvitation(farmId: string, email: string): Promise<void> {
    await callPostgrest(
      this.client
        .from('invitation')
        .delete()
        .eq('farm_id', farmId)
        .eq('email', email),
    );
  }

  async removeMember(farmId: string, userId: string): Promise<void> {
    await callPostgrest(
      this.client
        .from('member')
        .delete()
        .eq('farm_id', farmId)
        .eq('user_id', userId),
    );
  }
}
