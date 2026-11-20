import { TestBed } from '@angular/core/testing';
import type { CheckAnswerEvent, NumericCheck } from './check-types';
import { SdCheckNumeric } from './check-numeric';

const sampleNumeric: NumericCheck = {
  id: 'q2',
  kind: 'numeric',
  prompt: 'Hit ratio 80%, 1,000 reads: how many reach the DB?',
  unit: 'reads',
  answer: 200,
  tolerance: 0.25,
  explain: '20% of 1,000 reads miss the cache.',
  step: 'miss',
};

describe('SdCheckNumeric', () => {
  it('accepts an answer within relative tolerance and shows within ±25% feedback', async () => {
    const fixture = TestBed.createComponent(SdCheckNumeric);
    fixture.componentRef.setInput('check', sampleNumeric);

    const events: CheckAnswerEvent[] = [];
    fixture.componentInstance.answered.subscribe((e) => events.push(e));
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector('input.numeric-input') as HTMLInputElement;
    const submitBtn = host.querySelector('.submit-btn') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
    expect(host.querySelector('.unit-badge')?.textContent).toBe('reads');

    input.value = '220';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(submitBtn.disabled).toBe(false);
    submitBtn.click();
    await fixture.whenStable();

    expect(events).toEqual([
      {
        checkId: 'q2',
        response: 220,
        correct: true,
        expected: '200 reads',
      },
    ]);
    expect(host.querySelector('.feedback-verdict')?.textContent).toContain(
      '✓ Correct',
    );
    expect(host.querySelector('.feedback-expected')?.textContent).toContain(
      'within ±25%',
    );
  });

  it('marks an out-of-range value as wrong', async () => {
    const fixture = TestBed.createComponent(SdCheckNumeric);
    fixture.componentRef.setInput('check', sampleNumeric);
    fixture.componentRef.setInput('initialValue', '500');
    fixture.componentRef.setInput('initialSubmitted', true);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.feedback-verdict')?.textContent).toContain(
      '✗ Outside range',
    );
    expect(host.querySelector('.feedback-expected')?.textContent).toContain(
      '200 reads',
    );
  });
});
