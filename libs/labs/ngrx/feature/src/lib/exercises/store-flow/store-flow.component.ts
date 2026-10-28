import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  createActionGroup,
  createFeature,
  createReducer,
  createSelector,
  emptyProps,
  on,
  props,
} from '@ngrx/store';
import { AhButton, SectionHeading, type SegmentedOption } from '@ah/ui';
import {
  ActionRecord,
  TimeTravelPanelComponent,
} from '../../shared/ui/time-travel-panel/time-travel-panel.component';
import {
  FlowStage,
  StateFlowDiagramComponent,
} from '../../shared/ui/state-flow-diagram/state-flow-diagram.component';
import { UseCaseFocusComponent } from '../../shared/ui/use-case-focus/use-case-focus.component';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discountPercent: number;
}

// 1. Action Group (Modern NgRx pattern)
export const CartActions = createActionGroup({
  source: 'Cart',
  events: {
    'Add Item': props<{ item: Omit<CartItem, 'qty'> }>(),
    'Remove Item': props<{ id: string }>(),
    'Apply Coupon': props<{ code: string; discount: number }>(),
    'Clear Cart': emptyProps(),
  },
});

const initialCartState: CartState = {
  items: [
    { id: 'p1', name: 'Angular 22 Architecture Handbook', price: 49, qty: 1 },
    { id: 'p2', name: 'Zoneless Performance Masterclass', price: 89, qty: 1 },
  ],
  couponCode: null,
  discountPercent: 0,
};

// 2. Feature Reducer
export const cartFeature = createFeature({
  name: 'cart',
  reducer: createReducer(
    initialCartState,
    on(CartActions.addItem, (state, { item }) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, qty: i.qty + 1 } : i,
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...item, qty: 1 }],
      };
    }),
    on(CartActions.removeItem, (state, { id }) => ({
      ...state,
      items: state.items.filter((i) => i.id !== id),
    })),
    on(CartActions.applyCoupon, (state, { code, discount }) => ({
      ...state,
      couponCode: code,
      discountPercent: discount,
    })),
    on(CartActions.clearCart, (state) => ({
      ...state,
      items: [],
      couponCode: null,
      discountPercent: 0,
    })),
  ),
});

