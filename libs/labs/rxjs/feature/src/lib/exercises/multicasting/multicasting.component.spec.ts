import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MulticastingComponent } from './multicasting.component';

describe('MulticastingComponent', () => {
  let fixture: ComponentFixture<MulticastingComponent>;
  let component: MulticastingComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MulticastingComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MulticastingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('updates behaviorSubjectValue signal reactively on creation and emission', () => {
    expect(component.behaviorSubjectValue()).toBeNull();

    // Create BehaviorSubject with initial value 42
    component.behaviorInitialValue.set(42);
    component.createSubject('behaviorSubject');
    expect(component.behaviorSubjectValue()).toBe(42);

    // Emit value 0
    component.emitValue('behaviorSubject');
    expect(component.behaviorSubjectValue()).toBe(0);

    // Reset clears the signal value
    component.reset('behaviorSubject');
    expect(component.behaviorSubjectValue()).toBeNull();
  });

  it('filters use cases when activeCase is set', () => {
    expect(component.activeCase()).toBe('all');

    component.activeCase.set('cold');
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.card');
    // Only cold observable card should be rendered
    expect(cards.length).toBe(1);
    expect(cards[0].classList.contains('focused-card')).toBe(true);
    expect(cards[0].textContent).toContain('Cold Observable');
  });
});
