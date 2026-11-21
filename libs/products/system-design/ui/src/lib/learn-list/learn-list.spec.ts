import { TestBed } from '@angular/core/testing';
import { SdLearnList } from './learn-list';

describe('SdLearnList', () => {
  it('renders checklist items and ticks indices present in learned set', async () => {
    const fixture = TestBed.createComponent(SdLearnList);
    fixture.componentRef.setInput('items', [
      'Why a **cache** helps reads',
      'What a miss costs',
      'When data goes stale',
    ]);
    fixture.componentRef.setInput('learned', new Set([0, 2]));
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.learn-count')?.textContent).toBe('2 / 3');

    const rows = host.querySelectorAll('.learn-item');
    expect(rows.length).toBe(3);
    expect(rows[0].classList.contains('is-learned')).toBe(true);
    expect(rows[1].classList.contains('is-learned')).toBe(false);
    expect(rows[2].classList.contains('is-learned')).toBe(true);
    expect(rows[0].querySelector('strong')?.textContent).toBe('cache');
  });
});
