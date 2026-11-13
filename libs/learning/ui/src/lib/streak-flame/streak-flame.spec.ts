import { TestBed } from '@angular/core/testing';
import type { StreakSummary } from '@ah/learning/domain';
import { StreakFlame } from './streak-flame';

const baseDaily: StreakSummary = {
  current: 12,
  longest: 20,
  freezesBanked: 1,
  frozen: [],
  repaired: [],
  repairOffer: null,
  todayCounted: true,
  todayFull: false,
  mode: 'daily',
  weeklyTarget: 5,
  thisWeekCount: 4,
};

describe('StreakFlame', () => {
  it('renders full daily streak with banked freezes', () => {
    const fixture = TestBed.createComponent(StreakFlame);
    fixture.componentRef.setInput('streak', baseDaily);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('12 days');
    expect(text).toContain('1 freeze banked');
  });

  it('renders compact weekly streak progress', () => {
    const fixture = TestBed.createComponent(StreakFlame);
    fixture.componentRef.setInput('streak', {
      ...baseDaily,
      current: 3,
      mode: 'weekly',
      weeklyTarget: 5,
      thisWeekCount: 2,
    });
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector(
      '.flame-compact',
    ) as HTMLElement;
    expect(el.textContent?.trim()).toContain('3w (2/5)');
    expect(el.getAttribute('aria-label')).toContain(
      '3 week streak, 2 of 5 days this week',
    );
  });
});
