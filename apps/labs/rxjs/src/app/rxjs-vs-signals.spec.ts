import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RxjsVsSignalsComponent } from '@ah/labs/rxjs/feature';

describe('RxjsVsSignalsComponent', () => {
  let fixture: ComponentFixture<RxjsVsSignalsComponent>;
  let component: RxjsVsSignalsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RxjsVsSignalsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RxjsVsSignalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the architecture heading and initial scenario', () => {
    expect(component.selectedScenarioId()).toBe('search');
    expect(component.selectedScenario().winner).toBe('Hybrid (Both)');
  });

  it('calculates derived total synchronously with signals computed', () => {
    // Base 100, Discount 15 -> Subtotal 85 * 1.2 = 102
    expect(component.computedTotal()).toBe(102);

    // Update base price
    component.basePrice.set(200);
    component.discount.set(50);
    fixture.detectChanges();

    // Base 200 - Discount 50 = 150 * 1.2 = 180
    expect(component.computedTotal()).toBe(180);
  });

  it('handles linkedSignal resets and direct mutations correctly', () => {
    // Default plan is 'Pro' with 100 quota
    expect(component.selectedPlan()).toBe('Pro');
    expect(component.customQuota()).toBe(100);
    expect(component.isQuotaOverridden()).toBe(false);

    // Direct mutation
    component.incrementQuota();
    expect(component.customQuota()).toBe(110);
    expect(component.isQuotaOverridden()).toBe(true);

    // Switching plan resets linkedSignal to the new plan default!
    component.setPlan('Enterprise');
    expect(component.selectedPlan()).toBe('Enterprise');
    expect(component.customQuota()).toBe(500);
    expect(component.isQuotaOverridden()).toBe(false);
  });

  it('updates scenario when selecting a scenario pill', () => {
    component.selectScenario('derived');
    expect(component.selectedScenario().id).toBe('derived');
    expect(component.selectedScenario().winner).toBe('Signals');
  });
});
