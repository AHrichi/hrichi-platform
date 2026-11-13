import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import type { MasteryTier, StreakSummary } from '@ah/learning/domain';
import { AhButton } from '@ah/ui';
import { StreakFlame } from '../streak-flame/streak-flame';

export interface TierMilestoneGain {
  title: string;
  tier: MasteryTier;
}

const TIER_NAMES: Record<MasteryTier, string> = {
  seed: 'Seed',
  sprout: 'Sprout',
  leaf: 'Leaf',
  bloom: 'Bloom',
  golden: 'Golden',
};

/**
 * End-of-set celebration card shown after a Daily Set or bonus round
 * completes (or when nothing is due today), displaying streak, growth, XP
 * progress, and tomorrow's load estimate.
 */
@Component({
  selector: 'lrn-set-completion',
  imports: [AhButton, StreakFlame],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './set-completion.html',
  styleUrl: './set-completion.scss',
})
export class SetCompletion {
  readonly hadCards = input.required<boolean>();
  readonly streak = input.required<StreakSummary>();
  readonly grewTo = input<readonly TierMilestoneGain[]>([]);
  readonly strongCount = input(0);
  readonly xp = input.required<{ level: number; into: number; span: number }>();
  readonly tomorrow = input(0);
  readonly tomorrowMinutes = input(0);
  readonly busy = input(false);

  readonly closed = output<void>();
  readonly bonusRequested = output<void>();

  protected readonly tierNames = TIER_NAMES;
}
