import { TestBed } from '@angular/core/testing';
import type { CheckAnswerEvent, OrderCheck } from './check-types';
import { SdCheckOrder } from './check-order';

const sampleOrder: OrderCheck = {
  id: 'q3',
  kind: 'order',
  prompt: 'Order a cache miss',
  items: ['Ask cache', 'Ask database', 'Fill cache'],
  explain: 'Cache-aside pattern.',
  step: 'miss',
};

describe('SdCheckOrder', () => {
  it('reorders items with up/down buttons and marks the final order via markCheck()', async () => {
    const fixture = TestBed.createComponent(SdCheckOrder);
    fixture.componentRef.setInput('check', sampleOrder);
    // Start with items 0 and 1 swapped
    fixture.componentRef.setInput('initialOrder', [
      'Ask database',
      'Ask cache',
      'Fill cache',
    ]);

    const events: CheckAnswerEvent[] = [];
    fixture.componentInstance.answered.subscribe((e) => events.push(e));
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const rowsBefore = Array.from(host.querySelectorAll('.order-item')).map(
      (el) => el.getAttribute('data-item'),
    );
    expect(rowsBefore).toEqual(['Ask database', 'Ask cache', 'Fill cache']);

    // Move 'Ask cache' (index 1) up to index 0
    const moveUpBtns = host.querySelectorAll(
      'button.move-up',
    ) as NodeListOf<HTMLButtonElement>;
    expect(moveUpBtns[0].disabled).toBe(true);
    expect(moveUpBtns[1].disabled).toBe(false);
    moveUpBtns[1].click();
    await fixture.whenStable();

    const rowsAfter = Array.from(host.querySelectorAll('.order-item')).map(
      (el) => el.getAttribute('data-item'),
    );
    expect(rowsAfter).toEqual(['Ask cache', 'Ask database', 'Fill cache']);

    const submitBtn = host.querySelector('.submit-btn') as HTMLButtonElement;
    submitBtn.click();
    await fixture.whenStable();

    expect(events).toEqual([
      {
        checkId: 'q3',
        response: ['Ask cache', 'Ask database', 'Fill cache'],
        correct: true,
        expected: 'Ask cache → Ask database → Fill cache',
      },
    ]);
    expect(host.querySelector('.feedback-verdict')?.textContent).toContain(
      '✓ Correct order',
    );
  });

  it('shows the expected sequence when submitted in the wrong order', async () => {
    const fixture = TestBed.createComponent(SdCheckOrder);
    fixture.componentRef.setInput('check', sampleOrder);
    fixture.componentRef.setInput('initialSubmitted', true);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.feedback-verdict')?.textContent).toContain(
      '✗ Wrong order',
    );
    expect(host.querySelector('.feedback-expected')?.textContent).toContain(
      'Ask cache → Ask database → Fill cache',
    );
  });
});
