import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SegmentedOption } from '@ah/ui';
import { UseCaseFocusComponent } from './use-case-focus.component';

@Component({
  standalone: true,
  imports: [UseCaseFocusComponent],
  template: `
    <ah-use-case-focus
      [options]="options"
      [(value)]="selected"
      ariaLabel="Test focus control"
    />
  `,
})
class TestHostComponent {
  readonly options: readonly SegmentedOption<string>[] = [
    { value: 'all', label: 'All Cases' },
    { value: 'cold', label: 'Cold Observable' },
    { value: 'hot', label: 'Hot Observable' },
  ];
  readonly selected = signal('all');
}

describe('UseCaseFocusComponent in lab-rxjs', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders all options in the segmented control', () => {
    const segments = fixture.nativeElement.querySelectorAll('.segment');
    expect(segments.length).toBe(3);
    expect(segments[0].textContent.trim()).toBe('All Cases');
    expect(segments[1].textContent.trim()).toBe('Cold Observable');
    expect(segments[2].textContent.trim()).toBe('Hot Observable');
  });

  it('displays the focused badge when a single use case is selected', () => {
    host.selected.set('cold');
    fixture.detectChanges();

    const tag = fixture.nativeElement.querySelector('ah-tag');
    expect(tag).not.toBeNull();
    expect(tag?.textContent).toContain('Focused: Cold Observable');
  });

  it('resets to all when "Show All" button is clicked', () => {
    host.selected.set('hot');
    fixture.detectChanges();

    const showAllBtn = fixture.nativeElement.querySelector(
      '.active-badge-group button',
    );
    expect(showAllBtn).not.toBeNull();

    showAllBtn?.click();
    fixture.detectChanges();

    expect(host.selected()).toBe('all');
  });
});
