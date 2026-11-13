import { TestBed } from '@angular/core/testing';
import type { StreakSummary } from '@ah/learning/domain';
import { SetCompletion } from './set-completion';

const streak: StreakSummary = {
  current: 7,
  longest: 7,
  freezesBanked: 1,
  frozen: [],
  repaired: [],
  repairOffer: { missed: '2026-11-11', streakBefore: 5 },
  todayCounted: true,
  todayFull: true,
  mode: 'daily',
  weeklyTarget: 5,
  thisWeekCount: 5,
};

describe('SetCompletion', () => {
  it('displays completion message, growth, repair offer, and emits actions', () => {
    const fixture = TestBed.createComponent(SetCompletion);
    fixture.componentRef.setInput('hadCards', true);
    fixture.componentRef.setInput('streak', streak);
    fixture.componentRef.setInput('grewTo', [
      { title: 'Opportunity cost', tier: 'leaf' },
    ]);
    fixture.componentRef.setInput('strongCount', 3);
    fixture.componentRef.setInput('xp', { level: 2, into: 10, span: 75 });
    fixture.componentRef.setInput('tomorrow', 5);
    fixture.componentRef.setInput('tomorrowMinutes', 2);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Done for today');
    expect(text).toContain('Opportunity cost');
    expect(text).toContain('Leaf');
    expect(text).toContain('Your 5-day streak ended yesterday');

    let closedCount = 0;
    let bonusCount = 0;
    fixture.componentInstance.closed.subscribe(() => (closedCount += 1));
    fixture.componentInstance.bonusRequested.subscribe(() => (bonusCount += 1));

    const buttons = fixture.nativeElement.querySelectorAll('button');
    (buttons[0] as HTMLButtonElement).click();
    (buttons[1] as HTMLButtonElement).click();
    expect(closedCount).toBe(1);
    expect(bonusCount).toBe(1);
  });
});
