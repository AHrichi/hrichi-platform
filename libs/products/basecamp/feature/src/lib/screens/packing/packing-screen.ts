import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AhButton,
  AhEmptyState,
  AhProgressBar,
  AhScrollHint,
  AhSegmentedControl,
} from '@ah/ui';
import {
  ownedFor,
  PACKING_CATEGORIES,
  type PackingCategory,
  type PackingItem,
  progress,
} from '@ah/products/basecamp/domain';
import { BasecampI18n } from '../../i18n/basecamp-i18n';
import { BasecampStore } from '../../store/basecamp.store';

const EVERYONE = '*';

/** The trip's packing list, by category: tick, share out, add your own. */
@Component({
  selector: 'bc-packing-screen',
  imports: [
    AhButton,
    AhEmptyState,
    AhProgressBar,
    AhScrollHint,
    AhSegmentedControl,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './packing-screen.html',
  styleUrl: './packing-screen.scss',
})
export class PackingScreen {
  protected readonly store = inject(BasecampStore);
  protected readonly i18n = inject(BasecampI18n);
  protected readonly t = this.i18n.t;
  protected readonly categories = PACKING_CATEGORIES;

  protected readonly person = signal(EVERYONE);
  protected readonly hidePacked = signal(false);
  protected readonly newLabel = signal('');
  protected readonly newCategory = signal<PackingCategory>('shelter');
  protected readonly newQuantity = signal(1);

  protected readonly people = computed(() => [
    { value: EVERYONE, label: this.t().packing.everyone },
    ...(this.store.activeTrip()?.people ?? []).map((p) => ({
      value: p.id,
      label: p.name,
    })),
  ]);

  protected readonly shown = computed(() => {
    const person = this.person();
    return (this.store.activeTrip()?.packing ?? []).filter(
      (item) =>
        (person === EVERYONE || item.personId === person) &&
        !(this.hidePacked() && item.packed),
    );
  });

  protected readonly progress = computed(() => {
    const list = this.store.activeTrip()?.packing ?? [];
    const person = this.person();
    return progress(list, person === EVERYONE ? undefined : person);
  });

  /** The shown items by category, in the lists' order. */
  protected readonly groups = computed(() =>
    this.categories
      .map((category) => ({
        category,
        items: this.shown()
          .filter((item) => item.category === category)
          .map((item) => ({
            item,
            name: this.i18n.itemName(item),
            owned: !!ownedFor(item, this.store.gear()),
          })),
      }))
      .filter((group) => group.items.length),
  );

  protected add(event: Event): void {
    event.preventDefault();
    const label = this.newLabel().trim();
    if (!label) return;
    void this.store.addItem({
      label,
      category: this.newCategory(),
      quantity: Math.max(1, Math.round(this.newQuantity()) || 1),
    });
    this.newLabel.set('');
    this.newQuantity.set(1);
  }

  protected rebuild(): void {
    if (confirm(this.t().packing.regenerateConfirm)) {
      void this.store.rebuildPacking();
    }
  }

  protected assign(item: PackingItem, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    void this.store.assign(item.id, value || null);
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
