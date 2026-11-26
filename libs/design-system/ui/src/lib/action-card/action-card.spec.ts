import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActionCard, type ActionCardStatus } from './action-card';

@Component({
  imports: [ActionCard],
  template: `<ah-action-card
    heading="Delete the project “North house”"
    [lines]="['Its 4 saved results go with it.']"
    tone="danger"
    [status]="status()"
    detail="not found"
    (accept)="events.push('apply')"
    (decline)="events.push('cancel')"
  />`,
})
class Host {
  readonly status = signal<ActionCardStatus>('pending');
  readonly events: string[] = [];
}

async function setup() {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const card = fixture.nativeElement.querySelector(
    'ah-action-card',
  ) as HTMLElement;
  return { fixture, host: fixture.componentInstance, card };
}

describe('ActionCard', () => {
  it('is a group named by what it will do, marked dangerous', async () => {
    const { card } = await setup();
    expect(card.getAttribute('role')).toBe('group');
    const id = card.getAttribute('aria-labelledby') ?? '';
    expect(card.querySelector(`#${id}`)?.textContent).toContain('North house');
    expect(card.dataset['tone']).toBe('danger');
    expect(card.querySelector('li')?.textContent).toContain('4 saved results');
  });

  it('asks Apply or Cancel, then shows the outcome instead', async () => {
    const { fixture, host, card } = await setup();
    const [apply, cancel] = Array.from(card.querySelectorAll('button'));
    apply.click();
    cancel.click();
    expect(host.events).toEqual(['apply', 'cancel']);
    host.status.set('failed');
    await fixture.whenStable();
    expect(card.querySelectorAll('button')).toHaveLength(0);
    expect(card.querySelector('[aria-live]')?.textContent).toContain(
      'Didn’t work: not found',
    );
  });
});
