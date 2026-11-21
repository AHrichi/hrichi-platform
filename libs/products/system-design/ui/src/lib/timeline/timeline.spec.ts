import { TestBed } from '@angular/core/testing';
import { SdTimeline } from './timeline';

describe('SdTimeline', () => {
  it('renders numbered step dots with labels, marks active step with aria-current and emits stepSelected', async () => {
    const fixture = TestBed.createComponent(SdTimeline);
    fixture.componentRef.setInput('steps', [
      { id: 'slow', label: 'Slow reads', kind: 'problem' },
      { id: 'add-cache', label: 'Add a cache', kind: 'technique' },
      { id: 'recap', label: 'Recap', kind: 'recap' },
    ]);
    fixture.componentRef.setInput('currentIndex', 1);

    const picked: number[] = [];
    fixture.componentInstance.stepSelected.subscribe((i) => picked.push(i));
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.timeline-count')?.textContent).toContain(
      'Step 2 of 3',
    );

    const buttons = host.querySelectorAll('button.step-btn');
    expect(buttons.length).toBe(3);
    expect(buttons[0].classList.contains('is-past')).toBe(true);
    expect(buttons[1].classList.contains('is-active')).toBe(true);
    expect(buttons[1].getAttribute('aria-current')).toBe('step');
    expect(buttons[2].getAttribute('aria-current')).toBeNull();

    (buttons[2] as HTMLButtonElement).click();
    expect(picked).toEqual([2]);
  });
});
