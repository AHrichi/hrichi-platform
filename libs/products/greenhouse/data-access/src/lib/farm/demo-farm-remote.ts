import {
  type Absence,
  addDays,
  type Greenhouse,
  type Invitation,
  type IsoDate,
  type Member,
  type PlanEntry,
  type Role,
  sampleFarm,
  startOfWeek,
  type Team,
  todayOnFarm,
  type Worker,
  type WorkerPay,
} from '@ah/products/greenhouse/domain';
import type {
  FarmAccess,
  FarmRemote,
  FarmSetup,
  FarmWeek,
  InviteResult,
} from './farm-remote';

export const DEMO_FARM_ID = 'demo-farm';

/**
 * A pretend server for the portfolio demo: the sample farm, with the
 * visitor as its manager. Changes stay in memory until the page reloads.
 */
export class DemoFarmRemote implements FarmRemote {
  private readonly greenhouses: Greenhouse[];
  private readonly teams: Team[];
  private readonly workers: Worker[];
  private readonly pay: Map<string, number>;
  private readonly members: Member[];
  private readonly invitations: Invitation[] = [];
  /** Plan rows the visitor changed (week|greenhouse), over the sample's. */
  private readonly rows = new Map<string, PlanEntry[]>();
  /** Absences the visitor added, and sample ones they removed. */
  private readonly addedAbsences = new Map<string, Absence>();
  private readonly removedAbsences = new Set<string>();

  constructor(
    today: IsoDate = todayOnFarm(),
    private readonly latencyMs = 250,
  ) {
    const farm = sampleFarm(startOfWeek(today));
    this.greenhouses = farm.greenhouses;
    this.teams = farm.teams;
    this.workers = farm.workers;
    this.pay = new Map(farm.pay.map((p) => [p.workerId, p.hourlyRate]));
    this.members = [
      { userId: 'demo-manager', fullName: 'Demo manager', role: 'manager' },
      ...farm.teams.map((t, i): Member => ({
        userId: t.supervisorId ?? `sup-${i + 1}`,
        fullName: `Supervisor ${t.name.split(' ').pop() ?? i + 1}`,
        role: 'supervisor',
      })),
      { userId: 'demo-hr', fullName: 'HR office', role: 'hr' },
    ];
  }

  async farms(): Promise<FarmAccess[]> {
    await this.reply();
    return [{ farmId: DEMO_FARM_ID, farmName: 'Demo farm', role: 'manager' }];
  }

  async createFarm(): Promise<string> {
    await this.reply();
    return DEMO_FARM_ID;
  }

  async loadSetup(): Promise<FarmSetup> {
    await this.reply();
    return {
      greenhouses: this.greenhouses.map((g) => ({ ...g })),
      teams: this.teams.map((t) => ({ ...t })),
      workers: this.workers.map((w) => ({ ...w })),
      pay: [...this.pay].map(([workerId, hourlyRate]): WorkerPay => ({
        workerId,
        hourlyRate,
      })),
      members: this.members.map((m) => ({ ...m })),
      invitations: this.invitations.map((i) => ({ ...i })),
    };
  }

  async loadWeek(_farmId: string, weekStart: IsoDate): Promise<FarmWeek> {
    await this.reply();
    const sample = sampleFarm(weekStart);
    const plan = sample.plan
      .filter((p) => !this.rows.has(`${weekStart}|${p.greenhouseId}`))
      .concat(
        [...this.rows]
          .filter(([key]) => key.startsWith(`${weekStart}|`))
          .flatMap(([, entries]) => entries),
      );
    const weekEnd = addDays(weekStart, 6);
    const absences = [
      ...sample.absences.filter((a) => !this.removedAbsences.has(a.id)),
      ...[...this.addedAbsences.values()],
    ].filter((a) => a.from <= weekEnd && a.to >= weekStart);
    return {
      weekStart,
      plan: plan.map((p) => ({ ...p })),
      absences: absences.map((a) => ({ ...a })),
      history: sample.history,
    };
  }

  async saveGreenhouse(_farmId: string, greenhouse: Greenhouse): Promise<void> {
    await this.reply();
    upsert(this.greenhouses, { ...greenhouse });
  }

  async saveTeam(_farmId: string, team: Team): Promise<void> {
    await this.reply();
    upsert(this.teams, { ...team });
  }

  async deleteTeam(_farmId: string, teamId: string): Promise<void> {
    await this.reply();
    remove(this.teams, teamId);
    for (const w of this.workers) if (w.teamId === teamId) w.teamId = null;
  }

  async saveWorker(
    _farmId: string,
    worker: Worker,
    hourlyRate: number | null,
  ): Promise<void> {
    await this.reply();
    upsert(this.workers, { ...worker });
    if (hourlyRate !== null) this.pay.set(worker.id, hourlyRate);
  }

  async savePlanRow(
    _farmId: string,
    weekStart: IsoDate,
    greenhouseId: string,
    entries: readonly PlanEntry[],
  ): Promise<void> {
    await this.reply();
    this.rows.set(
      `${weekStart}|${greenhouseId}`,
      entries.map((e) => ({ ...e })),
    );
  }

  async saveAbsence(_farmId: string, absence: Absence): Promise<void> {
    await this.reply();
    this.removedAbsences.delete(absence.id);
    this.addedAbsences.set(absence.id, { ...absence });
  }

  async deleteAbsence(_farmId: string, absenceId: string): Promise<void> {
    await this.reply();
    this.addedAbsences.delete(absenceId);
    this.removedAbsences.add(absenceId);
  }

  async invite(
    _farmId: string,
    email: string,
    role: Role,
    fullName: string,
  ): Promise<InviteResult> {
    await this.reply();
    const existing = this.invitations.find((i) => i.email === email);
    if (existing) Object.assign(existing, { role, fullName });
    else this.invitations.push({ email, role, fullName });
    return 'invited';
  }

  async cancelInvitation(_farmId: string, email: string): Promise<void> {
    await this.reply();
    const i = this.invitations.findIndex((x) => x.email === email);
    if (i >= 0) this.invitations.splice(i, 1);
  }

  async removeMember(_farmId: string, userId: string): Promise<void> {
    await this.reply();
    const i = this.members.findIndex((m) => m.userId === userId);
    if (i >= 0) this.members.splice(i, 1);
  }

  private reply(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.latencyMs));
  }
}

function upsert<T extends { id: string }>(list: T[], item: T): void {
  const i = list.findIndex((x) => x.id === item.id);
  if (i >= 0) list[i] = item;
  else list.push(item);
}

function remove<T extends { id: string }>(list: T[], id: string): void {
  const i = list.findIndex((x) => x.id === id);
  if (i >= 0) list.splice(i, 1);
}
