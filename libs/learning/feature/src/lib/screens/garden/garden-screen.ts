import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { type MasteryTier, retrievability, tierOf } from '@ah/learning/domain';
import { type GardenPlant, KnowledgeGarden } from '@ah/learning/ui';
import { AhButton } from '@ah/ui';
import { LearningStore } from '../../store/learning.store';

/** Leaves drawn per plant; the rest are counted. */
const MAX_LEAVES = 14;
/** Below this chance of recall, a reviewed concept droops. */
const WILT_BELOW = 0.8;
/** The stem's height in the drawing, shared by its leaves. */
const STEM_SPAN = 100;
/** Most room between two leaves, so small plants are not squat. */
const LEAF_GAP = 16;

const TIER_NAMES: Record<MasteryTier, string> = {
  seed: 'Seed',
  sprout: 'Sprout',
  leaf: 'Leaf',
  bloom: 'Bloom',
  golden: 'Golden',
};

/**
 * The Knowledge Garden (design §3): a plant per topic and a leaf per
 * concept, shaped by its mastery tier (Seed → Golden). Concepts whose
 * recall has dropped droop until they are reviewed; nothing ever dies.
 * The drawing is decorative; the list beside each plant says the same.
 */
@Component({
  selector: 'lrn-garden-screen',
  imports: [AhButton, KnowledgeGarden, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './garden-screen.html',
  styleUrl: './garden-screen.scss',
})
export class GardenScreen {
  protected readonly store = inject(LearningStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly plants = computed<GardenPlant[]>(() => {
    const now = new Date(this.store.now());
    const memory = this.store.memory();
    const names = new Map(this.store.topics().map((t) => [t.id, t.name]));
    const groups = new Map<string, { name: string; ids: string[] }>();
    for (const concept of this.store.library()) {
      const key = concept.topicId ?? 'loose';
      const group = groups.get(key) ?? {
        name: (concept.topicId && names.get(concept.topicId)) || 'Loose seeds',
        ids: [],
      };
      group.ids.push(concept.id);
      groups.set(key, group);
    }
    return [...groups.entries()]
      .map(([key, group]) => {
        const leaves = group.ids
          .map((id) => {
            const concept = this.store.library().find((c) => c.id === id);
            const state = memory.get(id);
            const tier = state ? tierOf(state) : 'seed';
            return {
              id,
              title: concept?.title ?? '',
              tier,
              wilting: !!state?.reps && retrievability(state, now) < WILT_BELOW,
            };
          })
          .sort((a, b) => a.title.localeCompare(b.title));
        const drawn = leaves.slice(0, MAX_LEAVES).map((leaf, i) => ({
          ...leaf,
          x: 60,
          y:
            116 -
            i *
              Math.min(
                LEAF_GAP,
                STEM_SPAN / Math.min(leaves.length, MAX_LEAVES),
              ),
          side: (i % 2 === 0 ? -1 : 1) as -1 | 1,
        }));
        const count = (tier: MasteryTier) =>
          leaves.filter((leaf) => leaf.tier === tier).length;
        const counts = (['golden', 'bloom', 'leaf', 'sprout', 'seed'] as const)
          .filter((tier) => count(tier))
          .map((tier) => `${count(tier)} ${TIER_NAMES[tier].toLowerCase()}`)
          .join(' · ');
        return {
          key,
          name: group.name,
          leaves: drawn,
          hidden: leaves.length - drawn.length,
          wilting: leaves.filter((leaf) => leaf.wilting).length,
          counts,
          stemTop: drawn.length ? drawn[drawn.length - 1].y - 6 : 116,
        };
      })
      .sort(
        (a, b) =>
          b.leaves.length - a.leaves.length || a.name.localeCompare(b.name),
      );
  });

  protected goToday(): void {
    void this.router.navigate(['../today'], { relativeTo: this.route });
  }
}
