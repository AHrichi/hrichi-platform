import { TestBed } from '@angular/core/testing';
import { ProgressDots } from './progress-dots';

describe('ProgressDots', () => {
  it('renders filled dots and accessible progressbar bounds', () => {
    const fixture = TestBed.createComponent(ProgressDots);
    fixture.componentRef.setInput('total', 7);
    fixture.componentRef.setInput('done', 3);
    fixture.detectChanges();

    const bar = fixture.nativeElement.querySelector(
      '[role="progressbar"]',
    ) as HTMLElement;
    expect(bar.getAttribute('aria-valuenow')).toBe('3');
    expect(bar.getAttribute('aria-valuemax')).toBe('7');
    expect(fixture.nativeElement.querySelectorAll('.dot')).toHaveLength(7);
    expect(fixture.nativeElement.querySelectorAll('.dot.is-done')).toHaveLength(
      3,
    );
  });
});
