import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  type OnInit,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  HOST_TIERS,
  type HostTier,
  LearningClient,
  LearningLink,
} from '@ah/learning/client';
import { AhButton } from '@ah/ui';
import { PreferencesStore } from '@ah/shared/state';
import { STUDYLM_COPY } from '../../i18n/studylm-copy';

const TIER_ICONS: Record<HostTier, string> = {
  seed: '🌰',
  sprout: '🌱',
  leaf: '🍃',
  bloom: '🌸',
  golden: '✨',
};

/**
 * StudyLM's window on the Learning Engine (design §9): the streak, today's
 * set and how StudyLM's cards grow there, read through the link. Unlinked,
 * it offers to connect. Only standalone StudyLM can link; inside the
 * portfolio (a demo) the panel stays hidden.
 */
@Component({
  selector: 'ah-studylm-reviews-panel',
  imports: [AhButton, DatePipe],
  templateUrl: './reviews-panel.component.html',
  styleUrl: './reviews-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsPanelComponent implements OnInit {
  protected readonly link = inject(LearningLink);
  private readonly client = inject(LearningClient);
  protected readonly reviewsUrl = this.client.urlFor('today');
  /** The learning app's guide, which explains the link step by step. */
  protected readonly guideUrl = this.client.urlFor('guide');
  private readonly preferences = inject(PreferencesStore, { optional: true });
  protected readonly copy = computed(
    () =>
      (STUDYLM_COPY[this.preferences?.language() ?? 'en'] ?? STUDYLM_COPY.en)
        .reviews,
  );

  protected readonly counts = computed(() => {
    const items = this.link.state()?.items ?? [];
    return {
      reviewing: items.filter((item) => item.stage === 'reviewing').length,
      onTheirWay: items.filter(
        (item) => item.stage === 'waiting' || item.stage === 'draft',
      ).length,
    };
  });

  protected readonly tiers = computed(() => {
    const state = this.link.state();
    const c = this.copy();
    const labels: Record<HostTier, string> = {
      seed: c.tierSeed,
      sprout: c.tierSprout,
      leaf: c.tierLeaf,
      bloom: c.tierBloom,
      golden: c.tierGolden,
    };
    return HOST_TIERS.map((tier) => ({
      id: tier,
      icon: TIER_ICONS[tier],
      label: labels[tier],
      count: state?.tiers[tier] ?? 0,
    }));
  });

  protected readonly hasCards = computed(
    () => this.counts().reviewing + this.counts().onTheirWay > 0,
  );

  ngOnInit(): void {
    if (this.link.linked()) void this.link.refresh();
  }

  protected disconnect(): void {
    if (globalThis.confirm?.(this.copy().disconnectConfirm)) {
      void this.link.disconnect();
    }
  }
}
