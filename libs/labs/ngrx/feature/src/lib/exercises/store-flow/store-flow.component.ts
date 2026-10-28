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
  templateUrl: './store-flow.component.html',
  styleUrl: './store-flow.component.scss',
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
