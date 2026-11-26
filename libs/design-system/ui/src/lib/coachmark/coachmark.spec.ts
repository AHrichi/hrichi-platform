import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Coachmark, type CoachmarkSide } from './coachmark';

@Component({
  imports: [Coachmark],
  template: `<ah-coachmark
    heading="Your projects"
    body="Each greenhouse is a project."
    progress="Step 2 of 3"
    [step]="step()"
    [total]="3"
    [side]="side()"
    [arrow]="40"
    (next)="events.push('next')"
    (back)="events.push('back')"
    (dismiss)="events.push('dismiss')"
  />`,
})
class Host {
  readonly step = signal(2);
  readonly side = signal<CoachmarkSide>('block-end');
  readonly events: string[] = [];
}

async function setup() {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const card = fixture.nativeElement.querySelector(
    'ah-coachmark',
  ) as HTMLElement;
  const buttons = () =>
    Array.from(card.querySelectorAll('button')).map(
      (b) => b.textContent?.trim() || b.getAttribute('aria-label'),
    );
  return { fixture, host: fixture.componentInstance, card, buttons };
}

describe('Coachmark', () => {
  it('is a non-modal dialog named by its title and progress, described by its body', async () => {
    const { card } = await setup();
    expect(card.getAttribute('role')).toBe('dialog');
    expect(card.getAttribute('aria-modal')).toBe('false');
    expect(card.tabIndex).toBe(-1);
    const [title, progress] = (
      card.getAttribute('aria-labelledby') ?? ''
    ).split(' ');
    expect(card.querySelector(`#${title}`)?.textContent).toBe('Your projects');
    expect(card.querySelector(`#${progress}`)?.textContent).toBe('Step 2 of 3');
    const body = card.getAttribute('aria-describedby') ?? '';
    expect(card.querySelector(`#${body}`)?.textContent).toContain('a project');
  });

  it('offers Back after the first step, and Finish on the last', async () => {
    const { fixture, host, buttons } = await setup();
    expect(buttons()).toEqual(['Close', 'Back', 'Next']);
    host.step.set(1);
    await fixture.whenStable();
    expect(buttons()).toEqual(['Close', 'Next']);
    host.step.set(3);
    await fixture.whenStable();
    expect(buttons()).toEqual(['Close', 'Back', 'Finish']);
  });

  it('says what was pressed, and closes on Escape', async () => {
    const { host, card } = await setup();
    const [close, back, next] = Array.from(card.querySelectorAll('button'));
    next.click();
    back.click();
    close.click();
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(host.events).toEqual(['next', 'back', 'dismiss', 'dismiss']);
  });

  it('puts its pointer on the side facing the target', async () => {
    const { fixture, host, card } = await setup();
    expect(card.dataset['side']).toBe('block-end');
    expect(card.style.getPropertyValue('--ah-arrow')).toBe('40px');
    host.side.set('center');
    await fixture.whenStable();
    expect(card.dataset['side']).toBe('center');
  });
});
