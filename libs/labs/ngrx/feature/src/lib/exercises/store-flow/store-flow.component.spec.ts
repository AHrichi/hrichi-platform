import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StoreFlowComponent } from './store-flow.component';

describe('StoreFlowComponent', () => {
  let fixture: ComponentFixture<StoreFlowComponent>;
  let component: StoreFlowComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreFlowComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(StoreFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes with default cart items and memoized metrics', () => {
    expect(component.currentState().items.length).toBe(2);
    expect(component.totalItemCount()).toBe(2);
    expect(component.subtotal()).toBe(138); // 49 + 89
    expect(component.discountedTotal()).toBe(138);
  });

  it('dispatches addItem and updates state snapshot', () => {
    component.dispatchAddItem('test-item', 'Modern NgRx Architecture', 100);
    fixture.detectChanges();

    expect(component.currentState().items.length).toBe(3);
    expect(component.totalItemCount()).toBe(3);
    expect(component.subtotal()).toBe(238);
    expect(component.actionHistory().length).toBe(2);
  });

  it('applies coupon and recalculates discounted total correctly', () => {
    component.dispatchApplyCoupon('PRO20', 20);
    fixture.detectChanges();

    expect(component.currentState().couponCode).toBe('PRO20');
    // Subtotal 138 - 20% (27.6) = 110.4
    expect(component.discountedTotal()).toBe(110.4);
  });

  it('supports time-travel stepping to previous snapshots', () => {
    component.dispatchAddItem('p3', 'Testing Book', 50);
    expect(component.currentState().items.length).toBe(3);

    // Step back to snapshot 0 (initial state)
    component.onTimeTravelIndexChange(0);
    fixture.detectChanges();

    expect(component.currentState().items.length).toBe(2);
    expect(component.subtotal()).toBe(138);
  });
});
