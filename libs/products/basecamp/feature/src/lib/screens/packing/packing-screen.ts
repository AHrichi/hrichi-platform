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
  AhModal,
  AhProgressBar,
  AhScrollHint,
  AhSegmentedControl,
} from '@ah/ui';
import {
  isPersonal,
  type ItemSplitPortion,
  ownedFor,
  PACKING_CATEGORIES,
  type PackingCategory,
  type PackingItem,
  progress,
} from '@ah/products/basecamp/domain';
import { BasecampI18n } from '../../i18n/basecamp-i18n';
import { BasecampStore } from '../../store/basecamp.store';

const EVERYONE = '*';

export interface ConsolidatedCamper {
  personId: string;
  personName: string;
  item: PackingItem;
  packed: boolean;
}

export interface ConsolidatedPersonalItem {
  key: string;
  name: string;
  category: PackingCategory;
  source: PackingItem['source'];
  owned: boolean;
  campers: ConsolidatedCamper[];
  packedCount: number;
  totalCampers: number;
  allPacked: boolean;
  hasPacked: boolean;
}

export interface PackingGroupRow {
  item: PackingItem;
  name: string;
  owned: boolean;
  personal: boolean;
}

export interface PackingCategoryGroup {
  category: PackingCategory;
  items: PackingGroupRow[];
  sharedItems: PackingGroupRow[];
  personalCards: ConsolidatedPersonalItem[];
}

interface SplitDraft {
  item: PackingItem;
  totalQuantity: number;
  allocations: Record<string, number>;
}

