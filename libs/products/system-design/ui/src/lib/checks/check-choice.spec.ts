import { TestBed } from '@angular/core/testing';
import type { CheckAnswerEvent, ChoiceCheck } from './check-types';
import { SdCheckChoice } from './check-choice';

const sampleChoice: ChoiceCheck = {
  id: 'q1',
  kind: 'choice',
  prompt: 'Where does a **hit** stop?',
  options: ['Cache', 'Database'],
  answer: 0,
  explain: 'A hit is served from `memory`.',
  step: 'hit',
};

describe('SdCheckChoice', () => {
  it('marks a correct radio selection, shows explanation and emits reviewStep', async () => {
    const fixture = TestBed.createComponent(SdCheckChoice);
    fixture.componentRef.setInput('check', sampleChoice);

    const events: CheckAnswerEvent[] = [];
    const steps: string[] = [];
    fixture.componentInstance.answered.subscribe((e) => events.push(e));
    fixture.componentInstance.reviewStep.subscribe((s) => steps.push(s));
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const submitBtn = host.querySelector('.submit-btn') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);

    const radios = host.querySelectorAll(
      'input[type="radio"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(radios.length).toBe(2);
    radios[0].click();
    radios[0].dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(submitBtn.disabled).toBe(false);
    submitBtn.click();
    await fixture.whenStable();

    expect(events).toEqual([
      {
        checkId: 'q1',
        response: 0,
        correct: true,
        expected: 'Cache',
      },
    ]);
    expect(host.querySelector('.feedback-verdict')?.textContent).toContain(
      '✓ Correct',
    );
    expect(host.querySelector('.feedback-explain code')?.textContent).toBe(
      'memory',
    );

    const reviewBtn = host.querySelector(
      '.review-step-btn',
    ) as HTMLButtonElement;
    reviewBtn.click();
    expect(steps).toEqual(['hit']);
  });

  it('shows expected answer when the wrong option is submitted', async () => {
    const fixture = TestBed.createComponent(SdCheckChoice);
    fixture.componentRef.setInput('check', sampleChoice);
    fixture.componentRef.setInput('initialChoice', 1);
    fixture.componentRef.setInput('initialSubmitted', true);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.feedback-verdict')?.textContent).toContain(
      '✗ Not quite',
    );
    expect(host.querySelector('.feedback-expected')?.textContent).toContain(
      'Cache',
    );
  });
});
