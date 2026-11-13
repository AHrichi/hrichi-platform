import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import type { GardenTheme, MasteryTier } from '@ah/learning/domain';

export interface GardenLeaf {
  id: string;
  title: string;
  tier: MasteryTier;
  wilting: boolean;
  /** Position along the stem and side, for the drawing. */
  x: number;
  y: number;
  side: -1 | 1;
}

export interface GardenPlant {
  key: string;
  name: string;
  leaves: GardenLeaf[];
  hidden: number;
  wilting: number;
  counts: string;
  stemTop: number;
}

const TIER_NAMES: Record<MasteryTier, string> = {
  seed: 'Seed',
  sprout: 'Sprout',
  leaf: 'Leaf',
  bloom: 'Bloom',
  golden: 'Golden',
};

/**
 * Pure presentational Knowledge Garden (design §3): one plant per topic, one
 * leaf per concept sized by mastery tier. Concepts due for review droop until
 * reviewed; nothing ever dies.
 */
@Component({
  selector: 'lrn-knowledge-garden',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './knowledge-garden.html',
  styleUrl: './knowledge-garden.scss',
})
export class KnowledgeGarden {
  readonly plants = input<readonly GardenPlant[]>([]);
  readonly theme = input<GardenTheme>('meadow');
  readonly emptyText = input(
    'Nothing planted yet. Keep a few ideas from the Inbox and they appear here after your first reviews.',
  );

  readonly reviewRequested = output<GardenPlant>();

  protected readonly tierNames = TIER_NAMES;
}