/** The trip's packing list, by category: tick, share out, split, add your own. */
@Component({
  selector: 'bc-packing-screen',
  imports: [
    AhButton,
    AhEmptyState,
    AhModal,
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
  protected readonly newMode = signal<'shared' | 'each' | 'person'>('shared');
  protected readonly newPersonId = signal<string | null>(null);

  protected readonly splitDraft = signal<SplitDraft | null>(null);

  protected readonly people = computed(() => [
    { value: EVERYONE, label: this.t().packing.everyone },
    ...(this.store.activeTrip()?.people ?? []).map((p) => ({
      value: p.id,
      label: p.name,
    })),
  ]);

  protected readonly isConsolidated = computed(
    () =>
      this.person() === EVERYONE &&
      (this.store.activeTrip()?.people.length ?? 0) > 1,
  );

  protected readonly progress = computed(() => {
    const list = this.store.activeTrip()?.packing ?? [];
    const person = this.person();
    return progress(list, person === EVERYONE ? undefined : person);
  });

  /** The shown items by category, in the lists' order. */
  protected readonly groups = computed<PackingCategoryGroup[]>(() => {
    const trip = this.store.activeTrip();
    if (!trip) return [];

    const person = this.person();
    const hide = this.hidePacked();
    const people = trip.people;
    const personNameMap = new Map(people.map((p) => [p.id, p.name]));
    const gear = this.store.gear();

    return this.categories
      .map((category) => {
        const catItems = trip.packing.filter((i) => i.category === category);

        // All items shown for the current filter (used for single person view or fallback)
        const shownItems = catItems.filter(
          (item) =>
            (person === EVERYONE || item.personId === person) &&
            !(hide && item.packed),
        );

        const items: PackingGroupRow[] = shownItems.map((item) => ({
          item,
          name: this.i18n.itemName(item),
          owned: !!ownedFor(item, gear),
          personal: isPersonal(item),
        }));

        // Shared items in this category (for consolidated view)
        const sharedRaw = catItems.filter((i) => !isPersonal(i));
        const filteredShared = hide
          ? sharedRaw.filter((i) => !i.packed)
          : sharedRaw;
        const sharedItems: PackingGroupRow[] = filteredShared.map((item) => ({
          item,
          name: this.i18n.itemName(item),
          owned: !!ownedFor(item, gear),
          personal: false,
        }));

        // Personal items grouped by itemKey or label
        const personalRaw = catItems.filter((i) => isPersonal(i));
        const personalMap = new Map<string, PackingItem[]>();
        for (const item of personalRaw) {
          const key = item.key ?? item.label ?? item.id;
          const list = personalMap.get(key) ?? [];
          list.push(item);
          personalMap.set(key, list);
        }

        const personalCards: ConsolidatedPersonalItem[] = [];
        for (const [key, groupList] of personalMap.entries()) {
          const first = groupList[0];
          const campers: ConsolidatedCamper[] = groupList.map((item) => ({
            personId: item.personId ?? 'unknown',
            personName: item.personId
              ? (personNameMap.get(item.personId) ?? item.personId)
              : '?',
            item,
            packed: item.packed,
          }));

          const packedCount = campers.filter((c) => c.packed).length;
          const totalCampers = campers.length;
          const allPacked = totalCampers > 0 && packedCount === totalCampers;
          const hasPacked = packedCount > 0;

          // If hidePacked is on and all campers have packed this item, hide the card
          if (hide && allPacked) {
            continue;
          }

          personalCards.push({
            key,
            name: this.i18n.itemName(first),
            category,
            source: first.source,
            owned: !!ownedFor(first, gear),
            campers,
            packedCount,
            totalCampers,
            allPacked,
            hasPacked,
          });
        }

        return {
          category,
          items,
          sharedItems,
          personalCards,
        };
      })
      .filter((group) =>
        this.isConsolidated()
          ? group.sharedItems.length > 0 || group.personalCards.length > 0
          : group.items.length > 0,
      );
  });

  protected readonly splitTotal = computed(() => {
    const draft = this.splitDraft();
    if (!draft) return 0;
    return Object.values(draft.allocations).reduce((sum, q) => sum + (q || 0), 0);
  });

  protected splitItemName(): string {
    const draft = this.splitDraft();
    return draft ? this.i18n.itemName(draft.item) : '';
  }

  protected hasSharedItems(group: PackingCategoryGroup): boolean {
    return this.isConsolidated()
      ? group.sharedItems.length > 0
      : group.items.some((i) => !i.personal);
  }

  protected toggleAllCampers(
    card: ConsolidatedPersonalItem,
    targetChecked: boolean,
  ): void {
    for (const camper of card.campers) {
      if (camper.packed !== targetChecked) {
        void this.store.setPacked(camper.item.id, targetChecked);
      }
    }
  }

  protected removePersonalGroup(card: ConsolidatedPersonalItem): void {
    for (const camper of card.campers) {
      void this.store.removeItem(camper.item.id);
    }
  }

  protected openSplit(item: PackingItem): void {
    const people = this.store.activeTrip()?.people ?? [];
    const allocations: Record<string, number> = {};
    for (const p of people) {
      allocations[p.id] = item.personId === p.id ? item.quantity : 0;
    }
    allocations['unassigned'] = !item.personId ? item.quantity : 0;
    this.splitDraft.set({
      item,
      totalQuantity: item.quantity,
      allocations,
    });
  }

  protected setSplitQty(personKey: string, qty: number): void {
    const draft = this.splitDraft();
    if (!draft) return;
    this.splitDraft.set({
      ...draft,
      allocations: {
        ...draft.allocations,
        [personKey]: Math.max(0, Math.round(qty) || 0),
      },
    });
  }

  protected splitEvenly(): void {
    const draft = this.splitDraft();
    const people = this.store.activeTrip()?.people ?? [];
    if (!draft || !people.length) return;

    const total = draft.totalQuantity;
    const base = Math.floor(total / people.length);
    let rem = total % people.length;

    const allocations: Record<string, number> = {};
    for (const p of people) {
      allocations[p.id] = base + (rem > 0 ? 1 : 0);
      if (rem > 0) rem--;
    }
    allocations['unassigned'] = 0;
    this.splitDraft.set({ ...draft, allocations });
  }

  protected async saveSplit(): Promise<void> {
    const draft = this.splitDraft();
    if (!draft) return;

    const portions: ItemSplitPortion[] = [];
    for (const [key, qty] of Object.entries(draft.allocations)) {
      if (qty > 0) {
        portions.push({
          personId: key === 'unassigned' ? null : key,
          quantity: qty,
        });
      }
    }

    if (portions.length) {
      await this.store.splitItem(draft.item.id, portions);
    }
    this.splitDraft.set(null);
  }

  protected assignCategory(category: PackingCategory, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    if (!value) return;
    void this.store.assignCategory(
      category,
      value === '*unassign*' ? null : value,
    );
    select.value = '';
  }

  protected distributeShared(): void {
    void this.store.distributeSharedGear();
  }

  protected add(event: Event): void {
    event.preventDefault();
    const label = this.newLabel().trim();
    if (!label) return;
    void this.store.addItem({
      label,
      category: this.newCategory(),
      quantity: Math.max(1, Math.round(this.newQuantity()) || 1),
      mode: this.newMode(),
      personId: this.newPersonId(),
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
