import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwipeCard, type SwipeDirection } from './swipe-card';

@Component({
  imports: [SwipeCard],
  template: `
    <lrn-swipe-card
      [allowUp]="allowUp()"
      [disabled]="disabled()"
      [swipeDisabled]="swipeDisabled()"
      (swiped)="events.push($event)"
    >
      <p>Prompt card</p>
      <button type="button">Inner action</button>
    </lrn-swipe-card>
  `,
})
class HostComponent {
  allowUp = signal(true);
  disabled = signal(false);
  swipeDisabled = signal(false);
  events: SwipeDirection[] = [];
}

describe('SwipeCard', () => {
  it('emits keyboard swipes and respects disabled and allowUp', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const hostEl = fixture.nativeElement.querySelector(
      'lrn-swipe-card',
    ) as HTMLElement;

    hostEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    hostEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    hostEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await Promise.resolve();
    expect(fixture.componentInstance.events).toEqual(['right', 'left', 'up']);

    fixture.componentInstance.allowUp.set(false);
    fixture.detectChanges();
    hostEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await Promise.resolve();
    expect(fixture.componentInstance.events).toHaveLength(3);

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(hostEl.getAttribute('aria-disabled')).toBe('true');
    hostEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    await Promise.resolve();
    expect(fixture.componentInstance.events).toHaveLength(3);

    fixture.componentInstance.disabled.set(false);
    fixture.componentInstance.swipeDisabled.set(true);
    fixture.detectChanges();
    expect(hostEl.getAttribute('aria-disabled')).toBeNull();
    hostEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await Promise.resolve();
    expect(fixture.componentInstance.events).toHaveLength(3);
  });
});
