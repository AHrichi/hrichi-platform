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
import { AhButton, SectionHeading, Tag, type SegmentedOption } from '@ah/ui';
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
  imports: [SectionHeading, AhButton, Tag, UseCaseFocusComponent],
  providers: [SkillsStore],
  template: `
    <div class="exercise-container">
      <ah-section-heading
        eyebrow="@ngrx/signals & Modern State"
        heading="Declarative SignalStore & Entity Normalization"
        lead="Explore functional signal composition with withEntities(), withComputed(), withMethods(), rxMethod() for reactive async flows, and withHooks()."
      />

      <ah-ngrx-use-case-focus
        [options]="focusOptions"
        [(value)]="activeCase"
        ariaLabel="Focus on SignalStore features"
      />

      <!-- Metrics Row (Dynamic Dark/Light Tokens with Elevation) -->
      <div class="metrics-row">
        <div class="metric-card">
          <div class="card-head">
            <span class="label">Total Skills</span>
            <span class="metric-icon">📚</span>
          </div>
          <span class="value">{{ store.totalCount() }}</span>
          <span class="hint">via withEntities (ids.length)</span>
        </div>
        <div class="metric-card">
          <div class="card-head">
            <span class="label">Avg Mastery</span>
            <span class="metric-icon">📈</span>
          </div>
          <span class="value">{{ store.averageMastery() }}%</span>
          <span class="hint">withComputed auto-tracked</span>
        </div>
        <div class="metric-card highlight">
          <div class="card-head">
            <span class="label">Certified Count</span>
            <span class="metric-icon">⭐</span>
          </div>
          <span class="value">{{ store.certifiedCount() }}</span>
          <span class="hint">filtered memoized signal</span>
        </div>
        <div class="metric-card">
          <div class="card-head">
            <span class="label">Last Synced</span>
            <span class="metric-icon">⚡</span>
          </div>
          <span class="value sync">{{
            store.lastSyncTime() ?? 'Initializing...'
          }}</span>
          <span class="hint">live rxMethod stream</span>
        </div>
      </div>

      <div class="cards-grid">
        <!-- Card 0: Architectural Overview & Mental Model -->
        @if (activeCase() === 'all' || activeCase() === 'concept') {
          <div
            class="card highlight-card"
            [class.focused-card]="activeCase() === 'concept'"
          >
            <div class="card-header">
              <span class="badge">Architecture Overview</span>
              <h3>Why @ngrx/signals? The Modern 5-Plugin Architecture</h3>
            </div>
            <p class="description">
              Traditional Redux requires 4 separate files per feature (Action,
              Reducer, Selector, Effect) with high indirection.
              <strong>SignalStore</strong> replaces this with a functional,
              tree-shakeable pipeline that composes modular features into a
              strongly-typed store:
            </p>

            <div class="plugins-diagram">
              <div class="plugin-pill">
                <span class="p-num">1</span>
                <div class="p-info">
                  <strong>withState&lt;T&gt;()</strong>
                  <span>Immutable state signals</span>
                </div>
              </div>
              <div class="plugin-arrow">→</div>
              <div class="plugin-pill">
                <span class="p-num">2</span>
                <div class="p-info">
                  <strong>withEntities&lt;T&gt;()</strong>
                  <span>Normalized O(1) dictionary</span>
                </div>
              </div>
              <div class="plugin-arrow">→</div>
              <div class="plugin-pill">
                <span class="p-num">3</span>
                <div class="p-info">
                  <strong>withComputed()</strong>
                  <span>Auto-tracked derivations</span>
                </div>
              </div>
              <div class="plugin-arrow">→</div>
              <div class="plugin-pill">
                <span class="p-num">4</span>
                <div class="p-info">
                  <strong>withMethods()</strong>
                  <span>patchState &amp; rxMethod</span>
                </div>
              </div>
              <div class="plugin-arrow">→</div>
              <div class="plugin-pill">
                <span class="p-num">5</span>
                <div class="p-info">
                  <strong>withHooks()</strong>
                  <span>onInit &amp; onDestroy</span>
                </div>
              </div>
            </div>

            <div class="concept-callout">
              <div class="callout-icon">💡</div>
              <div class="callout-content">
                <strong>The "Zero-Boilerplate" Rule:</strong>
                SignalStore requires no action types, no reducer switch
                statements, and no selectors. Every state slice is automatically
                exposed as a direct signal (e.g. <code>store.skills()</code>,
                <code>store.totalCount()</code>) that triggers zoneless change
                detection with zero Zone.js overhead!
              </div>
            </div>
          </div>
        }

        <!-- Card 1: Interactive Entities Manager -->
        @if (activeCase() === 'all' || activeCase() === 'entities') {
          <div class="card" [class.focused-card]="activeCase() === 'entities'">
            <div class="card-header">
              <span class="badge"
                >1. Entity Management Plugin (withEntities)</span
              >
              <h3>Normalized Entities &amp; Operations</h3>
            </div>
            <p class="description">
              <code>withEntities&lt;T&gt;()</code> maintains normalized state:
              an <code>ids: string[]</code> array preserving order and an
              <code>entityMap: Record&lt;string, T&gt;</code> for $O(1)$
              lookups.
            </p>

            <div class="toolbar">
              <button
                type="button"
                ahButton="primary"
                size="sm"
                (click)="addCustomSkill()"
              >
                + Add Custom Skill
              </button>
              <button
                type="button"
                ahButton="secondary"
                size="sm"
                [disabled]="store.isLoading()"
                (click)="store.simulateRemoteSync()"
              >
                {{
                  store.isLoading()
                    ? 'Syncing...'
                    : 'Reset &amp; Sync via rxMethod'
                }}
              </button>
            </div>

            <div class="entity-list">
              @for (skill of store.filteredSkills(); track skill.id) {
                <div class="skill-row">
                  <div class="skill-main">
                    <span class="skill-name">{{ skill.name }}</span>
                    <div class="skill-badges">
                      <ah-tag>{{ skill.category }}</ah-tag>
                      @if (skill.isCertified) {
                        <ah-tag>Verified</ah-tag>
                      }
                    </div>
                  </div>
                  <div class="mastery-indicator">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        [style.width.%]="skill.masteryLevel"
                      ></div>
                    </div>
                    <span class="mastery-text">{{ skill.masteryLevel }}%</span>
                  </div>
                  <div class="skill-actions">
                    <button
                      type="button"
                      ahButton="ghost"
                      size="sm"
                      (click)="store.boostMastery(skill.id)"
                      title="Boost mastery by 5%"
                    >
                      ▲ Boost
                    </button>
                    <button
                      type="button"
                      ahButton="ghost"
                      size="sm"
                      (click)="store.removeSkill(skill.id)"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="empty-state">
                  No skills match the current filters.
                </div>
              }
            </div>

            <!-- O(1) vs O(n) Normalization Visual Explainer -->
            <div class="normalization-explainer">
              <div class="explainer-box">
                <span class="explainer-tag alert"
                  >Naive Array: O(n) Bottleneck</span
                >
                <p>
                  Updating one item in an array requires iterating every element
                  with <code>items.map()</code>. At scale, this forces
                  unnecessary re-allocations.
                </p>
              </div>
              <div class="explainer-box">
                <span class="explainer-tag success"
                  >Normalized: O(1) Lookups</span
                >
                <p>
                  <code>withEntities()</code> maintains
                  <code>ids: string[]</code> (order) and
                  <code>entityMap: Record&lt;string, T&gt;</code> (instant key
                  access). Lookups and updates are $O(1)$!
                </p>
              </div>
            </div>
          </div>
        }

        <!-- Card 2: Filter & rxMethod Stream Card -->
        @if (activeCase() === 'all' || activeCase() === 'rx-method') {
          <div class="card" [class.focused-card]="activeCase() === 'rx-method'">
            <div class="card-header">
              <span class="badge">2. rxMethod &amp; Reactive Query</span>
              <h3>RxJS Stream Interoperability</h3>
            </div>
            <p class="description">
              <code>rxMethod&lt;T&gt;()</code> bridges RxJS operators
              (cancellation, switchMap, debounceTime, tapResponse) directly into
              SignalStore methods while updating signals without manual
              subscriptions.
            </p>

            <div class="filter-controls">
              <label class="input-label" for="skill-search"
                >Live Filter Search:</label
              >
              <input
                id="skill-search"
                type="text"
                class="text-input"
                placeholder="Filter skills (e.g. Signals, Zoneless)..."
                [value]="store.searchTerm()"
                (input)="onSearchInput($event)"
              />

              <div class="category-pills">
                @for (cat of categories; track cat.id) {
                  <button
                    type="button"
                    class="pill"
                    [class.active]="store.selectedCategory() === cat.id"
                    (click)="store.setCategory(cat.id)"
                  >
                    {{ cat.label }}
                  </button>
                }
              </div>
            </div>

            <div class="normalized-debug">
              <span class="debug-title"
                >Normalized State Slices (Under the Hood):</span
              >
              <div class="debug-grid">
                <div class="debug-col">
                  <strong>ids: string[] (Order)</strong>
                  <pre><code>{{ formattedIds() }}</code></pre>
                </div>
                <div class="debug-col">
                  <strong>entityMap: Record&lt;string, Entity&gt;</strong>
                  <pre><code>{{ formattedEntityMap() }}</code></pre>
                </div>
              </div>
            </div>

            <!-- rxMethod Explainer -->
            <div class="rxmethod-explainer">
              <div class="callout-icon">⚡</div>
              <div class="callout-body">
                <strong>Why rxMethod() is Essential:</strong>
                <p>
                  Standard RxJS subscriptions inside components risk memory
                  leaks if not manually unsubscribed.
                  <code>rxMethod&lt;T&gt;()</code> accepts a static argument,
                  Signal, or Observable, connects to the injection context, and
                  automatically manages the subscription lifecycle with
                  cancellation support.
                </p>
              </div>
            </div>
          </div>
        }

        <!-- Card 3: signalState Lightweight State -->
        @if (activeCase() === 'all' || activeCase() === 'signal-state') {
          <div
            class="card"
            [class.focused-card]="activeCase() === 'signal-state'"
          >
            <div class="card-header">
              <span class="badge"
                >3. signalState (Lightweight Local State)</span
              >
              <h3>Component-Level Micro Stores</h3>
            </div>
            <p class="description">
              <code>signalState()</code> gives you deep signal state and
              patchability without creating a class or functional store. Ideal
              for dialogs, forms, and local component UI state.
            </p>

            <div class="local-state-demo">
              <div class="counter-display">
                <span class="counter-label">Active Inspector Mode:</span>
                <ah-tag [class.active-tag]="localUiState.isInspecting()">
                  {{
                    localUiState.isInspecting()
                      ? 'Deep Inspection Enabled'
                      : 'Standard View'
                  }}
                </ah-tag>
              </div>

              <div class="button-row">
                <button
                  type="button"
                  [ahButton]="
                    localUiState.isInspecting() ? 'secondary' : 'primary'
                  "
                  size="sm"
                  (click)="toggleInspection()"
                >
                  Toggle Inspection Flag
                </button>
                <button
                  type="button"
                  ahButton="ghost"
                  size="sm"
                  (click)="incrementInteractions()"
                >
                  Interactions: {{ localUiState.interactionCount() }}
                </button>
              </div>

              <div class="code-preview">
                <span class="preview-title">signalState snippet:</span>
                <pre><code>{{ signalStateSnippet }}</code></pre>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .exercise-container {
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-3, 0.75rem);
      margin-bottom: var(--space-4, 1rem);
    }

    .metric-card {
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .metric-card:hover {
      border-color: var(--color-border-strong);
    }

    .metric-card.highlight {
      background: var(--color-accent-subtle);
      border-color: var(--color-accent-default);
    }

    .metric-card .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .metric-card .label {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .metric-card .metric-icon {
      font-size: 0.875rem;
    }

    .metric-card .value {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--color-text-default);
      font-family: monospace;
      line-height: 1.2;
    }

    .metric-card .value.sync {
      font-size: 0.85rem;
      color: var(--color-accent-default);
      font-weight: 600;
    }

    .metric-card .hint {
      font-size: 0.65rem;
      color: var(--color-text-muted);
    }

    .plugins-diagram {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
      overflow-x: auto;
      padding: var(--space-2, 0.5rem) 0;
      margin: var(--space-2, 0.5rem) 0;
    }

    .plugin-pill {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      white-space: nowrap;
    }

    .plugin-pill .p-num {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--color-accent-default);
      color: var(--color-accent-on);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .plugin-pill .p-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .plugin-pill .p-info strong {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-default);
      font-family: monospace;
    }

    .plugin-pill .p-info span {
      font-size: 0.65rem;
      color: var(--color-text-muted);
    }

    .plugin-arrow {
      color: var(--color-text-muted);
      font-weight: 700;
    }

    .concept-callout {
      display: flex;
      gap: var(--space-3, 0.75rem);
      background: var(--color-bg-surface);
      border-left: 3px solid var(--color-accent-default);
      border-radius: var(--radius-sm, 0.25rem);
      padding: var(--space-3, 0.75rem);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: 1.5;
      color: var(--color-text-default);
    }

    .concept-callout .callout-icon {
      font-size: 1.25rem;
    }

    .normalization-explainer {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3, 0.75rem);
      margin-top: var(--space-3, 0.75rem);
    }

    .explainer-box {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .explainer-box p {
      margin: 0;
      font-size: 0.7rem;
      color: var(--color-text-muted);
      line-height: 1.4;
    }

    .explainer-tag {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .explainer-tag.alert {
      color: var(--color-warning-default, #d97706);
    }

    .explainer-tag.success {
      color: var(--color-success-default, #15803d);
    }

    .explainer-tag.accent {
      color: var(--color-accent-default);
    }

    .rxmethod-explainer {
      display: flex;
      gap: var(--space-3, 0.75rem);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
      margin-top: var(--space-3, 0.75rem);
      font-size: 0.7rem;
      color: var(--color-text-muted);
      line-height: 1.45;
    }

    .rxmethod-explainer .callout-icon {
      font-size: 1.25rem;
    }

    .rxmethod-explainer strong {
      color: var(--color-text-default);
    }

    .rxmethod-explainer p {
      margin: 2px 0 0;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--space-5, 1.25rem);
    }

    .card {
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-5, 1.25rem);
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 0.75rem);
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .card.focused-card {
      border-color: var(--color-accent-default);
      box-shadow: 0 0 24px rgba(179, 18, 46, 0.15);
    }

    .card-header h3 {
      margin: var(--space-1, 0.25rem) 0 0;
      font-size: var(--font-size-base, 1rem);
      font-weight: 600;
      color: var(--color-text-default);
    }

    .badge {
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--color-accent-default);
    }

    .description {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-text-muted);
      line-height: 1.5;
      margin: 0;
    }

    .toolbar {
      display: flex;
      gap: var(--space-2, 0.5rem);
      flex-wrap: wrap;
    }

    .entity-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 0.5rem);
      max-height: 280px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .skill-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2, 0.5rem);
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
    }

    .skill-main {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 140px;
    }

    .skill-name {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: 600;
      color: var(--color-text-default);
    }

    .skill-badges {
      display: flex;
      gap: 4px;
    }

    .mastery-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
      flex: 1;
      max-width: 120px;
    }

    .progress-bar {
      height: 6px;
      flex: 1;
      background: var(--color-border-strong);
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--color-accent-default);
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    .mastery-text {
      font-size: 0.7rem;
      font-family: monospace;
      color: var(--color-text-muted);
      width: 32px;
      text-align: right;
    }

    .skill-actions {
      display: flex;
      gap: 4px;
    }

    .filter-controls {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 0.5rem);
    }

    .input-label {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .text-input {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      color: var(--color-text-default);
      font-size: var(--font-size-xs, 0.75rem);
      outline: none;
      transition: border-color 0.2s ease;
    }

    .text-input:focus {
      border-color: var(--color-accent-default);
    }

    .category-pills {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .pill {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-pill);
      padding: 4px 12px;
      font-size: 0.75rem;
      color: var(--color-text-muted);
      cursor: pointer;
      user-select: none;
      transition: all var(--motion-duration-fast) var(--motion-easing-standard);
    }

    .pill:hover {
      background: var(--color-bg-raised);
      color: var(--color-text-default);
      border-color: var(--color-border-strong);
    }

    .pill.active {
      background: var(--color-accent-default);
      border-color: var(--color-accent-default);
      color: var(--color-accent-on);
      font-weight: 600;
    }

    .normalized-debug {
      background: var(--color-stage-bg, #0f0f12);
      border: 1px solid var(--color-stage-border, #26262b);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
    }

    .debug-title {
      font-size: 0.65rem;
      text-transform: uppercase;
      font-weight: 600;
      color: var(--color-stage-muted, #9a9aa3);
      display: block;
      margin-bottom: var(--space-2, 0.5rem);
    }

    .debug-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3, 0.75rem);
    }

    .debug-col strong {
      font-size: 0.65rem;
      color: var(--color-stage-muted, #9a9aa3);
      display: block;
      margin-bottom: 2px;
    }

    .debug-col pre {
      margin: 0;
      font-family: monospace;
      font-size: 0.7rem;
      line-height: 1.3;
      color: var(--color-stage-text, #f7f7f8);
      max-height: 110px;
      overflow-y: auto;
    }

    .local-state-demo {
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 0.75rem);
    }

    .counter-display {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      padding: var(--space-3, 0.75rem);
      border-radius: var(--radius-md, 0.5rem);
    }

    .counter-label {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-muted);
    }

    .button-row {
      display: flex;
      gap: var(--space-2, 0.5rem);
      flex-wrap: wrap;
    }

    .code-preview {
      background: var(--color-stage-bg, #0f0f12);
      border: 1px solid var(--color-stage-border, #26262b);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
    }

    .preview-title {
      font-size: 0.65rem;
      text-transform: uppercase;
      color: var(--color-stage-muted, #9a9aa3);
      font-weight: 600;
      display: block;
      margin-bottom: 4px;
    }

    .code-preview pre {
      margin: 0;
      font-family: monospace;
      font-size: 0.75rem;
      color: var(--color-stage-text, #f7f7f8);
      line-height: 1.4;
      overflow-x: auto;
    }

    .empty-state {
      padding: var(--space-4, 1rem);
      text-align: center;
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-muted);
      border: 1px dashed var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
    }
  `,
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
