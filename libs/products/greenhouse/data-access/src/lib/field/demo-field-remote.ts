import type { SampleFarm, WorkLog } from '@ah/products/greenhouse/domain';
import type { Roster } from './field-database';
import { RemoteError } from '../remote/remote-error';
import type { FieldRemote, LogChange } from './field-remote';

/**
 * A pretend server for the portfolio demo: it answers from the sample farm
 * and keeps what it's sent in memory. Switch `online` off to show what the
 * app does inside a greenhouse with no signal.
 */
export class DemoFieldRemote implements FieldRemote {
  online = true;
  readonly received = new Map<string, WorkLog>();

  constructor(
    private readonly farm: Pick<
      SampleFarm,
      'greenhouses' | 'teams' | 'workers'
    >,
    private readonly latencyMs = 400,
  ) {}

  async pushLogs(changes: readonly LogChange[]): Promise<void> {
    await this.reply();
    for (const { op, log } of changes) {
      if (op === 'create' && this.received.has(log.id)) continue;
      this.received.set(log.id, { ...log, syncedAt: new Date().toISOString() });
    }
  }

  async fetchRoster(): Promise<Roster> {
    await this.reply();
    return {
      farmId: 'demo-farm',
      fetchedAt: new Date().toISOString(),
      greenhouses: this.farm.greenhouses.map((g) => ({ ...g })),
      teams: this.farm.teams.map((t) => ({ ...t })),
      workers: this.farm.workers.map((w) => ({ ...w })),
    };
  }

  private async reply(): Promise<void> {
    if (!this.online) throw new RemoteError('offline', 'No signal (demo)');
    await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    if (!this.online) throw new RemoteError('offline', 'No signal (demo)');
  }
}
