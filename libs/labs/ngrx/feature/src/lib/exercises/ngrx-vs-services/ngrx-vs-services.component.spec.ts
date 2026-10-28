import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NgRxVsServicesComponent } from './ngrx-vs-services.component';

describe('NgRxVsServicesComponent', () => {
  let fixture: ComponentFixture<NgRxVsServicesComponent>;
  let component: NgRxVsServicesComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgRxVsServicesComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NgRxVsServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('provides default SignalStore recommendation for modular scope', () => {
    expect(component.wizardRecommendation().patternKey).toBe('signal-store');
    expect(component.wizardRecommendation().winner).toContain('SignalStore');
  });

  it('recommends plain Service with Signals for local simple scope', () => {
    component.stateScope.set('local');
    component.asyncComplexity.set('simple');
    component.auditLevel.set('standard');
    fixture.detectChanges();

    expect(component.wizardRecommendation().patternKey).toBe('service-signals');
  });

  it('recommends NgRx Global Store when strict auditability or event choreography is required', () => {
    component.auditLevel.set('strict');
    fixture.detectChanges();

    expect(component.wizardRecommendation().patternKey).toBe('global-store');
  });

  it('allows selecting different architecture profiles for inspection', () => {
    component.selectPattern('global-store');
    fixture.detectChanges();

    expect(component.currentPattern()?.key).toBe('global-store');
    expect(component.currentPattern()?.bundleWeight).toContain('15-20 kB');
  });
});
