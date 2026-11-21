import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  formatMs,
  formatPercent,
  LAB_CHALLENGES,
  type LabChallenge,
  type LabDesign,
} from '@ah/products/system-design/domain';
import { LAB_COPY } from '../../copy/lab-copy';
import {
  type ChallengeStatus,
  SANDBOX_ID,
  statusOf,
} from '../../store/lab.store';
import { SystemDesignRuntime } from '../../store/system-design-runtime';

export interface ChallengeCard {
  challenge: LabChallenge;
  goals: readonly string[];
  status: ChallengeStatus;
}

/** Plain-English goal chips for a card. */
export function goalSummary(challenge: LabChallenge): string[] {
  const g = challenge.goals;
  const out = [`${challenge.traffic.rps.toLocaleString('en-US')} rps`];
  if (g.maxP95 !== undefined) out.push(`p95 ≤ ${formatMs(g.maxP95)}`);
  if (g.maxErrorRate !== undefined)
    out.push(`errors ≤ ${formatPercent(g.maxErrorRate)}`);
  if (g.maxCost !== undefined) out.push(`cost ≤ ${g.maxCost}`);
  if (g.survivesAnySingleFailure?.length) out.push('survives a failure');
  return out;
}

/** The Design Lab's index (`lab`): the challenges and the sandbox. */
@Component({
  selector: 'sd-lab-home',
  imports: [RouterLink],
  templateUrl: './lab-home.html',
  styleUrl: './lab-home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabHome {
  protected readonly copy = LAB_COPY;
  protected readonly sandboxId = SANDBOX_ID;
  private readonly runtime = inject(SystemDesignRuntime);
  private readonly saved = signal<ReadonlyMap<string, LabDesign>>(new Map());

  protected readonly cards = computed<readonly ChallengeCard[]>(() =>
    LAB_CHALLENGES.map((challenge) => ({
      challenge,
      goals: goalSummary(challenge),
      status: statusOf(challenge.id, this.saved().get(challenge.id)),
    })),
  );

  constructor() {
    void this.loadSaved();
  }

  private async loadSaved(): Promise<void> {
    try {
      const rows = (await (await this.runtime.open())?.allDesigns()) ?? [];
      this.saved.set(new Map(rows.map((r) => [r.id, r.design])));
    } catch {
      // Statuses stay "not started" without storage.
    }
  }
}
