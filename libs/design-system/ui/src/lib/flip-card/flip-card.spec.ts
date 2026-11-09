import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { FlipCard } from './flip-card';

@Component({
  imports: [FlipCard],
  template: `
    <ah-flip-card [(flipped)]="isFlipped" flipLabel="Show answer">
      <div flip-front>
        Front Text
        <a href="https://example.com" class="test-link" target="_blank"
          >Test Link</a
        >
        <button type="button" class="test-btn">Test Button</button>
      </div>
      <div flip-back>
        Back Text <a href="#b" class="back-link">Back link</a>
      </div>
    </ah-flip-card>
  `,
})
class Host {
  isFlipped = false;
}

async function setup() {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el: HTMLElement = fixture.nativeElement;
  return {
    fixture,
    el,
    host: el.querySelector('ah-flip-card') as HTMLElement,
    toggle: el.querySelector('.ah-flip-card-toggle') as HTMLButtonElement,
  };
}

describe('FlipCard', () => {
  it('flips with a real toggle button that reports its state', async () => {
    const { fixture, host, toggle } = await setup();
    expect(host.getAttribute('role')).toBeNull();
    expect(toggle.textContent).toContain('Show answer');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    toggle.click();
    await fixture.whenStable();

    expect(host.className).toContain('ah-flip-card--flipped');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.componentInstance.isFlipped).toBe(true);
  });

  it('makes the hidden face inert', async () => {
    const { fixture, el, toggle } = await setup();
    const front = el.querySelector('.ah-flip-card-front') as HTMLElement;
    const back = el.querySelector('.ah-flip-card-back') as HTMLElement;
    expect(back.hasAttribute('inert')).toBe(true);
    expect(front.hasAttribute('inert')).toBe(false);

    toggle.click();
    await fixture.whenStable();
    expect(back.hasAttribute('inert')).toBe(false);
    expect(front.hasAttribute('inert')).toBe(true);
  });

  it('flips on a click of the card surface, but not of its links or buttons', async () => {
    const { fixture, el, host } = await setup();
    (el.querySelector('.test-link') as HTMLElement).click();
    (el.querySelector('.test-btn') as HTMLElement).click();
    await fixture.whenStable();
    expect(host.className).not.toContain('ah-flip-card--flipped');

    (el.querySelector('.ah-flip-card-front') as HTMLElement).click();
    await fixture.whenStable();
    expect(host.className).toContain('ah-flip-card--flipped');
  });

  it('keeps Space on the toggle from reaching page-level shortcuts', async () => {
    const { el, toggle } = await setup();
    let reached = false;
    el.addEventListener('keydown', () => (reached = true));
    toggle.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    expect(reached).toBe(false);
  });
});
