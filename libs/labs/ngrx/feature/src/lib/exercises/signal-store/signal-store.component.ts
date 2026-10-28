import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  patchState,
  signalState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  addEntity,
  removeEntity,
  setAllEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { delay, of, pipe, switchMap, tap } from 'rxjs';
import {
  AhButton,
  MetricCard,
  SectionHeading,
  Tag,
  type SegmentedOption,
} from '@ah/ui';
import { UseCaseFocusComponent } from '../../shared/ui/use-case-focus/use-case-focus.component';

export interface DeveloperSkill {
  id: string;
  name: string;
  category: 'core' | 'reactive' | 'architectural';
  masteryLevel: number; // 0 - 100
  isCertified: boolean;
}

const initialSkills: DeveloperSkill[] = [
  {
    id: 'sk-1',
    name: 'Angular 22 Zoneless Core',
    category: 'core',
    masteryLevel: 95,
    isCertified: true,
  },
  {
    id: 'sk-2',
    name: 'NgRx SignalStore Composition',
    category: 'reactive',
    masteryLevel: 90,
    isCertified: true,
  },
  {
    id: 'sk-3',
    name: 'RxJS Higher-Order Streams',
    category: 'reactive',
    masteryLevel: 88,
    isCertified: true,
  },
  {
    id: 'sk-4',
    name: 'Micro-Frontend Native Federation',
    category: 'architectural',
    masteryLevel: 92,
    isCertified: true,
  },
];

/**
 * 1. Fully-typed NgRx SignalStore
 */
export const SkillsStore = signalStore(
  withEntities<DeveloperSkill>(),
  withState({
    isLoading: false,
    selectedCategory: 'all' as 'all' | 'core' | 'reactive' | 'architectural',
    searchTerm: '',
    lastSyncTime: null as string | null,
  }),
  withComputed(({ entities, ids, selectedCategory, searchTerm }) => ({
    totalCount: computed(() => ids().length),
    averageMastery: computed(() => {
      const all = entities();
      const list = Object.values(all);
      if (list.length === 0) return 0;
      const sum = list.reduce((acc, curr) => acc + curr.masteryLevel, 0);
      return Math.round(sum / list.length);
    }),
    certifiedCount: computed(() => {
      return Object.values(entities()).filter((s) => s.isCertified).length;
    }),
    filteredSkills: computed(() => {
      const category = selectedCategory();
      const term = searchTerm().toLowerCase().trim();
      return Object.values(entities()).filter((s) => {
        const matchesCat = category === 'all' || s.category === category;
        const matchesTerm = term === '' || s.name.toLowerCase().includes(term);
        return matchesCat && matchesTerm;
      });
    }),
  })),
  withMethods((store) => ({
    setCategory(category: 'all' | 'core' | 'reactive' | 'architectural'): void {
      patchState(store, { selectedCategory: category });
    },
    setSearch(searchTerm: string): void {
      patchState(store, { searchTerm });
    },
    addSkill(skill: DeveloperSkill): void {
      patchState(store, addEntity(skill));
    },
    removeSkill(id: string): void {
      patchState(store, removeEntity(id));
    },
    boostMastery(id: string): void {
      const current = store.entityMap()[id];
      if (current) {
        const nextLevel = Math.min(100, current.masteryLevel + 5);
        patchState(
          store,
          updateEntity({ id, changes: { masteryLevel: nextLevel } }),
        );
      }
    },
    // Async search simulated via rxMethod
    simulateRemoteSync: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        delay(600),
        switchMap(() => of(initialSkills)),
        tap((skills: DeveloperSkill[]) => {
          patchState(store, setAllEntities(skills), {
            isLoading: false,
            lastSyncTime: new Date().toLocaleTimeString(),
          });
        }),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      patchState(store, setAllEntities(initialSkills), {
        lastSyncTime: new Date().toLocaleTimeString(),
      });
    },
  }),
);

@Component({
  selector: 'ah-ngrx-signal-store',
  imports: [SectionHeading, AhButton, Tag, UseCaseFocusComponent, MetricCard],
  providers: [SkillsStore],
  templateUrl: './signal-store.component.html',
  styleUrl: './signal-store.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalStoreComponent {
  readonly store = inject(SkillsStore);

  readonly focusOptions: readonly SegmentedOption<string>[] = [
    { value: 'all', label: 'All SignalStore Features' },
    { value: 'concept', label: 'SignalStore Philosophy' },
    { value: 'entities', label: 'withEntities Normalization' },
    { value: 'rx-method', label: 'rxMethod Stream Interop' },
    { value: 'signal-state', label: 'signalState Local State' },
  ];

  readonly activeCase = signal('all');

  readonly categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'core', label: 'Core Angular' },
    { id: 'reactive', label: 'Reactive / NgRx' },
    { id: 'architectural', label: 'Architecture' },
  ] as const;

  // 3. Demonstrating signalState for local UI micro-state
  readonly localUiState = signalState({
    isInspecting: false,
    interactionCount: 0,
  });

  toggleInspection(): void {
    patchState(this.localUiState, (state) => ({
      isInspecting: !state.isInspecting,
      interactionCount: state.interactionCount + 1,
    }));
  }

  incrementInteractions(): void {
    patchState(this.localUiState, (state) => ({
      interactionCount: state.interactionCount + 1,
    }));
  }

  onSearchInput(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.store.setSearch(term);
  }

  addCustomSkill(): void {
    const id = `sk-${Date.now().toString().slice(-4)}`;
    this.store.addSkill({
      id,
      name: `Specialized Skill (${id})`,
      category: 'architectural',
      masteryLevel: 80,
      isCertified: false,
    });
  }

  formattedIds(): string {
    return JSON.stringify(this.store.ids(), null, 2);
  }

  formattedEntityMap(): string {
    const keys = Object.keys(this.store.entityMap());
    return `{\n  ${keys.map((k) => `"${k}": { name: "${this.store.entityMap()[k]?.name}" }`).join(',\n  ')}\n}`;
  }

  readonly signalStateSnippet = `// Lightweight local micro-state:
const localState = signalState({ isInspecting: false, count: 0 });
// Patching state purely:
patchState(localState, (s) => ({ isInspecting: !s.isInspecting }));
// Reading state with zero boilerplate:
console.log(localState.isInspecting());`;
}
