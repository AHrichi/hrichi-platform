import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AhButton, AhEmptyState, AhModal } from '@ah/ui';
import {
  GEAR_KEYS,
  type GearCondition,
  type GearItem,
  ownedFor,
  PACKING_CATEGORIES,
  type PackingCategory,
} from '@ah/products/basecamp/domain';
import { BasecampI18n } from '../../i18n/basecamp-i18n';
import { BasecampStore, newId } from '../../store/basecamp.store';

const CONDITIONS: readonly GearCondition[] = ['good', 'worn', 'repair'];

/** What the user owns, and what the open trip still needs. */
@Component({
  selector: 'bc-gear-screen',
  imports: [AhButton, AhEmptyState, AhModal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gear-screen.html',
  styleUrl: './gear-screen.scss',
})
export class GearScreen {
  protected readonly store = inject(BasecampStore);
  protected readonly i18n = inject(BasecampI18n);
  protected readonly t = this.i18n.t;
  protected readonly categories = PACKING_CATEGORIES;
  protected readonly conditions = CONDITIONS;

  protected readonly draft = signal<GearItem | null>(null);
  protected readonly isNew = computed(
    () => !this.store.gear().some((g) => g.id === this.draft()?.id),
  );

  /** "What is it" choices, by name in the reader's language. */
  protected readonly kinds = computed(() =>
    GEAR_KEYS.map((k) => ({ ...k, name: this.t().items[k.key] ?? k.key })).sort(
      (a, b) => a.name.localeCompare(b.name, this.i18n.lang()),
    ),
  );

  /** The open trip's items nobody owns, one line per kind. */
  protected readonly toGet = computed(() => {
    const gear = this.store.gear();
    const seen = new Set<string>();
    return (this.store.activeTrip()?.packing ?? [])
      .filter((item) => item.key && !ownedFor(item, gear))
      .filter((item) => !seen.has(item.key ?? '') && seen.add(item.key ?? ''))
      .map((item) => this.i18n.itemName(item));
  });

  protected openNew(): void {
    this.draft.set({
      id: newId('gear'),
      name: '',
      category: 'shelter',
      condition: 'good',
      notes: '',
    });
  }

  protected patch(change: Partial<GearItem>): void {
    const draft = this.draft();
    if (draft) this.draft.set({ ...draft, ...change });
  }

  /** Choosing what it is files it in the right category, and names it. */
  protected setKind(key: string): void {
    const kind = GEAR_KEYS.find((k) => k.key === key);
    const draft = this.draft();
    if (!draft) return;
    this.draft.set({
      ...draft,
      key: kind?.key,
      category: kind?.category ?? draft.category,
      name: draft.name || (kind ? (this.t().items[kind.key] ?? '') : ''),
    });
  }

  protected async save(): Promise<void> {
    const draft = this.draft();
    if (!draft?.name.trim()) return;
    await this.store.saveGear({ ...draft, name: draft.name.trim() });
    this.draft.set(null);
  }

  protected async remove(item: GearItem): Promise<void> {
    if (confirm(this.t().gear.deleteConfirm(item.name))) {
      await this.store.deleteGear(item.id);
    }
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected asCategory(value: string): PackingCategory {
    return value as PackingCategory;
  }

  protected asCondition(value: string): GearCondition {
    return value as GearCondition;
  }
}
