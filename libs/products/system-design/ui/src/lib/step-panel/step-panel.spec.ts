import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { LessonStep } from '@ah/products/system-design/domain';
import { SdStepPanel } from './step-panel';

@Component({
  selector: 'sd-test-recap-host',
  imports: [SdStepPanel],
  template: `
    <sd-step-panel
      [step]="recapStep"
      [stepIndex]="5"
      [stepCount]="6"
      [nextLessonTitle]="'Load balancers'"
    >
      <button type="button" sdRecapActions class="projected-learn-this">
        Add to my daily reviews
      </button>
    </sd-step-panel>
  `,
})
class TestRecapHost {
  readonly recapStep: LessonStep = {
    id: 'recap',
    label: 'Recap',
    kind: 'recap',
    title: 'What the cache bought',
    body: ['Reads got **fast**; writes got a new duty.'],
    ops: [],
    takeaways: [
      'Hits skip the database',
      'Misses cost a little more',
      'Expire or clear entries',
    ],
  };
}

describe('SdStepPanel', () => {
  it('renders step number, kind badge, polite live title, inline body, callouts, changes and nav events', async () => {
    const step: LessonStep = {
      id: 'add-cache',
      label: 'Add a cache',
      kind: 'technique',
      title: 'Keep hot rows in memory',
      body: ['A `cache` answers repeat **reads**.'],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Stale reads are a _choice_.',
        },
      ],
      changes: [
        { type: 'added', text: 'Cache node' },
        { type: 'changed', text: 'Read path' },
        { type: 'removed', text: 'Direct SQL on hit' },
      ],
      ops: [],
    };

    const fixture = TestBed.createComponent(SdStepPanel);
    fixture.componentRef.setInput('step', step);
    fixture.componentRef.setInput('stepIndex', 1);
    fixture.componentRef.setInput('stepCount', 6);
    fixture.componentRef.setInput('nextStepLabel', 'Hit');

    let backed = 0;
    let nexted = 0;
    fixture.componentInstance.back.subscribe(() => backed++);
    fixture.componentInstance.next.subscribe(() => nexted++);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.step-counter')?.textContent).toContain(
      'STEP 2 / 6',
    );
    expect(host.querySelector('.kind-badge')?.textContent).toContain(
      'Technique',
    );

    const title = host.querySelector('.step-title');
    expect(title?.getAttribute('aria-live')).toBe('polite');
    expect(title?.textContent).toBe('Keep hot rows in memory');

    expect(host.querySelector('.step-body code')?.textContent).toBe('cache');
    expect(host.querySelector('.step-body strong')?.textContent).toBe('reads');

    const callout = host.querySelector('[data-callout-kind="watch-out"]');
    expect(callout?.textContent).toContain('Watch out');
    expect(callout?.textContent).toContain('Stale reads are a choice.');

    const changes = host.querySelectorAll('.change-item');
    expect(changes.length).toBe(3);
    expect(changes[0].textContent).toContain('+');
    expect(changes[1].textContent).toContain('~');
    expect(changes[2].textContent).toContain('−');

    const backBtn = host.querySelector('.back-btn') as HTMLButtonElement;
    const nextBtn = host.querySelector('.next-btn') as HTMLButtonElement;
    expect(nextBtn.textContent).toContain('Next: Hit →');

    backBtn.click();
    nextBtn.click();
    expect(backed).toBe(1);
    expect(nexted).toBe(1);
  });

  it('projects [sdRecapActions], renders takeaways and emits practice/next-lesson events on recap', async () => {
    const fixture = TestBed.createComponent(TestRecapHost);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.takeaway-item').length).toBe(3);
    expect(host.querySelector('.projected-learn-this')?.textContent).toContain(
      'Add to my daily reviews',
    );
    expect(host.querySelector('.coming-up-link')?.textContent).toContain(
      'Load balancers →',
    );
    expect(host.querySelector('.practice-btn')?.textContent).toContain(
      'Practice this lesson →',
    );
  });
});
