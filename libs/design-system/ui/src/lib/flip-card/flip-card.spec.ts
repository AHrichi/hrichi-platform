import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { FlipCard } from './flip-card';

@Component({
  imports: [FlipCard],
  template: `
    <ah-flip-card [flipped]="isFlipped">
      <div flip-front>
        Front Text
        <a href="https://example.com" class="test-link" target="_blank">Test Link</a>
        <button type="button" class="test-btn">Test Button</button>
      </div>
      <div flip-back>Back Text</div>
    </ah-flip-card>
  `,
})
class Host {
  isFlipped = false;
}

describe('FlipCard', () => {
  it('toggles flipped class on click and keyboard events', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const hostElem = fixture.nativeElement.querySelector('ah-flip-card');
    expect(hostElem.className).not.toContain('ah-flip-card--flipped');

    hostElem.click();
    await fixture.whenStable();

    expect(hostElem.className).toContain('ah-flip-card--flipped');
  });

  it('does NOT flip the card when an anchor link or button inside the card is clicked', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const hostElem = fixture.nativeElement.querySelector('ah-flip-card');
    const linkElem = fixture.nativeElement.querySelector('.test-link');
    const btnElem = fixture.nativeElement.querySelector('.test-btn');

    expect(hostElem.className).not.toContain('ah-flip-card--flipped');

    // Click on anchor link inside card
    linkElem.click();
    await fixture.whenStable();
    expect(hostElem.className).not.toContain('ah-flip-card--flipped');

    // Click on button inside card
    btnElem.click();
    await fixture.whenStable();
    expect(hostElem.className).not.toContain('ah-flip-card--flipped');
  });
});