@Component({
  selector: 'ah-ngrx-store-flow',
  imports: [
    SectionHeading,
    AhButton,
    UseCaseFocusComponent,
    StateFlowDiagramComponent,
    TimeTravelPanelComponent,
  ],
  template: `
    <div class="exercise-container">
      <ah-section-heading
        eyebrow="NgRx Store Core"
        heading="Unidirectional Architecture & Selector Memoization"
        lead="Explore how Actions, pure Reducers, and memoized Selectors synchronize state with predictable immutability and time-travel auditability."
      />

      <ah-ngrx-use-case-focus
        [options]="focusOptions"
        [(value)]="activeCase"
        ariaLabel="Focus on specific NgRx Store concept"
      />

      <!-- Real-time Animated State Flow Cycle -->
      <ah-state-flow-diagram
        [activeStage]="currentStage()"
        [showEffect]="false"
      />

      <!-- Interactive Playground Grid -->
      <div class="cards-grid">
        <!-- Card 0: Conceptual Overview & Analogy -->
        @if (activeCase() === 'all' || activeCase() === 'concept') {
          <div
            class="card highlight-card"
            [class.focused-card]="activeCase() === 'concept'"
          >
            <div class="card-header">
              <span class="badge">Core Architecture</span>
              <h3>The Redux Mental Model: The Bank Ledger Analogy</h3>
            </div>
            <p class="description">
              In simple apps, developers mutate variables directly (<code
                >state.balance = 5000</code
              >). In large enterprise apps, direct mutation creates hidden side
              effects, race conditions, and un-debuggable state.
            </p>

            <div class="pillars-grid">
              <div class="pillar-box">
                <span class="pillar-icon">🏛️</span>
                <strong>1. Single Source of Truth</strong>
                <p>
                  The entire application state is stored in a single immutable
                  object tree inside the Store.
                </p>
              </div>
              <div class="pillar-box">
                <span class="pillar-icon">🧾</span>
                <strong>2. State is Read-Only</strong>
                <p>
                  To change state, you cannot assign properties. You must issue
                  an Action voucher capturing intent.
                </p>
              </div>
              <div class="pillar-box">
                <span class="pillar-icon">⚙️</span>
                <strong>3. Pure Transitions</strong>
                <p>
                  Reducers are strictly pure functions:
                  <code>(state, action) =&gt; newState</code> with zero
                  side-effects.
                </p>
              </div>
            </div>

            <div class="concept-callout">
              <div class="callout-icon">💡</div>
              <div class="callout-body">
                <strong>Why Immutability Matters:</strong>
                Because reducers return a <em>new state reference</em> (via
                object spread <code>&#123; ...state &#125;</code>), components
                and selectors can perform instant $O(1)$ reference comparisons
                (<code>prevState === nextState</code>) rather than deeply
                checking thousands of nested properties!
              </div>
            </div>
          </div>
        }

        <!-- Card 1: Action Dispatcher -->
        @if (activeCase() === 'all' || activeCase() === 'actions') {
          <div class="card" [class.focused-card]="activeCase() === 'actions'">
            <div class="card-header">
              <span class="badge">1. Action Group (createActionGroup)</span>
              <h3>Dispatch Typed Actions</h3>
            </div>
            <p class="description">
              Actions represent unique events in the application lifecycle. They
              contain a type tag and a typed payload.
            </p>

            <div class="actions-toolbar">
              <button
                type="button"
                ahButton="primary"
                size="sm"
                (click)="dispatchAddItem('p3', 'RxJS to Signals Migration', 65)"
              >
                + Add Book ($65)
              </button>
              <button
                type="button"
                ahButton="secondary"
                size="sm"
                (click)="dispatchApplyCoupon('SUMMER25', 25)"
              >
                Apply 25% Coupon
              </button>
              <button
                type="button"
                ahButton="ghost"
                size="sm"
                (click)="dispatchClearCart()"
              >
                Clear Cart
              </button>
              <button
                type="button"
                ahButton="ghost"
                size="sm"
                (click)="dispatchUnrelatedAction()"
              >
                Dispatch Unrelated Action
              </button>
            </div>

            <div class="hygiene-explainer">
              <span class="hygiene-title"
                >⚡ Action Hygiene Rule: Events, Not Commands</span
              >
              <p>
                Name actions after
                <strong>events that happened in the UI</strong> (e.g.
                <code>[Cart Page] Add Book Clicked</code>), not commands (e.g.
                <code>[Cart] Set State</code>). This makes Redux DevTools logs
                read like a chronological storyboard of user interactions.
              </p>
            </div>

            <div class="code-preview">
              <span class="preview-title">Action Definition Code:</span>
              <pre><code>{{ actionGroupSnippet }}</code></pre>
            </div>
          </div>
        }

        <!-- Card 2: Pure Reducer State -->
        @if (activeCase() === 'all' || activeCase() === 'reducers') {
          <div class="card" [class.focused-card]="activeCase() === 'reducers'">
            <div class="card-header">
              <span class="badge">2. Pure Reducer (createFeature)</span>
              <h3>Current Immutable State</h3>
            </div>
            <p class="description">
              Reducers are pure functions:
              <code>(state, action) =&gt; newState</code>. They never mutate
              state directly.
            </p>

            <div class="cart-items-list">
              @for (item of currentState().items; track item.id) {
                <div class="cart-item">
                  <div class="item-info">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-meta"
                      >\${{ item.price }} &times; {{ item.qty }}</span
                    >
                  </div>
                  <button
                    type="button"
                    ahButton="ghost"
                    size="sm"
                    (click)="dispatchRemoveItem(item.id)"
                  >
                    Remove
                  </button>
                </div>
              } @empty {
                <div class="empty-state">
                  Cart is empty. Add items above to populate state.
                </div>
              }
            </div>

            @if (currentState().couponCode) {
              <div class="coupon-banner">
                Coupon Applied:
                <strong>{{ currentState().couponCode }}</strong> ({{
                  currentState().discountPercent
                }}% OFF)
              </div>
            }

            <div class="immutability-note">
              <span class="note-title">🛡️ Pure Function Guarantees:</span>
              <p>
                Notice how the reducer never calls <code>items.push()</code>. It
                always returns a new object
                <code
                  >&#123; ...state, items: [...state.items, newItem]
                  &#125;</code
                >. This guarantees previous state snapshots remain intact for
                time-travel debugging!
              </p>
            </div>
          </div>
        }

        <!-- Card 3: Memoized Selectors -->
        @if (activeCase() === 'all' || activeCase() === 'selectors') {
          <div class="card" [class.focused-card]="activeCase() === 'selectors'">
            <div class="card-header">
              <span class="badge">3. Memoized Selectors (createSelector)</span>
              <h3>Selector Projection &amp; Cache Efficiency</h3>
            </div>
            <p class="description">
              Selectors compute derived slices. If their input arguments have
              not changed by reference, their projector is skipped and the
              cached value is returned instantly.
            </p>

            <div class="selector-metrics-grid">
              <div class="metric-box">
                <span class="metric-icon">📦</span>
                <span class="metric-label">Items Count</span>
                <span class="metric-value">{{ totalItemCount() }}</span>
              </div>
              <div class="metric-box">
                <span class="metric-icon">💲</span>
                <span class="metric-label">Subtotal</span>
                <span class="metric-value">\${{ subtotal() }}</span>
              </div>
              <div class="metric-box highlight">
                <span class="metric-icon">🏷️</span>
                <span class="metric-label">Discounted Total</span>
                <span class="metric-value">\${{ discountedTotal() }}</span>
              </div>
            </div>

            <div class="memoization-audit">
              <div
                class="memo-status-badge"
                [class.is-hit]="lastActionMemoStatus() === 'hit'"
              >
                @if (lastActionMemoStatus() === 'hit') {
                  <span
                    >⚡ Last Action:
                    <strong>CACHE HIT (Projector Skipped)</strong></span
                  >
                } @else {
                  <span
                    >🔄 Last Action: <strong>PROJECTOR EXECUTED</strong></span
                  >
                }
              </div>
              <div class="audit-row">
                <span>Projector Executions:</span>
                <span class="count">{{ projectorRuns() }}</span>
              </div>
              <div class="audit-row">
                <span>Cache Hits (Skipped recomputation):</span>
                <span class="count success">{{ cacheHits() }}</span>
              </div>
              <div class="audit-note">
                <small
                  >Tip: Clicking "Dispatch Unrelated Action" dispatches an event
                  that does not touch the cart. Notice that cache hits increase
                  while projector runs stay the same!</small
                >
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Time-Travel Panel -->
      @if (activeCase() === 'all' || activeCase() === 'time-travel') {
        <ah-time-travel-panel
          [history]="actionHistory()"
          [currentIndex]="currentHistoryIndex()"
          (timeTravelIndexChange)="onTimeTravelIndexChange($event)"
        />
      }
    </div>
  `,
  styles: `
    .exercise-container {
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
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
        transform 0.2s ease,
        border-color 0.2s ease;
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

    .actions-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2, 0.5rem);
      margin: var(--space-2, 0.5rem) 0;
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

    .cart-items-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 0.5rem);
      margin-top: var(--space-2, 0.5rem);
    }

    .cart-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
    }

    .item-name {
      display: block;
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: 600;
      color: var(--color-text-default);
    }

    .item-meta {
      font-size: 0.7rem;
      color: var(--color-text-muted);
      font-family: monospace;
    }

    .coupon-banner {
      background: var(--color-accent-subtle);
      border: 1px solid var(--color-accent-default);
      color: var(--color-accent-default);
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      border-radius: var(--radius-md, 0.5rem);
      font-size: var(--font-size-xs, 0.75rem);
    }

    .empty-state {
      padding: var(--space-4, 1rem);
      text-align: center;
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-muted);
      border: 1px dashed var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
    }

    .selector-metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-2, 0.5rem);
      margin-top: var(--space-2, 0.5rem);
    }

    .metric-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-3, 0.75rem);
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      text-align: center;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .metric-box:hover {
      border-color: var(--color-border-strong);
    }

    .metric-box.highlight {
      background: var(--color-accent-subtle);
      border-color: var(--color-accent-default);
    }

    .metric-box .metric-icon {
      font-size: 1rem;
      margin-bottom: 2px;
    }

    .metric-label {
      font-size: 0.65rem;
      text-transform: uppercase;
      color: var(--color-text-muted);
      margin-bottom: 2px;
    }

    .metric-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-text-default);
      font-family: monospace;
    }

    .pillars-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-3, 0.75rem);
      margin: var(--space-2, 0.5rem) 0;
    }

    .pillar-box {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .pillar-icon {
      font-size: 1.25rem;
    }

    .pillar-box strong {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-default);
    }

    .pillar-box p {
      margin: 0;
      font-size: 0.7rem;
      color: var(--color-text-muted);
      line-height: 1.4;
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

    .hygiene-explainer,
    .immutability-note {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
      font-size: 0.7rem;
      color: var(--color-text-muted);
      line-height: 1.4;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .hygiene-title,
    .note-title {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-accent-default);
    }

    .memo-status-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: var(--radius-sm, 0.25rem);
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      font-size: 0.7rem;
      font-family: monospace;
      margin-bottom: 4px;
      transition: all 0.3s ease;
    }

    .memo-status-badge.is-hit {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
    }

    .memoization-audit {
      background: var(--color-stage-bg, #0f0f12);
      border: 1px solid var(--color-stage-border, #26262b);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: var(--space-2, 0.5rem);
    }

    .audit-row {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-stage-muted, #9a9aa3);
    }

    .audit-row .count {
      font-family: monospace;
      font-weight: 700;
      color: var(--color-stage-text, #f7f7f8);
    }

    .audit-row .count.success {
      color: var(--color-success-default, #4ade80);
    }

    .audit-note {
      border-top: 1px solid var(--color-stage-border, #26262b);
      padding-top: 6px;
      margin-top: 2px;
      color: var(--color-stage-muted, #9a9aa3);
      line-height: 1.4;
    }

    @media (max-width: 640px) {
      .cards-grid {
        grid-template-columns: 1fr;
        gap: var(--space-4, 1rem);
      }

      .card {
        padding: var(--space-4, 1rem);
      }

      .selector-metrics-grid {
        grid-template-columns: 1fr;
      }

      .pillars-grid {
        grid-template-columns: 1fr;
      }

      .actions-toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .actions-toolbar button {
        width: 100%;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreFlowComponent {
  readonly focusOptions: readonly SegmentedOption<string>[] = [
    { value: 'all', label: 'All Concepts' },
    { value: 'concept', label: 'Unidirectional Flow Model' },
    { value: 'actions', label: 'Action Groups' },
    { value: 'reducers', label: 'Feature Reducers' },
    { value: 'selectors', label: 'Memoized Selectors' },
    { value: 'time-travel', label: 'Time-Travel' },
  ];

  readonly activeCase = signal('all');
  readonly currentStage = signal<FlowStage>('idle');
  readonly lastActionMemoStatus = signal<'hit' | 'run'>('run');

  // Reducer State and Time-Travel History
  readonly actionHistory = signal<ActionRecord<CartState>[]>([
    {
      id: 1,
      type: '@@INIT',
      timestamp: new Date().toLocaleTimeString(),
      stateSnapshot: initialCartState,
    },
  ]);
  readonly currentHistoryIndex = signal(0);

  // Derived current state from current snapshot index
  readonly currentState = computed(() => {
    const list = this.actionHistory();
    const idx = this.currentHistoryIndex();
    return list[idx]?.stateSnapshot ?? initialCartState;
  });

  // Selector Memoization Audit Counters
  readonly projectorRuns = signal(1);
  readonly cacheHits = signal(0);

  // Memoized Selector implementations
  readonly totalItemCount = computed(() => {
    return this.currentState().items.reduce((sum, i) => sum + i.qty, 0);
  });

  readonly subtotal = computed(() => {
    return this.currentState().items.reduce(
      (sum, i) => sum + i.price * i.qty,
      0,
    );
  });

  readonly discountedTotal = computed(() => {
    const state = this.currentState();
    const sub = this.subtotal();
    const discount = (sub * state.discountPercent) / 100;
    return Math.round((sub - discount) * 100) / 100;
  });

  readonly actionGroupSnippet = `export const CartActions = createActionGroup({
  source: 'Cart',
  events: {
    'Add Item': props<{ item: CartItem }>(),
    'Remove Item': props<{ id: string }>(),
    'Apply Coupon': props<{ code: string; discount: number }>(),
    'Clear Cart': emptyProps(),
  },
});`;

  dispatchAddItem(id: string, name: string, price: number): void {
    const action = CartActions.addItem({ item: { id, name, price } });
    this.processAction(action.type, { id, name, price }, (state) =>
      cartFeature.reducer(state, action),
    );
  }

  dispatchRemoveItem(id: string): void {
    const action = CartActions.removeItem({ id });
    this.processAction(action.type, { id }, (state) =>
      cartFeature.reducer(state, action),
    );
  }

  dispatchApplyCoupon(code: string, discount: number): void {
    const action = CartActions.applyCoupon({ code, discount });
    this.processAction(action.type, { code, discount }, (state) =>
      cartFeature.reducer(state, action),
    );
  }

  dispatchClearCart(): void {
    const action = CartActions.clearCart();
    this.processAction(action.type, undefined, (state) =>
      cartFeature.reducer(state, action),
    );
  }

  dispatchUnrelatedAction(): void {
    const type = '[Analytics] User Clicked Banner';
    this.animateFlow('dispatch');
    // An unrelated action does not alter CartState reference
    const latestState =
      this.actionHistory()[this.actionHistory().length - 1].stateSnapshot;
    const newRecord: ActionRecord<CartState> = {
      id: this.actionHistory().length + 1,
      type,
      payload: { target: 'banner-hero' },
      timestamp: new Date().toLocaleTimeString(),
      stateSnapshot: latestState, // Same reference!
    };
    this.actionHistory.update((h) => [...h, newRecord]);
    this.currentHistoryIndex.set(this.actionHistory().length - 1);

    // Cache hit counter increases because state reference did not change
    this.cacheHits.update((c) => c + 1);
    this.lastActionMemoStatus.set('hit');
  }

  private processAction(
    type: string,
    payload: unknown,
    reducerFn: (s: CartState) => CartState,
  ): void {
    this.animateFlow('dispatch');
    const latestState =
      this.actionHistory()[this.actionHistory().length - 1].stateSnapshot;
    const nextState = reducerFn(latestState);

    const newRecord: ActionRecord<CartState> = {
      id: this.actionHistory().length + 1,
      type,
      payload,
      timestamp: new Date().toLocaleTimeString(),
      stateSnapshot: nextState,
    };

    this.actionHistory.update((h) => [...h, newRecord]);
    this.currentHistoryIndex.set(this.actionHistory().length - 1);
    this.projectorRuns.update((r) => r + 1);
    this.lastActionMemoStatus.set('run');
  }

  onTimeTravelIndexChange(index: number): void {
    this.currentHistoryIndex.set(index);
    this.animateFlow('store');
  }

  private animateFlow(startStage: FlowStage): void {
    this.currentStage.set(startStage);
    setTimeout(() => this.currentStage.set('reducer'), 200);
    setTimeout(() => this.currentStage.set('store'), 450);
    setTimeout(() => this.currentStage.set('selector'), 700);
    setTimeout(() => this.currentStage.set('component'), 950);
    setTimeout(() => this.currentStage.set('idle'), 1500);
  }
}
